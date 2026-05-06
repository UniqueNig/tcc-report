"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Menu, Sun, Moon, Bell, FileText,
  CheckCircle2, MessageSquare, X, Check,
} from "lucide-react";
import type { SidebarUser } from "@/src/components/Sidebar";

// ── Types ──────────────────────────────────────────────
type NotificationType = "report_submitted" | "report_reviewed" | "comment_added";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href: string;
}

// ── Mock notifications (replace with real API / websocket) ─
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1", type: "report_submitted", read: false,
    title: "New report submitted",
    body: "Adeola Obi submitted a report for Music Unit.",
    time: "2 min ago", href: "/dashboard/core-leader/reports/1",
  },
  {
    id: "n2", type: "comment_added", read: false,
    title: "Comment on your report",
    body: "Br. Oluwole left feedback on Sunday Service — May 4.",
    time: "18 min ago", href: "/dashboard/unit-head/reports/1",
  },
  {
    id: "n3", type: "report_submitted", read: false,
    title: "New report submitted",
    body: "Tunde Fadeyi submitted a report for Ushering Unit.",
    time: "1 hr ago", href: "/dashboard/core-leader/reports/3",
  },
  {
    id: "n4", type: "report_reviewed", read: true,
    title: "Report reviewed",
    body: "Br. Oluwole marked Midweek — Apr 30 as reviewed.",
    time: "3 hrs ago", href: "/dashboard/unit-head/reports/4",
  },
  {
    id: "n5", type: "comment_added", read: true,
    title: "Comment on your report",
    body: "Pastor Adewale left a note on Good Friday Service.",
    time: "Yesterday", href: "/dashboard/unit-head/reports/8",
  },
];

// ── Notification icon per type ─────────────────────────
function NotifIcon({ type }: { type: NotificationType }) {
  if (type === "report_submitted") return (
    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
      <FileText size={14} className="text-stone-500 dark:text-neutral-400" />
    </div>
  );
  if (type === "report_reviewed") return (
    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
      <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
      <MessageSquare size={14} className="text-amber-600 dark:text-amber-400" />
    </div>
  );
}

// ── Props ──────────────────────────────────────────────
interface TopbarProps {
  onMenuClick: () => void;
  user: Pick<SidebarUser, "name">;
  notificationCount?: number; // kept for API compat — unread count now derived internally
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
    return () => {};
  }

  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}

function getThemeSnapshot() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

function getServerThemeSnapshot() {
  return false;
}

// ── Component ──────────────────────────────────────────
export default function Topbar({ onMenuClick, user }: TopbarProps) {
  const isDark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === "Escape") setNotifOpen(false); }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function markAsRead(id: string) {
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setNotifications((p) => p.filter((n) => n.id !== id));
  }

  function handleNotifClick(notif: Notification) {
    markAsRead(notif.id);
    setNotifOpen(false);
    // router.push(notif.href) — wire with useRouter when ready
  }

  return (
    <header className="h-12 shrink-0 bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6 relative z-10">

      {/* Left — hamburger (mobile only) */}
      <button onClick={onMenuClick}
        className="lg:hidden text-stone-500 hover:text-stone-700 dark:text-neutral-400 dark:hover:text-white transition-colors"
        aria-label="Open menu">
        <Menu size={18} />
      </button>
      <div className="hidden lg:block" />

      {/* Right */}
      <div className="flex items-center gap-1">

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 dark:text-neutral-500 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Bell */}
        <div className="relative">
          <button ref={bellRef} onClick={() => setNotifOpen((o) => !o)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 dark:text-neutral-500 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors"
            aria-label="Notifications">
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div ref={dropdownRef}
              className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/40 overflow-hidden fade-up">

              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors">
                    <Check size={11} />Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                      <Bell size={16} className="text-stone-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">All caught up!</p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">No notifications right now</p>
                  </div>
                ) : notifications.map((notif) => (
                  <div key={notif.id} onClick={() => handleNotifClick(notif)}
                    className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-stone-50 dark:border-neutral-800/60 last:border-none
                      ${notif.read
                        ? "hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                        : "bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      }`}>

                    {/* Unread indicator */}
                    {!notif.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    )}

                    <NotifIcon type={notif.type} />

                    <div className="flex-1 min-w-0 pr-5">
                      <p className={`text-xs font-semibold leading-snug mb-0.5
                        ${notif.read ? "text-stone-700 dark:text-neutral-300" : "text-stone-900 dark:text-white"}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-stone-400 dark:text-neutral-500 mt-1.5 font-medium">
                        {notif.time}
                      </p>
                    </div>

                    {/* Dismiss button — appears on hover */}
                    <button onClick={(e) => dismiss(notif.id, e)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-md text-stone-400 dark:text-neutral-500 hover:bg-stone-200 dark:hover:bg-neutral-700 hover:text-stone-600 dark:hover:text-neutral-300 transition-all">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-stone-100 dark:border-neutral-800">
                  <button onClick={() => { setNotifications([]); setNotifOpen(false); }}
                    className="w-full text-xs text-center text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors">
                    Clear all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-stone-200 dark:bg-neutral-700 mx-1" />

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-stone-700 dark:text-stone-300 select-none" title={user.name}>
          {getInitials(user.name)}
        </div>
      </div>
    </header>
  );
}
