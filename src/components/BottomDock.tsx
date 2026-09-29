import React from 'react';
import { NavLink } from 'react-router-dom';
import { Tv, PlayCircle, Calendar, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomDock: React.FC = () => {
  const { matches, favorites } = useApp();
  const liveCount = matches.filter(m => m.status === 'LIVE').length;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0c0e]/95 backdrop-blur-md border-t border-stone-800/60 px-4 py-2 flex items-center justify-around select-none"
      dir="rtl"
      aria-label="شريط التنقل السفلي"
    >
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors relative py-1 px-3 rounded-lg ${
            isActive ? 'text-stone-100 font-semibold' : 'text-stone-500 hover:text-stone-300'
          }`
        }
      >
        <Tv className="w-4 h-4" />
        <span className="text-[10px] mt-1">القنوات</span>
      </NavLink>

      <NavLink
        to="/watchroom"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors relative py-1 px-3 rounded-lg ${
            isActive ? 'text-emerald-400 font-semibold' : 'text-stone-500 hover:text-stone-300'
          }`
        }
      >
        <PlayCircle className="w-4 h-4" />
        <span className="text-[10px] mt-1">المشغل</span>
      </NavLink>

      <NavLink
        to="/schedual"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors relative py-1 px-3 rounded-lg ${
            isActive ? 'text-stone-100 font-semibold' : 'text-stone-500 hover:text-stone-300'
          }`
        }
      >
        <div className="relative">
          <Calendar className="w-4 h-4" />
          {liveCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </div>
        <span className="text-[10px] mt-1">المباريات</span>
      </NavLink>

      <NavLink
        to="/favorit"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors relative py-1 px-3 rounded-lg ${
            isActive ? 'text-amber-400 font-semibold' : 'text-stone-500 hover:text-stone-300'
          }`
        }
      >
        <div className="relative">
          <Star className="w-4 h-4" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-2 text-[9px] font-mono-num bg-amber-400 text-stone-950 font-bold px-1 rounded-full">
              {favorites.length}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-1">المفضلة</span>
      </NavLink>
    </nav>
  );
};
