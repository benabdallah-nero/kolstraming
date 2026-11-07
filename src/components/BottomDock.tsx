import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const BottomDock: React.FC = () => {
  const { matches } = useApp();
  const liveCount = matches.filter(m => m.status === 'LIVE').length;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] grid grid-cols-3 h-14 select-none"
      dir="rtl"
      aria-label="شريط التنقل السفلي"
    >
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center border-l border-[var(--border-hairline)] border-t-[3px] transition-colors ${
            isActive
              ? 'border-t-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-extrabold'
              : 'border-t-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`
        }
      >
        <span className="font-display-num text-[11px] uppercase tracking-wider font-bold">CHANNELS</span>
        <span className="font-display-ar text-xs font-bold">القنوات</span>
      </NavLink>

      <NavLink
        to="/schedule"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center border-l border-[var(--border-hairline)] border-t-[3px] transition-colors relative ${
            isActive
              ? 'border-t-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-extrabold'
              : 'border-t-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`
        }
      >
        <div className="flex items-center gap-1.5">
          {liveCount > 0 && (
            <span className="w-2 h-2 rounded-full live-dot-pulse" />
          )}
          <span className="font-display-num text-[11px] uppercase tracking-wider font-bold">
            {liveCount > 0 ? `LIVE ${liveCount}` : 'SCHEDULE'}
          </span>
        </div>
        <span className="font-display-ar text-xs font-bold">المباريات</span>
      </NavLink>

      <NavLink
        to="/watchroom"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center border-t-[3px] transition-colors ${
            isActive
              ? 'border-t-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-extrabold'
              : 'border-t-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`
        }
      >
        <span className="font-display-num text-[11px] uppercase tracking-wider font-bold">WATCHROOM</span>
        <span className="font-display-ar text-xs font-bold">غرفة البث</span>
      </NavLink>
    </nav>
  );
};
