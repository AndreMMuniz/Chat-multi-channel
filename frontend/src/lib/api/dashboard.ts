/** Dashboard analytics API */

import { apiGet } from "@/lib/apiClient";
import type { DashboardStats } from "@/types/chat";

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>("/admin/stats");
}
