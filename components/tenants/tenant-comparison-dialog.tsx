"use client";

import { Fragment, useState } from "react";
import { useTenants } from "@/hooks/use-tenants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, HealthBadge } from "@/components/tenants/status-badge";
import { X } from "@phosphor-icons/react";
import { format } from "date-fns";
import type { Tenant } from "@/types/tenant";

interface TenantComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ComparisonRow {
  label: string;
  getValue: (t: Tenant) => string;
  section?: string;
}

const comparisonRows: ComparisonRow[] = [
  { label: "Full Name", getValue: (t) => t.university.fullName, section: "Identity" },
  { label: "Code", getValue: (t) => t.university.code },
  { label: "Logo", getValue: (t) => t.university.logo || "-" },
  { label: "Country", getValue: (t) => t.university.country },
  { label: "Timezone", getValue: (t) => t.university.timezone },
  { label: "Contact Email", getValue: (t) => t.university.contactEmail || "-" },
  { label: "Contact Phone", getValue: (t) => t.university.contactPhone || "-" },
  { label: "Status", getValue: (t) => t.status, section: "Status & Health" },
  { label: "Enabled", getValue: (t) => t.enabled ? "Yes" : "No" },
  { label: "Health", getValue: (t) => t.lastHealthCheck?.status || "unknown" },
  { label: "Response Time", getValue: (t) => t.lastHealthCheck?.responseTime ? `${t.lastHealthCheck.responseTime}ms` : "-" },
  { label: "Region", getValue: (t) => t.deployment.region, section: "Infrastructure" },
  { label: "Service Name", getValue: (t) => t.serviceName || "-" },
  { label: "Active Revision", getValue: (t) => t.deployment.activeRevision || "-" },
  { label: "CPU", getValue: (t) => t.resources.cpu },
  { label: "Memory", getValue: (t) => t.resources.memory },
  { label: "Min Instances", getValue: (t) => String(t.scaling.minInstances) },
  { label: "Max Instances", getValue: (t) => String(t.scaling.maxInstances) },
  { label: "Service URL", getValue: (t) => t.deployment.serviceUrl || "-" },
  { label: "Backup Enabled", getValue: (t) => t.cronJobs?.backup?.enabled ? "Yes" : "No", section: "Operations" },
  { label: "Backup Schedule", getValue: (t) => t.cronJobs?.backup?.schedule || "-" },
  { label: "Created", getValue: (t) => { try { return format(new Date(t.createdAt), "PPP"); } catch { return "-"; } } },
];

export function TenantComparisonDialog({ open, onOpenChange }: TenantComparisonDialogProps) {
  const { data } = useTenants({ limit: 100 });
  const allTenants = data?.tenants || [];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedTenants = selectedIds
    .map((id) => allTenants.find((t) => t.tenantId === id))
    .filter(Boolean) as Tenant[];

  const addTenant = (tenantId: string) => {
    if (tenantId && selectedIds.length < 3 && !selectedIds.includes(tenantId)) {
      setSelectedIds([...selectedIds, tenantId]);
    }
  };

  const removeTenant = (tenantId: string) => {
    setSelectedIds(selectedIds.filter((id) => id !== tenantId));
  };

  const availableTenants = allTenants.filter((t) => !selectedIds.includes(t.tenantId));

  const allValues = (row: ComparisonRow) => selectedTenants.map((t) => row.getValue(t));
  const hasDifference = (row: ComparisonRow) => {
    const vals = allValues(row);
    return vals.length > 1 && new Set(vals).size > 1;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedIds([]); }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Tenants</DialogTitle>
          <DialogDescription>
            Select up to 3 tenants to compare side by side. Differences are highlighted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {selectedTenants.map((t) => (
              <Badge key={t.tenantId} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                {t.university.name}
                <button onClick={() => removeTenant(t.tenantId)} className="ml-1 hover:text-destructive">
                  <X weight="bold" className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedIds.length < 3 && (
              <Select onValueChange={addTenant} value="">
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Add tenant to compare..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.map((t) => (
                    <SelectItem key={t.tenantId} value={t.tenantId}>
                      {t.university.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedTenants.length >= 2 && (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium w-[160px]">Property</th>
                    {selectedTenants.map((t) => (
                      <th key={t.tenantId} className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center gap-2">
                          {t.university.logo ? (
                            <img
                              src={t.university.logo}
                              alt={t.university.name}
                              className="h-6 w-6 rounded object-contain bg-white p-0.5"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="h-6 w-6 rounded bg-gradient-to-br from-goldenYellow-400 to-goldenYellow-600 flex items-center justify-center text-slate-900 font-bold text-[10px] shrink-0">
                              {t.university.name.charAt(0)}
                            </div>
                          )}
                          {t.university.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => {
                    const isDiff = hasDifference(row);
                    return (
                      <Fragment key={row.label}>
                        {row.section && (
                          <tr className="border-b bg-muted/30">
                            <td
                              colSpan={selectedTenants.length + 1}
                              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                              {row.section}
                            </td>
                          </tr>
                        )}
                        <tr
                          className={`border-b ${isDiff ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}`}
                        >
                          <td className="px-4 py-2 font-medium text-muted-foreground">
                            {row.label}
                            {isDiff && <span className="ml-1 text-yellow-600 text-xs">*</span>}
                          </td>
                          {selectedTenants.map((t) => (
                            <td key={t.tenantId} className="px-4 py-2">
                              {row.label === "Status" ? (
                                <StatusBadge status={t.status} />
                              ) : row.label === "Health" ? (
                                <HealthBadge status={t.lastHealthCheck?.status} />
                              ) : row.label === "Logo" ? (
                                t.university.logo ? (
                                  <img
                                    src={t.university.logo}
                                    alt={t.university.name}
                                    className="h-10 w-10 rounded-lg object-contain bg-white p-0.5 border border-border"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <span className="text-muted-foreground text-xs">No logo</span>
                                )
                              ) : (
                                <span className={`${isDiff ? "font-medium" : ""} break-all`}>
                                  {row.getValue(t)}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedTenants.length < 2 && (
            <p className="text-center text-muted-foreground py-8">
              Select at least 2 tenants to compare.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
