"use client";

import { useState } from "react";
import { useHealthSummary, useHealthHistory, useBatchHealthCheck } from "@/hooks/use-tenants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Spinner, Heartbeat, Waveform, Clock, WifiHigh } from "@phosphor-icons/react";
import { format, formatDistanceToNow } from "date-fns";

function getStatusColor(status: string) {
  switch (status) {
    case "healthy":
      return "text-green-600 bg-green-50 border-green-200";
    case "unhealthy":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "unreachable":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

function getStatusBadgeVariant(status: string): "success" | "destructive" | "secondary" {
  switch (status) {
    case "healthy":
      return "success";
    case "unhealthy":
    case "unreachable":
      return "destructive";
    default:
      return "secondary";
  }
}

function HealthHistoryModal({
  tenantId,
  universityName,
  open,
  onOpenChange,
}: {
  tenantId: string;
  universityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useHealthHistory(tenantId, 24);
  const history = data?.history || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Health History - {universityName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No health check history in the last 24 hours.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">Time</th>
                  <th className="h-10 px-4 text-left font-medium">Status</th>
                  <th className="h-10 px-4 text-left font-medium">Response Time</th>
                  <th className="h-10 px-4 text-left font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id} className="border-b">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {format(new Date(h.checkedAt), "HH:mm:ss")}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={getStatusBadgeVariant(h.status)}>
                        {h.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {h.responseTime ? `${h.responseTime}ms` : "-"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs truncate max-w-[200px]">
                      {h.error || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function MonitoringPage() {
  const { data, isLoading } = useHealthSummary();
  const batchHealth = useBatchHealthCheck();
  const [selectedTenant, setSelectedTenant] = useState<{
    tenantId: string;
    universityName: string;
  } | null>(null);

  const summary = data?.summary || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Health Monitoring</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time health status of all active tenants. Auto-refreshes every 60 seconds.
          </p>
        </div>
        <Button
          onClick={() => batchHealth.mutate()}
          disabled={batchHealth.isPending}
        >
          {batchHealth.isPending ? (
            <Spinner className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Heartbeat className="h-4 w-4 mr-2" />
          )}
          Run Health Check
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading health data...</p>
        </div>
      ) : summary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
            <Heartbeat className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-base font-semibold text-white mb-1">No active tenants</p>
          <p className="text-sm text-slate-400 max-w-xs">Health monitoring data will appear for active tenants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((item) => {
            const isHealthy = item.currentStatus === "healthy";
            const isUnhealthy = item.currentStatus === "unhealthy" || item.currentStatus === "unreachable";
            return (
              <div
                key={item.tenantId}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition-colors"
                onClick={() =>
                  setSelectedTenant({
                    tenantId: item.tenantId,
                    universityName: item.universityName,
                  })
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isHealthy ? "bg-emerald-500 animate-pulse" : isUnhealthy ? "bg-red-500" : "bg-slate-500"}`} />
                      <p className="text-sm font-semibold text-white truncate">{item.universityName}</p>
                    </div>
                    <p className="text-xs text-slate-500 font-mono pl-4">{item.tenantId}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(item.currentStatus)} className="shrink-0 ml-2">
                    {item.currentStatus}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center border-t border-slate-800 pt-3">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Waveform className="h-3 w-3 text-slate-500" />
                    </div>
                    <p className="text-base font-bold text-white tabular-nums">
                      {item.uptimePercent !== null ? `${item.uptimePercent}%` : "-"}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Uptime</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                    </div>
                    <p className="text-base font-bold text-white tabular-nums">
                      {item.avgResponseTime !== null ? `${item.avgResponseTime}ms` : "-"}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Avg Resp</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <WifiHigh className="h-3 w-3 text-slate-500" />
                    </div>
                    <p className="text-base font-bold text-white tabular-nums">{item.checksCount}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Checks 24h</p>
                  </div>
                </div>
                {item.lastCheckedAt && (
                  <p className="text-xs text-slate-600 mt-3 text-center">
                    Checked {formatDistanceToNow(new Date(item.lastCheckedAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedTenant && (
        <HealthHistoryModal
          tenantId={selectedTenant.tenantId}
          universityName={selectedTenant.universityName}
          open={!!selectedTenant}
          onOpenChange={(open) => !open && setSelectedTenant(null)}
        />
      )}
    </div>
  );
}
