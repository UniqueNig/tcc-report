"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Paperclip,
  Download,
  Send,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
type ReportStatus = "pending" | "reviewed";

interface Comment {
  id: string;
  author: string;
  role: "CORE_LEADER" | "ADMIN";
  content: string;
  createdAt: string;
}

interface ReportDetail {
  id: string;
  title: string;
  content: string;
  unit: string;
  submittedBy: string;
  dateSubmitted: string;
  status: ReportStatus;
  attachment?: { name: string; size: string; url: string };
  comments: Comment[];
}

// ── Mock data ──────────────────────────────────────────
const MOCK_REPORT: ReportDetail = {
  id: "1",
  title: "Sunday Service — May 4, 2026",
  content: `The Sunday service was a great time of worship and fellowship. The music team led the congregation in 5 songs, including two new worship songs that were well received.

Attendance was approximately 120 adults and 35 children. The service ran from 9:00 AM to 11:45 AM.

Key highlights:
- Special ministration by the choir during offering
- Three new visitors were welcomed and followed up with
- The sound system had a brief issue during the second song but was resolved quickly

Prayer points raised:
- Upcoming evangelism outreach scheduled for May 15th
- Members going through difficult seasons — three families mentioned
- The building project fund update was shared by the pastor

Challenges:
- Two team members were absent without prior notice
- We need more volunteers for the children's unit support

Overall it was a Spirit-filled service and the congregation left encouraged.`,
  unit: "Music Unit",
  submittedBy: "Adeola Obi",
  dateSubmitted: "2026-05-04T09:00:00Z",
  status: "pending",
  attachment: { name: "sunday-attendance.pdf", size: "124 KB", url: "#" },
  comments: [
    {
      id: "c1",
      author: "Pastor Adewale",
      role: "ADMIN",
      content: "Thank you for this report. Please ensure follow-up is done on the three new visitors before the midweek service.",
      createdAt: "2026-05-04T11:00:00Z",
    },
  ],
};

const MOCK_USER = { name: "Br. Oluwole", role: "CORE_LEADER" as const };

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatCommentTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Sub-components ─────────────────────────────────────
function StatusBadge({ status }: { status: ReportStatus }) {
  if (status === "reviewed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
        <CheckCircle2 size={12} />
        Reviewed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
      <Clock size={12} />
      Pending review
    </span>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-stone-500 dark:text-neutral-400" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-stone-800 dark:text-neutral-200 font-medium">{value}</p>
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="skeleton h-4 w-24 rounded mb-6" />
      <div className="skeleton h-7 w-2/3 rounded mb-2" />
      <div className="skeleton h-4 w-1/3 rounded mb-8" />
      <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="skeleton w-7 h-7 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-2.5 w-16 rounded" />
                <div className="skeleton h-3.5 w-28 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-3.5 rounded" style={{ width: `${65 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function CoreLeaderReportReview() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);
  const [report, setReport] = useState<ReportDetail>(MOCK_REPORT);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [justMarked, setJustMarked] = useState(false);
  const commentBoxRef = useRef<HTMLTextAreaElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Auto-focus comment box if ?comment=true in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("comment") === "true") {
        setTimeout(() => {
          commentSectionRef.current?.scrollIntoView({ behavior: "smooth" });
          commentBoxRef.current?.focus();
        }, 300);
      }
    }
  }, []);

  async function handleSubmitComment() {
    if (!comment.trim()) {
      setCommentError("Please write a comment before submitting.");
      commentBoxRef.current?.focus();
      return;
    }
    if (comment.trim().length < 5) {
      setCommentError("Comment is too short.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError("");

    try {
      // Replace with GraphQL mutation: addComment({ variables: { reportId: report.id, content: comment } })
      await new Promise((res) => setTimeout(res, 1000));

      const newComment: Comment = {
        id: `c${Date.now()}`,
        author: MOCK_USER.name,
        role: "CORE_LEADER",
        content: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      setReport((prev) => ({ ...prev, comments: [...prev.comments, newComment] }));
      setComment("");
    } catch {
      setCommentError("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleMarkReviewed() {
    setIsMarkingReviewed(true);
    try {
      // Replace with GraphQL mutation: markReportReviewed({ variables: { id: report.id } })
      await new Promise((res) => setTimeout(res, 1000));
      setReport((prev) => ({ ...prev, status: "reviewed" }));
      setJustMarked(true);
      setTimeout(() => setJustMarked(false), 3000);
    } catch {
      // handle error
    } finally {
      setIsMarkingReviewed(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmitComment();
    }
  }

  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">
          {isLoading ? (
            <ReportSkeleton />
          ) : (
            <div className="max-w-3xl mx-auto">

              {/* Back */}
              <Link
                href="/dashboard/core-leader/reports"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors mb-5"
              >
                <ArrowLeft size={13} />
                Back to reports
              </Link>

              {/* Title + status */}
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight leading-snug">
                    {report.title}
                  </h1>
                  <p className="text-sm text-stone-400 dark:text-neutral-500 mt-1">Report #{report.id}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              {/* Just marked toast */}
              {justMarked && (
                <div className="flex items-center gap-2.5 px-4 py-3 mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl fade-up">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Report marked as reviewed successfully.
                  </p>
                </div>
              )}

              {/* Meta card */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <MetaItem icon={User} label="Submitted by" value={report.submittedBy} />
                  <MetaItem icon={Building2} label="Unit" value={report.unit} />
                  <MetaItem icon={Calendar} label="Date submitted" value={formatDate(report.dateSubmitted)} />
                  <MetaItem
                    icon={FileText}
                    label="Status"
                    value={report.status === "reviewed" ? "Reviewed by core leader" : "Awaiting your review"}
                  />
                </div>

                {/* Mark as reviewed CTA */}
                {report.status === "pending" && (
                  <>
                    <div className="border-t border-stone-100 dark:border-neutral-800 mt-5 pt-5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">
                            Ready to mark this report as reviewed?
                          </p>
                          <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">
                            This will notify the unit head and update the report status.
                          </p>
                        </div>
                        <button
                          onClick={handleMarkReviewed}
                          disabled={isMarkingReviewed}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shrink-0"
                        >
                          {isMarkingReviewed ? (
                            <><Loader2 size={14} className="animate-spin" /> Marking…</>
                          ) : (
                            <><Check size={14} /> Mark as reviewed</>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {report.status === "reviewed" && (
                  <div className="mt-5 pt-5 border-t border-stone-100 dark:border-neutral-800 flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      You have reviewed this report.
                    </p>
                  </div>
                )}
              </div>

              {/* Attachment */}
              {report.attachment && (
                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-4 mb-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <Paperclip size={15} className="text-stone-500 dark:text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 dark:text-neutral-200 truncate">{report.attachment.name}</p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500">{report.attachment.size}</p>
                  </div>
                  <a
                    href={report.attachment.url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all shrink-0"
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
              )}

              {/* Report content */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 mb-4">
                <h2 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider mb-4">
                  Report content
                </h2>
                <div>
                  {report.content.split("\n\n").map((paragraph, i) => {
                    if (paragraph.startsWith("- ")) {
                      const items = paragraph.split("\n").filter((l) => l.startsWith("- "));
                      return (
                        <ul key={i} className="space-y-1.5 mb-4 pl-1">
                          {items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-stone-700 dark:text-neutral-300 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-neutral-500 mt-2 shrink-0" />
                              {item.replace("- ", "")}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (paragraph.endsWith(":")) {
                      return (
                        <p key={i} className="text-sm font-semibold text-stone-800 dark:text-neutral-200 mt-5 mb-1.5">
                          {paragraph}
                        </p>
                      );
                    }
                    return (
                      <p key={i} className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* ── Comments & thread ── */}
              <div
                ref={commentSectionRef}
                className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden mb-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider">
                      Comments
                    </h2>
                    {report.comments.length > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 dark:bg-neutral-800 text-[10px] font-semibold text-stone-500 dark:text-neutral-400">
                        {report.comments.length}
                      </span>
                    )}
                  </div>
                  <MessageSquare size={14} className="text-stone-300 dark:text-neutral-600" />
                </div>

                {/* Thread */}
                <div className="px-6 py-5">
                  {report.comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                        <MessageSquare size={16} className="text-stone-400 dark:text-neutral-500" />
                      </div>
                      <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">No comments yet</p>
                      <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                        Be the first to leave feedback on this report
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-stone-100 dark:bg-neutral-800" aria-hidden="true" />

                      <div className="space-y-6">
                        {report.comments.map((c, index) => (
                          <div key={c.id} className="relative flex items-start gap-4 pl-10">
                            {/* Avatar on the timeline */}
                            <div className="absolute left-0 w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none ring-2 ring-white dark:ring-neutral-900">
                              {getInitials(c.author)}
                            </div>

                            {/* Bubble */}
                            <div className="flex-1 min-w-0">
                              {/* Author row */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-xs font-semibold text-stone-800 dark:text-neutral-200">
                                  {c.author}
                                </span>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                                  ${c.role === "ADMIN"
                                    ? "bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400"
                                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                                  }`}
                                >
                                  {c.role === "ADMIN" ? "Pastorate" : "Core Leader"}
                                </span>
                                <span className="text-[11px] text-stone-400 dark:text-neutral-500">
                                  {formatCommentTime(c.createdAt)}
                                </span>
                                {/* "You" tag for comments by current user */}
                                {c.author === MOCK_USER.name && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-500">
                                    You
                                  </span>
                                )}
                              </div>

                              {/* Comment text */}
                              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed text-stone-700 dark:text-neutral-300
                                ${c.author === MOCK_USER.name
                                  ? "bg-stone-100 dark:bg-neutral-800 rounded-tl-sm"
                                  : "bg-stone-50 dark:bg-neutral-800/60 border border-stone-100 dark:border-neutral-700/60 rounded-tl-sm"
                                }`}
                              >
                                {c.content}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* End of timeline dot */}
                        <div className="relative pl-10">
                          <div className="absolute left-0 w-8 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-stone-200 dark:bg-neutral-700 ring-2 ring-white dark:ring-neutral-900" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Add comment box ── */}
                <div className="px-6 pb-6">
                  <div className="border-t border-stone-100 dark:border-neutral-800 pt-5">
                    <div className="flex items-start gap-3">
                      {/* Current user avatar */}
                      <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none mt-0.5">
                        {getInitials(MOCK_USER.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
                          Leave a comment
                        </label>
                        <textarea
                          ref={commentBoxRef}
                          value={comment}
                          onChange={(e) => {
                            setComment(e.target.value);
                            if (commentError) setCommentError("");
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Write your feedback, instructions, or follow-up notes…"
                          rows={4}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors resize-none leading-relaxed
                            bg-stone-50 dark:bg-neutral-800
                            text-stone-900 dark:text-white
                            placeholder-stone-400 dark:placeholder-neutral-500
                            ${commentError
                              ? "border-red-400 dark:border-red-700"
                              : "border-stone-200 dark:border-neutral-700 focus:border-stone-400 dark:focus:border-neutral-500"
                            }`}
                        />

                        {/* Error */}
                        {commentError && (
                          <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                            <AlertCircle size={11} />
                            {commentError}
                          </p>
                        )}

                        {/* Footer row */}
                        <div className="flex items-center justify-between mt-2.5">
                          <p className="text-[11px] text-stone-400 dark:text-neutral-500">
                            Tip: Press{" "}
                            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400 font-mono text-[10px]">
                              ⌘ Enter
                            </kbd>{" "}
                            to submit
                          </p>
                          <button
                            onClick={handleSubmitComment}
                            disabled={isSubmittingComment || !comment.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                          >
                            {isSubmittingComment ? (
                              <><Loader2 size={12} className="animate-spin" /> Posting…</>
                            ) : (
                              <><Send size={12} /> Post comment</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky bottom bar — mark reviewed shortcut */}
              {report.status === "pending" && (
                <div className="sticky bottom-4 z-10">
                  <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 shadow-lg shadow-black/5 dark:shadow-black/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <p className="text-sm text-stone-700 dark:text-neutral-300 font-medium">
                        This report is awaiting your review
                      </p>
                    </div>
                    <button
                      onClick={handleMarkReviewed}
                      disabled={isMarkingReviewed}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shrink-0"
                    >
                      {isMarkingReviewed ? (
                        <><Loader2 size={12} className="animate-spin" /> Marking…</>
                      ) : (
                        <><Check size={12} /> Mark as reviewed</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}