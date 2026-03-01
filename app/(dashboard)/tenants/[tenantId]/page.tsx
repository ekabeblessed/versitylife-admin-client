"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  CaretLeft, Spinner, ArrowSquareOut, Rocket, ArrowClockwise,
  Globe, HardDrives, Clock, Waveform, Gauge, Flask, CreditCard,
  Heartbeat, Buildings, Robot,
} from "@phosphor-icons/react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { apiClient } from "@/lib/api";

function CloudRunMetricsCard({ tenantId }: { tenantId: string }) {
  const { data, isLoading } = useTenantMetrics(tenantId);
  const metrics = data?.metrics;

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="flex items-center gap-2 text-white">
            <Gauge className="h-4 w-4 text-goldenYellow-400" />
            Cloud Run Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="h-5 w-5 animate-spin text-slate-500" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <CardTitle className="flex items-center gap-2 text-white">
          <Gauge className="h-4 w-4 text-goldenYellow-400" />
          Cloud Run Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="text-slate-400">CPU</div>
          <div className="text-white font-medium">{metrics.resources.cpu}</div>
          <div className="text-slate-400">Memory</div>
          <div className="text-white font-medium">{metrics.resources.memory}</div>
          <div className="text-slate-400">Min Instances</div>
          <div className="text-white font-medium">{metrics.scaling.minInstances}</div>
          <div className="text-slate-400">Max Instances</div>
          <div className="text-white font-medium">{metrics.scaling.maxInstances}</div>
        </div>

        {metrics.traffic.length > 0 && (
          <>
            <Separator className="bg-slate-800" />
            <div>
              <p className="text-sm font-medium text-white mb-2">Traffic Split</p>
              <div className="space-y-1">
                {metrics.traffic.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-slate-400">{t.revisionName || "latest"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{t.percent}%</span>
                      {t.latestRevision && (
                        <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">latest</Badge>
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
            <Separator className="bg-slate-800" />
            <div>
              <p className="text-sm font-medium text-white mb-2">Service Conditions</p>
              <div className="space-y-1">
                {metrics.conditions.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{c.type}</span>
                    <Badge variant={c.status === "True" ? "success" : "secondary"} className={c.status === "True" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400"}>
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

function AiUsageCard({ tenantId }: { tenantId: string }) {
  const [period, setPeriod] = useState<"30d" | "7d" | "mtd">("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["ai-usage", tenantId, period],
    queryFn: () => apiClient.get<{ daily: any[]; totals: any }>(`/billing/tenants/${tenantId}/ai-usage?period=${period}`),
    refetchInterval: false,
  });

  const totals = data?.totals;
  const daily = data?.daily || [];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Robot className="h-4 w-4 text-goldenYellow-400" />
            AI Usage
          </CardTitle>
          <div className="flex gap-1">
            {(["30d", "7d", "mtd"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {p === "mtd" ? "MTD" : p}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
              <div className="text-slate-400">Requests</div>
              <div className="text-white font-medium">{(totals?.requests || 0).toLocaleString()}</div>
              <div className="text-slate-400">Input Tokens</div>
              <div className="text-white font-medium">{(totals?.inputTokens || 0).toLocaleString()}</div>
              <div className="text-slate-400">Output Tokens</div>
              <div className="text-white font-medium">{(totals?.outputTokens || 0).toLocaleString()}</div>
              <div className="text-slate-400">Est. Cost</div>
              <div className="text-white font-medium">${(totals?.estimatedCostUsd || 0).toFixed(4)}</div>
            </div>
            {daily.length > 0 && (
              <>
                <Separator className="bg-slate-800 mb-3" />
                <p className="text-sm font-medium text-white mb-2">Daily Breakdown</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {daily.map((d: any) => (
                    <div key={d.date} className="flex items-center justify-between text-xs text-slate-300">
                      <span className="text-slate-400">{format(new Date(d.date), "MMM d")}</span>
                      <span>{d.requests} req</span>
                      <span>{(d.totalTokens || 0).toLocaleString()} tok</span>
                      <span className="text-slate-400">${(d.estimatedCostUsd || 0).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {daily.length === 0 && !isLoading && (
              <p className="text-slate-500 text-sm text-center py-4">No AI usage data for this period</p>
            )}
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
        <Spinner className="h-8 w-8 animate-spin text-goldenYellow-500" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-24">
        <p className="text-lg text-white">Tenant not found</p>
        <Button variant="ghost" asChild className="mt-4 text-slate-400 hover:text-white">
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
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <Flask weight="fill" className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-amber-300"><strong>STAGING ENVIRONMENT</strong> — Test changes here before applying to production tenants.</span>
        </div>
      )}

      {/* Live deployment tracker */}
      {showLiveCard && (
        <LiveDeploymentCard
          tenantId={tenantId}
          onDismiss={() => setShowLiveCard(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-white hover:bg-slate-800">
            <Link href="/tenants">
              <CaretLeft weight="bold" className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-goldenYellow-400 to-goldenYellow-600 flex items-center justify-center text-slate-900 font-bold text-xl">
              {tenant.university.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{tenant.university.name}</h1>
              <p className="text-slate-400 font-mono text-sm">{tenant.tenantId}</p>
            </div>
            <StatusBadge status={tenant.status} />
            {!tenant.enabled && <Badge variant="secondary" className="bg-slate-800 text-slate-400">Disabled</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tenant.deployment.serviceUrl && (
            <Button variant="outline" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              <a href={tenant.deployment.serviceUrl} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut className="h-4 w-4 mr-2" />
                Open Service
              </a>
            </Button>
          )}
          {tenant.status === "active" && (
            <>
              <Button variant="outline" onClick={handleRollback} disabled={rollback.isPending} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <ArrowClockwise className={`h-4 w-4 mr-2 ${rollback.isPending ? 'animate-spin' : ''}`} />
                Rollback
              </Button>
              <Button onClick={handleDeploy} disabled={deploy.isPending} className="bg-goldenYellow-500 hover:bg-goldenYellow-600 text-slate-900 font-medium">
                {deploy.isPending ? <Spinner className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                Deploy
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Overview</TabsTrigger>
          <TabsTrigger value="configuration" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Configuration</TabsTrigger>
          <TabsTrigger value="environment" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Environment</TabsTrigger>
          <TabsTrigger value="deployments" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Deployments</TabsTrigger>
          <TabsTrigger value="backups" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Backups</TabsTrigger>
          <TabsTrigger value="domains" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Domains</TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Billing
          </TabsTrigger>
          {isSuperadmin && <TabsTrigger value="secrets" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Secrets</TabsTrigger>}
          {(tenant.status === "provisioning" || provJobId) && (
            <TabsTrigger value="provisioning" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Provisioning</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800">
                <CardTitle className="text-sm font-medium text-slate-400">Status</CardTitle>
                <Waveform className="h-4 w-4 text-goldenYellow-400" />
              </CardHeader>
              <CardContent className="pt-4">
                <StatusBadge status={tenant.status} />
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800">
                <CardTitle className="text-sm font-medium text-slate-400">Health</CardTitle>
                <Heartbeat className="h-4 w-4 text-goldenYellow-400" />
              </CardHeader>
              <CardContent className="pt-4">
                <HealthBadge status={tenant.lastHealthCheck?.status} />
                {tenant.lastHealthCheck?.responseTime && (
                  <p className="text-xs text-slate-500 mt-1">
                    {tenant.lastHealthCheck.responseTime}ms
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800">
                <CardTitle className="text-sm font-medium text-slate-400">Region</CardTitle>
                <Globe className="h-4 w-4 text-goldenYellow-400" />
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-lg font-semibold text-white">{tenant.deployment.region}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800">
                <CardTitle className="text-sm font-medium text-slate-400">Resources</CardTitle>
                <HardDrives className="h-4 w-4 text-goldenYellow-400" />
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-lg font-semibold text-white">
                  {tenant.resources.cpu} CPU / {tenant.resources.memory}
                </p>
                <p className="text-xs text-slate-500">
                  {tenant.scaling.minInstances}-{tenant.scaling.maxInstances} instances
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <Buildings weight="fill" className="h-5 w-5 text-goldenYellow-400" />
                  University Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div className="text-slate-400">Full Name</div>
                  <div className="text-white font-medium">{tenant.university.fullName}</div>
                  <div className="text-slate-400">Code</div>
                  <div className="text-white font-medium">{tenant.university.code}</div>
                  <div className="text-slate-400">Country</div>
                  <div className="text-white font-medium">{tenant.university.country}</div>
                  <div className="text-slate-400">Timezone</div>
                  <div className="text-white font-medium">{tenant.university.timezone}</div>
                  {tenant.deployment.serviceUrl && (
                    <>
                      <div className="text-slate-400">Service URL</div>
                      <div className="font-mono text-xs text-slate-300 break-all">{tenant.deployment.serviceUrl}</div>
                    </>
                  )}
                  {tenant.deployment.activeRevision && (
                    <>
                      <div className="text-slate-400">Active Revision</div>
                      <div className="font-mono text-xs text-slate-300">{tenant.deployment.activeRevision}</div>
                    </>
                  )}
                  <div className="text-slate-400">Created</div>
                  <div className="text-white font-medium">{format(new Date(tenant.createdAt), "PPP")}</div>
                </div>
              </CardContent>
            </Card>

            {tenant.status === "active" && (
              <CloudRunMetricsCard tenantId={tenantId} />
            )}
          </div>

          {/* AI Usage */}
          <AiUsageCard tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="configuration">
          <TenantConfigTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="environment">
          <TenantEnvVarsTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="deployments">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <Rocket weight="fill" className="h-5 w-5 text-goldenYellow-400" />
                Deployment History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {deployments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No deployments yet</p>
              ) : (
                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/50">
                        <th className="h-10 px-4 text-left font-semibold text-slate-300">Date</th>
                        <th className="h-10 px-4 text-left font-semibold text-slate-300">Type</th>
                        <th className="h-10 px-4 text-left font-semibold text-slate-300">Status</th>
                        <th className="h-10 px-4 text-left font-semibold text-slate-300">Revision</th>
                        <th className="h-10 px-4 text-left font-semibold text-slate-300">Triggered By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deployments.map((dep) => (
                        <tr key={dep._id} className="border-b border-slate-800 hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-slate-300">
                            {format(new Date(dep.createdAt), "PPp")}
                          </td>
                          <td className="px-4 py-3 text-slate-300 capitalize">{dep.type}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={dep.status} />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">
                            {dep.revisionName || "\u2014"}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {dep.triggeredBy
                              ? `${dep.triggeredBy.firstName} ${dep.triggeredBy.lastName}`
                              : "\u2014"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
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
