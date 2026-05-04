"use client";

import { useState } from "react";
import {
  Users, Building2, ClipboardList, TrendingUp, Eye,
  Filter, CheckCircle2, Clock, AlertCircle, ChevronDown,
  Search, Calendar, ShieldCheck, MoreHorizontal,
  UserPlus, PlusCircle, Pencil, Trash2,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
type ReportStatus = "pending" | "reviewed";
type UserRole = "UNIT_HEAD" | "CORE_LEADER" | "ADMIN";

interface Report {
  id: string; title: string; unitName: string; submittedBy: string;
  coreLeader: string; dateSubmitted: string; status: ReportStatus;
}
interface AppUser {
  id: string; name: string; email: string; role: UserRole; unit?: string; createdAt: string;
}
interface Unit {
  id: string; name: string; headName: string; coreLeader: string;
  totalReports: number; pendingReports: number;
}

// ── Mock data ──────────────────────────────────────────
const MOCK_REPORTS: Report[] = [
  { id: "1",  title: "Sunday Service — May 4",  unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",  dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "2",  title: "Sunday Service — May 4",  unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", coreLeader: "Br. Oluwole",  dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "3",  title: "Sunday Service — May 4",  unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", coreLeader: "Sis. Ifeoma",  dateSubmitted: "2026-05-04", status: "pending"  },
  { id: "4",  title: "Midweek — Apr 30",        unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",  dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "5",  title: "Midweek — Apr 30",        unitName: "Protocol Unit", submittedBy: "Sola Bello",   coreLeader: "Sis. Ifeoma",  dateSubmitted: "2026-04-30", status: "reviewed" },
  { id: "6",  title: "Sunday Service — Apr 27", unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", coreLeader: "Br. Oluwole",  dateSubmitted: "2026-04-27", status: "reviewed" },
  { id: "7",  title: "Sunday Service — Apr 27", unitName: "Welfare Unit",  submittedBy: "Nike Ojo",     coreLeader: "Deac. Adeyemi",dateSubmitted: "2026-04-27", status: "pending"  },
  { id: "8",  title: "Good Friday Service",     unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",  dateSubmitted: "2026-04-18", status: "reviewed" },
];

const MOCK_USERS: AppUser[] = [
  { id: "usr1", name: "Adeola Obi",    email: "adeola@church.org",  role: "UNIT_HEAD",   unit: "Music Unit",    createdAt: "2026-01-10" },
  { id: "usr2", name: "Kemi Adeyemi",  email: "kemi@church.org",    role: "UNIT_HEAD",   unit: "Media Unit",    createdAt: "2026-01-12" },
  { id: "usr3", name: "Tunde Fadeyi",  email: "tunde@church.org",   role: "UNIT_HEAD",   unit: "Ushering Unit", createdAt: "2026-01-15" },
  { id: "usr4", name: "Sola Bello",    email: "sola@church.org",    role: "UNIT_HEAD",   unit: "Protocol Unit", createdAt: "2026-01-20" },
  { id: "usr5", name: "Br. Oluwole",   email: "oluwole@church.org", role: "CORE_LEADER", unit: undefined,       createdAt: "2026-01-05" },
  { id: "usr6", name: "Sis. Ifeoma",   email: "ifeoma@church.org",  role: "CORE_LEADER", unit: undefined,       createdAt: "2026-01-05" },
  { id: "usr7", name: "Pastor Adewale",email: "pastor@church.org",  role: "ADMIN",       unit: undefined,       createdAt: "2026-01-01" },
];

const MOCK_UNITS: Unit[] = [
  { id: "u1", name: "Music Unit",    headName: "Adeola Obi",   coreLeader: "Br. Oluwole",   totalReports: 12, pendingReports: 2 },
  { id: "u2", name: "Media Unit",    headName: "Kemi Adeyemi", coreLeader: "Br. Oluwole",   totalReports: 8,  pendingReports: 1 },
  { id: "u3", name: "Ushering Unit", headName: "Tunde Fadeyi", coreLeader: "Sis. Ifeoma",   totalReports: 7,  pendingReports: 2 },
  { id: "u4", name: "Protocol Unit", headName: "Sola Bello",   coreLeader: "Sis. Ifeoma",   totalReports: 5,  pendingReports: 0 },
  { id: "u5", name: "Welfare Unit",  headName: "Nike Ojo",     coreLeader: "Deac. Adeyemi", totalReports: 3,  pendingReports: 1 },
];

const MOCK_USER = { name: "Pastor Adewale", role: "ADMIN" as const };
const PAGE_SIZE = 6;

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function isThisWeek(iso: string) {
  const d = new Date(iso), now = new Date(), w = new Date(now);
  w.setDate(now.getDate() - 7);
  return d >= w && d <= now;
}

const ROLE_LABELS: Record<UserRole, string> = {
  UNIT_HEAD: "Unit Head", CORE_LEADER: "Core Leader", ADMIN: "Pastorate",
};
const ROLE_COLORS: Record<UserRole, string> = {
  UNIT_HEAD: "bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400",
  CORE_LEADER: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
  ADMIN: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
};

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

function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>{[...Array(cols)].map((_, i) => (
      <td key={i} className="px-4 py-3.5"><div className="skeleton h-3.5 rounded" style={{ width: `${50 + Math.random() * 50}%` }} /></td>
    ))}</tr>
  );
}

// ── Page ───────────────────────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "users" | "units">("reports");

  // Reports state
  const [reportSearch, setReportSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [reportPage, setReportPage] = useState(1);

  // Users state
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | UserRole>("all");

  // Units state
  const [unitSearch, setUnitSearch] = useState("");

  // ── Derived stats ──
  const totalUsers = MOCK_USERS.length;
  const totalUnits = MOCK_UNITS.length;
  const totalReports = MOCK_REPORTS.length;
  const thisWeekReports = MOCK_REPORTS.filter((r) => isThisWeek(r.dateSubmitted)).length;
  const pendingCount = MOCK_REPORTS.filter((r) => r.status === "pending").length;

  // ── Filtered reports ──
  const filteredReports = [...MOCK_REPORTS]
    .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime())
    .filter((r) => {
      const ms = r.title.toLowerCase().includes(reportSearch.toLowerCase()) || r.submittedBy.toLowerCase().includes(reportSearch.toLowerCase()) || r.unitName.toLowerCase().includes(reportSearch.toLowerCase());
      const mStatus = statusFilter === "all" || r.status === statusFilter;
      const mUnit = unitFilter === "all" || r.unitName === unitFilter;
      const mDate = !dateFilter || r.dateSubmitted >= dateFilter;
      return ms && mStatus && mUnit && mDate;
    });
  const reportTotalPages = Math.ceil(filteredReports.length / PAGE_SIZE);
  const paginatedReports = filteredReports.slice((reportPage - 1) * PAGE_SIZE, reportPage * PAGE_SIZE);

  // ── Filtered users ──
  const filteredUsers = MOCK_USERS.filter((u) => {
    const ms = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const mr = userRoleFilter === "all" || u.role === userRoleFilter;
    return ms && mr;
  });

  // ── Filtered units ──
  const filteredUnits = MOCK_UNITS.filter((u) =>
    u.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
    u.headName.toLowerCase().includes(unitSearch.toLowerCase()) ||
    u.coreLeader.toLowerCase().includes(unitSearch.toLowerCase())
  );

  function fc(setter: (v: any) => void, value: any, resetPage?: () => void) {
    setter(value); resetPage?.();
  }

  const tabs = [
    { id: "reports", label: "Reports", count: pendingCount > 0 ? pendingCount : undefined },
    { id: "users",   label: "Users",   count: undefined },
    { id: "units",   label: "Units",   count: undefined },
  ] as const;

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} notificationCount={pendingCount} />

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

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {isLoading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">Total users</p>
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Users size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-stone-900 dark:text-white tracking-tight">{totalUsers}</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Across all roles</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">Total units</p>
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Building2 size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-stone-900 dark:text-white tracking-tight">{totalUnits}</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Active church units</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">Total reports</p>
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
                      <ClipboardList size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-stone-900 dark:text-white tracking-tight">{totalReports}</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">All time submissions</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">This week</p>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                      <TrendingUp size={14} className="text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-stone-900 dark:text-white tracking-tight">{thisWeekReports}</p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Reports in last 7 days</p>
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-4 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-1 w-fit">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                    : "text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white"
                  }`}>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                    ${activeTab === tab.id ? "bg-white/20 dark:bg-stone-900/20 text-white dark:text-stone-900" : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Reports tab ── */}
          {activeTab === "reports" && (
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-stone-900 dark:text-white shrink-0">All reports</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="text" placeholder="Search…" value={reportSearch} onChange={(e) => fc(setReportSearch, e.target.value, () => setReportPage(1))}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-36" />
                  </div>
                  <div className="relative">
                    <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <select value={unitFilter} onChange={(e) => fc(setUnitFilter, e.target.value, () => setReportPage(1))}
                      className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none appearance-none cursor-pointer">
                      <option value="all">All units</option>
                      {MOCK_UNITS.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <select value={statusFilter} onChange={(e) => fc(setStatusFilter, e.target.value as any, () => setReportPage(1))}
                      className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none appearance-none cursor-pointer">
                      <option value="all">All status</option>
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="date" value={dateFilter} onChange={(e) => fc(setDateFilter, e.target.value, () => setReportPage(1))}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none" />
                  </div>
                  {(reportSearch || statusFilter !== "all" || unitFilter !== "all" || dateFilter) && (
                    <button onClick={() => { setReportSearch(""); setStatusFilter("all"); setUnitFilter("all"); setDateFilter(""); setReportPage(1); }}
                      className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors px-2 py-1.5">Clear</button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-neutral-800">
                      {["Title", "Unit", "Submitted by", "Core leader", "Date", "Status", "Action"].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:px-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                    {isLoading ? [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} cols={7} />) :
                      paginatedReports.length === 0 ? (
                        <tr><td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-14 text-center">
                            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                              <AlertCircle size={18} className="text-stone-400 dark:text-neutral-500" />
                            </div>
                            <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">No reports match your filters</p>
                            <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Try adjusting your search or filters</p>
                          </div>
                        </td></tr>
                      ) : paginatedReports.map((r) => (
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
                          <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">{r.coreLeader}</td>
                          <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(r.dateSubmitted)}</td>
                          <td className="px-4 py-3.5"><StatusPill status={r.status} /></td>
                          <td className="px-4 py-3.5">
                            <Link href={`/dashboard/admin/reports/${r.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all whitespace-nowrap">
                              <Eye size={11} />View
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!isLoading && filteredReports.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                  <p className="text-xs text-stone-400 dark:text-neutral-500">
                    Showing {(reportPage - 1) * PAGE_SIZE + 1}–{Math.min(reportPage * PAGE_SIZE, filteredReports.length)} of {filteredReports.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setReportPage((p) => Math.max(1, p - 1))} disabled={reportPage === 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Previous</button>
                    {[...Array(reportTotalPages)].map((_, i) => (
                      <button key={i} onClick={() => setReportPage(i + 1)}
                        className={`w-7 h-7 text-xs rounded-lg transition-all ${reportPage === i + 1 ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900" : "border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800"}`}>
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))} disabled={reportPage === reportTotalPages}
                      className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next</button>
                  </div>
                </div>
              )}
              {!isLoading && filteredReports.length > 0 && filteredReports.length <= PAGE_SIZE && (
                <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                  <p className="text-xs text-stone-400 dark:text-neutral-500">{filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Users tab ── */}
          {activeTab === "users" && (
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-stone-900 dark:text-white shrink-0">All users</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="text" placeholder="Search users…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-40" />
                  </div>
                  <div className="relative">
                    <ShieldCheck size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value as any)}
                      className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none appearance-none cursor-pointer">
                      <option value="all">All roles</option>
                      <option value="UNIT_HEAD">Unit Head</option>
                      <option value="CORE_LEADER">Core Leader</option>
                      <option value="ADMIN">Pastorate</option>
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  </div>
                  <Link href="/dashboard/admin/users/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-85 transition-all whitespace-nowrap">
                    <UserPlus size={12} />Add user
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-neutral-800">
                      {["User", "Email", "Role", "Unit", "Joined", "Actions"].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:px-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                    {isLoading ? [...Array(5)].map((_, i) => <SkeletonRow key={i} cols={6} />) :
                      filteredUsers.length === 0 ? (
                        <tr><td colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-14 text-center">
                            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                              <Users size={18} className="text-stone-400 dark:text-neutral-500" />
                            </div>
                            <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">No users found</p>
                          </div>
                        </td></tr>
                      ) : filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none">
                                {getInitials(u.name)}
                              </div>
                              <span className="text-sm font-medium text-stone-800 dark:text-neutral-200">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">{u.email}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${ROLE_COLORS[u.role]}`}>
                              {ROLE_LABELS[u.role]}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">{u.unit ?? "—"}</td>
                          <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Link href={`/dashboard/admin/users/${u.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all">
                                <Pencil size={11} />Edit
                              </Link>
                              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900 transition-all">
                                <Trash2 size={11} />Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!isLoading && filteredUsers.length > 0 && (
                <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                  <p className="text-xs text-stone-400 dark:text-neutral-500">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Units tab ── */}
          {activeTab === "units" && (
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-stone-900 dark:text-white shrink-0">All units</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="text" placeholder="Search units…" value={unitSearch} onChange={(e) => setUnitSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-40" />
                  </div>
                  <Link href="/dashboard/admin/units/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-85 transition-all whitespace-nowrap">
                    <PlusCircle size={12} />Add unit
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-neutral-800">
                      {["Unit", "Unit head", "Core leader", "Reports", "Pending", "Actions"].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:px-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                    {isLoading ? [...Array(4)].map((_, i) => <SkeletonRow key={i} cols={6} />) :
                      filteredUnits.length === 0 ? (
                        <tr><td colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-14 text-center">
                            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                              <Building2 size={18} className="text-stone-400 dark:text-neutral-500" />
                            </div>
                            <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">No units found</p>
                          </div>
                        </td></tr>
                      ) : filteredUnits.map((u) => (
                        <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                                <Building2 size={13} className="text-stone-500 dark:text-neutral-400" />
                              </div>
                              <span className="text-sm font-medium text-stone-800 dark:text-neutral-200">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none">
                                {getInitials(u.headName)}
                              </div>
                              <span className="text-sm text-stone-600 dark:text-neutral-400">{u.headName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">{u.coreLeader}</td>
                          <td className="px-4 py-3.5 text-sm font-medium text-stone-800 dark:text-neutral-200">{u.totalReports}</td>
                          <td className="px-4 py-3.5">
                            {u.pendingReports > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                                <Clock size={10} />{u.pendingReports}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 size={10} />Clear
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Link href={`/dashboard/admin/units/${u.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all">
                                <Pencil size={11} />Edit
                              </Link>
                              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900 transition-all">
                                <Trash2 size={11} />Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!isLoading && filteredUnits.length > 0 && (
                <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                  <p className="text-xs text-stone-400 dark:text-neutral-500">{filteredUnits.length} unit{filteredUnits.length !== 1 ? "s" : ""}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}