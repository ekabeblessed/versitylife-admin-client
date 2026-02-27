import { apiClient } from "@/lib/api";
import type { AuthResponse } from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function postWithToken<T>(endpoint: string, data: unknown, token: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e: any = new Error(err.message || "Request failed");
    e.status = res.status;
    e.data = err;
    throw e;
  }
  return res.json();
}

export const authApi = {
  login: (email: string, password: string, twoFactorToken?: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/login", {
      email,
      password,
      ...(twoFactorToken && { twoFactorToken }),
    }),

  setup2FA: (setupToken?: string) =>
    setupToken
      ? postWithToken<{ secret: string; qrCode: string }>("/api/v1/auth/setup-2fa", {}, setupToken)
      : apiClient.post<{ secret: string; qrCode: string }>("/api/v1/auth/setup-2fa"),

  enable2FA: (token: string, setupToken?: string) =>
    setupToken
      ? postWithToken<{ message: string }>("/api/v1/auth/enable-2fa", { token }, setupToken)
      : apiClient.post<{ message: string }>("/api/v1/auth/enable-2fa", { token }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<{ message: string; token: string }>("/api/v1/auth/change-password", {
      currentPassword,
      newPassword,
    }),
};
