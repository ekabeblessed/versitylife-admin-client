"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useDiscoverTenants, useImportTenant } from "@/hooks/use-tenants";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Radio, RefreshCw, Globe } from "lucide-react";
import type { ImportTenantInput, DiscoveredService } from "@/types/tenant";
import { formatDistanceToNow } from "date-fns";

const STEPS = ["Discover Services", "University Details", "Review & Import"];

export default function ImportTenantPage() {
  const router = useRouter();
  const { data: discoverData, isLoading: discovering, refetch } = useDiscoverTenants();
  const importTenant = useImportTenant();
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<DiscoveredService | null>(null);
  const [manualEntry, setManualEntry] = useState(false);

  const [form, setForm] = useState<ImportTenantInput>({
    tenantId: "",
    serviceName: "",
    university: {
      name: "",
      fullName: "",
      code: "",
      country: "",
      timezone: "Africa/Douala",
    },
    deployment: { region: "europe-west1" },
    resources: { cpu: "1", memory: "512Mi" },
    scaling: { minInstances: 0, maxInstances: 3 },
    environment: {},
    cronJobs: { enabled: true, backup: { schedule: "0 2 * * *", enabled: true } },
  });

  const updateForm = (path: string, value: any) => {
    setForm((prev) => {
      const newForm = { ...prev };
      const keys = path.split(".");
      let obj: any = newForm;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newForm;
    });
  };

  const selectService = (svc: DiscoveredService) => {
    setSelectedService(svc);
    const tenantId = svc.serviceName.replace(/-api$/, "");
    setForm((prev) => ({
      ...prev,
      tenantId,
      serviceName: svc.serviceName,
      deployment: { region: svc.region },
    }));
  };

  const handleManualEntry = () => {
    setManualEntry(true);
    setSelectedService(null);
  };

  const handleSubmit = async () => {
    try {
      await importTenant.mutateAsync(form);
      toast.success("Tenant imported!", { description: `${form.university.fullName} is now active.` });
      router.push(`/tenants/${form.tenantId}`);
    } catch (err: any) {
      toast.error("Failed to import tenant", {
        description: err.data?.message || err.message,
      });
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const services = discoverData?.services || [];

  const canProceedFromStep0 = selectedService !== null || (manualEntry && form.serviceName);
  const canProceedFromStep1 =
    form.tenantId && form.university.name && form.university.fullName && form.university.code && form.university.country;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Existing Tenant</h1>
          <p className="text-muted-foreground">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Discover */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Cloud Run Services</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select an unregistered service to import, or enter details manually.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={discovering}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${discovering ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {discovering ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : services.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No unregistered services found</p>
                  <p className="text-muted-foreground">All Cloud Run services are already registered, or none were found.</p>
                  <Button variant="outline" className="mt-4" onClick={handleManualEntry}>
                    Enter manually
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium w-10"></th>
                          <th className="h-10 px-4 text-left font-medium">Service Name</th>
                          <th className="h-10 px-4 text-left font-medium">Region</th>
                          <th className="h-10 px-4 text-left font-medium">Latest Revision</th>
                          <th className="h-10 px-4 text-left font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((svc) => (
                          <tr
                            key={svc.serviceName}
                            className={`border-b cursor-pointer transition-colors ${
                              selectedService?.serviceName === svc.serviceName
                                ? "bg-deepBlue-50 dark:bg-deepBlue-950"
                                : "hover:bg-muted/25"
                            }`}
                            onClick={() => selectService(svc)}
                          >
                            <td className="px-4 py-3">
                              <Radio
                                className={`h-4 w-4 ${
                                  selectedService?.serviceName === svc.serviceName
                                    ? "text-deepBlue-600"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-xs font-medium">{svc.serviceName}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[300px]">{svc.serviceUrl}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{svc.region}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{svc.latestRevision}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {svc.createdAt
                                ? formatDistanceToNow(new Date(svc.createdAt), { addSuffix: true })
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button variant="ghost" size="sm" onClick={handleManualEntry}>
                    Or enter service name manually
                  </Button>
                </>
              )}

              {manualEntry && (
                <div className="space-y-3 border rounded-md p-4">
                  <p className="text-sm font-medium">Manual Entry</p>
                  <div className="space-y-2">
                    <Label>Service Name *</Label>
                    <Input
                      value={form.serviceName}
                      onChange={(e) => {
                        updateForm("serviceName", e.target.value);
                        const tenantId = e.target.value.replace(/-api$/, "");
                        updateForm("tenantId", tenantId);
                      }}
                      placeholder="university-api"
                    />
                    <p className="text-xs text-muted-foreground">The Cloud Run service name (e.g., uba-api)</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: University Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University Name *</Label>
                  <Input
                    value={form.university.name}
                    onChange={(e) => updateForm("university.name", e.target.value)}
                    placeholder="UBa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={form.university.fullName}
                    onChange={(e) => updateForm("university.fullName", e.target.value)}
                    placeholder="University of Bamenda"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University Code *</Label>
                  <Input
                    value={form.university.code}
                    onChange={(e) => updateForm("university.code", e.target.value)}
                    placeholder="UBA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tenant ID *</Label>
                  <Input
                    value={form.tenantId}
                    onChange={(e) => updateForm("tenantId", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="uba"
                  />
                  <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Input
                    value={form.university.country}
                    onChange={(e) => updateForm("university.country", e.target.value)}
                    placeholder="Cameroon"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={form.university.timezone || "Africa/Douala"}
                    onValueChange={(v) => updateForm("university.timezone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Douala">Africa/Douala (WAT)</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    value={form.university.contactEmail || ""}
                    onChange={(e) => updateForm("university.contactEmail", e.target.value)}
                    placeholder="admin@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={form.university.contactPhone || ""}
                    onChange={(e) => updateForm("university.contactPhone", e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              <Separator />

              <p className="text-sm font-medium">Service Configuration</p>
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input value={form.serviceName} disabled className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={form.deployment?.region || "europe-west1"}
                    onValueChange={(v) => updateForm("deployment.region", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-west1">Europe West 1 (Belgium)</SelectItem>
                      <SelectItem value="us-central1">US Central 1 (Iowa)</SelectItem>
                      <SelectItem value="us-east1">US East 1 (S. Carolina)</SelectItem>
                      <SelectItem value="asia-southeast1">Asia SE 1 (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPU</Label>
                  <Select
                    value={form.resources?.cpu || "1"}
                    onValueChange={(v) => updateForm("resources.cpu", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 vCPU</SelectItem>
                      <SelectItem value="2">2 vCPU</SelectItem>
                      <SelectItem value="4">4 vCPU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Memory</Label>
                  <Select
                    value={form.resources?.memory || "512Mi"}
                    onValueChange={(v) => updateForm("resources.memory", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="256Mi">256 MB</SelectItem>
                      <SelectItem value="512Mi">512 MB</SelectItem>
                      <SelectItem value="1Gi">1 GB</SelectItem>
                      <SelectItem value="2Gi">2 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Instances</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.scaling?.minInstances ?? 0}
                    onChange={(e) => updateForm("scaling.minInstances", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Instances</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.scaling?.maxInstances ?? 3}
                    onChange={(e) => updateForm("scaling.maxInstances", parseInt(e.target.value) || 3)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Import */}
          {step === 2 && (
            <div className="space-y-4">
              <CardTitle className="text-lg">Review Import</CardTitle>
              <p className="text-sm text-muted-foreground">
                This will create the tenant record with status &quot;active&quot; — no provisioning pipeline will run.
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="text-muted-foreground">University</div>
                <div className="font-medium">{form.university.fullName}</div>
                <div className="text-muted-foreground">Short Name</div>
                <div>{form.university.name}</div>
                <div className="text-muted-foreground">Tenant ID</div>
                <div className="font-mono">{form.tenantId}</div>
                <div className="text-muted-foreground">Service Name</div>
                <div className="font-mono">{form.serviceName}</div>
                <div className="text-muted-foreground">Code</div>
                <div>{form.university.code}</div>
                <div className="text-muted-foreground">Country</div>
                <div>{form.university.country}</div>
                <div className="text-muted-foreground">Timezone</div>
                <div>{form.university.timezone}</div>
                <div className="text-muted-foreground">Region</div>
                <div>{form.deployment?.region}</div>
                <div className="text-muted-foreground">Resources</div>
                <div>{form.resources?.cpu} CPU / {form.resources?.memory}</div>
                <div className="text-muted-foreground">Scaling</div>
                <div>{form.scaling?.minInstances}-{form.scaling?.maxInstances} instances</div>
              </div>
              {selectedService && (
                <>
                  <Separator />
                  <p className="text-sm font-medium">Live Service Info</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="text-muted-foreground">Service URL</div>
                    <div className="font-mono text-xs truncate">{selectedService.serviceUrl}</div>
                    <div className="text-muted-foreground">Latest Revision</div>
                    <div className="font-mono text-xs">{selectedService.latestRevision}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 ? !canProceedFromStep0 : !canProceedFromStep1}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={importTenant.isPending}
            className="bg-deepBlue-600 hover:bg-deepBlue-700"
          >
            {importTenant.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Import Tenant
          </Button>
        )}
      </div>
    </div>
  );
}
