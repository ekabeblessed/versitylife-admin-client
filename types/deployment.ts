export interface Deployment {
  _id: string;
  tenantId: string;
  type: "initial" | "update" | "rollback" | "config_change";
  status: "pending" | "deploying" | "health_checking" | "routing" | "completed" | "failed" | "rolled_back";
  revisionName?: string;
  previousRevision?: string;
  imageTag?: string;
  timing: {
    startedAt?: string;
    deployedAt?: string;
    healthyAt?: string;
    completedAt?: string;
  };
  healthCheck?: {
    passed: boolean;
    attempts: number;
    responseTime?: number;
  };
  changes?: Record<string, unknown>;
  error?: {
    message: string;
    step: string;
    details?: Record<string, unknown>;
  };
  triggeredBy?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}
