import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const BottomDock: React.FC = () => {
  const { matches } = useApp();
  const liveCount = matches.filter(m => m.status === 'LIVE').length;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] grid grid-cols-4 h-14 select-none"
      dir="rtl"
      aria-label="شريط التنقل السفلي"
    >
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center border-l border-[var(--border-hairline)] border-t-[3px] transition-colors ${
            isActive
              ? 'border-t-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-extrabold'
              : 'border-t-transparent text-[var(--text-secondary)]'
          }`
        }
      >
        <span className="font-display-num text-[10px] uppercase tracking-wider opacity-70">CH</span>
        <span className="font-display-ar text-xs">القنوات</span>
      </NavLink>

      <NavLink
        to="/schedule"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center border-l border-[var(--border-hairline)] border-t-[3px] transition-colors relative ${
            isActive
              ? 'border-t-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-extrabold'
              : 'border-t-transparent text-[var(--text-secondary)]'
          }`
        }
      >
        <div className="flex items-center gap-1">
          {liveCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full live-dot-pulse" />
          )}
          <span className="font-display-num text-[10px] uppercase tracking-wider opacity-70">
            {liveCount > 0 ? `LIVE ${liveCount}` : 'FIX'}
          </span>
        </div>
        <span className="font-display-ar text-xs">المباريات</span>
      </NavLink>

      <NavLink
        to="/leagues"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center border-l border-[var(--border-hairline)] border-t-[3px] transition-colors ${
            isActive
              ? 'border-t-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-extrabold'
              : 'border-t-transparent text-[var(--text-secondary)]'
          }`
        }
      >
        <span className="font-display-num text-[10px] uppercase tracking-wider opacity-70">TBL</span>
        <span className="font-display-ar text-xs">الترتيب</span>
      </NavLink>

      <NavLink
        to="/watchroom"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center border-t-[3px] transition-colors ${
            isActive
              ? 'border-t-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-extrabold'
              : 'border-t-transparent text-[var(--text-secondary)]'
          }`
        }
      >
        <span className="font-display-num text-[10px] uppercase tracking-wider opacity-70">FEED</span>
        <span className="font-display-ar text-xs">غرفة البث</span>
      </NavLink>
    </nav>
  );
};
