import { apiClient } from "@/lib/api";
import type { AuditLog } from "@/types/audit-log";
import type { Pagination } from "@/types/user";

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: Pagination;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
  severity?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const auditLogsApi = {
  list: (params?: AuditLogParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.action) query.set("action", params.action);
    if (params?.resource) query.set("resource", params.resource);
    if (params?.severity) query.set("severity", params.severity);
    if (params?.userId) query.set("userId", params.userId);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return apiClient.get<AuditLogsResponse>(`/api/v1/audit-logs${qs ? `?${qs}` : ""}`);
  },
};
