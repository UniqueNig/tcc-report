"use client";

import { useState } from "react";
import {
  Building2, User, CheckCircle2, Clock, AlertCircle,
  ChevronRight, FileText, Search, Users,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

interface UnitReport {
  id: string; title: string; dateSubmitted: string; status: "pending" | "reviewed";
}
interface Unit {
  id: string; name: string; headName: string; headEmail: string;
  totalReports: number; pendingReports: number; lastSubmission: string | null;
  recentReports: UnitReport[];
}

const MOCK_UNITS: Unit[] = [
  {
    id: "u1", name: "Music Unit", headName: "Adeola Obi", headEmail: "adeola@church.org",
    totalReports: 12, pendingReports: 2, lastSubmission: "2026-05-04",
    recentReports: [
      { id: "1", title: "Sunday Service — May 4",  dateSubmitted: "2026-05-04", status: "pending"  },
      { id: "4", title: "Midweek — Apr 30",        dateSubmitted: "2026-04-30", status: "reviewed" },
      { id: "7", title: "Sunday Service — Apr 27", dateSubmitted: "2026-04-27", status: "reviewed" },
    ],
  },
  {
    id: "u2", name: "Media Unit", headName: "Kemi Adeyemi", headEmail: "kemi@church.org",
    totalReports: 8, pendingReports: 1, lastSubmission: "2026-05-04",
    recentReports: [
      { id: "2", title: "Sunday Service — May 4",  dateSubmitted: "2026-05-04", status: "pending"  },
      { id: "5", title: "Midweek — Apr 30",        dateSubmitted: "2026-04-30", status: "reviewed" },
      { id: "8", title: "Sunday Service — Apr 27", dateSubmitted: "2026-04-27", status: "reviewed" },
    ],
  },
  {
    id: "u3", name: "Ushering Unit", headName: "Tunde Fadeyi", headEmail: "tunde@church.org",
    totalReports: 7, pendingReports: 2, lastSubmission: "2026-05-04",
    recentReports: [
      { id: "3", title: "Sunday Service — May 4",  dateSubmitted: "2026-05-04", status: "pending"  },
      { id: "6", title: "Midweek — Apr 30",        dateSubmitted: "2026-04-30", status: "pending"  },
      { id: "9", title: "Sunday Service — Apr 27", dateSubmitted: "2026-04-27", status: "reviewed" },
    ],
  },
];

const MOCK_USER = { name: "Br. Oluwole", role: "CORE_LEADER" as const };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function StatusPill({ status }: { status: "pending" | "reviewed" }) {
  if (status === "reviewed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
      <CheckCircle2 size={9} />Reviewed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
      <Clock size={9} />Pending
    </span>
  );
}

function SkeletonUnitCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-3 w-36 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg mb-2" />)}
    </div>
  );
}

export default function CoreLeaderUnitsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [search, setSearch] = useState("");
  const totalPending = MOCK_UNITS.reduce((a, u) => a + u.pendingReports, 0);

  const filtered = MOCK_UNITS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.headName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} notificationCount={totalPending} />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">

          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">My units</h1>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">
                {MOCK_UNITS.length} unit{MOCK_UNITS.length !== 1 ? "s" : ""} under your oversight
              </p>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="text" placeholder="Search units…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-white placeholder-stone-400 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-44" />
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Total units</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{MOCK_UNITS.length}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Total reports</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{MOCK_UNITS.reduce((a, u) => a + u.totalReports, 0)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Pending review</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{totalPending}</p>
            </div>
          </div>

          {/* Units */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SkeletonUnitCard /><SkeletonUnitCard /><SkeletonUnitCard />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <Users size={20} className="text-stone-400 dark:text-neutral-500" />
              </div>
              <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                {search ? "No units match your search" : "No units assigned yet"}
              </p>
              <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                {search ? "Try a different name" : "Contact your admin to get units assigned"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((unit) => (
                <div key={unit.id} className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">

                  {/* Unit header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-stone-500 dark:text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900 dark:text-white">{unit.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-[8px] font-bold text-stone-600 dark:text-neutral-400 select-none">
                            {getInitials(unit.headName)}
                          </div>
                          <p className="text-xs text-stone-400 dark:text-neutral-500">{unit.headName}</p>
                        </div>
                      </div>
                    </div>
                    {unit.pendingReports > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 shrink-0">
                        <Clock size={10} />{unit.pendingReports} pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 size={10} />All reviewed
                      </span>
                    )}
                  </div>

                  {/* Stats strip */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-stone-50 dark:bg-neutral-800 rounded-xl px-3 py-2.5 text-center">
                      <p className="text-lg font-semibold text-stone-900 dark:text-white">{unit.totalReports}</p>
                      <p className="text-[10px] text-stone-400 dark:text-neutral-500 mt-0.5">Total</p>
                    </div>
                    <div className="bg-stone-50 dark:bg-neutral-800 rounded-xl px-3 py-2.5 text-center">
                      <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{unit.pendingReports}</p>
                      <p className="text-[10px] text-stone-400 dark:text-neutral-500 mt-0.5">Pending</p>
                    </div>
                    <div className="bg-stone-50 dark:bg-neutral-800 rounded-xl px-3 py-2.5 text-center">
                      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{unit.totalReports - unit.pendingReports}</p>
                      <p className="text-[10px] text-stone-400 dark:text-neutral-500 mt-0.5">Reviewed</p>
                    </div>
                  </div>

                  {/* Last submission */}
                  {unit.lastSubmission && (
                    <p className="text-[11px] text-stone-400 dark:text-neutral-500 mb-3">
                      Last submission: <span className="font-medium text-stone-600 dark:text-neutral-400">{formatDate(unit.lastSubmission)}</span>
                    </p>
                  )}

                  {/* Recent reports */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-[10px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Recent reports</p>
                    {unit.recentReports.map((r) => (
                      <Link key={r.id} href={`/dashboard/core-leader/reports/${r.id}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={12} className="text-stone-400 dark:text-neutral-500 shrink-0" />
                          <span className="text-xs text-stone-700 dark:text-neutral-300 truncate group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                            {r.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusPill status={r.status} />
                          <ChevronRight size={12} className="text-stone-300 dark:text-neutral-600 group-hover:text-stone-500 dark:group-hover:text-neutral-400 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* View all */}
                  <Link href={`/dashboard/core-leader/reports?unit=${unit.id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-500 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all">
                    View all {unit.name} reports
                    <ChevronRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}