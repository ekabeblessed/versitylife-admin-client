import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backupsApi } from "@/lib/api/backups-api";

export function useBackupsOverview() {
  return useQuery({
    queryKey: ["backups-overview"],
    queryFn: () => backupsApi.getOverview(),
  });
}

export function useBackups(tenantId: string) {
  return useQuery({
    queryKey: ["backups", tenantId],
    queryFn: () => backupsApi.list(tenantId),
    enabled: !!tenantId,
  });
}

export function useBackupStatus(tenantId: string) {
  return useQuery({
    queryKey: ["backup-status", tenantId],
    queryFn: () => backupsApi.getStatus(tenantId),
    enabled: !!tenantId,
  });
}

export function useBackupSchedule(tenantId: string) {
  return useQuery({
    queryKey: ["backup-schedule", tenantId],
    queryFn: () => backupsApi.getSchedule(tenantId),
    enabled: !!tenantId,
  });
}

export function useTriggerBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => backupsApi.triggerBackup(tenantId),
    onSuccess: (_data, tenantId) => {
      queryClient.invalidateQueries({ queryKey: ["backups", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["backup-status", tenantId] });
    },
  });
}

export function useTriggerRestore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      backupFileName,
      createPreRestoreBackup,
    }: {
      tenantId: string;
      backupFileName: string;
      createPreRestoreBackup?: boolean;
    }) =>
      backupsApi.triggerRestore(tenantId, {
        backupFileName,
        createPreRestoreBackup,
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["backups", vars.tenantId] });
      queryClient.invalidateQueries({
        queryKey: ["backup-status", vars.tenantId],
      });
    },
  });
}

export function useVerifyBackup() {
  return useMutation({
    mutationFn: ({
      tenantId,
      backupFileName,
    }: {
      tenantId: string;
      backupFileName: string;
    }) => backupsApi.verifyBackup(tenantId, { backupFileName }),
  });
}

export function useTriggerClone() {
  return useMutation({
    mutationFn: ({
      tenantId,
      backupFileName,
      targetMongodbUri,
    }: {
      tenantId: string;
      backupFileName: string;
      targetMongodbUri: string;
    }) =>
      backupsApi.triggerClone(tenantId, { backupFileName, targetMongodbUri }),
  });
}

export function useTriggerRestoreRollback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) =>
      backupsApi.triggerRestoreRollback(tenantId),
    onSuccess: (_data, tenantId) => {
      queryClient.invalidateQueries({ queryKey: ["backups", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["backup-status", tenantId] });
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      backupFileName,
    }: {
      tenantId: string;
      backupFileName: string;
    }) => backupsApi.deleteBackup(tenantId, backupFileName),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["backups", vars.tenantId] });
      queryClient.invalidateQueries({
        queryKey: ["backup-status", vars.tenantId],
      });
    },
  });
}

export function useUpdateBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      schedule,
      timezone,
      enabled,
    }: {
      tenantId: string;
      schedule?: string;
      timezone?: string;
      enabled?: boolean;
    }) => backupsApi.updateSchedule(tenantId, { schedule, timezone, enabled }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["backup-schedule", vars.tenantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["backup-status", vars.tenantId],
      });
    },
  });
}
