"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import {
  CREATE_USER_MUTATION,
  DELETE_USER_MUTATION,
  UPDATE_USER_MUTATION,
  USERS_PAGE_QUERY,
} from "@/src/lib/graphqlDocuments";
import { formatDate, getInitials } from "@/src/lib/dashboardHelpers";

type UserRole = "UNIT_HEAD" | "CORE_LEADER" | "ADMIN";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unitId?: string | null;
  unit?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface UnitOption {
  id: string;
  name: string;
  unitHead?: {
    id: string;
    name: string;
  } | null;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UsersPageData {
  me: CurrentUser | null;
  users: AdminUser[];
  units: UnitOption[];
}

interface UserForm {
  name: string;
  email: string;
  role: UserRole;
  unitId: string;
  password: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  UNIT_HEAD: "Unit Head",
  CORE_LEADER: "Core Leader",
  ADMIN: "Pastorate",
};

const ROLE_COLORS: Record<UserRole, string> = {
  UNIT_HEAD: "bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400",
  CORE_LEADER: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
  ADMIN: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
};

const EMPTY_FORM: UserForm = {
  name: "",
  email: "",
  role: "UNIT_HEAD",
  unitId: "",
  password: "",
};

const SKELETON_WIDTHS = ["72%", "88%", "64%", "80%", "58%"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function SkeletonRow() {
  return (
    <tr>
      {SKELETON_WIDTHS.map((width, index) => (
        <td key={index} className="px-4 py-3.5">
          <div className="h-3.5 rounded bg-stone-200 dark:bg-neutral-800" style={{ width }} />
        </td>
      ))}
    </tr>
  );
}

function ConfirmDeleteModal({
  user,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  user: AdminUser;
  onConfirm: () => void;
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
          Remove user?
        </h3>
        <p className="mb-6 text-center text-sm text-stone-500 dark:text-neutral-400">
          <span className="font-medium text-stone-800 dark:text-neutral-200">{user.name}</span>{" "}
          will lose access to the system.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Removing...
              </>
            ) : (
              "Yes, remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserModal({
  mode,
  initial,
  units,
  onSave,
  onClose,
  isSaving,
}: {
  mode: "create" | "edit";
  initial: UserForm;
  units: UnitOption[];
  onSave: (form: UserForm) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<UserForm>(initial);
  const [errors, setErrors] = useState<Partial<UserForm>>({});

  function update(field: keyof UserForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors: Partial<UserForm> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = "Invalid email";
    if (mode === "create" && !form.password) nextErrors.password = "Password is required";
    if (form.role === "UNIT_HEAD" && !form.unitId) nextErrors.unitId = "Please assign a unit";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-stone-100 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
              {mode === "create" ? "Add new user" : "Edit user"}
            </h3>
            <p className="mt-0.5 text-xs text-stone-400 dark:text-neutral-500">
              {mode === "create" ? "Create a new account" : "Update user details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
              Full name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
              />
              <input
                type="text"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g. Adeola Obi"
                className={`w-full rounded-xl border bg-stone-50 py-2.5 pl-9 pr-4 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 ${
                  errors.name
                    ? "border-red-400 dark:border-red-700"
                    : "border-stone-200 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                <AlertCircle size={11} />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
              Email address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="e.g. adeola@church.org"
                className={`w-full rounded-xl border bg-stone-50 py-2.5 pl-9 pr-4 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 ${
                  errors.email
                    ? "border-red-400 dark:border-red-700"
                    : "border-stone-200 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                <AlertCircle size={11} />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
              Role <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <ShieldCheck
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
              />
              <select
                value={form.role}
                onChange={(event) => {
                  update("role", event.target.value);
                  update("unitId", "");
                }}
                className="w-full cursor-pointer appearance-none rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-8 text-sm text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
              >
                <option value="UNIT_HEAD">Unit Head</option>
                <option value="CORE_LEADER">Core Leader</option>
                <option value="ADMIN">Pastorate (Admin)</option>
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
            </div>
          </div>

          {form.role === "UNIT_HEAD" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
                Assigned unit <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-neutral-500"
                />
                <select
                  value={form.unitId}
                  onChange={(event) => update("unitId", event.target.value)}
                  className={`w-full cursor-pointer appearance-none rounded-xl border bg-stone-50 py-2.5 pl-9 pr-8 text-sm text-stone-900 outline-none transition-colors dark:bg-neutral-800 dark:text-white ${
                    errors.unitId
                      ? "border-red-400 dark:border-red-700"
                      : "border-stone-200 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                  }`}
                >
                  <option value="">Select a unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
              </div>
              {errors.unitId && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={11} />
                  {errors.unitId}
                </p>
              )}
            </div>
          )}

          {mode === "create" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                placeholder="Set initial password"
                className={`w-full rounded-xl border bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 ${
                  errors.password
                    ? "border-red-400 dark:border-red-700"
                    : "border-stone-200 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                }`}
              />
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={11} />
                  {errors.password}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-2xl border-t border-stone-100 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            onClick={onClose}
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (validate()) onSave(form);
            }}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {mode === "create" ? "Creating..." : "Saving..."}
              </>
            ) : mode === "create" ? (
              "Create user"
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<UsersPageData>(USERS_PAGE_QUERY, {
    fetchPolicy: "network-only",
  });

  const [createUser, { loading: isCreating }] = useMutation<
    { createUser: AdminUser },
    { input: { name: string; email: string; password: string; role: UserRole; unitId?: string | null } }
  >(CREATE_USER_MUTATION);
  const [updateUser, { loading: isUpdating }] = useMutation<
    { updateUser: AdminUser },
    {
      id: string;
      input: {
        name: string;
        email: string;
        password?: string | null;
        role: UserRole;
        unitId?: string | null;
      };
    }
  >(UPDATE_USER_MUTATION);
  const [deleteUser, { loading: isDeleting }] = useMutation<
    { deleteUser: boolean },
    { id: string }
  >(DELETE_USER_MUTATION);

  const me = data?.me ?? null;
  const users = useMemo(() => data?.users ?? [], [data?.users]);
  const units = data?.units ?? [];
  const isSaving = isCreating || isUpdating;
  const sidebarUser = { name: me?.name ?? "Admin", role: me?.role ?? "ADMIN" };

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const query = search.toLowerCase();
        const matchesSearch =
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.unit?.name ?? "").toLowerCase().includes(query);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
      }),
    [roleFilter, search, users]
  );

  const unitHeads = users.filter((user) => user.role === "UNIT_HEAD").length;
  const coreLeaders = users.filter((user) => user.role === "CORE_LEADER").length;
  const admins = users.filter((user) => user.role === "ADMIN").length;

  async function handleSave(form: UserForm) {
    setErrorMessage(null);

    try {
      const input = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        unitId: form.role === "UNIT_HEAD" ? form.unitId : null,
      };

      if (modalMode === "create") {
        await createUser({
          variables: {
            input: {
              ...input,
              password: form.password,
            },
          },
        });
        showToast("User created successfully");
      } else if (editingUser) {
        await updateUser({
          variables: {
            id: editingUser.id,
            input: {
              ...input,
              password: form.password || null,
            },
          },
        });
        showToast("User updated successfully");
      }

      await refetch();
      setModalMode(null);
      setEditingUser(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setErrorMessage(null);

    try {
      await deleteUser({ variables: { id: deletingUser.id } });
      await refetch();
      setDeletingUser(null);
      showToast("User removed");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setModalMode("edit");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          {toast && (
            <div className="fixed right-4 top-4 z-50 flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">{toast}</p>
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                User management
              </h1>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
                Manage system access, roles, and unit assignments
              </p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setModalMode("create");
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-700 active:scale-[0.98] dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
            >
              <UserPlus size={15} />
              Add user
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <p className="text-xs text-red-700 dark:text-red-400">{errorMessage}</p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Unit heads</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{unitHeads}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Core leaders</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {coreLeaders}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Pastorate</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {admins}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col justify-between gap-3 border-b border-stone-100 px-5 py-4 dark:border-neutral-800 sm:flex-row sm:items-center">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                All users
                <span className="ml-2 text-xs font-normal text-stone-400 dark:text-neutral-500">
                  ({filteredUsers.length})
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-52 rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500"
                  />
                </div>
                <div className="relative">
                  <ShieldCheck
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}
                    className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  >
                    <option value="all">All roles</option>
                    <option value="UNIT_HEAD">Unit Head</option>
                    <option value="CORE_LEADER">Core Leader</option>
                    <option value="ADMIN">Pastorate</option>
                  </select>
                  <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-neutral-800">
                    {["User", "Email", "Role", "Assigned unit", "Joined", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 first:px-5 dark:text-neutral-500"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-neutral-800/60">
                  {loading ? (
                    [...Array(6)].map((_, index) => <SkeletonRow key={index} />)
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                            <Users size={18} className="text-stone-400 dark:text-neutral-500" />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            No users found
                          </p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                            Try a different search or filter
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">
                              {getInitials(user.name)}
                            </div>
                            <span className="text-sm font-medium text-stone-800 dark:text-neutral-200">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {user.email}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${ROLE_COLORS[user.role]}`}
                          >
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {user.unit ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 size={11} className="text-stone-400" />
                              {user.unit.name}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(user)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                            >
                              <Pencil size={11} />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:border-red-200 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:border-red-900 dark:hover:bg-red-950/40"
                            >
                              <Trash2 size={11} />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {modalMode && (
        <UserModal
          mode={modalMode}
          initial={
            editingUser
              ? {
                  name: editingUser.name,
                  email: editingUser.email,
                  role: editingUser.role,
                  unitId: editingUser.unitId ?? "",
                  password: "",
                }
              : EMPTY_FORM
          }
          units={units}
          onSave={handleSave}
          onClose={() => {
            setModalMode(null);
            setEditingUser(null);
          }}
          isSaving={isSaving}
        />
      )}
      {deletingUser && (
        <ConfirmDeleteModal
          user={deletingUser}
          onConfirm={handleDelete}
          onCancel={() => setDeletingUser(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
