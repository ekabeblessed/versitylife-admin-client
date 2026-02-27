import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { partnersApi } from "@/lib/api/partners-api";
import type { PartnerInput, Partner } from "@/types/partner";

export function usePartners(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["partners", params],
    queryFn: () => partnersApi.list(params),
  });
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: ["partner", id],
    queryFn: () => partnersApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PartnerInput) => partnersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PartnerInput> }) =>
      partnersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useSetPartnerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Partner["status"] }) =>
      partnersApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partnersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function usePartnerHealthCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => partnersApi.healthCheckAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}
