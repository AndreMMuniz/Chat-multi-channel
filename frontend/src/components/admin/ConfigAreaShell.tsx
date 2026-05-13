"use client";

const CONFIG_ITEMS = [
  { id: "general",       label: "General",         description: "Platform defaults",               icon: "tune" },
  { id: "visual",        label: "Visual Identity",  description: "Logo and color system",           icon: "palette" },
  { id: "channels",      label: "Channels",         description: "Telegram, WhatsApp, Email, SMS",  icon: "hub" },
  { id: "ai",            label: "AI Configuration", description: "Providers and global model",      icon: "smart_toy" },
  { id: "api",           label: "API Settings",     description: "Webhooks and integration details", icon: "api" },
  { id: "quick-replies", label: "Quick Replies",    description: "Manage canned responses",         icon: "quick_phrases" },
];

export default function ConfigAreaShell({
  activeSection,
  onSectionChange,
  children,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 bg-slate-50">
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-[#E9ECEF] bg-white">
        <div className="border-b border-[#E9ECEF] px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Config</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Platform Setup</h2>
          <p className="mt-1 text-sm text-slate-500">Keep system configuration, channels, and branding organized.</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {CONFIG_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  active
                    ? "border-indigo-100 bg-indigo-50"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-indigo-700" : "text-slate-800"}`}>{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-[#E9ECEF] bg-white px-4 py-3 md:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Config</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CONFIG_ITEMS.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
