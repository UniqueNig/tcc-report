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
  Building2,
  ClipboardList,
  MessageSquare,
  Check,
  Loader2,
  Users,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
type ReportStatus = "pending" | "reviewed";

interface Unit {
  id: string;
  name: string;
  headName: string;
  totalReports: number;
  pendingReports: number;
}

interface Report {
  id: string;
  title: string;
  unitId: string;
  unitName: string;
  submittedBy: string;
  dateSubmitted: string;
  status: ReportStatus;
}

// ── Mock data ──────────────────────────────────────────
const MOCK_UNITS: Unit[] = [
  { id: "u1", name: "Music Unit",    headName: "Adeola Obi",    totalReports: 12, pendingReports: 2 },
  { id: "u2", name: "Media Unit",    headName: "Kemi Adeyemi",  totalReports: 8,  pendingReports: 1 },
  { id: "u3", name: "Ushering Unit", headName: "Tunde Fadeyi",  totalReports: 7,  pendingReports: 2 },
];

const MOCK_REPORTS: Report[] = [
  { id: "1",  title: "Sunday Service — May 4",   unitId: "u1", unitName: "Music Unit",    submittedBy: "Adeola Obi",   dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "2",  title: "Sunday Service — May 4",   unitId: "u2", unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "3",  title: "Sunday Service — May 4",   unitId: "u3", unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "4",  title: "Midweek — Apr 30",         unitId: "u1", unitName: "Music Unit",    submittedBy: "Adeola Obi",   dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "5",  title: "Midweek — Apr 30",         unitId: "u2", unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "6",  title: "Midweek — Apr 30",         unitId: "u3", unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", dateSubmitted: "2026-04-30", status: "pending"  },
  { id: "7",  title: "Sunday Service — Apr 27",  unitId: "u1", unitName: "Music Unit",    submittedBy: "Adeola Obi",   dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "8",  title: "Sunday Service — Apr 27",  unitId: "u2", unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "9",  title: "Sunday Service — Apr 27",  unitId: "u3", unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "10", title: "Good Friday Service",      unitId: "u1", unitName: "Music Unit",    submittedBy: "Adeola Obi",   dateSubmitted: "2026-04-18", status: "reviewed" },
];

const MOCK_USER = { name: "Br. Oluwole", role: "CORE_LEADER" as const };

const PAGE_SIZE = 8;

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
      <td className="px-5 py-3.5"><div className="skeleton h-3.5 w-44 rounded" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-24 rounded" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-28 rounded" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-20 rounded" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-6 w-20 rounded-full" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-7 w-24 rounded-lg" /></td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-7 w-12 rounded mb-2" />
      <div className="skeleton h-3 w-28 rounded" />
    </div>
  );
}

function SkeletonUnitCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-24 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
      <div className="skeleton h-5 w-5 rounded-full" />
    </div>
  );
}

function MarkReviewedButton({
  reportId,
  currentStatus,
  onMarked,
}: {
  reportId: string;
  currentStatus: ReportStatus;
  onMarked: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (currentStatus === "reviewed") return null;

  async function handleMark() {
    setLoading(true);
    // Replace with: await markReportReviewed({ variables: { id: reportId } })
    await new Promise((res) => setTimeout(res, 900));
    onMarked(reportId);
    setLoading(false);
  }

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
      {loading ? "Saving…" : "Mark reviewed"}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────
export default function CoreLeaderDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [units] = useState<Unit[]>(MOCK_UNITS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Derived stats
  const totalReports = reports.length;
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const totalUnits = units.length;

  const sorted = [...reports].sort(
    (a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()
  );

  const filtered = sorted.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.submittedBy.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchUnit = unitFilter === "all" || r.unitId === unitFilter;
    return matchSearch && matchStatus && matchUnit;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilterChange(setter: (v: any) => void, value: any) {
    setter(value);
    setPage(1);
  }

  function handleMarkReviewed(id: string) {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "reviewed" } : r))
    );
  }

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
              Good day, {MOCK_USER.name.split(" ").slice(-1)[0]} 👋
            </h1>
            <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">
              Core Leader · {totalUnits} assigned unit{totalUnits !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {isLoading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">Assigned units</p>
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Building2 size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-stone-900 dark:text-white tracking-tight">{totalUnits}</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Units under your oversight</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">Total reports</p>
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
                      <ClipboardList size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-stone-900 dark:text-white tracking-tight">{totalReports}</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Across all assigned units</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">Pending review</p>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                      <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-amber-600 dark:text-amber-400 tracking-tight">{pendingCount}</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                    {pendingCount === 0 ? "All caught up!" : "Awaiting your review"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Assigned units */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">
              Assigned units
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {isLoading ? (
                <><SkeletonUnitCard /><SkeletonUnitCard /><SkeletonUnitCard /></>
              ) : units.length === 0 ? (
                <div className="col-span-3 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3 mx-auto">
                    <Users size={16} className="text-stone-400 dark:text-neutral-500" />
                  </div>
                  <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">No units assigned yet</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Contact your admin to get units assigned</p>
                </div>
              ) : (
                units.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-3 hover:border-stone-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{unit.name}</p>
                      <p className="text-xs text-stone-400 dark:text-neutral-500 truncate">
                        {unit.headName} · {unit.totalReports} report{unit.totalReports !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {unit.pendingReports > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-semibold shrink-0">
                        {unit.pendingReports}
                      </span>
                    ) : (
                      <CheckCircle2 size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reports table */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white shrink-0">
                Reports
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                    {pendingCount} pending
                  </span>
                )}
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
                  <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                  <select
                    value={unitFilter}
                    onChange={(e) => handleFilterChange(setUnitFilter, e.target.value)}
                    className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">All units</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                </div>

                <div className="relative">
                  <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange(setStatusFilter, e.target.value as "all" | ReportStatus)}
                    className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">All status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                </div>

                {(search || statusFilter !== "all" || unitFilter !== "all") && (
                  <button
                    onClick={() => { setSearch(""); setStatusFilter("all"); setUnitFilter("all"); setPage(1); }}
                    className="text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors px-2 py-1.5"
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
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-5 py-3">Title</th>
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Unit</th>
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Submitted by</th>
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {isLoading ? (
                    [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} />)
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <AlertCircle size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            {search || statusFilter !== "all" || unitFilter !== "all"
                              ? "No reports match your filters"
                              : "No reports yet"}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                            {search || statusFilter !== "all" || unitFilter !== "all"
                              ? "Try adjusting your search or filters"
                              : "Reports from your assigned units will appear here"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((report) => (
                      <tr key={report.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-stone-800 dark:text-neutral-200 max-w-[180px]">
                          <span className="truncate block">{report.title}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-neutral-400">
                            <Building2 size={11} />
                            {report.unitName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none">
                              {getInitials(report.submittedBy)}
                            </div>
                            <span className="text-sm text-stone-600 dark:text-neutral-400 truncate">
                              {report.submittedBy}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">
                          {formatDate(report.dateSubmitted)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusPill status={report.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/dashboard/core-leader/reports/${report.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all whitespace-nowrap"
                            >
                              <Eye size={11} />
                              View
                            </Link>
                            <Link
                              href={`/dashboard/core-leader/reports/${report.id}?comment=true`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all whitespace-nowrap"
                            >
                              <MessageSquare size={11} />
                              Comment
                            </Link>
                            <MarkReviewedButton
                              reportId={report.id}
                              currentStatus={report.status}
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