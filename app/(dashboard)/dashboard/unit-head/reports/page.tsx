"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Building2,
  Calendar,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import PaginationControls from "@/src/components/PaginationControls";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import { UNIT_HEAD_DASHBOARD_QUERY } from "@/src/lib/graphqlDocuments";
import {
  formatDate,
  sortReportsNewest,
  toSidebarUser,
  type GraphQLReport,
  type GraphQLUser,
} from "@/src/lib/dashboardHelpers";

const PAGE_SIZE = 8;

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

export default function UnitHeadReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery<{
    me: GraphQLUser | null;
    reports: GraphQLReport[];
  }>(UNIT_HEAD_DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
  });

  const me = data?.me ?? null;
  const reports = useMemo(() => data?.reports ?? [], [data?.reports]);
  const sidebarUser = toSidebarUser(me);
  const headedUnits = me?.units?.length ? me.units : me?.unit ? [me.unit] : [];

  const sortedReports = useMemo(() => sortReportsNewest(reports), [reports]);
  const filteredReports = sortedReports.filter((report) => {
    const query = search.toLowerCase();
    const matchesSearch =
      report.title.toLowerCase().includes(query) ||
      (report.unit?.name ?? "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesUnit = unitFilter === "all" || report.unit?.id === unitFilter;
    const matchesDate = !dateFilter || report.createdAt.slice(0, 10) >= dateFilter;
    return matchesSearch && matchesStatus && matchesUnit && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const pendingCount = reports.filter((report) => report.status === "pending").length;
  const reviewedCount = reports.filter((report) => report.status === "reviewed").length;

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                My reports
              </h1>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
                Reports across all units you head
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
                All submissions
              </h2>

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
                    onChange={(event) => {
                      setSearch(event.target.value);
                      resetPage();
                    }}
                    className="w-36 rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500"
                  />
                </div>

                {headedUnits.length > 1 && (
                  <div className="relative">
                    <Building2
                      size={13}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
                    />
                    <select
                      value={unitFilter}
                      onChange={(event) => {
                        setUnitFilter(event.target.value);
                        resetPage();
                      }}
                      className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                    >
                      <option value="all">All units</option>
                      {headedUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="relative">
                  <Calendar
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
                  />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event.target.value);
                      resetPage();
                    }}
                    className="rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  />
                </div>

                <div className="relative">
                  <Filter
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as "all" | "pending" | "reviewed");
                      resetPage();
                    }}
                    className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  >
                    <option value="all">All status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                </div>

                {(search || statusFilter !== "all" || unitFilter !== "all" || dateFilter) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setUnitFilter("all");
                      setDateFilter("");
                      resetPage();
                    }}
                    className="px-2 py-1.5 text-xs text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                  >
                    Clear
                  </button>
                )}
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
                      Unit
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
                  ) : paginatedReports.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                            <FileText size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            {search || statusFilter !== "all" || unitFilter !== "all" || dateFilter
                              ? "No reports match your filters"
                              : "No reports yet"}
                          </p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                            {search || statusFilter !== "all" || unitFilter !== "all" || dateFilter
                              ? "Try adjusting your search or filters"
                              : "Submit your first report to get started"}
                          </p>
                          {!search && statusFilter === "all" && unitFilter === "all" && !dateFilter && (
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
                    paginatedReports.map((report) => (
                      <tr
                        key={report.id}
                        className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                      >
                        <td className="px-5 py-3.5 text-sm font-medium text-stone-800 dark:text-neutral-200">
                          {report.title}
                        </td>
                        <td className="px-4 py-3.5 text-stone-500 dark:text-neutral-400">
                          {report.unit?.name ?? "-"}
                        </td>
                        <td className="px-4 py-3.5 text-stone-500 dark:text-neutral-400">
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
                            <Eye size={12} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <PaginationControls
                page={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredReports.length}
                itemLabel="reports"
                onPageChange={setPage}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
