/** Audit Log API */

import { apiGetList } from "@/lib/apiClient";
import type { ApiResponse } from "@/types/api";

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

export interface ListAuditLogsParams {
  action?: string;
  resource_type?: string;
  skip?: number;
  limit?: number;
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<ApiResponse<AuditLog[]>> {
  const qs = new URLSearchParams();
  if (params.action)        qs.set("action", params.action);
  if (params.resource_type) qs.set("resource_type", params.resource_type);
  if (params.skip != null)  qs.set("skip", String(params.skip));
  if (params.limit != null) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs}` : "";
  return apiGetList<AuditLog>(`/admin/audit-logs${query}`);
}
