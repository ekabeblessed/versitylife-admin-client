"use client";

import { useState } from "react";
import Link from "next/link";
import { useProvisioningJobs } from "@/hooks/use-provisioning";
import { StatusBadge } from "@/components/tenants/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Spinner, GitBranch } from "@phosphor-icons/react";
import { format } from "date-fns";

const JOB_STATUSES = ["pending", "in_progress", "completed", "failed", "cancelled"] as const;

export default function ProvisioningPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useProvisioningJobs({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  const jobs = data?.jobs || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Provisioning Jobs</h1>
        <p className="text-sm text-slate-400 mt-0.5">Track all tenant provisioning jobs across the platform</p>
      </div>

      <div className="flex gap-4">
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
            {JOB_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-800 rounded-xl bg-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
            <GitBranch className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-base font-semibold text-white mb-1">No provisioning jobs found</p>
          <p className="text-sm text-slate-400 max-w-xs">Jobs will appear here when tenants are provisioned.</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tenant ID</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Step</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Started</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Triggered By</th>
                  <th className="h-12 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const currentStep = job.steps.find((s) =>
                    s.status === "in_progress" || s.status === "failed"
                  ) || job.steps[job.steps.length - 1];

                  return (
                    <tr key={job._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <Link
                          href={`/tenants/${job.tenantId}?tab=provisioning&jobId=${job._id}`}
                          className="font-medium font-mono text-xs hover:underline"
                        >
                          {job.tenantId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-400">
                        {currentStep ? currentStep.name.replace(/_/g, " ") : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {job.startedAt
                          ? format(new Date(job.startedAt), "MMM d, HH:mm")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {job.completedAt
                          ? format(new Date(job.completedAt), "MMM d, HH:mm")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {job.triggeredBy
                          ? `${job.triggeredBy.firstName} ${job.triggeredBy.lastName}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tenants/${job.tenantId}?tab=provisioning&jobId=${job._id}`}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {jobs.length} of {pagination.total} jobs
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
