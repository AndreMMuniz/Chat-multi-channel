"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { proposalsApi } from "@/lib/api";
import type { ProposalCreateRequest, ProposalDetailDto, ProposalDto, ProposalItemDto, ProposalStatus } from "@/types/proposal";

const STATUS_META: Record<ProposalStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" },
  sent: { label: "Sent", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  rejected: { label: "Rejected", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
  archived: { label: "Archived", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
};

type ProposalFormState = {
  title: string;
  customer_name: string;
  notes: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function ProposalsPage() {
  const searchParams = useSearchParams();
  const requestedProposalId = searchParams.get("proposalId");
  const [proposals, setProposals] = useState<ProposalDto[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ProposalDetailDto | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(requestedProposalId);
  const [proposalForm, setProposalForm] = useState<ProposalFormState>({ title: "", customer_name: "", notes: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "ALL">("ALL");

  const loadProposals = useCallback(async (preserveSelection: boolean) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await proposalsApi.listProposals({ limit: 200 });
      setProposals(response.data);

      if (!preserveSelection) {
        setSelectedProposalId(requestedProposalId ?? response.data[0]?.id ?? null);
        return;
      }

      if (!response.data.some((proposal) => proposal.id === selectedProposalId)) {
        setSelectedProposalId(response.data[0]?.id ?? null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load proposals.");
    } finally {
      setIsLoading(false);
    }
  }, [requestedProposalId, selectedProposalId]);

  const loadProposalDetail = useCallback(async (proposalId: string) => {
    try {
      setIsDetailLoading(true);
      const proposal = await proposalsApi.getProposal(proposalId);
      setSelectedProposal(proposal);
      setProposalForm({
        title: proposal.title,
        customer_name: proposal.customer_name ?? "",
        notes: proposal.notes ?? "",
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load proposal details.");
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProposals(false);
    });
  }, [loadProposals]);

  useEffect(() => {
    if (!selectedProposalId) return;
    queueMicrotask(() => {
      void loadProposalDetail(selectedProposalId);
    });
  }, [loadProposalDetail, selectedProposalId]);

  async function handleStatusChange(status: ProposalStatus) {
    if (!selectedProposal) return;
    try {
      setIsUpdating(true);
      setActionMessage(null);
      await proposalsApi.updateProposal(selectedProposal.id, { status } satisfies Partial<ProposalCreateRequest>);
      await Promise.all([loadProposals(true), loadProposalDetail(selectedProposal.id)]);
      setActionMessage(`Proposal marked as ${status}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update proposal status.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleProposalMetaSave() {
    if (!selectedProposal) return;
    try {
      setIsUpdating(true);
      setActionMessage(null);
      await proposalsApi.updateProposal(selectedProposal.id, {
        title: proposalForm.title.trim(),
        customer_name: proposalForm.customer_name.trim() || null,
        notes: proposalForm.notes.trim() || null,
      });
      await Promise.all([loadProposals(true), loadProposalDetail(selectedProposal.id)]);
      setActionMessage("Proposal details updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update proposal details.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleItemUpdate(proposalItemId: string, payload: { quantity?: number; discount_amount?: number }) {
    if (!selectedProposal) return;
    try {
      setIsUpdating(true);
      setActionMessage(null);
      const updated = await proposalsApi.updateProposalItem(selectedProposal.id, proposalItemId, payload);
      setSelectedProposal(updated);
      setProposalForm({
        title: updated.title,
        customer_name: updated.customer_name ?? "",
        notes: updated.notes ?? "",
      });
      await loadProposals(true);
      setActionMessage("Proposal item updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update proposal item.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleItemRemove(proposalItemId: string) {
    if (!selectedProposal) return;
    try {
      setIsUpdating(true);
      setActionMessage(null);
      const updated = await proposalsApi.deleteProposalItem(selectedProposal.id, proposalItemId);
      setSelectedProposal(updated);
      setProposalForm({
        title: updated.title,
        customer_name: updated.customer_name ?? "",
        notes: updated.notes ?? "",
      });
      await loadProposals(true);
      setActionMessage("Proposal item removed.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to remove proposal item.");
    } finally {
      setIsUpdating(false);
    }
  }

  const visibleProposals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return proposals.filter((proposal) => {
      const matchesQuery =
        query.length === 0 ||
        [proposal.reference, proposal.title, proposal.customer_name ?? "", proposal.created_by_name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "ALL" || proposal.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  const summary = useMemo(
    () => ({
      total: proposals.length,
      draft: proposals.filter((proposal) => proposal.status === "draft").length,
      sent: proposals.filter((proposal) => proposal.status === "sent").length,
      value: proposals.reduce((sum, proposal) => sum + proposal.total_amount, 0),
    }),
    [proposals]
  );

  return (
    <main className="flex-1 overflow-y-auto bg-[#F6F8FC]">
      <div className="flex min-h-full flex-col">
        <header className="border-b border-[#E6EBF3] bg-white">
          <div className="flex flex-col gap-4 px-6 py-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  request_quote
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[18px] font-semibold leading-5 text-slate-900">Proposals</h1>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Draft and reusable commercial proposals generated from catalog items.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex min-w-[280px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by reference, title, or customer"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ProposalStatus | "ALL")}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none"
              >
                <option value="ALL">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[#EEF2F7] px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total proposals", value: summary.total, accent: "text-slate-900", icon: "description" },
              { label: "Drafts", value: summary.draft, accent: "text-slate-700", icon: "edit_note" },
              { label: "Sent", value: summary.sent, accent: "text-sky-700", icon: "send" },
              { label: "Pipeline value", value: formatCurrency(summary.value), accent: "text-emerald-700", icon: "payments" },
            ].map((card) => (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                  <span className={`material-symbols-outlined text-[18px] ${card.accent}`}>{card.icon}</span>
                </div>
                <p className={`mt-3 text-2xl font-semibold ${card.accent}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {errorMessage ? (
            <div className="border-t border-rose-100 bg-rose-50 px-6 py-3 text-sm text-rose-700">{errorMessage}</div>
          ) : null}
          {actionMessage ? (
            <div className="border-t border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-700">{actionMessage}</div>
          ) : null}
        </header>

        <div className="grid flex-1 gap-4 px-4 py-4 lg:px-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Proposal queue</h2>
              <p className="mt-1 text-xs text-slate-500">
                {isLoading ? "Loading proposals..." : `${visibleProposals.length} proposals in the current view`}
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {visibleProposals.map((proposal) => {
                const isSelected = proposal.id === selectedProposalId;
                const statusMeta = STATUS_META[proposal.status];
                return (
                  <button
                    key={proposal.id}
                    type="button"
                    onClick={() => setSelectedProposalId(proposal.id)}
                    className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 ${
                      isSelected ? "bg-amber-50/50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{proposal.reference}</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{proposal.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {proposal.customer_name || "No customer yet"} · {proposal.items_count} items
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(proposal.updated_at)}</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(proposal.total_amount)}</span>
                    </div>
                  </button>
                );
              })}

              {!isLoading && visibleProposals.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <span className="material-symbols-outlined">request_quote</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">No proposals found</h3>
                  <p className="mt-1 text-sm text-slate-500">Create one from the catalog to start the commercial flow.</p>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            {selectedProposalId && selectedProposal ? (
              <ProposalDetail
                proposal={selectedProposal}
                proposalForm={proposalForm}
                isLoading={isDetailLoading}
                isUpdating={isUpdating}
                onProposalFormChange={setProposalForm}
                onProposalMetaSave={handleProposalMetaSave}
                onStatusChange={handleStatusChange}
                onItemUpdate={handleItemUpdate}
                onItemRemove={handleItemRemove}
              />
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <h2 className="mt-4 text-sm font-semibold text-slate-900">Select a proposal</h2>
                <p className="mt-1 text-sm text-slate-500">Pick a proposal from the list to inspect item snapshots and totals.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function ProposalDetail({
  proposal,
  proposalForm,
  isLoading,
  isUpdating,
  onProposalFormChange,
  onProposalMetaSave,
  onStatusChange,
  onItemUpdate,
  onItemRemove,
}: {
  proposal: ProposalDetailDto;
  proposalForm: ProposalFormState;
  isLoading: boolean;
  isUpdating: boolean;
  onProposalFormChange: React.Dispatch<React.SetStateAction<ProposalFormState>>;
  onProposalMetaSave: () => void;
  onStatusChange: (status: ProposalStatus) => void;
  onItemUpdate: (proposalItemId: string, payload: { quantity?: number; discount_amount?: number }) => void;
  onItemRemove: (proposalItemId: string) => void;
}) {
  const statusMeta = STATUS_META[proposal.status];
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{proposal.reference}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{proposal.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{proposal.customer_name || "No customer assigned"}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
            <select
              value={proposal.status}
              onChange={(event) => onStatusChange(event.target.value as ProposalStatus)}
              disabled={isUpdating}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none disabled:opacity-60"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-100 px-5 py-4 sm:grid-cols-3">
        <Metric label="Subtotal" value={formatCurrency(proposal.subtotal_amount)} />
        <Metric label="Discount" value={formatCurrency(proposal.discount_amount)} />
        <Metric label="Total" value={formatCurrency(proposal.total_amount)} />
      </div>

      <div className="border-b border-slate-100 px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Proposal title</span>
            <input
              value={proposalForm.title}
              onChange={(event) => onProposalFormChange((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Customer</span>
            <input
              value={proposalForm.customer_name}
              onChange={(event) => onProposalFormChange((current) => ({ ...current, customer_name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
          </label>
        </div>
        <label className="mt-3 block space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Notes</span>
          <textarea
            value={proposalForm.notes}
            onChange={(event) => onProposalFormChange((current) => ({ ...current, notes: event.target.value }))}
            className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
          />
        </label>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={isUpdating}
            onClick={onProposalMetaSave}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            Save details
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Snapshot items</p>
            <p className="mt-1 text-xs text-slate-500">{proposal.items.length} items preserved from catalog state at insertion time.</p>
          </div>
          {isLoading ? <span className="text-xs font-medium text-slate-500">Refreshing...</span> : null}
        </div>

        <div className="space-y-3">
          {proposal.items.map((item) => (
            <ProposalItemCard
              key={`${item.id}:${item.quantity}:${item.discount_amount}`}
              item={item}
              isUpdating={isUpdating}
              onItemUpdate={onItemUpdate}
              onItemRemove={onItemRemove}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ProposalItemCard({
  item,
  isUpdating,
  onItemUpdate,
  onItemRemove,
}: {
  item: ProposalItemDto;
  isUpdating: boolean;
  onItemUpdate: (proposalItemId: string, payload: { quantity?: number; discount_amount?: number }) => void;
  onItemRemove: (proposalItemId: string) => void;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [discountAmount, setDiscountAmount] = useState(String(item.discount_amount));

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.commercial_name_snapshot}</p>
          <p className="mt-1 text-xs text-slate-500">
            {item.catalog_reference_code || item.sku_snapshot || item.category_snapshot} · {item.type_snapshot}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">x{item.quantity}</span>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onItemRemove(item.id)}
            className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.commercial_description_snapshot}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Quantity</span>
          <div className="flex gap-2">
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              inputMode="numeric"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onItemUpdate(item.id, { quantity: Math.max(Number(quantity || 1), 1) })}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Discount</span>
          <div className="flex gap-2">
            <input
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
              inputMode="numeric"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onItemUpdate(item.id, { discount_amount: Math.max(Number(discountAmount || 0), 0) })}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Unit price" value={formatCurrency(item.unit_price)} />
        <Metric label="Discount" value={formatCurrency(item.discount_amount)} />
        <Metric label="Line total" value={formatCurrency(item.total_amount)} />
      </div>
    </article>
  );
}
