"use client";

import { useState } from "react";
import {
  Eye,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Search,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
type ReportStatus = "pending" | "reviewed";

interface Report {
  id: string;
  title: string;
  dateSubmitted: string;
  status: ReportStatus;
}

// ── Mock data ──────────────────────────────────────────
const MOCK_REPORTS: Report[] = [
  { id: "1",  title: "Sunday Service — May 4",       dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "2",  title: "Midweek Service — Apr 30",     dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "3",  title: "Sunday Service — Apr 27",      dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "4",  title: "Good Friday Service",          dateSubmitted: "2026-04-18", status: "reviewed" },
  { id: "5",  title: "Midweek Service — Apr 16",     dateSubmitted: "2026-04-16", status: "pending"  },
  { id: "6",  title: "Sunday Service — Apr 13",      dateSubmitted: "2026-04-13", status: "reviewed" },
  { id: "7",  title: "Midweek Service — Apr 9",      dateSubmitted: "2026-04-09", status: "reviewed" },
  { id: "8",  title: "Sunday Service — Apr 6",       dateSubmitted: "2026-04-06", status: "reviewed" },
  { id: "9",  title: "Midweek Service — Apr 2",      dateSubmitted: "2026-04-02", status: "reviewed" },
  { id: "10", title: "Sunday Service — Mar 30",      dateSubmitted: "2026-03-30", status: "reviewed" },
  { id: "11", title: "Midweek Service — Mar 26",     dateSubmitted: "2026-03-26", status: "pending"  },
  { id: "12", title: "Sunday Service — Mar 23",      dateSubmitted: "2026-03-23", status: "reviewed" },
];

const MOCK_USER = { name: "Adeola Obi", unit: "Music Unit", role: "UNIT_HEAD" as const };

const PAGE_SIZE = 8;

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Sub-components ─────────────────────────────────────
function StatusPill({ status }: { status: ReportStatus }) {
  if (status === "reviewed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
        <CheckCircle2 size={11} />
        Reviewed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
      <Clock size={11} />
      Pending
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-5 py-3.5"><div className="skeleton h-3.5 w-48 rounded" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-24 rounded" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-6 w-20 rounded-full" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-7 w-14 rounded-lg" /></td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────
export default function UnitHeadReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [reports] = useState<Report[]>(MOCK_REPORTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()
  );

  const filtered = sortedReports.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchDate = !dateFilter || r.dateSubmitted >= dateFilter;
    return matchSearch && matchStatus && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalReports = reports.length;
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const reviewedCount = reports.filter((r) => r.status === "reviewed").length;

  function handleFilterChange(setter: (v: any) => void, value: any) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">

          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">
                My reports
              </h1>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">
                All reports submitted by you
              </p>
            </div>
            <Link
              href="/dashboard/unit-head/submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 transition-all active:scale-[0.98] shrink-0"
            >
              <Plus size={15} />
              Submit new report
            </Link>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Total</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{totalReports}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Pending</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Reviewed</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{reviewedCount}</p>
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white shrink-0">
                All submissions
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-36"
                  />
                </div>

                <div className="relative">
                  <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                    className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">All status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                </div>

                {/* Clear filters */}
                {(search || statusFilter !== "all" || dateFilter) && (
                  <button
                    onClick={() => { setSearch(""); setStatusFilter("all"); setDateFilter(""); setPage(1); }}
                    className="text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors px-2 py-1.5"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-5 py-3">Title</th>
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Date submitted</th>
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {isLoading ? (
                    [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} />)
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <FileText size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            {search || statusFilter !== "all" || dateFilter
                              ? "No reports match your filters"
                              : "No reports yet"}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                            {search || statusFilter !== "all" || dateFilter
                              ? "Try adjusting your search or filters"
                              : "Submit your first report to get started"}
                          </p>
                          {!search && statusFilter === "all" && !dateFilter && (
                            <Link
                              href="/dashboard/unit-head/submit"
                              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-85 transition-all"
                            >
                              <Plus size={13} />
                              Submit a report
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((report) => (
                      <tr key={report.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-stone-800 dark:text-neutral-200">
                          {report.title}
                        </td>
                        <td className="px-4 py-3.5 text-stone-500 dark:text-neutral-400">
                          {formatDate(report.dateSubmitted)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusPill status={report.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/unit-head/reports/${report.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all"
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

            {/* Pagination */}
            {!isLoading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                <p className="text-xs text-stone-400 dark:text-neutral-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-7 h-7 text-xs rounded-lg transition-all
                        ${page === i + 1
                          ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                          : "border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Footer count — no pagination */}
            {!isLoading && filtered.length > 0 && filtered.length <= PAGE_SIZE && (
              <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                <p className="text-xs text-stone-400 dark:text-neutral-500">
                  {filtered.length} report{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}