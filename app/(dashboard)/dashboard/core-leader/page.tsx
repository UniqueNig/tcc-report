"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Loader2,
  MessageSquare,
  Users,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import {
  CORE_LEADER_DASHBOARD_QUERY,
  MARK_REPORT_REVIEWED_MUTATION,
} from "@/src/lib/graphqlDocuments";
import {
  formatDate,
  getInitials,
  sortReportsNewest,
  toSidebarUser,
  type GraphQLReport,
  type GraphQLUnit,
  type GraphQLUser,
} from "@/src/lib/dashboardHelpers";

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 h-3 w-20 rounded bg-stone-200 dark:bg-neutral-800" />
      <div className="mb-2 h-7 w-12 rounded bg-stone-200 dark:bg-neutral-800" />
      <div className="h-3 w-28 rounded bg-stone-200 dark:bg-neutral-800" />
    </div>
  );
}

function MarkReviewedButton({
  report,
  onMarked,
}: {
  report: GraphQLReport;
  onMarked: (reportId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  if (report.status === "reviewed") {
    return null;
  }

  return (
    <button
      onClick={async () => {
        setLoading(true);
        await onMarked(report.id);
        setLoading(false);
      }}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
      {loading ? "Saving..." : "Mark reviewed"}
    </button>
  );
}

export default function CoreLeaderDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data, loading, refetch } = useQuery<{
    me: GraphQLUser | null;
    units: GraphQLUnit[];
    reports: GraphQLReport[];
  }>(CORE_LEADER_DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
  });

  const [markReportReviewed] = useMutation(MARK_REPORT_REVIEWED_MUTATION);

  const me = data?.me ?? null;
  const units = data?.units ?? [];
  const reports = useMemo(() => data?.reports ?? [], [data?.reports]);
  const sidebarUser = toSidebarUser(me);

  const latestReports = useMemo(() => sortReportsNewest(reports).slice(0, 6), [reports]);
  const pendingCount = reports.filter((report) => report.status === "pending").length;

  async function handleMarkReviewed(reportId: string) {
    await markReportReviewed({ variables: { id: reportId } });
    await refetch();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
              Good day, {me?.name.split(" ").slice(-1)[0] ?? "leader"}
            </h1>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
              Core Leader · {units.length} assigned unit{units.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-neutral-400">
                      Assigned units
                    </p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                      <Building2 size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
                    {units.length}
                  </p>
                  <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                    Units under your oversight
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-neutral-400">
                      Total reports
                    </p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                      <ClipboardList size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
                    {reports.length}
                  </p>
                  <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                    Across all assigned units
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-neutral-400">
                      Pending review
                    </p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                      <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
                    {pendingCount}
                  </p>
                  <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                    {pendingCount === 0 ? "All caught up" : "Awaiting your review"}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                Assigned units
              </h2>
              <Link
                href="/dashboard/core-leader/units"
                className="text-xs font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white"
              >
                View all units
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : units.length === 0 ? (
                <div className="col-span-3 rounded-2xl border border-stone-200 bg-white px-5 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                    <Users size={16} className="text-stone-400 dark:text-neutral-500" />
                  </div>
                  <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">
                    No units assigned yet
                  </p>
                  <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                    Contact your admin to get units assigned.
                  </p>
                </div>
              ) : (
                units.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/dashboard/core-leader/reports?unit=${unit.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                      <Building2 size={16} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900 dark:text-white">
                        {unit.name}
                      </p>
                      <p className="truncate text-xs text-stone-400 dark:text-neutral-500">
                        {unit.unitHead?.name ?? "No unit head"} · {unit.reportCount} report
                        {unit.reportCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {unit.pendingCount > 0 ? (
                      <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                        {unit.pendingCount}
                      </span>
                    ) : (
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                Latest reports
              </h2>
              <Link
                href="/dashboard/core-leader/reports"
                className="text-xs font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white"
              >
                View all reports
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    {["Title", "Unit", "Submitted by", "Date", "Status", "Actions"].map((heading) => (
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
                    <>
                      <tr><td colSpan={6} className="p-6" /></tr>
                      <tr><td colSpan={6} className="p-6" /></tr>
                    </>
                  ) : latestReports.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                            <AlertCircle size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            No reports yet
                          </p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                            Reports from your units will appear here.
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
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <ReportStatusPill status={report.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              href={`/dashboard/core-leader/reports/${report.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                            >
                              <Eye size={11} />
                              View
                            </Link>
                            <Link
                              href={`/dashboard/core-leader/reports/${report.id}?comment=true`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                            >
                              <MessageSquare size={11} />
                              Comment
                            </Link>
                            <MarkReviewedButton report={report} onMarked={handleMarkReviewed} />
                          </div>
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
