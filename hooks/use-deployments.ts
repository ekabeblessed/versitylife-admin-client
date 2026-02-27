import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deploymentsApi } from "@/lib/api/deployments-api";

export function useDeployments(params?: {
  page?: number;
  limit?: number;
  tenantId?: string;
  status?: string;
  type?: string;
  refetchInterval?: number | false;
}) {
  const { refetchInterval, ...queryParams } = params || {};
  return useQuery({
    queryKey: ["deployments", queryParams],
    queryFn: () => deploymentsApi.list(queryParams),
    refetchInterval: refetchInterval ?? false,
  });
}

export function useDeploy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => deploymentsApi.deploy(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });
}

export function useRollback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, revisionName }: { tenantId: string; revisionName?: string }) =>
      deploymentsApi.rollback(tenantId, revisionName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });
}

export function useBulkDeploy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantIds?: string[]; buildImage?: boolean }) =>
      deploymentsApi.bulkDeploy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
