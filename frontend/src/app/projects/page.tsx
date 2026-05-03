"use client";

import { useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { FaCommentDots, FaWhatsapp } from "react-icons/fa";
import { FaGlobe, FaTelegram } from "react-icons/fa6";
import { MdOutlineEmail, MdSms } from "react-icons/md";
import Modal from "@/components/shared/Modal";

type ViewId = "kanban" | "list" | "timeline";
type StageId = "lead" | "qualification" | "proposal" | "negotiation" | "closed";
type PriorityId = "high" | "medium" | "low";
type ChannelId = "WHATSAPP" | "TELEGRAM" | "EMAIL" | "SMS" | "WEB";
type OriginId = "message" | "manual";

type Owner = {
  id: string;
  name: string;
  initials: string;
  tint: string;
  text: string;
};

type ProjectCard = {
  id: string;
  reference: string;
  title: string;
  contact: string;
  workType: string;
  stage: StageId;
  channel: ChannelId;
  priority: PriorityId;
  origin: OriginId;
  tags: string[];
  dueDate: string;
  progress: number;
  ownerId: string;
  value: number;
  sourceMessage?: string;
};

type ProjectFormState = {
  id: string | null;
  reference: string;
  title: string;
  contact: string;
  workType: string;
  stage: StageId;
  channel: ChannelId;
  priority: PriorityId;
  origin: OriginId;
  tagsInput: string;
  dueDate: string;
  progress: number;
  ownerId: string;
  value: string;
  sourceMessage: string;
};

const VIEW_OPTIONS: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: "kanban", label: "Kanban", icon: "view_kanban" },
  { id: "list", label: "List", icon: "view_list" },
  { id: "timeline", label: "Timeline", icon: "timeline" },
];

const STAGES: Array<{ id: StageId; label: string; accent: string; surface: string }> = [
  { id: "lead", label: "Lead", accent: "bg-slate-400", surface: "from-slate-100 to-slate-50" },
  { id: "qualification", label: "Qualification", accent: "bg-indigo-500", surface: "from-indigo-100 to-indigo-50" },
  { id: "proposal", label: "Proposal", accent: "bg-amber-500", surface: "from-amber-100 to-amber-50" },
  { id: "negotiation", label: "Negotiation", accent: "bg-orange-500", surface: "from-orange-100 to-orange-50" },
  { id: "closed", label: "Closed", accent: "bg-emerald-500", surface: "from-emerald-100 to-emerald-50" },
];

const OWNERS: Owner[] = [
  { id: "o1", name: "Lucas Menezes", initials: "LM", tint: "bg-indigo-100", text: "text-indigo-700" },
  { id: "o2", name: "Carla Ramos", initials: "CR", tint: "bg-rose-100", text: "text-rose-700" },
  { id: "o3", name: "Felipe Souza", initials: "FS", tint: "bg-emerald-100", text: "text-emerald-700" },
  { id: "o4", name: "Mariana Costa", initials: "MC", tint: "bg-amber-100", text: "text-amber-700" },
  { id: "o5", name: "Bruno Almeida", initials: "BA", tint: "bg-sky-100", text: "text-sky-700" },
];

const CHANNEL_META: Record<
  ChannelId,
  { label: string; icon: IconType; tint: string; iconClass: string; border: string }
> = {
  WHATSAPP: {
    label: "WhatsApp",
    icon: FaWhatsapp,
    tint: "bg-emerald-50 text-emerald-700",
    iconClass: "text-emerald-600",
    border: "border-emerald-100",
  },
  TELEGRAM: {
    label: "Telegram",
    icon: FaTelegram,
    tint: "bg-sky-50 text-sky-700",
    iconClass: "text-sky-600",
    border: "border-sky-100",
  },
  EMAIL: {
    label: "Email",
    icon: MdOutlineEmail,
    tint: "bg-orange-50 text-orange-700",
    iconClass: "text-orange-600",
    border: "border-orange-100",
  },
  SMS: {
    label: "SMS",
    icon: MdSms,
    tint: "bg-violet-50 text-violet-700",
    iconClass: "text-violet-600",
    border: "border-violet-100",
  },
  WEB: {
    label: "Web",
    icon: FaGlobe,
    tint: "bg-slate-100 text-slate-700",
    iconClass: "text-slate-600",
    border: "border-slate-200",
  },
};

const PRIORITY_META: Record<PriorityId, { label: string; className: string }> = {
  high: { label: "High", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
  medium: { label: "Medium", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  low: { label: "Low", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
};

const ORIGIN_META: Record<OriginId, { label: string; className: string; icon: IconType }> = {
  message: { label: "From Messages", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100", icon: FaCommentDots },
  manual: { label: "Manual", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", icon: FaGlobe },
};

const INITIAL_PROJECT_CARDS: ProjectCard[] = [
  {
    id: "p1",
    reference: "PRJ-421",
    title: "Launch onboarding for TechCorp",
    contact: "TechCorp Ltd",
    workType: "Implementation demand",
    stage: "lead",
    channel: "WHATSAPP",
    priority: "high",
    origin: "message",
    tags: ["onboarding", "enterprise"],
    dueDate: "2026-05-05",
    progress: 18,
    ownerId: "o1",
    value: 24000,
    sourceMessage: "Customer asked for onboarding kickoff and immediate handoff planning.",
  },
  {
    id: "p2",
    reference: "PRJ-422",
    title: "Review contract blockers",
    contact: "Banco Digital Now",
    workType: "Commercial follow-up",
    stage: "lead",
    channel: "EMAIL",
    priority: "medium",
    origin: "manual",
    tags: ["contract", "legal"],
    dueDate: "2026-05-12",
    progress: 12,
    ownerId: "o4",
    value: 96000,
  },
  {
    id: "p3",
    reference: "PRJ-423",
    title: "Escalate API instability complaint",
    contact: "Clinica Saude+",
    workType: "Support demand",
    stage: "lead",
    channel: "TELEGRAM",
    priority: "high",
    origin: "message",
    tags: ["support", "urgent"],
    dueDate: "2026-05-03",
    progress: 6,
    ownerId: "o2",
    value: 5200,
    sourceMessage: "Client reported instability in message delivery and requested a fix today.",
  },
  {
    id: "p4",
    reference: "PRJ-424",
    title: "Map retail catalog integration",
    contact: "Varejo Online",
    workType: "Integration task",
    stage: "qualification",
    channel: "WEB",
    priority: "medium",
    origin: "manual",
    tags: ["catalog", "integration"],
    dueDate: "2026-05-14",
    progress: 36,
    ownerId: "o5",
    value: 15000,
  },
  {
    id: "p5",
    reference: "PRJ-425",
    title: "Prepare omnichannel migration plan",
    contact: "Fintech Pagar.me",
    workType: "Project planning",
    stage: "qualification",
    channel: "EMAIL",
    priority: "high",
    origin: "message",
    tags: ["migration", "enterprise"],
    dueDate: "2026-05-06",
    progress: 44,
    ownerId: "o3",
    value: 48000,
    sourceMessage: "Customer requested a phased migration plan covering email and WhatsApp queues.",
  },
  {
    id: "p6",
    reference: "PRJ-426",
    title: "Validate escalation workflow",
    contact: "EduTech Aprenda+",
    workType: "QA demand",
    stage: "qualification",
    channel: "WHATSAPP",
    priority: "low",
    origin: "message",
    tags: ["workflow", "qa"],
    dueDate: "2026-05-18",
    progress: 28,
    ownerId: "o1",
    value: 18000,
    sourceMessage: "Need to validate the new escalation workflow before training the ops team.",
  },
  {
    id: "p7",
    reference: "PRJ-427",
    title: "Draft renewal scope proposal",
    contact: "Rede Vida",
    workType: "Renewal proposal",
    stage: "proposal",
    channel: "SMS",
    priority: "medium",
    origin: "manual",
    tags: ["renewal", "services"],
    dueDate: "2026-05-08",
    progress: 58,
    ownerId: "o2",
    value: 21000,
  },
  {
    id: "p8",
    reference: "PRJ-428",
    title: "Package training sessions",
    contact: "LogisTech Brasil",
    workType: "Enablement project",
    stage: "proposal",
    channel: "EMAIL",
    priority: "medium",
    origin: "message",
    tags: ["training", "delivery"],
    dueDate: "2026-05-09",
    progress: 63,
    ownerId: "o5",
    value: 32000,
    sourceMessage: "Customer wants structured training after rollout approval.",
  },
  {
    id: "p9",
    reference: "PRJ-429",
    title: "Negotiate support expansion",
    contact: "Supermercado Bom Preco",
    workType: "Expansion opportunity",
    stage: "negotiation",
    channel: "WHATSAPP",
    priority: "high",
    origin: "manual",
    tags: ["expansion", "support"],
    dueDate: "2026-05-07",
    progress: 74,
    ownerId: "o4",
    value: 8500,
  },
  {
    id: "p10",
    reference: "PRJ-430",
    title: "Finalize channel rollout",
    contact: "Farmacias Vida",
    workType: "Rollout delivery",
    stage: "negotiation",
    channel: "TELEGRAM",
    priority: "medium",
    origin: "message",
    tags: ["rollout", "channel"],
    dueDate: "2026-05-11",
    progress: 82,
    ownerId: "o3",
    value: 12000,
    sourceMessage: "Client confirmed the rollout but needs a final checklist before go-live.",
  },
  {
    id: "p11",
    reference: "PRJ-431",
    title: "Complete onboarding handoff",
    contact: "Restaurantes GeloBom",
    workType: "Closed implementation",
    stage: "closed",
    channel: "WHATSAPP",
    priority: "low",
    origin: "message",
    tags: ["onboarding", "handoff"],
    dueDate: "2026-04-30",
    progress: 100,
    ownerId: "o1",
    value: 12000,
    sourceMessage: "Project delivered and customer confirmed handoff acceptance.",
  },
  {
    id: "p12",
    reference: "PRJ-432",
    title: "Resolve webhook backlog",
    contact: "Marketplace Nexus",
    workType: "Technical demand",
    stage: "closed",
    channel: "WEB",
    priority: "high",
    origin: "manual",
    tags: ["webhook", "infra"],
    dueDate: "2026-05-01",
    progress: 100,
    ownerId: "o5",
    value: 9000,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function isOverdue(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${date}T00:00:00`) < today;
}

function getNextReference(cards: ProjectCard[]) {
  const numbers = cards
    .map((card) => Number(card.reference.replace("PRJ-", "")))
    .filter((value) => Number.isFinite(value));

  const next = (numbers.length > 0 ? Math.max(...numbers) : 420) + 1;
  return `PRJ-${next}`;
}

function toFormState(card: ProjectCard): ProjectFormState {
  return {
    id: card.id,
    reference: card.reference,
    title: card.title,
    contact: card.contact,
    workType: card.workType,
    stage: card.stage,
    channel: card.channel,
    priority: card.priority,
    origin: card.origin,
    tagsInput: card.tags.join(", "),
    dueDate: card.dueDate,
    progress: card.progress,
    ownerId: card.ownerId,
    value: String(card.value),
    sourceMessage: card.sourceMessage ?? "",
  };
}

function createEmptyForm(cards: ProjectCard[], overrides?: Partial<ProjectFormState>): ProjectFormState {
  return {
    id: null,
    reference: getNextReference(cards),
    title: "",
    contact: "",
    workType: "",
    stage: "lead",
    channel: "WHATSAPP",
    priority: "medium",
    origin: "manual",
    tagsInput: "",
    dueDate: "2026-05-16",
    progress: 0,
    ownerId: OWNERS[0].id,
    value: "",
    sourceMessage: "",
    ...overrides,
  };
}

function fromFormState(form: ProjectFormState): ProjectCard {
  return {
    id: form.id ?? `project-${Date.now()}`,
    reference: form.reference,
    title: form.title.trim(),
    contact: form.contact.trim(),
    workType: form.workType.trim(),
    stage: form.stage,
    channel: form.channel,
    priority: form.priority,
    origin: form.origin,
    tags: form.tagsInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    dueDate: form.dueDate,
    progress: Number(form.progress),
    ownerId: form.ownerId,
    value: Number(form.value || 0),
    sourceMessage: form.origin === "message" ? form.sourceMessage.trim() : "",
  };
}

function ChannelBadge({ channel }: { channel: ChannelId }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.tint} ${meta.border}`}
    >
      <Icon className={`text-[12px] ${meta.iconClass}`} />
      {meta.label}
    </span>
  );
}

function OwnerBadge({ owner }: { owner: Owner }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${owner.tint} ${owner.text}`}>
        {owner.initials}
      </span>
      <span className="truncate">{owner.name}</span>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>;
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 ${props.className ?? ""}`}
    />
  );
}

function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 ${props.className ?? ""}`}
    />
  );
}

function FieldTextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[96px] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 ${props.className ?? ""}`}
    />
  );
}

function ProjectCardView({
  card,
  onOpen,
  onDragStart,
}: {
  card: ProjectCard;
  onOpen: (card: ProjectCard) => void;
  onDragStart: (cardId: string, stageId: StageId) => void;
}) {
  const owner = OWNERS.find((item) => item.id === card.ownerId);
  const priority = PRIORITY_META[card.priority];
  const origin = ORIGIN_META[card.origin];
  const overdue = isOverdue(card.dueDate) && card.progress < 100;
  const OriginIcon = origin.icon;

  return (
    <article
      draggable
      onDragStart={() => onDragStart(card.id, card.stage)}
      onClick={() => onOpen(card)}
      className={`cursor-pointer rounded-[18px] border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        overdue ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{card.reference}</p>
          <h4 className="mt-1 text-[15px] font-semibold leading-5 text-slate-900">{card.title}</h4>
          <p className="mt-1 text-xs text-slate-500">{card.contact}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priority.className}`}>
          {priority.label}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[28px] font-semibold leading-none tracking-[-0.03em] text-indigo-600">
          {formatCurrency(card.value)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
          {card.workType}
        </span>
        <ChannelBadge channel={card.channel} />
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${origin.className}`}>
          <OriginIcon className="text-[12px]" />
          {origin.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span className={overdue ? "font-semibold text-rose-600" : "font-medium text-slate-500"}>
          {formatDate(card.dueDate)}
        </span>
        <span className="text-slate-300">•</span>
        <span>{card.progress}% progress</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {owner ? <OwnerBadge owner={owner} /> : <div />}
        {overdue ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Overdue
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-slate-100">
          <div
            className={`h-1.5 rounded-full ${card.progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
            style={{ width: `${card.progress}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function ProjectModal({
  form,
  setForm,
  onClose,
  onSave,
  isEditing,
}: {
  form: ProjectFormState;
  setForm: React.Dispatch<React.SetStateAction<ProjectFormState | null>>;
  onClose: () => void;
  onSave: () => void;
  isEditing: boolean;
}) {
  return (
    <Modal title={isEditing ? "Edit Project" : "New Project"} onClose={onClose} maxWidth="max-w-3xl">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <FieldLabel label="Reference" />
            <FieldInput value={form.reference} readOnly className="bg-slate-50 text-slate-500" />
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Stage" />
            <FieldSelect value={form.stage} onChange={(e) => setForm((current) => current ? { ...current, stage: e.target.value as StageId } : current)}>
              {STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </FieldSelect>
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <FieldLabel label="Project title" />
            <FieldInput
              value={form.title}
              onChange={(e) => setForm((current) => current ? { ...current, title: e.target.value } : current)}
              placeholder="What needs to be delivered or resolved?"
            />
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Contact" />
            <FieldInput
              value={form.contact}
              onChange={(e) => setForm((current) => current ? { ...current, contact: e.target.value } : current)}
              placeholder="Customer or account name"
            />
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Work type" />
            <FieldInput
              value={form.workType}
              onChange={(e) => setForm((current) => current ? { ...current, workType: e.target.value } : current)}
              placeholder="Implementation, support, rollout..."
            />
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Owner" />
            <FieldSelect value={form.ownerId} onChange={(e) => setForm((current) => current ? { ...current, ownerId: e.target.value } : current)}>
              {OWNERS.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </FieldSelect>
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Priority" />
            <FieldSelect value={form.priority} onChange={(e) => setForm((current) => current ? { ...current, priority: e.target.value as PriorityId } : current)}>
              {Object.entries(PRIORITY_META).map(([id, meta]) => (
                <option key={id} value={id}>
                  {meta.label}
                </option>
              ))}
            </FieldSelect>
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Channel" />
            <FieldSelect value={form.channel} onChange={(e) => setForm((current) => current ? { ...current, channel: e.target.value as ChannelId } : current)}>
              {Object.entries(CHANNEL_META).map(([id, meta]) => (
                <option key={id} value={id}>
                  {meta.label}
                </option>
              ))}
            </FieldSelect>
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Origin" />
            <FieldSelect value={form.origin} onChange={(e) => setForm((current) => current ? { ...current, origin: e.target.value as OriginId } : current)}>
              <option value="manual">Manual</option>
              <option value="message">From Messages</option>
            </FieldSelect>
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Value" />
            <FieldInput
              type="number"
              min="0"
              value={form.value}
              onChange={(e) => setForm((current) => current ? { ...current, value: e.target.value } : current)}
              placeholder="0"
            />
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Due date" />
            <FieldInput
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((current) => current ? { ...current, dueDate: e.target.value } : current)}
            />
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel label="Progress" />
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) => setForm((current) => current ? { ...current, progress: Number(e.target.value) } : current)}
                className="w-full accent-indigo-600"
              />
              <div className="text-sm font-medium text-slate-600">{form.progress}% complete</div>
            </div>
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <FieldLabel label="Tags" />
            <FieldInput
              value={form.tagsInput}
              onChange={(e) => setForm((current) => current ? { ...current, tagsInput: e.target.value } : current)}
              placeholder="Comma-separated tags"
            />
          </label>

          {form.origin === "message" ? (
            <label className="flex flex-col gap-2 md:col-span-2">
              <FieldLabel label="Source message summary" />
              <FieldTextArea
                value={form.sourceMessage}
                onChange={(e) => setForm((current) => current ? { ...current, sourceMessage: e.target.value } : current)}
                placeholder="Describe the demand that came from the conversation..."
              />
            </label>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Keep the project inside the workspace. Stage movement and edits are saved without leaving the pipeline.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {isEditing ? "Save changes" : "Create project"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function ProjectsPage() {
  const [activeView, setActiveView] = useState<ViewId>("kanban");
  const [cards, setCards] = useState<ProjectCard[]>(INITIAL_PROJECT_CARDS);
  const [form, setForm] = useState<ProjectFormState | null>(null);
  const [dragState, setDragState] = useState<{ cardId: string; fromStage: StageId } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityId | "ALL">("ALL");
  const [channelFilter, setChannelFilter] = useState<ChannelId | "ALL">("ALL");
  const [originFilter, setOriginFilter] = useState<OriginId | "ALL">("ALL");

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    ownerFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    channelFilter !== "ALL" ||
    originFilter !== "ALL";

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return cards.filter((card) => {
      const matchesQuery =
        query.length === 0 ||
        [
          card.reference,
          card.title,
          card.contact,
          card.workType,
          card.sourceMessage ?? "",
          ...card.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesOwner = ownerFilter === "ALL" || card.ownerId === ownerFilter;
      const matchesPriority = priorityFilter === "ALL" || card.priority === priorityFilter;
      const matchesChannel = channelFilter === "ALL" || card.channel === channelFilter;
      const matchesOrigin = originFilter === "ALL" || card.origin === originFilter;

      return matchesQuery && matchesOwner && matchesPriority && matchesChannel && matchesOrigin;
    });
  }, [cards, channelFilter, originFilter, ownerFilter, priorityFilter, searchQuery]);

  const cardsByStage = useMemo(() => {
    return STAGES.reduce<Record<StageId, ProjectCard[]>>((acc, stage) => {
      acc[stage.id] = filteredCards.filter((card) => card.stage === stage.id);
      return acc;
    }, {} as Record<StageId, ProjectCard[]>);
  }, [filteredCards]);

  const kpis = useMemo(() => {
    const activeProjects = filteredCards.filter((card) => card.progress < 100).length;
    const atRisk = filteredCards.filter((card) => isOverdue(card.dueDate) && card.progress < 100).length;
    const conversationOrigin = filteredCards.filter((card) => card.origin === "message").length;
    const totalOwners = new Set(filteredCards.map((card) => card.ownerId)).size;
    const pipelineValue = filteredCards.reduce((sum, card) => sum + card.value, 0);

    return [
      {
        label: "Active Projects",
        value: String(activeProjects),
        hint: "Message-driven demands and manual entries",
        icon: "inventory_2",
        tint: "bg-indigo-50 text-indigo-700",
      },
      {
        label: "At Risk",
        value: String(atRisk),
        hint: "Due soon or overdue across the pipeline",
        icon: "warning",
        tint: "bg-rose-50 text-rose-700",
      },
      {
        label: "Conversation Origin",
        value: String(conversationOrigin),
        hint: "Projects created from Messages demands",
        icon: "forum",
        tint: "bg-sky-50 text-sky-700",
      },
      {
        label: "Pipeline Value",
        value: formatCurrency(pipelineValue),
        hint: `${totalOwners} owners represented in the current view`,
        icon: "monetization_on",
        tint: "bg-emerald-50 text-emerald-700",
      },
    ];
  }, [filteredCards]);

  const timelineCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [filteredCards]);

  const clearFilters = () => {
    setSearchQuery("");
    setOwnerFilter("ALL");
    setPriorityFilter("ALL");
    setChannelFilter("ALL");
    setOriginFilter("ALL");
  };

  const isEditing = Boolean(form?.id);

  const openNewProject = (stage: StageId = "lead") => {
    setForm(createEmptyForm(cards, { stage }));
  };

  const openExistingProject = (card: ProjectCard) => {
    setForm(toFormState(card));
  };

  const handleSave = () => {
    if (!form) return;

    const normalized = fromFormState(form);

    if (!normalized.title || !normalized.contact || !normalized.workType) {
      return;
    }

    setCards((current) => {
      if (form.id) {
        return current.map((card) => (card.id === form.id ? normalized : card));
      }

      return [normalized, ...current];
    });

    setForm(null);
  };

  const handleDragStart = (cardId: string, stageId: StageId) => {
    setDragState({ cardId, fromStage: stageId });
  };

  const handleDrop = (targetStage: StageId) => {
    if (!dragState) return;

    setCards((current) =>
      current.map((card) =>
        card.id === dragState.cardId
          ? {
              ...card,
              stage: targetStage,
            }
          : card
      )
    );

    if (form?.id === dragState.cardId) {
      setForm((current) => (current ? { ...current, stage: targetStage } : current));
    }

    setDragState(null);
    setDragOverStage(null);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#F6F8FC]">
      <div className="flex min-h-full flex-col">
        <header className="border-b border-[#E6EBF3] bg-white">
          <div className="flex flex-col gap-4 px-6 py-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  view_kanban
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[18px] font-semibold leading-5 text-slate-900">Projects pipeline</h1>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Integrated project tracking for demands created from Messages and manual follow-up.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
                {VIEW_OPTIONS.map((view) => {
                  const active = activeView === view.id;
                  return (
                    <button
                      key={view.id}
                      type="button"
                      onClick={() => setActiveView(view.id)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                        active
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:bg-white hover:text-slate-700"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
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
                onClick={openNewProject}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                New Project
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#EEF2F7] px-6 py-3 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 shadow-sm focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by client..."
                  className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <FieldSelect value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className="h-11 min-w-[160px] rounded-xl shadow-sm">
                <option value="ALL">All owners</option>
                {OWNERS.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </FieldSelect>

              <FieldSelect
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as PriorityId | "ALL")}
                className="h-11 min-w-[150px] rounded-xl shadow-sm"
              >
                <option value="ALL">All priorities</option>
                {Object.entries(PRIORITY_META).map(([id, meta]) => (
                  <option key={id} value={id}>
                    {meta.label}
                  </option>
                ))}
              </FieldSelect>

              <FieldSelect
                value={channelFilter}
                onChange={(event) => setChannelFilter(event.target.value as ChannelId | "ALL")}
                className="h-11 min-w-[150px] rounded-xl shadow-sm"
              >
                <option value="ALL">All channels</option>
                {Object.entries(CHANNEL_META).map(([id, meta]) => (
                  <option key={id} value={id}>
                    {meta.label}
                  </option>
                ))}
              </FieldSelect>
            </div>

            <div className="flex items-center gap-2 xl:ml-auto">
              {OWNERS.map((owner, index) => (
                <span
                  key={owner.id}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ring-white ${owner.tint} ${owner.text} ${index > 0 ? "-ml-1.5" : ""}`}
                  title={owner.name}
                >
                  {owner.initials}
                </span>
              ))}
              <span className="ml-1 text-xs text-slate-500">{OWNERS.length} owners</span>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="border-t border-[#EEF2F7] px-6 py-2">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                Clear filters
              </button>
            </div>
          ) : null}
        </header>

        <section className="border-b border-[#E6EBF3] px-6 py-4">
          <div className="grid gap-3 xl:grid-cols-4">
          {kpis.map((item) => (
            <article
              key={item.label}
              className="rounded-[18px] border border-[#E2E8F2] bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tint}`}>
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs font-medium text-slate-500">{item.label}</p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{item.hint}</p>
            </article>
          ))}
          </div>
        </section>

        <section className="flex-1 px-6 py-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Project Pipeline</h2>
              <p className="mt-1 text-sm text-slate-500">Compact board integrated with the main app workspace.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              {filteredCards.length} projects in current view
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  filter_alt
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No projects match the current filters</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Try widening the current filters or clear them to bring back the full pipeline workspace.
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Clear all filters
                </button>
              ) : null}
            </div>
          ) : activeView === "kanban" ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {STAGES.map((stage) => {
                const stageCards = cardsByStage[stage.id];
                const stageValue = stageCards.reduce((sum, card) => sum + card.value, 0);
                const draggingOver = dragOverStage === stage.id;

                return (
                  <article
                    key={stage.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverStage(stage.id);
                    }}
                    onDragLeave={() => setDragOverStage((current) => (current === stage.id ? null : current))}
                    onDrop={() => handleDrop(stage.id)}
                    className={`min-h-[520px] min-w-[270px] flex-1 rounded-[20px] border border-[#DCE4EF] p-0 transition ${
                      draggingOver
                        ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100"
                        : "bg-[#EFF4FB]"
                    }`}
                  >
                    <div className="rounded-t-[20px] border-b border-[#DCE4EF] bg-white px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${stage.accent}`} />
                            <h3 className="text-sm font-semibold text-slate-900">{stage.label}</h3>
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {stageCards.length}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{formatCurrency(stageValue)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openNewProject(stage.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700"
                          title={`Add project in ${stage.label}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      </div>
                    </div>

                    {stageCards.length > 0 ? (
                      <div className="space-y-2.5 px-2.5 py-2.5">
                        {stageCards.map((card) => (
                          <ProjectCardView
                            key={card.id}
                            card={card}
                            onOpen={openExistingProject}
                            onDragStart={handleDragStart}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="m-2.5 rounded-[14px] border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500">
                        No projects in this stage for the current filters.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : activeView === "list" ? (
            <div className="overflow-hidden rounded-[20px] border border-[#DCE4EF] bg-white shadow-sm">
              <div className="grid grid-cols-[1.4fr_1fr_0.9fr_0.8fr_0.8fr_0.9fr] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                <span>Project</span>
                <span>Owner</span>
                <span>Stage</span>
                <span>Origin</span>
                <span>Due</span>
                <span>Progress</span>
              </div>
              <div className="divide-y divide-slate-200 bg-white">
                {filteredCards.map((card) => {
                  const owner = OWNERS.find((item) => item.id === card.ownerId);
                  const stage = STAGES.find((item) => item.id === card.stage);
                  const origin = ORIGIN_META[card.origin];
                  const OriginIcon = origin.icon;

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => openExistingProject(card)}
                      className="grid w-full grid-cols-[1.4fr_1fr_0.9fr_0.8fr_0.8fr_0.9fr] gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{card.reference}</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{card.title}</p>
                        <p className="truncate text-xs text-slate-500">{card.contact}</p>
                      </div>
                      <div className="min-w-0">{owner ? <OwnerBadge owner={owner} /> : null}</div>
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          <span className={`h-2 w-2 rounded-full ${stage?.accent ?? "bg-slate-400"}`} />
                          {stage?.label ?? card.stage}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${origin.className}`}>
                          <OriginIcon className="text-[12px]" />
                          {origin.label}
                        </span>
                      </div>
                      <div className="flex items-center text-sm font-medium text-slate-700">{formatDate(card.dueDate)}</div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${card.progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                            style={{ width: `${card.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{card.progress}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {timelineCards.map((card) => {
                const owner = OWNERS.find((item) => item.id === card.ownerId);
                const stage = STAGES.find((item) => item.id === card.stage);
                const overdue = isOverdue(card.dueDate) && card.progress < 100;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => openExistingProject(card)}
                    className={`flex w-full items-start gap-4 rounded-[24px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      overdue ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"
                    }`}
                  >
                    <div className="flex w-28 shrink-0 flex-col rounded-[18px] bg-slate-50 px-3 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Due</span>
                      <span className={`mt-1 text-lg font-semibold ${overdue ? "text-rose-600" : "text-slate-900"}`}>
                        {formatDate(card.dueDate)}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">{card.reference}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {stage?.label ?? card.stage}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${PRIORITY_META[card.priority].className}`}>
                          {PRIORITY_META[card.priority].label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{card.contact} · {card.workType}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ChannelBadge channel={card.channel} />
                        {owner ? <OwnerBadge owner={owner} /> : null}
                      </div>
                      {card.origin === "message" && card.sourceMessage ? (
                        <p className="mt-3 text-sm leading-6 text-slate-600">{card.sourceMessage}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {form ? (
        <ProjectModal
          form={form}
          setForm={setForm}
          onClose={() => setForm(null)}
          onSave={handleSave}
          isEditing={isEditing}
        />
      ) : null}
    </main>
  );
}
