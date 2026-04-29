"use client";

import { useState, useEffect, useCallback } from "react";
import { auditApi } from "@/lib/api/index";
import type { AuditLog } from "@/lib/api/audit";

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  create_user:       { label: "User Created",          color: "bg-green-50 text-green-700",   icon: "person_add"      },
  update_user:       { label: "User Updated",          color: "bg-blue-50 text-blue-700",     icon: "edit"            },
  delete_user:       { label: "User Deleted",          color: "bg-red-50 text-red-700",       icon: "person_remove"   },
  approve_user:      { label: "User Approved",         color: "bg-emerald-50 text-emerald-700", icon: "verified_user" },
  reject_user:       { label: "User Rejected",         color: "bg-orange-50 text-orange-700", icon: "person_off"      },
  enable_user:       { label: "User Enabled",          color: "bg-teal-50 text-teal-700",     icon: "toggle_on"       },
  disable_user:      { label: "User Disabled",         color: "bg-slate-100 text-slate-600",  icon: "toggle_off"      },
  create_user_type:  { label: "Role Created",          color: "bg-purple-50 text-purple-700", icon: "badge"           },
  update_user_type:  { label: "Role Updated",          color: "bg-indigo-50 text-indigo-700", icon: "manage_accounts" },
  delete_user_type:  { label: "Role Deleted",          color: "bg-red-50 text-red-700",       icon: "no_accounts"     },
  update_settings:   { label: "Settings Changed",      color: "bg-amber-50 text-amber-700",   icon: "settings"        },
  change_user_password: { label: "Password Changed",   color: "bg-slate-50 text-slate-700",   icon: "lock_reset"      },
};

const RESOURCE_FILTERS = [
  { value: "", label: "All resources" },
  { value: "user", label: "Users" },
  { value: "user_type", label: "Roles" },
  { value: "settings", label: "Settings" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_LABELS[action] ?? { label: action, color: "bg-slate-100 text-slate-600", icon: "history" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

function DetailCell({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) return <span className="text-slate-400 text-xs">—</span>;

  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return <span className="text-slate-400 text-xs">—</span>;

  return (
    <div className="flex flex-wrap gap-1 max-w-xs">
      {entries.slice(0, 4).map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 font-mono max-w-[180px] truncate" title={`${k}: ${String(v)}`}>
          <span className="text-slate-400 font-sans font-medium">{k}:</span>
          <span>{String(v)}</span>
        </span>
      ))}
      {entries.length > 4 && (
        <span className="text-[11px] text-slate-400">+{entries.length - 4} more</span>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async (p: number, resource: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await auditApi.listAuditLogs({
        resource_type: resource || undefined,
        skip: (p - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setLogs(res.data);
      setTotal(res.meta?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page, resourceFilter);
  }, [page, resourceFilter, fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = search.trim()
    ? logs.filter(l => {
        const q = search.toLowerCase();
        return (
          l.action.includes(q) ||
          l.user?.full_name?.toLowerCase().includes(q) ||
          l.user?.email?.toLowerCase().includes(q) ||
          l.resource_type?.toLowerCase().includes(q) ||
          l.ip_address?.includes(q)
        );
      })
    : logs;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-[#E9ECEF] bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[18px] font-semibold text-slate-900">Audit Log</h1>
          {!loading && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {total.toLocaleString()} entries
            </span>
          )}
        </div>
        <button
          onClick={() => fetchLogs(page, resourceFilter)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </header>

      {/* Filters */}
      <div className="px-6 py-3 bg-white border-b border-[#E9ECEF] flex items-center gap-3 shrink-0">
        {/* Search */}
        <div className="relative flex items-center">
          <span className="absolute left-3 material-symbols-outlined text-[16px] text-slate-400">search</span>
          <input
            type="text"
            placeholder="Search by actor, action, IP…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/10 outline-none w-64 transition-all"
          />
        </div>

        {/* Resource type filter */}
        <select
          value={resourceFilter}
          onChange={e => { setResourceFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-[#7C4DFF] outline-none cursor-pointer text-slate-700"
        >
          {RESOURCE_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin mr-3">progress_activity</span>
            Loading audit logs…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <span className="material-symbols-outlined text-5xl opacity-40">policy</span>
            <p className="text-sm">{search ? "No results match your search." : "No audit records yet."}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E9ECEF] bg-slate-50/70">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-5 py-3.5">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-slate-800 text-sm leading-tight">{log.user.full_name}</p>
                          <p className="text-xs text-slate-400">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">{String(log.user_id).slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.resource_type ? (
                        <div>
                          <span className="text-xs font-semibold text-slate-600 capitalize">{log.resource_type.replace("_", " ")}</span>
                          {log.resource_id && (
                            <p className="text-[11px] text-slate-400 font-mono">{log.resource_id.slice(0, 8)}…</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <DetailCell details={log.details} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-500 font-mono">{log.ip_address ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-slate-500">{formatDate(log.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages} — {total.toLocaleString()} total entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-9 px-4 rounded-xl border border-[#E9ECEF] text-sm text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-9 px-4 rounded-xl border border-[#E9ECEF] text-sm text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
