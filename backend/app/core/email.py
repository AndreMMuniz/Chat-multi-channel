import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from app.models.models import GeneralSettings


def _get_smtp_settings(db: Session):
    settings = db.query(GeneralSettings).first()
    if not settings:
        return None
    if not all([settings.email_smtp_host, settings.email_smtp_port, settings.email_address, settings.email_password]):
        return None
    return settings


def send_approval_email(to_email: str, full_name: str, db: Session) -> bool:
    settings = _get_smtp_settings(db)
    if not settings:
        return False

    app_name = settings.app_name or "Omnichat"
    app_url = os.getenv("FRONTEND_URL", "")

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1e293b;">
      <div style="margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #7C4DFF; border-radius: 12px;">
          <span style="color: white; font-size: 24px;">✓</span>
        </div>
      </div>
      <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Your account has been approved!</h1>
      <p style="font-size: 15px; color: #64748b; margin: 0 0 24px;">Hi {full_name}, your access to <strong>{app_name}</strong> has been approved by an administrator.</p>
      {'<a href="' + app_url + '/login" style="display: inline-block; padding: 12px 24px; background: #7C4DFF; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Sign in now</a>' if app_url else '<p style="font-size: 14px; color: #64748b;">You can now sign in with your email and password.</p>'}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">{app_name} — this is an automated message, please do not reply.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your {app_name} account has been approved"
    msg["From"] = settings.email_address
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.email_smtp_host, int(settings.email_smtp_port)) as server:
            server.starttls()
            server.login(settings.email_address, settings.email_password)
            server.sendmail(settings.email_address, to_email, msg.as_string())
        return True
    except Exception:
        return False
