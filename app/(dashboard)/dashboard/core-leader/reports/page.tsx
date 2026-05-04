"use client";

import { useState } from "react";
import {
  Eye, Filter, CheckCircle2, Clock, AlertCircle,
  ChevronDown, Search, Building2, MessageSquare,
  Check, Loader2, Calendar,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

type ReportStatus = "pending" | "reviewed";

interface Unit { id: string; name: string; }
interface Report {
  id: string; title: string; unitId: string; unitName: string;
  submittedBy: string; dateSubmitted: string; status: ReportStatus;
}

const MOCK_UNITS: Unit[] = [
  { id: "u1", name: "Music Unit" },
  { id: "u2", name: "Media Unit" },
  { id: "u3", name: "Ushering Unit" },
];

const MOCK_REPORTS: Report[] = [
  { id: "1",  title: "Sunday Service — May 4",  unitId: "u1", unitName: "Music Unit",    submittedBy: "Adeola Obi",   dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "2",  title: "Sunday Service — May 4",  unitId: "u2", unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "3",  title: "Sunday Service — May 4",  unitId: "u3", unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "4",  title: "Midweek — Apr 30",        unitId: "u1", unitName: "Music Unit",    submittedBy: "Adeola Obi",   dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "5",  title: "Midweek — Apr 30",        unitId: "u2", unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "6",  title: "Midweek — Apr 30",        unitId: "u3", unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", dateSubmitted: "2026-04-30", status: "pending"  },
  { id: "7",  title: "Sunday Service — Apr 27", unitId: "u1", unitName: "Music Unit",    submittedBy: "Adeola Obi",   dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "8",  title: "Sunday Service — Apr 27", unitId: "u2", unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "9",  title: "Sunday Service — Apr 27", unitId: "u3", unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "10", title: "Good Friday Service",     unitId: "u1", unitName: "Music Unit",    submittedBy: "Adeola Obi",   dateSubmitted: "2026-04-18", status: "reviewed" },
];

const MOCK_USER = { name: "Br. Oluwole", role: "CORE_LEADER" as const };
const PAGE_SIZE = 8;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

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

function SkeletonRow() {
  return (
    <tr>
      {[48, 24, 28, 20, 20, 24].map((w, i) => (
        <td key={i} className="px-4 py-3.5"><div className={`skeleton h-3.5 w-${w} rounded`} /></td>
      ))}
    </tr>
  );
}

function MarkReviewedButton({ reportId, currentStatus, onMarked }: { reportId: string; currentStatus: ReportStatus; onMarked: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  if (currentStatus === "reviewed") return null;
  async function handle() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    onMarked(reportId);
    setLoading(false);
  }
  return (
    <button onClick={handle} disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap">
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
      {loading ? "Saving…" : "Mark reviewed"}
    </button>
  );
}

export default function CoreLeaderReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const reviewedCount = reports.filter((r) => r.status === "reviewed").length;

  const sorted = [...reports].sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());
  const filtered = sorted.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.submittedBy.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchUnit = unitFilter === "all" || r.unitId === unitFilter;
    const matchDate = !dateFilter || r.dateSubmitted >= dateFilter;
    return matchSearch && matchStatus && matchUnit && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function fc(setter: (v: any) => void, value: any) { setter(value); setPage(1); }

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} notificationCount={pendingCount} />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">Unit reports</h1>
            <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">All reports from your assigned units</p>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Total</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{reports.length}</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white shrink-0">
                All reports
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                    {pendingCount} pending
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input type="text" placeholder="Search…" value={search} onChange={(e) => fc(setSearch, e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-36" />
                </div>
                <div className="relative">
                  <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <select value={unitFilter} onChange={(e) => fc(setUnitFilter, e.target.value)}
                    className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors appearance-none cursor-pointer">
                    <option value="all">All units</option>
                    {MOCK_UNITS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <select value={statusFilter} onChange={(e) => fc(setStatusFilter, e.target.value as any)}
                    className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors appearance-none cursor-pointer">
                    <option value="all">All status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input type="date" value={dateFilter} onChange={(e) => fc(setDateFilter, e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors" />
                </div>
                {(search || statusFilter !== "all" || unitFilter !== "all" || dateFilter) && (
                  <button onClick={() => { setSearch(""); setStatusFilter("all"); setUnitFilter("all"); setDateFilter(""); setPage(1); }}
                    className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors px-2 py-1.5">
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    {["Title", "Unit", "Submitted by", "Date", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {isLoading ? (
                    [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} />)
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                          <AlertCircle size={18} className="text-stone-400 dark:text-neutral-500" />
                        </div>
                        <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                          {search || statusFilter !== "all" || unitFilter !== "all" || dateFilter ? "No reports match your filters" : "No reports yet"}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                          {search || statusFilter !== "all" || unitFilter !== "all" || dateFilter ? "Try adjusting your filters" : "Reports from your units will appear here"}
                        </p>
                      </div>
                    </td></tr>
                  ) : paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-stone-800 dark:text-neutral-200 max-w-[180px]">
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
                      <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(r.dateSubmitted)}</td>
                      <td className="px-4 py-3.5"><StatusPill status={r.status} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={`/dashboard/core-leader/reports/${r.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all whitespace-nowrap">
                            <Eye size={11} />View
                          </Link>
                          <Link href={`/dashboard/core-leader/reports/${r.id}?comment=true`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all whitespace-nowrap">
                            <MessageSquare size={11} />Comment
                          </Link>
                          <MarkReviewedButton reportId={r.id} currentStatus={r.status} onMarked={(id) => setReports((prev) => prev.map((x) => x.id === id ? { ...x, status: "reviewed" } : x))} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isLoading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                <p className="text-xs text-stone-400 dark:text-neutral-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Previous</button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`w-7 h-7 text-xs rounded-lg transition-all ${page === i + 1 ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900" : "border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800"}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next</button>
                </div>
              </div>
            )}
            {!isLoading && filtered.length > 0 && filtered.length <= PAGE_SIZE && (
              <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                <p className="text-xs text-stone-400 dark:text-neutral-500">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}