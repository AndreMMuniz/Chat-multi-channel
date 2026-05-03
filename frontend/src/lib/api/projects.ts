import { apiGet, apiGetList, apiMutate } from "@/lib/apiClient";
import type {
  ProjectCreateRequest,
  ProjectDto,
  ProjectFromMessageRequest,
  ProjectStage,
  ProjectTaskCreateRequest,
  ProjectTaskDto,
  ProjectTaskUpdateRequest,
  ProjectUpdateRequest,
} from "@/types/project";

export async function getProjectStages(): Promise<ProjectStage[]> {
  return apiGet<ProjectStage[]>("/admin/project-stages");
}

export async function listProjects(params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGetList<ProjectDto>(`/admin/projects${suffix}`);
}

export async function createProject(body: ProjectCreateRequest): Promise<ProjectDto> {
  return apiMutate<ProjectCreateRequest, ProjectDto>("/admin/projects", "POST", body);
}

export async function getProject(projectId: string): Promise<ProjectDto> {
  return apiGet<ProjectDto>(`/admin/projects/${projectId}`);
}

export async function updateProject(projectId: string, body: ProjectUpdateRequest): Promise<ProjectDto> {
  return apiMutate<ProjectUpdateRequest, ProjectDto>(`/admin/projects/${projectId}`, "PATCH", body);
}

export async function moveProjectStage(projectId: string, stage: string): Promise<ProjectDto> {
  return apiMutate<{ stage: string }, ProjectDto>(`/admin/projects/${projectId}/stage`, "PATCH", { stage });
}

export async function deleteProject(projectId: string): Promise<{ deleted: boolean; id: string }> {
  return apiMutate<undefined, { deleted: boolean; id: string }>(`/admin/projects/${projectId}`, "DELETE");
}

export async function createProjectFromMessage(
  messageId: string,
  body: ProjectFromMessageRequest,
): Promise<ProjectDto> {
  return apiMutate<ProjectFromMessageRequest, ProjectDto>(`/admin/projects/from-message/${messageId}`, "POST", body);
}

export async function listProjectTasks(projectId: string): Promise<ProjectTaskDto[]> {
  return apiGet<ProjectTaskDto[]>(`/admin/projects/${projectId}/tasks`);
}

export async function createProjectTask(
  projectId: string,
  body: ProjectTaskCreateRequest,
): Promise<ProjectTaskDto> {
  return apiMutate<ProjectTaskCreateRequest, ProjectTaskDto>(`/admin/projects/${projectId}/tasks`, "POST", body);
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  body: ProjectTaskUpdateRequest,
): Promise<ProjectTaskDto> {
  return apiMutate<ProjectTaskUpdateRequest, ProjectTaskDto>(
    `/admin/projects/${projectId}/tasks/${taskId}`,
    "PATCH",
    body,
  );
}
