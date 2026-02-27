"use client";

import { useState } from "react";
import { useHealthSummary, useHealthHistory, useBatchHealthCheck } from "@/hooks/use-tenants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, HeartPulse, Activity, Clock, Wifi } from "lucide-react";
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
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No health check history in the last 24 hours.
          </p>
        ) : (
          <div className="rounded-md border">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time health status of all active tenants. Auto-refreshes every 60 seconds.
          </p>
        </div>
        <Button
          onClick={() => batchHealth.mutate()}
          disabled={batchHealth.isPending}
        >
          {batchHealth.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <HeartPulse className="h-4 w-4 mr-2" />
          )}
          Run Health Check
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : summary.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HeartPulse className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No active tenants</p>
            <p className="text-muted-foreground">Health monitoring data will appear for active tenants.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((item) => (
            <Card
              key={item.tenantId}
              className={`cursor-pointer hover:shadow-md transition-shadow border ${getStatusColor(item.currentStatus)}`}
              onClick={() =>
                setSelectedTenant({
                  tenantId: item.tenantId,
                  universityName: item.universityName,
                })
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {item.universityName}
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(item.currentStatus)}>
                    {item.currentStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {item.tenantId}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold">
                      {item.uptimePercent !== null ? `${item.uptimePercent}%` : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold">
                      {item.avgResponseTime !== null ? `${item.avgResponseTime}ms` : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Wifi className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold">{item.checksCount}</p>
                    <p className="text-xs text-muted-foreground">Checks (24h)</p>
                  </div>
                </div>
                {item.lastCheckedAt && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Last checked {formatDistanceToNow(new Date(item.lastCheckedAt), { addSuffix: true })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
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
