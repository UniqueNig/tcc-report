"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CheckSquare,
  Clock,
  Eye,
  FileText,
  Filter,
  Loader2,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import PaginationControls from "@/src/components/PaginationControls";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import { DELETE_REPORT_MUTATION, REPORTS_PAGE_QUERY } from "@/src/lib/graphqlDocuments";
import {
  formatDate,
  getInitials,
  getServiceType,
  toSidebarUser,
  type GraphQLReport,
  type GraphQLUnit,
  type GraphQLUser,
} from "@/src/lib/dashboardHelpers";

type SortField = "title" | "unitName" | "submittedBy" | "dateSubmitted" | "status";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 10;

function BulkDeleteModal({
  count,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  count: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="mb-1 text-center text-base font-semibold text-stone-900 dark:text-white">
          Delete {count} report{count !== 1 ? "s" : ""}?
        </h3>
        <p className="mb-6 text-center text-sm text-stone-500 dark:text-neutral-400">
          This will permanently remove the selected reports. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field) {
    return <ArrowUpDown size={11} className="ml-1 inline text-stone-300 dark:text-neutral-600" />;
  }

  return sortDir === "asc" ? (
    <ArrowUp size={11} className="ml-1 inline text-stone-600 dark:text-neutral-300" />
  ) : (
    <ArrowDown size={11} className="ml-1 inline text-stone-600 dark:text-neutral-300" />
  );
}

export default function AdminReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("dateSubmitted");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [page, setPage] = useState(1);

  const { data, loading, refetch } = useQuery<{
    me: GraphQLUser | null;
    units: GraphQLUnit[];
    reports: GraphQLReport[];
  }>(REPORTS_PAGE_QUERY, {
    fetchPolicy: "network-only",
  });

  const [deleteReport, { loading: isDeleting }] = useMutation(DELETE_REPORT_MUTATION);

  const me = data?.me ?? null;
  const units = data?.units ?? [];
  const reports = useMemo(() => data?.reports ?? [], [data?.reports]);
  const sidebarUser = toSidebarUser(me);

  const rows = useMemo(() => {
    return reports.map((report) => ({
      id: report.id,
      title: report.title,
      unitName: report.unit?.name ?? "Unknown unit",
      submittedBy: report.submittedByUser?.name ?? "Unknown",
      coreLeader: report.unit?.coreLeader?.name ?? "Unassigned",
      dateSubmitted: report.createdAt,
      status: report.status,
      serviceType: getServiceType(report),
    }));
  }, [reports]);

  const filtered = useMemo(() => {
    const list = rows.filter((row) => {
      const matchesSearch =
        row.title.toLowerCase().includes(search.toLowerCase()) ||
        row.unitName.toLowerCase().includes(search.toLowerCase()) ||
        row.submittedBy.toLowerCase().includes(search.toLowerCase()) ||
        row.coreLeader.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesUnit = unitFilter === "all" || row.unitName === unitFilter;
      return matchesSearch && matchesStatus && matchesUnit;
    });

    list.sort((left, right) => {
      const leftValue =
        sortField === "unitName"
          ? left.unitName
          : sortField === "submittedBy"
            ? left.submittedBy
            : sortField === "dateSubmitted"
              ? left.dateSubmitted
              : sortField === "status"
                ? left.status
                : left.title;
      const rightValue =
        sortField === "unitName"
          ? right.unitName
          : sortField === "submittedBy"
            ? right.submittedBy
            : sortField === "dateSubmitted"
              ? right.dateSubmitted
              : sortField === "status"
                ? right.status
                : right.title;

      if (leftValue < rightValue) return sortDir === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [rows, search, statusFilter, unitFilter, sortField, sortDir]);

  const pendingCount = rows.filter((row) => row.status === "pending").length;
  const reviewedCount = rows.filter((row) => row.status === "reviewed").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allSelected =
    paginated.length > 0 && paginated.every((row) => selected.has(row.id));
  const activeFilters = (statusFilter !== "all" ? 1 : 0) + (unitFilter !== "all" ? 1 : 0);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDir("asc");
  }

  function toggleSelect(reportId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((current) => {
        const next = new Set(current);
        paginated.forEach((row) => next.delete(row.id));
        return next;
      });
      return;
    }

    setSelected((current) => {
      const next = new Set(current);
      paginated.forEach((row) => next.add(row.id));
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setUnitFilter("all");
    setPage(1);
  }

  async function handleBulkDelete() {
    for (const reportId of selected) {
      await deleteReport({ variables: { id: reportId } });
    }

    setSelected(new Set());
    setShowBulkDelete(false);
    await refetch();
  }

  const renderSortHeader = (field: SortField, label: string) => (
    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500 first:pl-5">
      <button
        onClick={() => toggleSort(field)}
        className="inline-flex items-center whitespace-nowrap transition-colors hover:text-stone-600 dark:hover:text-neutral-300"
      >
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </button>
    </th>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
              All reports
            </h1>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
              View and manage every report submitted across all units
            </p>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                statusFilter === "all"
                  ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600"
              }`}
            >
              <FileText size={12} />
              All reports
              <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-stone-100 px-1 text-[10px] font-semibold text-stone-500 dark:bg-neutral-800 dark:text-neutral-400">
              {rows.length}
              </span>
            </button>
            <button
              onClick={() => {
                setStatusFilter("pending");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                statusFilter === "pending"
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600"
              }`}
            >
              <Clock size={12} />
              Pending
              <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-amber-50 px-1 text-[10px] font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => {
                setStatusFilter("reviewed");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                statusFilter === "reviewed"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600"
              }`}
            >
              <CheckSquare size={12} />
              Reviewed
              <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-emerald-50 px-1 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                {reviewedCount}
              </span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {selected.size > 0 ? (
                  <>
                    <span className="text-xs font-medium text-stone-600 dark:text-neutral-400">
                      {selected.size} selected
                    </span>
                    <button
                      onClick={() => setShowBulkDelete(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 size={12} />
                      Delete selected
                    </button>
                    <button
                      onClick={() => setSelected(new Set())}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-neutral-300"
                    >
                      <X size={12} />
                      Clear
                    </button>
                  </>
                ) : (
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                    Reports
                    <span className="ml-2 text-xs font-normal text-stone-400 dark:text-neutral-500">
                      ({filtered.length}
                      {filtered.length !== rows.length ? ` of ${rows.length}` : ""})
                    </span>
                  </h2>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    className="w-48 rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500"
                  />
                </div>

                <button
                  onClick={() => setFiltersOpen((current) => !current)}
                  className={`relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    filtersOpen || activeFilters > 0
                      ? "border-stone-400 bg-stone-100 text-stone-700 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-200"
                      : "border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
                  }`}
                >
                  <Filter size={12} />
                  Filters
                  {activeFilters > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                      {activeFilters}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 bg-stone-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900/60">
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
                    className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  >
                    <option value="all">All units</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.name}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as "all" | "pending" | "reviewed");
                    setPage(1);
                  }}
                  className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                </select>

                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    <th className="px-4 py-3 text-left first:pl-5">
                      <button
                        onClick={toggleSelectAll}
                        className="text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                      >
                        {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </th>
                    {renderSortHeader("title", "Title")}
                    {renderSortHeader("unitName", "Unit")}
                    {renderSortHeader("submittedBy", "Submitted by")}
                    {renderSortHeader("dateSubmitted", "Date")}
                    {renderSortHeader("status", "Status")}
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {loading ? (
                    <>
                      <tr><td colSpan={7} className="p-6" /></tr>
                      <tr><td colSpan={7} className="p-6" /></tr>
                    </>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                            <AlertCircle size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            {search || activeFilters > 0
                              ? "No reports match your filters"
                              : "No reports yet"}
                          </p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                            {search || activeFilters > 0
                              ? "Try adjusting your search or filters"
                              : "Reports from all units will appear here"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                      >
                        <td className="px-4 py-3.5 first:pl-5">
                          <button
                            onClick={() => toggleSelect(row.id)}
                            className="text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                          >
                            {selected.has(row.id) ? <CheckSquare size={15} /> : <Square size={15} />}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-stone-800 dark:text-neutral-200">
                          {row.title}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {row.unitName}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">
                              {getInitials(row.submittedBy)}
                            </div>
                            <span className="text-sm text-stone-600 dark:text-neutral-400">
                              {row.submittedBy}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {formatDate(row.dateSubmitted)}
                        </td>
                        <td className="px-4 py-3.5">
                          <ReportStatusPill status={row.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/admin/reports/${row.id}`}
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
            {!loading && (
              <PaginationControls
                page={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={filtered.length}
                itemLabel="reports"
                onPageChange={setPage}
              />
            )}
          </div>

          {showBulkDelete && (
            <BulkDeleteModal
              count={selected.size}
              onConfirm={handleBulkDelete}
              onCancel={() => setShowBulkDelete(false)}
              isDeleting={isDeleting}
            />
          )}
        </main>
      </div>
    </div>
  );
}
