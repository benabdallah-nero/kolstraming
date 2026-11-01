import React from 'react';
import { NavLink } from 'react-router-dom';
import { Tv, PlayCircle, Calendar, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomDock: React.FC = () => {
  const { matches } = useApp();
  const liveCount = matches.filter(m => m.status === 'LIVE').length;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090b0f]/95 backdrop-blur-md border-t border-stone-800/80 px-2 py-2 flex items-center justify-around select-none"
      dir="rtl"
      aria-label="شريط التنقل السفلي"
    >
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors relative py-1 px-3 rounded-lg ${
            isActive ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`
        }
      >
        <Tv className="w-4 h-4" />
        <span className="text-[11px] mt-1">القنوات</span>
      </NavLink>

      <NavLink
        to="/schedual"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors relative py-1 px-3 rounded-lg ${
            isActive ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`
        }
      >
        <div className="relative">
          <Calendar className="w-4 h-4" />
          {liveCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </div>
        <span className="text-[11px] mt-1">المباريات</span>
      </NavLink>

      <NavLink
        to="/leagues"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors relative py-1 px-3 rounded-lg ${
            isActive ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`
        }
      >
        <Trophy className="w-4 h-4" />
        <span className="text-[11px] mt-1">الترتيب</span>
      </NavLink>

      <NavLink
        to="/watchroom"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors relative py-1 px-3 rounded-lg ${
            isActive ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`
        }
      >
        <PlayCircle className="w-4 h-4" />
        <span className="text-[11px] mt-1">المشغل</span>
      </NavLink>
    </nav>
  );
};

