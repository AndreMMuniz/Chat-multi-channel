"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/shared/Modal";
import { clientsApi, proposalsApi } from "@/lib/api/index";
import type { ProposalCreateRequest, ProposalDetailDto, ProposalDto, ProposalItemDto, ProposalStatus, ProposalType } from "@/types/proposal";
import type { ClientListDto } from "@/types/client";

// ─── status meta ─────────────────────────────────────────────────────────────

const STATUS_META: Record<ProposalStatus, { label: string; className: string }> = {
  draft:     { label: "Rascunho",  className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" },
  sent:      { label: "Enviada",   className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  approved:  { label: "Aprovada",  className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  rejected:  { label: "Recusada",  className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
  archived:  { label: "Arquivada", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  expired:   { label: "Expirada",  className: "bg-orange-50 text-orange-700 ring-1 ring-orange-100" },
  cancelled: { label: "Cancelada", className: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" },
};

const PAYMENT_PRESETS = [
  "À vista",
  "50% na assinatura + 50% na entrega",
  "30/60/90 dias",
  "Mensal (recorrente)",
  "Personalizado",
];

// ─── tipos locais ─────────────────────────────────────────────────────────────

type ProposalFormState = {
  title: string;
  customer_name: string;
  notes: string;
  client_id: string;
  proposal_type: ProposalType | "";
  payment_method: string;
  payment_terms: string;
  payment_installments: string;
  delivery_mode: "date" | "days";
  delivery_deadline: string;
  delivery_days: string;
  valid_until: string;
};

const EMPTY_FORM: ProposalFormState = {
  title: "", customer_name: "", notes: "",
  client_id: "", proposal_type: "",
  payment_method: "", payment_terms: "", payment_installments: "",
  delivery_mode: "days", delivery_deadline: "", delivery_days: "",
  valid_until: "",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short", day: "numeric" }).format(new Date(value));
}

function proposalToForm(p: ProposalDetailDto): ProposalFormState {
  return {
    title: p.title,
    customer_name: p.customer_name ?? "",
    notes: p.notes ?? "",
    client_id: p.client_id ?? "",
    proposal_type: (p.proposal_type as ProposalType) ?? "",
    payment_method: p.payment_method ?? "",
    payment_terms: p.payment_terms ?? "",
    payment_installments: p.payment_installments ? String(p.payment_installments) : "",
    delivery_mode: p.delivery_deadline ? "date" : "days",
    delivery_deadline: p.delivery_deadline ?? "",
    delivery_days: p.delivery_days ? String(p.delivery_days) : "",
    valid_until: p.valid_until ?? "",
  };
}

function formToPayload(f: ProposalFormState): Partial<ProposalCreateRequest> {
  return {
    title: f.title.trim() || undefined,
    customer_name: f.customer_name.trim() || null,
    notes: f.notes.trim() || null,
    client_id: f.client_id || null,
    proposal_type: (f.proposal_type as ProposalType) || null,
    payment_method: f.payment_method || null,
    payment_terms: f.payment_terms || null,
    payment_installments: f.payment_installments ? Number(f.payment_installments) : null,
    delivery_deadline: f.delivery_mode === "date" ? (f.delivery_deadline || null) : null,
    delivery_days: f.delivery_mode === "days" ? (f.delivery_days ? Number(f.delivery_days) : null) : null,
    valid_until: f.valid_until || null,
  };
}

// ─── Seletor de cliente ───────────────────────────────────────────────────────

function ClientSelector({
  value,
  onChange,
  clients,
}: {
  value: string;
  onChange: (id: string, name: string) => void;
  clients: ClientListDto[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selected = clients.find((c) => c.id === value);
  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="relative">
      <div
        className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <span className="text-slate-700 truncate">{selected.name}</span>
        ) : (
          <span className="text-slate-400">Selecionar cliente...</span>
        )}
        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
          {open ? "expand_less" : "expand_more"}
        </span>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full px-2 py-1.5 text-sm text-slate-700 outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange("", ""); setOpen(false); setSearch(""); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50"
            >
              Nenhum cliente
            </button>
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id, c.name); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${value === c.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700"}`}
              >
                <span className="block truncate">{c.name}</span>
                <span className="block text-xs text-slate-400 truncate">{c.email}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-slate-400 text-center">Nenhum cliente encontrado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const searchParams = useSearchParams();
  const requestedProposalId = searchParams.get("proposalId");

  const [proposals, setProposals] = useState<ProposalDto[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ProposalDetailDto | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(requestedProposalId);
  const [proposalForm, setProposalForm] = useState<ProposalFormState>(EMPTY_FORM);
  const [createForm, setCreateForm] = useState<ProposalFormState>(EMPTY_FORM);
  const [clients, setClients] = useState<ClientListDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "ALL">("ALL");

  // carrega clientes para o seletor
  useEffect(() => {
    clientsApi.listClients({ limit: 500 }).then((r: { data: ClientListDto[] }) => setClients(r.data ?? [])).catch(() => {});
  }, []);

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
      if (!response.data.some((p) => p.id === selectedProposalId)) {
        setSelectedProposalId(response.data[0]?.id ?? null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar propostas.");
    } finally {
      setIsLoading(false);
    }
  }, [requestedProposalId, selectedProposalId]);

  const loadProposalDetail = useCallback(async (proposalId: string) => {
    try {
      setIsDetailLoading(true);
      const proposal = await proposalsApi.getProposal(proposalId);
      setSelectedProposal(proposal);
      setProposalForm(proposalToForm(proposal));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar detalhes.");
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { void loadProposals(false); }); }, [loadProposals]);
  useEffect(() => {
    if (!selectedProposalId) return;
    queueMicrotask(() => { void loadProposalDetail(selectedProposalId); });
  }, [loadProposalDetail, selectedProposalId]);

  async function handleStatusChange(status: ProposalStatus) {
    if (!selectedProposal) return;
    try {
      setIsUpdating(true);
      setActionMessage(null);
      await proposalsApi.updateProposal(selectedProposal.id, { status } satisfies Partial<ProposalCreateRequest>);
      await Promise.all([loadProposals(true), loadProposalDetail(selectedProposal.id)]);
      setActionMessage(`Proposta marcada como ${STATUS_META[status].label}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao atualizar status.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleProposalMetaSave() {
    if (!selectedProposal) return;
    try {
      setIsUpdating(true);
      setActionMessage(null);
      await proposalsApi.updateProposal(selectedProposal.id, formToPayload(proposalForm));
      await Promise.all([loadProposals(true), loadProposalDetail(selectedProposal.id)]);
      setActionMessage("Proposta atualizada.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleItemUpdate(proposalItemId: string, payload: { quantity?: number; discount_amount?: number }) {
    if (!selectedProposal) return;
    try {
      setIsUpdating(true);
      const updated = await proposalsApi.updateProposalItem(selectedProposal.id, proposalItemId, payload);
      setSelectedProposal(updated);
      setProposalForm(proposalToForm(updated));
      await loadProposals(true);
      setActionMessage("Item atualizado.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao atualizar item.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleItemRemove(proposalItemId: string) {
    if (!selectedProposal) return;
    try {
      setIsUpdating(true);
      const updated = await proposalsApi.deleteProposalItem(selectedProposal.id, proposalItemId);
      setSelectedProposal(updated);
      setProposalForm(proposalToForm(updated));
      await loadProposals(true);
      setActionMessage("Item removido.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao remover item.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCreateProposal() {
    if (!createForm.title.trim()) {
      setErrorMessage("Título da proposta é obrigatório.");
      return;
    }
    try {
      setIsCreating(true);
      setErrorMessage(null);
      const created = await proposalsApi.createProposal(formToPayload(createForm) as ProposalCreateRequest);
      setSelectedProposalId(created.id);
      setIsCreateModalOpen(false);
      setCreateForm(EMPTY_FORM);
      await Promise.all([loadProposals(true), loadProposalDetail(created.id)]);
      setActionMessage("Proposta criada como rascunho.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao criar proposta.");
    } finally {
      setIsCreating(false);
    }
  }

  const visibleProposals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return proposals.filter((p) => {
      const matchesQuery =
        !query ||
        [p.reference, p.title, p.customer_name ?? "", p.created_by_name ?? ""]
          .join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  const summary = useMemo(() => ({
    total: proposals.length,
    draft: proposals.filter((p) => p.status === "draft").length,
    sent: proposals.filter((p) => p.status === "sent").length,
    value: proposals.reduce((sum, p) => sum + p.total_amount, 0),
  }), [proposals]);

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
                <h1 className="text-[18px] font-semibold leading-5 text-slate-900">Propostas</h1>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Propostas comerciais vinculadas a clientes e itens do catálogo.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => { setErrorMessage(null); setActionMessage(null); setCreateForm(EMPTY_FORM); setIsCreateModalOpen(true); }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nova proposta
              </button>
              <label className="flex min-w-[280px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por referência, título ou cliente"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProposalStatus | "ALL")}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none"
              >
                <option value="ALL">Todos os status</option>
                {(Object.keys(STATUS_META) as ProposalStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[#EEF2F7] px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total de propostas", value: summary.total, accent: "text-slate-900", icon: "description" },
              { label: "Rascunhos", value: summary.draft, accent: "text-slate-700", icon: "edit_note" },
              { label: "Enviadas", value: summary.sent, accent: "text-sky-700", icon: "send" },
              { label: "Valor em pipeline", value: formatCurrency(summary.value), accent: "text-emerald-700", icon: "payments" },
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

          {errorMessage && (
            <div className="border-t border-rose-100 bg-rose-50 px-6 py-3 text-sm text-rose-700">{errorMessage}</div>
          )}
          {actionMessage && (
            <div className="border-t border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-700">{actionMessage}</div>
          )}
        </header>

        <div className="grid flex-1 gap-4 px-4 py-4 lg:px-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          {/* Fila de propostas */}
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Fila de propostas</h2>
              <p className="mt-1 text-xs text-slate-500">
                {isLoading ? "Carregando..." : `${visibleProposals.length} proposta(s) na visualização atual`}
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {visibleProposals.map((proposal) => {
                const isSelected = proposal.id === selectedProposalId;
                const statusMeta = STATUS_META[proposal.status] ?? STATUS_META.draft;
                const clientName = clients.find((c) => c.id === proposal.client_id)?.name;
                return (
                  <button
                    key={proposal.id}
                    type="button"
                    onClick={() => setSelectedProposalId(proposal.id)}
                    className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 ${isSelected ? "bg-amber-50/50" : "bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{proposal.reference}</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{proposal.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {clientName ?? proposal.customer_name ?? "Sem cliente"} · {proposal.items_count} item(s)
                        </p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(proposal.updated_at)}</span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(proposal.total_amount, proposal.currency)}
                      </span>
                    </div>
                  </button>
                );
              })}
              {!isLoading && visibleProposals.length === 0 && (
                <div className="px-5 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <span className="material-symbols-outlined">request_quote</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">Nenhuma proposta encontrada</h3>
                  <p className="mt-1 text-sm text-slate-500">Crie uma proposta manualmente ou a partir do catálogo.</p>
                </div>
              )}
            </div>
          </section>

          {/* Painel de detalhe */}
          <aside className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-y-auto">
            {selectedProposalId && selectedProposal ? (
              <ProposalDetail
                proposal={selectedProposal}
                proposalForm={proposalForm}
                clients={clients}
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
                <h2 className="mt-4 text-sm font-semibold text-slate-900">Selecione uma proposta</h2>
                <p className="mt-1 text-sm text-slate-500">Escolha uma proposta na lista para ver os detalhes.</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Modal nova proposta */}
      {isCreateModalOpen && (
        <Modal title="Nova proposta" onClose={() => !isCreating && setIsCreateModalOpen(false)} maxWidth="max-w-lg">
          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 mb-2">Tipo de proposta</p>
              <div className="grid grid-cols-2 gap-2">
                {([["product", "📦 Produto"], ["service", "🔧 Serviço"]] as const).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCreateForm((f) => ({ ...f, proposal_type: type }))}
                    className={`py-2.5 rounded-2xl text-sm font-medium border transition-colors ${
                      createForm.proposal_type === type
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <label className="block space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Título <span className="text-rose-500">*</span></span>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Implementação de sistema ERP"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </label>

            {/* Cliente */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Cliente</span>
              <ClientSelector
                value={createForm.client_id}
                onChange={(id) => setCreateForm((f) => ({ ...f, client_id: id }))}
                clients={clients}
              />
            </div>

            {/* Validade */}
            <label className="block space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Validade da proposta
              </span>
              <input
                type="date"
                value={createForm.valid_until}
                onChange={(e) => setCreateForm((f) => ({ ...f, valid_until: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </label>

            {/* Notas */}
            <label className="block space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Notas internas</span>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Observações internas sobre esta proposta..."
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none resize-none"
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isCreating}
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCreating}
                onClick={handleCreateProposal}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isCreating ? "Criando..." : "Criar rascunho"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

// ─── Painel de detalhe ────────────────────────────────────────────────────────

function ProposalDetail({
  proposal, proposalForm, clients, isLoading, isUpdating,
  onProposalFormChange, onProposalMetaSave, onStatusChange, onItemUpdate, onItemRemove,
}: {
  proposal: ProposalDetailDto;
  proposalForm: ProposalFormState;
  clients: ClientListDto[];
  isLoading: boolean;
  isUpdating: boolean;
  onProposalFormChange: React.Dispatch<React.SetStateAction<ProposalFormState>>;
  onProposalMetaSave: () => void;
  onStatusChange: (status: ProposalStatus) => void;
  onItemUpdate: (proposalItemId: string, payload: { quantity?: number; discount_amount?: number }) => void;
  onItemRemove: (proposalItemId: string) => void;
}) {
  const statusMeta = STATUS_META[proposal.status] ?? STATUS_META.draft;
  const selectedClient = clients.find((c) => c.id === proposalForm.client_id);
  const [paymentCustom, setPaymentCustom] = useState(
    !PAYMENT_PRESETS.slice(0, -1).includes(proposalForm.payment_terms)
  );

  function setField(field: keyof ProposalFormState, value: string) {
    onProposalFormChange((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="flex flex-col">
      {/* Cabeçalho */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{proposal.reference}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{proposal.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedClient?.name ?? proposal.customer_name ?? "Sem cliente"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
            <select
              value={proposal.status}
              onChange={(e) => onStatusChange(e.target.value as ProposalStatus)}
              disabled={isUpdating}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none disabled:opacity-60"
            >
              {(Object.keys(STATUS_META) as ProposalStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-3 border-b border-slate-100 px-5 py-4 sm:grid-cols-3">
        <Metric label="Subtotal" value={formatCurrency(proposal.subtotal_amount, proposal.currency)} />
        <Metric label="Desconto" value={formatCurrency(proposal.discount_amount, proposal.currency)} />
        <Metric label="Total" value={formatCurrency(proposal.total_amount, proposal.currency)} />
      </div>

      {/* Informações gerais */}
      <div className="border-b border-slate-100 px-5 py-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Informações gerais</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Título</span>
            <input
              value={proposalForm.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Tipo</span>
            <select
              value={proposalForm.proposal_type}
              onChange={(e) => setField("proposal_type", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            >
              <option value="">Não definido</option>
              <option value="product">📦 Produto</option>
              <option value="service">🔧 Serviço</option>
            </select>
          </label>
        </div>

        {/* Cliente */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Cliente</span>
          <ClientSelector
            value={proposalForm.client_id}
            onChange={(id) => onProposalFormChange((f) => ({ ...f, client_id: id }))}
            clients={clients}
          />
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Notas internas</span>
          <textarea
            value={proposalForm.notes}
            onChange={(e) => setField("notes", e.target.value)}
            className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none resize-none"
          />
        </label>
      </div>

      {/* Termos comerciais */}
      <div className="border-b border-slate-100 px-5 py-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          💳 Termos comerciais
        </p>

        {/* Forma de pagamento */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Forma de pagamento</span>
          <select
            value={paymentCustom ? "Personalizado" : (proposalForm.payment_terms || "")}
            onChange={(e) => {
              if (e.target.value === "Personalizado") {
                setPaymentCustom(true);
                setField("payment_terms", "");
              } else {
                setPaymentCustom(false);
                setField("payment_terms", e.target.value);
              }
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
          >
            <option value="">Selecionar...</option>
            {PAYMENT_PRESETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {paymentCustom && (
            <input
              value={proposalForm.payment_terms}
              onChange={(e) => setField("payment_terms", e.target.value)}
              placeholder="Descreva as condições de pagamento..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none mt-2"
            />
          )}
        </div>

        {/* Método + Parcelas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Método</span>
            <select
              value={proposalForm.payment_method}
              onChange={(e) => setField("payment_method", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            >
              <option value="">Selecionar...</option>
              <option value="pix">PIX</option>
              <option value="boleto">Boleto</option>
              <option value="credit_card">Cartão de crédito</option>
              <option value="bank_transfer">Transferência</option>
              <option value="wire_transfer">Wire transfer</option>
              <option value="check">Cheque</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Parcelas</span>
            <input
              type="number"
              min={1}
              value={proposalForm.payment_installments}
              onChange={(e) => setField("payment_installments", e.target.value)}
              placeholder="1 = à vista"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* Prazo de entrega */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Prazo de entrega</span>
            <div className="flex gap-2">
              {(["date", "days"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onProposalFormChange((f) => ({ ...f, delivery_mode: mode }))}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    proposalForm.delivery_mode === mode
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {mode === "date" ? "Data específica" : "Prazo relativo"}
                </button>
              ))}
            </div>
          </div>
          {proposalForm.delivery_mode === "date" ? (
            <input
              type="date"
              value={proposalForm.delivery_deadline}
              onChange={(e) => setField("delivery_deadline", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={proposalForm.delivery_days}
                onChange={(e) => setField("delivery_days", e.target.value)}
                placeholder="Ex: 30"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              />
              <span className="text-sm text-slate-500 shrink-0">dias após aprovação</span>
            </div>
          )}
        </div>

        {/* Validade */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Validade da proposta
          </span>
          <input
            type="date"
            value={proposalForm.valid_until}
            onChange={(e) => setField("valid_until", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={isUpdating}
            onClick={onProposalMetaSave}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 transition-colors"
          >
            {isUpdating ? "Salvando..." : "Salvar proposta"}
          </button>
        </div>
      </div>

      {/* Itens */}
      <div className="flex-1 space-y-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Itens do catálogo</p>
            <p className="mt-1 text-xs text-slate-500">{proposal.items.length} item(s) preservados do catálogo.</p>
          </div>
          {isLoading && <span className="text-xs font-medium text-slate-500">Atualizando...</span>}
        </div>
        <div className="space-y-3">
          {proposal.items.map((item) => (
            <ProposalItemCard
              key={`${item.id}:${item.quantity}:${item.discount_amount}`}
              item={item}
              currency={proposal.currency}
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
  item, currency, isUpdating, onItemUpdate, onItemRemove,
}: {
  item: ProposalItemDto;
  currency: string;
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
            Remover
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.commercial_description_snapshot}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Quantidade</span>
          <div className="flex gap-2">
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onItemUpdate(item.id, { quantity: Math.max(Number(quantity || 1), 1) })}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
            >
              OK
            </button>
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Desconto</span>
          <div className="flex gap-2">
            <input
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onItemUpdate(item.id, { discount_amount: Math.max(Number(discountAmount || 0), 0) })}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
            >
              OK
            </button>
          </div>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Preço unit." value={formatCurrency(item.unit_price, currency)} />
        <Metric label="Desconto" value={formatCurrency(item.discount_amount, currency)} />
        <Metric label="Total linha" value={formatCurrency(item.total_amount, currency)} />
      </div>
    </article>
  );
}
