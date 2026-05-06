"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import { ADMIN_DASHBOARD_QUERY } from "@/src/lib/graphqlDocuments";
import {
  formatDate,
  getInitials,
  isWithinLastDays,
  sortReportsNewest,
  toSidebarUser,
  type GraphQLReport,
  type GraphQLUnit,
  type GraphQLUser,
} from "@/src/lib/dashboardHelpers";

function QuickLinkCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  colorClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  href: string;
  colorClassName: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-stone-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-neutral-400">
          {label}
        </p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${colorClassName}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
        {value}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-stone-400 dark:text-neutral-500">{sub}</p>
        <ArrowRight size={13} className="text-stone-300 transition-colors group-hover:text-stone-500 dark:text-neutral-600 dark:group-hover:text-neutral-400" />
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data, loading } = useQuery<{
    me: GraphQLUser | null;
    users: GraphQLUser[];
    units: GraphQLUnit[];
    reports: GraphQLReport[];
  }>(ADMIN_DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
  });

  const me = data?.me ?? null;
  const users = data?.users ?? [];
  const units = data?.units ?? [];
  const reports = useMemo(() => data?.reports ?? [], [data?.reports]);
  const sidebarUser = toSidebarUser(me);

  const pendingCount = reports.filter((report) => report.status === "pending").length;
  const reviewedCount = reports.filter((report) => report.status === "reviewed").length;
  const thisWeekReports = reports.filter((report) => isWithinLastDays(report.createdAt, 7)).length;
  const latestReports = useMemo(() => sortReportsNewest(reports).slice(0, 5), [reports]);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
              Admin overview
            </h1>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
              Full visibility across all units, leaders, and reports
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <QuickLinkCard
              icon={ClipboardList}
              label="Total reports"
              value={reports.length}
              sub="All time submissions"
              href="/dashboard/admin/reports"
              colorClassName="bg-stone-100 text-stone-500 dark:bg-neutral-800 dark:text-neutral-400"
            />
            <QuickLinkCard
              icon={Clock}
              label="Pending review"
              value={pendingCount}
              sub={pendingCount === 0 ? "All caught up" : "Awaiting review"}
              href="/dashboard/admin/reports"
              colorClassName="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
            />
            <QuickLinkCard
              icon={Users}
              label="Total users"
              value={users.length}
              sub="Across all roles"
              href="/dashboard/admin/users"
              colorClassName="bg-stone-100 text-stone-500 dark:bg-neutral-800 dark:text-neutral-400"
            />
            <QuickLinkCard
              icon={Building2}
              label="Total units"
              value={units.length}
              sub="Active church units"
              href="/dashboard/admin/units"
              colorClassName="bg-stone-100 text-stone-500 dark:bg-neutral-800 dark:text-neutral-400"
            />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <TrendingUp size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-stone-900 dark:text-white">
                  {thisWeekReports}
                </p>
                <p className="text-xs text-stone-400 dark:text-neutral-500">Reports this week</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-stone-900 dark:text-white">
                  {reviewedCount}
                </p>
                <p className="text-xs text-stone-400 dark:text-neutral-500">Reports reviewed</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                <AlertCircle size={18} className="text-stone-500 dark:text-neutral-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </p>
                <p className="text-xs text-stone-400 dark:text-neutral-500">Still pending</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                Latest reports
              </h2>
              <Link
                href="/dashboard/admin/reports"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white"
              >
                View all reports
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    {["Title", "Unit", "Submitted by", "Core leader", "Date", "Status", ""].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500 first:px-5"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-stone-500 dark:text-neutral-400">
                        Loading reports...
                      </td>
                    </tr>
                  ) : latestReports.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                            <AlertCircle size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            No reports yet
                          </p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                            Reports from all units will appear here
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    latestReports.map((report) => (
                      <tr
                        key={report.id}
                        className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                      >
                        <td className="px-5 py-3.5 font-medium text-stone-800 dark:text-neutral-200">
                          {report.title}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {report.unit?.name ?? "Unknown"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">
                              {getInitials(report.submittedByUser?.name ?? "U")}
                            </div>
                            <span className="text-sm text-stone-600 dark:text-neutral-400">
                              {report.submittedByUser?.name ?? "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {report.unit?.coreLeader?.name ?? "Unassigned"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <ReportStatusPill status={report.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/admin/reports/${report.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                          >
                            <Eye size={11} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
