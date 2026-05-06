"use client";

import { CheckCircle2, Clock } from "lucide-react";
import type { ReportStatus } from "@/src/lib/dashboardHelpers";

export default function ReportStatusPill({ status }: { status: ReportStatus }) {
  if (status === "reviewed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
        <CheckCircle2 size={11} />
        Reviewed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
      <Clock size={11} />
      Pending
    </span>
  );
}
