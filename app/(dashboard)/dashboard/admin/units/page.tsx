"use client";

import { useState } from "react";
import {
  Search, PlusCircle, Pencil, Trash2, Building2,
  ChevronDown, X, AlertCircle, Loader2, CheckCircle2,
  Clock, Users, FileText,
} from "lucide-react";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
interface Unit {
  id: string;
  name: string;
  coreLeaderId: string;
  coreLeaderName: string;
  headName: string;
  totalReports: number;
  pendingReports: number;
  createdAt: string;
}

interface UnitForm {
  name: string;
  coreLeaderId: string;
  headId: string;
}

// ── Mock data ──────────────────────────────────────────
const MOCK_CORE_LEADERS = [
  { id: "cl1", name: "Br. Oluwole" },
  { id: "cl2", name: "Sis. Ifeoma" },
  { id: "cl3", name: "Deac. Adeyemi" },
];

const MOCK_UNIT_HEADS = [
  { id: "uh1", name: "Adeola Obi" },
  { id: "uh2", name: "Kemi Adeyemi" },
  { id: "uh3", name: "Tunde Fadeyi" },
  { id: "uh4", name: "Sola Bello" },
  { id: "uh5", name: "Nike Ojo" },
  { id: "uh6", name: "Unassigned" },
];

const MOCK_UNITS: Unit[] = [
  { id: "u1", name: "Music Unit",    coreLeaderId: "cl1", coreLeaderName: "Br. Oluwole",   headName: "Adeola Obi",   totalReports: 12, pendingReports: 2, createdAt: "2026-01-05" },
  { id: "u2", name: "Media Unit",    coreLeaderId: "cl1", coreLeaderName: "Br. Oluwole",   headName: "Kemi Adeyemi", totalReports: 8,  pendingReports: 1, createdAt: "2026-01-05" },
  { id: "u3", name: "Ushering Unit", coreLeaderId: "cl2", coreLeaderName: "Sis. Ifeoma",   headName: "Tunde Fadeyi", totalReports: 7,  pendingReports: 2, createdAt: "2026-01-06" },
  { id: "u4", name: "Protocol Unit", coreLeaderId: "cl2", coreLeaderName: "Sis. Ifeoma",   headName: "Sola Bello",   totalReports: 5,  pendingReports: 0, createdAt: "2026-01-08" },
  { id: "u5", name: "Welfare Unit",  coreLeaderId: "cl3", coreLeaderName: "Deac. Adeyemi", headName: "Nike Ojo",     totalReports: 3,  pendingReports: 1, createdAt: "2026-01-10" },
];

const MOCK_USER = { name: "Pastor Adewale", role: "ADMIN" as const };
const EMPTY_FORM: UnitForm = { name: "", coreLeaderId: "", headId: "" };

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Skeleton ───────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-3.5 rounded" style={{ width: `${40 + Math.random() * 50}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Confirm delete modal ───────────────────────────────
function ConfirmDeleteModal({ unit, onConfirm, onCancel, isDeleting }: {
  unit: Unit; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 mb-4 mx-auto">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-white text-center mb-1">Delete unit?</h3>
        <p className="text-sm text-stone-500 dark:text-neutral-400 text-center mb-2">
          <span className="font-medium text-stone-800 dark:text-neutral-200">{unit.name}</span> and all its data will be permanently removed.
        </p>
        {unit.totalReports > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl px-3 py-2.5 mb-4">
            <AlertCircle size={13} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This unit has {unit.totalReports} report{unit.totalReports !== 1 ? "s" : ""}. Deleting it will orphan those records.
            </p>
          </div>
        )}
        <div className="flex gap-3 mt-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {isDeleting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Unit modal ─────────────────────────────────────────
function UnitModal({ mode, initial, onSave, onClose, isSaving }: {
  mode: "create" | "edit"; initial: UnitForm;
  onSave: (form: UnitForm) => void; onClose: () => void; isSaving: boolean;
}) {
  const [form, setForm] = useState<UnitForm>(initial);
  const [errors, setErrors] = useState<Partial<UnitForm>>({});

  function update(field: keyof UnitForm, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate() {
    const e: Partial<UnitForm> = {};
    if (!form.name.trim()) e.name = "Unit name is required";
    if (!form.coreLeaderId) e.coreLeaderId = "Please assign a core leader";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
              {mode === "create" ? "Create new unit" : "Edit unit"}
            </h3>
            <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">
              {mode === "create" ? "Add a new church unit to the system" : "Update this unit's details"}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Unit name */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
              Unit name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Music Unit"
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-colors bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400
                  ${errors.name ? "border-red-400 dark:border-red-700" : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"}`} />
            </div>
            {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5"><AlertCircle size={11} />{errors.name}</p>}
          </div>

          {/* Core leader */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
              Assign core leader <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <select value={form.coreLeaderId} onChange={(e) => update("coreLeaderId", e.target.value)}
                className={`w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border outline-none bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white appearance-none cursor-pointer transition-colors
                  ${errors.coreLeaderId ? "border-red-400 dark:border-red-700" : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"}`}>
                <option value="">Select a core leader</option>
                {MOCK_CORE_LEADERS.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
            {errors.coreLeaderId && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5"><AlertCircle size={11} />{errors.coreLeaderId}</p>}
          </div>

          {/* Unit head */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
              Assign unit head <span className="text-stone-400 dark:text-neutral-500 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <select value={form.headId} onChange={(e) => update("headId", e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-neutral-700 outline-none bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white appearance-none cursor-pointer focus:border-stone-400 dark:focus:border-neutral-500 transition-colors">
                <option value="">Select a unit head</option>
                {MOCK_UNIT_HEADS.map((uh) => <option key={uh.id} value={uh.id}>{uh.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded-xl px-3.5 py-3">
            <AlertCircle size={13} className="text-stone-400 dark:text-neutral-500 mt-0.5 shrink-0" />
            <p className="text-xs text-stone-500 dark:text-neutral-400 leading-relaxed">
              The unit head must already have an account in the system. You can also assign them later by editing their user profile.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-stone-100 dark:border-neutral-800">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-all">
            Cancel
          </button>
          <button onClick={() => { if (validate()) onSave(form); }} disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
            {isSaving ? <><Loader2 size={14} className="animate-spin" />{mode === "create" ? "Creating…" : "Saving…"}</> : mode === "create" ? "Create unit" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function AdminUnitsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>(MOCK_UNITS);
  const [search, setSearch] = useState("");
  const [leaderFilter, setLeaderFilter] = useState("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = units.filter((u) => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.headName.toLowerCase().includes(search.toLowerCase()) ||
      u.coreLeaderName.toLowerCase().includes(search.toLowerCase());
    const ml = leaderFilter === "all" || u.coreLeaderId === leaderFilter;
    return ms && ml;
  });

  const totalReports = units.reduce((a, u) => a + u.totalReports, 0);
  const totalPending = units.reduce((a, u) => a + u.pendingReports, 0);

  async function handleSave(form: UnitForm) {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    const leader = MOCK_CORE_LEADERS.find((cl) => cl.id === form.coreLeaderId);
    const head = MOCK_UNIT_HEADS.find((uh) => uh.id === form.headId);
    if (modalMode === "create") {
      const newUnit: Unit = {
        id: `u${Date.now()}`, name: form.name,
        coreLeaderId: form.coreLeaderId, coreLeaderName: leader?.name ?? "—",
        headName: head?.name ?? "Unassigned",
        totalReports: 0, pendingReports: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUnits((p) => [newUnit, ...p]);
      showToast("Unit created successfully");
    } else if (editingUnit) {
      setUnits((p) => p.map((u) => u.id === editingUnit.id
        ? { ...u, name: form.name, coreLeaderId: form.coreLeaderId, coreLeaderName: leader?.name ?? u.coreLeaderName, headName: head?.name ?? u.headName }
        : u));
      showToast("Unit updated successfully");
    }
    setIsSaving(false);
    setModalMode(null);
    setEditingUnit(null);
  }

  async function handleDelete() {
    if (!deletingUnit) return;
    setIsDeleting(true);
    await new Promise((r) => setTimeout(r, 900));
    setUnits((p) => p.filter((u) => u.id !== deletingUnit.id));
    setDeletingUnit(null);
    setIsDeleting(false);
    showToast("Unit deleted");
  }

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">

          {/* Toast */}
          {toast && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl shadow-lg fade-up">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">{toast}</p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">Unit management</h1>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">Manage all church units and their assignments</p>
            </div>
            <button onClick={() => setModalMode("create")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 transition-all active:scale-[0.98] shrink-0">
              <PlusCircle size={15} />Create unit
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Total units</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{units.length}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Total reports</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{totalReports}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Pending review</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{totalPending}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                All units
                <span className="ml-2 text-stone-400 dark:text-neutral-500 font-normal text-xs">({filtered.length})</span>
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input type="text" placeholder="Search units…" value={search} onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-44" />
                </div>
                <div className="relative">
                  <Users size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <select value={leaderFilter} onChange={(e) => setLeaderFilter(e.target.value)}
                    className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none appearance-none cursor-pointer focus:border-stone-400 dark:focus:border-neutral-500 transition-colors">
                    <option value="all">All core leaders</option>
                    {MOCK_CORE_LEADERS.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    {["Unit", "Unit head", "Core leader", "Reports", "Pending", "Created", "Actions"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {isLoading ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />) :
                    filtered.length === 0 ? (
                      <tr><td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <Building2 size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">No units found</p>
                          <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                            {search || leaderFilter !== "all" ? "Try adjusting your filters" : "Create your first unit to get started"}
                          </p>
                          {!search && leaderFilter === "all" && (
                            <button onClick={() => setModalMode("create")}
                              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-85 transition-all">
                              <PlusCircle size={13} />Create unit
                            </button>
                          )}
                        </div>
                      </td></tr>
                    ) : filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                              <Building2 size={14} className="text-stone-500 dark:text-neutral-400" />
                            </div>
                            <span className="text-sm font-medium text-stone-800 dark:text-neutral-200">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-600 dark:text-neutral-400">{u.headName}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                            <Users size={10} />{u.coreLeaderName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-sm text-stone-600 dark:text-neutral-400">
                            <FileText size={12} className="text-stone-400" />{u.totalReports}
                          </span>
                        </td>
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
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { setEditingUnit(u); setModalMode("edit"); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all">
                              <Pencil size={11} />Edit
                            </button>
                            <button onClick={() => setDeletingUnit(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900 transition-all">
                              <Trash2 size={11} />Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {!isLoading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800">
                <p className="text-xs text-stone-400 dark:text-neutral-500">{filtered.length} unit{filtered.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {modalMode && (
        <UnitModal
          mode={modalMode}
          initial={editingUnit
            ? { name: editingUnit.name, coreLeaderId: editingUnit.coreLeaderId, headId: "" }
            : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => { setModalMode(null); setEditingUnit(null); }}
          isSaving={isSaving}
        />
      )}
      {deletingUnit && (
        <ConfirmDeleteModal unit={deletingUnit} onConfirm={handleDelete} onCancel={() => setDeletingUnit(null)} isDeleting={isDeleting} />
      )}
    </div>
  );
}