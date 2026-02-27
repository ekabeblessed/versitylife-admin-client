"use client";

import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";

const severityColors: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

const resourceRoutes: Record<string, (id: string) => string> = {
  tenant: (id) => `/tenants/${id}`,
  deployment: (id) => `/deployments`,
};

export function NotificationBell() {
  const router = useRouter();
  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData } = useNotifications({ limit: 10 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const count = unreadData?.count ?? 0;
  const notifications = notificationsData?.notifications ?? [];

  const handleClick = (notification: (typeof notifications)[0]) => {
    if (!notification.read) {
      markRead.mutate(notification._id);
    }
    if (notification.resourceType && notification.resourceId) {
      const routeFn = resourceRoutes[notification.resourceType];
      if (routeFn) {
        router.push(routeFn(notification.resourceId));
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                !notification.read ? "bg-muted/50" : ""
              }`}
              onClick={() => handleClick(notification)}
            >
              <div className="flex w-full items-start gap-2">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    severityColors[notification.severity] || "bg-gray-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <Check className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
