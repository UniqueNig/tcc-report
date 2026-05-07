"use client";

import { useState, useTransition } from "react";
import {
  X,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
  Building2,
  ClipboardList,
  ShieldCheck,
  BarChart2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type UserRole = "UNIT_HEAD" | "CORE_LEADER" | "ADMIN";

export interface SidebarUser {
  name: string;
  unit?: string;
  units?: string[];
  role: UserRole;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user: SidebarUser;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  UNIT_HEAD: [
    { label: "Dashboard", href: "/dashboard/unit-head", icon: LayoutDashboard },
    { label: "My Reports", href: "/dashboard/unit-head/reports", icon: FileText },
  ],
  CORE_LEADER: [
    { label: "Dashboard", href: "/dashboard/core-leader", icon: LayoutDashboard },
    { label: "Unit Reports", href: "/dashboard/core-leader/reports", icon: ClipboardList },
    { label: "My Units", href: "/dashboard/core-leader/units", icon: Building2 },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "All Reports", href: "/dashboard/admin/reports", icon: ClipboardList },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart2 },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
    { label: "Units", href: "/dashboard/admin/units", icon: Building2 },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  UNIT_HEAD: "Unit Head",
  CORE_LEADER: "Core Leader",
  ADMIN: "Pastorate",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({ open, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const navItems = NAV_ITEMS[user.role];
  const roleLabel = ROLE_LABELS[user.role];
  const assignedUnits = user.units?.length ? user.units : user.unit ? [user.unit] : [];
  const footerDetail =
    user.role === "UNIT_HEAD" && assignedUnits.length > 1
      ? `${assignedUnits.length} assigned units`
      : assignedUnits[0] ?? roleLabel;

  function isActive(href: string) {
    if (href === `/dashboard/${user.role.toLowerCase().replace("_", "-")}`) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleLogout() {
    setLogoutError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Logout failed");
        }

        router.replace("/login");
        router.refresh();
      } catch {
        setLogoutError("Could not sign you out. Please try again.");
      }
    });
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 w-60
          bg-white dark:bg-neutral-900
          border-r border-stone-200 dark:border-neutral-800
          flex flex-col transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Image
              src="/tcc-logo.png"
              alt="The Communion Centre"
              width={128}
              height={128}
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
              priority
            />
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-stone-900 dark:text-white">
                TCC Reports
              </span>
              <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                The Communion Centre
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-stone-100 dark:border-neutral-800 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400">
            {user.role === "ADMIN" && <ShieldCheck size={11} />}
            {user.role === "CORE_LEADER" && <Users size={11} />}
            {user.role === "UNIT_HEAD" && <FileText size={11} />}
            {roleLabel}
          </span>
          {user.role === "UNIT_HEAD" && assignedUnits.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-neutral-500">
                Assigned Units
              </p>
              <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
                {assignedUnits.map((unit) => (
                  <div
                    key={unit}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-stone-600 dark:text-neutral-400"
                  >
                    <Building2 size={12} className="shrink-0 text-stone-400 dark:text-neutral-500" />
                    <span className="truncate">{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-2">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${
                    active
                      ? "bg-stone-100 dark:bg-neutral-800 text-stone-900 dark:text-white"
                      : "text-stone-500 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800/60 hover:text-stone-900 dark:hover:text-white"
                  }
                `}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-stone-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-stone-700 dark:text-stone-300 shrink-0 select-none">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-stone-400 dark:text-neutral-500 truncate">
                {footerDetail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="text-stone-400 hover:text-red-500 disabled:opacity-50 dark:hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
          {logoutError && (
            <p className="mt-2 px-2 text-[11px] text-red-500 dark:text-red-400">
              {logoutError}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
