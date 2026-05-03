"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { IconType } from "react-icons";
import { FaCommentDots, FaWhatsapp } from "react-icons/fa";
import { FaGlobe, FaTelegram } from "react-icons/fa6";
import { MdOutlineEmail, MdSms } from "react-icons/md";
import Modal from "@/components/shared/Modal";
import { useAuth } from "@/hooks/useAuth";
import { projectsApi } from "@/lib/api/index";
import type {
  ProjectCreateRequest,
  ProjectDto,
  ProjectTaskCreateRequest,
  ProjectTaskDto,
  ProjectTaskStatus,
  ProjectTaskUpdateRequest,
  ProjectUpdateRequest,
} from "@/types/project";

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
  ownerName?: string;
  value: number;
  sourceMessage?: string;
  sourceMessageId?: string;
  sourceConversationId?: string;
};

type TaskStatusId = ProjectTaskStatus;

type ProjectTask = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatusId;
  priority: PriorityId;
  ownerId: string;
  ownerName?: string;
  dueDate: string;
  sourceMessageId?: string;
  sourceConversationId?: string;
};

type ProjectTaskDraft = {
  id: string | null;
  title: string;
  description: string;
  status: TaskStatusId;
  priority: PriorityId;
  ownerId: string;
  dueDate: string;
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
  sourceMessageId: string;
  sourceConversationId: string;
};

type StageOption = { id: StageId; label: string; accent: string; surface: string };

const VIEW_OPTIONS: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: "kanban", label: "Kanban", icon: "view_kanban" },
  { id: "list", label: "List", icon: "view_list" },
  { id: "timeline", label: "Timeline", icon: "timeline" },
];

const STAGES: StageOption[] = [
  { id: "lead", label: "Lead", accent: "bg-slate-400", surface: "from-slate-100 to-slate-50" },
  { id: "qualification", label: "Qualification", accent: "bg-indigo-500", surface: "from-indigo-100 to-indigo-50" },
  { id: "proposal", label: "Proposal", accent: "bg-amber-500", surface: "from-amber-100 to-amber-50" },
  { id: "negotiation", label: "Negotiation", accent: "bg-orange-500", surface: "from-orange-100 to-orange-50" },
  { id: "closed", label: "Closed", accent: "bg-emerald-500", surface: "from-emerald-100 to-emerald-50" },
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

const TASK_STATUS_META: Record<TaskStatusId, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" },
  in_progress: { label: "In Progress", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
};

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  upsell:    { bg: "bg-fuchsia-50",  text: "text-fuchsia-700", border: "border-fuchsia-100" },
  renewal:   { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-100"    },
  novo:      { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-100" },
  enterprise:{ bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-100"  },
  onboarding:{ bg: "bg-indigo-50",   text: "text-indigo-700",  border: "border-indigo-100"  },
  contract:  { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-100"   },
  support:   { bg: "bg-rose-50",     text: "text-rose-700",    border: "border-rose-100"    },
  urgent:    { bg: "bg-rose-50",     text: "text-rose-700",    border: "border-rose-100"    },
  migration: { bg: "bg-violet-50",   text: "text-violet-700",  border: "border-violet-100"  },
  training:  { bg: "bg-sky-50",      text: "text-sky-700",     border: "border-sky-100"     },
  rollout:   { bg: "bg-teal-50",     text: "text-teal-700",    border: "border-teal-100"    },
  webhook:   { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200"   },
};

function TagPill({ tag }: { tag: string }) {
  const c = TAG_COLORS[tag] ?? { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.text} ${c.border}`}>
      {tag}
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function isOverdue(date: string) {
  if (!date) return false;
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

function getInitials(fullName: string) {
  return (
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function normalizeTagLabel(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTagValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function toApiChannel(channel: ChannelId): "whatsapp" | "telegram" | "email" | "sms" | "web" {
  return channel.toLowerCase() as "whatsapp" | "telegram" | "email" | "sms" | "web";
}

function fromApiChannel(channel?: string | null): ChannelId {
  const normalized = channel?.toUpperCase();
  if (normalized && normalized in CHANNEL_META) {
    return normalized as ChannelId;
  }
  return "WEB";
}

function toApiDateTime(date: string) {
  return date ? `${date}T00:00:00Z` : null;
}

function mapStageOptions(stages: Array<{ key: string; label: string }>): StageOption[] {
  const visuals = new Map(STAGES.map((stage) => [stage.id, stage]));
  return stages
    .map((stage) => {
      const visual = visuals.get(stage.key as StageId);
      return visual
        ? { ...visual, label: stage.label }
        : null;
    })
    .filter((stage): stage is StageOption => Boolean(stage));
}

function adaptProject(project: ProjectDto): ProjectCard {
  const normalizedTag = project.tag ? normalizeTagValue(project.tag) : "";

  return {
    id: project.id,
    reference: project.reference,
    title: project.title,
    contact: project.contact_name?.trim() || "No contact",
    workType: project.tag ? normalizeTagLabel(project.tag) : project.source_type === "message" ? "Demand" : "Project",
    stage: project.stage,
    channel: fromApiChannel(project.channel),
    priority: project.priority,
    origin: project.source_type,
    tags: normalizedTag ? [normalizedTag] : [],
    dueDate: project.due_date ? project.due_date.slice(0, 10) : "",
    progress: project.progress,
    ownerId: project.owner_id ?? "",
    ownerName: project.owner_name ?? undefined,
    value: project.value ?? 0,
    sourceMessage: project.source_type === "message" ? project.description ?? "" : "",
    sourceMessageId: project.source_message_id ?? undefined,
    sourceConversationId: project.conversation_id ?? undefined,
  };
}

function adaptProjectTask(task: ProjectTaskDto): ProjectTask {
  return {
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    ownerId: task.owner_id ?? "",
    ownerName: task.owner_name ?? undefined,
    dueDate: task.due_date ? task.due_date.slice(0, 10) : "",
    sourceMessageId: task.source_message_id ?? undefined,
    sourceConversationId: task.source_conversation_id ?? undefined,
  };
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
    sourceMessageId: card.sourceMessageId ?? "",
    sourceConversationId: card.sourceConversationId ?? "",
  };
}

function createEmptyForm(cards: ProjectCard[], owners: Owner[], overrides?: Partial<ProjectFormState>): ProjectFormState {
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
    ownerId: owners[0]?.id ?? "",
    value: "",
    sourceMessage: "",
    sourceMessageId: "",
    sourceConversationId: "",
    ...overrides,
  };
}

function createEmptyTaskDraft(defaultOwnerId = "", overrides?: Partial<ProjectTaskDraft>): ProjectTaskDraft {
  return {
    id: null,
    title: "",
    description: "",
    status: "open",
    priority: "medium",
    ownerId: defaultOwnerId,
    dueDate: "",
    ...overrides,
  };
}

function toTaskDraft(task: ProjectTask): ProjectTaskDraft {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    ownerId: task.ownerId,
    dueDate: task.dueDate,
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
    sourceMessageId: form.sourceMessageId || undefined,
    sourceConversationId: form.sourceConversationId || undefined,
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

function ProjectTaskSection({
  projectId,
  tasks,
  taskDraft,
  setTaskDraft,
  owners,
  isTasksLoading,
  isTaskSaving,
  onTaskSave,
  onTaskEdit,
  onTaskToggle,
  onTaskCancel,
}: {
  projectId?: string | null;
  tasks: ProjectTask[];
  taskDraft: ProjectTaskDraft;
  setTaskDraft: React.Dispatch<React.SetStateAction<ProjectTaskDraft>>;
  owners: Owner[];
  isTasksLoading: boolean;
  isTaskSaving: boolean;
  onTaskSave: () => void;
  onTaskEdit: (task: ProjectTask) => void;
  onTaskToggle: (task: ProjectTask) => void;
  onTaskCancel: () => void;
}) {
  if (!projectId) {
    return (
      <section className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">checklist</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">Project tasks</h3>
            <p className="text-sm leading-6 text-slate-500">
              Save the project first, then add execution tasks such as follow-ups, document review, and delivery steps.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const openCount = tasks.filter((task) => task.status !== "done" && task.status !== "cancelled").length;
  const completedCount = tasks.filter((task) => task.status === "done").length;

  return (
    <section className="space-y-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Project tasks</h3>
          <p className="mt-1 text-sm text-slate-500">
            Break this project into next actions without creating a second pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white px-3 py-1 text-slate-600 ring-1 ring-slate-200">
            {openCount} open
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
            {completedCount} done
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {isTasksLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
            Loading project tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
            No tasks yet. Add the first execution item for this project.
          </div>
        ) : (
          tasks.map((task) => {
            const priority = PRIORITY_META[task.priority];
            const status = TASK_STATUS_META[task.status];
            const overdue = isOverdue(task.dueDate) && task.status !== "done" && task.status !== "cancelled";
            return (
              <article
                key={task.id}
                className={`rounded-2xl border bg-white px-4 py-3 ${overdue ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priority.className}`}>
                        {priority.label}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    {task.description ? <p className="text-sm leading-6 text-slate-600">{task.description}</p> : null}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{task.ownerName ?? "Unassigned"}</span>
                      <span>•</span>
                      <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                      {overdue ? (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-rose-600">Overdue</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onTaskEdit(task)}
                      disabled={isTaskSaving}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onTaskToggle(task)}
                      disabled={isTaskSaving}
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
                    >
                      {task.status === "done" ? "Reopen" : "Mark done"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 md:col-span-2">
          <FieldLabel label={taskDraft.id ? "Edit task title" : "New task title"} />
          <FieldInput
            value={taskDraft.title}
            onChange={(e) => setTaskDraft((current) => ({ ...current, title: e.target.value }))}
            placeholder="Send contract, review onboarding notes, follow up tomorrow..."
          />
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <FieldLabel label="Notes" />
          <FieldTextArea
            value={taskDraft.description}
            onChange={(e) => setTaskDraft((current) => ({ ...current, description: e.target.value }))}
            placeholder="Optional execution details for the assigned agent"
            className="min-h-[84px]"
          />
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel label="Assignee" />
          <FieldSelect value={taskDraft.ownerId} onChange={(e) => setTaskDraft((current) => ({ ...current, ownerId: e.target.value }))}>
            <option value="">Unassigned</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </FieldSelect>
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel label="Priority" />
          <FieldSelect
            value={taskDraft.priority}
            onChange={(e) => setTaskDraft((current) => ({ ...current, priority: e.target.value as PriorityId }))}
          >
            {Object.entries(PRIORITY_META).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.label}
              </option>
            ))}
          </FieldSelect>
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel label="Status" />
          <FieldSelect
            value={taskDraft.status}
            onChange={(e) => setTaskDraft((current) => ({ ...current, status: e.target.value as TaskStatusId }))}
          >
            {Object.entries(TASK_STATUS_META).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.label}
              </option>
            ))}
          </FieldSelect>
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel label="Due date" />
          <FieldInput
            type="date"
            value={taskDraft.dueDate}
            onChange={(e) => setTaskDraft((current) => ({ ...current, dueDate: e.target.value }))}
          />
        </label>

        <div className="flex gap-3 md:col-span-2 md:justify-end">
          {taskDraft.id ? (
            <button
              type="button"
              onClick={onTaskCancel}
              disabled={isTaskSaving}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel edit
            </button>
          ) : null}
          <button
            type="button"
            onClick={onTaskSave}
            disabled={isTaskSaving}
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            {isTaskSaving ? "Saving..." : taskDraft.id ? "Save task" : "Add task"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ProjectCardView({
  card,
  owner,
  onOpen,
  onDragStart,
}: {
  card: ProjectCard;
  owner?: Owner;
  onOpen: (card: ProjectCard) => void;
  onDragStart: (cardId: string, stageId: StageId) => void;
}) {
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

      {card.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {card.tags.map((tag) => <TagPill key={tag} tag={tag} />)}
        </div>
      )}

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
  taskDraft,
  setTaskDraft,
  tasks,
  onClose,
  onSave,
  onTaskSave,
  onTaskEdit,
  onTaskToggle,
  onTaskCancel,
  onOpenConversation,
  onDelete,
  owners,
  isEditing,
  stages,
  isSaving,
  isTasksLoading,
  isTaskSaving,
}: {
  form: ProjectFormState;
  setForm: React.Dispatch<React.SetStateAction<ProjectFormState | null>>;
  taskDraft: ProjectTaskDraft;
  setTaskDraft: React.Dispatch<React.SetStateAction<ProjectTaskDraft>>;
  tasks: ProjectTask[];
  onClose: () => void;
  onSave: () => void;
  onTaskSave: () => void;
  onTaskEdit: (task: ProjectTask) => void;
  onTaskToggle: (task: ProjectTask) => void;
  onTaskCancel: () => void;
  onOpenConversation?: () => void;
  onDelete?: () => void;
  owners: Owner[];
  isEditing: boolean;
  stages: StageOption[];
  isSaving: boolean;
  isTasksLoading: boolean;
  isTaskSaving: boolean;
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
              {stages.map((stage) => (
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
              {owners.length === 0 ? <option value="">Unassigned</option> : null}
              {owners.map((owner) => (
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
              <FieldLabel label="Demand summary" />
              <FieldTextArea
                value={form.sourceMessage}
                onChange={(e) => setForm((current) => current ? { ...current, sourceMessage: e.target.value } : current)}
                placeholder="Use the Messages workspace to create real message-origin projects with preserved provenance."
              />
              {!isEditing ? (
                <p className="text-xs leading-5 text-slate-500">
                  Message-origin projects must be created from Messages so the source message and conversation stay linked.
                </p>
              ) : null}
            </label>
          ) : null}
        </div>

        <ProjectTaskSection
          projectId={form.id}
          tasks={tasks}
          taskDraft={taskDraft}
          setTaskDraft={setTaskDraft}
          owners={owners}
          isTasksLoading={isTasksLoading}
          isTaskSaving={isTaskSaving}
          onTaskSave={onTaskSave}
          onTaskEdit={onTaskEdit}
          onTaskToggle={onTaskToggle}
          onTaskCancel={onTaskCancel}
        />

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            {form.origin === "message" && form.sourceConversationId && onOpenConversation ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={onOpenConversation}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
              >
                <span className="material-symbols-outlined text-[16px]">forum</span>
                Open source conversation
              </button>
            ) : null}
            {isEditing && onDelete && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (window.confirm("Delete this project? This action cannot be undone.")) onDelete();
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create project"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const DAY_PX = 30;
const GANTT_WEEKS = 8;

function GanttView({
  cards,
  onCardClick,
  stages,
}: {
  cards: ProjectCard[];
  onCardClick: (c: ProjectCard) => void;
  stages: StageOption[];
}) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  const totalDays = GANTT_WEEKS * 7;

  const weeks: Date[] = [];
  for (let w = 0; w < GANTT_WEEKS; w++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + w * 7);
    weeks.push(d);
  }

  const todayOffset = ((today.getTime() - startDate.getTime()) / 86400000) * DAY_PX;

  function getBarPos(card: ProjectCard) {
    const due = new Date(`${card.dueDate}T00:00:00`);
    const spanDays = Math.max(7, Math.round((card.progress / 100) * 21 + 7));
    const cardStart = new Date(due.getTime() - spanDays * 86400000);
    const leftDays = (cardStart.getTime() - startDate.getTime()) / 86400000;
    return { left: Math.max(0, leftDays * DAY_PX), width: Math.max(80, spanDays * DAY_PX) };
  }

  const stage = (card: ProjectCard) => stages.find((s) => s.id === card.stage);

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#DCE4EF] bg-white shadow-sm">
      {/* Header */}
      <div className="flex border-b border-[#DCE4EF]">
        <div className="w-52 shrink-0 border-r border-[#DCE4EF] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Project
        </div>
        <div className="overflow-x-auto flex-1">
          <div className="flex" style={{ minWidth: totalDays * DAY_PX }}>
            {weeks.map((w, i) => (
              <div key={i} className="border-r border-slate-100 px-2 py-2 text-[10px] font-semibold text-slate-400" style={{ width: 7 * DAY_PX }}>
                {w.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Rows */}
      <div className="max-h-[480px] overflow-y-auto">
        {cards.map((card, i) => {
          const { left, width } = getBarPos(card);
          const s = stage(card);
          const accentColor = s?.id === "lead" ? "#94a3b8" : s?.id === "qualification" ? "#7C4DFF" : s?.id === "proposal" ? "#F59E0B" : s?.id === "negotiation" ? "#F97316" : "#10B981";
          return (
            <div key={card.id} className={`flex items-center border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`} style={{ height: 48 }}>
              <button
                type="button"
                onClick={() => onCardClick(card)}
                className="flex w-52 shrink-0 flex-col justify-center border-r border-[#DCE4EF] px-4 py-1 text-left hover:bg-indigo-50/40 transition"
                style={{ height: 48 }}
              >
                <span className="truncate text-[12px] font-semibold text-slate-800">{card.title}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accentColor }} />
                  <span className="text-[10px] text-slate-400">{s?.label}</span>
                </div>
              </button>
              <div className="relative flex-1 overflow-x-hidden" style={{ height: 48 }}>
                <div className="relative" style={{ minWidth: totalDays * DAY_PX, height: "100%" }}>
                  {/* Today line */}
                  <div className="absolute top-0 bottom-0 z-10" style={{ left: todayOffset, width: 1.5, background: "#7C4DFF", opacity: 0.4 }} />
                  {/* Bar */}
                  <button
                    type="button"
                    onClick={() => onCardClick(card)}
                    className="absolute top-1/2 -translate-y-1/2 flex items-center overflow-hidden rounded-lg px-2 text-[10px] font-semibold text-white transition hover:opacity-100"
                    style={{ left, width, height: 22, background: accentColor, opacity: 0.82 }}
                    title={card.title}
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-lg" style={{ width: `${card.progress}%`, background: "rgba(255,255,255,0.22)" }} />
                    <span className="relative truncate">{card.contact}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewId>("kanban");
  const [cards, setCards] = useState<ProjectCard[]>([]);
  const [projectTasksByProjectId, setProjectTasksByProjectId] = useState<Record<string, ProjectTask[]>>({});
  const [stageOptions, setStageOptions] = useState<StageOption[]>(STAGES);
  const [form, setForm] = useState<ProjectFormState | null>(null);
  const [dragState, setDragState] = useState<{ cardId: string; fromStage: StageId } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityId | "ALL">("ALL");
  const [channelFilter, setChannelFilter] = useState<ChannelId | "ALL">("ALL");
  const [originFilter, setOriginFilter] = useState<OriginId | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isTaskSaving, setIsTaskSaving] = useState(false);
  const [handledQueryProjectId, setHandledQueryProjectId] = useState<string | null>(null);

  const owners = useMemo<Owner[]>(() => {
    const ownerMap = new Map<string, Owner>();

    for (const card of cards) {
      if (!card.ownerId || !card.ownerName) continue;
      ownerMap.set(card.ownerId, {
        id: card.ownerId,
        name: card.ownerName,
        initials: getInitials(card.ownerName),
        tint: "bg-indigo-100",
        text: "text-indigo-700",
      });
    }

    if (user && !ownerMap.has(user.id)) {
      ownerMap.set(user.id, {
        id: user.id,
        name: user.full_name,
        initials: getInitials(user.full_name),
        tint: "bg-indigo-100",
        text: "text-indigo-700",
      });
    }

    return [...ownerMap.values()];
  }, [cards, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadProjectsWorkspace() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [stagesResponse, projectsResponse] = await Promise.all([
          projectsApi.getProjectStages(),
          projectsApi.listProjects(),
        ]);

        if (!isMounted) return;

        setStageOptions(mapStageOptions(stagesResponse));
        setCards(projectsResponse.data.map(adaptProject));
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load projects workspace.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProjectsWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

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
    return stageOptions.reduce<Record<StageId, ProjectCard[]>>((acc, stage) => {
      acc[stage.id] = filteredCards.filter((card) => card.stage === stage.id);
      return acc;
    }, {} as Record<StageId, ProjectCard[]>);
  }, [filteredCards, stageOptions]);

  const kpis = useMemo(() => {
    const activeProjects = filteredCards.filter((card) => card.progress < 100).length;
    const atRisk = filteredCards.filter((card) => isOverdue(card.dueDate) && card.progress < 100).length;
    const conversationOrigin = filteredCards.filter((card) => card.origin === "message").length;
    const totalOwners = new Set(filteredCards.map((card) => card.ownerId).filter(Boolean)).size;
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
    return [...filteredCards].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [filteredCards]);

  const clearFilters = () => {
    setSearchQuery("");
    setOwnerFilter("ALL");
    setPriorityFilter("ALL");
    setChannelFilter("ALL");
    setOriginFilter("ALL");
  };

  const isEditing = Boolean(form?.id);
  const defaultTaskOwnerId = user?.id ?? owners[0]?.id ?? "";
  const activeProjectTasks = form?.id ? projectTasksByProjectId[form.id] ?? [] : [];
  const [taskDraft, setTaskDraft] = useState<ProjectTaskDraft>(createEmptyTaskDraft());

  const openNewProject = (stage: StageId = "lead") => {
    setForm(createEmptyForm(cards, owners, { stage }));
    setTaskDraft(createEmptyTaskDraft(defaultTaskOwnerId));
  };

  const openExistingProject = (card: ProjectCard) => {
    setForm(toFormState(card));
    setTaskDraft(createEmptyTaskDraft(card.ownerId || defaultTaskOwnerId));
  };

  const openSourceConversation = () => {
    if (!form?.sourceConversationId) return;
    router.push(`/?conversationId=${form.sourceConversationId}`);
  };

  const closeProjectModal = () => {
    setForm(null);
    setTaskDraft(createEmptyTaskDraft(defaultTaskOwnerId));
  };

  useEffect(() => {
    const queryProjectId = searchParams.get("projectId");
    if (!queryProjectId || isLoading || handledQueryProjectId === queryProjectId || cards.length === 0) return;

    const targetProject = cards.find((card) => card.id === queryProjectId);
    if (!targetProject) return;

    startTransition(() => {
      setActiveView("kanban");
      setForm(toFormState(targetProject));
      setTaskDraft(createEmptyTaskDraft(targetProject.ownerId || defaultTaskOwnerId));
      setHandledQueryProjectId(queryProjectId);
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("projectId");
    router.replace(nextParams.toString() ? `/projects?${nextParams.toString()}` : "/projects", { scroll: false });
  }, [cards, defaultTaskOwnerId, handledQueryProjectId, isLoading, router, searchParams]);

  useEffect(() => {
    const projectId = form?.id;
    if (!projectId) return;
    const currentProjectId = projectId;

    let isMounted = true;

    async function loadProjectTasks() {
      try {
        setIsTasksLoading(true);
        const tasks = await projectsApi.listProjectTasks(currentProjectId);
        if (!isMounted) return;
        setProjectTasksByProjectId((current) => ({
          ...current,
          [currentProjectId]: tasks.map(adaptProjectTask),
        }));
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load project tasks.");
      } finally {
        if (isMounted) setIsTasksLoading(false);
      }
    }

    void loadProjectTasks();

    return () => {
      isMounted = false;
    };
  }, [form?.id]);

  const handleSave = async () => {
    if (!form) return;

    const normalized = fromFormState(form);
    const primaryTag = normalized.tags[0] ?? normalizeTagValue(form.workType || "");

    if (!normalized.title || !normalized.contact || !normalized.workType) {
      return;
    }

    if (!form.id && normalized.origin === "message" && !normalized.sourceMessageId) {
      setErrorMessage("Create message-origin projects from the Messages workspace so provenance is preserved.");
      return;
    }

    const payload: ProjectCreateRequest = {
      title: normalized.title,
      description: normalized.origin === "message" ? normalized.sourceMessage || normalized.workType : normalized.workType,
      stage: normalized.stage,
      status: normalized.stage === "closed" ? "done" : "open",
      priority: normalized.priority,
      source_type: normalized.origin,
      source_message_id: normalized.sourceMessageId ?? null,
      source_conversation_id: normalized.sourceConversationId ?? null,
      contact_name: normalized.contact,
      channel: toApiChannel(normalized.channel),
      tag: primaryTag || null,
      owner_user_id: normalized.ownerId || null,
      due_date: toApiDateTime(normalized.dueDate),
      value: normalized.value,
      progress: normalized.progress,
    };

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (form.id) {
        const updated = await projectsApi.updateProject(form.id, payload as ProjectUpdateRequest);
        setCards((current) => current.map((card) => (card.id === form.id ? adaptProject(updated) : card)));
      } else {
        const created = await projectsApi.createProject(payload);
        setCards((current) => [adaptProject(created), ...current]);
      }

      setForm(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const projectId = form?.id;
    if (!projectId) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await projectsApi.deleteProject(projectId);
      setCards((current) => current.filter((card) => card.id !== projectId));
      setProjectTasksByProjectId((current) => {
        const next = { ...current };
        delete next[projectId];
        return next;
      });
      setForm(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete project.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskSave = async () => {
    const projectId = form?.id;
    if (!projectId) return;
    if (!taskDraft.title.trim()) return;

    const payload: ProjectTaskCreateRequest = {
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim() || null,
      status: taskDraft.status,
      priority: taskDraft.priority,
      owner_user_id: taskDraft.ownerId || null,
      due_date: toApiDateTime(taskDraft.dueDate),
    };

    try {
      setIsTaskSaving(true);
      setErrorMessage(null);

      if (taskDraft.id) {
        const updated = await projectsApi.updateProjectTask(projectId, taskDraft.id, payload as ProjectTaskUpdateRequest);
        setProjectTasksByProjectId((current) => ({
          ...current,
          [projectId]: (current[projectId] ?? []).map((task: ProjectTask) => (task.id === taskDraft.id ? adaptProjectTask(updated) : task)),
        }));
      } else {
        const created = await projectsApi.createProjectTask(projectId, payload);
        setProjectTasksByProjectId((current) => ({
          ...current,
          [projectId]: [adaptProjectTask(created), ...(current[projectId] ?? [])],
        }));
      }

      setTaskDraft(createEmptyTaskDraft(form.ownerId || defaultTaskOwnerId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save project task.");
    } finally {
      setIsTaskSaving(false);
    }
  };

  const handleTaskEdit = (task: ProjectTask) => {
    setTaskDraft(toTaskDraft(task));
  };

  const handleTaskCancel = () => {
    setTaskDraft(createEmptyTaskDraft(form?.ownerId || defaultTaskOwnerId));
  };

  const handleTaskToggle = async (task: ProjectTask) => {
    const projectId = form?.id;
    if (!projectId) return;
    const nextStatus: TaskStatusId = task.status === "done" ? "open" : "done";

    try {
      setIsTaskSaving(true);
      setErrorMessage(null);
      const updated = await projectsApi.updateProjectTask(projectId, task.id, { status: nextStatus });
      setProjectTasksByProjectId((current) => ({
        ...current,
        [projectId]: (current[projectId] ?? []).map((item: ProjectTask) => (item.id === task.id ? adaptProjectTask(updated) : item)),
      }));

      if (taskDraft.id === task.id) {
        setTaskDraft(toTaskDraft(adaptProjectTask(updated)));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update task status.");
    } finally {
      setIsTaskSaving(false);
    }
  };

  const handleDragStart = (cardId: string, stageId: StageId) => {
    setDragState({ cardId, fromStage: stageId });
  };

  const handleDrop = async (targetStage: StageId) => {
    if (!dragState) return;

    const cardId = dragState.cardId;
    const previousCards = cards;

    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              stage: targetStage,
            }
          : card
      )
    );

    if (form?.id === cardId) {
      setForm((current) => (current ? { ...current, stage: targetStage } : current));
    }

    setDragState(null);
    setDragOverStage(null);

    try {
      const updated = await projectsApi.moveProjectStage(cardId, targetStage);
      setCards((current) => current.map((card) => (card.id === cardId ? adaptProject(updated) : card)));
    } catch (error) {
      setCards(previousCards);
      setErrorMessage(error instanceof Error ? error.message : "Failed to move project.");
    }
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
                onClick={() => openNewProject()}
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
                {owners.map((owner) => (
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
              {owners.length > 0 ? (
                <>
                  {owners.map((owner, index) => (
                    <span
                      key={owner.id}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ring-white ${owner.tint} ${owner.text} ${index > 0 ? "-ml-1.5" : ""}`}
                      title={owner.name}
                    >
                      {owner.initials}
                    </span>
                  ))}
                  <span className="ml-1 text-xs text-slate-500">
                    {owners.length} {owners.length === 1 ? "owner" : "owners"}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-500">No owners available</span>
              )}
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

          {errorMessage ? (
            <div className="mb-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Projects workspace error</p>
                  <p className="mt-1 text-sm text-rose-600">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-xs font-semibold text-rose-700 transition hover:text-rose-900"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-[24px] border border-[#DCE4EF] bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="material-symbols-outlined animate-spin text-[20px] text-indigo-600">progress_activity</span>
                Loading projects workspace...
              </div>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {cards.length === 0 ? "inventory_2" : "filter_alt"}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {cards.length === 0 ? "No project data yet" : "No projects match the current filters"}
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {cards.length === 0
                  ? "The Projects workspace is now clean and ready to be tested with real data."
                  : "Try widening the current filters or clear them to bring back the full pipeline workspace."}
              </p>
              {cards.length === 0 ? (
                <button
                  type="button"
                  onClick={() => openNewProject()}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Create the first project
                </button>
              ) : null}
              {cards.length > 0 && hasActiveFilters ? (
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
              {stageOptions.map((stage) => {
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
                            owner={owners.find((item) => item.id === card.ownerId)}
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
                  const owner = owners.find((item) => item.id === card.ownerId);
                  const stage = stageOptions.find((item) => item.id === card.stage);
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
            <GanttView cards={timelineCards} onCardClick={openExistingProject} stages={stageOptions} />
          )}
        </section>
      </div>

      {form ? (
        <ProjectModal
          form={form}
          taskDraft={taskDraft}
          setTaskDraft={setTaskDraft}
          tasks={activeProjectTasks}
          owners={owners}
          setForm={setForm}
          onClose={closeProjectModal}
          onSave={handleSave}
          onTaskSave={handleTaskSave}
          onTaskEdit={handleTaskEdit}
          onTaskToggle={handleTaskToggle}
          onTaskCancel={handleTaskCancel}
          onOpenConversation={openSourceConversation}
          onDelete={isEditing ? handleDelete : undefined}
          isEditing={isEditing}
          stages={stageOptions}
          isSaving={isSaving}
          isTasksLoading={isTasksLoading}
          isTaskSaving={isTaskSaving}
        />
      ) : null}
    </main>
  );
}
