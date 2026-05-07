"use client";

import { CheckCircle2, Clock } from "lucide-react";
import {
  coerceNumberValue,
  formatCurrency,
  type GraphQLField,
} from "@/src/lib/dashboardHelpers";

export default function ReportFieldValue({ field }: { field: GraphQLField }) {
  if (field.type === "boolean") {
    const value = Boolean(field.value);

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          value
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
            : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
        }`}
      >
        {value ? <CheckCircle2 size={11} /> : <Clock size={11} />}
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (field.type === "multiselect") {
    const values = Array.isArray(field.value) ? field.value : [];

    return (
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {value}
          </span>
        ))}
      </div>
    );
  }

  if (field.type === "currency") {
    return (
      <p className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
        {formatCurrency(coerceNumberValue(field.value))}
      </p>
    );
  }

  if (field.type === "number") {
    return (
      <p className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
        {coerceNumberValue(field.value).toLocaleString()}
      </p>
    );
  }

  if (field.type === "textarea") {
    return (
      <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700 dark:text-neutral-300">
        {String(field.value ?? "")}
      </p>
    );
  }

  return (
    <p className="text-sm font-medium text-stone-800 dark:text-neutral-200">
      {String(field.value ?? "")}
    </p>
  );
}
