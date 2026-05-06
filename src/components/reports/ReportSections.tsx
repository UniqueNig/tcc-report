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

        return (
          <div
            key={section.title}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="border-b border-stone-100 px-6 py-4 dark:border-neutral-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                {section.title}
              </h2>
            </div>

            {numberFields.length > 0 && (
              <div
                className="grid divide-x divide-stone-100 border-b border-stone-100 dark:divide-neutral-800 dark:border-neutral-800"
                style={{ gridTemplateColumns: `repeat(${Math.min(numberFields.length, 3)}, 1fr)` }}
              >
                {numberFields.map((field) => (
                  <div key={field.id} className="px-5 py-4 text-center">
                    <p className="mb-1 text-xs text-stone-400 dark:text-neutral-500">
                      {field.label}
                    </p>
                    <ReportFieldValue field={field} />
                  </div>
                ))}
              </div>
            )}

            {otherFields.length > 0 && (
              <div className="space-y-5 px-6 py-5">
                {otherFields.map((field) => (
                  <div key={field.id}>
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
