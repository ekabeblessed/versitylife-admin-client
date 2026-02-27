export interface AuditLog {
  _id: string;
  userId?: { _id: string; email: string; firstName: string; lastName: string };
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
}
