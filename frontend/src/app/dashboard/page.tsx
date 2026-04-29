"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getStoredUser } from "@/lib/api";
import { dashboardApi } from "@/lib/api/index";
import type { DashboardStats, DayPoint } from "@/types/chat";
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

function BarChart({ data, color = "#7C4DFF" }: { data: DayPoint[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full group">
          <div className="flex-1 w-full flex items-end relative">
            {d.count > 0 && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {d.count}
              </div>
            )}
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%`,
                backgroundColor: d.count > 0 ? color : "#E2E8F0",
                opacity: d.count > 0 ? 1 : 0.4,
              }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{d.date}</span>
        </div>
      ))}
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
                <BarChart data={stats.daily_conversations} color="#7C4DFF" />
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#7C4DFF]" />
                  <span className="text-xs text-slate-500">
                    {stats.current_period_conversations} conversations this period
                  </span>
                </div>
              </div>

              {/* Messages trend */}
              <div className="bg-white rounded-2xl border border-[#E9ECEF] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-900">Messages Exchanged</h2>
                  <span className="text-xs text-slate-400">Last {days} days</span>
                </div>
                <BarChart data={stats.daily_messages} color="#3B82F6" />
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  <span className="text-xs text-slate-500">
                    {stats.current_period_messages} messages this period
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
