"use client";

import { useState } from "react";
import {
  Users, Building2, ClipboardList, TrendingUp, Eye,
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  FileText, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
type ReportStatus = "pending" | "reviewed";

interface Report {
  id: string; title: string; unitName: string;
  submittedBy: string; coreLeader: string;
  dateSubmitted: string; status: ReportStatus;
}

interface QuickStat {
  label: string; value: number; sub: string; href: string;
}

// ── Mock data ──────────────────────────────────────────
const MOCK_REPORTS: Report[] = [
  { id: "1", title: "Sunday Service — May 4",  unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",   dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "2", title: "Sunday Service — May 4",  unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", coreLeader: "Br. Oluwole",   dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "3", title: "Sunday Service — May 4",  unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", coreLeader: "Sis. Ifeoma",   dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "4", title: "Midweek — Apr 30",        unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",   dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "5", title: "Midweek — Apr 30",        unitName: "Protocol Unit", submittedBy: "Sola Bello",   coreLeader: "Sis. Ifeoma",   dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "6", title: "Sunday Service — Apr 27", unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", coreLeader: "Br. Oluwole",   dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "7", title: "Sunday Service — Apr 27", unitName: "Welfare Unit",  submittedBy: "Nike Ojo",     coreLeader: "Deac. Adeyemi", dateSubmitted: "2026-04-27", status: "pending"  },
  { id: "8", title: "Good Friday Service",     unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",   dateSubmitted: "2026-04-18", status: "reviewed" },
];

const MOCK_USER = { name: "Pastor Adewale", role: "ADMIN" as const };

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function isThisWeek(iso: string) {
  const d = new Date(iso), now = new Date(), w = new Date(now);
  w.setDate(now.getDate() - 7);
  return d >= w && d <= now;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Sub-components ─────────────────────────────────────
function StatusPill({ status }: { status: ReportStatus }) {
  if (status === "reviewed") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
      <CheckCircle2 size={11} />Reviewed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
      <Clock size={11} />Pending
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-8 w-16 rounded mb-2" />
      <div className="skeleton h-3 w-28 rounded" />
    </div>
  );
}

function SkeletonReportRow() {
  return (
    <tr>
      {[180, 100, 120, 80, 80, 60].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-3.5 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Quick link card ────────────────────────────────────
function QuickLinkCard({ icon: Icon, label, value, sub, href, color }: {
  icon: React.ElementType; label: string; value: number;
  sub: string; href: string; color: string;
}) {
  return (
    <Link href={href}
      className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5 hover:border-stone-300 dark:hover:border-neutral-700 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-3xl font-semibold text-stone-900 dark:text-white tracking-tight">{value}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-stone-400 dark:text-neutral-500">{sub}</p>
        <ChevronRight size={13} className="text-stone-300 dark:text-neutral-600 group-hover:text-stone-500 dark:group-hover:text-neutral-400 transition-colors" />
      </div>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);

  // Derived stats
  const totalReports = MOCK_REPORTS.length;
  const pendingCount = MOCK_REPORTS.filter((r) => r.status === "pending").length;
  const reviewedCount = MOCK_REPORTS.filter((r) => r.status === "reviewed").length;
  const thisWeekReports = MOCK_REPORTS.filter((r) => isThisWeek(r.dateSubmitted)).length;

  // Latest 5 reports only
  const latestReports = [...MOCK_REPORTS]
    .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime())
    .slice(0, 5);

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          user={{ name: MOCK_USER.name }}
          notificationCount={pendingCount}
        />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">

          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">
              Admin overview
            </h1>
            <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">
              Full visibility across all units, leaders, and reports
            </p>
          </div>

          {/* Summary cards — all clickable, link to their pages */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isLoading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <QuickLinkCard
                  icon={ClipboardList} label="Total reports" value={totalReports}
                  sub="All time submissions" href="/dashboard/admin/reports"
                  color="bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400"
                />
                <QuickLinkCard
                  icon={Clock} label="Pending review" value={pendingCount}
                  sub={pendingCount === 0 ? "All caught up!" : "Awaiting review"}
                  href="/dashboard/admin/reports?status=pending"
                  color="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                />
                <QuickLinkCard
                  icon={Users} label="Total users" value={7}
                  sub="Across all roles" href="/dashboard/admin/users"
                  color="bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400"
                />
                <QuickLinkCard
                  icon={Building2} label="Total units" value={5}
                  sub="Active church units" href="/dashboard/admin/units"
                  color="bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400"
                />
              </>
            )}
          </div>

          {/* This week highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-stone-900 dark:text-white">{thisWeekReports}</p>
                <p className="text-xs text-stone-400 dark:text-neutral-500">Reports this week</p>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-stone-900 dark:text-white">{reviewedCount}</p>
                <p className="text-xs text-stone-400 dark:text-neutral-500">Reports reviewed</p>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-stone-500 dark:text-neutral-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{pendingCount}</p>
                <p className="text-xs text-stone-400 dark:text-neutral-500">Still pending</p>
              </div>
            </div>
          </div>

          {/* Latest 5 reports */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                Latest reports
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                    {pendingCount} pending
                  </span>
                )}
              </h2>
              <Link
                href="/dashboard/admin/reports"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                View all reports
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    {["Title", "Unit", "Submitted by", "Core leader", "Date", "Status", ""].map((h, i) => (
                      <th key={i} className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => <SkeletonReportRow key={i} />)
                  ) : latestReports.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <FileText size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">No reports yet</p>
                          <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Reports from all units will appear here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    latestReports.map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-stone-800 dark:text-neutral-200 max-w-[160px]">
                          <span className="truncate block">{r.title}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-neutral-400">
                            <Building2 size={11} />{r.unitName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none">
                              {getInitials(r.submittedBy)}
                            </div>
                            <span className="text-sm text-stone-600 dark:text-neutral-400 truncate">{r.submittedBy}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">
                          {r.coreLeader}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">
                          {formatDate(r.dateSubmitted)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusPill status={r.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/admin/reports/${r.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all whitespace-nowrap"
                          >
                            <Eye size={11} />View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!isLoading && (
              <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between">
                <p className="text-xs text-stone-400 dark:text-neutral-500">
                  Showing latest {latestReports.length} of {totalReports} reports
                </p>
                <Link
                  href="/dashboard/admin/reports"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  See all <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </div>

          {/* Quick links to management pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Link href="/dashboard/admin/users"
              className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-stone-300 dark:hover:border-neutral-700 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-stone-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">Manage users</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">Add, edit, or remove user accounts</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-stone-300 dark:text-neutral-600 group-hover:text-stone-500 dark:group-hover:text-neutral-400 transition-colors shrink-0" />
            </Link>

            <Link href="/dashboard/admin/units"
              className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-stone-300 dark:hover:border-neutral-700 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-stone-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">Manage units</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">Create units and assign core leaders</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-stone-300 dark:text-neutral-600 group-hover:text-stone-500 dark:group-hover:text-neutral-400 transition-colors shrink-0" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}