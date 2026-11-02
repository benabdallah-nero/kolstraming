import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer
      className="mt-14 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs select-none"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-5 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[var(--accent-primary)] shrink-0" />
            <div>
              <div className="font-display-num text-xl font-extrabold uppercase tracking-wider text-[var(--text-primary)] leading-none">
                KOLSTREAM
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                التغطية المباشرة للمباريات، النتائج الفورية، ودليل القنوات الرياضية الناقلة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <Link to="/home" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors font-semibold">
              الرئيسية والقنوات
            </Link>
            <Link to="/schedual" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors font-semibold">
              جدول المباريات
            </Link>
            <Link to="/leagues" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors font-semibold">
              ترتيب الدوريات
            </Link>
            <Link to="/watchroom" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors font-semibold">
              غرفة البث
            </Link>
            <span className="text-[var(--border-strong)]">|</span>
            <Link to="/privacy" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              الخصوصية
            </Link>
            <Link to="/terms" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              الشروط
            </Link>
            <Link to="/dmca" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-display-num">
              DMCA
            </Link>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[var(--text-muted)] text-[11px]">
          <span className="font-display-num">
            © {new Date().getFullYear()} KOLSTREAM BROADCAST NETWORK
          </span>
          <span>توقيت المباريات والنتائج محدث تلقائياً على مدار الساعة</span>
        </div>
      </div>
    </footer>
  );
};
