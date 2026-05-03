"use client";

import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import type { SidebarUser } from "@/src/components/Sidebar";

interface TopbarProps {
  onMenuClick: () => void;
  user: Pick<SidebarUser, "name">;
  notificationCount?: number; // pass 0 to hide the dot
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Topbar({
  onMenuClick,
  user,
  notificationCount = 0,
}: TopbarProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync with localStorage + system preference on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <header className="h-12 shrink-0 bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6">

      {/* Left — mobile hamburger only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-stone-500 hover:text-stone-700 dark:text-neutral-400 dark:hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Desktop spacer */}
      <div className="hidden lg:block" />

      {/* Right actions */}
      <div className="flex items-center gap-1">

        {/* Dark / light toggle — only render after mount to avoid hydration mismatch */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 dark:text-neutral-500 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}

        {/* Notifications */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 dark:text-neutral-500 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={15} />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-stone-200 dark:bg-neutral-700 mx-1" />

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-stone-700 dark:text-stone-300 select-none"
          title={user.name}
        >
          {getInitials(user.name)}
        </div>
      </div>
    </header>
  );
}