import { apiClient } from "@/lib/api";
import type {
  Backup,
  BackupStatus,
  BackupSchedule,
  BackupVerifyResult,
  BackupOverviewItem,
} from "@/types/backup";

export const backupsApi = {
  getOverview: () =>
    apiClient.get<{ overview: BackupOverviewItem[] }>("/api/v1/backups/overview"),

  list: (tenantId: string) =>
    apiClient.get<{ backups: Backup[] }>(
      `/api/v1/backups/tenants/${tenantId}`
    ),

  getStatus: (tenantId: string) =>
    apiClient.get<{ status: BackupStatus; schedule: BackupSchedule | null }>(
      `/api/v1/backups/tenants/${tenantId}/status`
    ),

  getSchedule: (tenantId: string) =>
    apiClient.get<{ schedule: BackupSchedule | null }>(
      `/api/v1/backups/tenants/${tenantId}/schedule`
    ),

  updateSchedule: (
    tenantId: string,
    data: { schedule?: string; timezone?: string; enabled?: boolean }
  ) =>
    apiClient.put<{ schedule: BackupSchedule }>(
      `/api/v1/backups/tenants/${tenantId}/schedule`,
      data
    ),

  triggerBackup: (tenantId: string) =>
    apiClient.post<{ message: string; tenantId: string }>(
      `/api/v1/backups/tenants/${tenantId}/trigger`
    ),

  triggerRestore: (
    tenantId: string,
    data: { backupFileName: string; createPreRestoreBackup?: boolean }
  ) =>
    apiClient.post<{ message: string; tenantId: string; backupFileName: string }>(
      `/api/v1/backups/tenants/${tenantId}/restore`,
      data
    ),

  verifyBackup: (tenantId: string, data: { backupFileName: string }) =>
    apiClient.post<BackupVerifyResult>(
      `/api/v1/backups/tenants/${tenantId}/verify`,
      data
    ),

  triggerClone: (
    tenantId: string,
    data: { backupFileName: string; targetMongodbUri: string }
  ) =>
    apiClient.post<{ message: string; tenantId: string; backupFileName: string }>(
      `/api/v1/backups/tenants/${tenantId}/clone`,
      data
    ),

  triggerRestoreRollback: (tenantId: string) =>
    apiClient.post<{ message: string; tenantId: string }>(
      `/api/v1/backups/tenants/${tenantId}/restore-rollback`
    ),

  deleteBackup: (tenantId: string, backupFileName: string) =>
    apiClient.delete<{ deleted: boolean; fileName: string }>(
      `/api/v1/backups/tenants/${tenantId}/${backupFileName}`
    ),

  getDownloadUrl: (tenantId: string, backupFileName: string) =>
    apiClient.get<{ url: string; expiresIn: string }>(
      `/api/v1/backups/tenants/${tenantId}/${backupFileName}/download`
    ),
};
