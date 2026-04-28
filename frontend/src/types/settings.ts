/** Settings domain types — mirrors backend models/models.py GeneralSettings */

export interface Settings {
  app_name: string;
  app_email: string;
  app_logo: string;
  // Branding
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  // AI
  ai_model: string;
  ai_provider: string;
  // WhatsApp (Meta Cloud API)
  whatsapp_phone_id: string;
  whatsapp_account_id: string;
  whatsapp_access_token: string;
  whatsapp_webhook_token: string;
  // Email (IMAP/SMTP)
  email_imap_host: string;
  email_imap_port: string;
  email_smtp_host: string;
  email_smtp_port: string;
  email_address: string;
  email_password: string;
  // SMS (Twilio)
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
}

export type SettingsUpdate = Partial<Settings>;
