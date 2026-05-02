/** User Types API — CRUD for roles/permissions */

import { apiGetList, apiMutate } from "@/lib/apiClient";
import type { ApiResponse } from "@/types/api";
import type { UserType, BaseRole, PermKey } from "@/types/auth";

export type CreateUserTypePayload = {
  name: string;
  base_role: BaseRole;
} & Partial<Record<PermKey, boolean>>;

export type UpdateUserTypePayload = Partial<Record<PermKey, boolean>>;

export async function listUserTypes(): Promise<ApiResponse<UserType[]>> {
  return apiGetList<UserType>("/admin/user-types");
}

export async function createUserType(
  data: CreateUserTypePayload
): Promise<UserType> {
  return apiMutate<CreateUserTypePayload, UserType>(
    "/admin/user-types",
    "POST",
    data
  );
}

export async function updateUserType(
  userTypeId: string,
  data: UpdateUserTypePayload
): Promise<UserType> {
  return apiMutate<UpdateUserTypePayload, UserType>(
    `/admin/user-types/${userTypeId}`,
    "PATCH",
    data
  );
}

export async function deleteUserType(userTypeId: string): Promise<void> {
  await apiMutate(`/admin/user-types/${userTypeId}`, "DELETE");
}
