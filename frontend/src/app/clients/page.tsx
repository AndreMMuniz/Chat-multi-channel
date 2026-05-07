"use client";

import { useCallback, useEffect, useState } from "react";
import { clientsApi } from "@/lib/api";
import type { ClientDto, ClientListDto, ClientCreateRequest, ClientUpdateRequest } from "@/types/client";

// ─── helpers ─────────────────────────────────────────────────────────────────

const COUNTRY_FLAG: Record<string, string> = {
  BR: "🇧🇷",
  US: "🇺🇸",
  DE: "🇩🇪",
  GB: "🇬🇧",
  FR: "🇫🇷",
  AR: "🇦🇷",
  MX: "🇲🇽",
  PT: "🇵🇹",
};

function countryLabel(code: string) {
  return `${COUNTRY_FLAG[code] ?? "🌐"} ${code}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ─── Modal de criação/edição ──────────────────────────────────────────────────

interface ClientFormProps {
  initial?: ClientDto | null;
  onSave: (data: ClientCreateRequest) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}

function ClientForm({ initial, onSave, onClose, saving, error }: ClientFormProps) {
  const [form, setForm] = useState<ClientCreateRequest>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    country: initial?.country ?? "BR",
    client_type: initial?.client_type ?? "company",
    tax_id: initial?.tax_id ?? "",
    tax_id_type: initial?.tax_id_type ?? "",
    currency: initial?.currency ?? "BRL",
    company_name: initial?.company_name ?? "",
    website: initial?.website ?? "",
    notes: initial?.notes ?? "",
  });

  const isBrazilian = form.country === "BR";

  function set(field: keyof ClientCreateRequest, value: string) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  }

  function handleCountryToggle(isBR: boolean) {
    setForm((prev) => ({
      ...prev,
      country: isBR ? "BR" : "",
      tax_id: null,
      tax_id_type: null,
      currency: isBR ? "BRL" : prev.currency,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Origem */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCountryToggle(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                isBrazilian
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              🇧🇷 Empresa Brasileira
            </button>
            <button
              type="button"
              onClick={() => handleCountryToggle(false)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                !isBrazilian
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              🌐 Internacional
            </button>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nome / Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex: Empresa Alfa Ltda"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>

          {/* Tipo de pessoa */}
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
              <input
                type="radio"
                name="client_type"
                value="company"
                checked={form.client_type === "company"}
                onChange={() => setForm((p) => ({ ...p, client_type: "company" }))}
                className="accent-indigo-600"
              />
              Pessoa Jurídica
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
              <input
                type="radio"
                name="client_type"
                value="individual"
                checked={form.client_type === "individual"}
                onChange={() => setForm((p) => ({ ...p, client_type: "individual" }))}
                className="accent-indigo-600"
              />
              Pessoa Física
            </label>
          </div>

          {/* Documento */}
          {isBrazilian ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {form.client_type === "company" ? "CNPJ" : "CPF"}
                <span className="ml-1 text-gray-400">(opcional)</span>
              </label>
              <input
                value={form.tax_id ?? ""}
                onChange={(e) => {
                  const type = form.client_type === "company" ? "CNPJ" : "CPF";
                  setForm((p) => ({ ...p, tax_id: e.target.value || null, tax_id_type: type }));
                }}
                placeholder={form.client_type === "company" ? "00.000.000/0001-00" : "000.000.000-00"}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
                <input
                  value={form.country === "BR" ? "" : (form.country ?? "")}
                  onChange={(e) => set("country", e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="US, DE, MX..."
                  maxLength={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tax ID / Registro
                </label>
                <input
                  value={form.tax_id ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, tax_id: e.target.value || null, tax_id_type: "OTHER" }))}
                  placeholder="VAT, EIN, etc."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
            </div>
          )}

          {/* Email + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+55 11 99999-9999"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Nome fantasia + Moeda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome Fantasia</label>
              <input
                value={form.company_name ?? ""}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder="Alfa"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moeda</label>
              <select
                value={form.currency ?? "BRL"}
                onChange={(e) => set("currency", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              >
                <option value="BRL">BRL — Real</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — Libra</option>
              </select>
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
            <input
              value={form.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://empresa.com.br"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações internas</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Informações relevantes sobre o cliente..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? "Salvando..." : initial ? "Salvar Alterações" : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Painel de detalhe do cliente ────────────────────────────────────────────

function ClientDetail({ client, onEdit, onDelete }: { client: ClientDto; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{client.name}</h2>
          {client.company_name && (
            <p className="text-sm text-gray-500 mt-0.5">{client.company_name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            Arquivar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Info básica */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Informações
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon="mail" label="E-mail" value={client.email} />
            <InfoRow icon="phone" label="Telefone" value={client.phone ?? "—"} />
            <InfoRow icon="public" label="País" value={countryLabel(client.country)} />
            <InfoRow icon="payments" label="Moeda" value={client.currency} />
            <InfoRow
              icon="badge"
              label={client.client_type === "company" ? "CNPJ / Tax ID" : "CPF / Tax ID"}
              value={client.tax_id ?? "Não informado"}
            />
            <InfoRow
              icon="person"
              label="Tipo"
              value={client.client_type === "company" ? "Pessoa Jurídica" : "Pessoa Física"}
            />
            {client.website && <InfoRow icon="link" label="Website" value={client.website} />}
          </div>
        </section>

        {/* Notas */}
        {client.notes && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Observações
            </h3>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed">
              {client.notes}
            </p>
          </section>
        )}

        {/* Metadata */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Registro
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon="calendar_today" label="Criado em" value={formatDate(client.created_at)} />
            <InfoRow icon="update" label="Atualizado" value={formatDate(client.updated_at)} />
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="material-symbols-outlined text-[16px] text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientListDto[]>([]);
  const [selected, setSelected] = useState<ClientDto | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "company" | "individual">("");

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ClientDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── carrega lista ──
  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.client_type = typeFilter;
      const res = await clientsApi.listClients(params);
      setClients(res.data ?? []);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar clientes." });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // ── seleciona cliente ──
  async function selectClient(id: string) {
    if (selected?.id === id) return;
    setLoadingDetail(true);
    try {
      const detail = await clientsApi.getClient(id);
      setSelected(detail);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar detalhes." });
    } finally {
      setLoadingDetail(false);
    }
  }

  // ── salva (cria ou edita) ──
  async function handleSave(data: ClientCreateRequest) {
    setSaving(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await clientsApi.updateClient(editTarget.id, data as ClientUpdateRequest);
        setSelected(updated);
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setMessage({ type: "success", text: "Cliente atualizado com sucesso." });
      } else {
        await clientsApi.createClient(data);
        setMessage({ type: "success", text: "Cliente criado com sucesso." });
        await loadClients();
      }
      setShowForm(false);
      setEditTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar cliente.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── arquiva ──
  async function handleDelete(id: string) {
    if (!confirm("Arquivar este cliente? Ele não aparecerá mais nas buscas.")) return;
    try {
      await clientsApi.deleteClient(id);
      setSelected(null);
      setClients((prev) => prev.filter((c) => c.id !== id));
      setMessage({ type: "success", text: "Cliente arquivado." });
    } catch {
      setMessage({ type: "error", text: "Erro ao arquivar cliente." });
    }
  }

  const filteredClients = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              groups
            </span>
            <h1 className="text-lg font-semibold text-gray-900">Clientes</h1>
            <span className="ml-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredClients.length}
            </span>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditTarget(null); setFormError(null); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Novo Cliente
          </button>
        </div>

        {/* Busca + filtro tipo */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-gray-400">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, e-mail ou empresa..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
          <div className="flex gap-1.5">
            {(["", "company", "individual"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                  typeFilter === type
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {type === "" ? "Todos" : type === "company" ? "PJ" : "PF"}
              </button>
            ))}
          </div>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-100 text-green-700"
              : "bg-red-50 border-red-100 text-red-600"
          }`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
      </div>

      {/* Conteúdo: lista + detalhe */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lista */}
        <div className="w-[380px] shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <span className="material-symbols-outlined text-[40px]">group_off</span>
              <p className="text-sm">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div>
              {filteredClients.map((client) => {
                const active = selected?.id === client.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors flex items-start gap-3 ${
                      active ? "bg-indigo-50 border-l-[3px] border-l-indigo-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                      active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                      <p className="text-xs text-gray-500 truncate">{client.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{countryLabel(client.country)}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          client.client_type === "company"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600"
                        }`}>
                          {client.client_type === "company" ? "PJ" : "PF"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalhe */}
        <div className="flex-1 overflow-y-auto">
          {loadingDetail ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selected ? (
            <ClientDetail
              client={selected}
              onEdit={() => { setEditTarget(selected); setShowForm(true); setFormError(null); }}
              onDelete={() => handleDelete(selected.id)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <span className="material-symbols-outlined text-[48px]">person_search</span>
              <p className="text-sm">Selecione um cliente para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de criação/edição */}
      {showForm && (
        <ClientForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}
