"use client";

import { useState } from "react";

const VIEW_OPTIONS = [
  { id: "kanban", label: "Kanban", icon: "view_kanban" },
  { id: "list", label: "List", icon: "view_list" },
  { id: "timeline", label: "Timeline", icon: "timeline" },
] as const;

const STAGE_PREVIEW = [
  { id: "lead", label: "Lead", count: 4, accent: "bg-slate-400" },
  { id: "qualification", label: "Qualification", count: 3, accent: "bg-indigo-500" },
  { id: "proposal", label: "Proposal", count: 2, accent: "bg-amber-500" },
  { id: "negotiation", label: "Negotiation", count: 2, accent: "bg-orange-500" },
  { id: "closed", label: "Closed", count: 1, accent: "bg-emerald-500" },
];

const KPI_PREVIEW = [
  {
    label: "Active Projects",
    value: "12",
    hint: "Message-driven demands and manual entries",
    icon: "inventory_2",
    tint: "bg-indigo-50 text-indigo-700",
  },
  {
    label: "At Risk",
    value: "3",
    hint: "Due soon or overdue across the pipeline",
    icon: "warning",
    tint: "bg-rose-50 text-rose-700",
  },
  {
    label: "Conversation Origin",
    value: "7",
    hint: "Projects created from Messages demands",
    icon: "forum",
    tint: "bg-sky-50 text-sky-700",
  },
  {
    label: "Assigned Owners",
    value: "5",
    hint: "Operators currently handling projects",
    icon: "group",
    tint: "bg-emerald-50 text-emerald-700",
  },
];

export default function ProjectsPage() {
  const [activeView, setActiveView] = useState<(typeof VIEW_OPTIONS)[number]["id"]>("kanban");

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--color-background)]">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6">
        <header className="overflow-hidden rounded-[28px] border border-[var(--color-outline-variant)] bg-white shadow-sm">
          <div className="border-b border-[var(--color-outline-variant)] bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500 px-5 py-6 text-white sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/14 text-white ring-1 ring-white/20">
                  <span
                    className="material-symbols-outlined text-[28px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    view_kanban
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-indigo-50 uppercase ring-1 ring-white/15">
                    <span className="material-symbols-outlined text-[14px]">conversion_path</span>
                    Projects Workspace
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Projects</h1>
                    <p className="mt-2 max-w-3xl text-sm text-indigo-50/90 sm:text-[15px]">
                      Track project cards across a shared pipeline and turn message demands into work that can be owned,
                      prioritized, and completed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
                <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/10 p-1 ring-1 ring-white/15">
                  {VIEW_OPTIONS.map((view) => {
                    const active = activeView === view.id;
                    return (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => setActiveView(view.id)}
                        className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition ${
                          active
                            ? "bg-white text-indigo-700 shadow-sm"
                            : "text-indigo-50 hover:bg-white/10"
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {view.icon}
                        </span>
                        {view.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  New Project
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Search</span>
                <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                  Search projects, contacts, or demands
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Owner</span>
                <div className="flex h-11 items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
                  All owners
                  <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Priority</span>
                <div className="flex h-11 items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
                  All priorities
                  <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Origin</span>
                <div className="flex h-11 items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
                  Manual and Messages
                  <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
                </div>
              </label>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    forum
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Message-to-project flow</p>
                  <p className="text-sm leading-6 text-slate-600">
                    A demand that starts in <span className="font-semibold text-indigo-700">Messages</span> can become a
                    project card here without losing context about channel, owner, and follow-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-4">
          {KPI_PREVIEW.map((item) => (
            <article
              key={item.label}
              className="rounded-[24px] border border-[var(--color-outline-variant)] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{item.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tint}`}>
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {item.icon}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{item.hint}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-[var(--color-outline-variant)] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.01em] text-slate-900">Pipeline Surface</h2>
              <p className="mt-1 text-sm text-slate-500">
                The real board behavior lands next, but the workspace structure is already ready for it.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <span className="material-symbols-outlined text-[16px]">deployed_code</span>
              Story 11.1 foundation
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {STAGE_PREVIEW.map((stage) => (
              <article
                key={stage.id}
                className="min-h-[440px] min-w-[280px] flex-1 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stage.accent}`} />
                      <h3 className="text-sm font-semibold text-slate-900">{stage.label}</h3>
                    </div>
                    <p className="text-xs text-slate-500">{stage.count} cards previewed in this stage</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700"
                    title={`Add project in ${stage.label}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Project card structure</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Title, owner, priority, tags, due date, and conversation origin will render here in the next
                          story.
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                        Ready
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                        Messages origin
                      </span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        Priority
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Owner
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/60 p-4 text-sm leading-6 text-slate-500">
                    Kanban columns are already reserved for the next story, including horizontal scroll behavior on
                    smaller screens.
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
