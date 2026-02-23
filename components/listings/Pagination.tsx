import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage:  number;
  totalPages:   number;
  searchParams: Record<string, string>;
}

function buildUrl(searchParams: Record<string, string>, page: number) {
  const params = new URLSearchParams(searchParams);
  params.set("page", String(page));
  return `/?${params.toString()}`;
}

export function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const pages: (number | "…")[] = [];
  const WINDOW = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - WINDOW && i <= currentPage + WINDOW)) {
      pages.push(i);
    } else if (
      (i === 2 && currentPage - WINDOW > 2) ||
      (i === totalPages - 1 && currentPage + WINDOW < totalPages - 1)
    ) {
      pages.push("…");
    }
  }
  const dedupedPages = pages.filter((p, i) => !(p === "…" && pages[i - 1] === "…"));

  const prevHref = currentPage > 1 ? buildUrl(searchParams, currentPage - 1) : null;
  const nextHref = currentPage < totalPages ? buildUrl(searchParams, currentPage + 1) : null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {prevHref ? (
        <Link href={prevHref} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-500 bg-dark-700 text-gray-300 hover:border-brand-500/60 hover:text-brand-300 transition-all text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Prev
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-600 bg-dark-800 text-gray-600 text-sm font-medium cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" /> Prev
        </span>
      )}
      <div className="flex items-center gap-1">
        {dedupedPages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-500 text-sm">…</span>
          ) : (
            <Link key={p} href={buildUrl(searchParams, p)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                p === currentPage
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "bg-dark-700 border border-dark-500 text-gray-300 hover:border-brand-500/60 hover:text-brand-300"
              }`}>
              {p}
            </Link>
          )
        )}
      </div>
      {nextHref ? (
        <Link href={nextHref} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-500 bg-dark-700 text-gray-300 hover:border-brand-500/60 hover:text-brand-300 transition-all text-sm font-medium">
          Next <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-600 bg-dark-800 text-gray-600 text-sm font-medium cursor-not-allowed">
          Next <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}
