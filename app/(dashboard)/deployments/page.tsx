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
import { Loader2, Rocket } from "lucide-react";
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
        <h1 className="text-2xl font-bold">Deployments</h1>
        <p className="text-muted-foreground">
          View all deployments across tenants
        </p>
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayDeployments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No deployments found</p>
            <p className="text-muted-foreground">Deployments will appear here when triggered.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left font-medium">Date</th>
                  <th className="h-12 px-4 text-left font-medium">Tenant</th>
                  <th className="h-12 px-4 text-left font-medium">Type</th>
                  <th className="h-12 px-4 text-left font-medium">Status</th>
                  <th className="h-12 px-4 text-left font-medium">Revision</th>
                  <th className="h-12 px-4 text-left font-medium">Triggered By</th>
                  <th className="h-12 px-4 text-left font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {displayDeployments.map((dep) => (
                  <tr key={dep._id} className="border-b hover:bg-muted/25 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>{format(new Date(dep.createdAt), "MMM d, yyyy")}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(dep.createdAt), "HH:mm:ss")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tenants/${dep.tenantId}`}
                        className="font-medium hover:underline"
                      >
                        {dep.tenantId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize">{dep.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={dep.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {dep.revisionName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {dep.triggeredBy
                        ? `${dep.triggeredBy.firstName} ${dep.triggeredBy.lastName}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getDuration(dep)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
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
