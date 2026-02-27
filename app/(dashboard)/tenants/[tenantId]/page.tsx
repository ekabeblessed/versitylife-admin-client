"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTenant, useTenantMetrics } from "@/hooks/use-tenants";
import { useDeployments, useDeploy, useRollback } from "@/hooks/use-deployments";
import { useProvisioningJob } from "@/hooks/use-provisioning";
import { useCurrentUser } from "@/stores/authStore";
import { StatusBadge, HealthBadge } from "@/components/tenants/status-badge";
import { ProvisioningProgress } from "@/components/provisioning/progress-tracker";
import { TenantConfigTab } from "@/components/tenants/tenant-config-tab";
import { TenantBackupsTab } from "@/components/tenants/tenant-backups-tab";
import { TenantDomainsTab } from "@/components/tenants/tenant-domains-tab";
import { TenantEnvVarsTab } from "@/components/tenants/tenant-env-vars-tab";
import { TenantSecretsTab } from "@/components/tenants/tenant-secrets-tab";
import { TenantBillingTab } from "@/components/tenants/tenant-billing-tab";
import { LiveDeploymentCard } from "@/components/tenants/live-deployment-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, ExternalLink, Rocket, RotateCcw,
  Globe, Server, Clock, Activity, Gauge, FlaskConical, CreditCard,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

function CloudRunMetricsCard({ tenantId }: { tenantId: string }) {
  const { data, isLoading } = useTenantMetrics(tenantId);
  const metrics = data?.metrics;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Cloud Run Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Cloud Run Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="text-muted-foreground">CPU</div>
          <div>{metrics.resources.cpu}</div>
          <div className="text-muted-foreground">Memory</div>
          <div>{metrics.resources.memory}</div>
          <div className="text-muted-foreground">Min Instances</div>
          <div>{metrics.scaling.minInstances}</div>
          <div className="text-muted-foreground">Max Instances</div>
          <div>{metrics.scaling.maxInstances}</div>
        </div>

        {metrics.traffic.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Traffic Split</p>
              <div className="space-y-1">
                {metrics.traffic.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{t.revisionName || "latest"}</span>
                    <div className="flex items-center gap-2">
                      <span>{t.percent}%</span>
                      {t.latestRevision && (
                        <Badge variant="secondary" className="text-xs">latest</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {metrics.conditions.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Service Conditions</p>
              <div className="space-y-1">
                {metrics.conditions.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{c.type}</span>
                    <Badge variant={c.status === "True" ? "success" : "secondary"}>
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const jobId = searchParams.get("jobId") || "";
  const currentUser = useCurrentUser();
  const isSuperadmin = currentUser?.role === "platform_superadmin";

  const [showLiveCard, setShowLiveCard] = useState(false);

  const { data: tenantData, isLoading } = useTenant(tenantId);
  const { data: deploymentsData } = useDeployments({
    tenantId,
    refetchInterval: showLiveCard ? 3000 : false,
  });
  const deploy = useDeploy();
  const rollback = useRollback();

  const tenant = tenantData?.tenant;
  const deployments = deploymentsData?.deployments || [];

  const handleDeploy = async () => {
    try {
      await deploy.mutateAsync(tenantId);
      setShowLiveCard(true);
    } catch (err: any) {
      toast.error("Deploy failed", { description: err.data?.message || err.message });
    }
  };

  const handleRollback = async () => {
    try {
      await rollback.mutateAsync({ tenantId });
      setShowLiveCard(true);
    } catch (err: any) {
      toast.error("Rollback failed", { description: err.data?.message || err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-24">
        <p className="text-lg">Tenant not found</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/tenants">Back to tenants</Link>
        </Button>
      </div>
    );
  }

  const rawJobId = tenant.provisioningJobId;
  const provJobId = jobId || (typeof rawJobId === "object" && rawJobId !== null ? (rawJobId as any)._id : rawJobId) || "";

  return (
    <div className="space-y-6">
      {/* Staging environment banner */}
      {tenant.isStaging && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <FlaskConical className="h-4 w-4 shrink-0" />
          <strong>STAGING ENVIRONMENT</strong> — Test changes here before applying to production tenants.
        </div>
      )}

      {/* Live deployment tracker */}
      {showLiveCard && (
        <LiveDeploymentCard
          tenantId={tenantId}
          onDismiss={() => setShowLiveCard(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tenants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tenant.university.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">{tenant.tenantId}</p>
          </div>
          <StatusBadge status={tenant.status} />
          {!tenant.enabled && <Badge variant="secondary">Disabled</Badge>}
        </div>
        <div className="flex gap-2">
          {tenant.deployment.serviceUrl && (
            <Button variant="outline" asChild>
              <a href={tenant.deployment.serviceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Service
              </a>
            </Button>
          )}
          {tenant.status === "active" && (
            <>
              <Button variant="outline" onClick={handleRollback} disabled={rollback.isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback
              </Button>
              <Button onClick={handleDeploy} disabled={deploy.isPending}>
                {deploy.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                Deploy
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Billing
          </TabsTrigger>
          {isSuperadmin && <TabsTrigger value="secrets">Secrets</TabsTrigger>}
          {(tenant.status === "provisioning" || provJobId) && (
            <TabsTrigger value="provisioning">Provisioning</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <StatusBadge status={tenant.status} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <HealthBadge status={tenant.lastHealthCheck?.status} />
                {tenant.lastHealthCheck?.responseTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {tenant.lastHealthCheck.responseTime}ms
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Region</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{tenant.deployment.region}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resources</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {tenant.resources.cpu} CPU / {tenant.resources.memory}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tenant.scaling.minInstances}-{tenant.scaling.maxInstances} instances
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>University Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div className="text-muted-foreground">Full Name</div>
                  <div>{tenant.university.fullName}</div>
                  <div className="text-muted-foreground">Code</div>
                  <div>{tenant.university.code}</div>
                  <div className="text-muted-foreground">Country</div>
                  <div>{tenant.university.country}</div>
                  <div className="text-muted-foreground">Timezone</div>
                  <div>{tenant.university.timezone}</div>
                  {tenant.deployment.serviceUrl && (
                    <>
                      <div className="text-muted-foreground">Service URL</div>
                      <div className="font-mono text-xs break-all">{tenant.deployment.serviceUrl}</div>
                    </>
                  )}
                  {tenant.deployment.activeRevision && (
                    <>
                      <div className="text-muted-foreground">Active Revision</div>
                      <div className="font-mono text-xs">{tenant.deployment.activeRevision}</div>
                    </>
                  )}
                  <div className="text-muted-foreground">Created</div>
                  <div>{format(new Date(tenant.createdAt), "PPP")}</div>
                </div>
              </CardContent>
            </Card>

            {tenant.status === "active" && (
              <CloudRunMetricsCard tenantId={tenantId} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <TenantConfigTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="environment">
          <TenantEnvVarsTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="deployments">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
            </CardHeader>
            <CardContent>
              {deployments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No deployments yet</p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left font-medium">Date</th>
                        <th className="h-10 px-4 text-left font-medium">Type</th>
                        <th className="h-10 px-4 text-left font-medium">Status</th>
                        <th className="h-10 px-4 text-left font-medium">Revision</th>
                        <th className="h-10 px-4 text-left font-medium">Triggered By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deployments.map((dep) => (
                        <tr key={dep._id} className="border-b">
                          <td className="px-4 py-2">
                            {format(new Date(dep.createdAt), "PPp")}
                          </td>
                          <td className="px-4 py-2 capitalize">{dep.type}</td>
                          <td className="px-4 py-2">
                            <StatusBadge status={dep.status} />
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {dep.revisionName || "\u2014"}
                          </td>
                          <td className="px-4 py-2">
                            {dep.triggeredBy
                              ? `${dep.triggeredBy.firstName} ${dep.triggeredBy.lastName}`
                              : "\u2014"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups">
          <TenantBackupsTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="domains">
          <TenantDomainsTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="billing">
          <TenantBillingTab tenant={tenant} />
        </TabsContent>

        {isSuperadmin && (
          <TabsContent value="secrets">
            <TenantSecretsTab tenant={tenant} />
          </TabsContent>
        )}

        {(tenant.status === "provisioning" || provJobId) && (
          <TabsContent value="provisioning">
            <ProvisioningProgress jobId={provJobId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
