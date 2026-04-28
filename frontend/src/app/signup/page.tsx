"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/index";

interface PasswordRule {
  label: string;
  test: (v: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters",       test: (v) => v.length >= 8 },
  { label: "Uppercase letter (A-Z)",       test: (v) => /[A-Z]/.test(v) },
  { label: "Lowercase letter (a-z)",       test: (v) => /[a-z]/.test(v) },
  { label: "Number (0-9)",                 test: (v) => /\d/.test(v) },
  { label: "Special character (!@#$...)",  test: (v) => /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(v) },
];

function PasswordStrength({ password }: { password: string }) {
  const results = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) }));
  const score = results.filter((r) => r.passed).length;

  const bar = [
    { min: 0, color: "bg-slate-200" },
    { min: 1, color: "bg-red-400" },
    { min: 2, color: "bg-orange-400" },
    { min: 3, color: "bg-yellow-400" },
    { min: 4, color: "bg-blue-400" },
    { min: 5, color: "bg-green-500" },
  ];
  const activeColor = [...bar].reverse().find((b) => score >= b.min)!.color;

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? activeColor : "bg-slate-200"}`}
          />
        ))}
      </div>
      <ul className="space-y-1">
        {results.map((r) => (
          <li key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${r.passed ? "text-green-600" : "text-slate-400"}`}>
            <span className="material-symbols-outlined text-[14px]">
              {r.passed ? "check_circle" : "radio_button_unchecked"}
            </span>
            {r.label}
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

  const passwordStrong = useMemo(() => PASSWORD_RULES.every((r) => r.test(password)), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex h-screen bg-white items-center justify-center px-8">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              mark_email_read
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Request received!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Your account is pending admin approval. You will receive an email at <strong>{email}</strong> once your access is approved.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#7C4DFF] hover:text-[#632ce5] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#4A1DB5] via-[#632ce5] to-[#7C4DFF]">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Omnichat</span>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-white/80 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            Platform powered by AI
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Join your team&apos;s workspace
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Request access and an admin will review your registration before granting entry.
          </p>
        </div>

        <p className="relative text-white/35 text-xs">© 2026 Omnichat. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-8 overflow-y-auto py-8">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#632ce5] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
            </div>
            <span className="font-bold text-slate-900">Omnichat</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Request access</h2>
          <p className="text-slate-500 text-sm mb-8">Create an account — an admin will approve your request.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                required
                autoFocus
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full h-11 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full h-11 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full h-11 px-3.5 pr-10 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={`w-full h-11 px-3.5 rounded-lg bg-slate-50 border text-slate-900 text-sm outline-none focus:bg-white focus:ring-2 transition-all placeholder:text-slate-400 ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-400/15"
                    : "border-slate-200 focus:border-[#7C4DFF] focus:ring-[#7C4DFF]/15"
                }`}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordStrong || confirmPassword !== password}
              className="w-full h-11 bg-[#7C4DFF] hover:bg-[#632ce5] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request access"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#7C4DFF] hover:text-[#632ce5] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
