"use client";

import { useMemo, useState, type ElementType } from "react";
import { useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  BarChart2,
  Building2,
  Calendar,
  ChevronDown,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import PaginationControls from "@/src/components/PaginationControls";
import { ADMIN_ANALYTICS_QUERY } from "@/src/lib/graphqlDocuments";
import {
  buildAttendanceRecords,
  buildOfferingRecords,
  formatCurrency,
  formatDate,
  toSidebarUser,
  type GraphQLReport,
  type GraphQLUser,
} from "@/src/lib/dashboardHelpers";

type Period = "monthly" | "quarterly" | "yearly";
type View = "attendance" | "offering";
const ANALYTICS_PAGE_SIZE = 10;

function getQuarter(iso: string) {
  const month = new Date(iso).getMonth();
  return `Q${Math.floor(month / 3) + 1}`;
}

function getMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function groupByPeriod<T extends { date: string }>(
  data: T[],
  period: Period,
  getValue: (record: T) => number
) {
  const groups: Record<string, number[]> = {};
  const sorted = [...data].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );

  for (const record of sorted) {
    const key =
      period === "monthly"
        ? getMonth(record.date)
        : period === "quarterly"
          ? `${getQuarter(record.date)} ${new Date(record.date).getFullYear()}`
          : `${new Date(record.date).getFullYear()}`;

    groups[key] ??= [];
    groups[key].push(getValue(record));
  }

  return Object.entries(groups).map(([label, values]) => ({
    label,
    value: values.reduce((total, value) => total + value, 0),
  }));
}

function BarChart({
  data,
  maxVal,
  color,
  formatValue,
}: {
  data: { label: string; value: number }[];
  maxVal: number;
  color: string;
  formatValue?: (value: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-stone-200 text-xs text-stone-400 dark:border-neutral-800 dark:text-neutral-500">
        No chart data yet
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex h-32 items-end gap-2">
        {data.map((item) => {
          const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;

          return (
            <div key={item.label} className="group flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex w-full items-end justify-center" style={{ height: "100px" }}>
                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-stone-900">
                  {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
                </div>
                <div
                  className={`w-full rounded-t-md transition-all ${color}`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <p className="w-full truncate text-center text-[10px] text-stone-400 dark:text-neutral-500">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "neutral";
  icon: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-neutral-400">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
          <Icon size={14} className="text-stone-500 dark:text-neutral-400" />
        </div>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        {trend === "up" && <TrendingUp size={12} className="text-emerald-500" />}
        {trend === "down" && <TrendingDown size={12} className="text-red-400" />}
        <p className="text-xs text-stone-400 dark:text-neutral-500">{sub}</p>
      </div>
    </div>
  );
}

function DataTable({
  rows,
  extraHeader,
}: {
  rows: { id: string; date: string; serviceType: string; total: number; detail: string; extra?: string }[];
  extraHeader?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-stone-400 dark:text-neutral-500">
        No records yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100 dark:border-neutral-800">
            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
              Service type
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
              Total
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
              Breakdown
            </th>
            {extraHeader && (
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                {extraHeader}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40">
              <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-stone-800 dark:text-neutral-200">
                {row.date}
              </td>
              <td className="px-4 py-3 text-sm text-stone-500 dark:text-neutral-400">
                {row.serviceType}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-stone-900 dark:text-white">
                {row.total.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-xs text-stone-400 dark:text-neutral-500">
                {row.detail}
              </td>
              {extraHeader && (
                <td className="px-4 py-3 text-sm text-stone-500 dark:text-neutral-400">
                  {row.extra ?? "-"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<View>("attendance");
  const [period, setPeriod] = useState<Period>("monthly");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [attendancePage, setAttendancePage] = useState(1);
  const [offeringPage, setOfferingPage] = useState(1);

  const { data, loading, error } = useQuery<{
    me: GraphQLUser | null;
    reports: GraphQLReport[];
  }>(ADMIN_ANALYTICS_QUERY, {
    fetchPolicy: "network-only",
  });

  const me = data?.me ?? null;
  const reports = data?.reports;
  const sidebarUser = toSidebarUser(me);

  const attendanceRecords = useMemo(() => buildAttendanceRecords(reports ?? []), [reports]);
  const offeringRecords = useMemo(() => buildOfferingRecords(reports ?? []), [reports]);

  const serviceTypes = useMemo(() => {
    const values = new Set(
      [...attendanceRecords, ...offeringRecords].map((record) => record.serviceType || "Other")
    );

    return ["all", ...Array.from(values).sort()];
  }, [attendanceRecords, offeringRecords]);

  const selectedServiceType = serviceTypes.includes(serviceTypeFilter) ? serviceTypeFilter : "all";

  const filteredAttendance = useMemo(
    () =>
      attendanceRecords.filter(
        (record) => selectedServiceType === "all" || record.serviceType === selectedServiceType
      ),
    [attendanceRecords, selectedServiceType]
  );

  const filteredOffering = useMemo(
    () =>
      offeringRecords.filter(
        (record) => selectedServiceType === "all" || record.serviceType === selectedServiceType
      ),
    [offeringRecords, selectedServiceType]
  );

  const totalAttendance = filteredAttendance.reduce(
    (total, record) => total + record.male + record.female + record.children,
    0
  );
  const avgAttendance = filteredAttendance.length
    ? Math.round(totalAttendance / filteredAttendance.length)
    : 0;
  const totalFirstTimers = filteredAttendance.reduce(
    (total, record) => total + record.firstTimers,
    0
  );
  const peakAttendance = filteredAttendance.reduce((max, record) => {
    const total = record.male + record.female + record.children;
    return total > max ? total : max;
  }, 0);

  const totalCollected = filteredOffering.reduce((total, record) => total + record.collected, 0);
  const totalBanked = filteredOffering.reduce((total, record) => total + record.banked, 0);
  const totalDirectIncome = filteredOffering.reduce(
    (total, record) => total + record.directIncome,
    0
  );
  const discrepancy = totalCollected - totalBanked;

  const attendanceChartData = groupByPeriod(
    filteredAttendance,
    period,
    (record) => record.male + record.female + record.children
  );
  const offeringChartData = groupByPeriod(filteredOffering, period, (record) => record.collected);
  const attendanceMax = Math.max(...attendanceChartData.map((item) => item.value), 1);
  const offeringMax = Math.max(...offeringChartData.map((item) => item.value), 1);

  const attendanceTableRows = filteredAttendance.map((record) => ({
    id: record.id,
    date: formatDate(record.date),
    serviceType: record.serviceType,
    total: record.male + record.female + record.children,
    detail: `${record.male}M / ${record.female}F / ${record.children} children`,
    extra: String(record.firstTimers),
  }));
  const attendanceTotalPages = Math.max(
    1,
    Math.ceil(attendanceTableRows.length / ANALYTICS_PAGE_SIZE)
  );
  const currentAttendancePage = Math.min(attendancePage, attendanceTotalPages);
  const paginatedAttendanceRows = attendanceTableRows.slice(
    (currentAttendancePage - 1) * ANALYTICS_PAGE_SIZE,
    currentAttendancePage * ANALYTICS_PAGE_SIZE
  );
  const offeringTotalPages = Math.max(
    1,
    Math.ceil(filteredOffering.length / ANALYTICS_PAGE_SIZE)
  );
  const currentOfferingPage = Math.min(offeringPage, offeringTotalPages);
  const paginatedOffering = filteredOffering.slice(
    (currentOfferingPage - 1) * ANALYTICS_PAGE_SIZE,
    currentOfferingPage * ANALYTICS_PAGE_SIZE
  );

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                Analytics
              </h1>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
                Attendance and finance trends from submitted reports
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Building2 size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <select
                  value={selectedServiceType}
                  onChange={(event) => {
                    setServiceTypeFilter(event.target.value);
                    setAttendancePage(1);
                    setOfferingPage(1);
                  }}
                  className="cursor-pointer appearance-none rounded-xl border border-stone-200 bg-white py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-neutral-500"
                >
                  {serviceTypes.map((serviceType) => (
                    <option key={serviceType} value={serviceType}>
                      {serviceType === "all" ? "All service types" : serviceType}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>

              <div className="relative">
                <Calendar size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as Period)}
                  className="cursor-pointer appearance-none rounded-xl border border-stone-200 bg-white py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-neutral-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
            </div>
          </div>

          {loading && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              <Loader2 size={15} className="animate-spin" />
              Loading analytics...
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              Could not load analytics. Refresh the page or sign in again.
            </div>
          )}

          <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-stone-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
            {([
              { id: "attendance", label: "Attendance", icon: Users },
              { id: "offering", label: "Finance", icon: BarChart2 },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    view === tab.id
                      ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                      : "text-stone-500 hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {view === "attendance" && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                  label="Total attendance"
                  value={totalAttendance.toLocaleString()}
                  sub="Across submitted services"
                  trend={totalAttendance > 0 ? "up" : "neutral"}
                  icon={Users}
                />
                <StatCard
                  label="Average per service"
                  value={avgAttendance.toLocaleString()}
                  sub="Per attendance report"
                  icon={TrendingUp}
                />
                <StatCard
                  label="Peak attendance"
                  value={peakAttendance.toLocaleString()}
                  sub="Single service high"
                  icon={BarChart2}
                />
                <StatCard
                  label="First timers"
                  value={totalFirstTimers.toLocaleString()}
                  sub="New visitors"
                  trend={totalFirstTimers > 0 ? "up" : "neutral"}
                  icon={Users}
                />
              </div>

              <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                    Total attendance by {period === "monthly" ? "month" : period === "quarterly" ? "quarter" : "year"}
                  </h2>
                </div>
                <p className="mb-2 text-xs text-stone-400 dark:text-neutral-500">
                  Male + female + children
                </p>
                <BarChart
                  data={attendanceChartData}
                  maxVal={attendanceMax}
                  color="bg-stone-800 dark:bg-stone-300"
                />
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Male adults", value: filteredAttendance.reduce((total, record) => total + record.male, 0) },
                  { label: "Female adults", value: filteredAttendance.reduce((total, record) => total + record.female, 0) },
                  { label: "Children", value: filteredAttendance.reduce((total, record) => total + record.children, 0) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-stone-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">{item.label}</p>
                    <p className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
                      {item.value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                      {totalAttendance > 0 ? Math.round((item.value / totalAttendance) * 100) : 0}% of total
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-stone-100 px-5 py-4 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                    Attendance records
                  </h2>
                </div>
                <DataTable rows={paginatedAttendanceRows} extraHeader="First timers" />
                <PaginationControls
                  page={currentAttendancePage}
                  pageSize={ANALYTICS_PAGE_SIZE}
                  totalItems={attendanceTableRows.length}
                  itemLabel="services"
                  onPageChange={setAttendancePage}
                />
              </div>
            </>
          )}

          {view === "offering" && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                  label="Total income"
                  value={formatCurrency(totalCollected)}
                  sub="Offering, tithes, seeds, and other"
                  trend={totalCollected > 0 ? "up" : "neutral"}
                  icon={BarChart2}
                />
                <StatCard
                  label="Banked/deposited"
                  value={formatCurrency(totalBanked)}
                  sub="Confirmed by finance"
                  icon={TrendingUp}
                />
                <StatCard
                  label="Direct income"
                  value={formatCurrency(totalDirectIncome)}
                  sub="Non-usher money received by finance"
                  icon={BarChart2}
                />
                <StatCard
                  label="Discrepancy"
                  value={formatCurrency(discrepancy)}
                  sub={discrepancy === 0 ? "All balanced" : "Needs reconciliation"}
                  trend={discrepancy === 0 ? "neutral" : "down"}
                  icon={TrendingDown}
                />
              </div>

              <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                    Finance income by {period === "monthly" ? "month" : period === "quarterly" ? "quarter" : "year"}
                  </h2>
                </div>
                <p className="mb-2 text-xs text-stone-400 dark:text-neutral-500">
                  Offering + tithe + seed envelopes + direct non-usher income
                </p>
                <BarChart
                  data={offeringChartData}
                  maxVal={offeringMax}
                  color="bg-amber-500 dark:bg-amber-400"
                  formatValue={formatCurrency}
                />
              </div>

              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <BarChart2 size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="mb-1 text-sm font-medium text-amber-800 dark:text-amber-300">
                    Separated finance tracking
                  </p>
                  <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                    Ushers record each envelope they hand over. Finance confirms those same categories and records direct income that never passes through ushers.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-stone-100 px-5 py-4 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                    Finance records
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 dark:border-neutral-800">
                        {["Date", "Service type", "Total income", "Envelope breakdown", "Direct income", "Banked", "Difference"].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 first:px-5 dark:text-neutral-500"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                      {filteredOffering.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-400 dark:text-neutral-500">
                            No finance records yet
                          </td>
                        </tr>
                      ) : (
                        paginatedOffering.map((record) => {
                          const diff = record.collected - record.banked;

                          return (
                            <tr
                              key={record.id}
                              className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                            >
                              <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-stone-800 dark:text-neutral-200">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-stone-500 dark:text-neutral-400">
                                {record.serviceType}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-stone-900 dark:text-white">
                                {formatCurrency(record.collected)}
                              </td>
                              <td className="px-4 py-3 text-xs text-stone-500 dark:text-neutral-400">
                                <p>Offering: {formatCurrency(record.offeringCollected)}</p>
                                <p>Tithe: {formatCurrency(record.titheCollected)}</p>
                                <p>Seed/donation: {formatCurrency(record.seedCollected)}</p>
                                <p className="mt-1 text-[11px] text-stone-400 dark:text-neutral-500">
                                  Ushers: {formatCurrency(record.usherHandoverTotal)} / Finance:{" "}
                                  {formatCurrency(record.financeHandoverTotal)}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-xs text-stone-500 dark:text-neutral-400">
                                <p className="font-medium text-stone-700 dark:text-neutral-300">
                                  {formatCurrency(record.directIncome)}
                                </p>
                                {record.otherIncomeSource && (
                                  <p className="mt-1 max-w-xs text-[11px] text-stone-400 dark:text-neutral-500">
                                    {record.otherIncomeSource}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-stone-700 dark:text-neutral-300">
                                {formatCurrency(record.banked)}
                              </td>
                              <td className="px-4 py-3">
                                {diff === 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    Balanced
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
                                    {formatCurrency(diff)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  page={currentOfferingPage}
                  pageSize={ANALYTICS_PAGE_SIZE}
                  totalItems={filteredOffering.length}
                  itemLabel="records"
                  onPageChange={setOfferingPage}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
