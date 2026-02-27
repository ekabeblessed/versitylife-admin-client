import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { domainsApi } from "@/lib/api/domains-api";

export function useDomains(tenantId: string) {
  return useQuery({
    queryKey: ["domains", tenantId],
    queryFn: () => domainsApi.list(tenantId),
    enabled: !!tenantId,
  });
}

export function useAddDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, domain }: { tenantId: string; domain: string }) =>
      domainsApi.add(tenantId, domain),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["domains", vars.tenantId] });
    },
  });
}

export function useRemoveDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, domain }: { tenantId: string; domain: string }) =>
      domainsApi.remove(tenantId, domain),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["domains", vars.tenantId] });
    },
  });
}

export function useVerifyDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, domain }: { tenantId: string; domain: string }) =>
      domainsApi.verify(tenantId, domain),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["domains", vars.tenantId] });
    },
  });
}
