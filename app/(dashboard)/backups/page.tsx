"use client";

import Link from "next/link";
import { useBackupsOverview, useTriggerBackup } from "@/hooks/use-backups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner, HardDrives, Play } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function BackupsPage() {
  const { data, isLoading } = useBackupsOverview();
  const triggerBackup = useTriggerBackup();

  const overview = data?.overview || [];

  const handleTriggerBackup = async (tenantId: string) => {
    try {
      await triggerBackup.mutateAsync(tenantId);
      toast.success(`Backup triggered for ${tenantId}`);
    } catch (err: any) {
      toast.error("Failed to trigger backup", {
        description: err.data?.message || err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Backups</h1>
        <p className="text-sm text-slate-400 mt-0.5">Overview of backup status across all active tenants</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading backups...</p>
        </div>
      ) : overview.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-800 rounded-xl bg-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
            <HardDrives className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-base font-semibold text-white mb-1">No active tenants</p>
          <p className="text-sm text-slate-400 max-w-xs">Backup information will appear when tenants are active.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tenant</th>
                <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Last Backup</th>
                <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</th>
                <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Size</th>
                <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Schedule</th>
                <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overview.map((item) => (
                <tr key={item.tenantId} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tenants/${item.tenantId}?tab=backups`}
                      className="font-medium text-white hover:text-goldenYellow-400 transition-colors"
                    >
                      {item.universityName}
                    </Link>
                    <div className="text-xs text-slate-500 font-mono">
                      {item.tenantId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.lastBackup ? (
                      <span className="text-slate-400">
                        {formatDistanceToNow(new Date(item.lastBackup.created), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-slate-500">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-200">{item.totalBackups}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {item.totalSizeFormatted}
                  </td>
                  <td className="px-4 py-3">
                    {item.schedule ? (
                      <Badge variant={item.schedule.state === "ENABLED" ? "success" : "secondary"}>
                        {item.schedule.state === "ENABLED" ? "Active" : "Paused"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No schedule</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTriggerBackup(item.tenantId)}
                        disabled={triggerBackup.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Backup
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tenants/${item.tenantId}?tab=backups`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
