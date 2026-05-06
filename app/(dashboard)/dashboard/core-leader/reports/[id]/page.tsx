"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import ReportSections from "@/src/components/reports/ReportSections";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import {
  ADD_COMMENT_MUTATION,
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

function ReportSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="mb-6 h-4 w-24 rounded bg-stone-200 dark:bg-neutral-800" />
      <div className="mb-2 h-7 w-2/3 rounded bg-stone-200 dark:bg-neutral-800" />
      <div className="mb-8 h-4 w-1/3 rounded bg-stone-200 dark:bg-neutral-800" />
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="mb-4 h-3 w-28 rounded bg-stone-200 dark:bg-neutral-800" />
          <div className="space-y-3">
            <div className="h-3 w-24 rounded bg-stone-200 dark:bg-neutral-800" />
            <div className="h-4 w-3/4 rounded bg-stone-200 dark:bg-neutral-800" />
            <div className="h-3 w-32 rounded bg-stone-200 dark:bg-neutral-800" />
            <div className="h-4 w-1/2 rounded bg-stone-200 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CoreLeaderReportReview() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const commentBoxRef = useRef<HTMLTextAreaElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

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
  const [addComment, { loading: isSubmittingComment }] = useMutation(ADD_COMMENT_MUTATION);

  const me = data?.me ?? null;
  const report = data?.report ?? null;
  const sidebarUser = toSidebarUser(me);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("comment") === "true") {
      const timeout = window.setTimeout(() => {
        commentSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        commentBoxRef.current?.focus();
      }, 300);

      return () => window.clearTimeout(timeout);
    }
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  async function handleMarkReviewed() {
    if (!report) {
      return;
    }

    try {
      await markReportReviewed({ variables: { id: report.id } });
      await refetch();
      showToast("Report marked as reviewed.");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Could not mark report reviewed.");
    }
  }

  async function handleSubmitComment() {
    if (!report) {
      return;
    }

    if (!comment.trim()) {
      setCommentError("Please write a comment before submitting.");
      return;
    }

    if (comment.trim().length < 5) {
      setCommentError("Comment is too short.");
      return;
    }

    try {
      await addComment({
        variables: {
          reportId: report.id,
          body: comment.trim(),
        },
      });
      setComment("");
      setCommentError("");
      await refetch();
      showToast("Comment posted.");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Could not post comment.");
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

          {loading ? (
            <ReportSkeleton />
          ) : !report ? (
            <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                <AlertCircle size={22} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="mb-2 text-base font-semibold text-stone-900 dark:text-white">
                Report not found
              </h2>
              <p className="text-sm text-stone-500 dark:text-neutral-400">
                This report could not be loaded or you no longer have access to it.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">
              <Link
                href="/dashboard/core-leader/reports"
                className="mb-5 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
              >
                <ArrowLeft size={13} />
                Back to reports
              </Link>

              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold leading-snug tracking-tight text-stone-900 dark:text-white">
                    {report.title}
                  </h1>
                  <p className="mt-1 text-sm text-stone-400 dark:text-neutral-500">
                    Report #{report.id}
                  </p>
                </div>
                <ReportStatusPill status={report.status} />
              </div>

              <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {[
                    {
                      icon: User,
                      label: "Submitted by",
                      value: report.submittedByUser?.name ?? "Unknown",
                    },
                    {
                      icon: Building2,
                      label: "Unit",
                      value: report.unit?.name ?? "Unknown unit",
                    },
                    {
                      icon: Calendar,
                      label: "Date submitted",
                      value: formatLongDate(report.createdAt),
                    },
                    {
                      icon: FileText,
                      label: "Status",
                      value:
                        report.status === "reviewed"
                          ? "Reviewed by leadership"
                          : "Awaiting your review",
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 dark:bg-neutral-800">
                        <Icon size={13} className="text-stone-500 dark:text-neutral-400" />
                      </div>
                      <div>
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                          {label}
                        </p>
                        <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {report.status === "pending" && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-5 dark:border-neutral-800">
                    <div>
                      <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">
                        Ready to mark this report as reviewed?
                      </p>
                      <p className="mt-0.5 text-xs text-stone-400 dark:text-neutral-500">
                        This updates the report status for the unit head immediately.
                      </p>
                    </div>
                    <button
                      onClick={() => void handleMarkReviewed()}
                      disabled={isMarkingReviewed}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isMarkingReviewed ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Marking...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Mark as reviewed
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {report.attachmentName && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
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
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                    >
                      <Download size={12} />
                      Download
                    </a>
                  )}
                </div>
              )}

              {report.sections && report.sections.length > 0 && (
                <div className="mb-4 space-y-4">
                  <ReportSections sections={report.sections} />
                </div>
              )}

              <div
                ref={commentSectionRef}
                className="mb-4 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                      Comments
                    </h2>
                    {report.comments && report.comments.length > 0 && (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-500 dark:bg-neutral-800 dark:text-neutral-400">
                        {report.comments.length}
                      </span>
                    )}
                  </div>
                  <MessageSquare size={14} className="text-stone-300 dark:text-neutral-600" />
                </div>

                <div className="px-6 py-5">
                  {!report.comments || report.comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                        <MessageSquare size={16} className="text-stone-400 dark:text-neutral-500" />
                      </div>
                      <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">
                        No comments yet
                      </p>
                      <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                        Be the first to leave feedback on this report.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {report.comments.map((commentItem) => (
                        <div key={commentItem.id} className="flex items-start gap-4">
                          <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">
                            {getInitials(commentItem.authorUser?.name ?? "L")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-stone-800 dark:text-neutral-200">
                                {commentItem.authorUser?.name ?? "Leadership"}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  commentItem.role === "ADMIN"
                                    ? "bg-stone-100 text-stone-600 dark:bg-neutral-800 dark:text-neutral-400"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                                }`}
                              >
                                {commentItem.role === "ADMIN" ? "Pastorate" : "Core Leader"}
                              </span>
                              {commentItem.authorUser?.id === me?.id && (
                                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-neutral-800 dark:text-neutral-500">
                                  You
                                </span>
                              )}
                              <span className="text-[11px] text-stone-400 dark:text-neutral-500">
                                {formatDateTime(commentItem.createdAt)}
                              </span>
                            </div>
                            <div className="rounded-2xl rounded-tl-sm border border-stone-100 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-700 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-300">
                              {commentItem.body}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-100 px-6 pb-6 pt-5 dark:border-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">
                      {getInitials(me?.name ?? "CL")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-neutral-400">
                        Leave a comment
                      </label>
                      <textarea
                        ref={commentBoxRef}
                        value={comment}
                        onChange={(event) => {
                          setComment(event.target.value);
                          if (commentError) {
                            setCommentError("");
                          }
                        }}
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                            void handleSubmitComment();
                          }
                        }}
                        placeholder="Write your feedback, instructions, or follow-up notes..."
                        rows={4}
                        className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed text-stone-900 outline-none transition-colors placeholder:text-stone-400 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 ${
                          commentError
                            ? "border-red-400 dark:border-red-700"
                            : "border-stone-200 bg-stone-50 focus:border-stone-400 dark:border-neutral-700 dark:focus:border-neutral-500"
                        }`}
                      />
                      {commentError && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
                          <AlertCircle size={11} />
                          {commentError}
                        </p>
                      )}
                      <div className="mt-2.5 flex items-center justify-between">
                        <p className="text-[11px] text-stone-400 dark:text-neutral-500">
                          Press Ctrl/Cmd + Enter to submit
                        </p>
                        <button
                          onClick={() => void handleSubmitComment()}
                          disabled={isSubmittingComment}
                          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                        >
                          {isSubmittingComment ? (
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
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
