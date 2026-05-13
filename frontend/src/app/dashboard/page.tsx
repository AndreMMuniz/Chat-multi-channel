"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api/index";
import type { DashboardSummary } from "@/types/chat";

type SummaryCard = {
  title: string;
  value: number;
  href: string;
  hint: string;
  cta: string;
  icon: string;
  tint: string;
};

function DashboardShortcutCard({ card }: { card: SummaryCard }) {
  return (
    <Link
      href={card.href}
      className="group flex min-h-[176px] flex-col justify-between rounded-[28px] border border-[#E7EBF2] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {card.title}
          </p>
          <p className="mt-4 text-5xl font-semibold leading-none text-slate-900">
            {card.value.toLocaleString()}
          </p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.tint}`}>
          <span
            className="material-symbols-outlined text-[22px] text-indigo-700"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {card.icon}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="max-w-[24ch] text-sm leading-6 text-slate-500">
          {card.hint}
        </p>
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
          <span>{card.cta}</span>
          <span className="material-symbols-outlined text-[18px] transition group-hover:translate-x-0.5">
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        setLoading(true);
        setError("");
        const data = await dashboardApi.getDashboardSummary();
        if (!isMounted) return;
        setSummary(data);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards: SummaryCard[] = [
    {
      title: "Open conversations",
      value: summary?.open_conversations ?? 0,
      href: "/messages",
      hint: "Need attention now.",
      cta: "Open inbox",
      icon: "chat_bubble",
      tint: "bg-orange-50",
    },
    {
      title: "Proposals",
      value: summary?.proposals ?? 0,
      href: "/proposals?status=draft",
      hint: "Drafts and active negotiations.",
      cta: "Open proposals",
      icon: "request_quote",
      tint: "bg-sky-50",
    },
    {
      title: "Your tasks",
      value: summary?.your_tasks ?? 0,
      href: "/tasks?scope=assigned&status=open",
      hint: "Pending items assigned to you.",
      cta: "View tasks",
      icon: "task",
      tint: "bg-violet-50",
    },
    {
      title: "Your projects",
      value: summary?.your_projects ?? 0,
      href: "/projects?scope=open",
      hint: "Open cards in progress.",
      cta: "View projects",
      icon: "view_kanban",
      tint: "bg-emerald-50",
    },
  ];

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F7F9FC]">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col px-6 py-8">
        <header className="shrink-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Quick access to what matters.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            A lighter operational home with only the shortcuts your team needs every day.
          </p>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="flex flex-1 items-center">
          {loading ? (
            <div className="flex w-full items-center justify-center py-24 text-sm text-slate-500">
              <span className="material-symbols-outlined mr-3 animate-spin text-[20px] text-indigo-600">
                progress_activity
              </span>
              Loading dashboard...
            </div>
          ) : (
            <div className="grid w-full gap-5 md:grid-cols-2">
              {cards.map((card) => (
                <DashboardShortcutCard key={card.title} card={card} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
