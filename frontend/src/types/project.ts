export type ProjectStageKey = "lead" | "qualification" | "proposal" | "negotiation" | "closed";
export type ProjectPriority = "high" | "medium" | "low";
export type ProjectStatus = "open" | "done" | "archived";
export type ProjectSourceType = "manual" | "message";
export type ProjectChannel = "whatsapp" | "telegram" | "email" | "sms" | "web";
export type ProjectTaskStatus = "open" | "in_progress" | "done" | "cancelled";
export type ProjectTaskAutomationType = "send_message" | "scheduled_action";
export type ProjectTaskAutomationStatus = "scheduled" | "processing" | "completed" | "failed" | "cancelled";

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
  client_id?: string | null;
  contact_id?: string | null;
  client?: {
    id: string;
    name: string;
    company_name?: string | null;
    country: string;
    client_type: string;
    currency: string;
    created_at: string;
    deleted_at?: string | null;
  } | null;
  contact?: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    channel_identifier?: string | null;
    created_at: string;
  } | null;
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
  client_id?: string | null;
  contact_id?: string | null;
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
  client_id?: string | null;
  contact_id?: string | null;
  attach_conversation_to_project?: boolean;
  due_date?: string | null;
  value?: number | null;
  progress: number;
  tag?: string | null;
}

export interface ProjectTaskDto {
  id: string;
  project_id: string;
  project_reference?: string | null;
  project_title?: string | null;
  title: string;
  description?: string | null;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  owner_id?: string | null;
  owner_name?: string | null;
  created_by_id?: string | null;
  created_by_name?: string | null;
  source_message_id?: string | null;
  source_conversation_id?: string | null;
  due_date?: string | null;
  automation_type?: ProjectTaskAutomationType | null;
  automation_status?: ProjectTaskAutomationStatus | null;
  automation_run_at?: string | null;
  automation_message_content?: string | null;
  automation_action_label?: string | null;
  automation_last_error?: string | null;
  automation_executed_at?: string | null;
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
  automation_type?: ProjectTaskAutomationType | null;
  automation_status?: ProjectTaskAutomationStatus | null;
  automation_run_at?: string | null;
  automation_message_content?: string | null;
  automation_action_label?: string | null;
}

export type ProjectTaskUpdateRequest = Partial<ProjectTaskCreateRequest>;

export interface ProjectTaskFromMessageRequest {
  title?: string | null;
  description?: string | null;
  priority: ProjectPriority;
  status: ProjectTaskStatus;
  owner_user_id?: string | null;
  project_context_id?: string | null;
  attach_conversation_to_project?: boolean;
  create_project_context?: boolean;
  new_project_title?: string | null;
  due_date?: string | null;
}
