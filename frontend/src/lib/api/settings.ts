/** Settings API */

import { apiGet, apiMutate } from "@/lib/apiClient";
import type { Settings, SettingsUpdate } from "@/types/settings";

export async function getSettings(): Promise<Settings> {
  return apiGet<Settings>("/admin/settings");
}

export async function updateSettings(data: SettingsUpdate): Promise<Settings> {
  return apiMutate<SettingsUpdate, Settings>("/admin/settings", "PATCH", data);
}
