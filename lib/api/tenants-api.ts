import { apiClient } from "@/lib/api";
import type {
  Tenant, CreateTenantInput, DiscoveredService, ImportTenantInput,
  HealthSummaryItem, HealthHistoryItem, ServiceMetrics, LiveEnvVarsResponse,
  SecretsResponse, BackupStatusResponse, Subscription, BillingOverviewItem,
} from "@/types/tenant";
import type { Pagination } from "@/types/user";
import type { ProvisioningJob } from "@/types/provisioning";

interface TenantsResponse {
  tenants: Tenant[];
  pagination: Pagination;
}

interface TenantResponse {
  tenant: Tenant;
}

interface CreateTenantResponse {
  tenant: Tenant;
  provisioningJob: ProvisioningJob;
}

interface BatchHealthCheckResponse {
  results: Array<{ tenantId: string; status: string; responseTime: number }>;
}

interface DiscoverResponse {
  services: DiscoveredService[];
}

interface ImportTenantResponse {
  tenant: Tenant;
}

interface HealthResponse {
  tenantId: string;
  status: string;
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export const tenantsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; country?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    if (params?.country) query.set("country", params.country);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return apiClient.get<TenantsResponse>(`/api/v1/tenants${qs ? `?${qs}` : ""}`);
  },

  get: (tenantId: string) =>
    apiClient.get<TenantResponse>(`/api/v1/tenants/${tenantId}`),

  create: (data: CreateTenantInput) =>
    apiClient.post<CreateTenantResponse>("/api/v1/tenants", data),

  update: (tenantId: string, data: Partial<CreateTenantInput>) =>
    apiClient.put<TenantResponse>(`/api/v1/tenants/${tenantId}`, data),

  toggle: (tenantId: string) =>
    apiClient.patch<TenantResponse & { message: string }>(`/api/v1/tenants/${tenantId}/toggle`),

  destroy: (tenantId: string, twoFactorCode: string) =>
    apiClient.delete<{ message: string }>(`/api/v1/tenants/${tenantId}`, {
      data: { twoFactorCode },
    }),

  checkHealth: (tenantId: string) =>
    apiClient.get<HealthResponse>(`/api/v1/tenants/${tenantId}/health`),

  batchHealthCheck: () =>
    apiClient.post<BatchHealthCheckResponse>("/api/v1/tenants/health-check-all"),

  discover: () =>
    apiClient.get<DiscoverResponse>("/api/v1/tenants/discover"),

  importTenant: (data: ImportTenantInput) =>
    apiClient.post<ImportTenantResponse>("/api/v1/tenants/import", data),

  getHealthSummary: () =>
    apiClient.get<{ summary: HealthSummaryItem[] }>("/api/v1/tenants/health-summary"),

  getHealthHistory: (tenantId: string, hours?: number) => {
    const qs = hours ? `?hours=${hours}` : "";
    return apiClient.get<{ history: HealthHistoryItem[] }>(
      `/api/v1/tenants/${tenantId}/health-history${qs}`
    );
  },

  getMetrics: (tenantId: string) =>
    apiClient.get<{ metrics: ServiceMetrics }>(`/api/v1/tenants/${tenantId}/metrics`),

  getLiveEnvVars: (tenantId: string) =>
    apiClient.get<LiveEnvVarsResponse>(`/api/v1/tenants/${tenantId}/env-vars`),

  getBackupStatus: (tenantId: string) =>
    apiClient.get<BackupStatusResponse>(`/api/v1/tenants/${tenantId}/backup-status`),

  getSecrets: (tenantId: string) =>
    apiClient.get<SecretsResponse>(`/api/v1/tenants/${tenantId}/secrets`),

  updateSecrets: (tenantId: string, updates: Record<string, string>, deployAfter = false) =>
    apiClient.put<{ message: string; version: string | null; changedKeys: string[] }>(
      `/api/v1/tenants/${tenantId}/secrets`,
      { updates, deployAfter }
    ),

  getBilling: (tenantId: string) =>
    apiClient.get<{ subscription: Subscription }>(`/api/v1/billing/tenants/${tenantId}`),

  updateBilling: (tenantId: string, data: Partial<Subscription>) =>
    apiClient.put<{ subscription: Subscription; message: string }>(
      `/api/v1/billing/tenants/${tenantId}`,
      data
    ),

  getBillingOverview: () =>
    apiClient.get<{ tenants: BillingOverviewItem[] }>("/api/v1/billing/overview"),

  sendBillingReminder: (tenantId: string) =>
    apiClient.post<{ message: string }>(`/api/v1/billing/tenants/${tenantId}/send-reminder`, {}),
};
