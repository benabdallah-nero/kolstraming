import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  syncWithUrl?: boolean;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 36, 48],
  syncWithUrl = true,
  itemLabel = 'عنصر',
  className = ''
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Change page handler with optional URL sync and scroll-to-top
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;

    if (syncWithUrl) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', String(newPage));
      setSearchParams(nextParams, { replace: false });
    }

    onPageChange(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Change page size handler
  const handlePageSizeChange = (newSize: number) => {
    if (newSize === pageSize) return;

    if (syncWithUrl) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('pageSize', String(newSize));
      nextParams.set('page', '1');
      setSearchParams(nextParams, { replace: false });
    }

    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
    onPageChange(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate items range summary
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis handling
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  if (totalPages <= 1 && totalItems <= pageSizeOptions[0]) {
    return (
      <div className={`flex items-center justify-between py-3 text-xs text-stone-500 font-mono-num ${className}`} dir="rtl">
        <span>إجمالي {totalItems} {itemLabel}</span>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="التنقل بين الصفحات"
      className={`w-full bg-[#121316]/90 border border-stone-800/60 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-stone-300 select-none ${className}`}
      dir="rtl"
    >
      {/* Items Count Summary & Page Size Selector */}
      <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-3 text-xs">
        <div className="text-stone-400 font-mono-num">
          عرض <span className="text-stone-100 font-semibold">{startItem} - {endItem}</span> من أصل{' '}
          <span className="text-stone-100 font-semibold">{totalItems}</span> {itemLabel}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800/80 px-2 py-1 rounded-lg">
            <span className="text-[11px] text-stone-500">في الصفحة:</span>
            <div className="flex items-center gap-1">
              {pageSizeOptions.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono-num transition ${
                    pageSize === size
                      ? 'bg-stone-100 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  aria-label={`عرض ${size} في الصفحة`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Page Controls */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0" dir="rtl">
        {/* First Page Button */}
        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700 disabled:opacity-30 disabled:pointer-events-none transition"
          title="الصفحة الأولى"
          aria-label="الانتقال إلى الصفحة الأولى"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Previous Page Button (RTL: right chevron goes to previous) */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-800 text-xs text-stone-300 hover:text-white hover:border-stone-700 disabled:opacity-30 disabled:pointer-events-none transition font-medium"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">السابق</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-stone-600 font-mono select-none"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-mono-num font-medium transition flex items-center justify-center ${
                  isCurrent
                    ? 'bg-stone-100 text-stone-950 font-bold border border-stone-100 shadow-sm'
                    : 'bg-stone-900/60 border border-stone-800/80 text-stone-400 hover:text-stone-100 hover:border-stone-700'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page Button (RTL: left chevron goes to next) */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-800 text-xs text-stone-300 hover:text-white hover:border-stone-700 disabled:opacity-30 disabled:pointer-events-none transition font-medium"
          aria-label="الصفحة التالية"
        >
          <span className="hidden sm:inline">التالي</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700 disabled:opacity-30 disabled:pointer-events-none transition"
          title="الصفحة الأخيرة"
          aria-label="الانتقال إلى الصفحة الأخيرة"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
