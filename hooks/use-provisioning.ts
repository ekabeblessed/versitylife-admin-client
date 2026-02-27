import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { provisioningApi } from "@/lib/api/provisioning-api";

export function useProvisioningJobs(params?: {
  page?: number;
  limit?: number;
  status?: string;
  tenantId?: string;
}) {
  return useQuery({
    queryKey: ["provisioning-jobs", params],
    queryFn: () => provisioningApi.list(params),
  });
}

export function useProvisioningJob(jobId: string, polling = false) {
  return useQuery({
    queryKey: ["provisioning", jobId],
    queryFn: () => provisioningApi.getJob(jobId),
    enabled: !!jobId,
    refetchInterval: polling ? 3000 : false,
  });
}

export function useRetryProvisioningJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => provisioningApi.retryJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["provisioning", jobId] });
    },
  });
}
