"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/index";

interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (value) => value.length >= 8 },
  { label: "Uppercase letter (A-Z)", test: (value) => /[A-Z]/.test(value) },
  { label: "Lowercase letter (a-z)", test: (value) => /[a-z]/.test(value) },
  { label: "Number (0-9)", test: (value) => /\d/.test(value) },
  { label: "Special character (!@#$...)", test: (value) => /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(value) },
];

const onboardingSteps = [
  {
    step: "01",
    title: "Submit your request",
    description: "Share the contact who will receive onboarding and workspace approval updates.",
  },
  {
    step: "02",
    title: "Review and approval",
    description: "The team validates the request before releasing access to the environment.",
  },
  {
    step: "03",
    title: "Continue the rollout",
    description: "Move into workspace access, evaluation, and the commercial deployment process.",
  },
];

function PasswordStrength({ password }: { password: string }) {
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));
  const score = results.filter((rule) => rule.passed).length;

  const bar = [
    { min: 0, color: "bg-slate-200" },
    { min: 1, color: "bg-red-400" },
    { min: 2, color: "bg-orange-400" },
    { min: 3, color: "bg-yellow-400" },
    { min: 4, color: "bg-blue-400" },
    { min: 5, color: "bg-green-500" },
  ];

  const activeColor = [...bar].reverse().find((item) => score >= item.min)?.color ?? "bg-slate-200";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${index <= score ? activeColor : "bg-slate-200"}`}
          />
        ))}
      </div>
      <ul className="space-y-1">
        {results.map((rule) => (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${rule.passed ? "text-green-600" : "text-slate-400"}`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {rule.passed ? "check_circle" : "radio_button_unchecked"}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordStrong = useMemo(() => PASSWORD_RULES.every((rule) => rule.test(password)), [password]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!passwordStrong) {
      setError("Please meet all password requirements before submitting.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.signup({ email, password, full_name: fullName });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5efe6] px-8 py-10">
        <div className="w-full max-w-[520px] rounded-[32px] border border-[#e8dccf] bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="material-symbols-outlined text-[32px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
              mark_email_read
            </span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Access request submitted</p>
          <h2 className="mb-3 mt-3 text-3xl font-bold text-slate-900">Your onboarding request is in queue.</h2>
          <p className="mb-8 text-sm leading-7 text-slate-500">
            We received your request and the team will review it shortly. A confirmation will be sent to <strong>{email}</strong> as soon as your workspace access is approved.
          </p>

          <div className="mb-8 grid gap-3 text-left sm:grid-cols-3">
            {[
              ["1", "Request received"],
              ["2", "Reviewed by team"],
              ["3", "Workspace access released"],
            ].map(([step, label]) => (
              <div key={label} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Step {step}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to sign in
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#f97316] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#fb923c]"
            >
              Return to landing page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5efe6]">
      <div className="relative hidden min-w-0 overflow-hidden bg-[linear-gradient(145deg,_#0f172a,_#172554_58%,_#0f766e)] p-12 lg:flex lg:w-[52%] lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -left-20 top-20 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="absolute bottom-12 right-0 h-64 w-64 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="relative flex w-full items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              support_agent
            </span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Omnichat</span>
        </div>

        <div className="relative w-full max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
            White-label CRM onboarding
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
            Start the access flow for your branded CRM workspace.
          </h1>
          <p className="text-lg leading-relaxed text-white/70">
            Submit your request so the team can review your company details, approve access, and move your internal operation toward deployment.
          </p>

          <div className="mt-10 w-full space-y-3.5">
            {[
              "Commercial onboarding aligned with your branded CRM rollout",
              "Access review before workspace release",
              "Built for internal enterprise teams, not generic public signup",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/85">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full max-w-4xl rounded-[28px] border border-white/10 bg-white/8 p-5 text-white backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">What happens next</p>
          <div className="mt-4 grid gap-3">
            {onboardingSteps.map((item) => (
              <div key={item.step} className="grid grid-cols-[40px_1fr] gap-3 rounded-[20px] border border-white/10 bg-slate-950/25 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-cyan-100">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-8 py-10">
        <div className="w-full max-w-[460px] rounded-[32px] border border-[#e8dccf] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f766e]">
              <span className="material-symbols-outlined text-[18px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                support_agent
              </span>
            </div>
            <span className="font-bold text-slate-900">Omnichat</span>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c2410c]">Commercial onboarding</p>
          <h2 className="mb-1 mt-3 text-3xl font-bold text-slate-900">Request workspace access</h2>
          <p className="mb-8 text-sm leading-7 text-slate-500">
            Create your request so the team can review your information and release access to the platform environment.
          </p>

          <div className="mb-6 rounded-[24px] border border-[#e9ded1] bg-[#fcfaf6] p-5">
            <p className="text-sm font-semibold text-slate-900">What this request unlocks</p>
            <div className="mt-3 grid gap-3">
              {[
                "Access review for your company workspace",
                "Commercial follow-up for branding and deployment scope",
                "A path into the Omnichat operating environment",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#f97316]" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <input
                type="text"
                required
                autoFocus
                minLength={2}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jane Doe"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white focus:ring-2 focus:ring-[#0f766e]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white focus:ring-2 focus:ring-[#0f766e]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white focus:ring-2 focus:ring-[#0f766e]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your password"
                className={`h-11 w-full rounded-lg border bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-400/15"
                    : "border-slate-200 focus:border-[#0f766e] focus:ring-[#0f766e]/15"
                }`}
              />
              {confirmPassword && confirmPassword !== password ? (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              ) : null}
            </div>

            {error ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">error</span>
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !passwordStrong || confirmPassword !== password}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f97316] text-sm font-semibold text-slate-950 transition-all hover:bg-[#fb923c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit request"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#0f766e] transition-colors hover:text-[#0b5f59]">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            Want to review the offer first?{" "}
            <Link href="/" className="font-semibold text-[#0f766e] transition-colors hover:text-[#0b5f59]">
              Return to the landing page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
