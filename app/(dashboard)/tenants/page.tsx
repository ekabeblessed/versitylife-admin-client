"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTenants, useBatchHealthCheck } from "@/hooks/use-tenants";
import { useBulkDeploy } from "@/hooks/use-deployments";
import { StatusBadge, HealthBadge } from "@/components/tenants/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TenantComparisonDialog } from "@/components/tenants/tenant-comparison-dialog";
import { Plus, MagnifyingGlass, Buildings, Spinner, ArrowSquareOut, Download, Heartbeat, Rocket, ArrowsLeftRight } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { Tenant, Subscription, SubscriptionStatus } from "@/types/tenant";

function computeSubStatus(sub: Partial<Subscription> | undefined): SubscriptionStatus {
  if (!sub?.endDate) return "not_set";
  const daysLeft = Math.floor((new Date(sub.endDate).getTime() - Date.now()) / 86_400_000);
  if (sub.billingCycle === "free_trial") {
    if (daysLeft < 0) return "trial_expired";
    if (daysLeft <= 7) return "trial_expiring";
    return "trial";
  }
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring_soon";
  return "active";
}

export default function TenantsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data, isLoading } = useTenants({
    page,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const batchHealth = useBatchHealthCheck();
  const healthCheckedRef = useRef(false);

  const tenants = data?.tenants || [];
  const pagination = data?.pagination;

  const stats = {
    total: pagination?.total || 0,
    active: tenants.filter(t => t.status === "active").length,
    provisioning: tenants.filter(t => t.status === "provisioning").length,
    error: tenants.filter(t => t.status === "error").length,
  };

  // Auto-run batch health check once when tenants first load
  useEffect(() => {
    if (tenants.length > 0 && !healthCheckedRef.current) {
      healthCheckedRef.current = true;
      batchHealth.mutate();
    }
  }, [tenants.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Tenants</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage all university tenants across the platform
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCompareOpen(true)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowsLeftRight className="h-4 w-4 mr-2" />
            Compare
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setBulkDialogOpen(true)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Bulk Deploy
          </Button>
          <Button 
            variant="outline" 
            asChild
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Link href="/tenants/import">
              <Download className="h-4 w-4 mr-2" />
              Import
            </Link>
          </Button>
          <Button 
            asChild
            className="bg-goldenYellow-500 hover:bg-goldenYellow-600 text-slate-900 font-medium"
          >
            <Link href="/tenants/new">
              <Plus className="h-4 w-4 mr-2" />
              Add University
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Total Tenants</p>
              <p className="text-2xl font-bold text-white tabular-nums">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <Buildings weight="bold" className="h-5 w-5 text-goldenYellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Active</p>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{stats.active}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Heartbeat weight="fill" className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Provisioning</p>
              <p className="text-2xl font-bold text-blue-400 tabular-nums">{stats.provisioning}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Spinner className="h-5 w-5 text-blue-400 animate-spin" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Errors</p>
              <p className="text-2xl font-bold text-red-400 tabular-nums">{stats.error}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Rocket weight="fill" className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm w-full">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search universities..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-10 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-goldenYellow-500 focus:ring-goldenYellow-500"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] h-10 bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-slate-300 focus:bg-slate-800">All statuses</SelectItem>
            <SelectItem value="active" className="text-slate-300 focus:bg-slate-800">Active</SelectItem>
            <SelectItem value="provisioning" className="text-slate-300 focus:bg-slate-800">Provisioning</SelectItem>
            <SelectItem value="inactive" className="text-slate-300 focus:bg-slate-800">Inactive</SelectItem>
            <SelectItem value="error" className="text-slate-300 focus:bg-slate-800">Error</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => batchHealth.mutate()}
          disabled={batchHealth.isPending}
          className="h-10 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          {batchHealth.isPending ? (
            <Spinner className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Heartbeat className="h-4 w-4 mr-2" />
          )}
          Check Health
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-8 w-8 animate-spin text-goldenYellow-400" />
          <p className="text-sm text-slate-500 mt-2">Loading tenants...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-5">
            <Buildings className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-base font-semibold text-white mb-1">No tenants found</p>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">Get started by adding a university tenant.</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">University</th>
                  <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tenant ID</th>
                  <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Country</th>
                  <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Health</th>
                  <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Billing</th>
                  <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Created</th>
                  <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {tenant.university.logo ? (
                          <img
                            src={tenant.university.logo}
                            alt={tenant.university.name}
                            className="w-9 h-9 rounded-lg object-contain bg-white p-0.5"
                            onError={(e) => {
                              const el = e.currentTarget;
                              el.style.display = 'none';
                              el.nextElementSibling?.removeAttribute('style');
                            }}
                          />
                        ) : null}
                        <div
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-goldenYellow-400 to-goldenYellow-600 flex items-center justify-center text-slate-900 font-bold text-sm"
                          style={tenant.university.logo ? { display: 'none' } : undefined}
                        >
                          {tenant.university.name.charAt(0)}
                        </div>
                        <div>
                          <Link href={`/tenants/${tenant.tenantId}`} className="font-medium text-white hover:text-goldenYellow-400 transition-colors">
                            {tenant.university.name}
                          </Link>
                          {tenant.isStaging && (
                            <Badge variant="warning" className="ml-2 text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">STAGING</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">
                      {tenant.tenantId}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{tenant.university.country}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="px-5 py-4">
                      <HealthBadge status={tenant.lastHealthCheck?.status} />
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const s = computeSubStatus(tenant.subscription);
                        if (s === "expired" || s === "trial_expired")
                          return <Badge variant="destructive" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">{s === "trial_expired" ? "Trial Ended" : "Expired"}</Badge>;
                        if (s === "expiring_soon")
                          return <Badge variant="warning" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">Expiring</Badge>;
                        if (s === "active")
                          return <Badge variant="success" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
                        if (s === "trial_expiring")
                          return <Badge variant="warning" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">Trial Expiring</Badge>;
                        if (s === "trial")
                          return <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">Trial</Badge>;
                        return <span className="text-slate-500 text-xs italic">—</span>;
                      })()}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {formatDistanceToNow(new Date(tenant.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
                          <Link href={`/tenants/${tenant.tenantId}`}>View</Link>
                        </Button>
                        {tenant.deployment.serviceUrl && (
                          <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-white">
                            <a href={tenant.deployment.serviceUrl} target="_blank" rel="noopener noreferrer">
                              <ArrowSquareOut className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-400">
                Showing <span className="text-white font-medium">{tenants.length}</span> of <span className="text-white font-medium">{pagination.total}</span> tenants
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.pages}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <BulkDeployDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        tenants={tenants.filter((t) => t.status === "active")}
      />

      <TenantComparisonDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
      />
    </div>
  );
}

function BulkDeployDialog({
  open,
  onOpenChange,
  tenants,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: Tenant[];
}) {
  const bulkDeploy = useBulkDeploy();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [buildImage, setBuildImage] = useState(true);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(tenants.map((t) => t.tenantId)));
      setBuildImage(true);
    }
  }, [open, tenants]);

  const allSelected = selectedIds.size === tenants.length && tenants.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tenants.map((t) => t.tenantId)));
    }
  };

  const toggleOne = (tenantId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tenantId)) {
        next.delete(tenantId);
      } else {
        next.add(tenantId);
      }
      return next;
    });
  };

  const handleDeploy = async () => {
    if (selectedIds.size === 0) return;
    try {
      const result = await bulkDeploy.mutateAsync({
        tenantIds: Array.from(selectedIds),
        buildImage,
      });
      toast.success(result.message);
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Bulk deploy failed", {
        description: err.data?.message || err.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Deploy</DialogTitle>
          <DialogDescription>
            Deploy to multiple tenants at once. Deployments run sequentially in the background.
          </DialogDescription>
        </DialogHeader>

        {tenants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No active tenants available for deployment.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <input
                type="checkbox"
                id="select-all"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({tenants.length} active tenants)
              </Label>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {tenants.map((tenant) => (
                <div key={tenant.tenantId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`tenant-${tenant.tenantId}`}
                    checked={selectedIds.has(tenant.tenantId)}
                    onChange={() => toggleOne(tenant.tenantId)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={`tenant-${tenant.tenantId}`} className="text-sm cursor-pointer flex-1">
                    {tenant.university.name}
                    <span className="text-muted-foreground ml-2 font-mono text-xs">{tenant.tenantId}</span>
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="checkbox"
                id="build-image"
                checked={buildImage}
                onChange={(e) => setBuildImage(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="build-image" className="text-sm cursor-pointer">
                Build image before deploying
              </Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={selectedIds.size === 0 || bulkDeploy.isPending}
          >
            {bulkDeploy.isPending ? (
              <Spinner className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Deploy {selectedIds.size} Tenant{selectedIds.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
