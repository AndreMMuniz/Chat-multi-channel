import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Omnichat White-Label CRM",
  description:
    "Launch a branded omnichannel CRM platform with white-label source code, visual customization, and production deployment for internal business operations.",
};

const demoCredentials = {
  email: "visitor@omnichat.demo",
  password: "Replace-with-demo-password",
};

const packageItems = [
  {
    title: "Source code included",
    description: "Start from a proven omnichannel CRM foundation instead of opening a long internal development project.",
  },
  {
    title: "Brand customization",
    description: "Apply your logo, colors, naming, and presentation layer so the platform feels native to your company.",
  },
  {
    title: "Production deployment",
    description: "Launch a live environment prepared for internal operations, onboarding, and daily usage.",
  },
];

const outcomeItems = [
  "Centralize WhatsApp, Telegram, Email, SMS, and web conversations in one workspace",
  "Operate with your own brand instead of exposing a generic third-party tool",
  "Accelerate rollout with a product structure that already supports service teams",
  "Keep room for operational evolution without building the full system from zero",
];

const rolloutSteps = [
  {
    step: "01",
    title: "Define package and scope",
    description: "Align the delivery with your internal operation, branding, and deployment expectations.",
  },
  {
    step: "02",
    title: "Apply your brand layer",
    description: "Colors, logo, identity, and presentation surfaces are tailored to your company.",
  },
  {
    step: "03",
    title: "Go live in production",
    description: "Your team receives a branded CRM environment prepared for real usage.",
  },
];

const faqItems = [
  {
    question: "Is this intended for internal business use?",
    answer:
      "Yes. The offer is positioned for companies that want their own operational CRM environment under their own brand.",
  },
  {
    question: "What does the package include?",
    answer:
      "The core package includes white-label source code, branding customization, and production deployment support.",
  },
  {
    question: "Can we test before moving forward?",
    answer:
      "Yes. Visitors can use the demo environment to inspect the interface, flows, and overall product experience.",
  },
  {
    question: "Can visitor credentials be shared publicly?",
    answer:
      "Yes, but the safest approach is to treat them as controlled demo credentials and rotate them whenever needed.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4A1DB5] via-[#632ce5] to-[#7C4DFF] text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-10 lg:pb-24">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  support_agent
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">Omnichat</p>
                <p className="text-sm text-white/80">White-label CRM deployment for internal operations</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <nav className="hidden items-center gap-5 text-sm text-white/85 lg:flex">
                <a href="#package" className="transition hover:text-white">
                  Package
                </a>
                <a href="#workspace" className="transition hover:text-white">
                  Workspace
                </a>
                <a href="#demo" className="transition hover:text-white">
                  Demo
                </a>
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
              </nav>

              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#4A1DB5] transition hover:bg-slate-100"
              >
                Request Access
              </Link>
            </div>
          </header>

          <div className="grid gap-14 pt-12 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/85">
                <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                Productized CRM rollout with your own brand
              </div>

              <h1 className="mt-7 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Deliver a CRM experience that already looks close to what your team will operate.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                Omnichat gives your company a branded omnichannel workspace with source code, visual customization, and
                deployment support, so what you buy already resembles what your operation will use in production.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-base font-semibold text-[#4A1DB5] transition hover:bg-slate-100"
                >
                  Request Access
                </Link>
                <a
                  href="https://www.omnicrm.chat/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 text-base font-semibold text-white transition hover:bg-white/15"
                >
                  Test the Platform
                </a>
              </div>

              <p className="mt-4 text-sm text-white/70">
                Visitor credentials are provided for evaluation so stakeholders can inspect the real interface and flow.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Unified inbox", "A workspace built around daily customer operations."],
                  ["AI assistance", "Suggestions and productivity features already in the experience."],
                  ["Brand control", "Identity, colors, and presentation can be adapted to your company."],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/75">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="workspace" className="relative">
              <div className="absolute -left-10 top-12 h-28 w-28 rounded-full bg-white/12 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#3dd5f3]/20 blur-3xl" />

              <div className="rounded-[30px] border border-white/15 bg-white/10 p-4 shadow-[0_30px_100px_rgba(29,17,86,0.35)] backdrop-blur-sm">
                <div className="overflow-hidden rounded-[26px] border border-[#dfe4f3] bg-white shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#7C4DFF]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        forum
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Messages Workspace</p>
                        <p className="text-xs text-slate-500">Branded operational inbox</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-[#f3f0ff] px-3 py-1 text-xs font-medium text-[#7C4DFF]">Live preview</div>
                  </div>

                  <div className="grid min-h-[480px] grid-cols-[84px_240px_1fr_220px] bg-[#fbfcff]">
                    <div className="border-r border-slate-200 bg-white p-3">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C4DFF] text-white">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                          support_agent
                        </span>
                      </div>
                      <div className="space-y-3">
                        {["grid_view", "chat_bubble", "description", "inventory_2", "task", "settings"].map((icon, index) => (
                          <div
                            key={icon}
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                              index === 1 ? "bg-[#ede9fe] text-[#7C4DFF]" : "text-slate-400"
                            }`}
                          >
                            <span className="material-symbols-outlined" style={index === 1 ? { fontVariationSettings: "'FILL' 1" } : {}}>
                              {icon}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-r border-slate-200 bg-white p-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                        Search conversations...
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                        {["All", "Telegram", "WhatsApp", "Email"].map((item, index) => (
                          <span
                            key={item}
                            className={`rounded-full border px-3 py-1.5 ${
                              index === 0
                                ? "border-[#d9ccff] bg-[#f3f0ff] text-[#7C4DFF]"
                                : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 rounded-2xl border border-[#cfd7fb] bg-[#eef2ff] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d1fae5] text-sm font-bold text-[#15803d]">
                            A
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">Andre</p>
                              <span className="text-[11px] text-slate-400">now</span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Sure, I&apos;m here to help with your request...</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-r border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Andre</p>
                          <div className="mt-1 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                            Telegram
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">Open</span>
                          <span className="rounded-full bg-[#f3f0ff] px-3 py-1 text-xs font-medium text-[#7C4DFF]">AI on</span>
                        </div>
                      </div>

                      <div className="space-y-6 px-5 py-5">
                        <div className="max-w-[280px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
                          Hi, I need help with plan changes.
                        </div>

                        <div className="ml-auto max-w-[340px] rounded-2xl bg-[#5b3df6] px-4 py-3 text-sm text-white shadow-sm">
                          Of course. Please share the details and we can move forward together.
                        </div>

                        <div className="max-w-[320px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
                          I want something that looks like our own system, not a generic tool.
                        </div>

                        <div className="ml-auto max-w-[360px] rounded-2xl bg-[#5b3df6] px-4 py-3 text-sm text-white shadow-sm">
                          That is exactly the model: branded CRM workspace, source code, customization, and deployment.
                        </div>
                      </div>

                      <div className="border-t border-slate-200 px-4 py-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                          Type a message or use AI-powered suggestions...
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4">
                      <div className="border-b border-slate-200 pb-4 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d1fae5] text-2xl font-bold text-[#15803d]">
                          A
                        </div>
                        <p className="mt-3 text-lg font-semibold text-slate-900">Andre</p>
                        <p className="mt-1 text-sm text-slate-500">Contact details</p>
                      </div>

                      <div className="mt-5 space-y-4 text-sm">
                        {[
                          ["Channel", "Telegram"],
                          ["Status", "Open"],
                          ["Workspace", "Branded environment"],
                          ["First response", "On time"],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">{label}</span>
                            <span className="font-medium text-slate-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 left-5 hidden max-w-[260px] rounded-[24px] border border-white/15 bg-white/12 p-5 text-white backdrop-blur-sm lg:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Closer to the delivered product</p>
                <p className="mt-3 text-lg font-semibold">The page now sells a workspace, not an abstract software promise.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="package" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7C4DFF]">What is delivered</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The commercial offer is packaged around the same product language the team will actually use.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Instead of selling a generic concept, the landing frames the real workspace outcome: omnichannel inbox,
              branded presentation, internal-team usage, and deployment support.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {packageItems.map((item) => (
              <article key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f0ff] text-[#7C4DFF]">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    deployed_code
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9ff] py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_1fr] lg:px-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7C4DFF]">Why this works</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Sell the operational experience your company is actually buying.
            </h2>
            <div className="mt-8 space-y-4">
              {outcomeItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-white p-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-[#7C4DFF]" />
                  <p className="text-base leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7C4DFF]">Product alignment</p>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">The visual direction now matches login and product surfaces.</h3>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Purple gradients, white workspace cards, soft borders, and CRM-style surfaces create continuity from the
              first marketing touchpoint to the real logged-in experience.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                "Same purple product family used in login",
                "Workspace-style preview instead of abstract cards",
                "Commercial message centered on the delivered environment",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[#f8f9ff] px-4 py-4 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7C4DFF]">Rollout</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Move from branded concept to production environment with a clear sequence.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The offer is structured to connect commercial validation, brand adaptation, and final delivery in one
              understandable process.
            </p>
          </div>

          <div className="space-y-4">
            {rolloutSteps.map((item) => (
              <article key={item.step} className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[88px_1fr]">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f3f0ff] text-xl font-semibold text-[#7C4DFF]">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-[#0f1220] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Live demo</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Let visitors evaluate the same product feeling they will later operate.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              The demo entry should reinforce trust: product-like experience, clear credentials, and a direct path into
              the login environment.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-sm font-semibold text-white">Visitor demo access</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Use the login page as the entry to a controlled evaluation environment and keep the narrative aligned
                  with the delivered workspace.
                </p>
              </div>
              <a
                href="https://www.omnicrm.chat/login"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#7C4DFF] px-5 text-sm font-semibold text-white transition hover:bg-[#632ce5]"
              >
                Test the Platform
              </a>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ["Open login", "Visitors land directly in the product access point."],
                ["Use demo credentials", "Share a controlled email and password for evaluation."],
                ["Inspect the workspace", "Let the UI prove the quality of the delivered environment."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[20px] border border-white/10 bg-slate-950/25 p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-slate-950/25 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Demo email</p>
                <p className="mt-2 break-all font-mono text-sm text-white">{demoCredentials.email}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-slate-950/25 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Demo password</p>
                <p className="mt-2 break-all font-mono text-sm text-white">{demoCredentials.password}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7C4DFF]">FAQ</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Questions buyers usually ask before moving forward.
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9ff]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex flex-col gap-8 rounded-[36px] bg-white px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7C4DFF]">Final CTA</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Buy the operational experience your team expects to see in production.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Omnichat packages the same CRM language shown in the product: omnichannel workspace, brand customization,
                and deployment support for internal use.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#7C4DFF] px-5 text-sm font-semibold text-white transition hover:bg-[#632ce5]"
              >
                Request Access
              </Link>
              <a
                href="https://www.omnicrm.chat/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Test the Platform
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
