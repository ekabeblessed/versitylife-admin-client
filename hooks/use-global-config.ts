import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { globalConfigApi } from "@/lib/api/global-config-api";

export function useGlobalEnv() {
  return useQuery({
    queryKey: ["global-env"],
    queryFn: () => globalConfigApi.getGlobalEnv(),
  });
}

export function useUpdateGlobalEnv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (environment: Record<string, string>) =>
      globalConfigApi.updateGlobalEnv(environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-env"] });
    },
  });
}
