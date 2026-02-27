import { apiClient } from "@/lib/api";
import type { Deployment } from "@/types/deployment";
import type { Pagination } from "@/types/user";

interface DeploymentsResponse {
  deployments: Deployment[];
  pagination: Pagination;
}

export const deploymentsApi = {
  list: (params?: { page?: number; limit?: number; tenantId?: string; status?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.tenantId) query.set("tenantId", params.tenantId);
    if (params?.status) query.set("status", params.status);
    if (params?.type) query.set("type", params.type);
    const qs = query.toString();
    return apiClient.get<DeploymentsResponse>(`/api/v1/deployments${qs ? `?${qs}` : ""}`);
  },

  deploy: (tenantId: string) =>
    apiClient.post<{ deployment: Deployment; message: string }>(`/api/v1/deployments/tenants/${tenantId}/deploy`),

  rollback: (tenantId: string, revisionName?: string) =>
    apiClient.post<{ deployment: Deployment; message: string }>(
      `/api/v1/deployments/tenants/${tenantId}/rollback`,
      revisionName ? { revisionName } : undefined
    ),

  listRevisions: (tenantId: string) =>
    apiClient.get<{ revisions: unknown[] }>(`/api/v1/deployments/tenants/${tenantId}/revisions`),

  bulkDeploy: (data: { tenantIds?: string[]; buildImage?: boolean }) =>
    apiClient.post<{ deployments: Deployment[]; message: string }>("/api/v1/deployments/bulk-deploy", data),
};
