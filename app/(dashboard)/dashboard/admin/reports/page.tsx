"use client";

import { useState, useMemo } from "react";
import {
  Search, Filter, Eye, Trash2, Building2, Clock,
  CheckCircle2, ChevronDown, ArrowRight, FileText,
  ArrowUpDown, ArrowUp, ArrowDown, X, Loader2,
  CheckSquare, Square, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
type ReportStatus = "pending" | "reviewed";
type SortField = "title" | "unitName" | "submittedBy" | "dateSubmitted" | "status";
type SortDir = "asc" | "desc";

interface Report {
  id: string;
  title: string;
  unitName: string;
  submittedBy: string;
  coreLeader: string;
  dateSubmitted: string;
  status: ReportStatus;
  serviceType: "Sunday Service" | "Midweek" | "Special Service";
}

// ── Mock data ──────────────────────────────────────────
const MOCK_REPORTS: Report[] = [
  { id: "1",  title: "Sunday Service — May 4",    unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",   dateSubmitted: "2026-05-04", status: "pending",  serviceType: "Sunday Service" },
  { id: "2",  title: "Sunday Service — May 4",    unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", coreLeader: "Br. Oluwole",   dateSubmitted: "2026-05-04", status: "pending",  serviceType: "Sunday Service" },
  { id: "3",  title: "Sunday Service — May 4",    unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", coreLeader: "Sis. Ifeoma",   dateSubmitted: "2026-05-04", status: "pending",  serviceType: "Sunday Service" },
  { id: "4",  title: "Midweek — Apr 30",          unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",   dateSubmitted: "2026-04-30", status: "reviewed", serviceType: "Midweek" },
  { id: "5",  title: "Midweek — Apr 30",          unitName: "Protocol Unit", submittedBy: "Sola Bello",   coreLeader: "Sis. Ifeoma",   dateSubmitted: "2026-04-30", status: "reviewed", serviceType: "Midweek" },
  { id: "6",  title: "Sunday Service — Apr 27",   unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", coreLeader: "Br. Oluwole",   dateSubmitted: "2026-04-27", status: "reviewed", serviceType: "Sunday Service" },
  { id: "7",  title: "Sunday Service — Apr 27",   unitName: "Welfare Unit",  submittedBy: "Nike Ojo",     coreLeader: "Deac. Adeyemi", dateSubmitted: "2026-04-27", status: "pending",  serviceType: "Sunday Service" },
  { id: "8",  title: "Good Friday Service",       unitName: "Music Unit",    submittedBy: "Adeola Obi",   coreLeader: "Br. Oluwole",   dateSubmitted: "2026-04-18", status: "reviewed", serviceType: "Special Service" },
  { id: "9",  title: "Good Friday Service",       unitName: "Ushering Unit", submittedBy: "Tunde Fadeyi", coreLeader: "Sis. Ifeoma",   dateSubmitted: "2026-04-18", status: "reviewed", serviceType: "Special Service" },
  { id: "10", title: "Good Friday Service",       unitName: "Protocol Unit", submittedBy: "Sola Bello",   coreLeader: "Sis. Ifeoma",   dateSubmitted: "2026-04-18", status: "reviewed", serviceType: "Special Service" },
  { id: "11", title: "Midweek — Apr 16",          unitName: "Media Unit",    submittedBy: "Kemi Adeyemi", coreLeader: "Br. Oluwole",   dateSubmitted: "2026-04-16", status: "reviewed", serviceType: "Midweek" },
  { id: "12", title: "Sunday Service — Apr 13",   unitName: "Welfare Unit",  submittedBy: "Nike Ojo",     coreLeader: "Deac. Adeyemi", dateSubmitted: "2026-04-13", status: "pending",  serviceType: "Sunday Service" },
];

const MOCK_USER = { name: "Pastor Adewale", role: "ADMIN" as const };
const UNIT_OPTIONS = ["All units", "Music Unit", "Media Unit", "Ushering Unit", "Protocol Unit", "Welfare Unit"];

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown size={11} className="text-stone-300 dark:text-neutral-600 ml-1 inline" />;
  return sortDir === "asc"
    ? <ArrowUp size={11} className="text-stone-600 dark:text-neutral-300 ml-1 inline" />
    : <ArrowDown size={11} className="text-stone-600 dark:text-neutral-300 ml-1 inline" />;
}

function SkeletonRow() {
  return (
    <tr>
      {[24, 160, 110, 120, 100, 90, 80, 70].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-3.5 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Bulk delete confirm modal ─────────────────────────
function BulkDeleteModal({ count, onConfirm, onCancel, isDeleting }: {
  count: number; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 mb-4 mx-auto">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-white text-center mb-1">Delete {count} report{count !== 1 ? "s" : ""}?</h3>
        <p className="text-sm text-stone-500 dark:text-neutral-400 text-center mb-6">
          This will permanently remove the selected reports. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {isDeleting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function AdminReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [unitFilter, setUnitFilter] = useState("All units");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sort
  const [sortField, setSortField] = useState<SortField>("dateSubmitted");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derived
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const reviewedCount = reports.filter((r) => r.status === "reviewed").length;

  const filtered = useMemo(() => {
    let list = [...reports];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.unitName.toLowerCase().includes(q) ||
        r.submittedBy.toLowerCase().includes(q) ||
        r.coreLeader.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (unitFilter !== "All units") list = list.filter((r) => r.unitName === unitFilter);
    list.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [reports, search, statusFilter, unitFilter, sortField, sortDir]);

  const activeFilters = (statusFilter !== "all" ? 1 : 0) + (unitFilter !== "All units" ? 1 : 0);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }

  function clearFilters() {
    setSearch(""); setStatusFilter("all"); setUnitFilter("All units");
  }

  async function handleBulkDelete() {
    setIsDeleting(true);
    await new Promise((r) => setTimeout(r, 900));
    setReports((p) => p.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    setShowBulkDelete(false);
    setIsDeleting(false);
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0 && !allSelected;

  const SortTh = ({ field, label, className = "" }: { field: SortField; label: string; className?: string }) => (
    <th className={`text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:pl-5 ${className}`}>
      <button onClick={() => toggleSort(field)} className="inline-flex items-center hover:text-stone-600 dark:hover:text-neutral-300 transition-colors whitespace-nowrap">
        {label}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </button>
    </th>
  );

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">

          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">All reports</h1>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">
                View and manage every report submitted across all units
              </p>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={() => setStatusFilter("all")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all
                ${statusFilter === "all"
                  ? "bg-stone-900 dark:bg-white border-stone-900 dark:border-white text-white dark:text-stone-900"
                  : "bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:border-stone-300 dark:hover:border-neutral-600"
                }`}>
              <FileText size={12} />All reports
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold
                ${statusFilter === "all" ? "bg-white/20 dark:bg-stone-900/20 text-white dark:text-stone-900" : "bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400"}`}>
                {reports.length}
              </span>
            </button>
            <button onClick={() => setStatusFilter("pending")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all
                ${statusFilter === "pending"
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:border-stone-300 dark:hover:border-neutral-600"
                }`}>
              <Clock size={12} />Pending
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold
                ${statusFilter === "pending" ? "bg-white/25 text-white" : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"}`}>
                {pendingCount}
              </span>
            </button>
            <button onClick={() => setStatusFilter("reviewed")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all
                ${statusFilter === "reviewed"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:border-stone-300 dark:hover:border-neutral-600"
                }`}>
              <CheckCircle2 size={12} />Reviewed
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold
                ${statusFilter === "reviewed" ? "bg-white/25 text-white" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"}`}>
                {reviewedCount}
              </span>
            </button>
          </div>

          {/* Table card */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Bulk actions bar */}
                {selected.size > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-600 dark:text-neutral-400">
                      {selected.size} selected
                    </span>
                    <button onClick={() => setShowBulkDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all">
                      <Trash2 size={12} />Delete selected
                    </button>
                    <button onClick={() => setSelected(new Set())}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-600 dark:hover:text-neutral-300 transition-colors">
                      <X size={12} />Clear
                    </button>
                  </div>
                ) : (
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                    Reports
                    <span className="ml-2 text-stone-400 dark:text-neutral-500 font-normal text-xs">
                      ({filtered.length}{filtered.length !== reports.length ? ` of ${reports.length}` : ""})
                    </span>
                  </h2>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input type="text" placeholder="Search reports…" value={search} onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-48" />
                </div>

                {/* Filter toggle */}
                <button onClick={() => setFiltersOpen((o) => !o)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${filtersOpen || activeFilters > 0
                      ? "border-stone-400 dark:border-neutral-500 bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-200"
                      : "border-stone-200 dark:border-neutral-700 text-stone-500 dark:text-neutral-400 hover:border-stone-300 dark:hover:border-neutral-600 hover:text-stone-700 dark:hover:text-neutral-200"
                    }`}>
                  <Filter size={12} />Filters
                  {activeFilters > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {activeFilters}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filter panel */}
            {filtersOpen && (
              <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-stone-100 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-800/40">
                <p className="text-xs font-medium text-stone-500 dark:text-neutral-400">Filter by:</p>

                {/* Unit filter */}
                <div className="relative">
                  <Building2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}
                    className="pl-7 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-stone-800 dark:text-neutral-200 outline-none appearance-none cursor-pointer focus:border-stone-400 dark:focus:border-neutral-500 transition-colors">
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>

                {activeFilters > 0 && (
                  <button onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors">
                    <X size={11} />Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    {/* Checkbox col */}
                    <th className="pl-5 pr-2 py-3 w-10">
                      <button onClick={toggleSelectAll}
                        className="text-stone-400 dark:text-neutral-500 hover:text-stone-600 dark:hover:text-neutral-300 transition-colors">
                        {allSelected
                          ? <CheckSquare size={15} className="text-stone-700 dark:text-neutral-200" />
                          : someSelected
                            ? <CheckSquare size={15} className="text-stone-400 dark:text-neutral-500 opacity-60" />
                            : <Square size={15} />}
                      </button>
                    </th>
                    <SortTh field="title" label="Title" />
                    <SortTh field="unitName" label="Unit" />
                    <SortTh field="submittedBy" label="Submitted by" />
                    <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Core leader</th>
                    <SortTh field="dateSubmitted" label="Date" />
                    <SortTh field="status" label="Status" />
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <FileText size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">No reports found</p>
                          <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                            {search || statusFilter !== "all" || unitFilter !== "All units"
                              ? "Try adjusting your search or filters"
                              : "Reports will appear here once submitted"}
                          </p>
                          {(search || statusFilter !== "all" || unitFilter !== "All units") && (
                            <button onClick={clearFilters}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-neutral-400 hover:text-stone-800 dark:hover:text-white transition-colors">
                              <X size={11} />Clear all filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.id}
                        className={`transition-colors ${selected.has(r.id) ? "bg-stone-50 dark:bg-neutral-800/50" : "hover:bg-stone-50 dark:hover:bg-neutral-800/40"}`}>

                        {/* Checkbox */}
                        <td className="pl-5 pr-2 py-3.5 w-10">
                          <button onClick={() => toggleSelect(r.id)}
                            className="text-stone-400 dark:text-neutral-500 hover:text-stone-600 dark:hover:text-neutral-300 transition-colors">
                            {selected.has(r.id)
                              ? <CheckSquare size={15} className="text-stone-700 dark:text-neutral-200" />
                              : <Square size={15} />}
                          </button>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3.5 font-medium text-stone-800 dark:text-neutral-200 max-w-[180px]">
                          <div className="truncate">{r.title}</div>
                          <div className="text-[10px] text-stone-400 dark:text-neutral-500 mt-0.5 font-normal">{r.serviceType}</div>
                        </td>

                        {/* Unit */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-neutral-400">
                            <Building2 size={11} />{r.unitName}
                          </span>
                        </td>

                        {/* Submitted by */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none">
                              {getInitials(r.submittedBy)}
                            </div>
                            <span className="text-sm text-stone-600 dark:text-neutral-400 truncate">{r.submittedBy}</span>
                          </div>
                        </td>

                        {/* Core leader */}
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">
                          {r.coreLeader}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">
                          {formatDate(r.dateSubmitted)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusPill status={r.status} />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5">
                          <Link href={`/dashboard/admin/reports/${r.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all whitespace-nowrap">
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
            {!isLoading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between">
                <p className="text-xs text-stone-400 dark:text-neutral-500">
                  {filtered.length} report{filtered.length !== 1 ? "s" : ""}
                  {filtered.length !== reports.length && ` (filtered from ${reports.length})`}
                </p>
                {selected.size > 0 && (
                  <p className="text-xs text-stone-500 dark:text-neutral-400">
                    {selected.size} selected
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bulk delete modal */}
      {showBulkDelete && (
        <BulkDeleteModal
          count={selected.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDelete(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}