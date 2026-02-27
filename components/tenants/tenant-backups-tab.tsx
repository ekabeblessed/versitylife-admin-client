"use client";

import { useState } from "react";
import type { Tenant } from "@/types/tenant";
import type { Backup, BackupVerifyResult } from "@/types/backup";
import {
  useBackups,
  useBackupStatus,
  useTriggerBackup,
  useTriggerRestore,
  useVerifyBackup,
  useTriggerClone,
  useTriggerRestoreRollback,
  useDeleteBackup,
  useUpdateBackupSchedule,
} from "@/hooks/use-backups";
import { useBackupStatus as useBackupHealth } from "@/hooks/use-tenants";
import { backupsApi } from "@/lib/api/backups-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Database,
  Download,
  HardDrive,
  Loader2,
  MoreHorizontal,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Trash2,
  Calendar,
  Clock,
  Copy,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Pause,
  AlertTriangle,
  HeartPulse,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface TenantBackupsTabProps {
  tenant: Tenant;
}

type TypeFilter = "all" | "daily" | "weekly" | "monthly";

export function TenantBackupsTab({ tenant }: TenantBackupsTabProps) {
  const tenantId = tenant.tenantId;

  // Queries
  const { data: backupsData, isLoading: backupsLoading } = useBackups(tenantId);
  const { data: statusData, isLoading: statusLoading } = useBackupStatus(tenantId);
  const { data: healthData } = useBackupHealth(tenantId);

  // Mutations
  const triggerBackup = useTriggerBackup();
  const triggerRestore = useTriggerRestore();
  const verifyBackup = useVerifyBackup();
  const triggerClone = useTriggerClone();
  const triggerRestoreRollback = useTriggerRestoreRollback();
  const deleteBackup = useDeleteBackup();
  const updateSchedule = useUpdateBackupSchedule();

  // Local state
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");
  const [timezoneValue, setTimezoneValue] = useState("");

  // Dialog state
  const [restoreDialog, setRestoreDialog] = useState<{
    open: boolean;
    backup: Backup | null;
    safetyBackup: boolean;
  }>({ open: false, backup: null, safetyBackup: true });

  const [emergencyDialog, setEmergencyDialog] = useState(false);
  const [rollbackDialog, setRollbackDialog] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    backup: Backup | null;
  }>({ open: false, backup: null });

  const [cloneDialog, setCloneDialog] = useState<{
    open: boolean;
    backup: Backup | null;
    targetUri: string;
  }>({ open: false, backup: null, targetUri: "" });

  const [verifyDialog, setVerifyDialog] = useState<{
    open: boolean;
    backup: Backup | null;
    result: BackupVerifyResult | null;
    loading: boolean;
  }>({ open: false, backup: null, result: null, loading: false });

  const backups = backupsData?.backups || [];
  const status = statusData?.status;
  const schedule = statusData?.schedule;

  const filteredBackups =
    typeFilter === "all"
      ? backups
      : backups.filter((b) => b.type === typeFilter);

  // Handlers
  const handleTriggerBackup = async () => {
    try {
      await triggerBackup.mutateAsync(tenantId);
      toast.success("Backup triggered successfully");
    } catch (err: any) {
      toast.error("Failed to trigger backup", {
        description: err.data?.message || err.message,
      });
    }
  };

  const handleRestore = async () => {
    if (!restoreDialog.backup) return;
    try {
      await triggerRestore.mutateAsync({
        tenantId,
        backupFileName: restoreDialog.backup.fileName,
        createPreRestoreBackup: restoreDialog.safetyBackup,
      });
      toast.success("Restore initiated", {
        description: `Restoring from ${restoreDialog.backup.fileName}`,
      });
      setRestoreDialog({ open: false, backup: null, safetyBackup: true });
    } catch (err: any) {
      toast.error("Restore failed", {
        description: err.data?.message || err.message,
      });
    }
  };

  const handleRestoreLatest = async () => {
    if (backups.length === 0) {
      toast.error("No backups available");
      return;
    }
    setRestoreDialog({ open: true, backup: backups[0], safetyBackup: true });
  };

  const handleEmergencyRestore = async () => {
    if (backups.length === 0) {
      toast.error("No backups available");
      return;
    }
    try {
      await triggerRestore.mutateAsync({
        tenantId,
        backupFileName: backups[0].fileName,
        createPreRestoreBackup: false,
      });
      toast.success("Emergency restore initiated");
      setEmergencyDialog(false);
    } catch (err: any) {
      toast.error("Emergency restore failed", {
        description: err.data?.message || err.message,
      });
    }
  };

  const handleRollback = async () => {
    try {
      await triggerRestoreRollback.mutateAsync(tenantId);
      toast.success("Rollback initiated");
      setRollbackDialog(false);
    } catch (err: any) {
      toast.error("Rollback failed", {
        description: err.data?.message || err.message,
      });
    }
  };

  const handleVerify = async (backup: Backup) => {
    setVerifyDialog({ open: true, backup, result: null, loading: true });
    try {
      const result = await verifyBackup.mutateAsync({
        tenantId,
        backupFileName: backup.fileName,
      });
      setVerifyDialog((prev) => ({ ...prev, result, loading: false }));
    } catch (err: any) {
      toast.error("Verification failed", {
        description: err.data?.message || err.message,
      });
      setVerifyDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDownload = async (backup: Backup) => {
    try {
      const { url } = await backupsApi.getDownloadUrl(tenantId, backup.fileName);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error("Download failed", {
        description: err.data?.message || err.message,
      });
    }
  };

  const handleClone = async () => {
    if (!cloneDialog.backup || !cloneDialog.targetUri) return;
    try {
      await triggerClone.mutateAsync({
        tenantId,
        backupFileName: cloneDialog.backup.fileName,
        targetMongodbUri: cloneDialog.targetUri,
      });
      toast.success("Clone initiated", {
        description: `Cloning to target database`,
      });
      setCloneDialog({ open: false, backup: null, targetUri: "" });
    } catch (err: any) {
      toast.error("Clone failed", {
        description: err.data?.message || err.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.backup) return;
    try {
      await deleteBackup.mutateAsync({
        tenantId,
        backupFileName: deleteDialog.backup.fileName,
      });
      toast.success("Backup deleted");
      setDeleteDialog({ open: false, backup: null });
    } catch (err: any) {
      toast.error("Delete failed", {
        description: err.data?.message || err.message,
      });
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      await updateSchedule.mutateAsync({
        tenantId,
        schedule: scheduleValue || undefined,
        timezone: timezoneValue || undefined,
      });
      toast.success("Schedule updated");
    } catch (err: any) {
      toast.error("Failed to update schedule", {
        description: err.data?.message || err.message,
      });
    }
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    try {
      await updateSchedule.mutateAsync({ tenantId, enabled });
      toast.success(enabled ? "Backup schedule enabled" : "Backup schedule paused");
    } catch (err: any) {
      toast.error("Failed to update schedule", {
        description: err.data?.message || err.message,
      });
    }
  };

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case "monthly":
        return "default" as const;
      case "weekly":
        return "info" as const;
      default:
        return "secondary" as const;
    }
  };

  if (backupsLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isBackupUnhealthy =
    healthData &&
    (!healthData.healthy ||
      (healthData.lastBackupAt &&
        new Date(healthData.lastBackupAt) < new Date(Date.now() - 26 * 60 * 60 * 1000)) ||
      healthData.schedulerStatus === "FAILED");

  return (
    <div className="space-y-6">
      {/* Backup Health Card */}
      {healthData && (
        <Card className={isBackupUnhealthy ? "border-red-300" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HeartPulse className="h-4 w-4" />
              Backup Health
            </CardTitle>
            {isBackupUnhealthy ? (
              <Badge variant="destructive">Unhealthy</Badge>
            ) : (
              <Badge variant="success">Healthy</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isBackupUnhealthy && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-3 py-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {!healthData.lastBackupAt
                    ? "No backups found in GCS."
                    : healthData.schedulerStatus === "FAILED"
                    ? "Scheduler last attempt failed."
                    : "Last backup is older than 26 hours."}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="text-muted-foreground">Last Backup</div>
              <div>
                {healthData.lastBackupAt
                  ? formatDistanceToNow(new Date(healthData.lastBackupAt), { addSuffix: true })
                  : "No backups found"}
              </div>
              {healthData.lastBackupFile && (
                <>
                  <div className="text-muted-foreground">File</div>
                  <div className="font-mono text-xs truncate">{healthData.lastBackupFile}</div>
                </>
              )}
              <div className="text-muted-foreground">Scheduler Status</div>
              <div>
                {healthData.schedulerStatus ? (
                  <Badge variant={healthData.schedulerStatus === "FAILED" ? "destructive" : "success"}>
                    {healthData.schedulerStatus}
                  </Badge>
                ) : (
                  "Not configured"
                )}
              </div>
              {healthData.nextRun && (
                <>
                  <div className="text-muted-foreground">Next Run</div>
                  <div>{formatDistanceToNow(new Date(healthData.nextRun), { addSuffix: true })}</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {status?.lastBackup ? (
              <>
                <p className="text-sm font-semibold">
                  {formatDistanceToNow(new Date(status.lastBackup.created), {
                    addSuffix: true,
                  })}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={typeBadgeVariant(status.lastBackup.type)}>
                    {status.lastBackup.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {status.lastBackup.sizeFormatted}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No backups yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{status?.totalBackups || 0}</p>
            {status?.backupCounts && (
              <p className="text-xs text-muted-foreground mt-1">
                {status.backupCounts.daily}d / {status.backupCounts.weekly}w /{" "}
                {status.backupCounts.monthly}m
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {status?.totalSizeFormatted || "0 B"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {schedule ? (
              <>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{schedule.schedule}</code>
                  <Badge
                    variant={
                      schedule.state === "ENABLED" ? "success" : "warning"
                    }
                  >
                    {schedule.state === "ENABLED" ? "Active" : "Paused"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {schedule.timezone}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not configured</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleTriggerBackup}
              disabled={triggerBackup.isPending}
            >
              {triggerBackup.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Create Backup
            </Button>

            <Button
              variant="outline"
              onClick={handleRestoreLatest}
              disabled={backups.length === 0 || triggerRestore.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Latest
            </Button>

            <Button
              variant="destructive"
              onClick={() => setEmergencyDialog(true)}
              disabled={backups.length === 0}
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Emergency Restore
            </Button>

            <Button
              variant="outline"
              onClick={() => setRollbackDialog(true)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Rollback Restore
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Settings (Collapsible) */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => {
            if (!scheduleOpen && schedule) {
              setScheduleValue(schedule.schedule || "");
              setTimezoneValue(schedule.timezone || "");
            }
            setScheduleOpen(!scheduleOpen);
          }}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Backup Schedule Settings</CardTitle>
            {scheduleOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </CardHeader>
        {scheduleOpen && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule">Cron Schedule</Label>
                <Input
                  id="schedule"
                  placeholder="0 2 * * *"
                  value={scheduleValue}
                  onChange={(e) => setScheduleValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Standard cron expression (e.g., &quot;0 2 * * *&quot; for 2 AM
                  daily)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  placeholder="Africa/Douala"
                  value={timezoneValue}
                  onChange={(e) => setTimezoneValue(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateSchedule}
                disabled={updateSchedule.isPending}
                size="sm"
              >
                {updateSchedule.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Update Schedule
              </Button>
              {schedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleToggleSchedule(schedule.state !== "ENABLED")
                  }
                  disabled={updateSchedule.isPending}
                >
                  {schedule.state === "ENABLED" ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Enable
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Backup Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Backups</CardTitle>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBackups.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No backups found
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">
                      Date/Time
                    </th>
                    <th className="h-10 px-4 text-left font-medium">Type</th>
                    <th className="h-10 px-4 text-left font-medium">Size</th>
                    <th className="h-10 px-4 text-left font-medium hidden lg:table-cell">
                      Filename
                    </th>
                    <th className="h-10 px-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBackups.map((backup) => (
                    <tr key={backup.fileName} className="border-b">
                      <td className="px-4 py-2">
                        {format(new Date(backup.created), "PPp")}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={typeBadgeVariant(backup.type)}>
                          {backup.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{backup.sizeFormatted}</td>
                      <td className="px-4 py-2 font-mono text-xs hidden lg:table-cell max-w-[200px] truncate">
                        {backup.fileName}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setRestoreDialog({
                                  open: true,
                                  backup,
                                  safetyBackup: true,
                                })
                              }
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleVerify(backup)}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Verify Integrity
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownload(backup)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setCloneDialog({
                                  open: true,
                                  backup,
                                  targetUri: "",
                                })
                              }
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Clone to Database
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setDeleteDialog({ open: true, backup })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setRestoreDialog({ open: false, backup: null, safetyBackup: true });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogDescription>
              This will replace the current database with the backup data. This
              action cannot be undone unless a safety backup is created first.
            </DialogDescription>
          </DialogHeader>
          {restoreDialog.backup && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">File:</span>{" "}
                  <span className="font-mono">{restoreDialog.backup.fileName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  {format(new Date(restoreDialog.backup.created), "PPp")}
                </p>
                <p>
                  <span className="text-muted-foreground">Size:</span>{" "}
                  {restoreDialog.backup.sizeFormatted}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={restoreDialog.safetyBackup}
                  onChange={(e) =>
                    setRestoreDialog((prev) => ({
                      ...prev,
                      safetyBackup: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Create safety backup first (recommended)
              </label>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRestoreDialog({
                  open: false,
                  backup: null,
                  safetyBackup: true,
                })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestore}
              disabled={triggerRestore.isPending}
            >
              {triggerRestore.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Restore Dialog */}
      <Dialog open={emergencyDialog} onOpenChange={setEmergencyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emergency Restore</DialogTitle>
            <DialogDescription>
              This will restore the latest backup WITHOUT creating a safety
              backup first. Only use this in emergency situations where speed is
              critical.
            </DialogDescription>
          </DialogHeader>
          {backups.length > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive">Warning</p>
              <p className="mt-1">
                Restoring from:{" "}
                <span className="font-mono">{backups[0].fileName}</span>
              </p>
              <p>No safety backup will be created. Current data may be lost.</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmergencyDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmergencyRestore}
              disabled={triggerRestore.isPending}
            >
              {triggerRestore.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Emergency Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog open={rollbackDialog} onOpenChange={setRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback Restore</DialogTitle>
            <DialogDescription>
              This will revert to the pre-restore safety backup that was created
              before the last restore operation. Use this if a restore went
              wrong.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRollbackDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRollback}
              disabled={triggerRestoreRollback.isPending}
            >
              {triggerRestoreRollback.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, backup: null });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Backup</DialogTitle>
            <DialogDescription>
              This will permanently delete this backup from Google Cloud Storage.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.backup && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
              <p>
                <span className="font-mono">{deleteDialog.backup.fileName}</span>
              </p>
              <p className="text-muted-foreground">
                {deleteDialog.backup.sizeFormatted} &middot;{" "}
                {format(new Date(deleteDialog.backup.created), "PPp")}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, backup: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBackup.isPending}
            >
              {deleteBackup.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog
        open={cloneDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setCloneDialog({ open: false, backup: null, targetUri: "" });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone to Database</DialogTitle>
            <DialogDescription>
              Clone this backup to a different MongoDB database. Warning: this
              will replace all data in the target database.
            </DialogDescription>
          </DialogHeader>
          {cloneDialog.backup && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Source:</span>{" "}
                  <span className="font-mono">{cloneDialog.backup.fileName}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetUri">Target MongoDB URI</Label>
                <Input
                  id="targetUri"
                  type="password"
                  placeholder="mongodb+srv://..."
                  value={cloneDialog.targetUri}
                  onChange={(e) =>
                    setCloneDialog((prev) => ({
                      ...prev,
                      targetUri: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setCloneDialog({ open: false, backup: null, targetUri: "" })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={triggerClone.isPending || !cloneDialog.targetUri}
            >
              {triggerClone.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Result Dialog */}
      <Dialog
        open={verifyDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setVerifyDialog({
              open: false,
              backup: null,
              result: null,
              loading: false,
            });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Verification</DialogTitle>
            <DialogDescription>
              {verifyDialog.backup && (
                <span className="font-mono">{verifyDialog.backup.fileName}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {verifyDialog.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-3 text-sm text-muted-foreground">
                Verifying backup integrity...
              </p>
            </div>
          ) : verifyDialog.result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {verifyDialog.result.valid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-700">
                      Backup is valid
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700">
                      Backup is invalid
                    </span>
                  </>
                )}
              </div>
              <div className="rounded-md border p-3 text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">Files:</span>{" "}
                  {verifyDialog.result.details.fileCount}
                </p>
                <p>
                  <span className="text-muted-foreground">Total Size:</span>{" "}
                  {verifyDialog.result.details.totalSize}
                </p>
                {verifyDialog.result.details.databases.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1">Databases:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {verifyDialog.result.details.databases.map((db) => (
                        <li key={db.name}>
                          <span className="font-mono">{db.name}</span> &mdash;{" "}
                          {db.collectionCount} collection(s)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setVerifyDialog({
                  open: false,
                  backup: null,
                  result: null,
                  loading: false,
                })
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
