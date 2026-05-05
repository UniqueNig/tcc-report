"use client";

import { useState, useMemo } from "react";
import {
  Users, TrendingUp, TrendingDown, BarChart2,
  ChevronDown, Building2, Calendar,
} from "lucide-react";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
interface AttendanceRecord {
  date: string;        // ISO
  serviceType: string;
  male: number;
  female: number;
  children: number;
  firstTimers: number;
}

interface OfferingRecord {
  date: string;
  serviceType: string;
  collected: number;   // from Ushering
  banked: number;      // from Finance
}

// ── Mock data ──────────────────────────────────────────
const ATTENDANCE_DATA: AttendanceRecord[] = [
  { date: "2026-05-04", serviceType: "Sunday Service",  male: 145, female: 163, children: 42, firstTimers: 12 },
  { date: "2026-04-30", serviceType: "Midweek Service", male: 88,  female: 95,  children: 18, firstTimers: 4  },
  { date: "2026-04-27", serviceType: "Sunday Service",  male: 138, female: 155, children: 39, firstTimers: 9  },
  { date: "2026-04-18", serviceType: "Special Event",   male: 190, female: 210, children: 60, firstTimers: 25 },
  { date: "2026-04-16", serviceType: "Midweek Service", male: 80,  female: 90,  children: 15, firstTimers: 2  },
  { date: "2026-04-13", serviceType: "Sunday Service",  male: 130, female: 148, children: 36, firstTimers: 7  },
  { date: "2026-04-09", serviceType: "Midweek Service", male: 76,  female: 88,  children: 12, firstTimers: 3  },
  { date: "2026-04-06", serviceType: "Sunday Service",  male: 128, female: 142, children: 35, firstTimers: 6  },
  { date: "2026-03-30", serviceType: "Sunday Service",  male: 120, female: 135, children: 30, firstTimers: 5  },
  { date: "2026-03-25", serviceType: "Midweek Service", male: 72,  female: 80,  children: 11, firstTimers: 1  },
  { date: "2026-03-22", serviceType: "Sunday Service",  male: 115, female: 128, children: 28, firstTimers: 4  },
  { date: "2026-03-15", serviceType: "Sunday Service",  male: 118, female: 130, children: 29, firstTimers: 6  },
  { date: "2026-02-22", serviceType: "Sunday Service",  male: 108, female: 120, children: 25, firstTimers: 3  },
  { date: "2026-02-15", serviceType: "Sunday Service",  male: 110, female: 122, children: 26, firstTimers: 4  },
  { date: "2026-01-25", serviceType: "Sunday Service",  male: 100, female: 112, children: 22, firstTimers: 2  },
  { date: "2026-01-18", serviceType: "Sunday Service",  male: 98,  female: 108, children: 20, firstTimers: 3  },
];

const OFFERING_DATA: OfferingRecord[] = [
  { date: "2026-05-04", serviceType: "Sunday Service",  collected: 148500, banked: 148500 },
  { date: "2026-04-30", serviceType: "Midweek Service", collected: 62000,  banked: 62000  },
  { date: "2026-04-27", serviceType: "Sunday Service",  collected: 135000, banked: 134500 },
  { date: "2026-04-18", serviceType: "Special Event",   collected: 280000, banked: 280000 },
  { date: "2026-04-16", serviceType: "Midweek Service", collected: 55000,  banked: 55000  },
  { date: "2026-04-13", serviceType: "Sunday Service",  collected: 128000, banked: 128000 },
  { date: "2026-04-09", serviceType: "Midweek Service", collected: 48000,  banked: 47500  },
  { date: "2026-04-06", serviceType: "Sunday Service",  collected: 122000, banked: 122000 },
  { date: "2026-03-30", serviceType: "Sunday Service",  collected: 115000, banked: 115000 },
  { date: "2026-03-25", serviceType: "Midweek Service", collected: 42000,  banked: 42000  },
  { date: "2026-03-22", serviceType: "Sunday Service",  collected: 108000, banked: 108000 },
  { date: "2026-03-15", serviceType: "Sunday Service",  collected: 112000, banked: 112000 },
  { date: "2026-02-22", serviceType: "Sunday Service",  collected: 98000,  banked: 98000  },
  { date: "2026-02-15", serviceType: "Sunday Service",  collected: 95000,  banked: 95000  },
  { date: "2026-01-25", serviceType: "Sunday Service",  collected: 88000,  banked: 88000  },
  { date: "2026-01-18", serviceType: "Sunday Service",  collected: 85000,  banked: 85000  },
];

const MOCK_USER = { name: "Pastor Adewale", role: "ADMIN" as const };

// ── Helpers ────────────────────────────────────────────
function formatCurrency(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getQuarter(iso: string) {
  const m = new Date(iso).getMonth();
  return `Q${Math.floor(m / 3) + 1}`;
}

function getMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

type Period = "monthly" | "quarterly" | "yearly";
type View = "attendance" | "offering";

// ── Mini bar chart ─────────────────────────────────────
function BarChart({
  data,
  maxVal,
  color,
  label,
}: {
  data: { label: string; value: number }[];
  maxVal: number;
  color: string;
  label: string;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => {
          const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="relative w-full flex items-end justify-center" style={{ height: "100px" }}>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {label === "₦" ? formatCurrency(d.value) : d.value.toLocaleString()}
                </div>
                <div
                  className={`w-full rounded-t-md transition-all ${color}`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-400 dark:text-neutral-500 text-center truncate w-full">
                {d.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────
function StatCard({ label, value, sub, trend, icon: Icon }: {
  label: string; value: string; sub: string;
  trend?: "up" | "down" | "neutral"; icon: React.ElementType;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wide">{label}</p>
        <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
          <Icon size={14} className="text-stone-500 dark:text-neutral-400" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {trend === "up" && <TrendingUp size={12} className="text-emerald-500" />}
        {trend === "down" && <TrendingDown size={12} className="text-red-400" />}
        <p className="text-xs text-stone-400 dark:text-neutral-500">{sub}</p>
      </div>
    </div>
  );
}

// ── Row table ──────────────────────────────────────────
function DataTable({ rows }: { rows: { date: string; serviceType: string; total: number; detail: string; extra?: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100 dark:border-neutral-800">
            <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-5 py-3">Date</th>
            <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Service type</th>
            <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Total</th>
            <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">Breakdown</th>
            {rows[0]?.extra !== undefined && (
              <th className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3">First timers</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
              <td className="px-5 py-3 text-sm font-medium text-stone-800 dark:text-neutral-200 whitespace-nowrap">{r.date}</td>
              <td className="px-4 py-3 text-sm text-stone-500 dark:text-neutral-400">{r.serviceType}</td>
              <td className="px-4 py-3 text-sm font-semibold text-stone-900 dark:text-white">{r.total.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-stone-400 dark:text-neutral-500">{r.detail}</td>
              {r.extra !== undefined && (
                <td className="px-4 py-3 text-sm text-stone-500 dark:text-neutral-400">{r.extra}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<View>("attendance");
  const [period, setPeriod] = useState<Period>("monthly");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");

  const serviceTypes = ["all", "Sunday Service", "Midweek Service", "Special Event"];

  // ── Attendance calcs ───────────────────────────────
  const filteredAttendance = useMemo(() =>
    ATTENDANCE_DATA.filter((r) => serviceTypeFilter === "all" || r.serviceType === serviceTypeFilter),
    [serviceTypeFilter]
  );

  const totalAttendance = filteredAttendance.reduce((a, r) => a + r.male + r.female + r.children, 0);
  const avgAttendance = filteredAttendance.length
    ? Math.round(totalAttendance / filteredAttendance.length) : 0;
  const totalFirstTimers = filteredAttendance.reduce((a, r) => a + r.firstTimers, 0);
  const peakAttendance = filteredAttendance.reduce((max, r) => {
    const t = r.male + r.female + r.children;
    return t > max ? t : max;
  }, 0);

  // ── Offering calcs ─────────────────────────────────
  const filteredOffering = useMemo(() =>
    OFFERING_DATA.filter((r) => serviceTypeFilter === "all" || r.serviceType === serviceTypeFilter),
    [serviceTypeFilter]
  );

  const totalCollected = filteredOffering.reduce((a, r) => a + r.collected, 0);
  const totalBanked = filteredOffering.reduce((a, r) => a + r.banked, 0);
  const avgOffering = filteredOffering.length
    ? Math.round(totalCollected / filteredOffering.length) : 0;
  const discrepancy = totalCollected - totalBanked;

  // ── Group by period ────────────────────────────────
  function groupByPeriod<T extends { date: string }>(data: T[], getValue: (r: T) => number) {
    const groups: Record<string, number[]> = {};
    data.forEach((r) => {
      const key = period === "monthly" ? getMonth(r.date)
        : period === "quarterly" ? `${getQuarter(r.date)} ${new Date(r.date).getFullYear()}`
        : `${new Date(r.date).getFullYear()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(getValue(r));
    });
    return Object.entries(groups).map(([label, vals]) => ({
      label,
      value: vals.reduce((a, b) => a + b, 0),
    }));
  }

  const attendanceChartData = groupByPeriod(filteredAttendance, (r) => r.male + r.female + r.children);
  const offeringChartData = groupByPeriod(filteredOffering, (r) => r.collected);

  const attendanceMax = Math.max(...attendanceChartData.map((d) => d.value), 1);
  const offeringMax = Math.max(...offeringChartData.map((d) => d.value), 1);

  const attendanceTableRows = filteredAttendance.map((r) => ({
    date: formatDate(r.date),
    serviceType: r.serviceType,
    total: r.male + r.female + r.children,
    detail: `${r.male}M · ${r.female}F · ${r.children}K`,
    extra: String(r.firstTimers),
  }));

  const offeringTableRows = filteredOffering.map((r) => ({
    date: formatDate(r.date),
    serviceType: r.serviceType,
    total: r.collected,
    detail: `Banked: ${formatCurrency(r.banked)}${r.collected !== r.banked ? ` · Diff: ${formatCurrency(r.collected - r.banked)}` : ""}`,
  }));

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">

          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">Analytics</h1>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">
                Attendance and offering trends across all services
              </p>
            </div>
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <select value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)}
                  className="pl-8 pr-7 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-white outline-none appearance-none cursor-pointer focus:border-stone-400 dark:focus:border-neutral-500 transition-colors">
                  {serviceTypes.map((s) => <option key={s} value={s}>{s === "all" ? "All service types" : s}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
              <div className="relative">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}
                  className="pl-8 pr-7 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-white outline-none appearance-none cursor-pointer focus:border-stone-400 dark:focus:border-neutral-500 transition-colors">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1 mb-6 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-1 w-fit">
            {([
              { id: "attendance", label: "Attendance", icon: Users },
              { id: "offering", label: "Offering", icon: BarChart2 },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${view === tab.id
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                      : "text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white"
                    }`}>
                  <Icon size={14} />{tab.label}
                </button>
              );
            })}
          </div>

          {/* ── ATTENDANCE VIEW ── */}
          {view === "attendance" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total attendance" value={totalAttendance.toLocaleString()} sub="Across all services" trend="up" icon={Users} />
                <StatCard label="Average per service" value={avgAttendance.toLocaleString()} sub="Per service" icon={TrendingUp} />
                <StatCard label="Peak attendance" value={peakAttendance.toLocaleString()} sub="Single service high" icon={BarChart2} />
                <StatCard label="First timers" value={totalFirstTimers.toLocaleString()} sub="New visitors" trend="up" icon={Users} />
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">Total attendance by {period === "monthly" ? "month" : period === "quarterly" ? "quarter" : "year"}</h2>
                </div>
                <p className="text-xs text-stone-400 dark:text-neutral-500 mb-2">Male + Female + Children</p>
                <BarChart data={attendanceChartData} maxVal={attendanceMax} color="bg-stone-800 dark:bg-stone-300" label="" />
              </div>

              {/* Gender breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Male adults", val: filteredAttendance.reduce((a, r) => a + r.male, 0), color: "text-stone-900 dark:text-white" },
                  { label: "Female adults", val: filteredAttendance.reduce((a, r) => a + r.female, 0), color: "text-stone-900 dark:text-white" },
                  { label: "Children", val: filteredAttendance.reduce((a, r) => a + r.children, 0), color: "text-stone-900 dark:text-white" },
                ].map((item) => (
                  <div key={item.label} className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-4">
                    <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">{item.label}</p>
                    <p className={`text-2xl font-semibold tracking-tight ${item.color}`}>{item.val.toLocaleString()}</p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                      {totalAttendance > 0 ? Math.round((item.val / totalAttendance) * 100) : 0}% of total
                    </p>
                  </div>
                ))}
              </div>

              {/* Raw table */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">Attendance records</h2>
                </div>
                <DataTable rows={attendanceTableRows} />
                <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                  <p className="text-xs text-stone-400 dark:text-neutral-500">{filteredAttendance.length} services</p>
                </div>
              </div>
            </>
          )}

          {/* ── OFFERING VIEW ── */}
          {view === "offering" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total collected" value={formatCurrency(totalCollected)} sub="All services" trend="up" icon={BarChart2} />
                <StatCard label="Total banked" value={formatCurrency(totalBanked)} sub="Confirmed by finance" icon={TrendingUp} />
                <StatCard label="Average per service" value={formatCurrency(avgOffering)} sub="Per service" icon={BarChart2} />
                <StatCard
                  label="Discrepancy"
                  value={formatCurrency(discrepancy)}
                  sub={discrepancy === 0 ? "All balanced" : "Unreconciled amount"}
                  trend={discrepancy === 0 ? "neutral" : "down"}
                  icon={TrendingDown}
                />
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">Offering collected by {period === "monthly" ? "month" : period === "quarterly" ? "quarter" : "year"}</h2>
                </div>
                <p className="text-xs text-stone-400 dark:text-neutral-500 mb-2">Total offering collected (₦)</p>
                <BarChart data={offeringChartData} maxVal={offeringMax} color="bg-amber-500 dark:bg-amber-400" label="₦" />
              </div>

              {/* Ushering vs Finance note */}
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl px-5 py-4 mb-4">
                <BarChart2 size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Two-source offering tracking</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    <strong>Ushering Unit</strong> records what was collected at the service.
                    <strong> Finance Unit</strong> records what was banked. Any discrepancy between both figures is flagged here for reconciliation.
                  </p>
                </div>
              </div>

              {/* Raw table */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white">Offering records</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 dark:border-neutral-800">
                        {["Date", "Service type", "Collected (Ushering)", "Banked (Finance)", "Difference"].map((h) => (
                          <th key={h} className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:px-5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                      {filteredOffering.map((r, i) => {
                        const diff = r.collected - r.banked;
                        return (
                          <tr key={i} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                            <td className="px-5 py-3 text-sm font-medium text-stone-800 dark:text-neutral-200 whitespace-nowrap">{formatDate(r.date)}</td>
                            <td className="px-4 py-3 text-sm text-stone-500 dark:text-neutral-400">{r.serviceType}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-stone-900 dark:text-white">{formatCurrency(r.collected)}</td>
                            <td className="px-4 py-3 text-sm text-stone-700 dark:text-neutral-300">{formatCurrency(r.banked)}</td>
                            <td className="px-4 py-3">
                              {diff === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                                  Balanced
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                                  {formatCurrency(diff)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                  <p className="text-xs text-stone-400 dark:text-neutral-500">{filteredOffering.length} records</p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}