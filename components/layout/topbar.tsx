"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser, useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOut, User, List, CaretRight } from "@phosphor-icons/react";
import { NotificationBell } from "@/components/layout/notification-bell";

const pageNames: Record<string, string> = {
  "/tenants": "Tenants",
  "/partners": "Partners",
  "/billing": "Billing",
  "/deployments": "Deployments",
  "/monitoring": "Monitoring",
  "/backups": "Backups",
  "/provisioning": "Provisioning",
  "/users": "Users",
  "/audit-logs": "Audit Logs",
  "/settings": "Settings",
};

function PageTitle() {
  const pathname = usePathname();

  // Check exact match first
  if (pageNames[pathname]) {
    return <h2 className="text-sm font-semibold text-white">{pageNames[pathname]}</h2>;
  }

  // Check nested routes (e.g. /tenants/kebhips)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const rootPath = `/${segments[0]}`;
    const rootName = pageNames[rootPath];
    if (rootName) {
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-400 font-medium">{rootName}</span>
          <CaretRight className="h-3.5 w-3.5 text-slate-600" weight="bold" />
          <span className="text-white font-semibold">{segments[1]}</span>
        </div>
      );
    }
  }

  // Fallback
  const rootPath = `/${segments[0]}`;
  if (pageNames[rootPath]) {
    return <h2 className="text-sm font-semibold text-white">{pageNames[rootPath]}</h2>;
  }

  return <h2 className="text-sm font-semibold text-white">Platform Admin</h2>;
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const user = useCurrentUser();

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 px-6 bg-slate-900">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800" onClick={onMenuClick}>
          <List weight="bold" className="h-5 w-5" />
        </Button>
        <PageTitle />
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="w-px h-5 bg-slate-700" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-slate-800 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-goldenYellow-400 to-goldenYellow-600 text-slate-900 text-sm font-semibold hover:ring-2 hover:ring-goldenYellow-500/50 transition-all">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <span className="hidden sm:inline text-sm text-slate-200 font-medium">
                {user?.firstName} {user?.lastName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role?.replace(/_/g, " ")}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={() => router.push("/settings")} className="text-slate-200 focus:bg-slate-800 focus:text-white">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:bg-red-900/20 focus:text-red-400">
              <SignOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
