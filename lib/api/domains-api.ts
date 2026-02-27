import { apiClient } from "@/lib/api";
import type { CustomDomain } from "@/types/domain";

export const domainsApi = {
  list: (tenantId: string) =>
    apiClient.get<{ domains: CustomDomain[] }>(
      `/api/v1/tenants/${tenantId}/domains`
    ),

  add: (tenantId: string, domain: string) =>
    apiClient.post<{ domain: CustomDomain }>(
      `/api/v1/tenants/${tenantId}/domains`,
      { domain }
    ),

  remove: (tenantId: string, domain: string) =>
    apiClient.delete<{ message: string }>(
      `/api/v1/tenants/${tenantId}/domains/${domain}`
    ),

  verify: (tenantId: string, domain: string) =>
    apiClient.post<{ domain: CustomDomain }>(
      `/api/v1/tenants/${tenantId}/domains/${domain}/verify`
    ),
};
