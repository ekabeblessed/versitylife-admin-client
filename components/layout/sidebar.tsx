"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Buildings, Users, Gear, X, Scroll,
  Rocket, Heartbeat, HardDrives, GitBranch, CreditCard, Handshake,
} from "@phosphor-icons/react";

const navGroups = [
  {
    label: "Tenants",
    items: [
      { href: "/tenants", label: "Tenants", icon: Buildings },
      { href: "/partners", label: "Partners", icon: Handshake },
      { href: "/billing", label: "Billing", icon: CreditCard },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { href: "/deployments", label: "Deployments", icon: Rocket },
      { href: "/monitoring", label: "Monitoring", icon: Heartbeat },
      { href: "/backups", label: "Backups", icon: HardDrives },
      { href: "/provisioning", label: "Provisioning", icon: GitBranch },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/audit-logs", label: "Audit Logs", icon: Scroll },
      { href: "/settings", label: "Settings", icon: Gear },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 mb-1 mt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-goldenYellow-500/10 text-goldenYellow-400"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center border-b border-slate-800 px-5 shrink-0">
        <Link href="/tenants" className="flex items-center gap-2.5" onClick={onClose}>
          {!logoError ? (
            <img
              src="/logo.png"
              alt="VersityLife"
              width={28}
              height={28}
              className="rounded-lg object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-goldenYellow-400 to-goldenYellow-600 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">V</span>
            </div>
          )}
          <span className="font-semibold text-base text-white tracking-tight">VersityLife</span>
        </Link>
      </div>
      <NavLinks onNavigate={onClose} />
      <div className="shrink-0 px-4 pb-4 border-t border-slate-800/50 pt-3">
        <p className="text-[10px] text-slate-600">v1.0 · Platform Admin</p>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-slate-900 border-slate-800">
        <SidebarInner />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 shadow-lg flex flex-col">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5 shrink-0">
              <Link href="/tenants" className="flex items-center gap-2.5" onClick={onClose}>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-goldenYellow-400 to-goldenYellow-600 flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-sm">V</span>
                </div>
                <span className="font-semibold text-base text-white tracking-tight">VersityLife</span>
              </Link>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X weight="bold" className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={onClose} />
            <div className="shrink-0 px-4 pb-4 border-t border-slate-800/50 pt-3">
              <p className="text-[10px] text-slate-600">v1.0 · Platform Admin</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
