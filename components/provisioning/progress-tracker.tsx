"use client";

import { useProvisioningJob, useRetryProvisioningJob } from "@/hooks/use-provisioning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Loader2, Circle, RotateCcw, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<string, string> = {
  validate_config: "Validate Configuration",
  create_database: "Create Database",
  create_secrets: "Create Secrets",
  deploy_service: "Deploy Service",
  health_check: "Health Check",
  setup_cron_jobs: "Setup Cron Jobs",
  finalize_tenant: "Finalize Tenant",
  send_welcome_email: "Send Welcome Email",
};

const stepStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "in_progress":
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "skipped":
      return <Circle className="h-5 w-5 text-gray-300" />;
    default:
      return <Circle className="h-5 w-5 text-gray-300" />;
  }
};

export function ProvisioningProgress({ jobId }: { jobId: string }) {
  const { data, isLoading } = useProvisioningJob(jobId, true);
  const retryMutation = useRetryProvisioningJob();

  const job = data?.job;

  if (!jobId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No provisioning job found.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!job) return null;

  const completedCount = job.steps.filter((s) => s.status === "completed").length;
  const progress = Math.round((completedCount / job.steps.length) * 100);

  const handleRetry = async () => {
    try {
      await retryMutation.mutateAsync(jobId);
      toast.success("Retry initiated");
    } catch (err: any) {
      toast.error("Retry failed", { description: err.data?.message || err.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Provisioning Progress</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {completedCount}/{job.steps.length} steps completed ({progress}%)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              job.status === "completed"
                ? "success"
                : job.status === "failed"
                ? "destructive"
                : job.status === "in_progress"
                ? "info"
                : "secondary"
            }
          >
            {job.status.replace(/_/g, " ")}
          </Badge>
          {job.status === "failed" && (
            <Button size="sm" variant="outline" onClick={handleRetry} disabled={retryMutation.isPending}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {job.steps.map((step, index) => (
            <div key={step.name} className="flex items-start gap-4 py-3">
              <div className="flex flex-col items-center">
                {stepStatusIcon(step.status)}
                {index < job.steps.length - 1 && (
                  <div
                    className={cn(
                      "w-px h-8 mt-1",
                      step.status === "completed" ? "bg-green-300" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {STEP_LABELS[step.name] || step.name}
                  </p>
                  {step.completedAt && step.startedAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(
                        (new Date(step.completedAt).getTime() -
                          new Date(step.startedAt).getTime()) /
                          1000
                      )}s
                    </span>
                  )}
                </div>
                {step.error && (
                  <p className="text-xs text-red-500 mt-1">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
