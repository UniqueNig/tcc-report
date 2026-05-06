"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import {
  CREATE_UNIT_MUTATION,
  DELETE_UNIT_MUTATION,
  UNITS_PAGE_QUERY,
  UPDATE_UNIT_MUTATION,
} from "@/src/lib/graphqlDocuments";
import { formatDate } from "@/src/lib/dashboardHelpers";

type UserRole = "UNIT_HEAD" | "CORE_LEADER" | "ADMIN";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UnitAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unitId?: string | null;
  unit?: {
    id: string;
    name: string;
  } | null;
}

interface AdminUnit {
  id: string;
  name: string;
  coreLeaderId: string;
  coreLeader?: {
    id: string;
    name: string;
    email: string;
  } | null;
  unitHead?: {
    id: string;
    name: string;
    email: string;
  } | null;
  reportCount: number;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UnitsPageData {
  me: CurrentUser | null;
  units: AdminUnit[];
  coreLeaders: UnitAccount[];
  unitHeads: UnitAccount[];
}

interface UnitForm {
  name: string;
  coreLeaderId: string;
  headId: string;
}

const EMPTY_FORM: UnitForm = {
  name: "",
  coreLeaderId: "",
  headId: "",
};

const SKELETON_WIDTHS = ["64%", "82%", "58%", "76%", "49%", "68%"];

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
  unit,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  unit: AdminUnit;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  const hasReports = unit.reportCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="mb-1 text-center text-base font-semibold text-stone-900 dark:text-white">
          Delete unit?
        </h3>
        <p className="mb-2 text-center text-sm text-stone-500 dark:text-neutral-400">
          <span className="font-medium text-stone-800 dark:text-neutral-200">{unit.name}</span>{" "}
          will be removed from the system.
        </p>
        {hasReports && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950/30">
            <AlertCircle
              size={13}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This unit has {unit.reportCount} report{unit.reportCount !== 1 ? "s" : ""}. Units
              with existing reports cannot be deleted.
            </p>
          </div>
        )}
        <div className="mt-2 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting || hasReports}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Deleting...
              </>
            ) : hasReports ? (
              "Cannot delete"
            ) : (
              "Yes, delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitModal({
  mode,
  initial,
  coreLeaders,
  unitHeads,
  editingUnitId,
  onSave,
  onClose,
  isSaving,
}: {
  mode: "create" | "edit";
  initial: UnitForm;
  coreLeaders: UnitAccount[];
  unitHeads: UnitAccount[];
  editingUnitId?: string;
  onSave: (form: UnitForm) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<UnitForm>(initial);
  const [errors, setErrors] = useState<Partial<UnitForm>>({});

  function update(field: keyof UnitForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors: Partial<UnitForm> = {};
    if (!form.name.trim()) nextErrors.name = "Unit name is required";
    if (!form.coreLeaderId) nextErrors.coreLeaderId = "Please assign a core leader";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
              {mode === "create" ? "Create new unit" : "Edit unit"}
            </h3>
            <p className="mt-0.5 text-xs text-stone-400 dark:text-neutral-500">
              {mode === "create" ? "Add a new church unit" : "Update this unit's details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-neutral-800"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
              Unit name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g. Music Unit"
                className={`w-full rounded-xl border bg-stone-50 py-2.5 pl-9 pr-4 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 dark:bg-neutral-800 dark:text-white ${
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
              Assign core leader <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Users
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <select
                value={form.coreLeaderId}
                onChange={(event) => update("coreLeaderId", event.target.value)}
                className={`w-full cursor-pointer appearance-none rounded-xl border bg-stone-50 py-2.5 pl-9 pr-8 text-sm text-stone-900 outline-none transition-colors dark:bg-neutral-800 dark:text-white ${
                  errors.coreLeaderId
                    ? "border-red-400 dark:border-red-700"
                    : "border-stone-200 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                }`}
              >
                <option value="">Select a core leader</option>
                {coreLeaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
            </div>
            {errors.coreLeaderId && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                <AlertCircle size={11} />
                {errors.coreLeaderId}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
              Assign unit head{" "}
              <span className="font-normal text-stone-400 dark:text-neutral-500">(optional)</span>
            </label>
            <div className="relative">
              <Users
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <select
                value={form.headId}
                onChange={(event) => update("headId", event.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-8 text-sm text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
              >
                <option value="">No unit head</option>
                {unitHeads.map((head) => {
                  const assignment = head.unit
                    ? head.unit.id === editingUnitId
                      ? "current head"
                      : `assigned to ${head.unit.name}`
                    : "unassigned";

                  return (
                    <option key={head.id} value={head.id}>
                      {head.name} - {assignment}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 dark:border-neutral-700 dark:bg-neutral-800">
            <AlertCircle
              size={13}
              className="mt-0.5 shrink-0 text-stone-400 dark:text-neutral-500"
            />
            <p className="text-xs leading-relaxed text-stone-500 dark:text-neutral-400">
              Assigning a unit head moves that account to this unit. Leave it empty to keep the
              unit without a head.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-6 py-4 dark:border-neutral-800">
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
              "Create unit"
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUnitsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [leaderFilter, setLeaderFilter] = useState("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUnit, setEditingUnit] = useState<AdminUnit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<AdminUnit | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<UnitsPageData>(UNITS_PAGE_QUERY, {
    fetchPolicy: "network-only",
  });

  const [createUnit, { loading: isCreating }] = useMutation<
    { createUnit: AdminUnit },
    { input: { name: string; coreLeaderId: string; headId?: string | null } }
  >(CREATE_UNIT_MUTATION);
  const [updateUnit, { loading: isUpdating }] = useMutation<
    { updateUnit: AdminUnit },
    { id: string; input: { name: string; coreLeaderId: string; headId?: string | null } }
  >(UPDATE_UNIT_MUTATION);
  const [deleteUnit, { loading: isDeleting }] = useMutation<
    { deleteUnit: boolean },
    { id: string }
  >(DELETE_UNIT_MUTATION);

  const me = data?.me ?? null;
  const units = useMemo(() => data?.units ?? [], [data?.units]);
  const coreLeaders = data?.coreLeaders ?? [];
  const unitHeads = data?.unitHeads ?? [];
  const isSaving = isCreating || isUpdating;
  const sidebarUser = { name: me?.name ?? "Admin", role: me?.role ?? "ADMIN" };

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  const filteredUnits = useMemo(
    () =>
      units.filter((unit) => {
        const query = search.toLowerCase();
        const matchesSearch =
          unit.name.toLowerCase().includes(query) ||
          (unit.unitHead?.name ?? "").toLowerCase().includes(query) ||
          (unit.coreLeader?.name ?? "").toLowerCase().includes(query);
        const matchesLeader = leaderFilter === "all" || unit.coreLeaderId === leaderFilter;
        return matchesSearch && matchesLeader;
      }),
    [leaderFilter, search, units]
  );

  const totalReports = units.reduce((total, unit) => total + unit.reportCount, 0);
  const totalPending = units.reduce((total, unit) => total + unit.pendingCount, 0);

  async function handleSave(form: UnitForm) {
    setErrorMessage(null);

    try {
      const input = {
        name: form.name.trim(),
        coreLeaderId: form.coreLeaderId,
        headId: form.headId || null,
      };

      if (modalMode === "create") {
        await createUnit({ variables: { input } });
        showToast("Unit created successfully");
      } else if (editingUnit) {
        await updateUnit({ variables: { id: editingUnit.id, input } });
        showToast("Unit updated successfully");
      }

      await refetch();
      setModalMode(null);
      setEditingUnit(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!deletingUnit) return;
    setErrorMessage(null);

    try {
      await deleteUnit({ variables: { id: deletingUnit.id } });
      await refetch();
      setDeletingUnit(null);
      showToast("Unit deleted");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
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
                Unit management
              </h1>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-neutral-400">
                Manage church units and leadership assignments
              </p>
            </div>
            <button
              onClick={() => {
                setEditingUnit(null);
                setModalMode("create");
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-700 active:scale-[0.98] dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
            >
              <PlusCircle size={15} />
              Create unit
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
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Total units</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">{units.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Total reports</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-white">
                {totalReports}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">Pending review</p>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {totalPending}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col justify-between gap-3 border-b border-stone-100 px-5 py-4 dark:border-neutral-800 sm:flex-row sm:items-center">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                All units
                <span className="ml-2 text-xs font-normal text-stone-400 dark:text-neutral-500">
                  ({filteredUnits.length})
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
                    placeholder="Search units..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-44 rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  />
                </div>
                <div className="relative">
                  <Users
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <select
                    value={leaderFilter}
                    onChange={(event) => setLeaderFilter(event.target.value)}
                    className="cursor-pointer appearance-none rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-7 text-xs text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-500"
                  >
                    <option value="all">All core leaders</option>
                    {coreLeaders.map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name}
                      </option>
                    ))}
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
                    {["Unit", "Unit head", "Core leader", "Reports", "Pending", "Created", "Actions"].map(
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
                    [...Array(5)].map((_, index) => <SkeletonRow key={index} />)
                  ) : filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                            <Building2
                              size={18}
                              className="text-stone-400 dark:text-neutral-500"
                            />
                          </div>
                          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                            No units found
                          </p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                            {search || leaderFilter !== "all"
                              ? "Try adjusting your filters"
                              : "Create your first unit to get started"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((unit) => (
                      <tr
                        key={unit.id}
                        className="transition-colors hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                              <Building2
                                size={14}
                                className="text-stone-500 dark:text-neutral-400"
                              />
                            </div>
                            <span className="text-sm font-medium text-stone-800 dark:text-neutral-200">
                              {unit.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-600 dark:text-neutral-400">
                          {unit.unitHead?.name ?? "Unassigned"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                            <Users size={10} />
                            {unit.coreLeader?.name ?? "Unassigned"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-sm text-stone-600 dark:text-neutral-400">
                            <FileText size={12} className="text-stone-400" />
                            {unit.reportCount}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {unit.pendingCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                              <Clock size={10} />
                              {unit.pendingCount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                              <CheckCircle2 size={10} />
                              Clear
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-stone-500 dark:text-neutral-400">
                          {formatDate(unit.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingUnit(unit);
                                setModalMode("edit");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                            >
                              <Pencil size={11} />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingUnit(unit)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:border-red-200 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:border-red-900 dark:hover:bg-red-950/40"
                            >
                              <Trash2 size={11} />
                              Delete
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
        <UnitModal
          mode={modalMode}
          initial={
            editingUnit
              ? {
                  name: editingUnit.name,
                  coreLeaderId: editingUnit.coreLeaderId,
                  headId: editingUnit.unitHead?.id ?? "",
                }
              : EMPTY_FORM
          }
          coreLeaders={coreLeaders}
          unitHeads={unitHeads}
          editingUnitId={editingUnit?.id}
          onSave={handleSave}
          onClose={() => {
            setModalMode(null);
            setEditingUnit(null);
          }}
          isSaving={isSaving}
        />
      )}
      {deletingUnit && (
        <ConfirmDeleteModal
          unit={deletingUnit}
          onConfirm={handleDelete}
          onCancel={() => setDeletingUnit(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
