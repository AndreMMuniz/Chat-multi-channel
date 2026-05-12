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
      <div className="flex h-screen bg-white">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#4A1DB5] via-[#632ce5] to-[#7C4DFF] p-12 lg:flex lg:w-[52%] lg:flex-col lg:justify-between">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative flex items-center gap-3">
            <img src="/icon.svg" alt="omnicrm.chat" className="h-10 w-10 rounded-xl" />
            <span className="text-lg font-bold tracking-tight text-white">omnicrm.chat</span>
          </div>

          <div className="relative max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
              Access request submitted
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white">Your onboarding request is already in motion.</h1>
            <p className="text-lg leading-relaxed text-white/75">
              The team will review your request and release access so you can continue evaluating the branded CRM environment.
            </p>
          </div>

          <p className="relative text-xs text-white/35">© 2026 omnicrm.chat. All rights reserved.</p>
        </div>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="w-full max-w-[420px] text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="material-symbols-outlined text-[32px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                mark_email_read
              </span>
            </div>

            <h2 className="mb-3 text-2xl font-bold text-slate-900">Request received</h2>
            <p className="mb-8 text-sm leading-7 text-slate-500">
              We will review the request and notify <strong>{email}</strong> as soon as your workspace access is approved.
            </p>

            <div className="mb-8 grid gap-3 text-left sm:grid-cols-3">
              {[
                ["1", "Request received"],
                ["2", "Reviewed by team"],
                ["3", "Workspace access released"],
              ].map(([step, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Step {step}</p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to sign in
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-[#7C4DFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#632ce5]"
              >
                Return to landing page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#4A1DB5] via-[#632ce5] to-[#7C4DFF] p-12 lg:flex lg:w-[52%] lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <img src="/icon.svg" alt="omnicrm.chat" className="h-10 w-10 rounded-xl" />
          <span className="text-lg font-bold tracking-tight text-white">omnicrm.chat</span>
        </div>

        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
            Workspace onboarding
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white">Request access to the same product experience your team will evaluate.</h1>
          <p className="text-lg leading-relaxed text-white/75">
            This flow stays aligned with the product language: clear workspace access, branded CRM onboarding, and a path into the real environment.
          </p>

          <div className="mt-10 space-y-3.5">
            {[
              { icon: "forum", label: "Same visual family as the login and workspace experience" },
              { icon: "smart_toy", label: "Built for teams evaluating an operational CRM environment" },
              { icon: "verified_user", label: "Access is reviewed before the workspace is released" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-white/85">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/35">© 2026 omnicrm.chat. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/icon.svg" alt="omnicrm.chat" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-slate-900">omnicrm.chat</span>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-slate-900">Request workspace access</h2>
          <p className="mb-8 text-sm text-slate-500">Create your request so the team can review and release platform access.</p>

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
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7C4DFF] focus:bg-white focus:ring-2 focus:ring-[#7C4DFF]/15"
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
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7C4DFF] focus:bg-white focus:ring-2 focus:ring-[#7C4DFF]/15"
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
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7C4DFF] focus:bg-white focus:ring-2 focus:ring-[#7C4DFF]/15"
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
                    : "border-slate-200 focus:border-[#7C4DFF] focus:ring-[#7C4DFF]/15"
                }`}
              />
              {confirmPassword && confirmPassword !== password ? (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              ) : null}
            </div>

            {error ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">error</span>
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !passwordStrong || confirmPassword !== password}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#7C4DFF] text-sm font-semibold text-white transition-all hover:bg-[#632ce5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
            <Link href="/login" className="font-semibold text-[#7C4DFF] transition-colors hover:text-[#632ce5]">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            Want to review the offer first?{" "}
            <Link href="/" className="font-semibold text-[#7C4DFF] transition-colors hover:text-[#632ce5]">
              Return to the landing page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
