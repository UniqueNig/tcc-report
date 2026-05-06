"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import { CREATE_REPORT_MUTATION, ME_QUERY } from "@/src/lib/graphqlDocuments";
import {
  toSidebarUser,
  type GraphQLUser,
  type FieldType,
} from "@/src/lib/dashboardHelpers";
import { getUnitSchema, type UnitField } from "@/src/lib/unitSchemas";

type FieldValue = string | number | boolean | string[];
type FormValues = Record<string, FieldValue | "">;
type FormErrors = Record<string, string>;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function today() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function normalizeFieldValue(field: UnitField, value: FieldValue | ""): FieldValue {
  if (field.type === "multiselect") {
    return Array.isArray(value) ? value : [];
  }

  if (field.type === "boolean") {
    return value === true;
  }

  if (field.type === "number" || field.type === "currency") {
    return typeof value === "number" ? value : 0;
  }

  return typeof value === "string" ? value : "";
}

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: UnitField;
  value: FieldValue | "";
  error?: string;
  onChange: (id: string, value: FieldValue | "") => void;
}) {
  const baseClassName = `w-full rounded-xl border bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 ${
    error
      ? "border-red-400 dark:border-red-700"
      : "border-stone-200 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
  }`;

  if (field.type === "text" || field.type === "number" || field.type === "currency") {
    return (
      <input
        type={field.type === "text" ? "text" : "number"}
        value={typeof value === "number" ? value : String(value)}
        onChange={(event) =>
          onChange(
            field.id,
            field.type === "text" ? event.target.value : Number(event.target.value) || ""
          )
        }
        placeholder={field.placeholder}
        min={field.type === "text" ? undefined : 0}
        className={baseClassName}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(field.id, event.target.value)}
        placeholder={field.placeholder}
        rows={4}
        className={`${baseClassName} resize-none leading-relaxed`}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(field.id, event.target.value)}
        className={`${baseClassName} cursor-pointer appearance-none`}
      >
        <option value="">Select an option</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];

    return (
      <div
        className={`rounded-xl border p-3 ${
          error
            ? "border-red-400 dark:border-red-700"
            : "border-stone-200 dark:border-neutral-700"
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {field.options?.map((option) => {
            const isSelected = selected.includes(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange(
                    field.id,
                    isSelected
                      ? selected.filter((item) => item !== option)
                      : [...selected, option]
                  )
                }
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900"
                    : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-500"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <p className="mt-2 text-[11px] text-stone-400 dark:text-neutral-500">
            {selected.length} selected
          </p>
        )}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex gap-3">
        {[
          { label: "Yes", optionValue: true },
          { label: "No", optionValue: false },
        ].map(({ label, optionValue }) => {
          const isActive = value === optionValue;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(field.id, optionValue)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? optionValue
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-red-500 bg-red-500 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}

export default function SubmitReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [successReportId, setSuccessReportId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, loading, error: meError } = useQuery<{ me: GraphQLUser | null }>(ME_QUERY, {
    fetchPolicy: "network-only",
  });

  const [createReport, { loading: isSubmitting }] = useMutation<{
    createReport: { id: string };
  }>(CREATE_REPORT_MUTATION);

  const me = data?.me ?? null;
  const sidebarUser = toSidebarUser(me);
  const unitName = me?.unit?.name ?? "";
  const schema = getUnitSchema(unitName, me?.unit?.formSchema);
  const formUnavailableTitle = meError
    ? "Could not load report form"
    : !me
      ? "Session not available"
      : !me.unit
        ? "No unit assigned"
        : "No form configured";
  const formUnavailableDescription = meError
    ? "The dashboard could not load your account details. Refresh the page or sign in again."
    : !me
      ? "Your session was not found. Sign in again to continue submitting reports."
      : !me.unit
        ? "Your account has not been assigned to a unit yet. Contact your admin."
        : `A report form has not been set up for ${unitName || "your unit"} yet. Contact your admin.`;

  function updateField(id: string, value: FieldValue | "") {
    setFormValues((current) => ({ ...current, [id]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      delete next._form;
      return next;
    });
  }

  function validate() {
    if (!schema) {
      return false;
    }

    const nextErrors: FormErrors = {};

    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (!field.required) {
          continue;
        }

        const value = formValues[field.id];

        if (value === undefined || value === "" || value === null) {
          nextErrors[field.id] = `${field.label} is required`;
          continue;
        }

        if (field.type === "multiselect" && Array.isArray(value) && value.length === 0) {
          nextErrors[field.id] = "Please select at least one option";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachmentError("Only PDF, Word, JPG, and PNG files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAttachmentError("File size must be under 5MB.");
      return;
    }

    setAttachment(file);
    setAttachmentError("");
  }

  async function handleSubmit() {
    if (!schema || !validate()) {
      document
        .querySelector("[data-has-error]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      let attachmentUrl: string | undefined;

      if (attachment) {
        attachmentUrl = await readFileAsDataUrl(attachment);
      }

      const sections = schema.sections.map((section) => ({
        title: section.title,
        fields: section.fields.map((field) => ({
          id: field.id,
          label: field.label,
          type: field.type as FieldType,
          value: normalizeFieldValue(field, formValues[field.id] ?? ""),
        })),
      }));

      const result = await createReport({
        variables: {
          input: {
            title:
              String(formValues.serviceTitle ?? "").trim() ||
              `${unitName} report ${new Date().toISOString().slice(0, 10)}`,
            sections,
            attachmentUrl,
            attachmentName: attachment?.name,
            attachmentSize: attachment ? formatFileSize(attachment.size) : undefined,
          },
        },
      });

      setSuccessReportId(result.data?.createReport?.id ?? null);
      setFormValues({});
      setAttachment(null);
      setAttachmentError("");
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setErrors({
        _form:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />
          <main className="flex flex-1 items-center justify-center px-4">
            <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-neutral-400">
              <Loader2 size={16} className="animate-spin" />
              Loading report form...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (meError || !me || !me.unit || !schema) {
    return (
      <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />
          <main className="flex flex-1 items-center justify-center px-4">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                <AlertCircle size={22} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="mb-2 text-base font-semibold text-stone-900 dark:text-white">
                {formUnavailableTitle}
              </h2>
              <p className="text-sm text-stone-500 dark:text-neutral-400">
                {formUnavailableDescription}
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (successReportId) {
    return (
      <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />
          <main className="fade-up flex flex-1 items-center justify-center px-4">
            <div className="max-w-sm text-center">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50">
                <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                Report submitted
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-stone-500 dark:text-neutral-400">
                Your report has been saved and is now waiting for review.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => setSuccessReportId(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-700 transition-all hover:bg-stone-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Submit another
                </button>
                <Link
                  href={`/dashboard/unit-head/reports/${successReportId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                >
                  View report
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <Link
              href="/dashboard/unit-head"
              className="mb-5 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
            >
              <ArrowLeft size={13} />
              Back to dashboard
            </Link>

            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                Submit a report
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-neutral-400">
                {schema.unitName} · fill in the details for your core leader&apos;s review
              </p>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 dark:bg-neutral-800">
                  <Building2 size={13} className="text-stone-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400 dark:text-neutral-500">
                    Unit
                  </p>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">{unitName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 dark:bg-neutral-800">
                  <Calendar size={13} className="text-stone-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400 dark:text-neutral-500">
                    Date
                  </p>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">{today()}</p>
                </div>
              </div>
            </div>

            {errors._form && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <p className="text-xs text-red-700 dark:text-red-400">{errors._form}</p>
              </div>
            )}

            {schema.sections.map((section) => (
              <div
                key={section.title}
                className="mb-4 rounded-2xl border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                  {section.title}
                </h2>
                <div className="space-y-5">
                  {section.fields.map((field) => (
                    <div key={field.id} data-has-error={errors[field.id] ? true : undefined}>
                      <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
                        {field.label}
                        {field.required && <span className="ml-1 text-red-400">*</span>}
                      </label>
                      {field.helpText && (
                        <p className="mb-2 text-[11px] text-stone-400 dark:text-neutral-500">
                          {field.helpText}
                        </p>
                      )}
                      <FieldRenderer
                        field={field}
                        value={formValues[field.id] ?? (field.type === "multiselect" ? [] : "")}
                        error={errors[field.id]}
                        onChange={updateField}
                      />
                      {errors[field.id] && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
                          <AlertCircle size={11} />
                          {errors[field.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                Attachment{" "}
                <span className="font-normal normal-case text-stone-300 dark:text-neutral-600">
                  (optional)
                </span>
              </h2>

              {attachment ? (
                <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-200 dark:bg-neutral-700">
                    <FileText size={14} className="text-stone-500 dark:text-neutral-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-800 dark:text-neutral-200">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAttachment(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="p-1 text-stone-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) {
                      handleFile(file);
                    }
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
                    dragOver
                      ? "border-stone-400 bg-stone-100 dark:border-neutral-500 dark:bg-neutral-800"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                    <Upload size={16} className="text-stone-400 dark:text-neutral-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                      Drop a file or{" "}
                      <span className="text-stone-900 underline underline-offset-2 dark:text-white">
                        browse
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                      PDF, Word, JPG, PNG · up to 5MB
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleFile(file);
                  }
                }}
              />

              {attachmentError && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle size={11} />
                  {attachmentError}
                </p>
              )}
            </div>

            <div className="mb-10 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-neutral-500">
                <Paperclip size={13} />
                Attachment storage is embedded for now, so keep uploads small.
              </div>
              <button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit report"
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
