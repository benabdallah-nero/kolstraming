import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Tv,
  PlayCircle,
  Calendar,
  Trophy,
  Search,
  X,
  Play,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    channels,
    matches,
    watchHistory,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveStreamingChannel
  } = useApp();
  const navigate = useNavigate();
  const [quickQuery, setQuickQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const liveMatchesCount = matches.filter(m => m.status === 'LIVE').length;

  // Global Ctrl+K / Cmd+K shortcut for Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    } else {
      setQuickQuery('');
    }
  }, [isCommandPaletteOpen]);

  // Quick search results
  const quickResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) {
      const recentList = watchHistory
        .map(id => channels.find(c => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .slice(0, 6);
      const topChannels = channels.slice(0, 8);
      const liveMatches = matches.filter(m => m.status === 'LIVE').slice(0, 4);
      return { recentList, channels: topChannels, matches: liveMatches };
    }

    const matchedChannels = channels
      .filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.arabicName && c.arabicName.toLowerCase().includes(q)) ||
          String(c.id).includes(q)
      )
      .slice(0, 12);

    const matchedMatches = matches
      .filter(
        m =>
          m.teamA.name.toLowerCase().includes(q) ||
          m.teamB.name.toLowerCase().includes(q) ||
          m.competition.toLowerCase().includes(q)
      )
      .slice(0, 6);

    return { recentList: [], channels: matchedChannels, matches: matchedMatches };
  }, [quickQuery, channels, matches, watchHistory]);

  return (
    <>
      <header
        className="backdrop-blur-xl border-b border-stone-800/80 bg-[#090b0f]/90 sticky top-0 z-40 select-none text-stone-100"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Clean Brand Wordmark */}
          <div
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-80 transition-opacity shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-sm">
              <Tv className="w-4 h-4" />
            </div>
            <span className="font-mono-num text-lg font-extrabold tracking-tight text-white">
              kolstream
            </span>
          </div>

          {/* Zone 2: Primary Page Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#12151c] border border-stone-800/80 p-1 rounded-xl">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`
              }
            >
              <Tv className="w-3.5 h-3.5" />
              <span>الرئيسية والقنوات</span>
            </NavLink>

            <NavLink
              to="/schedual"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`
              }
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>المباريات والنتائج</span>
              {liveMatchesCount > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-mono-num px-1.5 py-0.2 rounded-full font-bold">
                  {liveMatchesCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/leagues"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`
              }
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>البطولات والترتيب</span>
            </NavLink>

            <NavLink
              to="/watchroom"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`
              }
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>غرفة المشاهدة</span>
            </NavLink>
          </nav>

          {/* Zone 3: Quick Search Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#12151c] hover:bg-stone-800/80 border border-stone-800 text-xs text-stone-300 hover:text-white transition cursor-pointer"
              title="بحث في القنوات والمباريات"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>بحث عن قناة أو مباراة...</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-14 sm:pt-20 px-4 animate-in fade-in duration-150"
          dir="rtl"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#111318] border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Search Input Bar */}
            <div className="p-3.5 border-b border-stone-800 flex items-center gap-3 bg-[#15181f]">
              <Search className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={quickQuery}
                onChange={e => setQuickQuery(e.target.value)}
                placeholder="ابحث عن قناة (مثل beIN 1 أو Eurosport) أو اسم فريق..."
                className="w-full bg-transparent text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
              />
              {quickQuery && (
                <button
                  type="button"
                  onClick={() => setQuickQuery('')}
                  className="text-xs text-stone-400 hover:text-stone-200 px-1.5 py-0.5 rounded bg-stone-800"
                >
                  مسح
                </button>
              )}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
                aria-label="إغلاق البحث"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Body */}
            <div className="p-3.5 overflow-y-auto space-y-4 text-xs">
              {quickResults.recentList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>شاهدت مؤخراً</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {quickResults.recentList.map(ch => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setActiveStreamingChannel(ch);
                          setCommandPaletteOpen(false);
                          navigate(`/watchroom/${ch.id}`);
                        }}
                        className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 flex items-center justify-between gap-2 text-right transition cursor-pointer"
                      >
                        <div className="truncate font-bold text-stone-200">
                          {ch.arabicName || ch.name}
                        </div>
                        <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quickResults.matches.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-stone-400">
                    المباريات المباشرة ({quickResults.matches.length})
                  </div>
                  <div className="space-y-1.5">
                    {quickResults.matches.map(m => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800/80 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-stone-100 truncate">
                            {m.teamA.name} ضد {m.teamB.name}
                          </div>
                          <div className="text-[10px] text-stone-400 truncate mt-0.5">
                            {m.competition} · {m.time}
                          </div>
                        </div>

                        {m.channels && m.channels.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const cid = m.channels[0].channel_id;
                              setCommandPaletteOpen(false);
                              navigate(`/watchroom/${cid}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>مشاهدة</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-stone-400">
                  القنوات الرياضية ({quickResults.channels.length})
                </div>
                {quickResults.channels.length === 0 ? (
                  <div className="py-6 text-center text-stone-500">
                    لا توجد نتائج مطابقة لبحثك "{quickQuery}"
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickResults.channels.map(ch => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setActiveStreamingChannel(ch);
                          setCommandPaletteOpen(false);
                          navigate(`/watchroom/${ch.id}`);
                        }}
                        className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800/80 flex items-center justify-between gap-2 text-right transition cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-stone-100 truncate">
                            {ch.arabicName || ch.name}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {ch.quality || '1080p FHD'} · {ch.lang || 'عربي'}
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-emerald-500 text-stone-950 shrink-0">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
