/** Users API — CRUD + approval flow */

import { apiGetList, apiMutate } from "@/lib/apiClient";
import type { ApiResponse } from "@/types/api";
import type { User, CreateUserRequest, UpdateUserRequest } from "@/types/auth";

export async function listUsers(limit = 50): Promise<ApiResponse<User[]>> {
  return apiGetList<User>(`/admin/users?limit=${limit}`);
}

export async function listPendingUsers(): Promise<ApiResponse<User[]>> {
  return apiGetList<User>("/admin/users/pending");
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  return apiMutate<CreateUserRequest, User>("/admin/users", "POST", data);
}

export async function updateUser(
  userId: string,
  data: UpdateUserRequest
): Promise<User> {
  return apiMutate<UpdateUserRequest, User>(
    `/admin/users/${userId}`,
    "PATCH",
    data
  );
}

export async function deleteUser(userId: string): Promise<void> {
  await apiMutate(`/admin/users/${userId}`, "DELETE");
}

export async function approveUser(userId: string): Promise<User> {
  return apiMutate<undefined, User>(
    `/admin/users/${userId}/approve`,
    "POST"
  );
}

export async function rejectUser(userId: string): Promise<void> {
  await apiMutate(`/admin/users/${userId}/reject`, "POST");
}

export async function enableUser(userId: string): Promise<void> {
  await apiMutate(`/admin/users/${userId}/enable`, "POST");
}

export async function disableUser(userId: string): Promise<void> {
  await apiMutate(`/admin/users/${userId}/disable`, "POST");
}

export async function bulkUserAction(
  action: "enable" | "disable" | "delete",
  userIds: string[]
): Promise<{ processed: number; skipped: number }> {
  return apiMutate("/admin/users/bulk", "POST", { action, user_ids: userIds });
}

export async function changeUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  await apiMutate(`/admin/users/${userId}/change-password`, "POST", {
    new_password: newPassword,
  });
}
