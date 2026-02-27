import { apiClient } from "@/lib/api";

interface GlobalEnvResponse {
  environment: Record<string, string>;
}

export const globalConfigApi = {
  getGlobalEnv: () =>
    apiClient.get<GlobalEnvResponse>("/api/v1/settings/global-env"),

  updateGlobalEnv: (environment: Record<string, string>) =>
    apiClient.put<GlobalEnvResponse & { message: string }>("/api/v1/settings/global-env", {
      environment,
    }),
};
