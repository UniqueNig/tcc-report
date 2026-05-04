"use client";

import { useState } from "react";
import {
  Search, UserPlus, Pencil, Trash2, ShieldCheck,
  ChevronDown, X, AlertCircle, Loader2, CheckCircle2,
  Building2, Users, Mail, User,
} from "lucide-react";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
type UserRole = "UNIT_HEAD" | "CORE_LEADER" | "ADMIN";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unit?: string;
  createdAt: string;
}

interface UserForm {
  name: string;
  email: string;
  role: UserRole;
  unit: string;
  password: string;
}

// ── Mock data ──────────────────────────────────────────
const MOCK_USERS: AppUser[] = [
  { id: "u1", name: "Adeola Obi",     email: "adeola@church.org",  role: "UNIT_HEAD",   unit: "Music Unit",    createdAt: "2026-01-10" },
  { id: "u2", name: "Kemi Adeyemi",   email: "kemi@church.org",    role: "UNIT_HEAD",   unit: "Media Unit",    createdAt: "2026-01-12" },
  { id: "u3", name: "Tunde Fadeyi",   email: "tunde@church.org",   role: "UNIT_HEAD",   unit: "Ushering Unit", createdAt: "2026-01-15" },
  { id: "u4", name: "Sola Bello",     email: "sola@church.org",    role: "UNIT_HEAD",   unit: "Protocol Unit", createdAt: "2026-01-20" },
  { id: "u5", name: "Nike Ojo",       email: "nike@church.org",    role: "UNIT_HEAD",   unit: "Welfare Unit",  createdAt: "2026-02-01" },
  { id: "u6", name: "Br. Oluwole",    email: "oluwole@church.org", role: "CORE_LEADER", unit: undefined,       createdAt: "2026-01-05" },
  { id: "u7", name: "Sis. Ifeoma",    email: "ifeoma@church.org",  role: "CORE_LEADER", unit: undefined,       createdAt: "2026-01-05" },
  { id: "u8", name: "Deac. Adeyemi",  email: "deacon@church.org",  role: "CORE_LEADER", unit: undefined,       createdAt: "2026-01-06" },
  { id: "u9", name: "Pastor Adewale", email: "pastor@church.org",  role: "ADMIN",       unit: undefined,       createdAt: "2026-01-01" },
];

const UNIT_OPTIONS = ["Music Unit", "Media Unit", "Ushering Unit", "Protocol Unit", "Welfare Unit", "Children Unit"];
const MOCK_USER = { name: "Pastor Adewale", role: "ADMIN" as const };

const ROLE_LABELS: Record<UserRole, string> = {
  UNIT_HEAD: "Unit Head", CORE_LEADER: "Core Leader", ADMIN: "Pastorate",
};
const ROLE_COLORS: Record<UserRole, string> = {
  UNIT_HEAD: "bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400",
  CORE_LEADER: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
  ADMIN: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
};

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const EMPTY_FORM: UserForm = { name: "", email: "", role: "UNIT_HEAD", unit: "", password: "" };

// ── Skeleton ───────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-3.5 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Confirm delete modal ───────────────────────────────
function ConfirmDeleteModal({
  user,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  user: AppUser;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 mb-4 mx-auto">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-white text-center mb-1">Remove user?</h3>
        <p className="text-sm text-stone-500 dark:text-neutral-400 text-center mb-6">
          <span className="font-medium text-stone-800 dark:text-neutral-200">{user.name}</span> will lose access to the system. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {isDeleting ? <><Loader2 size={14} className="animate-spin" />Removing…</> : "Yes, remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User modal ─────────────────────────────────────────
function UserModal({
  mode,
  initial,
  onSave,
  onClose,
  isSaving,
}: {
  mode: "create" | "edit";
  initial: UserForm;
  onSave: (form: UserForm) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<UserForm>(initial);
  const [errors, setErrors] = useState<Partial<UserForm>>({});

  function update(field: keyof UserForm, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate() {
    const e: Partial<UserForm> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (mode === "create" && !form.password) e.password = "Password is required";
    if (form.role === "UNIT_HEAD" && !form.unit) e.unit = "Please assign a unit";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (validate()) onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 rounded-t-2xl z-10">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
              {mode === "create" ? "Add new user" : "Edit user"}
            </h3>
            <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">
              {mode === "create" ? "Create a new account" : "Update user details"}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-600 dark:hover:text-neutral-300 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
              Full name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Adeola Obi"
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-colors bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500
                  ${errors.name ? "border-red-400 dark:border-red-700" : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"}`} />
            </div>
            {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5"><AlertCircle size={11} />{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
              Email address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="e.g. adeola@church.org"
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-colors bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500
                  ${errors.email ? "border-red-400 dark:border-red-700" : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"}`} />
            </div>
            {errors.email && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5"><AlertCircle size={11} />{errors.email}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
              Role <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <ShieldCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
              <select value={form.role} onChange={(e) => { update("role", e.target.value); update("unit", ""); }}
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-neutral-700 outline-none bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white appearance-none cursor-pointer focus:border-stone-400 dark:focus:border-neutral-500 transition-colors">
                <option value="UNIT_HEAD">Unit Head</option>
                <option value="CORE_LEADER">Core Leader</option>
                <option value="ADMIN">Pastorate (Admin)</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
          </div>

          {/* Unit — only for UNIT_HEAD */}
          {form.role === "UNIT_HEAD" && (
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
                Assigned unit <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500 pointer-events-none" />
                <select value={form.unit} onChange={(e) => update("unit", e.target.value)}
                  className={`w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border outline-none bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white appearance-none cursor-pointer transition-colors
                    ${errors.unit ? "border-red-400 dark:border-red-700" : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"}`}>
                  <option value="">Select a unit</option>
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
              {errors.unit && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5"><AlertCircle size={11} />{errors.unit}</p>}
            </div>
          )}

          {/* Password — only on create */}
          {mode === "create" && (
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Set initial password"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500
                  ${errors.password ? "border-red-400 dark:border-red-700" : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"}`} />
              {errors.password && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5"><AlertCircle size={11} />{errors.password}</p>}
              <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1.5">
                User can change this after first login.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-stone-100 dark:border-neutral-800 sticky bottom-0 bg-white dark:bg-neutral-900 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
            {isSaving ? <><Loader2 size={14} className="animate-spin" />{mode === "create" ? "Creating…" : "Saving…"}</> : mode === "create" ? "Create user" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function AdminUsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = users.filter((u) => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const mr = roleFilter === "all" || u.role === roleFilter;
    return ms && mr;
  });

  const unitHeads = users.filter((u) => u.role === "UNIT_HEAD").length;
  const coreLeaders = users.filter((u) => u.role === "CORE_LEADER").length;
  const admins = users.filter((u) => u.role === "ADMIN").length;

  async function handleSave(form: UserForm) {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    if (modalMode === "create") {
      const newUser: AppUser = {
        id: `u${Date.now()}`, name: form.name, email: form.email,
        role: form.role, unit: form.unit || undefined,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUsers((p) => [newUser, ...p]);
      showToast("User created successfully");
    } else if (editingUser) {
      setUsers((p) => p.map((u) => u.id === editingUser.id
        ? { ...u, name: form.name, email: form.email, role: form.role, unit: form.unit || undefined }
        : u));
      showToast("User updated successfully");
    }
    setIsSaving(false);
    setModalMode(null);
    setEditingUser(null);
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setIsDeleting(true);
    await new Promise((r) => setTimeout(r, 900));
    setUsers((p) => p.filter((u) => u.id !== deletingUser.id));
    setDeletingUser(null);
    setIsDeleting(false);
    showToast("User removed");
  }

  function openEdit(user: AppUser) {
    setEditingUser(user);
    setModalMode("edit");
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
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">User management</h1>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mt-0.5">Manage all system users and their roles</p>
            </div>
            <button onClick={() => setModalMode("create")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 transition-all active:scale-[0.98] shrink-0">
              <UserPlus size={15} />Add user
            </button>
          </div>

          {/* Role stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Unit heads</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{unitHeads}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Core leaders</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{coreLeaders}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-4 py-4">
              <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">Pastorate</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{admins}</p>
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                All users
                <span className="ml-2 text-stone-400 dark:text-neutral-500 font-normal text-xs">({filtered.length})</span>
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input type="text" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 outline-none focus:border-stone-400 dark:focus:border-neutral-500 transition-colors w-52" />
                </div>
                <div className="relative">
                  <ShieldCheck size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white outline-none appearance-none cursor-pointer focus:border-stone-400 dark:focus:border-neutral-500 transition-colors">
                    <option value="all">All roles</option>
                    <option value="UNIT_HEAD">Unit Head</option>
                    <option value="CORE_LEADER">Core Leader</option>
                    <option value="ADMIN">Pastorate</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    {["User", "Email", "Role", "Assigned unit", "Joined", "Actions"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-3 first:px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {isLoading ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />) :
                    filtered.length === 0 ? (
                      <tr><td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <Users size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">No users found</p>
                          <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Try a different search or filter</p>
                        </div>
                      </td></tr>
                    ) : filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none">
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
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {u.unit ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 size={11} className="text-stone-400" />{u.unit}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all">
                              <Pencil size={11} />Edit
                            </button>
                            <button onClick={() => setDeletingUser(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900 transition-all">
                              <Trash2 size={11} />Remove
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
                <p className="text-xs text-stone-400 dark:text-neutral-500">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {modalMode && (
        <UserModal
          mode={modalMode}
          initial={editingUser
            ? { name: editingUser.name, email: editingUser.email, role: editingUser.role, unit: editingUser.unit ?? "", password: "" }
            : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => { setModalMode(null); setEditingUser(null); }}
          isSaving={isSaving}
        />
      )}
      {deletingUser && (
        <ConfirmDeleteModal user={deletingUser} onConfirm={handleDelete} onCancel={() => setDeletingUser(null)} isDeleting={isDeleting} />
      )}
    </div>
  );
}