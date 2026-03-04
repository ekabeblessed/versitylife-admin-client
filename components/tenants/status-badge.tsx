import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive" | "info" | "secondary"; label: string; className: string }> = {
  active: { variant: "success", label: "Active", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  provisioning: { variant: "info", label: "Provisioning", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  inactive: { variant: "secondary", label: "Inactive", className: "bg-slate-700/50 text-slate-400 border-slate-600/50" },
  error: { variant: "destructive", label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  deleted: { variant: "destructive", label: "Deleted", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  // Deployment statuses
  pending: { variant: "secondary", label: "Pending", className: "bg-slate-700/50 text-slate-400 border-slate-600/50" },
  deploying: { variant: "info", label: "Deploying", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  health_checking: { variant: "info", label: "Health Checking", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  routing: { variant: "info", label: "Routing Traffic", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed: { variant: "success", label: "Completed", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  failed: { variant: "destructive", label: "Failed", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  rolled_back: { variant: "warning", label: "Rolled Back", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  // Provisioning job statuses
  in_progress: { variant: "info", label: "In Progress", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  cancelled: { variant: "secondary", label: "Cancelled", className: "bg-slate-700/50 text-slate-400 border-slate-600/50" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { variant: "secondary" as const, label: status, className: "bg-slate-700/50 text-slate-400 border-slate-600/50" };
  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
}

const healthConfig: Record<string, { variant: "success" | "destructive" | "warning" | "secondary"; label: string; className: string }> = {
  healthy: { variant: "success", label: "Healthy", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  unhealthy: { variant: "destructive", label: "Unhealthy", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  unreachable: { variant: "warning", label: "Unreachable", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  not_deployed: { variant: "secondary", label: "Not Deployed", className: "bg-slate-700/50 text-slate-400 border-slate-600/50" },
};

export function HealthBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 border-slate-600/50">Unknown</Badge>;
  const config = healthConfig[status] || { variant: "secondary" as const, label: status, className: "bg-slate-700/50 text-slate-400 border-slate-600/50" };
  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
}
