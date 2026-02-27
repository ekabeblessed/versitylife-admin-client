export interface Tenant {
  _id: string;
  tenantId: string;
  serviceName?: string;
  enabled: boolean;
  isStaging?: boolean;
  status: "provisioning" | "active" | "inactive" | "error";
  university: {
    name: string;
    fullName: string;
    code: string;
    country: string;
    timezone: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  deployment: {
    region: string;
    serviceUrl?: string;
    activeRevision?: string;
  };
  resources: {
    cpu: string;
    memory: string;
  };
  scaling: {
    minInstances: number;
    maxInstances: number;
  };
  environment?: Record<string, string>;
  secrets?: Record<string, string>;
  cronJobs: {
    enabled: boolean;
    backup?: {
      schedule: string;
      enabled: boolean;
    };
  };
  initialAdmin?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  lastHealthCheck?: {
    status: string;
    checkedAt: string;
    responseTime: number;
  };
  provisioningJobId?: string;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

export interface SecretKey {
  key: string;
  masked: string;
  revealed?: string;
}

export interface SecretsResponse {
  keys: SecretKey[];
  version: number | null;
}

export interface BackupStatusResponse {
  lastBackupAt: string | null;
  lastBackupFile: string | null;
  schedulerStatus: string | null;
  nextRun: string | null;
  healthy: boolean;
}

export type SubscriptionStatus = "active" | "expiring_soon" | "expired" | "trial" | "trial_expiring" | "trial_expired" | "not_set";

export interface BillingAlert {
  type: string;
  sentAt: string;
}

export interface Subscription {
  plan: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "annual" | "free_trial";
  trialDays?: number | null;
  startDate?: string;
  endDate?: string;
  notes: string;
  status: SubscriptionStatus;
  daysLeft?: number | null;
  billingAlerts?: BillingAlert[];
}

export interface BillingOverviewItem {
  tenantId: string;
  universityName: string;
  isStaging: boolean;
  enabled: boolean;
  subscription: Subscription;
}

export interface HealthSummaryItem {
  tenantId: string;
  universityName: string;
  currentStatus: string;
  lastCheckedAt: string | null;
  uptimePercent: number | null;
  avgResponseTime: number | null;
  checksCount: number;
}

export interface HealthHistoryItem {
  _id: string;
  tenantId: string;
  status: "healthy" | "unhealthy" | "unreachable";
  responseTime: number;
  checkedAt: string;
  error?: string;
}

export interface ServiceMetrics {
  resources: {
    cpu: string;
    memory: string;
  };
  scaling: {
    minInstances: number;
    maxInstances: number;
  };
  traffic: Array<{
    revisionName: string;
    percent: number;
    latestRevision: boolean;
  }>;
  conditions: Array<{
    type: string;
    status: string;
    reason?: string;
    message?: string;
    lastTransitionTime?: string;
  }>;
}

export interface DiscoveredService {
  serviceName: string;
  serviceUrl: string;
  region: string;
  latestRevision: string;
  createdAt: string;
}

export interface ImportTenantInput {
  tenantId: string;
  serviceName: string;
  university: {
    name: string;
    fullName: string;
    code: string;
    country: string;
    timezone?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  deployment?: { region?: string };
  resources?: { cpu?: string; memory?: string };
  scaling?: { minInstances?: number; maxInstances?: number };
  environment?: Record<string, string>;
  cronJobs?: { enabled?: boolean; backup?: { schedule?: string; enabled?: boolean } };
}

export interface LiveEnvVarsResponse {
  envVars: Record<string, string>;
  storedEnv: Record<string, string>;
}

export type EnvVarCategory =
  | "core"
  | "institution"
  | "locale"
  | "frontend"
  | "jwt"
  | "security"
  | "storage"
  | "email"
  | "payment"
  | "upload"
  | "logging"
  | "audit"
  | "cache"
  | "other";

export interface CategorizedEnvVar {
  key: string;
  value: string;
  storedValue?: string;
  category: EnvVarCategory;
  isDifferent: boolean;
}

export interface CreateTenantInput {
  tenantId: string;
  university: {
    name: string;
    fullName: string;
    code: string;
    country: string;
    timezone: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  deployment?: {
    region: string;
  };
  resources?: {
    cpu: string;
    memory: string;
  };
  scaling?: {
    minInstances: number;
    maxInstances: number;
  };
  secrets: {
    MONGODB_URL: string;
    SES_FROM_EMAIL?: string;
    SES_FROM_NAME?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_BUCKET_NAME?: string;
    PAYUNIT_API_KEY?: string;
    PAYUNIT_API_SECRET?: string;
    PAYUNIT_API_URL?: string;
    PAYUNIT_RETURN_URL?: string;
    PAYUNIT_NOTIFY_URL?: string;
  };
  environment?: Record<string, string>;
  cronJobs?: {
    enabled: boolean;
    backup?: {
      schedule: string;
      enabled: boolean;
    };
  };
  initialAdmin: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
  };
}
