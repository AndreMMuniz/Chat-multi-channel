export type ProjectStageKey = "lead" | "qualification" | "proposal" | "negotiation" | "closed";
export type ProjectPriority = "high" | "medium" | "low";
export type ProjectStatus = "open" | "done" | "archived";
export type ProjectSourceType = "manual" | "message";
export type ProjectChannel = "whatsapp" | "telegram" | "email" | "sms" | "web";
export type ProjectTaskStatus = "open" | "in_progress" | "done" | "cancelled";

export interface ProjectStage {
  key: ProjectStageKey;
  label: string;
  position: number;
  is_active: boolean;
}

export interface ProjectDto {
  id: string;
  reference: string;
  title: string;
  description?: string | null;
  stage: ProjectStageKey;
  priority: ProjectPriority;
  status: ProjectStatus;
  source_type: ProjectSourceType;
  source_message_id?: string | null;
  conversation_id?: string | null;
  project_context_id?: string | null;
  contact_name?: string | null;
  channel?: ProjectChannel | null;
  tag?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  due_date?: string | null;
  value?: number | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateRequest {
  title: string;
  description?: string | null;
  stage: ProjectStageKey;
  status: ProjectStatus;
  priority: ProjectPriority;
  source_type: ProjectSourceType;
  source_message_id?: string | null;
  source_conversation_id?: string | null;
  project_context_id?: string | null;
  contact_name?: string | null;
  channel?: ProjectChannel | null;
  tag?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  value?: number | null;
  progress: number;
}

export type ProjectUpdateRequest = Partial<ProjectCreateRequest>;

export interface ProjectFromMessageRequest {
  title?: string | null;
  description?: string | null;
  stage: ProjectStageKey;
  priority: ProjectPriority;
  owner_user_id?: string | null;
  project_context_id?: string | null;
  attach_conversation_to_project?: boolean;
  due_date?: string | null;
  value?: number | null;
  progress: number;
  tag?: string | null;
}

export interface ProjectTaskDto {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  owner_id?: string | null;
  owner_name?: string | null;
  source_message_id?: string | null;
  source_conversation_id?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTaskCreateRequest {
  title: string;
  description?: string | null;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  owner_user_id?: string | null;
  source_message_id?: string | null;
  source_conversation_id?: string | null;
  due_date?: string | null;
}

export type ProjectTaskUpdateRequest = Partial<ProjectTaskCreateRequest>;
