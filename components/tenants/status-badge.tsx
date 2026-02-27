import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive" | "info" | "secondary"; label: string }> = {
  active: { variant: "success", label: "Active" },
  provisioning: { variant: "info", label: "Provisioning" },
  inactive: { variant: "secondary", label: "Inactive" },
  error: { variant: "destructive", label: "Error" },
  // Deployment statuses
  pending: { variant: "secondary", label: "Pending" },
  deploying: { variant: "info", label: "Deploying" },
  health_checking: { variant: "info", label: "Health Checking" },
  routing: { variant: "info", label: "Routing Traffic" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "destructive", label: "Failed" },
  rolled_back: { variant: "warning", label: "Rolled Back" },
  // Provisioning job statuses
  in_progress: { variant: "info", label: "In Progress" },
  cancelled: { variant: "secondary", label: "Cancelled" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const healthConfig: Record<string, { variant: "success" | "destructive" | "warning" | "secondary"; label: string }> = {
  healthy: { variant: "success", label: "Healthy" },
  unhealthy: { variant: "destructive", label: "Unhealthy" },
  unreachable: { variant: "warning", label: "Unreachable" },
  not_deployed: { variant: "secondary", label: "Not Deployed" },
};

export function HealthBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  const config = healthConfig[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
