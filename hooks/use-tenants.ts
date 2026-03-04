import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantsApi } from "@/lib/api/tenants-api";
import type { CreateTenantInput, ImportTenantInput, Subscription } from "@/types/tenant";

export function useTenants(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => tenantsApi.list(params),
  });
}

export function useTenant(tenantId: string) {
  return useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => tenantsApi.get(tenantId),
    enabled: !!tenantId,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantInput) => tenantsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: Record<string, unknown> }) =>
      tenantsApi.update(tenantId, data as any),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.tenantId] });
    },
  });
}

export function useToggleTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => tenantsApi.toggle(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, twoFactorCode }: { tenantId: string; twoFactorCode: string }) =>
      tenantsApi.destroy(tenantId, twoFactorCode),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.tenantId] });
    },
  });
}

export function useTenantHealth(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-health", tenantId],
    queryFn: () => tenantsApi.checkHealth(tenantId),
    enabled: !!tenantId,
    refetchInterval: false,
  });
}

export function useBatchHealthCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tenantsApi.batchHealthCheck(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useDiscoverTenants() {
  return useQuery({
    queryKey: ["tenants-discover"],
    queryFn: () => tenantsApi.discover(),
  });
}

export function useImportTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportTenantInput) => tenantsApi.importTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants-discover"] });
    },
  });
}

export function useHealthSummary() {
  return useQuery({
    queryKey: ["health-summary"],
    queryFn: () => tenantsApi.getHealthSummary(),
    refetchInterval: 60000,
  });
}

export function useHealthHistory(tenantId: string, hours?: number) {
  return useQuery({
    queryKey: ["health-history", tenantId, hours],
    queryFn: () => tenantsApi.getHealthHistory(tenantId, hours),
    enabled: !!tenantId,
  });
}

export function useTenantMetrics(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-metrics", tenantId],
    queryFn: () => tenantsApi.getMetrics(tenantId),
    enabled: !!tenantId,
  });
}

export function useLiveEnvVars(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-env-vars", tenantId],
    queryFn: () => tenantsApi.getLiveEnvVars(tenantId),
    enabled: !!tenantId,
  });
}

export function useBackupStatus(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-backup-status", tenantId],
    queryFn: () => tenantsApi.getBackupStatus(tenantId),
    enabled: !!tenantId,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
  });
}

export function useTenantSecrets(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-secrets", tenantId],
    queryFn: () => tenantsApi.getSecrets(tenantId),
    enabled: !!tenantId,
  });
}

export function useUpdateSecrets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      updates,
      deployAfter,
    }: {
      tenantId: string;
      updates: Record<string, string>;
      deployAfter?: boolean;
    }) => tenantsApi.updateSecrets(tenantId, updates, deployAfter),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-secrets", variables.tenantId] });
    },
  });
}

export function useBilling(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-billing", tenantId],
    queryFn: () => tenantsApi.getBilling(tenantId),
    enabled: !!tenantId,
  });
}

export function useUpdateBilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: Partial<Subscription> }) =>
      tenantsApi.updateBilling(tenantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-billing", variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.tenantId] });
    },
  });
}

export function useBillingOverview() {
  return useQuery({
    queryKey: ["billing-overview"],
    queryFn: () => tenantsApi.getBillingOverview(),
  });
}

export function useSendBillingReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => tenantsApi.sendBillingReminder(tenantId),
    onSuccess: (_data, tenantId) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-billing", tenantId] });
    },
  });
}
