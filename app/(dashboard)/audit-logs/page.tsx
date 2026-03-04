"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Spinner, Scroll, CaretDown, CaretRight } from "@phosphor-icons/react";
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
        <h1 className="text-xl font-bold text-white tracking-tight">Audit Logs</h1>
        <p className="text-sm text-slate-400 mt-0.5">View all platform activity and security events</p>
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
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-800 rounded-xl bg-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
            <Scroll className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-base font-semibold text-white mb-1">No audit logs found</p>
          <p className="text-sm text-slate-400 max-w-xs">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="h-12 w-8 px-2" />
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Timestamp</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">User</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Resource</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Severity</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">IP Address</th>
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
            <div className="flex flex-wrap items-center justify-between gap-4">
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
        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100 cursor-pointer"
        onClick={hasDetails ? onToggle : undefined}
      >
        <td className="px-2 text-slate-500">
          {hasDetails && (
            expanded ? <CaretDown className="h-4 w-4" /> : <CaretRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
        </td>
        <td className="px-4 py-3 text-slate-200">
          {log.userId ? log.userId.email : <span className="text-slate-500">System</span>}
        </td>
        <td className="px-4 py-3 font-mono text-xs text-slate-300">
          {log.action}
        </td>
        <td className="px-4 py-3 text-slate-400">
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
        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
          {log.ipAddress || "—"}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr className="border-b border-slate-800 bg-slate-800/20">
          <td />
          <td colSpan={6} className="px-4 py-3">
            <div className="text-xs space-y-1">
              <p className="font-medium text-slate-500 mb-2">Details</p>
              {Object.entries(log.details!).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-mono text-slate-500">{key}:</span>
                  <span className="font-mono text-slate-300">{String(value)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
