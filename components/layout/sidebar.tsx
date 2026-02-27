"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2, Users, Settings, LayoutDashboard, X, ScrollText,
  Rocket, HeartPulse, Database, Workflow, CreditCard, Handshake,
} from "lucide-react";

const navItems = [
  { href: "/tenants", label: "Tenants", icon: Building2 },
  { href: "/partners", label: "Partners", icon: Handshake },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/monitoring", label: "Monitoring", icon: HeartPulse },
  { href: "/backups", label: "Backups", icon: Database },
  { href: "/provisioning", label: "Provisioning", icon: Workflow },
  { href: "/users", label: "Users", icon: Users },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/tenants" className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-deepBlue-600" />
            <span className="font-bold text-lg">VersityLife</span>
          </Link>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r shadow-lg">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <Link href="/tenants" className="flex items-center gap-2" onClick={onClose}>
                <LayoutDashboard className="h-6 w-6 text-deepBlue-600" />
                <span className="font-bold text-lg">VersityLife</span>
              </Link>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
