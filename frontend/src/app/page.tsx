import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "omnicrm.chat | Every customer conversation, in one inbox",
  description:
    "A multi-channel customer support platform for WhatsApp, Telegram, Email, SMS, and web chat with AI suggestions, quick replies, and operational visibility.",
};

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Channels", href: "#channels" },
  { label: "How it works", href: "#how" },
  { label: "FAQ", href: "#faq" },
];

const trustedBy = ["Northwind", "Acumen", "Lumen.io", "Riverstone", "Beacon", "Halcyon"];

const features = [
  {
    icon: "forum",
    title: "One inbox for every channel",
    body: "WhatsApp, Telegram, Email, SMS, and web chat flow into one focused workspace instead of five disconnected tools.",
    tone: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: "auto_awesome",
    title: "AI that drafts, never decides",
    body: "Generate contextual reply suggestions, summaries, and rewrites while keeping agents in control of every send.",
    tone: "bg-sky-100 text-sky-700",
  },
  {
    icon: "quick_phrases",
    title: "Quick replies at speed",
    body: "Use slash shortcuts and shared templates so the team responds consistently without repeating manual work.",
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: "group",
    title: "Role-aware operations",
    body: "Admins, managers, and agents each see the controls they need with auditability built into daily work.",
    tone: "bg-orange-100 text-orange-700",
  },
  {
    icon: "timer",
    title: "SLA-aware routing",
    body: "Highlight risky conversations early and keep response promises visible across the whole operation.",
    tone: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    icon: "monitoring",
    title: "Metrics teams actually use",
    body: "Volume, response times, channel mix, and workload surface in a language operators and leaders can act on.",
    tone: "bg-amber-100 text-amber-700",
  },
];

const channels = [
  { name: "WhatsApp", icon: "chat", tone: "bg-green-50 text-green-600" },
  { name: "Telegram", icon: "send", tone: "bg-sky-50 text-sky-600" },
  { name: "Email", icon: "mail", tone: "bg-orange-50 text-orange-600" },
  { name: "SMS", icon: "sms", tone: "bg-violet-50 text-violet-600" },
  { name: "Web chat", icon: "language", tone: "bg-slate-100 text-slate-600" },
];

const steps = [
  {
    title: "Connect your channels",
    body: "Bring WhatsApp, Telegram, Email, SMS, and web chat into one operational shell without rebuilding your process.",
  },
  {
    title: "Invite your team and define rules",
    body: "Configure queues, roles, SLAs, and tags so the workspace reflects the way your support team already runs.",
  },
  {
    title: "Reply with AI in the wings",
    body: "Use one composer for every channel, with quick replies and AI suggestions available on every conversation.",
  },
];

const faqs = [
  {
    q: "Which channels do you support today?",
    a: "WhatsApp, Telegram, Email, SMS, and a hosted web chat experience are supported in the core product direction shown here.",
  },
  {
    q: "How does AI assist work?",
    a: "AI suggests replies, summaries, and rewrites, but agents remain the final decision-makers before anything is sent.",
  },
  {
    q: "Can teams use quick replies and tags together?",
    a: "Yes. The workspace is designed so quick replies, channel filters, and tag-based organization reinforce each other in one flow.",
  },
  {
    q: "Is omnicrm.chat built for internal support teams?",
    a: "Yes. The landing and the product both position omnicrm.chat as an operational workspace for real internal business teams.",
  },
  {
    q: "Can this evolve into broader CRM and commercial workflows?",
    a: "Yes. The wider product already points toward projects, proposals, tasks, and client management connected to conversations.",
  },
  {
    q: "What should happen after this page?",
    a: "The intended next step is a sales conversation or controlled demo access so buyers can evaluate the real product feeling.",
  },
];

const footerColumns = [
  { title: "Product", items: ["Inbox", "AI assist", "Quick replies", "Analytics", "Projects", "Clients"] },
  { title: "Channels", items: ["WhatsApp", "Telegram", "Email", "SMS", "Web chat"] },
  { title: "Company", items: ["About", "Customers", "Pricing", "Contact"] },
  { title: "Resources", items: ["Docs", "Security", "Status", "Roadmap"] },
];

function MaterialIcon({
  name,
  className,
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ""}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C4DFF] text-white shadow-[0_10px_25px_rgba(124,77,255,0.25)]">
        <MaterialIcon name="support_agent" filled className="text-[22px]" />
      </div>
      <div>
        <div className="text-base font-semibold tracking-[-0.02em] text-slate-900">omnicrm.chat</div>
        <div className="text-xs text-slate-500">Multi-channel customer support</div>
      </div>
    </div>
  );
}

function InboxMock() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#E9ECEF] bg-white shadow-[0_32px_64px_-24px_rgba(67,56,202,0.28),0_12px_24px_-12px_rgba(15,23,42,0.08)]">
      <div className="grid min-h-[520px] grid-cols-[240px_1fr] md:grid-cols-[250px_1fr]">
        <aside className="border-r border-[#E9ECEF] bg-[#fbfcff] p-4">
          <div className="rounded-2xl border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-slate-400">
            Search conversations...
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["All", "WhatsApp", "Telegram", "Email"].map((item, index) => (
              <span
                key={item}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                  index === 0
                    ? "border-indigo-200 bg-indigo-50 text-[#7C4DFF]"
                    : "border-[#E9ECEF] bg-white text-slate-600"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {[
              { name: "Andre", preview: "Sure, I'm here to help with your demands...", active: true, channel: "Telegram" },
              { name: "Maya", preview: "Can we review the contract details today?", active: false, channel: "Email" },
              { name: "Rafael", preview: "Need an update on the proposal timeline.", active: false, channel: "WhatsApp" },
            ].map((item) => (
              <div
                key={item.name}
                className={`rounded-2xl border p-4 ${
                  item.active ? "border-indigo-200 bg-indigo-50" : "border-[#E9ECEF] bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {item.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <span className="text-[11px] text-slate-400">now</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.preview}</p>
                    <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {item.channel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-[#E9ECEF] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Andre</p>
              <div className="mt-1 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                Telegram
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">Open</span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#7C4DFF]">AI on</span>
            </div>
          </div>

          <div className="flex-1 space-y-5 bg-white px-5 py-5">
            <div className="max-w-[280px] rounded-2xl border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
              Hi, I need help changing my current plan.
            </div>
            <div className="ml-auto max-w-[360px] rounded-2xl bg-[#7C4DFF] px-4 py-3 text-sm text-white shadow-sm">
              Of course. I can help with that. What would you like to update first?
            </div>
            <div className="max-w-[320px] rounded-2xl border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
              Billing cycle and a new user seat.
            </div>
            <div className="ml-auto max-w-[380px] rounded-2xl bg-[#7C4DFF] px-4 py-3 text-sm text-white shadow-sm">
              Great. I already have a quick path for plan changes and can prepare the next steps for you.
            </div>
            <div className="max-w-[250px] rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 shadow-sm">
              Tagged as Billing • SLA on track
            </div>
          </div>

          <div className="border-t border-[#E9ECEF] px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {["/plan-change", "/billing-help", "priority:high"].map((item, index) => (
                <span
                  key={item}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                    index === 0
                      ? "border-indigo-200 bg-indigo-50 text-[#7C4DFF]"
                      : "border-[#E9ECEF] bg-white text-slate-600"
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="rounded-2xl border border-[#E9ECEF] bg-slate-50 px-4 py-3 text-sm text-slate-400">
              Type a message or use AI-powered suggestions...
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-[#faf7ff] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7C4DFF]">AI suggestions</p>
                  <p className="mt-1 text-[11px] text-slate-400">Cached • just now</p>
                </div>
                <span className="rounded-full border border-indigo-200 px-3 py-1 text-[11px] font-medium text-[#7C4DFF]">
                  Generate
                </span>
              </div>
              <div className="space-y-3">
                {[
                  ["I can help update your billing cycle and add a new seat right away.", "97%"],
                  ["Let me prepare the plan-change flow and confirm your preferred billing cycle.", "89%"],
                ].map(([text, confidence]) => (
                  <div key={text} className="rounded-2xl border border-indigo-100 bg-white px-4 py-3">
                    <p className="text-sm text-slate-700">{text}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Confidence</span>
                      <span className="font-semibold text-[#7C4DFF]">{confidence}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#E9ECEF] bg-white">
      <div className="border-b border-[#E9ECEF] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Operational dashboard</p>
            <p className="mt-1 text-xs text-slate-500">Volume, SLAs, channel mix, and agent load in one view</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#7C4DFF]">Live data</span>
        </div>
      </div>

      <div className="space-y-6 bg-[#fbfcff] p-5">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["1,284", "Conversations", "up 12%"],
            ["06m", "First response", "on target"],
            ["91%", "SLA compliance", "last 7 days"],
            ["38%", "AI adoption", "team usage"],
          ].map(([value, label, meta]) => (
            <div key={label} className="rounded-3xl border border-[#E9ECEF] bg-white p-5">
              <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">{value}</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{label}</p>
              <p className="mt-1 text-xs text-slate-400">{meta}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#E9ECEF] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Weekly conversation trend</p>
                <p className="mt-1 text-xs text-slate-500">All channels combined</p>
              </div>
              <span className="text-xs font-medium text-emerald-600">+18% this week</span>
            </div>
            <div className="mt-6 flex h-[220px] items-end gap-3">
              {[42, 64, 58, 87, 72, 96, 78].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                  <div
                    className={`w-full rounded-t-2xl ${index === 5 ? "bg-[#7C4DFF]" : "bg-indigo-100"}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-slate-400">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E9ECEF] bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Channel distribution</p>
            <p className="mt-1 text-xs text-slate-500">Current operational mix</p>
            <div className="mt-6 flex items-center justify-center">
              <div className="relative h-44 w-44 rounded-full bg-[conic-gradient(#25D366_0_34%,#0088CC_34%_58%,#F97316_58%_79%,#8B5CF6_79%_91%,#64748B_91%_100%)]">
                <div className="absolute inset-8 rounded-full bg-white" />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                ["WhatsApp", "34%", "bg-green-100"],
                ["Telegram", "24%", "bg-sky-100"],
                ["Email", "21%", "bg-orange-100"],
                ["SMS", "12%", "bg-violet-100"],
                ["Web chat", "9%", "bg-slate-200"],
              ].map(([label, share, swatch]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${swatch}`} />
                    <span className="text-slate-700">{label}</span>
                  </div>
                  <span className="font-medium text-slate-900">{share}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksVisual() {
  return (
    <div className="rounded-[20px] border border-[#E9ECEF] bg-white p-5 shadow-sm">
      <div className="rounded-3xl border border-[#E9ECEF] bg-[#fbfcff] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Reply workflow</p>
            <p className="mt-1 text-xs text-slate-500">One shell, multiple operational layers</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#7C4DFF]">AI ready</span>
        </div>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-[#E9ECEF] bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Connected channels</p>
              <span className="text-xs text-slate-400">5 active</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {channels.map((channel) => (
                <span key={channel.name} className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${channel.tone}`}>
                  {channel.name}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E9ECEF] bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Queues and SLAs</p>
              <span className="text-xs text-emerald-600">Healthy</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Billing", "06 min first response", "82 open"],
                ["Support", "04 min first response", "131 open"],
                ["Commercial", "10 min first response", "37 open"],
              ].map(([name, sla, count]) => (
                <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{sla}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-[#faf7ff] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7C4DFF]">Draft + quick reply</p>
            <p className="mt-2 text-sm text-slate-700">
              “I can help with your plan update right away. I&apos;ll guide you through billing and seats in one flow.”
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["/plan-change", "/renewal", "tag:billing"].map((item) => (
                <span key={item} className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-medium text-[#7C4DFF]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-white text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-[#E9ECEF] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Wordmark />

          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#7C4DFF] px-4 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(124,77,255,0.2)] transition hover:bg-[#632ce5]"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </nav>

      <section className="overflow-hidden py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C4DFF] shadow-[0_0_0_4px_rgba(124,77,255,0.18)]" />
              Multi-channel customer support
            </span>

            <h1 className="mt-6 max-w-[12ch] text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-slate-900 sm:text-6xl">
              Every customer conversation,
              <span className="block text-[#7C4DFF]">in one calm inbox.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              WhatsApp, Telegram, Email, SMS, and web chat handled in one workspace, with AI suggestions, quick replies,
              tags, SLAs, and operational clarity built into the product shell.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7C4DFF] px-6 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(124,77,255,0.2)] transition hover:bg-[#632ce5]"
              >
                Talk to sales
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#E9ECEF] bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                <MaterialIcon name="play_arrow" filled className="text-[18px]" />
                See a live demo
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <MaterialIcon name="check_circle" filled className="text-[18px] text-emerald-600" />
                No credit card needed
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="inline-flex items-center gap-2">
                <MaterialIcon name="check_circle" filled className="text-[18px] text-emerald-600" />
                Product-aligned demo experience
              </span>
            </div>
          </div>

          <InboxMock />
        </div>

        <div className="mx-auto mt-16 max-w-7xl px-6 lg:px-10">
          <div className="border-t border-[#E9ECEF] pt-8">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Trusted by support teams at
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {trustedBy.map((brand) => (
                <span key={brand} className="inline-flex items-center gap-2 text-lg font-semibold tracking-[-0.03em] text-slate-500/80">
                  <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded bg-slate-500 text-[11px] font-bold text-white">
                    {brand[0]}
                  </span>
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7C4DFF]">Why teams switch to omnicrm.chat</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl">
              A workspace built around your customer, not your tabs.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The handoff design leaned into a minimal, flat product language. This landing now follows that same rule:
              clear structure, product-led visuals, and a message rooted in the actual operator workflow.
            </p>
          </div>

          <div className="mt-14 overflow-hidden rounded-[24px] border border-[#E9ECEF] bg-[#E9ECEF]">
            <div className="grid gap-px md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="bg-white p-8">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${feature.tone}`}>
                    <MaterialIcon name={feature.icon} filled className="text-[22px]" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7C4DFF]">See it in action</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl">
              A workspace your team will actually enjoy opening.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The original landing prototype asked for a large product visual, so this section keeps that emphasis with
              a dashboard-style surface rooted in the same design system as the app.
            </p>
          </div>

          <div className="mt-14 rounded-[24px] border border-[#E9ECEF] bg-white p-4 shadow-[0_24px_48px_-24px_rgba(67,56,202,0.18),0_8px_16px_-8px_rgba(15,23,42,0.04)]">
            <DashboardMock />
          </div>
        </div>
      </section>

      <section id="channels" className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7C4DFF]">Channels</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl">
              Meet your customers where they already are.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              One shell for the channels that matter most to support and commercial operations, without pushing users
              back into disconnected provider-specific tools.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {channels.map((channel) => (
              <article
                key={channel.name}
                className="rounded-[24px] border border-[#E9ECEF] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${channel.tone}`}>
                  <MaterialIcon name={channel.icon} filled className="text-[20px]" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{channel.name}</h3>
                <p className="mt-1 text-xs text-slate-500">Native integration</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7C4DFF]">How it works</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl">
              From scattered to centralized in an afternoon.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The design brief asked for a simple, readable step-by-step story. This version keeps that structure and
              pairs it with one composite visual instead of a noisy carousel.
            </p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <article key={step.title} className={`rounded-[24px] border p-6 ${index === 0 ? "border-indigo-200 bg-white shadow-sm" : "border-transparent bg-transparent"}`}>
                  <div className="flex gap-5">
                    <div
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0 ? "bg-[#7C4DFF] text-white" : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.01em] text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{step.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <HowItWorksVisual />
          </div>
        </div>
      </section>

      <section id="faq" className="py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7C4DFF]">FAQ</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl">
              Questions you might be thinking right now.
            </h2>
          </div>

          <div className="mt-12 border-t border-[#E9ECEF]">
            {faqs.map((item) => (
              <details key={item.q} className="group border-b border-[#E9ECEF]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-left text-lg font-semibold tracking-[-0.01em] text-slate-900">
                  <span>{item.q}</span>
                  <MaterialIcon name="add" className="text-[22px] text-slate-500 transition group-open:rotate-45 group-open:text-[#7C4DFF]" />
                </summary>
                <p className="max-w-3xl pb-6 text-[15px] leading-8 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-10">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-gradient-to-br from-[#4A1DB5] via-[#632ce5] to-[#7C4DFF] px-8 py-14 text-white sm:px-12">
          <div
            className="pointer-events-none absolute hidden"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/75">Ready to move?</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
                Ready to give your team one calm inbox?
              </h2>
              <p className="mt-4 text-lg leading-8 text-white/80">
                Talk to us about your stack, your channels, and your team. We&apos;ll show you how this product language
                maps onto your real operation.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Talk to sales
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/30 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E9ECEF] bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
            <div>
              <Wordmark />
              <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
                A multi-channel customer support platform for WhatsApp, Telegram, Email, SMS, and web chat, with AI on
                every conversation.
              </p>
              <div className="mt-5 flex gap-2">
                {["alternate_email", "rss_feed", "code"].map((icon) => (
                  <a
                    key={icon}
                    href="#"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E9ECEF] bg-white text-slate-500 transition hover:text-slate-900"
                  >
                    <MaterialIcon name={icon} className="text-[16px]" />
                  </a>
                ))}
              </div>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{column.title}</h3>
                <ul className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="text-sm text-slate-600 transition hover:text-slate-900">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-[#E9ECEF] pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 omnicrm.chat. All rights reserved.</p>
            <div className="flex flex-wrap gap-5">
              {["Privacy", "Terms", "Security", "Status"].map((item) => (
                <a key={item} href="#" className="transition hover:text-slate-900">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
