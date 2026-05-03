export type ProjectStageKey = "lead" | "qualification" | "proposal" | "negotiation" | "closed";
export type ProjectPriority = "high" | "medium" | "low";
export type ProjectStatus = "open" | "done" | "archived";
export type ProjectSourceType = "manual" | "message";
export type ProjectChannel = "whatsapp" | "telegram" | "email" | "sms" | "web";

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
  due_date?: string | null;
  value?: number | null;
  progress: number;
  tag?: string | null;
}
