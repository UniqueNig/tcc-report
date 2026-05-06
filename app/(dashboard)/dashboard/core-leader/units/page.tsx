"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import { CORE_LEADER_DASHBOARD_QUERY } from "@/src/lib/graphqlDocuments";
import {
  formatDate,
  sortReportsNewest,
  toSidebarUser,
  type GraphQLReport,
  type GraphQLUnit,
  type GraphQLUser,
} from "@/src/lib/dashboardHelpers";

function SkeletonUnitCard() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-stone-200 dark:bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-stone-200 dark:bg-neutral-800" />
          <div className="h-3 w-36 rounded bg-stone-200 dark:bg-neutral-800" />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-12 rounded-xl bg-stone-200 dark:bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}

export default function CoreLeaderUnitsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, loading } = useQuery<{
    me: GraphQLUser | null;
    units: GraphQLUnit[];
    reports: GraphQLReport[];
  }>(CORE_LEADER_DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
  });

  const me = data?.me ?? null;
  const units = data?.units ?? [];
  const reports = useMemo(() => data?.reports ?? [], [data?.reports]);
  const sidebarUser = toSidebarUser(me);

  const reportsByUnit = useMemo(() => {
    const grouped = new Map<string, GraphQLReport[]>();

    for (const report of sortReportsNewest(reports)) {
      const unitId = report.unit?.id;
      if (!unitId) {
        continue;
      }

      if (!grouped.has(unitId)) {
        grouped.set(unitId, []);
      }

      grouped.get(unitId)?.push(report);
    }

    return grouped;
  }, [reports]);

  const filteredUnits = units.filter((unit) => {
    const headName = unit.unitHead?.name ?? "";
    return (
      unit.name.toLowerCase().includes(search.toLowerCase()) ||
      headName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalReports = units.reduce((sum, unit) => sum + unit.reportCount, 0);
  const totalPending = units.reduce((sum, unit) => sum + unit.pendingCount, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                My units
              </h1>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
                {units.length} unit{units.length !== 1 ? "s" : ""} under your oversight
              </p>
            </div>
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Search units..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-44 rounded-xl border border-stone-200 bg-white py-2 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500"
              />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Total units</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{units.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Total reports</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{totalReports}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Pending review</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{totalPending}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SkeletonUnitCard />
              <SkeletonUnitCard />
              <SkeletonUnitCard />
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                <Users size={20} className="text-stone-400 dark:text-neutral-500" />
              </div>
              <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                {search ? "No units match your search" : "No units assigned yet"}
              </p>
              <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                {search ? "Try a different name" : "Contact your admin to get units assigned"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredUnits.map((unit) => {
                const unitReports = reportsByUnit.get(unit.id) ?? [];
                const recentReports = unitReports.slice(0, 3);

                return (
                  <div
                    key={unit.id}
                    className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                          <Building2 size={18} className="text-stone-500 dark:text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900 dark:text-white">
                            {unit.name}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-400 dark:text-neutral-500">
                            {unit.unitHead?.name ?? "No unit head assigned"}
                          </p>
                        </div>
                      </div>
                      {unit.pendingCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                          <Clock size={10} />
                          {unit.pendingCount} pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <CheckCircle2 size={10} />
                          All reviewed
                        </span>
                      )}
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-stone-50 px-3 py-2.5 text-center dark:bg-neutral-800">
                        <p className="text-lg font-semibold text-stone-900 dark:text-white">
                          {unit.reportCount}
                        </p>
                        <p className="mt-0.5 text-[10px] text-stone-400 dark:text-neutral-500">
                          Total
                        </p>
                      </div>
                      <div className="rounded-xl bg-stone-50 px-3 py-2.5 text-center dark:bg-neutral-800">
                        <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                          {unit.pendingCount}
                        </p>
                        <p className="mt-0.5 text-[10px] text-stone-400 dark:text-neutral-500">
                          Pending
                        </p>
                      </div>
                      <div className="rounded-xl bg-stone-50 px-3 py-2.5 text-center dark:bg-neutral-800">
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          {unit.reportCount - unit.pendingCount}
                        </p>
                        <p className="mt-0.5 text-[10px] text-stone-400 dark:text-neutral-500">
                          Reviewed
                        </p>
                      </div>
                    </div>

                    {recentReports.length > 0 && (
                      <div className="mb-4 space-y-1.5">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                          Recent reports
                        </p>
                        {recentReports.map((report) => (
                          <Link
                            key={report.id}
                            href={`/dashboard/core-leader/reports/${report.id}`}
                            className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <FileText size={12} className="shrink-0 text-stone-400 dark:text-neutral-500" />
                              <span className="truncate text-xs text-stone-700 transition-colors group-hover:text-stone-900 dark:text-neutral-300 dark:group-hover:text-white">
                                {report.title}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <ReportStatusPill status={report.status} />
                              <ChevronRight size={12} className="text-stone-300 transition-colors group-hover:text-stone-500 dark:text-neutral-600 dark:group-hover:text-neutral-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {recentReports[0] && (
                      <p className="mb-4 text-[11px] text-stone-400 dark:text-neutral-500">
                        Last submission:{" "}
                        <span className="font-medium text-stone-600 dark:text-neutral-400">
                          {formatDate(recentReports[0].createdAt)}
                        </span>
                      </p>
                    )}

                    <Link
                      href={`/dashboard/core-leader/reports?unit=${unit.id}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2 text-xs font-medium text-stone-500 transition-all hover:bg-stone-50 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                    >
                      View all {unit.name} reports
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
