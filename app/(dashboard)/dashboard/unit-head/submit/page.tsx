"use client";

import { useState, useRef } from "react";
import {
  ArrowLeft, Building2, Calendar, Paperclip,
  X, CheckCircle2, AlertCircle, Loader2, Upload, FileText,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import { getUnitSchema, type UnitField } from "@/src/lib/unitSchemas";

// ── Mock session (replace with real session) ───────────
const MOCK_USER = {
  name: "Adeola Obi",
  unit: "Finance Unit (Accounting)",
  role: "UNIT_HEAD" as const,
};

type FieldValue = string | number | boolean | string[];
type FormValues = Record<string, FieldValue>;
type FormErrors = Record<string, string>;

const ALLOWED_TYPES = [
  "application/pdf", "image/jpeg", "image/png",
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
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Field renderer ─────────────────────────────────────
function FieldRenderer({
  field, value, error, onChange,
}: {
  field: UnitField; value: FieldValue; error?: string;
  onChange: (id: string, val: FieldValue) => void;
}) {
  const base = `w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors
    bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white
    placeholder-stone-400 dark:placeholder-neutral-500
    ${error ? "border-red-400 dark:border-red-700" : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"}`;

  if (field.type === "text" || field.type === "number" || field.type === "currency") {
    return (
      <input
        type={field.type === "text" ? "text" : "number"}
        value={value as string}
        onChange={(e) => onChange(field.id, field.type === "text" ? e.target.value : parseFloat(e.target.value) || "")}
        placeholder={field.placeholder}
        min={field.type !== "text" ? 0 : undefined}
        className={base}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea value={value as string} onChange={(e) => onChange(field.id, e.target.value)}
        placeholder={field.placeholder} rows={4}
        className={`${base} resize-none leading-relaxed`} />
    );
  }

  if (field.type === "select") {
    return (
      <select value={value as string} onChange={(e) => onChange(field.id, e.target.value)}
        className={`${base} cursor-pointer appearance-none`}>
        <option value="">Select an option</option>
        {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const selected = (value as string[]) || [];
    return (
      <div className={`rounded-xl border p-3 ${error ? "border-red-400 dark:border-red-700" : "border-stone-200 dark:border-neutral-700"}`}>
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => onChange(field.id, isSelected ? selected.filter((s) => s !== opt) : [...selected, opt])}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${isSelected
                    ? "bg-stone-900 dark:bg-white border-stone-900 dark:border-white text-white dark:text-stone-900"
                    : "bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:border-stone-400 dark:hover:border-neutral-500"}`}>
                {opt}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <p className="text-[11px] text-stone-400 dark:text-neutral-500 mt-2">{selected.length} selected</p>
        )}
      </div>
    );
  }

  if (field.type === "boolean") {
    const boolVal = value as boolean | "";
    return (
      <div className="flex gap-3">
        {[{ label: "Yes", val: true }, { label: "No", val: false }].map(({ label, val }) => {
          const isActive = boolVal === val;
          return (
            <button key={label} type="button" onClick={() => onChange(field.id, val)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${isActive
                  ? val ? "bg-emerald-600 border-emerald-600 text-white" : "bg-red-500 border-red-500 text-white"
                  : "bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:border-stone-300 dark:hover:border-neutral-600"}`}>
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}

// ── Page ───────────────────────────────────────────────
export default function SubmitReportPage() {
  const schema = getUnitSchema(MOCK_USER.unit);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField(id: string, value: FieldValue) {
    setFormValues((p) => ({ ...p, [id]: value }));
    setErrors((p) => { const n = { ...p }; delete n[id]; return n; });
  }

  function validate(): boolean {
    if (!schema) return false;
    const newErrors: FormErrors = {};
    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (!field.required) return;
        const val = formValues[field.id];
        if (val === undefined || val === "" || val === null)
          newErrors[field.id] = `${field.label} is required`;
        else if (field.type === "multiselect" && (val as string[]).length === 0)
          newErrors[field.id] = "Please select at least one option";
        else if (field.type === "boolean" && val === "")
          newErrors[field.id] = "Please select Yes or No";
      });
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) { setAttachmentError("Only PDF, Word, JPG, and PNG files are allowed"); return; }
    if (file.size > MAX_FILE_SIZE) { setAttachmentError("File size must be under 5MB"); return; }
    setAttachment(file); setAttachmentError("");
  }

  async function handleSubmit() {
    if (!validate()) {
      document.querySelector("[data-has-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setSuccess(true);
    } catch {
      setErrors({ _form: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const layout = (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />
        {null}
      </div>
    </div>
  );

  if (!schema) return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-4 mx-auto">
              <AlertCircle size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-white mb-2">No form configured</h2>
            <p className="text-sm text-stone-500 dark:text-neutral-400">
              A report form hasn't been set up for <strong>{MOCK_USER.unit}</strong> yet. Contact your admin.
            </p>
          </div>
        </main>
      </div>
    </div>
  );

  if (success) return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />
        <main className="flex-1 flex items-center justify-center px-4 fade-up">
          <div className="text-center max-w-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 mb-5">
              <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-2 tracking-tight">Report submitted!</h2>
            <p className="text-sm text-stone-500 dark:text-neutral-400 leading-relaxed mb-8">
              Your report has been submitted and is now pending review by your core leader.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => { setSuccess(false); setFormValues({}); setAttachment(null); setErrors({}); }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-all">
                Submit another
              </button>
              <Link href="/dashboard/unit-head"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 transition-all">
                Go to dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">
          <div className="max-w-2xl mx-auto">

            <Link href="/dashboard/unit-head"
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors mb-5">
              <ArrowLeft size={13} />Back to dashboard
            </Link>

            <div className="mb-6">
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">Submit a report</h1>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mt-1">
                {schema.unitName} · Fill in the details for your core leader's review
              </p>
            </div>

            {/* Auto-filled meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Building2 size={13} className="text-stone-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-stone-400 dark:text-neutral-500 uppercase tracking-wide">Unit</p>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">{MOCK_USER.unit}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Calendar size={13} className="text-stone-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-stone-400 dark:text-neutral-500 uppercase tracking-wide">Date</p>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">{today()}</p>
                </div>
              </div>
            </div>

            {errors._form && (
              <div className="flex items-center gap-2.5 px-4 py-3 mb-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">{errors._form}</p>
              </div>
            )}

            {/* Dynamic sections */}
            {schema.sections.map((section) => (
              <div key={section.title} className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 mb-4">
                <h2 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider mb-5">
                  {section.title}
                </h2>
                <div className="space-y-5">
                  {section.fields.map((field) => (
                    <div key={field.id} data-has-error={errors[field.id] ? true : undefined}>
                      <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {field.helpText && (
                        <p className="text-[11px] text-stone-400 dark:text-neutral-500 mb-2">{field.helpText}</p>
                      )}
                      <FieldRenderer
                        field={field}
                        value={formValues[field.id] ?? (field.type === "multiselect" ? [] : "")}
                        error={errors[field.id]}
                        onChange={updateField}
                      />
                      {errors[field.id] && (
                        <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                          <AlertCircle size={11} />{errors[field.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Attachment */}
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 mb-4">
              <h2 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider mb-5">
                Attachment <span className="text-stone-300 dark:text-neutral-600 font-normal normal-case">(optional)</span>
              </h2>
              {attachment ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800">
                  <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-stone-500 dark:text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 dark:text-neutral-200 truncate">{attachment.name}</p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500">{formatFileSize(attachment.size)}</p>
                  </div>
                  <button onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                    ${dragOver
                      ? "border-stone-400 bg-stone-100 dark:border-neutral-500 dark:bg-neutral-800"
                      : "border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 hover:bg-stone-50 dark:hover:bg-neutral-800/60"}`}>
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Upload size={16} className="text-stone-400 dark:text-neutral-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                      Drop a file or <span className="text-stone-900 dark:text-white underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">PDF, Word, JPG, PNG — max 5MB</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
                </div>
              )}
              {attachmentError && (
                <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                  <AlertCircle size={11} />{attachmentError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <Link href="/dashboard/unit-head"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-all">
                Cancel
              </Link>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                {isSubmitting
                  ? <><Loader2 size={14} className="animate-spin" />Submitting…</>
                  : <><Paperclip size={14} />Submit report</>}
              </button>
            </div>

            <p className="text-xs text-center text-stone-400 dark:text-neutral-600 mb-8">
              Once submitted, your report will be sent to your core leader for review. You cannot edit it after submission.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}