import { useQuery } from "@tanstack/react-query";
import { auditLogsApi, type AuditLogParams } from "@/lib/api/audit-logs-api";

export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => auditLogsApi.list(params),
  });
}
