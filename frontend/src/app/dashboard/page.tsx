"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getStoredUser } from "@/lib/api";
import { dashboardApi } from "@/lib/api/index";
import type { DashboardStats, DayPoint, AgentStat } from "@/types/chat";
import type { StoredUser } from "@/types/auth";

// ── Constants ──────────────────────────────────────────────────────────────

const CHANNEL_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  TELEGRAM: { label: "Telegram",  icon: "send",     color: "#0088CC", bg: "bg-blue-50"   },
  WHATSAPP: { label: "WhatsApp",  icon: "chat",     color: "#25D366", bg: "bg-green-50"  },
  EMAIL:    { label: "Email",     icon: "mail",     color: "#F97316", bg: "bg-orange-50" },
  SMS:      { label: "SMS",       icon: "sms",      color: "#8B5CF6", bg: "bg-purple-50" },
  WEB:      { label: "Web Chat",  icon: "language", color: "#64748B", bg: "bg-slate-50"  },
};

const DATE_RANGES = [
  { label: "7 days",  value: 7  },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

const REFRESH_INTERVAL_MS = 60_000;

// ── Helpers ────────────────────────────────────────────────────────────────

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

function TrendBadge({ current, prev }: { current: number; prev: number }) {
  const pct = pctChange(current, prev);
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
      <span className="material-symbols-outlined text-[12px]">{up ? "arrow_upward" : "arrow_downward"}</span>
      {Math.abs(pct)}%
    </span>
  );
}

function KpiCard({
  icon, label, value, sub, color, iconBg, trend,
}: {
  icon: string; label: string; value: string | number; sub?: string;
  color: string; iconBg: string; trend?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[20px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {trend ?? (sub && <span className="text-xs text-slate-400">{sub}</span>)}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 leading-none mb-1">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function BarChart({
  data,
  prevData,
  color = "#7C4DFF",
}: {
  data: DayPoint[];
  prevData?: DayPoint[];
  color?: string;
}) {
  const allCounts = [
    ...data.map((d) => d.count),
    ...(prevData ?? []).map((d) => d.count),
  ];
  const max = Math.max(...allCounts, 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-1.5 h-32 w-full">
        {data.map((d, i) => {
          const prev = prevData?.[i];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full group">
              <div className="flex-1 w-full flex items-end gap-px relative">
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                    {d.count} {prev !== undefined && <span className="opacity-60 ml-1">vs {prev.count}</span>}
                  </div>
                </div>
                {/* Previous period bar (behind, lighter) */}
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
                {/* Current period bar */}
                <div
                  className="flex-1 rounded-t-md transition-all"
                  style={{
                    height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%`,
                    backgroundColor: d.count > 0 ? color : "#E2E8F0",
                    opacity: d.count > 0 ? 1 : 0.4,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{d.date}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {prevData && (
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span>Período atual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.25 }} />
            <span>Período anterior</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Channel Donut (Story 6.3) ─────────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, string> = {
  TELEGRAM: "#0088CC",
  WHATSAPP: "#25D366",
  EMAIL:    "#F97316",
  SMS:      "#8B5CF6",
  WEB:      "#64748B",
};

function ChannelDonut({ channels }: { channels: Record<string, number> }) {
  const total = Object.values(channels).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="w-24 h-24 rounded-full border-[10px] border-slate-100 flex items-center justify-center shrink-0">
        <span className="text-[10px] text-slate-400">No data</span>
      </div>
    );
  }
  const entries = Object.entries(channels).sort(([,a],[,b]) => b - a);
  let cursor = 0;
  const stops = entries.map(([ch, count]) => {
    const pct = (count / total) * 100;
    const color = CHANNEL_COLORS[ch] ?? "#94A3B8";
    const stop = `${color} ${cursor}% ${cursor + pct}%`;
    cursor += pct;
    return stop;
  });
  const gradient = `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="w-24 h-24 rounded-full flex items-center justify-center shrink-0" style={{ background: gradient }}>
      <div className="w-14 h-14 bg-white rounded-full flex flex-col items-center justify-center">
        <p className="text-sm font-bold text-slate-900 leading-none">{total}</p>
        <p className="text-[9px] text-slate-400">total</p>
      </div>
    </div>
  );
}

function DonutChart({ open, closed, pending, total }: { open: number; closed: number; pending: number; total: number }) {
  if (total === 0) {
    return (
      <div className="w-32 h-32 rounded-full border-[12px] border-slate-100 flex items-center justify-center">
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }
  const openPct   = (open   / total) * 100;
  const closedPct = (closed / total) * 100;
  const pendPct   = (pending / total) * 100;

  const gradient = `conic-gradient(
    #7C4DFF 0% ${openPct}%,
    #10B981 ${openPct}% ${openPct + closedPct}%,
    #F59E0B ${openPct + closedPct}% ${openPct + closedPct + pendPct}%,
    #E2E8F0 ${openPct + closedPct + pendPct}% 100%
  )`;

  return (
    <div className="w-32 h-32 rounded-full flex items-center justify-center shrink-0" style={{ background: gradient }}>
      <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center">
        <p className="text-lg font-bold text-slate-900 leading-none">{total}</p>
        <p className="text-[10px] text-slate-400">total</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [days, setDays]     = useState(7);
  const [user, setUser]     = useState<StoredUser | null>(null);
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

  // Initial load
  useEffect(() => {
    setUser(getStoredUser<StoredUser>());
    fetchStats(days, true);
  }, []);

  // Re-fetch when date range changes
  useEffect(() => {
    fetchStats(days, true);
  }, [days, fetchStats]);

  // Auto-refresh every 60s
  useEffect(() => {
    timerRef.current = setInterval(() => fetchStats(days), REFRESH_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [days, fetchStats]);

  const totalChannels = stats
    ? Object.values(stats.channels).reduce((a, b) => a + b, 0)
    : 0;

  const userInitials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const formatResolutionTime = (hours: number | null) => {
    if (hours === null) return "—";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="h-16 border-b border-[#E9ECEF] bg-white flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">

          {/* Date range selector */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {DATE_RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setDays(r.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  days === r.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Last refresh */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-[#E9ECEF] text-xs text-slate-500">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {user && (
            <div className="w-8 h-8 rounded-full bg-purple-100 text-[#632ce5] flex items-center justify-center text-xs font-bold">
              {user.avatar
                ? <img src={user.avatar} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                : userInitials}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32 text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin mr-3">progress_activity</span>
            Loading analytics...
          </div>
        ) : stats && (
          <>
            {/* ── KPI Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                icon="forum"            label="Total Conversations"
                value={stats.total_conversations.toLocaleString()}
                iconBg="bg-purple-50"   color="#7C4DFF"
              />
              <KpiCard
                icon="mark_chat_unread" label="Open Conversations"
                value={stats.open_conversations.toLocaleString()}
                sub={`${stats.pending_conversations} pending`}
                iconBg="bg-orange-50"   color="#F97316"
              />
              <KpiCard
                icon="chat_bubble"      label="Messages Today"
                value={stats.messages_today.toLocaleString()}
                iconBg="bg-blue-50"     color="#3B82F6"
              />
              <KpiCard
                icon="timer"            label="Avg Resolution Time"
                value={formatResolutionTime(stats.avg_resolution_hours)}
                sub={stats.avg_resolution_hours !== null ? `${stats.closed_conversations} closed` : "No closed yet"}
                iconBg="bg-teal-50"     color="#14B8A6"
              />
            </div>

            {/* ── SLA & Queue Health (Epic 3) ───────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                icon="warning"          label="SLA at Risk"
                value={stats.sla_at_risk}
                sub={`>${stats.sla_threshold_minutes}min sem resposta`}
                iconBg={stats.sla_at_risk > 0 ? "bg-red-50" : "bg-slate-50"}
                color={stats.sla_at_risk > 0 ? "#EF4444" : "#94A3B8"}
              />
              <KpiCard
                icon="verified"         label="SLA Compliance"
                value={`${stats.sla_compliance_pct}%`}
                sub="conversas fechadas com resposta"
                iconBg={stats.sla_compliance_pct >= 80 ? "bg-green-50" : "bg-yellow-50"}
                color={stats.sla_compliance_pct >= 80 ? "#10B981" : "#F59E0B"}
              />
              <KpiCard
                icon="speed"            label="Avg First Response"
                value={stats.avg_first_response_minutes !== null ? `${stats.avg_first_response_minutes}m` : "—"}
                sub="tempo até 1ª resposta do agente"
                iconBg="bg-indigo-50"   color="#6366F1"
              />
              <KpiCard
                icon="person_off"       label="Unassigned Open"
                value={stats.unassigned_open}
                sub="sem agente atribuído"
                iconBg={stats.unassigned_open > 5 ? "bg-orange-50" : "bg-slate-50"}
                color={stats.unassigned_open > 5 ? "#F97316" : "#94A3B8"}
              />
            </div>

            {/* ── Period comparison strip ────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5 flex items-center gap-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-[#7C4DFF]" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-1">Conversations — last {days} days</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-2xl font-bold text-slate-900">{stats.current_period_conversations}</p>
                    <TrendBadge current={stats.current_period_conversations} prev={stats.prev_period_conversations} />
                    <span className="text-xs text-slate-400">vs prev {days}d ({stats.prev_period_conversations})</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5 flex items-center gap-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-[#3B82F6]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-1">Messages — last {days} days</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-2xl font-bold text-slate-900">{stats.current_period_messages}</p>
                    <TrendBadge current={stats.current_period_messages} prev={stats.prev_period_messages} />
                    <span className="text-xs text-slate-400">vs prev {days}d ({stats.prev_period_messages})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Queue by Channel (Story 3.4) ──────────────────────── */}
            {Object.keys(stats.queue_by_channel ?? {}).length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Open Queue by Channel</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.queue_by_channel).sort(([,a],[,b]) => b - a).map(([ch, count]) => {
                    const meta = CHANNEL_META[ch] ?? { label: ch, icon: "chat", color: "#64748B", bg: "bg-slate-50" };
                    return (
                      <div key={ch} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${meta.bg} border border-transparent`}>
                        <span className="material-symbols-outlined text-[18px]" style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                        <div>
                          <p className="text-xs text-slate-500">{meta.label}</p>
                          <p className="text-lg font-bold text-slate-900 leading-none">{count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Middle row ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

              {/* Channel breakdown — 2 cols */}
              <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E9ECEF] p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Volume by Channel</h2>
                {Object.keys(stats.channels).length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No channel data yet.</p>
                ) : (
                  <div className="space-y-3.5">
                    {Object.entries(stats.channels)
                      .sort(([, a], [, b]) => b - a)
                      .map(([ch, count]) => {
                        const meta = CHANNEL_META[ch] ?? { label: ch, icon: "chat", color: "#64748B", bg: "bg-slate-50" };
                        const pct = totalChannels > 0 ? (count / totalChannels) * 100 : 0;
                        return (
                          <div key={ch} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                              <span className="material-symbols-outlined text-[16px]" style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>
                                {meta.icon}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-slate-700">{meta.label}</span>
                                <span className="text-sm text-slate-500">{count} <span className="text-slate-400 text-xs">({pct.toFixed(0)}%)</span></span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Status donut — 1 col */}
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5 flex flex-col">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Conversation Status</h2>
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                  <DonutChart
                    open={stats.open_conversations}
                    closed={stats.closed_conversations}
                    pending={stats.pending_conversations}
                    total={stats.total_conversations}
                  />
                  <div className="w-full space-y-2">
                    {[
                      { label: "Open",    value: stats.open_conversations,    color: "bg-[#7C4DFF]" },
                      { label: "Closed",  value: stats.closed_conversations,  color: "bg-[#10B981]" },
                      { label: "Pending", value: stats.pending_conversations, color: "bg-[#F59E0B]" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="text-slate-600">{label}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{value}</span>
                      </div>
                    ))}
                    {stats.resolution_rate > 0 && (
                      <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Resolution Rate</span>
                        <span className="font-semibold text-green-600">{stats.resolution_rate}%</span>
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
            </div>

            {/* ── Charts row ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* Conversations trend */}
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-900">New Conversations</h2>
                  <span className="text-xs text-slate-400">Last {days} days</span>
                </div>
                <BarChart data={stats.daily_conversations} prevData={stats.prev_daily_conversations} color="#7C4DFF" />
                <div className="mt-1 text-xs text-slate-500">
                  {stats.current_period_conversations} conversas neste período
                </div>
              </div>

              {/* Messages trend */}
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-900">Messages Exchanged</h2>
                  <span className="text-xs text-slate-400">Last {days} days</span>
                </div>
                <BarChart data={stats.daily_messages} prevData={stats.prev_daily_messages} color="#3B82F6" />
                <div className="mt-1 text-xs text-slate-500">
                  {stats.current_period_messages} mensagens neste período
                </div>
              </div>
            </div>

            {/* ── Resolution Percentiles + Channel Donut (Stories 6.3, 6.4) ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* P50 / P90 resolution times */}
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Resolution Time Percentiles</h2>
                <div className="space-y-4">
                  {[
                    { label: "Average", value: stats.avg_resolution_hours, color: "#7C4DFF", width: 60 },
                    { label: "P50 (median)", value: stats.p50_resolution_hours, color: "#3B82F6", width: 50 },
                    { label: "P90", value: stats.p90_resolution_hours, color: "#F97316", width: 80 },
                  ].map(({ label, value, color, width }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-slate-600">{label}</span>
                        <span className="text-sm font-semibold text-slate-900">{formatResolutionTime(value)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: value !== null ? `${Math.min(width, 100)}%` : "0%", backgroundColor: color }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 pt-1">Based on closed conversations in the last {days} days.</p>
                </div>
              </div>

              {/* Channel distribution donut (Story 6.3) */}
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Channel Distribution</h2>
                <div className="flex items-center gap-6">
                  <ChannelDonut channels={stats.channels} />
                  <div className="flex-1 space-y-2.5">
                    {Object.entries(stats.channels).sort(([,a],[,b]) => b - a).map(([ch, count]) => {
                      const meta = CHANNEL_META[ch] ?? { label: ch, color: "#64748B", bg: "bg-slate-50", icon: "chat" };
                      const pct = totalChannels > 0 ? Math.round(count / totalChannels * 100) : 0;
                      return (
                        <div key={ch} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                            <span className="text-slate-600">{meta.label}</span>
                          </div>
                          <span className="font-semibold text-slate-900">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Agent Performance Table (Story 6.5) ───────────────── */}
            {(stats.agent_stats ?? []).length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[#E9ECEF] bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Agent Performance</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F1F3F5]">
                      {["Agent", "Handled", "Resolved", "Resolution Rate", "Avg 1st Response"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8F9FA]">
                    {(stats.agent_stats ?? []).map(agent => (
                      <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-[#7C4DFF] flex items-center justify-center text-xs font-bold">
                              {agent.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span className="font-medium text-slate-800">{agent.full_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{agent.conversations_handled}</td>
                        <td className="px-5 py-3 text-slate-600">{agent.resolved}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-green-500" style={{ width: `${agent.resolution_rate}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${agent.resolution_rate >= 80 ? "text-green-600" : agent.resolution_rate >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                              {agent.resolution_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {agent.avg_first_response_min !== null ? `${agent.avg_first_response_min}m` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── AI Adoption (Story 6.5) ───────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <KpiCard
                icon="auto_awesome"   label="AI Suggestions Generated"
                value={(stats.ai_suggestions_generated ?? 0).toLocaleString()}
                iconBg="bg-purple-50" color="#7C4DFF"
              />
              <KpiCard
                icon="smart_toy"      label="Conversations with AI"
                value={(stats.convs_with_ai ?? 0).toLocaleString()}
                sub={`of ${stats.total_conversations} total`}
                iconBg="bg-indigo-50" color="#6366F1"
              />
              <KpiCard
                icon="psychology"     label="AI Adoption Rate"
                value={`${stats.ai_adoption_pct ?? 0}%`}
                sub="conversas com pelo menos 1 sugestão"
                iconBg={(stats.ai_adoption_pct ?? 0) >= 50 ? "bg-green-50" : "bg-slate-50"}
                color={(stats.ai_adoption_pct ?? 0) >= 50 ? "#10B981" : "#94A3B8"}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
