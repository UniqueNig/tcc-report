"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, CheckCircle2, Clock, Trash2,
  MessageSquare, Download, Loader2, X, Send,
  User, Calendar, FileText, AlertCircle, MoreHorizontal,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";

// ── Types ──────────────────────────────────────────────
type ReportStatus = "pending" | "reviewed";

interface Comment {
  id: string;
  author: string;
  role: "ADMIN" | "CORE_LEADER" | "UNIT_HEAD";
  body: string;
  createdAt: string; // ISO
}

interface ReportDetail {
  id: string;
  title: string;
  serviceType: string;
  unitName: string;
  submittedBy: string;
  coreLeader: string;
  dateSubmitted: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  // Report body fields
  attendance: number;
  firstTimers: number;
  offerings: string;
  observations: string;
  prayerPoints: string;
  highlights: string;
  comments: Comment[];
}

// ── Mock data ──────────────────────────────────────────
const MOCK_REPORTS: Record<string, ReportDetail> = {
  "1": {
    id: "1",
    title: "Sunday Service — May 4",
    serviceType: "Sunday Service",
    unitName: "Music Unit",
    submittedBy: "Adeola Obi",
    coreLeader: "Br. Oluwole",
    dateSubmitted: "2026-05-04T09:15:00",
    status: "pending",
    attendance: 312,
    firstTimers: 14,
    offerings: "₦128,500",
    observations: "The worship session went smoothly. The choir was well-prepared and the congregation was highly responsive during praise. We noticed the PA system had a slight feedback issue around the 20-minute mark which was quickly resolved by the sound team.",
    prayerPoints: "Pray for consistency in choir rehearsal attendance. Pray for the sound system upgrade currently being planned. Pray for new members joining the music unit.",
    highlights: "We introduced two new worship songs this week that were very well received. Sister Blessing led worship for the first time and did an excellent job.",
    comments: [
      {
        id: "c1",
        author: "Br. Oluwole",
        role: "CORE_LEADER",
        body: "Thank you for the detailed report. Please follow up on the PA system issue with the facility team before next Sunday.",
        createdAt: "2026-05-04T14:30:00",
      },
    ],
  },
  "2": {
    id: "2",
    title: "Sunday Service — May 4",
    serviceType: "Sunday Service",
    unitName: "Media Unit",
    submittedBy: "Kemi Adeyemi",
    coreLeader: "Br. Oluwole",
    dateSubmitted: "2026-05-04T10:00:00",
    status: "pending",
    attendance: 312,
    firstTimers: 14,
    offerings: "₦128,500",
    observations: "Live stream ran without interruption for the full duration. We had 87 online viewers. The camera angles were well-coordinated. One of the tripods needs replacement — it's been wobbling during transitions.",
    prayerPoints: "Pray for more volunteers to join the media team. Pray for equipment upgrades especially camera 2.",
    highlights: "New graphics package was used for the first time for sermon slides. Great feedback from the congregation.",
    comments: [],
  },
  "4": {
    id: "4",
    title: "Midweek — Apr 30",
    serviceType: "Midweek Service",
    unitName: "Music Unit",
    submittedBy: "Adeola Obi",
    coreLeader: "Br. Oluwole",
    dateSubmitted: "2026-04-30T19:45:00",
    status: "reviewed",
    reviewedBy: "Pastor Adewale",
    reviewedAt: "2026-05-01T08:20:00",
    attendance: 187,
    firstTimers: 5,
    offerings: "₦62,000",
    observations: "Midweek service was intimate and focused. The worship team maintained excellent energy despite the smaller congregation. Rehearsal the day before made a noticeable difference.",
    prayerPoints: "Pray for increased midweek attendance. Pray for the new instruments to arrive soon.",
    highlights: "The spontaneous worship moment in the middle of the service was exceptional. The Holy Spirit moved deeply.",
    comments: [
      {
        id: "c2",
        author: "Br. Oluwole",
        role: "CORE_LEADER",
        body: "Well done team. The midweek atmosphere has been improving consistently. Keep it up.",
        createdAt: "2026-04-30T22:00:00",
      },
      {
        id: "c3",
        author: "Pastor Adewale",
        role: "ADMIN",
        body: "Reviewed. Excellent report. The spontaneous worship moment was indeed a highlight — I was there. God bless the team.",
        createdAt: "2026-05-01T08:20:00",
      },
    ],
  },
};

// Fallback for IDs not in mock
function getFallbackReport(id: string): ReportDetail {
  return {
    id,
    title: `Report #${id}`,
    serviceType: "Sunday Service",
    unitName: "Music Unit",
    submittedBy: "Adeola Obi",
    coreLeader: "Br. Oluwole",
    dateSubmitted: new Date().toISOString(),
    status: "pending",
    attendance: 0,
    firstTimers: 0,
    offerings: "—",
    observations: "No observations provided.",
    prayerPoints: "No prayer points provided.",
    highlights: "No highlights provided.",
    comments: [],
  };
}

const MOCK_USER = { name: "Pastor Adewale", role: "ADMIN" as const };

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
const ROLE_LABEL: Record<Comment["role"], string> = {
  ADMIN: "Pastorate", CORE_LEADER: "Core Leader", UNIT_HEAD: "Unit Head",
};

// ── Delete confirm modal ───────────────────────────────
function DeleteModal({ title, onConfirm, onCancel, isDeleting }: {
  title: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 mb-4 mx-auto">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-white text-center mb-1">Delete report?</h3>
        <p className="text-sm text-stone-500 dark:text-neutral-400 text-center mb-2">
          <span className="font-medium text-stone-800 dark:text-neutral-200">"{title}"</span> will be permanently deleted.
        </p>
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl px-3 py-2.5 mb-5">
          <AlertCircle size={13} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">All comments attached to this report will also be removed.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {isDeleting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function AdminReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const initial = MOCK_REPORTS[id] ?? getFallbackReport(id);
  const [report, setReport] = useState<ReportDetail>(initial);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Actions state
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);
  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleMarkReviewed() {
    setIsMarkingReviewed(true);
    await new Promise((r) => setTimeout(r, 900));
    setReport((p) => ({
      ...p,
      status: "reviewed",
      reviewedBy: MOCK_USER.name,
      reviewedAt: new Date().toISOString(),
    }));
    setIsMarkingReviewed(false);
    showToast("Report marked as reviewed");
  }

  async function handleExport() {
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 1200));
    // In production: call an API route that generates the PDF
    // For now we simulate the download
    const blob = new Blob([
      `CHURCH REPORT\n\n` +
      `Title: ${report.title}\n` +
      `Unit: ${report.unitName}\n` +
      `Submitted by: ${report.submittedBy}\n` +
      `Core leader: ${report.coreLeader}\n` +
      `Date: ${formatDate(report.dateSubmitted)}\n` +
      `Status: ${report.status}\n\n` +
      `--- REPORT BODY ---\n\n` +
      `Attendance: ${report.attendance}\nFirst timers: ${report.firstTimers}\nOfferings: ${report.offerings}\n\n` +
      `Observations:\n${report.observations}\n\n` +
      `Prayer points:\n${report.prayerPoints}\n\n` +
      `Highlights:\n${report.highlights}\n\n` +
      `--- COMMENTS (${report.comments.length}) ---\n\n` +
      report.comments.map((c) => `[${c.author} — ${formatDateTime(c.createdAt)}]\n${c.body}`).join("\n\n")
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_")}_${report.unitName.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
    showToast("Report exported");
  }

  async function handleDelete() {
    setIsDeleting(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsDeleting(false);
    setShowDelete(false);
    router.push("/dashboard/admin/reports");
  }

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setIsPostingComment(true);
    await new Promise((r) => setTimeout(r, 700));
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: MOCK_USER.name,
      role: "ADMIN",
      body: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    setReport((p) => ({ ...p, comments: [...p.comments, newComment] }));
    setCommentText("");
    setIsPostingComment(false);
  }

  // ── Render ─────────────────────────────────────────
  return (
    <div className="flex h-screen bg-stone-100 dark:bg-neutral-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={MOCK_USER} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: MOCK_USER.name }} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 fade-up">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg fade-up
              ${toast.type === "error"
                ? "bg-white dark:bg-neutral-900 border-red-200 dark:border-red-900"
                : "bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-800"}`}>
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">{toast.msg}</p>
            </div>
          )}

          {/* Back nav */}
          <div className="mb-5">
            <Link href="/dashboard/admin/reports"
              className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-neutral-400 hover:text-stone-800 dark:hover:text-white transition-colors">
              <ArrowLeft size={14} />Back to reports
            </Link>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Main column ── */}
            <div className="xl:col-span-2 space-y-5">

              {/* Header card */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {report.status === "reviewed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <CheckCircle2 size={11} />Reviewed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                          <Clock size={11} />Pending review
                        </span>
                      )}
                      <span className="text-xs text-stone-400 dark:text-neutral-500">{report.serviceType}</span>
                    </div>
                    <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight mb-1">
                      {report.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 dark:text-neutral-500 mt-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 size={11} />{report.unitName}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <User size={11} />{report.submittedBy}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={11} />{formatDate(report.dateSubmitted)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {report.status === "pending" && (
                      <button onClick={handleMarkReviewed} disabled={isMarkingReviewed}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 transition-all active:scale-[0.98]">
                        {isMarkingReviewed
                          ? <><Loader2 size={14} className="animate-spin" />Marking…</>
                          : <><CheckSquare size={14} />Mark reviewed</>}
                      </button>
                    )}
                    <button onClick={handleExport} disabled={isExporting}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white disabled:opacity-60 transition-all">
                      {isExporting
                        ? <><Loader2 size={14} className="animate-spin" />Exporting…</>
                        : <><Download size={14} />Export</>}
                    </button>
                    <button onClick={() => setShowDelete(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900 transition-all">
                      <Trash2 size={14} />Delete
                    </button>
                  </div>
                </div>

                {/* Reviewed by banner */}
                {report.status === "reviewed" && report.reviewedBy && (
                  <div className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Reviewed by <span className="font-semibold">{report.reviewedBy}</span>
                      {report.reviewedAt && <> on {formatDateTime(report.reviewedAt)}</>}
                    </p>
                  </div>
                )}
              </div>

              {/* Report body */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl divide-y divide-stone-100 dark:divide-neutral-800">

                {/* Stats row */}
                <div className="grid grid-cols-3 divide-x divide-stone-100 dark:divide-neutral-800">
                  {[
                    { label: "Attendance", value: report.attendance },
                    { label: "First timers", value: report.firstTimers },
                    { label: "Offerings", value: report.offerings },
                  ].map(({ label, value }) => (
                    <div key={label} className="px-5 py-4 text-center">
                      <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">{label}</p>
                      <p className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Text sections */}
                {[
                  { label: "Observations", value: report.observations },
                  { label: "Prayer points", value: report.prayerPoints },
                  { label: "Highlights", value: report.highlights },
                ].map(({ label, value }) => (
                  <div key={label} className="px-6 py-5">
                    <p className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-widest mb-2.5">{label}</p>
                    <p className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={14} className="text-stone-400 dark:text-neutral-500" />
                    Comments
                    {report.comments.length > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400">
                        {report.comments.length}
                      </span>
                    )}
                  </h2>
                </div>

                {/* Comment list */}
                <div className="px-6 py-4 space-y-5">
                  {report.comments.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                        <MessageSquare size={15} className="text-stone-400 dark:text-neutral-500" />
                      </div>
                      <p className="text-sm text-stone-500 dark:text-neutral-400">No comments yet</p>
                      <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Be the first to leave feedback on this report</p>
                    </div>
                  ) : (
                    report.comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none mt-0.5">
                          {getInitials(c.author)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-stone-800 dark:text-neutral-200">{c.author}</span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium
                              ${c.role === "ADMIN"
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                                : c.role === "CORE_LEADER"
                                  ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                                  : "bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400"}`}>
                              {ROLE_LABEL[c.role]}
                            </span>
                            <span className="text-xs text-stone-400 dark:text-neutral-500">{formatDateTime(c.createdAt)}</span>
                          </div>
                          <div className="bg-stone-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
                            <p className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed">{c.body}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment input */}
                <div className="px-6 pb-5 pt-2 border-t border-stone-100 dark:border-neutral-800">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none mt-1">
                      {getInitials(MOCK_USER.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePostComment(); }}
                        placeholder="Leave a comment or feedback…"
                        rows={3}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 outline-none focus:border-stone-400 dark:focus:border-neutral-500 resize-none transition-colors"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-stone-400 dark:text-neutral-500">⌘ + Enter to post</p>
                        <button
                          onClick={handlePostComment}
                          disabled={!commentText.trim() || isPostingComment}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                          {isPostingComment
                            ? <><Loader2 size={12} className="animate-spin" />Posting…</>
                            : <><Send size={12} />Post comment</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sidebar / meta column ── */}
            <div className="space-y-4">

              {/* Report meta */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Report info</h3>
                <div className="space-y-4">
                  {[
                    { label: "Unit", value: report.unitName, icon: Building2 },
                    { label: "Submitted by", value: report.submittedBy, icon: User },
                    { label: "Core leader", value: report.coreLeader, icon: User },
                    { label: "Submitted", value: formatDateTime(report.dateSubmitted), icon: Calendar },
                    { label: "Service type", value: report.serviceType, icon: FileText },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={12} className="text-stone-500 dark:text-neutral-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-stone-400 dark:text-neutral-500">{label}</p>
                        <p className="text-sm font-medium text-stone-800 dark:text-neutral-200 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status card */}
              <div className={`border rounded-2xl p-5 ${
                report.status === "reviewed"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50"
                  : "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {report.status === "reviewed"
                    ? <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                    : <Clock size={15} className="text-amber-600 dark:text-amber-400" />}
                  <p className={`text-sm font-semibold ${report.status === "reviewed" ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}>
                    {report.status === "reviewed" ? "Reviewed" : "Pending review"}
                  </p>
                </div>
                <p className={`text-xs ${report.status === "reviewed" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {report.status === "reviewed"
                    ? `Reviewed by ${report.reviewedBy ?? "—"}`
                    : "This report is awaiting review"}
                </p>
                {report.status === "pending" && (
                  <button onClick={handleMarkReviewed} disabled={isMarkingReviewed}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 transition-all">
                    {isMarkingReviewed
                      ? <><Loader2 size={13} className="animate-spin" />Marking…</>
                      : <><CheckSquare size={13} />Mark as reviewed</>}
                  </button>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-widest mb-3">Actions</h3>
                <div className="space-y-2">
                  <button onClick={handleExport} disabled={isExporting}
                    className="w-full inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white disabled:opacity-60 transition-all">
                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Export report
                  </button>
                  <button onClick={() => setShowDelete(true)}
                    className="w-full inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-neutral-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900 transition-all">
                    <Trash2 size={14} />Delete report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showDelete && (
        <DeleteModal
          title={report.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}