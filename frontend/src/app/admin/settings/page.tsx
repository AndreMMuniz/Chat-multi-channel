"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Settings {
  app_name: string;
  app_email: string;
  app_logo: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  ai_model: string;
  ai_provider: string;
  // WhatsApp
  whatsapp_phone_id: string;
  whatsapp_account_id: string;
  whatsapp_access_token: string;
  whatsapp_webhook_token: string;
  // Email
  email_imap_host: string;
  email_imap_port: string;
  email_smtp_host: string;
  email_smtp_port: string;
  email_address: string;
  email_password: string;
  // SMS
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
}

type TabId = "general" | "visual" | "ai" | "api";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "general",  label: "General",          icon: "tune"       },
  { id: "visual",   label: "Visual Identity",   icon: "palette"    },
  { id: "ai",       label: "AI Configuration",  icon: "smart_toy"  },
  { id: "api",      label: "API Settings",      icon: "api"        },
];

// ─── Small reusable pieces ────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#7C4DFF] focus:ring-4 focus:ring-[#7C4DFF]/10 transition-all outline-none text-slate-900 text-sm";

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={inputCls + " pr-11"} />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        <span className="material-symbols-outlined text-[20px]">{show ? "visibility_off" : "visibility"}</span>
      </button>
    </div>
  );
}

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E9ECEF] bg-slate-50/50 flex items-center gap-3">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h2>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ApiGroup({
  icon, label, color, configured, children,
}: {
  icon: string; label: string; color: string; configured: boolean; children: React.ReactNode;
}) {
  return (
    <div className="border border-[#E9ECEF] rounded-2xl overflow-hidden">
      <div className={`px-5 py-3 flex items-center gap-3 ${color}`}>
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <span className="font-semibold text-sm">{label}</span>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${configured ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch("/admin/settings")
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(`${r.status}: ${body.detail || r.statusText}`);
        }
        return r.json();
      })
      .then(data => setSettings({
        app_name: "", app_email: "", app_logo: "",
        primary_color: "#0F172A", secondary_color: "#3B82F6", accent_color: "#10B981",
        ai_model: "gpt-4o-mini", ai_provider: "openrouter",
        whatsapp_phone_id: "", whatsapp_account_id: "", whatsapp_access_token: "", whatsapp_webhook_token: "",
        email_imap_host: "", email_imap_port: "993", email_smtp_host: "", email_smtp_port: "587",
        email_address: "", email_password: "",
        twilio_account_sid: "", twilio_auth_token: "", twilio_phone_number: "",
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ""])),
      }))
      .catch((err: Error) => setError(err.message || "Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setSettings(s => s ? { ...s, [key]: e.target.value } : null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true); setError(""); setSuccess(false);
    try {
      const res = await apiFetch("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          ...settings,
          email_imap_port: settings.email_imap_port ? Number(settings.email_imap_port) : null,
          email_smtp_port: settings.email_smtp_port ? Number(settings.email_smtp_port) : null,
        }),
      });
      if (res.ok) { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
      else { const d = await res.json(); setError(d.detail || "Failed to save."); }
    } catch { setError("Connection error."); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#7C4DFF] animate-spin">progress_activity</span>
          <p className="text-slate-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-4xl text-red-400">error</span>
          <p className="text-slate-700 font-medium">Failed to load settings</p>
          <p className="text-sm text-slate-500">{error || "Could not connect to the backend."}</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-5 py-2 rounded-xl bg-[#7C4DFF] text-white text-sm font-medium hover:bg-[#632ce5] transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const s = settings;
  const whatsappConfigured = !!(s.whatsapp_phone_id && s.whatsapp_access_token);
  const emailConfigured    = !!(s.email_address && s.email_password);
  const smsConfigured      = !!(s.twilio_account_sid && s.twilio_auth_token);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center px-6 border-b border-[#E9ECEF] bg-white shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900">Platform Configuration</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Tab Navigation ─────────────────────────────────────────── */}
        <nav className="w-56 bg-white border-r border-[#E9ECEF] flex flex-col py-4 shrink-0 gap-1 px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
                activeTab === tab.id
                  ? "bg-[#7C4DFF]/10 text-[#7C4DFF] font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Content Area ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSave}>
            <div className="max-w-3xl mx-auto p-6 space-y-6">

              {/* Alerts */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                  <span className="material-symbols-outlined">error</span>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3">
                  <span className="material-symbols-outlined">check_circle</span>
                  <p className="text-sm font-medium">Settings saved successfully!</p>
                </div>
              )}

              {/* ── General Tab ───────────────────────────────────────────── */}
              {activeTab === "general" && (
                <SectionCard title="General Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Application Name">
                      <TextInput value={s.app_name} onChange={set("app_name")} placeholder="Omnichat" />
                    </Field>
                    <Field label="Support Email">
                      <TextInput type="email" value={s.app_email} onChange={set("app_email")} placeholder="support@company.com" />
                    </Field>
                  </div>
                </SectionCard>
              )}

              {/* ── Visual Identity Tab ───────────────────────────────────── */}
              {activeTab === "visual" && (
                <SectionCard title="Visual Identity">
                  <div className="space-y-8">
                    {/* Logo */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                        {s.app_logo ? (
                          <img src={s.app_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-3xl">image</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <Field label="Logo URL" hint="Recommended: 256×256px PNG or SVG">
                          <TextInput value={s.app_logo} onChange={set("app_logo")} placeholder="https://example.com/logo.png" />
                        </Field>
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(["primary_color", "secondary_color", "accent_color"] as const).map(key => (
                        <Field key={key} label={key.replace("_color", "").replace("_", " ").replace(/^\w/, c => c.toUpperCase()) + " Color"}>
                          <div className="flex gap-2">
                            <input type="color" value={s[key]} onChange={set(key)}
                              className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 cursor-pointer" />
                            <TextInput value={s[key]} onChange={set(key)} className={inputCls + " font-mono"} />
                          </div>
                        </Field>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* ── AI Configuration Tab ──────────────────────────────────── */}
              {activeTab === "ai" && (
                <SectionCard title="AI Configuration">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Model Provider">
                        <select value={s.ai_provider} onChange={set("ai_provider")} className={inputCls + " cursor-pointer"}>
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="google">Google Gemini</option>
                          <option value="openrouter">OpenRouter (Recommended)</option>
                          <option value="groq">Groq</option>
                        </select>
                      </Field>
                      <Field label="Global AI Model">
                        <select value={s.ai_model} onChange={set("ai_model")} className={inputCls + " cursor-pointer"}>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gpt-4o-mini">GPT-4o mini</option>
                          <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                          <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        </select>
                      </Field>
                    </div>
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                      <span className="font-bold text-slate-700">Note:</span> This model will be used by all agents across the platform unless overridden individually.
                    </p>
                  </div>
                </SectionCard>
              )}

              {/* ── API Settings Tab ──────────────────────────────────────── */}
              {activeTab === "api" && (
                <div className="space-y-5">
                  <p className="text-sm text-slate-500">
                    Configure the credentials for each channel. Values are stored securely in the database.
                  </p>

                  {/* WhatsApp */}
                  <ApiGroup icon="chat" label="WhatsApp — Meta Cloud API" color="bg-green-50 text-green-800 border-b border-green-100" configured={whatsappConfigured}>
                    <Field label="Phone Number ID">
                      <TextInput value={s.whatsapp_phone_id} onChange={set("whatsapp_phone_id")} placeholder="123456789012345" />
                    </Field>
                    <Field label="Business Account ID">
                      <TextInput value={s.whatsapp_account_id} onChange={set("whatsapp_account_id")} placeholder="987654321098765" />
                    </Field>
                    <Field label="Access Token" hint="Permanent token from Meta Business Suite">
                      <PasswordInput value={s.whatsapp_access_token} onChange={set("whatsapp_access_token")} placeholder="EAABs..." />
                    </Field>
                    <Field label="Webhook Verify Token" hint="Custom string used to verify the webhook">
                      <PasswordInput value={s.whatsapp_webhook_token} onChange={set("whatsapp_webhook_token")} placeholder="my_secret_token" />
                    </Field>
                  </ApiGroup>

                  {/* Email */}
                  <ApiGroup icon="mail" label="Email — IMAP / SMTP" color="bg-blue-50 text-blue-800 border-b border-blue-100" configured={emailConfigured}>
                    <Field label="IMAP Host">
                      <TextInput value={s.email_imap_host} onChange={set("email_imap_host")} placeholder="imap.gmail.com" />
                    </Field>
                    <Field label="IMAP Port">
                      <TextInput type="number" value={s.email_imap_port} onChange={set("email_imap_port")} placeholder="993" />
                    </Field>
                    <Field label="SMTP Host">
                      <TextInput value={s.email_smtp_host} onChange={set("email_smtp_host")} placeholder="smtp.gmail.com" />
                    </Field>
                    <Field label="SMTP Port">
                      <TextInput type="number" value={s.email_smtp_port} onChange={set("email_smtp_port")} placeholder="587" />
                    </Field>
                    <Field label="Email Address">
                      <TextInput type="email" value={s.email_address} onChange={set("email_address")} placeholder="noreply@company.com" />
                    </Field>
                    <Field label="Password / App Password" hint="For Gmail, use an App Password">
                      <PasswordInput value={s.email_password} onChange={set("email_password")} placeholder="••••••••••••" />
                    </Field>
                  </ApiGroup>

                  {/* SMS */}
                  <ApiGroup icon="sms" label="SMS — Twilio" color="bg-red-50 text-red-800 border-b border-red-100" configured={smsConfigured}>
                    <Field label="Account SID">
                      <TextInput value={s.twilio_account_sid} onChange={set("twilio_account_sid")} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                    </Field>
                    <Field label="Auth Token">
                      <PasswordInput value={s.twilio_auth_token} onChange={set("twilio_auth_token")} placeholder="••••••••••••••••••••••••••••••••" />
                    </Field>
                    <Field label="Twilio Phone Number" hint="E.164 format: +15005550006">
                      <TextInput value={s.twilio_phone_number} onChange={set("twilio_phone_number")} placeholder="+15005550006" />
                    </Field>
                  </ApiGroup>
                </div>
              )}

              {/* ── Save Bar ──────────────────────────────────────────────── */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E9ECEF]">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="h-11 px-6 rounded-xl border border-[#E9ECEF] text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-8 rounded-xl bg-[#7C4DFF] hover:bg-[#632ce5] text-white text-sm font-bold shadow-lg shadow-purple-200 disabled:opacity-60 transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[20px]">save</span>Save Configuration</>
                  )}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
