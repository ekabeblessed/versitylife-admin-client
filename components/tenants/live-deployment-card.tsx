"use client";

import { useEffect, useRef, useState } from "react";
import { useDeployments } from "@/hooks/use-deployments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Rocket,
  Activity,
  RotateCcw,
  X,
  Clock,
} from "lucide-react";
import type { Deployment } from "@/types/deployment";

const ACTIVE_STATUSES = ["pending", "deploying", "health_checking", "routing"] as const;
type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

interface Step {
  key: string;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { key: "deploying",       label: "Deploy",   description: "Building & pushing to Cloud Run" },
  { key: "health_checking", label: "Health",   description: "Checking service health" },
  { key: "routing",         label: "Route",    description: "Routing traffic to new revision" },
  { key: "completed",       label: "Done",     description: "Deployment complete" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "pending":
    case "deploying":       return 0;
    case "health_checking": return 1;
    case "routing":         return 2;
    case "completed":       return 3;
    default:                return -1; // failed / rolled_back
  }
}

function useTicker(startedAt?: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const base = Date.now() - new Date(startedAt).getTime();
    setElapsed(base);
    const id = setInterval(() => {
      setElapsed(Date.now() - new Date(startedAt).getTime());
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

interface LiveDeploymentCardProps {
  tenantId: string;
  onDismiss: () => void;
}

export function LiveDeploymentCard({ tenantId, onDismiss }: LiveDeploymentCardProps) {
  const [autoDismissing, setAutoDismissing] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Poll the latest deployment every 2 seconds
  const { data } = useDeployments({
    tenantId,
    limit: 1,
    refetchInterval: 2000,
  });

  const deployment: Deployment | undefined = data?.deployments?.[0];
  const status = deployment?.status ?? "deploying";
  const isActive = ACTIVE_STATUSES.includes(status as ActiveStatus);
  const isFailed = status === "failed" || status === "rolled_back";
  const isDone = status === "completed";

  const elapsed = useTicker(isActive ? (deployment?.timing.startedAt ?? undefined) : undefined);

  // Auto-dismiss 6 seconds after completion
  useEffect(() => {
    if (isDone && !dismissTimerRef.current) {
      setAutoDismissing(true);
      dismissTimerRef.current = setTimeout(() => {
        onDismiss();
      }, 6000);
    }
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [isDone, onDismiss]);

  if (!deployment) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="py-4 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-800 dark:text-blue-300">Initiating deployment…</span>
        </CardContent>
      </Card>
    );
  }

  const currentStepIndex = getStepIndex(status);

  const borderColor = isFailed
    ? "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
    : isDone
    ? "border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
    : "border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800";

  const totalDuration = (() => {
    const start = deployment.timing.startedAt;
    const end = deployment.timing.completedAt || deployment.updatedAt;
    if (!start || !end) return null;
    return new Date(end).getTime() - new Date(start).getTime();
  })();

  return (
    <Card className={`${borderColor} transition-all`}>
      <CardContent className="py-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isFailed ? (
              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
            ) : isDone ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {isFailed
                  ? "Deployment failed"
                  : isDone
                  ? "Deployment completed"
                  : "Deployment in progress…"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {deployment.type.replace("_", " ")} · triggered by{" "}
                {deployment.triggeredBy
                  ? `${deployment.triggeredBy.firstName} ${deployment.triggeredBy.lastName}`
                  : "system"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isActive && (
              <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
                <Clock className="h-3 w-3" />
                {formatMs(elapsed)}
              </div>
            )}
            {!isActive && totalDuration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatMs(totalDuration)}
              </div>
            )}
            {autoDismissing && (
              <span className="text-xs text-muted-foreground">Closing…</span>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const done = currentStepIndex > i || isDone;
            const current = currentStepIndex === i && !isDone && !isFailed;
            const failed = isFailed && currentStepIndex === i;
            const upcoming = currentStepIndex < i && !isDone;

            return (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                {/* Node */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      failed
                        ? "bg-red-500"
                        : done
                        ? "bg-green-500"
                        : current
                        ? "bg-blue-500 ring-2 ring-blue-300 ring-offset-1"
                        : "bg-muted border border-border"
                    }`}
                  >
                    {failed ? (
                      <XCircle className="h-4 w-4 text-white" />
                    ) : done ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : current ? (
                      <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium whitespace-nowrap ${
                      failed
                        ? "text-red-600"
                        : done
                        ? "text-green-600"
                        : current
                        ? "text-blue-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector (not after last step) */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 mx-1 transition-all ${
                      currentStepIndex > i || isDone ? "bg-green-400" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Status description */}
        <div className="text-xs text-muted-foreground">
          {isFailed && deployment.error ? (
            <div className="rounded-md border border-red-200 bg-red-100 dark:bg-red-950/30 px-3 py-2 text-red-700 dark:text-red-400">
              <span className="font-medium">Error at step &quot;{deployment.error.step}&quot;:</span>{" "}
              {deployment.error.message}
            </div>
          ) : isDone ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {deployment.revisionName && (
                <span>
                  Revision:{" "}
                  <code className="font-mono text-[11px]">{deployment.revisionName}</code>
                </span>
              )}
              {deployment.healthCheck && (
                <span>
                  Health: {deployment.healthCheck.passed ? "passed" : "failed"} in{" "}
                  {deployment.healthCheck.attempts} attempt
                  {deployment.healthCheck.attempts !== 1 ? "s" : ""}
                  {deployment.healthCheck.responseTime
                    ? ` · ${deployment.healthCheck.responseTime}ms`
                    : ""}
                </span>
              )}
            </div>
          ) : (
            <span>
              {STEPS.find((s) => s.key === status)?.description ??
                `Status: ${status}`}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
