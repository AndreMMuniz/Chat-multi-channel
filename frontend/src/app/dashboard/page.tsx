"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredUser } from "@/lib/api";
import { dashboardApi } from "@/lib/api/index";
import type { StoredUser } from "@/types/auth";
import type { DashboardStats, DayPoint } from "@/types/chat";

const CHANNEL_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  TELEGRAM: { label: "Telegram", icon: "send", color: "#0088CC", bg: "bg-blue-50" },
  WHATSAPP: { label: "WhatsApp", icon: "chat", color: "#25D366", bg: "bg-green-50" },
  EMAIL: { label: "Email", icon: "mail", color: "#F97316", bg: "bg-orange-50" },
  SMS: { label: "SMS", icon: "sms", color: "#8B5CF6", bg: "bg-purple-50" },
  WEB: { label: "Web Chat", icon: "language", color: "#64748B", bg: "bg-slate-50" },
};

const CHANNEL_COLORS: Record<string, string> = {
  TELEGRAM: "#0088CC",
  WHATSAPP: "#25D366",
  EMAIL: "#F97316",
  SMS: "#8B5CF6",
  WEB: "#64748B",
};

const DATE_RANGES = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

const REFRESH_INTERVAL_MS = 60_000;

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

function TrendBadge({ current, prev }: { current: number; prev: number }) {
  const pct = pctChange(current, prev);
  if (pct === null) return null;

  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
      <span className="material-symbols-outlined text-[12px]">{up ? "arrow_upward" : "arrow_downward"}</span>
      {Math.abs(pct)}%
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  iconBg,
  trend,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  iconBg: string;
  trend?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E9ECEF] bg-white p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <span className="material-symbols-outlined text-[20px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {trend ?? (sub && <span className="text-xs text-slate-400">{sub}</span>)}
      </div>
      <div>
        <p className="mb-1 text-3xl font-bold leading-none text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function BarChart({
  data,
  prevData,
  color = "#4F46E5",
}: {
  data: DayPoint[];
  prevData?: DayPoint[];
  color?: string;
}) {
  const allCounts = [...data.map((d) => d.count), ...(prevData ?? []).map((d) => d.count)];
  const max = Math.max(...allCounts, 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-32 w-full items-end gap-1.5">
        {data.map((d, i) => {
          const prev = prevData?.[i];
          return (
            <div key={i} className="group flex h-full flex-1 flex-col items-center gap-1.5">
              <div className="relative flex w-full flex-1 items-end gap-px">
                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center group-hover:flex">
                  <div className="whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white">
                    {d.count} {prev !== undefined && <span className="ml-1 opacity-60">vs {prev.count}</span>}
                  </div>
                </div>
                {prev !== undefined && (
                  <div
                    className="flex-1 rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max((prev.count / max) * 100, prev.count > 0 ? 4 : 1)}%`,
                      backgroundColor: color,
                      opacity: 0.2,
                    }}
                  />
                )}
                <div
                  className="flex-1 rounded-t-md transition-all"
                  style={{
                    height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%`,
                    backgroundColor: d.count > 0 ? color : "#E2E8F0",
                    opacity: d.count > 0 ? 1 : 0.4,
                  }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-400">{d.date}</span>
            </div>
          );
        })}
      </div>

      {prevData && (
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
            <span>Current period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.25 }} />
            <span>Previous period</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelDonut({ channels }: { channels: Record<string, number> }) {
  const total = Object.values(channels).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[10px] border-slate-100">
        <span className="text-[10px] text-slate-400">No data</span>
      </div>
    );
  }

  const entries = Object.entries(channels).sort(([, a], [, b]) => b - a);
  const { stops } = entries.reduce<{ cursor: number; stops: string[] }>(
    (acc, [ch, count]) => {
      const pct = (count / total) * 100;
      const color = CHANNEL_COLORS[ch] ?? "#94A3B8";
      acc.stops.push(`${color} ${acc.cursor}% ${acc.cursor + pct}%`);
      acc.cursor += pct;
      return acc;
    },
    { cursor: 0, stops: [] },
  );

  const gradient = `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{ background: gradient }}>
      <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white">
        <p className="text-sm font-bold leading-none text-slate-900">{total}</p>
        <p className="text-[9px] text-slate-400">total</p>
      </div>
    </div>
  );
}

function DonutChart({ open, closed, pending, total }: { open: number; closed: number; pending: number; total: number }) {
  if (total === 0) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-full border-[12px] border-slate-100">
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  const openPct = (open / total) * 100;
  const closedPct = (closed / total) * 100;
  const pendPct = (pending / total) * 100;

  const gradient = `conic-gradient(
    #4F46E5 0% ${openPct}%,
    #10B981 ${openPct}% ${openPct + closedPct}%,
    #F59E0B ${openPct + closedPct}% ${openPct + closedPct + pendPct}%,
    #E2E8F0 ${openPct + closedPct + pendPct}% 100%
  )`;

  return (
    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: gradient }}>
      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
        <p className="text-lg font-bold leading-none text-slate-900">{total}</p>
        <p className="text-[10px] text-slate-400">total</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [user] = useState<StoredUser | null>(() => getStoredUser<StoredUser>());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async (d: number, showLoading = false) => {
    if (showLoading) setLoading(true);
    setError("");

    try {
      const data = await dashboardApi.getDashboardStats(d);
      setStats(data);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchStats(days, true);
    });
  }, [days, fetchStats]);

  useEffect(() => {
    timerRef.current = setInterval(() => fetchStats(days), REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [days, fetchStats]);

  const totalChannels = stats ? Object.values(stats.channels).reduce((a, b) => a + b, 0) : 0;
  const userInitials = user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const formatResolutionTime = (hours: number | null) => {
    if (hours === null) return "—";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E9ECEF] bg-white px-6">
        <h1 className="text-[18px] font-semibold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDays(r.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  days === r.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[#E9ECEF] bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {user && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.full_name} className="h-full w-full rounded-full object-cover" width={32} height={32} />
              ) : (
                userInitials
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32 text-slate-400">
            <span className="material-symbols-outlined mr-3 animate-spin text-4xl">progress_activity</span>
            Loading analytics...
          </div>
        ) : stats && (
          <>
            <section className="space-y-4">
              <SectionHeading
                eyebrow="Executive Summary"
                title="Operational snapshot"
                description="See what needs attention first, then drill into workload and service health."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  icon="mark_chat_unread"
                  label="Open Conversations"
                  value={stats.open_conversations.toLocaleString()}
                  sub={`${stats.pending_conversations} pending`}
                  iconBg="bg-orange-50"
                  color="#F97316"
                />
                <KpiCard
                  icon="warning"
                  label="SLA at Risk"
                  value={stats.sla_at_risk}
                  sub={`>${stats.sla_threshold_minutes}min unanswered`}
                  iconBg={stats.sla_at_risk > 0 ? "bg-red-50" : "bg-slate-50"}
                  color={stats.sla_at_risk > 0 ? "#EF4444" : "#94A3B8"}
                />
                <KpiCard
                  icon="person_off"
                  label="Unassigned Open"
                  value={stats.unassigned_open}
                  sub="without assigned agent"
                  iconBg={stats.unassigned_open > 5 ? "bg-amber-50" : "bg-slate-50"}
                  color={stats.unassigned_open > 5 ? "#F59E0B" : "#94A3B8"}
                />
                <KpiCard
                  icon="stacked_line_chart"
                  label={`Conversations in ${days} days`}
                  value={stats.current_period_conversations.toLocaleString()}
                  sub={`Previous period: ${stats.prev_period_conversations.toLocaleString()}`}
                  iconBg="bg-indigo-50"
                  color="#4F46E5"
                  trend={<TrendBadge current={stats.current_period_conversations} prev={stats.prev_period_conversations} />}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Service Performance</h3>
                      <p className="mt-1 text-sm text-slate-500">Core service quality indicators grouped in one place.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{stats.closed_conversations} closed</div>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Avg First Response</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {stats.avg_first_response_minutes !== null ? `${stats.avg_first_response_minutes}m` : "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">time to first agent response</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Avg Resolution</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{formatResolutionTime(stats.avg_resolution_hours)}</p>
                      <p className="mt-1 text-xs text-slate-500">conversation close cycle</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">SLA Compliance</p>
                      <p className={`mt-2 text-2xl font-bold ${stats.sla_compliance_pct >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
                        {stats.sla_compliance_pct}%
                      </p>
                      <p className="mt-1 text-xs text-slate-500">closed conversations with response</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900">Workload Context</h3>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Messages in period</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">{stats.current_period_messages.toLocaleString()}</p>
                      </div>
                      <TrendBadge current={stats.current_period_messages} prev={stats.prev_period_messages} />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Messages Today</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">{stats.messages_today.toLocaleString()}</p>
                      </div>
                      <span className="material-symbols-outlined text-blue-500">chat_bubble</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total Conversations</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">{stats.total_conversations.toLocaleString()}</p>
                      </div>
                      <span className="material-symbols-outlined text-indigo-500">forum</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeading
                eyebrow="Operational Insight"
                title="Queue, status, and channel mix"
                description="Keep immediate workflow signals visible without repeating the same story twice."
              />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="flex flex-col rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">Conversation Status</h3>
                  <div className="flex flex-1 flex-col items-center justify-center gap-5">
                    <DonutChart
                      open={stats.open_conversations}
                      closed={stats.closed_conversations}
                      pending={stats.pending_conversations}
                      total={stats.total_conversations}
                    />
                    <div className="w-full space-y-2">
                      {[
                        { label: "Open", value: stats.open_conversations, color: "bg-indigo-600" },
                        { label: "Closed", value: stats.closed_conversations, color: "bg-emerald-500" },
                        { label: "Pending", value: stats.pending_conversations, color: "bg-amber-500" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                            <span className="text-slate-600">{label}</span>
                          </div>
                          <span className="font-semibold text-slate-900">{value}</span>
                        </div>
                      ))}
                      {stats.resolution_rate > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-sm">
                          <span className="text-slate-500">Resolution Rate</span>
                          <span className="font-semibold text-emerald-600">{stats.resolution_rate}%</span>
                        </div>
                      )}
                      {stats.unread_conversations > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Unread</span>
                          <span className="font-semibold text-orange-500">{stats.unread_conversations}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">Open Queue by Channel</h3>
                  {Object.keys(stats.queue_by_channel ?? {}).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.queue_by_channel).sort(([, a], [, b]) => b - a).map(([ch, count]) => {
                        const meta = CHANNEL_META[ch] ?? { label: ch, icon: "chat", color: "#64748B", bg: "bg-slate-50" };
                        return (
                          <div key={ch} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${meta.bg}`}>
                            <span className="material-symbols-outlined text-[18px]" style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>
                              {meta.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-700">{meta.label}</p>
                              <p className="text-xs text-slate-500">active queue</p>
                            </div>
                            <span className="text-lg font-bold text-slate-900">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-400">No open queue data yet.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Channel Snapshot</h3>
                      <p className="text-xs text-slate-500">Volume and distribution in one panel.</p>
                    </div>
                    <ChannelDonut channels={stats.channels} />
                  </div>
                  {Object.keys(stats.channels).length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">No channel data yet.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {Object.entries(stats.channels)
                        .sort(([, a], [, b]) => b - a)
                        .map(([ch, count]) => {
                          const meta = CHANNEL_META[ch] ?? { label: ch, icon: "chat", color: "#64748B", bg: "bg-slate-50" };
                          const pct = totalChannels > 0 ? (count / totalChannels) * 100 : 0;
                          return (
                            <div key={ch} className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                                <span className="material-symbols-outlined text-[16px]" style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>
                                  {meta.icon}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex items-center justify-between">
                                  <span className="text-sm font-medium text-slate-700">{meta.label}</span>
                                  <span className="text-sm text-slate-500">
                                    {count} <span className="text-xs text-slate-400">({pct.toFixed(0)}%)</span>
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeading
                eyebrow="Trend and Performance"
                title="Volume and resolution analysis"
                description="Use this layer for follow-up analysis after reviewing the operational summary."
              />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">New Conversations</h3>
                    <span className="text-xs text-slate-400">Last {days} days</span>
                  </div>
                  <BarChart data={stats.daily_conversations} prevData={stats.prev_daily_conversations} color="#4F46E5" />
                  <div className="mt-1 text-xs text-slate-500">{stats.current_period_conversations} conversations in this period</div>
                </div>

                <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Messages Exchanged</h3>
                    <span className="text-xs text-slate-400">Last {days} days</span>
                  </div>
                  <BarChart data={stats.daily_messages} prevData={stats.prev_daily_messages} color="#2563EB" />
                  <div className="mt-1 text-xs text-slate-500">{stats.current_period_messages} messages in this period</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">Resolution Time Percentiles</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Average", value: stats.avg_resolution_hours, color: "#4F46E5", width: 60 },
                      { label: "P50 (median)", value: stats.p50_resolution_hours, color: "#2563EB", width: 50 },
                      { label: "P90", value: stats.p90_resolution_hours, color: "#F97316", width: 80 },
                    ].map(({ label, value, color, width }) => (
                      <div key={label}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm text-slate-600">{label}</span>
                          <span className="text-sm font-semibold text-slate-900">{formatResolutionTime(value)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div className="h-full rounded-full transition-all" style={{ width: value !== null ? `${Math.min(width, 100)}%` : "0%", backgroundColor: color }} />
                        </div>
                      </div>
                    ))}
                    <p className="pt-1 text-xs text-slate-400">Based on closed conversations in the last {days} days.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900">Reserved Expansion Area</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Keep room for future widgets tied to Projects, Tasks, CRM follow-up, or Catalog-linked business summaries.
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-3">
                    {["Project pipeline snapshot", "Task backlog health", "CRM follow-up indicators", "Catalog performance summary"].map((item) => (
                      <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeading
                eyebrow="Secondary Strategic Layer"
                title="Team performance and AI adoption"
                description="Useful for management review, but intentionally below the first-response operational layer."
              />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                {(stats.agent_stats ?? []).length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm">
                    <div className="border-b border-[#E9ECEF] bg-slate-50/50 px-5 py-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Agent Performance</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F1F3F5]">
                          {["Agent", "Handled", "Resolved", "Resolution Rate", "Avg 1st Response"].map((h) => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F8F9FA]">
                        {(stats.agent_stats ?? []).map((agent) => (
                          <tr key={agent.id} className="transition-colors hover:bg-slate-50/50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                  {agent.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <span className="font-medium text-slate-800">{agent.full_name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 font-semibold text-slate-700">{agent.conversations_handled}</td>
                            <td className="px-5 py-3 text-slate-600">{agent.resolved}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-green-500" style={{ width: `${agent.resolution_rate}%` }} />
                                </div>
                                <span className={`text-xs font-semibold ${agent.resolution_rate >= 80 ? "text-green-600" : agent.resolution_rate >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                                  {agent.resolution_rate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-600">{agent.avg_first_response_min !== null ? `${agent.avg_first_response_min}m` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">AI Adoption Summary</h3>
                      <p className="mt-1 text-sm text-slate-500">Compact view of how often the team is using AI assistance.</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${(stats.ai_adoption_pct ?? 0) >= 50 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {(stats.ai_adoption_pct ?? 0)}%
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">AI Suggestions Generated</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{(stats.ai_suggestions_generated ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Conversations with AI</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{(stats.convs_with_ai ?? 0).toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-500">of {stats.total_conversations} total conversations</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Adoption Readout</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {(stats.ai_adoption_pct ?? 0) >= 50
                          ? "AI assistance is already part of the team workflow."
                          : "AI usage is still emerging and has room to grow."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
