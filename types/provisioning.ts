export interface ProvisioningStep {
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  error?: string;
  details?: Record<string, unknown>;
  retryCount: number;
}

export interface ProvisioningJob {
  _id: string;
  tenantId: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  steps: ProvisioningStep[];
  input: Record<string, unknown>;
  triggeredBy?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
