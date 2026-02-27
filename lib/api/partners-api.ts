import { apiClient } from "@/lib/api";
import type { Partner, PartnerInput } from "@/types/partner";

interface PartnersResponse { partners: Partner[] }
interface PartnerResponse  { partner: Partner }

export const partnersApi = {
  list: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return apiClient.get<PartnersResponse>(`/api/v1/partners${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) =>
    apiClient.get<PartnerResponse>(`/api/v1/partners/${id}`),

  create: (data: PartnerInput) =>
    apiClient.post<PartnerResponse>("/api/v1/partners", data),

  update: (id: string, data: Partial<PartnerInput>) =>
    apiClient.put<PartnerResponse>(`/api/v1/partners/${id}`, data),

  setStatus: (id: string, status: Partner["status"]) =>
    apiClient.patch<PartnerResponse & { message: string }>(`/api/v1/partners/${id}/status`, { status }),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/api/v1/partners/${id}`),

  healthCheckAll: () =>
    apiClient.post<{ results: Array<{ id: string; name: string; healthy: boolean }> }>(
      "/api/v1/partners/health-check"
    ),
};
