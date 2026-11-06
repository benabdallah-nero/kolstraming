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

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

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
      <div className={`flex items-center justify-between py-2 text-xs text-[var(--text-muted)] ${className}`} dir="rtl">
        <span>إجمالي السجل: <strong className="font-display-num text-sm text-[var(--text-secondary)]">{totalItems}</strong> {itemLabel}</span>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="التنقل بين الصفحات"
      className={`w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-[var(--text-secondary)] select-none ${className}`}
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-3 text-xs">
        <div>
          عرض <span className="font-display-num text-sm font-bold text-[var(--text-primary)]">{startItem}–{endItem}</span> من{' '}
          <span className="font-display-num text-sm font-bold text-[var(--text-primary)]">{totalItems}</span> {itemLabel}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] px-2 py-1 rounded-[2px]">
            <span className="text-[11px] text-[var(--text-muted)]">العدد:</span>
            <div className="flex items-center gap-1">
              {pageSizeOptions.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-1.5 py-0.5 rounded-[2px] text-xs font-display-num font-bold transition-colors cursor-pointer ${
                    pageSize === size
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto max-w-full" dir="rtl">
        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="الأولى"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">السابق</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 text-[var(--text-muted)] font-display-num select-none"
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
                className={`min-w-7 h-7 px-2 rounded-[2px] text-sm font-display-num font-bold transition-colors flex items-center justify-center cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">التالي</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="الأخيرة"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
};
