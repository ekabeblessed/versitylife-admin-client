export interface Backup {
  name: string;
  fileName: string;
  size: number;
  sizeFormatted: string;
  type: "daily" | "weekly" | "monthly";
  created: string;
  updated: string;
}

export interface BackupStatus {
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  lastBackup: Backup | null;
  backupCounts: { daily: number; weekly: number; monthly: number };
}

export interface BackupSchedule {
  name: string;
  schedule: string;
  timezone: string;
  state: "ENABLED" | "PAUSED";
  lastAttemptTime?: string;
  lastExecutionStatus?: string;
  nextRunTime?: string;
}

export interface BackupOverviewItem {
  tenantId: string;
  universityName: string;
  lastBackup: Backup | null;
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  schedule: {
    state: "ENABLED" | "PAUSED";
    schedule: string;
    nextRunTime?: string;
  } | null;
}

export interface BackupVerifyResult {
  success: boolean;
  valid: boolean;
  details: {
    fileCount: number;
    databases: { name: string; collectionCount: number }[];
    totalSize: string;
  };
}
