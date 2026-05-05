"use client";

import { useState } from "react";
import {
  ArrowLeft, Building2, Calendar, User,
  Clock, CheckCircle2, MessageSquare,
  Paperclip, Download, FileText,
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

// Dynamic fields: key → label + value pairs stored from submission
interface ReportField {
  id: string;
  label: string;
  value: string | number | boolean | string[];
  type: "text" | "number" | "currency" | "textarea" | "boolean" | "select" | "multiselect";
}

interface ReportSection {
  title: string;
  fields: ReportField[];
}

interface ReportDetail {
  id: string;
  title: string;
  unit: string;
  submittedBy: string;
  dateSubmitted: string;
  status: ReportStatus;
  attachment?: { name: string; size: string; url: string };
  sections: ReportSection[]; // dynamic sections from unitSchema
  comments: Comment[];
}

// ── Mock data ──────────────────────────────────────────
// This mirrors what the DB will return after the form is submitted.
// The sections + fields come from unitSchemas.ts at submission time
// and are stored as a structured object in MongoDB.
const MOCK_REPORT: ReportDetail = {
  id: "1",
  title: "Sunday Service — May 4, 2026",
  unit: "Music Unit",
  submittedBy: "Adeola Obi",
  dateSubmitted: "2026-05-04T09:00:00Z",
  status: "pending",
  attachment: { name: "sunday-service-attendance.pdf", size: "124 KB", url: "#" },
  sections: [
    {
      title: "Service info",
      fields: [
        { id: "serviceTitle", label: "Service / event title", value: "Sunday Service — May 4, 2026", type: "text" },
        { id: "serviceType", label: "Service type", value: "Sunday Service", type: "select" },
      ],
    },
    {
      title: "Music report",
      fields: [
        { id: "ministrationTitles", label: "Song / ministration titles", value: "You Are Great\nAlpha and Omega\nJehovah You Are Welcome\nHoly Spirit Come\nGreat Are You Lord", type: "textarea" },
        { id: "choirPresent", label: "Choir members present", value: 18, type: "number" },
        { id: "choirTotal", label: "Total choir members", value: 24, type: "number" },
        { id: "rehearsalHeld", label: "Was a rehearsal held before service?", value: true, type: "boolean" },
        { id: "newSongsIntroduced", label: "New songs introduced", value: 2, type: "number" },
        { id: "highlights", label: "Highlights", value: "Sister Blessing led worship for the first time and did an excellent job. The congregation was highly responsive during the praise session.", type: "textarea" },
      ],
    },
    {
      title: "Follow-up",
      fields: [
        { id: "challenges", label: "Challenges", value: "Two team members were absent without prior notice. PA system had a brief feedback issue around the 20-minute mark but was resolved quickly.", type: "textarea" },
        { id: "prayerPoints", label: "Prayer points", value: "Pray for consistency in choir rehearsal attendance. Pray for the sound system upgrade. Pray for new members joining the music unit.", type: "textarea" },
      ],
    },
  ],
  comments: [
    {
      id: "c1",
      author: "Br. Oluwole",
      role: "CORE_LEADER",
      content: "Thank you for this detailed report Adeola. Please ensure the absent team members provide an explanation before the next service. The choir ministration feedback was noted — well done to the team.",
      createdAt: "2026-05-04T14:30:00Z",
    },
  ],
};

const MOCK_USER = { name: "Adeola Obi", unit: "Music Unit", role: "UNIT_HEAD" as const };

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function formatCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Field value renderer ───────────────────────────────
function FieldValue({ field }: { field: ReportField }) {
  if (field.type === "boolean") {
    const val = field.value as boolean;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
        ${val
          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
          : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
        }`}>
        {val ? <CheckCircle2 size={11} /> : <Clock size={11} />}
        {val ? "Yes" : "No"}
      </span>
    );
  }

  if (field.type === "multiselect") {
    const vals = field.value as string[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {vals.map((v) => (
          <span key={v} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300">
            {v}
          </span>
        ))}
      </div>
    );
  }

  if (field.type === "currency") {
    return (
      <p className="text-sm font-semibold text-stone-900 dark:text-white">
        ₦{Number(field.value).toLocaleString("en-NG")}
      </p>
    );
  }

  if (field.type === "number") {
    return (
      <p className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
        {Number(field.value).toLocaleString()}
      </p>
    );
  }

  if (field.type === "textarea") {
    return (
      <p className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
        {String(field.value)}
      </p>
    );
  }

  return (
    <p className="text-sm text-stone-800 dark:text-neutral-200 font-medium">
      {String(field.value)}
    </p>
  );
}

// ── Skeleton ───────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="skeleton h-4 w-24 rounded mb-6" />
      <div className="skeleton h-7 w-2/3 rounded mb-2" />
      <div className="skeleton h-4 w-1/3 rounded mb-8" />
      <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-2.5 w-20 rounded" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="skeleton h-3 w-28 rounded" />
          {[...Array(3)].map((_, j) => (
            <div key={j} className="space-y-2">
              <div className="skeleton h-2.5 w-24 rounded" />
              <div className="skeleton h-4 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function UnitHeadReportDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false);

  // In production:
  // const params = useParams();
  // const { data, loading } = useQuery(GET_REPORT, { variables: { id: params.id } });
  const report = MOCK_REPORT;

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
              <Link href="/dashboard/unit-head/reports"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors mb-5">
                <ArrowLeft size={13} />Back to my reports
              </Link>

              {/* Title + status */}
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight leading-snug">
                    {report.title}
                  </h1>
                  <p className="text-sm text-stone-400 dark:text-neutral-500 mt-1">Report #{report.id}</p>
                </div>
                {report.status === "reviewed" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                    <CheckCircle2 size={12} />Reviewed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                    <Clock size={12} />Pending review
                  </span>
                )}
              </div>

              {/* Meta card */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { icon: User, label: "Submitted by", value: report.submittedBy },
                    { icon: Building2, label: "Unit", value: report.unit },
                    { icon: Calendar, label: "Date submitted", value: formatDate(report.dateSubmitted) },
                    { icon: FileText, label: "Status", value: report.status === "reviewed" ? "Reviewed by core leader" : "Awaiting review" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={13} className="text-stone-500 dark:text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-sm text-stone-800 dark:text-neutral-200 font-medium">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <a href={report.attachment.url} download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-all shrink-0">
                    <Download size={12} />Download
                  </a>
                </div>
              )}

              {/* Dynamic report sections */}
              {report.sections.map((section) => {
                // Separate number fields (render as stat row) from the rest
                const numberFields = section.fields.filter((f) => f.type === "number" || f.type === "currency");
                const otherFields = section.fields.filter((f) => f.type !== "number" && f.type !== "currency");

                return (
                  <div key={section.title} className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl mb-4 overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 dark:border-neutral-800">
                      <h2 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider">
                        {section.title}
                      </h2>
                    </div>

                    {/* Number/currency fields as stat strip */}
                    {numberFields.length > 0 && (
                      <div className={`grid divide-x divide-stone-100 dark:divide-neutral-800 border-b border-stone-100 dark:border-neutral-800`}
                        style={{ gridTemplateColumns: `repeat(${Math.min(numberFields.length, 3)}, 1fr)` }}>
                        {numberFields.map((field) => (
                          <div key={field.id} className="px-5 py-4 text-center">
                            <p className="text-xs text-stone-400 dark:text-neutral-500 mb-1">{field.label}</p>
                            <FieldValue field={field} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Other fields */}
                    {otherFields.length > 0 && (
                      <div className="px-6 py-5 space-y-5">
                        {otherFields.map((field) => (
                          <div key={field.id}>
                            <p className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                              {field.label}
                            </p>
                            <FieldValue field={field} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Comments — READ ONLY for unit head */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <h2 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider">
                    Comments from leadership
                  </h2>
                  {report.comments.length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 dark:bg-neutral-800 text-[10px] font-semibold text-stone-500 dark:text-neutral-400">
                      {report.comments.length}
                    </span>
                  )}
                </div>

                {report.comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                      <MessageSquare size={16} className="text-stone-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">No comments yet</p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                      Your core leader will leave feedback here after reviewing
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {report.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none">
                          {getInitials(comment.author)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-stone-50 dark:bg-neutral-800 border border-stone-100 dark:border-neutral-700/60 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800 dark:text-neutral-200">{comment.author}</span>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                                  ${comment.role === "ADMIN"
                                    ? "bg-stone-200 dark:bg-neutral-700 text-stone-600 dark:text-neutral-300"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"}`}>
                                  {comment.role === "ADMIN" ? "Pastorate" : "Core Leader"}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-400 dark:text-neutral-500 shrink-0">
                                {formatCommentDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}