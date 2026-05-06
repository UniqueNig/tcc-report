"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import ReportSections from "@/src/components/reports/ReportSections";
import ReportStatusPill from "@/src/components/reports/ReportStatusPill";
import { REPORT_DETAIL_QUERY } from "@/src/lib/graphqlDocuments";
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

export default function UnitHeadReportDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const params = useParams<{ id: string }>();
  const reportId = params?.id ?? "";

  const { data, loading } = useQuery<{
    me: GraphQLUser | null;
    report: GraphQLReport | null;
  }>(REPORT_DETAIL_QUERY, {
    variables: { id: reportId },
    skip: !reportId,
    fetchPolicy: "network-only",
  });

  const me = data?.me ?? null;
  const report = data?.report ?? null;
  const sidebarUser = toSidebarUser(me);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-neutral-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sidebarUser} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={{ name: sidebarUser.name }} />

        <main className="fade-up flex-1 overflow-y-auto px-4 py-6 lg:px-8">
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
                href="/dashboard/unit-head/reports"
                className="mb-5 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-700 dark:text-neutral-500 dark:hover:text-neutral-200"
              >
                <ArrowLeft size={13} />
                Back to my reports
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
                          : "Awaiting review",
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

              <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-5 flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                    Comments from leadership
                  </h2>
                  {report.comments && report.comments.length > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-500 dark:bg-neutral-800 dark:text-neutral-400">
                      {report.comments.length}
                    </span>
                  )}
                </div>

                {!report.comments || report.comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
                      <MessageSquare size={16} className="text-stone-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-sm font-medium text-stone-600 dark:text-neutral-400">
                      No comments yet
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-neutral-500">
                      Your core leader will leave feedback here after reviewing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {report.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">
                          {getInitials(comment.authorUser?.name ?? "L")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="rounded-2xl rounded-tl-sm border border-stone-100 bg-stone-50 px-4 py-3 dark:border-neutral-700/60 dark:bg-neutral-800">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800 dark:text-neutral-200">
                                  {comment.authorUser?.name ?? "Leadership"}
                                </span>
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                  {comment.role === "ADMIN" ? "Pastorate" : "Core Leader"}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-400 dark:text-neutral-500">
                                {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-stone-700 dark:text-neutral-300">
                              {comment.body}
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
