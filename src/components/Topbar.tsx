"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  X,
} from "lucide-react";
import type { SidebarUser } from "@/src/components/Sidebar";
import { TOPBAR_NOTIFICATIONS_QUERY } from "@/src/lib/graphqlDocuments";
import type { GraphQLReport, GraphQLUser } from "@/src/lib/dashboardHelpers";

type NotificationType = "report_submitted" | "report_reviewed" | "comment_added";

interface TopbarNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  href: string;
}

interface TopbarProps {
  onMenuClick: () => void;
  user: Pick<SidebarUser, "name">;
  notificationCount?: number;
}

const READ_STORAGE_KEY = "tcc-report:read-notifications";
const DISMISSED_STORAGE_KEY = "tcc-report:dismissed-notifications";
const THEME_STORAGE_KEY = "theme";
const STORAGE_SYNC_EVENT = "tcc-report:storage-sync";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function persistStoredIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(ids.slice(-200)));
  window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
}

function persistTheme(nextIsDark: boolean) {
  if (typeof document === "undefined" || typeof localStorage === "undefined") return;

  const theme = nextIsDark ? "dark" : "light";
  document.documentElement.classList.toggle("dark", nextIsDark);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}

function getReportHref(role: GraphQLUser["role"], reportId: string) {
  if (role === "ADMIN") return `/dashboard/admin/reports/${reportId}`;
  if (role === "CORE_LEADER") return `/dashboard/core-leader/reports/${reportId}`;
  return `/dashboard/unit-head/reports/${reportId}`;
}

function formatRelativeTime(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return "Just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
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

function subscribeStoredIds(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handle = () => onStoreChange();
  window.addEventListener("storage", handle);
  window.addEventListener(STORAGE_SYNC_EVENT, handle);

  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener(STORAGE_SYNC_EVENT, handle);
  };
}

function getStoredIdsSnapshot(key: string) {
  if (typeof window === "undefined") {
    return "[]";
  }

  return localStorage.getItem(key) ?? "[]";
}

function parseStoredIdsSnapshot(snapshot: string) {
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function buildNotifications(
  me: GraphQLUser | null | undefined,
  reports: GraphQLReport[],
  readIds: Set<string>,
  dismissedIds: Set<string>
): TopbarNotification[] {
  if (!me) return [];

  const notifications: TopbarNotification[] = [];

  for (const report of reports) {
    const href = getReportHref(me.role, report.id);

    if ((me.role === "ADMIN" || me.role === "CORE_LEADER") && report.status === "pending") {
      const id = `report-submitted:${report.id}`;
      notifications.push({
        id,
        type: "report_submitted",
        title: "Report awaiting review",
        body: `${report.submittedByUser?.name ?? "A unit head"} submitted ${report.title} for ${report.unit?.name ?? "a unit"}.`,
        timestamp: report.createdAt,
        read: readIds.has(id),
        href,
      });
    }

    if (me.role === "UNIT_HEAD" && report.reviewedAt) {
      const id = `report-reviewed:${report.id}:${report.reviewedAt}`;
      notifications.push({
        id,
        type: "report_reviewed",
        title: "Report reviewed",
        body: `${report.reviewedByUser?.name ?? "A leader"} reviewed ${report.title}.`,
        timestamp: report.reviewedAt,
        read: readIds.has(id),
        href,
      });
    }

    if (me.role === "UNIT_HEAD") {
      for (const comment of report.comments ?? []) {
        const id = `comment:${comment.id}`;
        notifications.push({
          id,
          type: "comment_added",
          title: "New comment",
          body: `${comment.authorUser?.name ?? "A leader"} commented on ${report.title}.`,
          timestamp: comment.createdAt,
          read: readIds.has(id),
          href,
        });
      }
    }
  }

  return notifications
    .filter((notification) => !dismissedIds.has(notification.id))
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 12);
}

function NotifIcon({ type }: { type: NotificationType }) {
  if (type === "report_reviewed") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }

  if (type === "comment_added") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
        <MessageSquare size={14} className="text-amber-600 dark:text-amber-400" />
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
      <FileText size={14} className="text-stone-500 dark:text-neutral-400" />
    </div>
  );
}

export default function Topbar({ onMenuClick, user }: TopbarProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isDark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const readIdsSnapshot = useSyncExternalStore(
    subscribeStoredIds,
    () => getStoredIdsSnapshot(READ_STORAGE_KEY),
    () => "[]"
  );
  const dismissedIdsSnapshot = useSyncExternalStore(
    subscribeStoredIds,
    () => getStoredIdsSnapshot(DISMISSED_STORAGE_KEY),
    () => "[]"
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const { data, loading } = useQuery<{
    me: GraphQLUser | null;
    reports: GraphQLReport[];
  }>(TOPBAR_NOTIFICATIONS_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: !mounted,
  });
  const notificationData = mounted ? data : undefined;

  const readIds = useMemo(() => parseStoredIdsSnapshot(readIdsSnapshot), [readIdsSnapshot]);
  const dismissedIds = useMemo(
    () => parseStoredIdsSnapshot(dismissedIdsSnapshot),
    [dismissedIdsSnapshot]
  );
  const readIdSet = useMemo(() => new Set(readIds), [readIds]);
  const dismissedIdSet = useMemo(() => new Set(dismissedIds), [dismissedIds]);
  const notifications = useMemo(
    () =>
      buildNotifications(
        notificationData?.me,
        notificationData?.reports ?? [],
        readIdSet,
        dismissedIdSet
      ),
    [notificationData?.me, notificationData?.reports, dismissedIdSet, readIdSet]
  );

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      persistTheme(storedTheme === "dark");
    } else {
      persistTheme(root.classList.contains("dark"));
    }
  }, []);

  useEffect(() => {
    function handle(event: globalThis.MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    function handle(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setNotifOpen(false);
    }

    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  function toggleTheme() {
    persistTheme(!isDark);
  }

  function storeReadIds(ids: string[]) {
    const next = Array.from(new Set(ids));
    persistStoredIds(READ_STORAGE_KEY, next);
  }

  function storeDismissedIds(ids: string[]) {
    const next = Array.from(new Set(ids));
    persistStoredIds(DISMISSED_STORAGE_KEY, next);
  }

  function markAsRead(id: string) {
    storeReadIds([...readIds, id]);
  }

  function markAllRead() {
    storeReadIds([...readIds, ...notifications.map((notification) => notification.id)]);
  }

  function dismiss(id: string, event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    storeDismissedIds([...dismissedIds, id]);
  }

  function clearAllNotifications() {
    storeDismissedIds([...dismissedIds, ...notifications.map((notification) => notification.id)]);
    setNotifOpen(false);
  }

  function handleNotificationClick(notification: TopbarNotification) {
    markAsRead(notification.id);
    setNotifOpen(false);
    router.push(notification.href);
  }

  function handleNotificationKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    notification: TopbarNotification
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNotificationClick(notification);
    }
  }

  return (
    <header className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900 lg:px-6">
      <button
        onClick={onMenuClick}
        className="text-stone-500 transition-colors hover:text-stone-700 dark:text-neutral-400 dark:hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="relative">
          <button
            ref={bellRef}
            onClick={() => setNotifOpen((open) => !open)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              ref={dropdownRef}
              className="fade-up absolute right-0 top-[calc(100%+8px)] w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-black/10 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40"
            >
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-xs text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                  >
                    <Check size={11} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-stone-500 dark:text-neutral-400">
                    <Loader2 size={15} className="animate-spin" />
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                      <Bell size={16} className="text-stone-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">
                      All caught up
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                      No report notifications right now
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNotificationClick(notification)}
                      onKeyDown={(event) => handleNotificationKeyDown(event, notification)}
                      className={`group relative flex cursor-pointer items-start gap-3 border-b border-stone-50 px-4 py-3.5 transition-colors last:border-none dark:border-neutral-800/60 ${
                        notification.read
                          ? "hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                          : "bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                      }`}
                    >
                      {!notification.read && (
                        <div className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-500" />
                      )}

                      <NotifIcon type={notification.type} />

                      <div className="min-w-0 flex-1 pr-5">
                        <p
                          className={`mb-0.5 text-xs font-semibold leading-snug ${
                            notification.read
                              ? "text-stone-700 dark:text-neutral-300"
                              : "text-stone-900 dark:text-white"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="line-clamp-2 text-xs leading-relaxed text-stone-500 dark:text-neutral-400">
                          {notification.body}
                        </p>
                        <p className="mt-1.5 text-[10px] font-medium text-stone-400 dark:text-neutral-500">
                          {formatRelativeTime(notification.timestamp)}
                        </p>
                      </div>

                      <button
                        onClick={(event) => dismiss(notification.id, event)}
                        className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md text-stone-400 opacity-0 transition-all hover:bg-stone-200 hover:text-stone-600 group-hover:opacity-100 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                        aria-label="Dismiss notification"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-stone-100 px-4 py-3 dark:border-neutral-800">
                  <button
                    onClick={clearAllNotifications}
                    className="w-full text-center text-xs text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-1 h-4 w-px bg-stone-200 dark:bg-neutral-700" />

        <div
          className="flex h-7 w-7 select-none items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700 dark:bg-neutral-700 dark:text-stone-300"
          title={user.name}
        >
          {getInitials(user.name)}
        </div>
      </div>
    </header>
  );
}
