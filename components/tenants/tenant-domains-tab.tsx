"use client";

import { useState } from "react";
import { useDomains, useAddDomain, useRemoveDomain, useVerifyDomain } from "@/hooks/use-domains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, RefreshCw, Globe } from "lucide-react";
import { format } from "date-fns";
import type { Tenant } from "@/types/tenant";

function getStatusVariant(status: string): "success" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "success";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}

export function TenantDomainsTab({ tenant }: { tenant: Tenant }) {
  const { data, isLoading } = useDomains(tenant.tenantId);
  const addDomain = useAddDomain();
  const removeDomain = useRemoveDomain();
  const verifyDomain = useVerifyDomain();
  const [showAdd, setShowAdd] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  const domains = data?.domains || [];

  const handleAdd = async () => {
    if (!newDomain.trim()) return;
    try {
      await addDomain.mutateAsync({ tenantId: tenant.tenantId, domain: newDomain.trim() });
      toast.success(`Domain ${newDomain} added`);
      setNewDomain("");
      setShowAdd(false);
    } catch (err: any) {
      toast.error("Failed to add domain", { description: err.data?.message || err.message });
    }
  };

  const handleRemove = async (domain: string) => {
    try {
      await removeDomain.mutateAsync({ tenantId: tenant.tenantId, domain });
      toast.success(`Domain ${domain} removed`);
    } catch (err: any) {
      toast.error("Failed to remove domain", { description: err.data?.message || err.message });
    }
  };

  const handleVerify = async (domain: string) => {
    try {
      const result = await verifyDomain.mutateAsync({ tenantId: tenant.tenantId, domain });
      if (result.domain.status === "active") {
        toast.success(`Domain ${domain} verified`);
      } else {
        toast.info(`Domain ${domain} is still pending verification`);
      }
    } catch (err: any) {
      toast.error("Verification failed", { description: err.data?.message || err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Custom Domains</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Domain
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No custom domains</p>
            <p className="text-muted-foreground">Add a custom domain to map to this tenant&apos;s service.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((d) => (
            <Card key={d._id || d.domain}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{d.domain}</CardTitle>
                    <Badge variant={getStatusVariant(d.status)}>
                      {d.status.replace(/_/g, " ")}
                    </Badge>
                    {d.source === "cloud_run" ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                        Cloud Run
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                        Managed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {d.source !== "cloud_run" && d.status !== "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(d.domain)}
                        disabled={verifyDomain.isPending}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Verify
                      </Button>
                    )}
                    {d.source !== "cloud_run" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(d.domain)}
                        disabled={removeDomain.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {d.dnsRecords.length > 0 && (
                <CardContent>
                  <p className="text-sm font-medium mb-2">DNS Records to configure:</p>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-8 px-3 text-left font-medium">Type</th>
                          <th className="h-8 px-3 text-left font-medium">Name</th>
                          <th className="h-8 px-3 text-left font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.dnsRecords.map((rec, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2 font-mono text-xs">{rec.type}</td>
                            <td className="px-3 py-2 font-mono text-xs">{rec.name}</td>
                            <td className="px-3 py-2 font-mono text-xs break-all">{rec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {d.verifiedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Verified on {format(new Date(d.verifiedAt), "PPp")}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Domain</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input
                placeholder="e.g. app.university.edu"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!newDomain.trim() || addDomain.isPending}>
              {addDomain.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
