export interface PlatformUser {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "platform_superadmin" | "platform_admin" | "platform_viewer";
  status: "active" | "inactive" | "pending" | "suspended";
  twoFactorEnabled: boolean;
  lastLogin?: string;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: PlatformUser;
  requiresTwoFactor?: boolean;
  requiresTwoFaSetup?: boolean;
  setupToken?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
