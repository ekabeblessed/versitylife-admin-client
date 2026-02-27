"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ScrollText, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { AuditLog } from "@/types/audit-log";

const SEVERITY_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  low: "success",
  medium: "warning",
  high: "destructive",
};

const ACTION_OPTIONS = [
  "login_success",
  "login_failed",
  "password_changed",
  "two_factor_enabled",
  "user_created",
  "user_updated",
  "user_deleted",
  "tenant_created",
  "tenant_updated",
  "tenant_imported",
  "tenant_status_changed",
  "deployment_triggered",
  "rollback_triggered",
  "bulk_deployment_triggered",
  "provisioning_started",
  "provisioning_retried",
  "backup_triggered",
  "unauthorized_access_attempt",
  "global_env_updated",
];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [severity, setSeverity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useAuditLogs({
    page,
    action: action || undefined,
    severity: severity || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          View all platform activity and security events
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={severity}
          onValueChange={(v) => {
            setSeverity(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="w-[160px]"
          placeholder="Start date"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="w-[160px]"
          placeholder="End date"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-md">
          <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No audit logs found</p>
          <p className="text-muted-foreground">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 w-8 px-2" />
                  <th className="h-12 px-4 text-left font-medium">Timestamp</th>
                  <th className="h-12 px-4 text-left font-medium">User</th>
                  <th className="h-12 px-4 text-left font-medium">Action</th>
                  <th className="h-12 px-4 text-left font-medium">Resource</th>
                  <th className="h-12 px-4 text-left font-medium">Severity</th>
                  <th className="h-12 px-4 text-left font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: AuditLog) => (
                  <LogRow
                    key={log._id}
                    log={log}
                    expanded={expandedId === log._id}
                    onToggle={() => toggleExpand(log._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {logs.length} of {pagination.total} logs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDetails = log.details && Object.keys(log.details).length > 0;

  return (
    <>
      <tr
        className="border-b hover:bg-muted/25 transition-colors cursor-pointer"
        onClick={hasDetails ? onToggle : undefined}
      >
        <td className="px-2 text-muted-foreground">
          {hasDetails && (
            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
        </td>
        <td className="px-4 py-3">
          {log.userId ? log.userId.email : <span className="text-muted-foreground">System</span>}
        </td>
        <td className="px-4 py-3 font-mono text-xs">
          {log.action}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {log.resource || "—"}
          {log.resourceId && (
            <span className="ml-1 font-mono text-xs">({log.resourceId.slice(0, 8)}...)</span>
          )}
        </td>
        <td className="px-4 py-3">
          <Badge variant={SEVERITY_VARIANT[log.severity] || "secondary"}>
            {log.severity}
          </Badge>
        </td>
        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
          {log.ipAddress || "—"}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr className="border-b bg-muted/10">
          <td />
          <td colSpan={6} className="px-4 py-3">
            <div className="text-xs space-y-1">
              <p className="font-medium text-muted-foreground mb-2">Details</p>
              {Object.entries(log.details!).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-mono text-muted-foreground">{key}:</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
