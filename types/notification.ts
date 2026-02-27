export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  read: boolean;
  severity: "info" | "warning" | "error";
  createdAt: string;
  updatedAt: string;
}
