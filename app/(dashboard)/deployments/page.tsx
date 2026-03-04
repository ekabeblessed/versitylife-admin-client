"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useDeployments } from "@/hooks/use-deployments";
import { useTenants } from "@/hooks/use-tenants";
import { StatusBadge } from "@/components/tenants/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Spinner, Rocket } from "@phosphor-icons/react";
import { format, formatDistanceToNow } from "date-fns";
import type { Deployment } from "@/types/deployment";

const DEPLOYMENT_STATUSES = [
  "pending", "deploying", "health_checking", "routing", "completed", "failed", "rolled_back",
] as const;

const DEPLOYMENT_TYPES = ["initial", "update", "rollback", "config_change"] as const;

function getDuration(dep: Deployment): string {
  const start = dep.timing.startedAt;
  const end = dep.timing.completedAt;
  if (!start) return "-";
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const diffSec = Math.round((endMs - startMs) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  return `${min}m ${sec}s`;
}

export default function DeploymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [tenantFilter, setTenantFilter] = useState<string>("");

  const hasActiveDeployments = useMemo(() => {
    return !!statusFilter && ["pending", "deploying", "health_checking", "routing"].includes(statusFilter);
  }, [statusFilter]);

  const { data, isLoading } = useDeployments({
    page,
    limit: 20,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    tenantId: tenantFilter || undefined,
    refetchInterval: hasActiveDeployments ? 5000 : false,
  });

  const { data: tenantsData } = useTenants({ limit: 100 });

  const deployments = data?.deployments || [];
  const pagination = data?.pagination;
  const tenants = tenantsData?.tenants || [];

  // Auto-refresh if any deployment is active
  const anyActive = deployments.some((d) =>
    ["pending", "deploying", "health_checking", "routing"].includes(d.status)
  );

  const { data: autoRefreshData } = useDeployments({
    page,
    limit: 20,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    tenantId: tenantFilter || undefined,
    refetchInterval: anyActive ? 5000 : false,
  });

  const displayDeployments = (anyActive ? autoRefreshData?.deployments : null) || deployments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Deployments</h1>
        <p className="text-sm text-slate-400 mt-0.5">View all deployments across tenants</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select
          value={tenantFilter}
          onValueChange={(v) => {
            setTenantFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All tenants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tenants</SelectItem>
            {tenants.map((t) => (
              <SelectItem key={t.tenantId} value={t.tenantId}>
                {t.university.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {DEPLOYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {DEPLOYMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading deployments...</p>
        </div>
      ) : displayDeployments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-800 rounded-xl bg-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
            <Rocket className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-base font-semibold text-white mb-1">No deployments found</p>
          <p className="text-sm text-slate-400 max-w-xs">Deployments will appear here when triggered.</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tenant</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Revision</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Triggered By</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Duration</th>
                </tr>
              </thead>
              <tbody>
                {displayDeployments.map((dep) => (
                  <tr key={dep._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-slate-200">{format(new Date(dep.createdAt), "MMM d, yyyy")}</div>
                      <div className="text-xs text-slate-500">
                        {format(new Date(dep.createdAt), "HH:mm:ss")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tenants/${dep.tenantId}`}
                        className="font-medium text-white hover:text-goldenYellow-400 transition-colors"
                      >
                        {dep.tenantId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-300">{dep.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={dep.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {dep.revisionName || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {dep.triggeredBy
                        ? `${dep.triggeredBy.firstName} ${dep.triggeredBy.lastName}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {getDuration(dep)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {displayDeployments.length} of {pagination.total} deployments
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
