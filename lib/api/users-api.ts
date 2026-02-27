import { apiClient } from "@/lib/api";
import type { PlatformUser, Pagination } from "@/types/user";

interface UsersResponse {
  users: PlatformUser[];
  pagination: Pagination;
}

export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return apiClient.get<UsersResponse>(`/api/v1/users${qs ? `?${qs}` : ""}`);
  },

  create: (data: { email: string; username: string; password: string; firstName: string; lastName: string; role: string }) =>
    apiClient.post<{ user: PlatformUser }>("/api/v1/users", data),

  update: (userId: string, data: Partial<PlatformUser>) =>
    apiClient.put<{ user: PlatformUser }>(`/api/v1/users/${userId}`, data),

  getMe: () =>
    apiClient.get<{ user: PlatformUser }>("/api/v1/users/me"),

  getActivity: () =>
    apiClient.get<{ users: PlatformUser[] }>("/api/v1/users/activity"),

  forceLogout: (userId: string) =>
    apiClient.post<{ message: string }>(`/api/v1/users/${userId}/force-logout`),
};
