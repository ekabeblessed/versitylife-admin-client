"use client";

import { useState, useEffect } from "react";
import { useUpdateTenant } from "@/hooks/use-tenants";
import { useDeploy } from "@/hooks/use-deployments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Rocket, Plus, Trash2 } from "lucide-react";
import type { Tenant } from "@/types/tenant";

const FRONTEND_URL_KEYS = [
  { key: "BASE_URL", label: "Base URL", placeholder: "https://example.com" },
  { key: "FRONTEND_URL", label: "Frontend URL", placeholder: "https://example.com" },
  { key: "FRONTEND_ADMIN_URL", label: "Admin Dashboard URL", placeholder: "https://staff.example.com" },
  { key: "FRONTEND_STUDENT_URL", label: "Student Portal URL", placeholder: "https://student.example.com" },
  { key: "FRONTEND_APPLICANT_URL", label: "Applicant Portal URL", placeholder: "https://apply.example.com" },
  { key: "ALLOWED_ORIGINS", label: "Allowed Origins (comma-separated)", placeholder: "https://example.com,https://staff.example.com" },
  { key: "SUPPORT_EMAIL", label: "Support Email", placeholder: "support@example.com" },
];

const RESOURCE_OPTIONS = {
  cpu: ["1", "2", "4"],
  memory: ["256Mi", "512Mi", "1Gi", "2Gi"],
};

interface TenantConfigTabProps {
  tenant: Tenant;
}

export function TenantConfigTab({ tenant }: TenantConfigTabProps) {
  const updateTenant = useUpdateTenant();
  const deploy = useDeploy();

  // Frontend URLs state
  const [urlValues, setUrlValues] = useState<Record<string, string>>({});

  // Resources & scaling state
  const [resources, setResources] = useState({
    cpu: tenant.resources.cpu,
    memory: tenant.resources.memory,
  });
  const [scaling, setScaling] = useState({
    minInstances: tenant.scaling.minInstances,
    maxInstances: tenant.scaling.maxInstances,
  });

  // Custom env vars state
  const [customEnvVars, setCustomEnvVars] = useState<{ key: string; value: string }[]>([]);

  // Initialize from tenant data
  useEffect(() => {
    const env = tenant.environment || {};
    const urls: Record<string, string> = {};
    for (const { key } of FRONTEND_URL_KEYS) {
      urls[key] = env[key] || "";
    }
    setUrlValues(urls);

    // Load custom env vars (keys not in FRONTEND_URL_KEYS)
    const knownKeys = new Set(FRONTEND_URL_KEYS.map((f) => f.key));
    const custom = Object.entries(env)
      .filter(([k]) => !knownKeys.has(k))
      .map(([key, value]) => ({ key, value }));
    setCustomEnvVars(custom);

    setResources({ cpu: tenant.resources.cpu, memory: tenant.resources.memory });
    setScaling({ minInstances: tenant.scaling.minInstances, maxInstances: tenant.scaling.maxInstances });
  }, [tenant]);

  const handleSave = async () => {
    try {
      // Combine all environment updates
      const environment: Record<string, string> = { ...urlValues };
      for (const { key, value } of customEnvVars) {
        if (key.trim()) {
          environment[key.trim()] = value;
        }
      }

      await updateTenant.mutateAsync({
        tenantId: tenant.tenantId,
        data: {
          environment,
          resources,
          scaling,
        },
      });
      toast.success("Configuration saved");
    } catch (err: any) {
      toast.error("Failed to save", { description: err.data?.message || err.message });
    }
  };

  const handleSaveAndDeploy = async () => {
    try {
      const environment: Record<string, string> = { ...urlValues };
      for (const { key, value } of customEnvVars) {
        if (key.trim()) {
          environment[key.trim()] = value;
        }
      }

      await updateTenant.mutateAsync({
        tenantId: tenant.tenantId,
        data: {
          environment,
          resources,
          scaling,
        },
      });

      await deploy.mutateAsync(tenant.tenantId);
      toast.success("Configuration saved and deployment initiated");
    } catch (err: any) {
      toast.error("Failed", { description: err.data?.message || err.message });
    }
  };

  const addCustomEnvVar = () => {
    setCustomEnvVars((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeCustomEnvVar = (index: number) => {
    setCustomEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const isSaving = updateTenant.isPending || deploy.isPending;

  return (
    <div className="space-y-6">
      {/* Frontend URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Frontend URLs</CardTitle>
          <CardDescription>
            Configure the URLs for the tenant&apos;s frontend applications. Save and deploy to apply changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {FRONTEND_URL_KEYS.map(({ key, label, placeholder }) => (
            <div key={key} className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-sm font-medium">{label}</Label>
              <div className="col-span-2">
                <Input
                  value={urlValues[key] || ""}
                  onChange={(e) =>
                    setUrlValues((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resources & Scaling */}
      <Card>
        <CardHeader>
          <CardTitle>Resources & Scaling</CardTitle>
          <CardDescription>
            Adjust CPU, memory, and instance scaling. Requires re-deploy to take effect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm">CPU</Label>
              <select
                value={resources.cpu}
                onChange={(e) => setResources((r) => ({ ...r, cpu: e.target.value }))}
                className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {RESOURCE_OPTIONS.cpu.map((v) => (
                  <option key={v} value={v}>{v} vCPU</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm">Memory</Label>
              <select
                value={resources.memory}
                onChange={(e) => setResources((r) => ({ ...r, memory: e.target.value }))}
                className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {RESOURCE_OPTIONS.memory.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm">Min Instances</Label>
              <Input
                type="number"
                min={0}
                value={scaling.minInstances}
                onChange={(e) => setScaling((s) => ({ ...s, minInstances: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Max Instances</Label>
              <Input
                type="number"
                min={1}
                value={scaling.maxInstances}
                onChange={(e) => setScaling((s) => ({ ...s, maxInstances: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Environment Variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Environment Variables</CardTitle>
              <CardDescription>
                Add additional environment variables. These override defaults on re-deploy.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addCustomEnvVar}>
              <Plus className="h-4 w-4 mr-1" />
              Add Variable
            </Button>
          </div>
        </CardHeader>
        {customEnvVars.length > 0 && (
          <CardContent className="space-y-3">
            {customEnvVars.map((env, index) => (
              <div key={index} className="flex gap-3 items-center">
                <Input
                  value={env.key}
                  onChange={(e) =>
                    setCustomEnvVars((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, key: e.target.value } : item))
                    )
                  }
                  placeholder="KEY"
                  className="font-mono text-sm flex-1"
                />
                <Input
                  value={env.value}
                  onChange={(e) =>
                    setCustomEnvVars((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, value: e.target.value } : item))
                    )
                  }
                  placeholder="value"
                  className="font-mono text-sm flex-[2]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomEnvVar(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <Separator />
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleSave} disabled={isSaving}>
          {updateTenant.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
        {tenant.status === "active" && (
          <Button onClick={handleSaveAndDeploy} disabled={isSaving}>
            {deploy.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Save & Deploy
          </Button>
        )}
      </div>
    </div>
  );
}
