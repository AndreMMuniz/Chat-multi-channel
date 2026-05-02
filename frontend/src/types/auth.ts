/** Auth & user types — mirrors backend models/models.py + schemas/user.py */

export type BaseRole = "ADMIN" | "MANAGER" | "USER";

/** Slim UserType used in auth context and user lists */
export interface UserTypeSlim {
  id: string;
  name: string;
  base_role: BaseRole;
  is_system: boolean;
}

/** Full UserType with granular permissions — used in admin/user-types */
export interface UserType extends UserTypeSlim {
  can_view_all_conversations: boolean;
  can_delete_conversations: boolean;
  can_edit_messages: boolean;
  can_delete_messages: boolean;
  can_manage_users: boolean;
  can_assign_roles: boolean;
  can_disable_users: boolean;
  can_change_user_password: boolean;
  can_change_settings: boolean;
  can_change_branding: boolean;
  can_change_ai_model: boolean;
  can_view_audit_logs: boolean;
  can_create_user_types: boolean;
  created_at: string;
}

/** All boolean permission keys on UserType */
export type PermKey = keyof Omit<UserType, "id" | "name" | "base_role" | "is_system" | "created_at">;

/** Internal operator (agent / admin) */
export interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  avatar?: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  user_type_id: string;
  user_type: UserType;
}

/** Subset stored in localStorage after login */
export interface StoredUser {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
  user_type?: UserType;
}

/** POST /auth/login request */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Payload inside {data: ...} from login endpoint */
export interface AuthPayload {
  access_token: string;
  refresh_token: string;
  user: StoredUser;
}

/** POST /admin/users request */
export interface CreateUserRequest {
  full_name: string;
  email: string;
  password: string;
  user_type_id: string;
}

/** PATCH /admin/users/{id} request */
export interface UpdateUserRequest {
  full_name?: string;
  user_type_id?: string;
  is_active?: boolean;
}
