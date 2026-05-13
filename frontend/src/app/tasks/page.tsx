"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { projectsApi } from "@/lib/api/index";
import type {
  ProjectDto,
  ProjectPriority,
  ProjectTaskAutomationStatus,
  ProjectTaskDto,
  ProjectTaskStatus,
} from "@/types/project";

type ScopeId = "assigned" | "created" | "overdue" | "scheduled" | "done";

const PRIORITY_META: Record<ProjectPriority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
  medium: { label: "Medium", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  low: { label: "Low", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
};

const TASK_STATUS_META: Record<ProjectTaskStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" },
  in_progress: { label: "In Progress", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
};

const AUTOMATION_STATUS_META: Record<ProjectTaskAutomationStatus, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-violet-50 text-violet-700 ring-1 ring-violet-100" },
  processing: { label: "Processing", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" },
};

function formatDate(date?: string | null) {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

function formatDateTime(date?: string | null) {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function isOverdue(date?: string | null, status?: ProjectTaskStatus) {
  if (!date || status === "done" || status === "cancelled") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ProjectTaskDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeScope, setActiveScope] = useState<ScopeId>("assigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [creatorFilter, setCreatorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<ProjectTaskStatus | "ALL">("ALL");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    const scope = searchParams.get("scope");
    const status = searchParams.get("status");

    if (scope && ["assigned", "created", "overdue", "scheduled", "done"].includes(scope)) {
      setActiveScope(scope as ScopeId);
    }

    if (status && ["open", "in_progress", "done", "cancelled"].includes(status)) {
      setStatusFilter(status as ProjectTaskStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const [tasksResponse, projectsResponse] = await Promise.all([
          projectsApi.listTasksWorkspace({ limit: 500 }),
          projectsApi.listProjects({ limit: 200 }),
        ]);

        if (!isMounted) return;
        setTasks(tasksResponse.data);
        setProjects(projectsResponse.data);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load tasks workspace.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadWorkspace();
    return () => {
      isMounted = false;
    };
  }, []);

  const assigneeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) {
      if (task.owner_id && task.owner_name) map.set(task.owner_id, task.owner_name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const creatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) {
      if (task.created_by_id && task.created_by_name) map.set(task.created_by_id, task.created_by_name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const scopedTasks = useMemo(() => {
    return tasks.filter((task) => {
      switch (activeScope) {
        case "assigned":
          return Boolean(currentUserId) && task.owner_id === currentUserId;
        case "created":
          return Boolean(currentUserId) && task.created_by_id === currentUserId;
        case "overdue":
          return isOverdue(task.due_date, task.status);
        case "scheduled":
          return task.automation_status === "scheduled";
        case "done":
          return task.status === "done";
        default:
          return true;
      }
    });
  }, [activeScope, currentUserId, tasks]);

  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return scopedTasks
      .filter((task) => {
        const matchesQuery =
          query.length === 0 ||
          [
            task.title,
            task.description ?? "",
            task.project_reference ?? "",
            task.project_title ?? "",
            task.owner_name ?? "",
            task.created_by_name ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        const matchesProject = projectFilter === "ALL" || task.project_id === projectFilter;
        const matchesAssignee = assigneeFilter === "ALL" || task.owner_id === assigneeFilter;
        const matchesCreator = creatorFilter === "ALL" || task.created_by_id === creatorFilter;
        const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;

        return matchesQuery && matchesProject && matchesAssignee && matchesCreator && matchesStatus;
      })
      .sort((a, b) => {
        const overdueA = isOverdue(a.due_date, a.status) ? 1 : 0;
        const overdueB = isOverdue(b.due_date, b.status) ? 1 : 0;
        if (overdueA !== overdueB) return overdueB - overdueA;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [assigneeFilter, creatorFilter, projectFilter, scopedTasks, searchQuery, statusFilter]);

  const scopeCounts = useMemo(
    () => ({
      assigned: tasks.filter((task) => task.owner_id === currentUserId).length,
      created: tasks.filter((task) => task.created_by_id === currentUserId).length,
      overdue: tasks.filter((task) => isOverdue(task.due_date, task.status)).length,
      scheduled: tasks.filter((task) => task.automation_status === "scheduled").length,
      done: tasks.filter((task) => task.status === "done").length,
    }),
    [currentUserId, tasks]
  );

  const openProject = (projectId: string) => {
    router.push(`/projects?projectId=${projectId}`);
  };

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const toggleTaskStatus = async (task: ProjectTaskDto) => {
    try {
      setUpdatingTaskId(task.id);
      setErrorMessage(null);
      const nextStatus: ProjectTaskStatus = task.status === "done" ? "open" : "done";
      const updated = await projectsApi.updateProjectTask(task.project_id, task.id, { status: nextStatus });
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      if (selectedTaskId === task.id) {
        setSelectedTaskId(updated.id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update task.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const taskPanel = selectedTask ? createPortal(
    <div className="pointer-events-none fixed inset-0 z-50">
      <div
        className="pointer-events-auto absolute inset-0 bg-slate-900/20"
        onClick={() => setSelectedTaskId(null)}
      />
      <aside className="pointer-events-auto absolute right-0 top-0 flex h-full w-[min(100vw,36rem)] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {selectedTask.project_reference || "Project task"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{selectedTask.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedTask.project_title || "Untitled project"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTaskId(null)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Execution Context</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${TASK_STATUS_META[selectedTask.status].className}`}>
                  {TASK_STATUS_META[selectedTask.status].label}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Priority</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${PRIORITY_META[selectedTask.priority].className}`}>
                  {PRIORITY_META[selectedTask.priority].label}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Assignee</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{selectedTask.owner_name || "Unassigned"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Created by</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{selectedTask.created_by_name || "Unknown"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Due Date</p>
                <p className={`mt-2 text-sm font-medium ${isOverdue(selectedTask.due_date, selectedTask.status) ? "text-rose-600" : "text-slate-800"}`}>
                  {formatDate(selectedTask.due_date)}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              {selectedTask.description || "No additional notes were added to this task."}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Provenance</h3>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {selectedTask.source_message_id ? (
                <div className="space-y-2">
                  <p className="font-medium text-slate-800">This task was created from a message.</p>
                  <p>Message ID: <span className="font-mono text-[12px] text-slate-500">{selectedTask.source_message_id}</span></p>
                  <p>Conversation ID: <span className="font-mono text-[12px] text-slate-500">{selectedTask.source_conversation_id || "Unavailable"}</span></p>
                </div>
              ) : (
                <p>This task was created directly inside project execution flow.</p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Automation</h3>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {selectedTask.automation_type ? (
                <div className="space-y-3">
                  {selectedTask.automation_status ? (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${AUTOMATION_STATUS_META[selectedTask.automation_status].className}`}>
                      {AUTOMATION_STATUS_META[selectedTask.automation_status].label}
                    </span>
                  ) : null}
                  <p><span className="font-medium text-slate-800">Type:</span> {selectedTask.automation_type === "send_message" ? "Send message" : "Scheduled action"}</p>
                  <p><span className="font-medium text-slate-800">Run at:</span> {formatDateTime(selectedTask.automation_run_at)}</p>
                  {selectedTask.automation_message_content ? (
                    <p><span className="font-medium text-slate-800">Message:</span> {selectedTask.automation_message_content}</p>
                  ) : null}
                  {selectedTask.automation_action_label ? (
                    <p><span className="font-medium text-slate-800">Action:</span> {selectedTask.automation_action_label}</p>
                  ) : null}
                  {selectedTask.automation_last_error ? (
                    <p className="font-medium text-rose-600">Last error: {selectedTask.automation_last_error}</p>
                  ) : null}
                </div>
              ) : (
                <p>No automation is attached to this task.</p>
              )}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={() => openProject(selectedTask.project_id)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            Open Project
          </button>
          <button
            type="button"
            onClick={() => setSelectedTaskId(null)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </aside>
    </div>,
    document.body
  ) : null;

  return (
    <>
    <main className="flex-1 overflow-y-auto bg-[#F6F8FC]">
      <div className="flex min-h-full flex-col">
        <header className="border-b border-[#E6EBF3] bg-white">
          <div className="flex flex-col gap-4 px-6 py-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  task
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[18px] font-semibold leading-5 text-slate-900">Tasks</h1>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Operational queue across projects for assigned, created, overdue, and scheduled work.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <span className="material-symbols-outlined text-[16px]">checklist</span>
              {visibleTasks.length} tasks in current view
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[#EEF2F7] px-6 py-3">
            {([
              ["assigned", "Assigned to me"],
              ["created", "Created by me"],
              ["overdue", "Overdue"],
              ["scheduled", "Scheduled"],
              ["done", "Done"],
            ] as Array<[ScopeId, string]>).map(([scope, label]) => {
              const active = activeScope === scope;
              return (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setActiveScope(scope)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20 text-white" : "bg-white text-slate-500"}`}>
                    {scopeCounts[scope]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#EEF2F7] px-6 py-3 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 shadow-sm focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search tasks, projects, assignees..."
                  className="h-full w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
                className="h-11 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.reference} · {project.title}
                  </option>
                ))}
              </select>

              <select
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value)}
                className="h-11 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All assignees</option>
                {assigneeOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={creatorFilter}
                onChange={(event) => setCreatorFilter(event.target.value)}
                className="h-11 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All creators</option>
                {creatorOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ProjectTaskStatus | "ALL")}
                className="h-11 min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All statuses</option>
                {Object.entries(TASK_STATUS_META).map(([id, meta]) => (
                  <option key={id} value={id}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <section className="flex-1 px-6 py-4">
          {errorMessage ? (
            <div className="mb-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p className="font-semibold">Tasks workspace error</p>
              <p className="mt-1 text-sm text-rose-600">{errorMessage}</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-[24px] border border-[#DCE4EF] bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="material-symbols-outlined animate-spin text-[20px] text-indigo-600">progress_activity</span>
                Loading tasks workspace...
              </div>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  checklist
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No tasks in this view</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Adjust the current scope or filters to surface the right execution queue.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-[#DCE4EF] bg-white shadow-sm">
              <div className="grid grid-cols-[1.7fr_1.2fr_1fr_1fr_0.9fr_0.9fr_1.15fr] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                <span>Task</span>
                <span>Project</span>
                <span>Assignee</span>
                <span>Created by</span>
                <span>Status</span>
                <span>Due</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-slate-200 bg-white">
                {visibleTasks.map((task) => {
                  const priority = PRIORITY_META[task.priority];
                  const status = TASK_STATUS_META[task.status];
                  const overdue = isOverdue(task.due_date, task.status);
                  const isUpdating = updatingTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      className="grid grid-cols-[1.7fr_1.2fr_1fr_1fr_0.9fr_0.9fr_1.15fr] gap-3 px-4 py-4 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskId(task.id)}
                            className="min-w-0 max-w-full truncate text-left text-sm font-semibold text-slate-900 transition hover:text-indigo-700"
                          >
                            {task.title}
                          </button>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priority.className}`}>
                            {priority.label}
                          </span>
                          {task.automation_status === "scheduled" ? (
                            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100">
                              Scheduled
                            </span>
                          ) : null}
                          {task.source_message_id ? (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-100">
                              From message
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {task.description || "No additional notes"}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openProject(task.project_id)}
                          className="w-full min-w-0 text-left transition hover:text-indigo-700"
                        >
                          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                            {task.project_reference || "Project"}
                          </p>
                          <p className="truncate text-sm font-medium text-slate-800">
                            {task.project_title || "Untitled project"}
                          </p>
                        </button>
                      </div>

                      <div className="flex items-center text-sm text-slate-700">
                        {task.owner_name || "Unassigned"}
                      </div>

                      <div className="flex items-center text-sm text-slate-700">
                        {task.created_by_name || "Unknown"}
                      </div>

                      <div className="flex items-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center text-sm">
                        <span className={overdue ? "font-semibold text-rose-600" : "text-slate-700"}>
                          {formatDate(task.due_date)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task)}
                          disabled={isUpdating}
                          className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-semibold transition ${
                            task.status === "done"
                              ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
                          } ${isUpdating ? "cursor-wait opacity-60" : ""}`}
                        >
                          {isUpdating ? "Updating..." : task.status === "done" ? "Reopen" : "Mark done"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openProject(task.project_id)}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
                        >
                          Open Project
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
    {taskPanel}
    </>
  );
}
