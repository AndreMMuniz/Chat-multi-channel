"use client";

import { useState } from "react";

const steps = [
  {
    number: "01",
    title: "Connect your channels",
    body: "Bring your WhatsApp number, Telegram bot, support inbox and SMS line. We've built the integrations so you don't have to.",
  },
  {
    number: "02",
    title: "Invite your team, set the rules",
    body: "Roles, queues and SLAs that match the way your team already works — set them once, change them whenever.",
  },
  {
    number: "03",
    title: "Reply, with AI in the wings",
    body: "Type, click a quick reply, or ask the AI for a draft. Send across any channel from the same composer.",
  },
];

function ChannelsVisual() {
  return (
    <div className="rounded-[28px] border border-[#E9ECEF] bg-white p-10 shadow-[0_24px_48px_-24px_rgba(67,56,202,0.15)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Channels</p>
      <div className="mt-4 space-y-4">
        {[
          ["WhatsApp", "+55 11 4002-8922", "bg-emerald-100 text-emerald-700", "Connected", "bg-emerald-50 text-emerald-700"],
          ["Telegram", "@acme_support_bot", "bg-sky-100 text-sky-700", "Connected", "bg-emerald-50 text-emerald-700"],
          ["Email", "support@acme.co", "bg-orange-100 text-orange-700", "Connected", "bg-emerald-50 text-emerald-700"],
          ["SMS", "+1 (415) 555-0188", "bg-violet-100 text-violet-700", "Connecting...", "bg-orange-50 text-orange-700"],
        ].map(([name, meta, tone, status, statusTone]) => (
          <div key={name} className="flex items-center justify-between rounded-[18px] border border-[#E9ECEF] bg-white px-5 py-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${tone}`}>
                {name === "WhatsApp" ? "WA" : name === "Telegram" ? "TG" : name === "Email" ? "@" : "SMS"}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-slate-900">{name}</p>
                <p className="text-sm text-slate-500">{meta}</p>
              </div>
            </div>
            <span className={`rounded-full px-4 py-2 text-xs font-semibold ${statusTone}`}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamVisual() {
  return (
    <div className="rounded-[28px] border border-[#E9ECEF] bg-white p-10 shadow-[0_24px_48px_-24px_rgba(67,56,202,0.15)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Team</p>
        <span className="rounded-full bg-indigo-100 px-4 py-2 text-xs font-semibold text-[#6d4aff]">Invite</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-[18px] border border-[#E9ECEF]">
        <div className="grid grid-cols-[1.3fr_0.8fr_0.9fr] border-b border-[#E9ECEF] bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
          <span>User</span>
          <span>Role</span>
          <span>Queue</span>
        </div>

        {[
          ["AM", "Aline Martins", "Admin", "All channels", "bg-violet-100 text-violet-700"],
          ["BC", "Bruno Costa", "Supervisor", "WhatsApp, Email", "bg-blue-100 text-blue-700"],
          ["CN", "Carla Nogueira", "Agent", "WhatsApp", "bg-emerald-100 text-emerald-700"],
          ["DP", "Daniel Park", "Agent", "Email, SMS", "bg-emerald-100 text-emerald-700"],
        ].map(([initials, name, role, queue, roleTone]) => (
          <div key={name} className="grid grid-cols-[1.3fr_0.8fr_0.9fr] items-center border-b border-[#E9ECEF] px-4 py-4 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6d4aff] text-xs font-bold text-white">{initials}</div>
              <span className="text-[15px] font-medium text-slate-900">{name}</span>
            </div>
            <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${roleTone}`}>{role}</span>
            <span className="text-sm text-slate-500">{queue}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[18px] border border-[#E9ECEF] bg-white px-4 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">SLA · WhatsApp</p>
          <p className="mt-3 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">First reply in 5m</p>
        </div>
        <div className="rounded-[18px] border border-[#E9ECEF] bg-white px-4 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">SLA · Email</p>
          <p className="mt-3 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">Resolved in 4h</p>
        </div>
      </div>
    </div>
  );
}

function AiVisual() {
  return (
    <div className="rounded-[28px] border border-[#E9ECEF] bg-white p-10 shadow-[0_24px_48px_-24px_rgba(67,56,202,0.15)]">
      <div className="rounded-[18px] border border-indigo-200 bg-[#faf7ff] p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d4aff]">AI draft</p>
          <p className="text-xs text-slate-400">Based on past 4 replies</p>
        </div>
        <p className="mt-4 text-[15px] leading-7 text-slate-700">
          Thanks for the patience, Rafael. I&apos;ve just confirmed with the shipping team — your order is in transit and
          should arrive by <strong>Friday</strong>. I&apos;ll keep an eye on it and reach back out if anything changes.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-xl bg-[#6d4aff] px-4 py-2 text-sm font-semibold text-white">Use draft</span>
          <span className="rounded-xl border border-[#E9ECEF] bg-white px-4 py-2 text-sm font-medium text-slate-700">Rewrite tone</span>
          <span className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500">Dismiss</span>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Quick replies</p>
          <p className="text-xs text-slate-400">Type / in the composer</p>
        </div>

        <div className="mt-4 space-y-3">
          {[
            ["/refund", "Hi {{name}}, your refund of {{amount}} has been issued..."],
            ["/shipping", "Your order is on its way! Tracking: {{tracking}}"],
            ["/closed", "Thanks for reaching out — closing this for now..."],
            ["/cs", "Can you confirm your account email so we can pull up the issue?"],
          ].map(([shortcut, body]) => (
            <div key={shortcut} className="flex items-center gap-4 rounded-[16px] border border-[#E9ECEF] bg-white px-4 py-3">
              <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-[#5b3df6]">{shortcut}</span>
              <span className="truncate text-sm text-slate-600">{body}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  const visual = [<ChannelsVisual key="channels" />, <TeamVisual key="team" />, <AiVisual key="ai" />][activeStep];

  return (
    <div className="mt-14 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="space-y-6">
        {steps.map((step, index) => {
          const active = index === activeStep;
          return (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`flex w-full gap-6 rounded-[24px] px-7 py-6 text-left transition ${
                active
                  ? "border border-[#E9ECEF] bg-white shadow-sm ring-1 ring-[#6d4aff]/10"
                  : "border border-transparent bg-transparent"
              }`}
            >
              <div
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  active ? "bg-[#6d4aff] text-white" : "bg-indigo-50 text-[#6d4aff]"
                }`}
              >
                {step.number}
              </div>
              <div className={`${active ? "border-l-4 border-l-[#6d4aff] pl-6" : "pl-2"}`}>
                <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-8 text-slate-600">{step.body}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div>{visual}</div>
    </div>
  );
}
