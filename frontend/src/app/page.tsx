import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Omnichat White-Label CRM",
  description:
    "Launch a branded omnichannel CRM platform with white-label source code, custom branding, and production deployment for internal business operations.",
};

const demoCredentials = {
  email: "visitor@omnichat.demo",
  password: "Replace-with-demo-password",
};

const packageItems = [
  {
    title: "White-label source code",
    description:
      "Acquire a branded CRM foundation your company can operate internally without starting product development from zero.",
  },
  {
    title: "Brand customization",
    description:
      "Adapt logo, colors, interface styling, and key presentation points so the platform reflects your business identity.",
  },
  {
    title: "Production deployment",
    description:
      "Go live with an enterprise-ready environment prepared for real operations, onboarding, and internal adoption.",
  },
];

const benefitItems = [
  "Launch a branded omnichannel CRM operation faster",
  "Centralize conversations across sales and support channels",
  "Keep autonomy over the platform direction and presentation",
  "Avoid long internal development cycles before seeing value",
];

const audienceItems = [
  "Sales and support operations that need a centralized branded workspace",
  "Enterprise teams that want more control over customer communication flows",
  "Companies that need a production-ready platform without building from scratch",
];

const processItems = [
  {
    step: "01",
    title: "Choose the delivery scope",
    description: "Define the package, deployment expectations, and the operational goals for your internal team.",
  },
  {
    step: "02",
    title: "Apply your brand system",
    description: "We customize colors, logo, and interface presentation so the product matches your company identity.",
  },
  {
    step: "03",
    title: "Deploy for production use",
    description: "Your environment is prepared for enterprise operation so your team can start using the platform in practice.",
  },
];

const faqItems = [
  {
    question: "Is this built for internal business use?",
    answer:
      "Yes. This offer is designed for companies that want to operate their own CRM and customer communication environment under their own brand.",
  },
  {
    question: "What is included in the package?",
    answer:
      "The core package includes white-label source code, branding customization, and production deployment support.",
  },
  {
    question: "Can we test the platform before moving forward?",
    answer:
      "Yes. Visitors can explore the demo environment through the login experience and evaluate how the platform works in practice.",
  },
  {
    question: "Do you provide visitor access credentials?",
    answer:
      "Yes. Visitor credentials are provided for evaluation so stakeholders can explore the environment safely before acquisition.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f4efe7] text-slate-900">
      <section className="relative overflow-hidden bg-[#0f172a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(244,114,182,0.18),_transparent_30%),linear-gradient(140deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-10 lg:pb-24">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                <span
                  className="material-symbols-outlined text-[22px] text-cyan-200"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  support_agent
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Omnichat</p>
                <p className="text-sm text-slate-300">White-label CRM deployment for internal operations</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <nav className="hidden items-center gap-5 text-sm text-slate-300 lg:flex">
                <a href="#package" className="transition hover:text-white">
                  Package
                </a>
                <a href="#rollout" className="transition hover:text-white">
                  Rollout
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
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#f97316] px-5 text-sm font-semibold text-slate-950 transition hover:bg-[#fb923c]"
              >
                Request Access
              </Link>
            </div>
          </header>

          <div className="grid gap-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Own the operation, not just the license
              </div>

              <h1 className="mt-7 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Launch your own omnichannel CRM platform under your brand.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Get white-label source code, branded customization, and production deployment so your company can run
                sales and support operations in a platform that looks and feels like your business.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-[#f97316] px-7 text-base font-semibold text-slate-950 transition hover:bg-[#fb923c]"
                >
                  Request Access
                </Link>
                <a
                  href="https://www.omnicrm.chat/login"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Test the Platform
                </a>
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Visitor credentials are provided for evaluation so your team can explore the live environment safely.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
                {[
                  "Source code included",
                  "Brand customization included",
                  "Production deployment included",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
                  >
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Source code included", "Build on a proven internal CRM foundation."],
                  ["Brand-ready UI", "Match the platform to your company identity."],
                  ["Production deployment", "Move from decision to operational rollout faster."],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="absolute bottom-8 right-4 h-32 w-32 rounded-full bg-orange-400/20 blur-3xl" />
              <div className="absolute -right-6 top-32 hidden h-20 w-20 rounded-full border border-white/10 bg-white/5 lg:block" />

              <div className="relative rounded-[32px] border border-white/10 bg-white/8 p-4 shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur">
                <div className="rounded-[28px] border border-white/10 bg-[#f8fafc] p-4 text-slate-900">
                  <div className="flex items-center justify-between rounded-[24px] bg-[#111827] px-5 py-4 text-white">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Branded workspace</p>
                      <p className="mt-1 text-lg font-semibold">Your team&apos;s CRM operation</p>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100">Live-ready</div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[24px] bg-[#fff7ed] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">Deployment package</p>
                      <div className="mt-4 space-y-3">
                        {[
                          "Brand system applied across workspace",
                          "Sales, support, and omnichannel inbox in one place",
                          "Production environment configured for internal use",
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-3">
                            <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-orange-500" />
                            <p className="text-sm leading-6 text-slate-700">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] bg-[#ecfeff] p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["42", "active conversations"],
                          ["3.2h", "average implementation review"],
                        ].map(([value, label]) => (
                          <div key={label} className="rounded-[20px] bg-white p-4 shadow-sm">
                            <p className="text-2xl font-semibold text-slate-900">{value}</p>
                            <p className="mt-1 text-sm text-slate-500">{label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-[22px] bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">Customization layers</p>
                          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                            included
                          </span>
                        </div>
                        <div className="mt-4 space-y-3">
                          {[
                            ["Brand colors", "Applied across navigation and workspace surfaces"],
                            ["Logo & identity", "Aligned to your internal operation and presentation"],
                            ["Go-live support", "Deployment prepared for production usage"],
                          ].map(([title, text]) => (
                            <div key={title} className="rounded-2xl border border-slate-200 p-3">
                              <p className="text-sm font-semibold text-slate-900">{title}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 left-6 hidden max-w-[280px] rounded-[28px] border border-white/10 bg-slate-950/70 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur lg:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Enterprise-ready package</p>
                <p className="mt-3 text-lg font-semibold">Brand ownership, deployment, and internal rollout in one motion.</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Designed for teams that need a branded CRM environment in production without a long custom build cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="package" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c2410c]">What you get</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              A turnkey package for companies that want their own CRM operation.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              This is not generic SaaS access. Your company receives a platform foundation, brand adaptation, and
              deployment support designed for internal business use.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {packageItems.map((item) => (
              <article key={item.title} className="rounded-[28px] border border-[#e7dccd] bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#c2410c]">
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

      <section className="border-y border-[#e7dccd] bg-[#fcfaf6]">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f766e]">Why this model works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Move faster without giving up ownership of the operational experience.
            </h2>
            <div className="mt-8 space-y-4">
              {benefitItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border border-[#dcefe9] bg-white p-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-[#0f766e]" />
                  <p className="text-base leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-[#0f172a] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">Built for internal teams</p>
            <h3 className="mt-4 text-2xl font-semibold">The platform is structured around internal adoption, not resale.</h3>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Position the software as your company&apos;s operational environment for customer conversations, CRM follow-up,
              and team coordination. The value is faster execution with your own brand in production.
            </p>
            <div className="mt-8 space-y-3">
              {audienceItems.map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="rollout" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7c3aed]">Customization & rollout</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Brand the platform, prepare the environment, and launch with a clear path to production.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The project is structured to help your team move from decision to live internal operation with minimal
              friction.
            </p>
          </div>

          <div className="space-y-4">
            {processItems.map((item) => (
              <article key={item.step} className="grid gap-5 rounded-[28px] border border-[#e4ddf7] bg-white p-6 md:grid-cols-[88px_1fr]">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f3e8ff] text-xl font-semibold text-[#6d28d9]">
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

      <section id="demo" className="bg-[#111827] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">Live demo</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Test the platform and see how your branded operation could work in practice.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Explore the visitor environment, review the platform flow, and evaluate how the workspace supports internal
              customer operations.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-sm font-semibold text-white">Visitor demo access</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Visitor credentials are available for evaluation. Use the demo environment to inspect the product
                  experience before moving into a proposal and customization phase.
                </p>
              </div>
              <a
                href="https://www.omnicrm.chat/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#22d3ee] px-5 text-sm font-semibold text-slate-950 transition hover:bg-[#67e8f9]"
              >
                Test the Platform
              </a>
            </div>

            <div className="mt-6 rounded-[24px] border border-cyan-300/20 bg-cyan-300/8 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Demo access flow</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["Open the login page", "The CTA sends visitors directly to the product login environment."],
                  ["Use standard visitor credentials", "A default email and password are shared for product evaluation."],
                  ["Explore the live workspace", "Review how the operation, branding, and interface flow work in practice."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[20px] border border-white/10 bg-slate-950/25 p-4">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-orange-300/20 bg-orange-300/8 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">Demo credentials</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Replace these placeholder values with the final visitor login before publishing the landing page.
                  </p>
                </div>
                <a
                  href="https://www.omnicrm.chat/login"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open Login
                </a>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
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

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                ["Own the interface", "Operate a customer environment aligned to your company identity."],
                ["Accelerate implementation", "Start from a ready platform instead of a long build cycle."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[22px] border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b45309]">FAQ</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Questions teams usually ask before moving forward.
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-[28px] border border-[#eadfcf] bg-white p-6">
                <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f97316]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex flex-col gap-8 rounded-[36px] bg-[#111827] px-8 py-10 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200">Final CTA</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Put your branded CRM operation into production faster.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Get white-label source code, brand customization, and deployment support in one delivery model built for
                internal business operations.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#f97316] px-5 text-sm font-semibold text-slate-950 transition hover:bg-[#fb923c]"
              >
                Request Access
              </Link>
              <a
                href="https://www.omnicrm.chat/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
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
