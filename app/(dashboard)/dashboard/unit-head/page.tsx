"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  Calendar,
  FileText,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import { UNIT_HEAD_DASHBOARD_QUERY } from "@/src/lib/graphqlDocuments";
import {
  formatDate,
  isWithinLastDays,
  sortReportsNewest,
  toSidebarUser,
  type GraphQLReport,
  type GraphQLUser,
} from "@/src/lib/dashboardHelpers";

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 h-3 w-24 rounded bg-stone-200 dark:bg-neutral-800" />
      <div className="mb-2 h-7 w-16 rounded bg-stone-200 dark:bg-neutral-800" />
      <div className="h-3 w-32 rounded bg-stone-200 dark:bg-neutral-800" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-5 py-3.5">
        <div className="h-3.5 w-48 rounded bg-stone-200 dark:bg-neutral-800" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3.5 w-24 rounded bg-stone-200 dark:bg-neutral-800" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-6 w-20 rounded-full bg-stone-200 dark:bg-neutral-800" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-7 w-14 rounded-lg bg-stone-200 dark:bg-neutral-800" />
      </td>
    </tr>
  );
}

export default function UnitHeadDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [dateFilter, setDateFilter] = useState("");

  const { data, loading } = useQuery<{
    me: GraphQLUser | null;
    reports: GraphQLReport[];
  }>(UNIT_HEAD_DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
  });

  const me = data?.me ?? null;
  const reports = useMemo(() => data?.reports ?? [], [data?.reports]);
  const sidebarUser = toSidebarUser(me);

  const sortedReports = useMemo(() => sortReportsNewest(reports), [reports]);
  const totalReports = reports.length;
  const thisWeekReports = reports.filter((report) => isWithinLastDays(report.createdAt, 7)).length;
  const lastSubmission = sortedReports[0] ? formatDate(sortedReports[0].createdAt) : "-";

  const filteredReports = sortedReports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesDate = !dateFilter || report.createdAt.slice(0, 10) >= dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                Good day, {me?.name.split(" ")[0] ?? "there"}
              </h1>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
                {me?.unit?.name ?? "Your unit"} · Unit Head
              </p>
            </div>

            <Link
              href="/dashboard/unit-head/submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
            >
              <Plus size={15} />
              Submit new report
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                      Total reports
                    </p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                      <FileText size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
                    {totalReports}
                  </p>
                  <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                    All time submissions
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-neutral-400">
                      This week
                    </p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                      <TrendingUp size={14} className="text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
                    {thisWeekReports}
                  </p>
                  <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                    Reports in the last 7 days
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-neutral-400">
                      Last submitted
                    </p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                      <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                    {lastSubmission}
                  </p>
                  <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                    Most recent report
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">My reports</h2>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-36 rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500"
                  />
                </div>

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "all" | "pending" | "reviewed")
                  }
                  className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                      Date submitted
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {loading ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                            <AlertCircle size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            {search || statusFilter !== "all" || dateFilter
                              ? "No reports match your filters"
                              : "No reports yet"}
                          </p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                            {search || statusFilter !== "all" || dateFilter
                              ? "Try adjusting your search or filters"
                              : "Submit your first report to get started"}
                          </p>
                          {!search && statusFilter === "all" && !dateFilter && (
                            <Link
                              href="/dashboard/unit-head/submit"
                              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-all hover:opacity-85 dark:bg-white dark:text-stone-900"
                            >
                              <Plus size={13} />
                              Submit a report
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.slice(0, 8).map((report) => (
                      <tr
                        key={report.id}
                        className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                      >
                        <td className="px-5 py-3.5 text-sm font-medium text-stone-800 dark:text-neutral-200">
                          {report.title}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <ReportStatusPill status={report.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/unit-head/reports/${report.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filteredReports.length > 0 && (
              <div className="border-t border-stone-100 px-5 py-3 dark:border-neutral-800">
                <p className="text-xs text-stone-400 dark:text-neutral-500">
                  Showing {Math.min(filteredReports.length, 8)} of {filteredReports.length} reports
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
