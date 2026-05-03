"use client";

import { useState, useRef } from "react";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Paperclip,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Mock session (replace with real session data) ──────
const MOCK_USER = {
  name: "Adeola Obi",
  unit: "Music Unit",
  role: "UNIT_HEAD" as const,
};

// ── Types ──────────────────────────────────────────────
interface FormFields {
  title: string;
  content: string;
  attachment: File | null;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

// ── Helpers ────────────────────────────────────────────
function today() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ── Component ──────────────────────────────────────────
export default function SubmitReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState<FormFields>({
    title: "",
    content: "",
    attachment: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ─────────────────────────────────────
  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) {
      newErrors.title = "Report title is required";
    } else if (form.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }
    if (!form.content.trim()) {
      newErrors.content = "Report content is required";
    } else if (form.content.trim().length < 20) {
      newErrors.content = "Please provide more detail (at least 20 characters)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function updateField(field: keyof FormFields, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // ── File handling ──────────────────────────────────
  function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        attachment: "Only PDF, Word, JPG, and PNG files are allowed",
      }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        attachment: "File size must be under 5MB",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, attachment: file }));
    setErrors((prev) => ({ ...prev, attachment: undefined }));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function removeAttachment() {
    setForm((prev) => ({ ...prev, attachment: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Submit ─────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Replace with your GraphQL mutation
      // const formData = new FormData();
      // formData.append("title", form.title);
      // formData.append("content", form.content);
      // if (form.attachment) formData.append("attachment", form.attachment);
      // await submitReport(formData);

      // Simulated delay — remove when wiring real API
      await new Promise((res) => setTimeout(res, 1500));

      setSuccess(true);
    } catch {
      setErrors({ title: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────
  if (success) {
    return (
      <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={MOCK_USER}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Topbar
            onMenuClick={() => setSidebarOpen(true)}
            user={{ name: MOCK_USER.name }}
          />
          <main className="flex-1 flex items-center justify-center px-4 fade-up">
            <div className="text-center max-w-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 mb-5">
                <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-2 tracking-tight">
                Report submitted!
              </h2>
              <p className="text-sm text-stone-500 dark:text-neutral-400 leading-relaxed mb-8">
                Your report has been submitted successfully and is now pending review by your core leader.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setForm({ title: "", content: "", attachment: null });
                    setErrors({});
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-all"
                >
                  Submit another
                </button>
                <Link
                  href="/dashboard/unit-head"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 transition-all"
                >
                  Go to dashboard
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────
  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={MOCK_USER}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          user={{ name: MOCK_USER.name }}
        />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">
          <div className="max-w-2xl mx-auto">

            {/* Back + heading */}
            <div className="mb-6">
              <Link
                href="/dashboard/unit-head"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors mb-4"
              >
                <ArrowLeft size={13} />
                Back to dashboard
              </Link>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">
                Submit a report
              </h1>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mt-1">
                Fill in the details below and submit for your core leader's review.
              </p>
            </div>

            {/* Auto-filled read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Building2 size={13} className="text-stone-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-stone-400 dark:text-neutral-500 uppercase tracking-wide">
                    Unit
                  </p>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    {MOCK_USER.unit}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Calendar size={13} className="text-stone-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-stone-400 dark:text-neutral-500 uppercase tracking-wide">
                    Date
                  </p>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    {today()}
                  </p>
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
                  Report title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Sunday Service — May 4, 2026"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors
                    bg-stone-50 dark:bg-neutral-800
                    text-stone-900 dark:text-white
                    placeholder-stone-400 dark:placeholder-neutral-500
                    ${errors.title
                      ? "border-red-400 dark:border-red-700 focus:border-red-400"
                      : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"
                    }`}
                />
                {errors.title && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                    <AlertCircle size={11} />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
                  Report content <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Describe the service — what happened, attendance, key highlights, challenges, prayer points…"
                  rows={8}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors resize-none leading-relaxed
                    bg-stone-50 dark:bg-neutral-800
                    text-stone-900 dark:text-white
                    placeholder-stone-400 dark:placeholder-neutral-500
                    ${errors.content
                      ? "border-red-400 dark:border-red-700 focus:border-red-400"
                      : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"
                    }`}
                />
                <div className="flex items-start justify-between mt-1.5">
                  {errors.content ? (
                    <p className="flex items-center gap-1.5 text-xs text-red-500">
                      <AlertCircle size={11} />
                      {errors.content}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className={`text-xs tabular-nums ${
                    form.content.length < 20 && form.content.length > 0
                      ? "text-red-400"
                      : "text-stone-400 dark:text-neutral-500"
                  }`}>
                    {form.content.length} chars
                  </span>
                </div>
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
                  Attachment <span className="text-stone-400 dark:text-neutral-500 font-normal">(optional)</span>
                </label>

                {form.attachment ? (
                  /* File preview */
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800">
                    <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-neutral-200 truncate">
                        {form.attachment.name}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-neutral-500">
                        {formatFileSize(form.attachment.size)}
                      </p>
                    </div>
                    <button
                      onClick={removeAttachment}
                      className="text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  /* Drop zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                      ${dragOver
                        ? "border-stone-400 bg-stone-100 dark:border-neutral-500 dark:bg-neutral-800"
                        : "border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600 hover:bg-stone-50 dark:hover:bg-neutral-800/60"
                      }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Upload size={16} className="text-stone-400 dark:text-neutral-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
                        Drop a file or{" "}
                        <span className="text-stone-900 dark:text-white underline underline-offset-2">
                          browse
                        </span>
                      </p>
                      <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">
                        PDF, Word, JPG, PNG — max 5MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>
                )}

                {errors.attachment && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                    <AlertCircle size={11} />
                    {errors.attachment}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-stone-100 dark:border-neutral-800" />

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/dashboard/unit-head"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-all"
                >
                  Cancel
                </Link>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Paperclip size={14} />
                      Submit report
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Helper note */}
            <p className="text-xs text-center text-stone-400 dark:text-neutral-600 mt-4">
              Once submitted, your report will be sent to your core leader for review.
              You will not be able to edit it after submission.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}