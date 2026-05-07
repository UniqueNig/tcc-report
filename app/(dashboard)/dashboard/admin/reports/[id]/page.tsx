"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Loader2,
  Paperclip,
  Send,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import ReportSections from "@/src/components/reports/ReportSections";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import {
  ADD_COMMENT_MUTATION,
  DELETE_REPORT_MUTATION,
  MARK_REPORT_REVIEWED_MUTATION,
  REPORT_DETAIL_QUERY,
} from "@/src/lib/graphqlDocuments";
import {
  formatDateTime,
  formatLongDate,
  getInitials,
  toSidebarUser,
  type GraphQLReport,
  type GraphQLUser,
} from "@/src/lib/dashboardHelpers";

function DeleteModal({
  title,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  title: string;
  onConfirm: () => Promise<void>;
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
          Delete report?
        </h3>
        <p className="mb-2 text-center text-sm text-stone-500 dark:text-neutral-400">
          <span className="font-medium text-stone-800 dark:text-neutral-200">
            &quot;{title}&quot;
          </span>{" "}
          will be permanently deleted.
        </p>
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950/30">
          <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            All comments attached to this report will also be removed.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = params?.id ?? "";

  const { data, loading, refetch } = useQuery<{
    me: GraphQLUser | null;
    report: GraphQLReport | null;
  }>(REPORT_DETAIL_QUERY, {
    variables: { id: reportId },
    skip: !reportId,
    fetchPolicy: "network-only",
  });

  const [markReportReviewed, { loading: isMarkingReviewed }] = useMutation(
    MARK_REPORT_REVIEWED_MUTATION
  );
  const [deleteReport, { loading: isDeleting }] = useMutation(DELETE_REPORT_MUTATION);
  const [addComment, { loading: isPostingComment }] = useMutation(ADD_COMMENT_MUTATION);

  const me = data?.me ?? null;
  const report = data?.report ?? null;
  const sidebarUser = toSidebarUser(me);

  function showToastMessage(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  async function handleMarkReviewed() {
    if (!report) {
      return;
    }

    await markReportReviewed({ variables: { id: report.id } });
    await refetch();
    showToastMessage("Report marked as reviewed.");
  }

  async function handleDelete() {
    if (!report) {
      return;
    }

    await deleteReport({ variables: { id: report.id } });
    router.push("/dashboard/admin/reports");
  }

  async function handlePostComment() {
    if (!report || !commentText.trim()) {
      return;
    }

    await addComment({
      variables: {
        reportId: report.id,
        body: commentText.trim(),
      },
    });
    setCommentText("");
    await refetch();
    showToastMessage("Comment posted.");
  }

  async function handleExport() {
    if (!report) {
      return;
    }

    const sectionLines = (report.sections ?? [])
      .map(
        (section) =>
          `\n--- ${section.title.toUpperCase()} ---\n` +
          section.fields
            .map((field) => {
              const value = Array.isArray(field.value)
                ? field.value.join(", ")
                : String(field.value ?? "");
              return `${field.label}: ${value}`;
            })
            .join("\n")
      )
      .join("\n");

    const content =
      `CHURCH REPORT\n\n` +
      `Title: ${report.title}\n` +
      `Unit: ${report.unit?.name ?? "Unknown"}\n` +
      `Submitted by: ${report.submittedByUser?.name ?? "Unknown"}\n` +
      `Date: ${formatLongDate(report.createdAt)}\n` +
      `Status: ${report.status}\n` +
      sectionLines +
      `\n\n--- COMMENTS ---\n\n` +
      (report.comments ?? [])
        .map(
          (comment) =>
            `[${comment.authorUser?.name ?? "Leadership"} - ${formatDateTime(comment.createdAt)}]\n${comment.body}`
        )
        .join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, "_")}_${(report.unit?.name ?? "unit").replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToastMessage("Report exported.");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-3 py-6 sm:px-4 lg:px-8">
          {toast && (
            <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 sm:left-auto">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">{toast}</p>
            </div>
          )}

          <div className="mb-5">
            <Link
              href="/dashboard/admin/reports"
              className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to reports
            </Link>
          </div>

          {loading ? (
            <div className="mx-auto max-w-3xl py-20 text-center text-sm text-stone-500 dark:text-neutral-400">
              Loading report...
            </div>
          ) : !report ? (
            <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                <AlertCircle size={22} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="mb-2 text-base font-semibold text-stone-900 dark:text-white">
                Report not found
              </h2>
              <p className="text-sm text-stone-500 dark:text-neutral-400">
                This report could not be loaded or no longer exists.
              </p>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="min-w-0 space-y-4 xl:col-span-2">
                <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <ReportStatusPill status={report.status} />
                      </div>
                      <h1 className="mb-1 break-words text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                        {report.title}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 dark:text-neutral-500">
                        <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
                          <Building2 size={11} className="shrink-0" />
                          {report.unit?.name ?? "Unknown unit"}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
                          <User size={11} className="shrink-0" />
                          {report.submittedByUser?.name ?? "Unknown"}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
                          <Calendar size={11} className="shrink-0" />
                          {formatLongDate(report.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                      {report.status === "pending" && (
                        <button
                          onClick={() => void handleMarkReviewed()}
                          disabled={isMarkingReviewed}
                          className="inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                        >
                          {isMarkingReviewed ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Marking...
                            </>
                          ) : (
                            "Mark reviewed"
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => void handleExport()}
                        className="inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white sm:flex-none"
                      >
                        <Download size={14} />
                        Export
                      </button>
                      <button
                        onClick={() => setShowDelete(true)}
                        className="inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-red-500 transition-all hover:border-red-200 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:border-red-900 dark:hover:bg-red-950/40 sm:flex-none"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  {report.status === "reviewed" && report.reviewedByUser && (
                    <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Reviewed by <span className="font-semibold">{report.reviewedByUser.name}</span>
                        {report.reviewedAt && <> on {formatDateTime(report.reviewedAt)}</>}
                      </p>
                    </div>
                  )}
                </div>

                {report.attachmentName && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl sm:px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800">
                      <Paperclip size={15} className="text-stone-500 dark:text-neutral-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-800 dark:text-neutral-200">
                        {report.attachmentName}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-neutral-500">
                        {report.attachmentSize ?? "Attached file"}
                      </p>
                    </div>
                    {report.attachmentUrl && (
                      <a
                        href={report.attachmentUrl}
                        download={report.attachmentName}
                        className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white sm:w-auto"
                      >
                        <Download size={12} />
                        Download
                      </a>
                    )}
                  </div>
                )}

                {report.sections && report.sections.length > 0 && (
                  <div className="space-y-4">
                    <ReportSections sections={report.sections} />
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-4">
                <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl sm:p-5">
                  <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                    Timeline
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-white">
                        Submitted
                      </p>
                      <p className="text-xs text-stone-400 dark:text-neutral-500">
                        {formatDateTime(report.createdAt)}
                      </p>
                    </div>
                    {report.reviewedAt && (
                      <div>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          Reviewed
                        </p>
                        <p className="text-xs text-stone-400 dark:text-neutral-500">
                          {formatDateTime(report.reviewedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                      Comments
                    </h2>
                    {report.comments && report.comments.length > 0 && (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-500 dark:bg-neutral-800 dark:text-neutral-400">
                        {report.comments.length}
                      </span>
                    )}
                  </div>

                  <div className="mb-4 space-y-4">
                    {!report.comments || report.comments.length === 0 ? (
                      <div className="text-sm text-stone-500 dark:text-neutral-400">
                        No comments yet.
                      </div>
                    ) : (
                      report.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">
                            {getInitials(comment.authorUser?.name ?? "L")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-stone-800 dark:text-neutral-200">
                                {comment.authorUser?.name ?? "Leadership"}
                              </span>
                              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {comment.role === "ADMIN" ? "Pastorate" : "Core Leader"}
                              </span>
                              <span className="text-[11px] text-stone-400 dark:text-neutral-500">
                                {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                            <div className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-700 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-300">
                              {comment.body}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-stone-100 pt-4 dark:border-neutral-800">
                    <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
                      Add a comment
                    </label>
                    <textarea
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Add context, feedback, or follow-up notes..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm leading-relaxed text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500"
                    />
                    <button
                      onClick={() => void handlePostComment()}
                      disabled={isPostingComment || !commentText.trim()}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 sm:w-auto"
                    >
                      {isPostingComment ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          Post comment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showDelete && report && (
            <DeleteModal
              title={report.title}
              onConfirm={handleDelete}
              onCancel={() => setShowDelete(false)}
              isDeleting={isDeleting}
            />
          )}
        </main>
      </div>
    </div>
  );
}
