"use client";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  page,
  pageSize,
  totalItems,
  itemLabel,
  onPageChange,
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) =>
      totalPages <= 7 ||
      pageNumber === 1 ||
      pageNumber === totalPages ||
      Math.abs(pageNumber - currentPage) <= 1
  );

  return (
    <div className="flex flex-col gap-3 border-t border-stone-100 px-5 py-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-stone-400 dark:text-neutral-500">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </p>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Previous
          </button>
          {pages.map((pageNumber, index) => {
            const showGap = index > 0 && pageNumber - pages[index - 1] > 1;

            return (
              <span key={pageNumber} className="inline-flex items-center gap-1">
                {showGap && (
                  <span className="px-1 text-xs text-stone-300 dark:text-neutral-600">...</span>
                )}
                <button
                  onClick={() => onPageChange(pageNumber)}
                  className={`h-7 min-w-7 rounded-lg px-2 text-xs transition-all ${
                    currentPage === pageNumber
                      ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                      : "border border-stone-200 text-stone-600 hover:bg-stone-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  }`}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
