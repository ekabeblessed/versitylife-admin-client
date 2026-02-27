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
import { Plus, Search, Building2, Loader2, ExternalLink, Download, HeartPulse, Rocket, ArrowLeftRight } from "lucide-react";
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

  // Auto-run batch health check once when tenants first load
  useEffect(() => {
    if (tenants.length > 0 && !healthCheckedRef.current) {
      healthCheckedRef.current = true;
      batchHealth.mutate();
    }
  }, [tenants.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">
            Manage all university tenants across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCompareOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Compare
          </Button>
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Rocket className="h-4 w-4 mr-2" />
            Bulk Deploy
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tenants/import">
              <Download className="h-4 w-4 mr-2" />
              Import Existing
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tenants/new">
              <Plus className="h-4 w-4 mr-2" />
              Add University
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search universities..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="provisioning">Provisioning</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => batchHealth.mutate()}
          disabled={batchHealth.isPending}
        >
          {batchHealth.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <HeartPulse className="h-4 w-4 mr-2" />
          )}
          Check Health
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No tenants found</p>
            <p className="text-muted-foreground">Get started by adding a university.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left font-medium">University</th>
                  <th className="h-12 px-4 text-left font-medium">Tenant ID</th>
                  <th className="h-12 px-4 text-left font-medium">Country</th>
                  <th className="h-12 px-4 text-left font-medium">Status</th>
                  <th className="h-12 px-4 text-left font-medium">Health</th>
                  <th className="h-12 px-4 text-left font-medium">Billing</th>
                  <th className="h-12 px-4 text-left font-medium">Created</th>
                  <th className="h-12 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id} className="border-b hover:bg-muted/25 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/tenants/${tenant.tenantId}`} className="font-medium hover:underline">
                          {tenant.university.name}
                        </Link>
                        {tenant.isStaging && (
                          <Badge variant="warning" className="text-[10px] px-1.5 py-0">STAGING</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {tenant.tenantId}
                    </td>
                    <td className="px-4 py-3">{tenant.university.country}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="px-4 py-3">
                      <HealthBadge status={tenant.lastHealthCheck?.status} />
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const s = computeSubStatus(tenant.subscription);
                        if (s === "expired" || s === "trial_expired")
                          return <Badge variant="destructive" className="text-xs">{s === "trial_expired" ? "Trial Ended" : "Expired"}</Badge>;
                        if (s === "expiring_soon")
                          return <Badge variant="warning" className="text-xs">Expiring</Badge>;
                        if (s === "active")
                          return <Badge variant="success" className="text-xs">Active</Badge>;
                        if (s === "trial_expiring")
                          return <Badge variant="warning" className="text-xs">Trial Expiring</Badge>;
                        if (s === "trial")
                          return <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">Trial</Badge>;
                        return <span className="text-muted-foreground text-xs italic">—</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(tenant.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tenants/${tenant.tenantId}`}>View</Link>
                        </Button>
                        {tenant.deployment.serviceUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={tenant.deployment.serviceUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
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

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {tenants.length} of {pagination.total} tenants
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
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
