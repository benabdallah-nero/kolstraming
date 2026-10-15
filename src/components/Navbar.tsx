import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Tv, PlayCircle, Calendar, Star, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { channels, matches, favorites, refreshMatches, loadingMatches } = useApp();
  const navigate = useNavigate();

  const liveMatchesCount = matches.filter(m => m.status === 'LIVE').length;

  return (
    <header className="bg-[#0b0c0e]/95 backdrop-blur-md border-b border-stone-800/40 sticky top-0 z-40 text-stone-200 select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brandmark */}
        <div
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 cursor-pointer active:opacity-75 transition-opacity shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Tv className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono-num text-lg font-bold tracking-tight text-stone-100">
                kolstream
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                live
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#121316]/80 border border-stone-800/60 px-2 py-1.5 rounded-xl">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-stone-100 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-850'
              }`
            }
          >
            <Tv className="w-3.5 h-3.5" />
            <span>القنوات</span>
            {channels.length > 0 && (
              <span className="text-[10px] font-mono-num opacity-70">({channels.length})</span>
            )}
          </NavLink>

          <NavLink
            to="/watchroom"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-stone-100 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-850'
              }`
            }
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>غرفة المشاهدة</span>
          </NavLink>

          <NavLink
            to="/schedual"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-stone-100 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-850'
              }`
            }
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>المباريات</span>
            {liveMatchesCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] bg-rose-500 text-white font-mono-num px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                {liveMatchesCount} مباشر
              </span>
            )}
          </NavLink>

          <NavLink
            to="/favorit"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-stone-100 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-850'
              }`
            }
          >
            <Star className="w-3.5 h-3.5" />
            <span>المفضلة</span>
            {favorites.length > 0 && (
              <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono-num px-1.5 py-0.2 rounded-full">
                {favorites.length}
              </span>
            )}
          </NavLink>
        </nav>

        {/* Live Indicator & Quick Reload */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refreshMatches()}
            disabled={loadingMatches}
            className="p-1.5 rounded-lg border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 transition active:rotate-180 disabled:opacity-50"
            title="تحديث البيانات المباشرة"
            aria-label="تحديث المباريات المباشرة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMatches ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <div className="flex items-center gap-1.5 text-xs text-stone-400 bg-stone-900 border border-stone-800/80 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono-num text-[11px] text-stone-300 hidden sm:inline">بث مباشر 1080p</span>
            <span className="font-mono-num text-[11px] text-stone-300 sm:hidden">مباشر</span>
          </div>
        </div>
      </div>
    </header>
  );
};
