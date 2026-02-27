import { apiClient } from "@/lib/api";
import type { ProvisioningJob } from "@/types/provisioning";
import type { Pagination } from "@/types/user";

export const provisioningApi = {
  list: (params?: { page?: number; limit?: number; status?: string; tenantId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    if (params?.tenantId) query.set("tenantId", params.tenantId);
    const qs = query.toString();
    return apiClient.get<{ jobs: ProvisioningJob[]; pagination: Pagination }>(
      `/api/v1/provisioning${qs ? `?${qs}` : ""}`
    );
  },

  getJob: (jobId: string) =>
    apiClient.get<{ job: ProvisioningJob }>(`/api/v1/provisioning/${jobId}`),

  retryJob: (jobId: string) =>
    apiClient.post<{ message: string; jobId: string }>(`/api/v1/provisioning/${jobId}/retry`),

  cancelJob: (jobId: string) =>
    apiClient.post<{ message: string; job: ProvisioningJob }>(`/api/v1/provisioning/${jobId}/cancel`),
};
