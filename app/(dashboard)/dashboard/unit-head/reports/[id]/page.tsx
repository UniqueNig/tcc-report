"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  MessageSquare,
  FileText,
  Paperclip,
  Download,
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
  attachment?: {
    name: string;
    size: string;
    url: string;
  };
  comments: Comment[];
}

// ── Mock data (replace with GraphQL query using the route [id]) ──
const MOCK_REPORT: ReportDetail = {
  id: "1",
  title: "Sunday Service — May 4, 2026",
  content: `The Sunday service was a great time of worship and fellowship. The music team led the congregation in 5 songs, including two new worship songs that were well received by the congregation.

Attendance was approximately 120 adults and 35 children. The service ran from 9:00 AM to 11:45 AM.

Key highlights:
- Special ministration by the choir during offering
- Three new visitors were welcomed and followed up with
- The sound system had a brief issue during the second song but was resolved quickly

Prayer points raised:
- Upcoming evangelism outreach scheduled for May 15th
- Members going through difficult seasons — three families mentioned for prayer
- The building project fund update was shared by the pastor

Challenges:
- Two team members were absent without prior notice
- We need more volunteers for the children's unit support

Overall it was a Spirit-filled service and the congregation left encouraged.`,
  unit: "Music Unit",
  submittedBy: "Adeola Obi",
  dateSubmitted: "2026-05-04T09:00:00Z",
  status: "pending",
  attachment: {
    name: "sunday-service-attendance.pdf",
    size: "124 KB",
    url: "#",
  },
  comments: [
    {
      id: "c1",
      author: "Br. Oluwole",
      role: "CORE_LEADER",
      content:
        "Thank you for this detailed report Adeola. Please ensure the absent team members provide an explanation before the next service. The choir ministration feedback was noted — well done to the team.",
      createdAt: "2026-05-04T14:30:00Z",
    },
  ],
};

const MOCK_USER = {
  name: "Adeola Obi",
  unit: "Music Unit",
  role: "UNIT_HEAD" as const,
};

// ── Helpers ────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-stone-500 dark:text-neutral-400" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm text-stone-800 dark:text-neutral-200 font-medium">
          {value}
        </p>
      </div>
    </div>
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
            <div key={i} className="flex items-start gap-3">
              <div className="skeleton w-7 h-7 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-2.5 w-16 rounded" />
                <div className="skeleton h-3.5 w-28 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-3.5 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function ReportDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading] = useState(false); // replace with real loading state

  // In production, fetch report using the route param:
  // const params = useParams();
  // const { data, loading } = useQuery(GET_REPORT, { variables: { id: params.id } });
  const report = MOCK_REPORT;

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
          {isLoading ? (
            <ReportSkeleton />
          ) : (
            <div className="max-w-3xl mx-auto">

              {/* Back link */}
              <Link
                href="/dashboard/unit-head/reports"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 dark:text-neutral-500 hover:text-stone-700 dark:hover:text-neutral-200 transition-colors mb-5"
              >
                <ArrowLeft size={13} />
                Back to my reports
              </Link>

              {/* Title + status */}
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight leading-snug">
                    {report.title}
                  </h1>
                  <p className="text-sm text-stone-400 dark:text-neutral-500 mt-1">
                    Report #{report.id}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              {/* Meta card */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <MetaItem
                    icon={User}
                    label="Submitted by"
                    value={report.submittedBy}
                  />
                  <MetaItem
                    icon={Building2}
                    label="Unit"
                    value={report.unit}
                  />
                  <MetaItem
                    icon={Calendar}
                    label="Date submitted"
                    value={formatDate(report.dateSubmitted)}
                  />
                  <MetaItem
                    icon={FileText}
                    label="Status"
                    value={report.status === "reviewed" ? "Reviewed by core leader" : "Awaiting review"}
                  />
                </div>
              </div>

              {/* Attachment */}
              {report.attachment && (
                <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl px-5 py-4 mb-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <Paperclip size={15} className="text-stone-500 dark:text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 dark:text-neutral-200 truncate">
                      {report.attachment.name}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500">
                      {report.attachment.size}
                    </p>
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
                <div className="prose prose-sm max-w-none">
                  {report.content.split("\n\n").map((paragraph, i) => {
                    // Render list-like paragraphs
                    if (paragraph.startsWith("- ")) {
                      const items = paragraph.split("\n").filter((l) => l.startsWith("- "));
                      return (
                        <ul key={i} className="space-y-1.5 mb-4 pl-1">
                          {items.map((item, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2 text-sm text-stone-700 dark:text-neutral-300 leading-relaxed"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-neutral-500 mt-2 shrink-0" />
                              {item.replace("- ", "")}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    // Section headings (ends with colon)
                    if (paragraph.endsWith(":")) {
                      return (
                        <p
                          key={i}
                          className="text-sm font-semibold text-stone-800 dark:text-neutral-200 mt-5 mb-1.5"
                        >
                          {paragraph}
                        </p>
                      );
                    }
                    // Regular paragraph
                    return (
                      <p
                        key={i}
                        className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed mb-4 last:mb-0"
                      >
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Comments section */}
              <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <h2 className="text-xs font-semibold text-stone-400 dark:text-neutral-500 uppercase tracking-wider">
                    Comments
                  </h2>
                  {report.comments.length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 dark:bg-neutral-800 text-[10px] font-semibold text-stone-500 dark:text-neutral-400">
                      {report.comments.length}
                    </span>
                  )}
                </div>

                {report.comments.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                      <MessageSquare size={16} className="text-stone-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">
                      No comments yet
                    </p>
                    <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">
                      Your core leader will leave feedback here after reviewing
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {report.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-stone-600 dark:text-neutral-300 shrink-0 select-none">
                          {getInitials(comment.author)}
                        </div>

                        {/* Bubble */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-stone-50 dark:bg-neutral-800 border border-stone-100 dark:border-neutral-700/60 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800 dark:text-neutral-200">
                                  {comment.author}
                                </span>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                                  ${comment.role === "ADMIN"
                                    ? "bg-stone-200 dark:bg-neutral-700 text-stone-600 dark:text-neutral-300"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                  }`}
                                >
                                  {comment.role === "ADMIN" ? "Pastorate" : "Core Leader"}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-400 dark:text-neutral-500 shrink-0">
                                {formatCommentDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed">
                              {comment.content}
                            </p>
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