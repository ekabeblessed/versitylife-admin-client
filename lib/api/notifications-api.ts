import { apiClient } from "@/lib/api";
import type { Notification } from "@/types/notification";
import type { Pagination } from "@/types/user";

interface NotificationsResponse {
  notifications: Notification[];
  pagination: Pagination;
}

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient.get<NotificationsResponse>(
      `/api/v1/notifications${qs ? `?${qs}` : ""}`
    );
  },

  getUnreadCount: () =>
    apiClient.get<{ count: number }>("/api/v1/notifications/unread-count"),

  markRead: (id: string) =>
    apiClient.patch<{ notification: Notification }>(
      `/api/v1/notifications/${id}/read`
    ),

  markAllRead: () =>
    apiClient.patch<{ message: string }>("/api/v1/notifications/read-all"),
};
