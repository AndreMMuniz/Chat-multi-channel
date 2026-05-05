"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { catalogApi } from "@/lib/api";
import type { CatalogItemDto } from "@/types/catalog";

type CatalogType = "product" | "service";
type CatalogStatus = "active" | "inactive" | "discontinued" | "under_review";
type ScopeId = "all" | "products" | "services" | "active" | "proposal";

type CatalogItem = {
  id: string;
  name: string;
  commercialName: string;
  type: CatalogType;
  category: string;
  sku: string;
  status: CatalogStatus;
  basePrice: number;
  unit: string;
  commercialDescription: string;
  internalNotes: string;
  slaOrDeliveryTime: string;
  activeForSupport: boolean;
  canBeQuoted: boolean;
  allowsDiscount: boolean;
  tags: string[];
  updatedAt: string;
  priceUpdatedAt: string;
};

const STATUS_META: Record<CatalogStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  inactive: { label: "Inactive", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" },
  discontinued: { label: "Discontinued", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
  under_review: { label: "Under review", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
};

const TYPE_META: Record<CatalogType, { label: string; icon: string; className: string }> = {
  product: { label: "Product", icon: "inventory_2", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  service: { label: "Service", icon: "design_services", className: "bg-violet-50 text-violet-700 ring-1 ring-violet-100" },
};

const MOCK_ITEMS: CatalogItem[] = [
  {
    id: "cat-1",
    name: "WhatsApp Automation Setup",
    commercialName: "WhatsApp Automation Setup",
    type: "service",
    category: "Implementation",
    sku: "SRV-WA-001",
    status: "active",
    basePrice: 4200,
    unit: "Fixed fee",
    commercialDescription: "Setup and configure the first WhatsApp automation workflow with onboarding support.",
    internalNotes: "Confirm channel credentials before proposal approval.",
    slaOrDeliveryTime: "5 business days",
    activeForSupport: true,
    canBeQuoted: true,
    allowsDiscount: true,
    tags: ["onboarding", "whatsapp"],
    updatedAt: "2026-05-04T10:00:00Z",
    priceUpdatedAt: "2026-05-01T15:30:00Z",
  },
  {
    id: "cat-2",
    name: "AI Suggestion Pack",
    commercialName: "AI Suggestion Productivity Pack",
    type: "product",
    category: "AI Add-on",
    sku: "PRD-AI-014",
    status: "active",
    basePrice: 890,
    unit: "Monthly",
    commercialDescription: "Add AI-assisted reply suggestions and quick response generation to the support workflow.",
    internalNotes: "Available only for customers with active inbox workspace.",
    slaOrDeliveryTime: "Immediate after enablement",
    activeForSupport: true,
    canBeQuoted: true,
    allowsDiscount: false,
    tags: ["ai", "upsell"],
    updatedAt: "2026-05-03T18:20:00Z",
    priceUpdatedAt: "2026-04-28T12:00:00Z",
  },
  {
    id: "cat-3",
    name: "Telegram Channel Rollout",
    commercialName: "Telegram Rollout",
    type: "service",
    category: "Deployment",
    sku: "SRV-TG-007",
    status: "under_review",
    basePrice: 2600,
    unit: "Fixed fee",
    commercialDescription: "Launch Telegram channel support with configuration, testing, and go-live checklist.",
    internalNotes: "Commercial description approved. Price pending margin review.",
    slaOrDeliveryTime: "4 business days",
    activeForSupport: true,
    canBeQuoted: false,
    allowsDiscount: false,
    tags: ["telegram", "rollout"],
    updatedAt: "2026-05-04T08:40:00Z",
    priceUpdatedAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "cat-4",
    name: "Premium SLA Monitoring",
    commercialName: "Premium SLA Monitoring",
    type: "product",
    category: "Operations",
    sku: "PRD-SLA-003",
    status: "active",
    basePrice: 1490,
    unit: "Monthly",
    commercialDescription: "Real-time SLA tracking with alerts for managers and queue prioritization insights.",
    internalNotes: "High attach rate for enterprise accounts.",
    slaOrDeliveryTime: "Immediate after provisioning",
    activeForSupport: true,
    canBeQuoted: true,
    allowsDiscount: true,
    tags: ["sla", "enterprise"],
    updatedAt: "2026-05-02T14:10:00Z",
    priceUpdatedAt: "2026-05-02T14:10:00Z",
  },
  {
    id: "cat-5",
    name: "Legacy SMS Connector",
    commercialName: "Legacy SMS Connector",
    type: "product",
    category: "Channels",
    sku: "PRD-SMS-LEG",
    status: "inactive",
    basePrice: 590,
    unit: "Monthly",
    commercialDescription: "Legacy SMS channel connector kept for existing accounts under maintenance contracts.",
    internalNotes: "Do not propose for new customers.",
    slaOrDeliveryTime: "Immediate for existing tenants",
    activeForSupport: true,
    canBeQuoted: false,
    allowsDiscount: false,
    tags: ["legacy", "sms"],
    updatedAt: "2026-04-27T16:45:00Z",
    priceUpdatedAt: "2026-03-18T09:00:00Z",
  },
  {
    id: "cat-6",
    name: "Proposal Template Advisory",
    commercialName: "Proposal Template Advisory",
    type: "service",
    category: "Consulting",
    sku: "SRV-PRP-002",
    status: "active",
    basePrice: 1200,
    unit: "Per workshop",
    commercialDescription: "Short advisory workshop to standardize proposal structure, copy, and pricing blocks.",
    internalNotes: "Useful for customers expanding from support into project delivery.",
    slaOrDeliveryTime: "2 business days scheduling",
    activeForSupport: false,
    canBeQuoted: true,
    allowsDiscount: true,
    tags: ["proposal", "consulting"],
    updatedAt: "2026-05-01T11:15:00Z",
    priceUpdatedAt: "2026-04-29T11:15:00Z",
  },
];

const SCOPE_OPTIONS: Array<{ id: ScopeId; label: string }> = [
  { id: "all", label: "All" },
  { id: "products", label: "Products" },
  { id: "services", label: "Services" },
  { id: "active", label: "Active" },
  { id: "proposal", label: "Ready for proposal" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>(MOCK_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeScope, setActiveScope] = useState<ScopeId>("all");
  const [typeFilter, setTypeFilter] = useState<CatalogType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<CatalogStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [proposalFilter, setProposalFilter] = useState<"ALL" | "YES" | "NO">("ALL");
  const [supportFilter, setSupportFilter] = useState<"ALL" | "YES" | "NO">("ALL");
  const [selectedItemId, setSelectedItemId] = useState<string>(MOCK_ITEMS[0].id);

  useEffect(() => {
    let isMounted = true;

    function mapDto(item: CatalogItemDto): CatalogItem {
      return {
        id: item.id,
        name: item.name,
        commercialName: item.commercial_name,
        type: item.type,
        category: item.category,
        sku: item.sku ?? item.reference,
        status: item.status,
        basePrice: item.base_price,
        unit: item.unit,
        commercialDescription: item.commercial_description,
        internalNotes: item.internal_notes ?? "No internal notes yet.",
        slaOrDeliveryTime: item.sla_or_delivery_time ?? "Not defined",
        activeForSupport: item.active_for_support,
        canBeQuoted: item.can_be_quoted,
        allowsDiscount: item.allows_discount,
        tags: item.tags ?? [],
        updatedAt: item.updated_at,
        priceUpdatedAt: item.price_updated_at,
      };
    }

    async function loadCatalog() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await catalogApi.listCatalogItems({ limit: 200 });
        if (!isMounted) return;
        const mapped = response.data.map(mapDto);
        if (mapped.length > 0) {
          setItems(mapped);
          setSelectedItemId((current) => (mapped.some((item) => item.id === current) ? current : mapped[0].id));
        }
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load catalog items. Showing fallback data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const scopedItems = useMemo(() => {
    return items.filter((item) => {
      switch (activeScope) {
        case "products":
          return item.type === "product";
        case "services":
          return item.type === "service";
        case "active":
          return item.status === "active";
        case "proposal":
          return item.canBeQuoted;
        default:
          return true;
      }
    });
  }, [activeScope, items]);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return scopedItems.filter((item) => {
      const matchesQuery =
        query.length === 0 ||
        [
          item.name,
          item.commercialName,
          item.sku,
          item.category,
          item.commercialDescription,
          item.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
      const matchesProposal =
        proposalFilter === "ALL" || (proposalFilter === "YES" ? item.canBeQuoted : !item.canBeQuoted);
      const matchesSupport =
        supportFilter === "ALL" || (supportFilter === "YES" ? item.activeForSupport : !item.activeForSupport);

      return matchesQuery && matchesType && matchesStatus && matchesCategory && matchesProposal && matchesSupport;
    });
  }, [categoryFilter, proposalFilter, scopedItems, searchQuery, statusFilter, supportFilter, typeFilter]);

  const selectedItem = useMemo(
    () => visibleItems.find((item) => item.id === selectedItemId) ?? visibleItems[0] ?? null,
    [selectedItemId, visibleItems]
  );

  const summary = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.status === "active").length,
      proposalReady: items.filter((item) => item.canBeQuoted).length,
      incomplete: items.filter((item) => item.status === "under_review" || !item.canBeQuoted).length,
    }),
    [items]
  );

  return (
    <main className="flex-1 overflow-y-auto bg-[#F6F8FC]">
      <div className="flex min-h-full flex-col">
        <header className="border-b border-[#E6EBF3] bg-white">
          <div className="flex flex-col gap-4 px-6 py-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  inventory_2
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[18px] font-semibold leading-5 text-slate-900">Catalog</h1>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Products and services used in support interactions and proposal generation.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex min-w-[280px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, code, category, or description"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New item
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[#EEF2F7] px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total items", value: summary.total, accent: "text-slate-900", icon: "dataset" },
              { label: "Active", value: summary.active, accent: "text-emerald-700", icon: "verified" },
              { label: "Ready for proposal", value: summary.proposalReady, accent: "text-sky-700", icon: "request_quote" },
              { label: "Needs attention", value: summary.incomplete, accent: "text-amber-700", icon: "warning" },
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
            <div className="border-t border-amber-100 bg-amber-50 px-6 py-3 text-sm text-amber-800">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-[#EEF2F7] px-6 py-3">
            {SCOPE_OPTIONS.map((scope) => {
              const isActive = scope.id === activeScope;
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setActiveScope(scope.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {scope.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 border-t border-[#EEF2F7] px-6 py-4 md:grid-cols-2 xl:grid-cols-5">
            <FilterSelect label="Type" value={typeFilter} onChange={(value) => setTypeFilter(value as CatalogType | "ALL")}>
              <option value="ALL">All types</option>
              <option value="product">Product</option>
              <option value="service">Service</option>
            </FilterSelect>
            <FilterSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as CatalogStatus | "ALL")}>
              <option value="ALL">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="under_review">Under review</option>
              <option value="discontinued">Discontinued</option>
            </FilterSelect>
            <FilterSelect label="Category" value={categoryFilter} onChange={setCategoryFilter}>
              <option value="ALL">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Proposal" value={proposalFilter} onChange={(value) => setProposalFilter(value as "ALL" | "YES" | "NO")}>
              <option value="ALL">Any state</option>
              <option value="YES">Ready for proposal</option>
              <option value="NO">Not ready</option>
            </FilterSelect>
            <FilterSelect label="Support" value={supportFilter} onChange={(value) => setSupportFilter(value as "ALL" | "YES" | "NO")}>
              <option value="ALL">Any state</option>
              <option value="YES">Active for support</option>
              <option value="NO">Not active</option>
            </FilterSelect>
          </div>
        </header>

        <div className="grid flex-1 gap-4 px-4 py-4 lg:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Operational catalog</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {isLoading ? "Loading catalog..." : `${visibleItems.length} items in the current view`}
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                <span className="material-symbols-outlined text-[15px]">tune</span>
                Table-first workspace
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Base price</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Proposal</th>
                    <th className="px-5 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleItems.map((item) => {
                    const statusMeta = STATUS_META[item.status];
                    const typeMeta = TYPE_META[item.type];
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`cursor-pointer transition hover:bg-slate-50 ${
                          isSelected ? "bg-indigo-50/40" : "bg-white"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{item.commercialName}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                {item.sku}
                              </span>
                            </div>
                            <p className="line-clamp-2 max-w-xl text-xs text-slate-500">{item.commercialDescription}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${typeMeta.className}`}>
                            <span className="material-symbols-outlined text-[14px]">{typeMeta.icon}</span>
                            {typeMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{item.category}</td>
                        <td className="px-4 py-4 font-medium text-slate-900">{formatCurrency(item.basePrice)}</td>
                        <td className="px-4 py-4 text-slate-600">{item.unit}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.canBeQuoted
                                ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                            }`}
                          >
                            {item.canBeQuoted ? "Ready" : "Blocked"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{formatDate(item.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {visibleItems.map((item) => {
                const statusMeta = STATUS_META[item.status];
                const typeMeta = TYPE_META[item.type];
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      isSelected ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.commercialName}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.sku}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${typeMeta.className}`}>
                        <span className="material-symbols-outlined text-[14px]">{typeMeta.icon}</span>
                        {typeMeta.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{item.category}</span>
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                        {item.canBeQuoted ? "Ready for proposal" : "Needs review"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-900">{formatCurrency(item.basePrice)}</p>
                  </button>
                );
              })}
            </div>

            {visibleItems.length === 0 ? (
              <div className="border-t border-slate-100 px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <span className="material-symbols-outlined">search_off</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">No items found</h3>
                <p className="mt-1 text-sm text-slate-500">Adjust filters or search terms to widen the current view.</p>
              </div>
            ) : null}
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            {selectedItem ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Detail drawer</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">{selectedItem.commercialName}</h2>
                      <p className="mt-1 text-sm text-slate-500">{selectedItem.sku}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        selectedItem.canBeQuoted
                          ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                      }`}
                    >
                      {selectedItem.canBeQuoted ? "Ready for proposal" : "Proposal blocked"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-5 px-5 py-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <StatCard label="Base price" value={formatCurrency(selectedItem.basePrice)} />
                    <StatCard label="Billing unit" value={selectedItem.unit} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Commercial description</p>
                    <p className="text-sm leading-6 text-slate-700">{selectedItem.commercialDescription}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <InfoBlock label="Type" value={TYPE_META[selectedItem.type].label} />
                    <InfoBlock label="Category" value={selectedItem.category} />
                    <InfoBlock label="Delivery / SLA" value={selectedItem.slaOrDeliveryTime} />
                    <InfoBlock label="Price updated" value={formatDate(selectedItem.priceUpdatedAt)} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Operational notes</p>
                    <p className="text-sm leading-6 text-slate-600">{selectedItem.internalNotes}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Usage flags</p>
                    <div className="flex flex-wrap gap-2">
                      <FlagPill active={selectedItem.activeForSupport} activeLabel="Active for support" inactiveLabel="Hidden from support" />
                      <FlagPill active={selectedItem.canBeQuoted} activeLabel="Quotable" inactiveLabel="Needs proposal review" />
                      <FlagPill active={selectedItem.allowsDiscount} activeLabel="Discount allowed" inactiveLabel="Fixed pricing" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="grid gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <span className="material-symbols-outlined text-[18px]">request_quote</span>
                      Add to proposal
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Copy description
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <h2 className="mt-4 text-sm font-semibold text-slate-900">Select an item</h2>
                <p className="mt-1 text-sm text-slate-500">Choose a catalog row to inspect commercial and operational details.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300"
      >
        {children}
      </select>
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

function FlagPill({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
