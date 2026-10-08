import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-xs">
      <div className="text-xs text-slate-600">
        Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
        <span className="font-bold text-slate-900">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={createPageURL(currentPage - 1)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </span>
        )}

        {currentPage < totalPages ? (
          <Link
            href={createPageURL(currentPage + 1)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
