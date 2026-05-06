"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  Eye,
  Filter,
  Loader2,
  MessageSquare,
  Search,
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

const PAGE_SIZE = 8;

function SkeletonRow() {
  return (
    <tr>
      {[44, 24, 28, 20, 20, 24].map((width, index) => (
        <td key={index} className="px-4 py-3.5">
          <div className="rounded bg-stone-200 dark:bg-neutral-800" style={{ height: 14, width: width * 4 }} />
        </td>
      ))}
    </tr>
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

export default function CoreLeaderReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

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

  const pendingCount = reports.filter((report) => report.status === "pending").length;
  const reviewedCount = reports.filter((report) => report.status === "reviewed").length;

  const filteredReports = useMemo(() => {
    return sortReportsNewest(reports).filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(search.toLowerCase()) ||
        (report.submittedByUser?.name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || report.status === statusFilter;
      const matchesUnit = unitFilter === "all" || report.unit?.id === unitFilter;
      const matchesDate = !dateFilter || report.createdAt.slice(0, 10) >= dateFilter;
      return matchesSearch && matchesStatus && matchesUnit && matchesDate;
    });
  }, [reports, search, statusFilter, unitFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const paginatedReports = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              Unit reports
            </h1>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
              All reports from your assigned units
            </p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Total</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">
                {reports.length}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Pending</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Reviewed</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {reviewedCount}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                All reports
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    className="w-36 rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500"
                  />
                </div>

                <div className="relative">
                  <Building2
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <select
                    value={unitFilter}
                    onChange={(event) => {
                      setUnitFilter(event.target.value);
                      setPage(1);
                    }}
                    className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  >
                    <option value="all">All units</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Filter
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as "all" | "pending" | "reviewed");
                      setPage(1);
                    }}
                    className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  >
                    <option value="all">All status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                </div>

                <div className="relative">
                  <Calendar
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  />
                </div>
              </div>
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
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : paginatedReports.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                            <AlertCircle size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            {search || statusFilter !== "all" || unitFilter !== "all" || dateFilter
                              ? "No reports match your filters"
                              : "No reports yet"}
                          </p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                            {search || statusFilter !== "all" || unitFilter !== "all" || dateFilter
                              ? "Try adjusting your filters"
                              : "Reports from your units will appear here"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedReports.map((report) => (
                      <tr
                        key={report.id}
                        className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                      >
                        <td className="px-5 py-3.5 font-medium text-stone-800 dark:text-neutral-200">
                          {report.title}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-neutral-400">
                            <Building2 size={11} />
                            {report.unit?.name ?? "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">
                              {getInitials(report.submittedByUser?.name ?? "U")}
                            </div>
                            <span className="truncate text-sm text-stone-600 dark:text-neutral-400">
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
                            <MarkReviewedButton
                              report={report}
                              onMarked={handleMarkReviewed}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filteredReports.length > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3 dark:border-neutral-800">
                <p className="text-xs text-stone-400 dark:text-neutral-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, filteredReports.length)} of {filteredReports.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setPage(index + 1)}
                      className={`h-7 w-7 rounded-lg text-xs transition-all ${
                        page === index + 1
                          ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                          : "border border-stone-200 text-stone-600 hover:bg-stone-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
