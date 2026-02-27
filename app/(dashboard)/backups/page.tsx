"use client";

import Link from "next/link";
import { useBackupsOverview, useTriggerBackup } from "@/hooks/use-backups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Database, Play } from "lucide-react";
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
        <h1 className="text-2xl font-bold">Backups</h1>
        <p className="text-muted-foreground">
          Overview of backup status across all active tenants
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : overview.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No active tenants</p>
            <p className="text-muted-foreground">Backup information will appear when tenants are active.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left font-medium">Tenant</th>
                <th className="h-12 px-4 text-left font-medium">Last Backup</th>
                <th className="h-12 px-4 text-left font-medium">Total</th>
                <th className="h-12 px-4 text-left font-medium">Size</th>
                <th className="h-12 px-4 text-left font-medium">Schedule</th>
                <th className="h-12 px-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overview.map((item) => (
                <tr key={item.tenantId} className="border-b hover:bg-muted/25 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tenants/${item.tenantId}?tab=backups`}
                      className="font-medium hover:underline"
                    >
                      {item.universityName}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono">
                      {item.tenantId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.lastBackup ? (
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(item.lastBackup.created), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.totalBackups}</td>
                  <td className="px-4 py-3 text-muted-foreground">
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
