/** Dashboard analytics API */

import { apiGet } from "@/lib/apiClient";
import type { DashboardStats, DashboardSummary } from "@/types/chat";

export async function getDashboardStats(days = 7): Promise<DashboardStats> {
  return apiGet<DashboardStats>(`/admin/stats?days=${days}`);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>("/admin/dashboard-summary");
}
