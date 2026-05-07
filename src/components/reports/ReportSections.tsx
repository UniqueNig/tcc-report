"use client";

import type { GraphQLSection } from "@/src/lib/dashboardHelpers";
import ReportFieldValue from "@/src/components/reports/ReportFieldValue";

export default function ReportSections({ sections }: { sections: GraphQLSection[] }) {
  return (
    <>
      {sections.map((section) => {
        const numberFields = section.fields.filter(
          (field) => field.type === "number" || field.type === "currency"
        );
        const otherFields = section.fields.filter(
          (field) => field.type !== "number" && field.type !== "currency"
        );
        const numberGridClass =
          numberFields.length === 1
            ? "grid-cols-1"
            : numberFields.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

        return (
          <div
            key={section.title}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl"
          >
            <div className="border-b border-stone-100 px-4 py-4 dark:border-neutral-800 sm:px-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                {section.title}
              </h2>
            </div>

            {numberFields.length > 0 && (
              <div
                className={`grid ${numberGridClass} gap-px bg-stone-100 dark:bg-neutral-800 ${
                  otherFields.length > 0 ? "border-b border-stone-100 dark:border-neutral-800" : ""
                }`}
              >
                {numberFields.map((field) => (
                  <div
                    key={field.id}
                    className="min-w-0 bg-white px-4 py-4 text-center dark:bg-neutral-900 sm:px-5"
                  >
                    <p className="mx-auto mb-1 max-w-full break-words text-xs leading-snug text-stone-400 dark:text-neutral-500">
                      {field.label}
                    </p>
                    <ReportFieldValue field={field} />
                  </div>
                ))}
              </div>
            )}

            {otherFields.length > 0 && (
              <div className="space-y-5 px-4 py-5 sm:px-6">
                {otherFields.map((field) => (
                  <div key={field.id} className="min-w-0">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                      {field.label}
                    </p>
                    <ReportFieldValue field={field} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
