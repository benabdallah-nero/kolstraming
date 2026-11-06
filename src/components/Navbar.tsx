import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, X, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBroadcastMinute } from '../utils/broadcastFormatters';

export const Navbar: React.FC = () => {
  const {
    channels,
    matches,
    favorites,
    watchHistory,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveStreamingChannel
  } = useApp();
  const navigate = useNavigate();
  const [quickQuery, setQuickQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const liveMatchesCount = matches.filter(m => m.status === 'LIVE').length;

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
        className="bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] sticky top-0 z-40 select-none text-[var(--text-primary)]"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-stretch justify-between">
          {/* Right Compartment: Broadcast Bug Wordmark + Navigation Tabs */}
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="flex items-center gap-2.5 pl-5 border-l border-[var(--border-hairline)] cursor-pointer group text-right"
            >
              <img
                src="/favicon.svg"
                alt="UEFA Champions League Starball"
                className="w-7 h-7 object-contain shrink-0 group-hover:rotate-12 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(37,99,235,0.45)]"
              />
              <div className="flex flex-col leading-none">
                <span className="font-display-num text-2xl font-extrabold tracking-wider uppercase text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  KOLSTREAM
                </span>
                <span className="text-[9px] font-display-num uppercase tracking-widest text-[var(--text-muted)]">
                  LIVE FEED 24/7
                </span>
              </div>
            </button>

            {/* Primary Broadcast Tabs with Sliding Active Bottom Bar */}
            <nav className="hidden md:flex items-stretch">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `h-full px-5 flex items-center gap-2 text-xs font-bold border-l border-[var(--border-hairline)] border-b-[3px] transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-b-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]'
                      : 'border-b-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
                  }`
                }
              >
                <span className="font-display-ar text-sm font-bold">الرئيسية والقنوات</span>
              </NavLink>

              <NavLink
                to="/schedule"
                className={({ isActive }) =>
                  `h-full px-5 flex items-center gap-2 text-xs font-bold border-l border-[var(--border-hairline)] border-b-[3px] transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-b-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]'
                      : 'border-b-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
                  }`
                }
              >
                <span className="font-display-ar text-sm font-bold">جدول المباريات</span>
                {liveMatchesCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[var(--signal-live)] text-white font-display-num text-xs font-extrabold leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{liveMatchesCount}</span>
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/leagues"
                className={({ isActive }) =>
                  `h-full px-5 flex items-center gap-2 text-xs font-bold border-l border-[var(--border-hairline)] border-b-[3px] transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-b-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]'
                      : 'border-b-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
                  }`
                }
              >
                <span className="font-display-ar text-sm font-bold">ترتيب الدوريات</span>
              </NavLink>

              <NavLink
                to="/favorites"
                className={({ isActive }) =>
                  `h-full px-5 flex items-center gap-2 text-xs font-bold border-l border-[var(--border-hairline)] border-b-[3px] transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-b-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]'
                      : 'border-b-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
                  }`
                }
              >
                <span className="font-display-ar text-sm font-bold">المفضلة</span>
                {favorites.length > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-display-num text-xs font-extrabold leading-none">
                    {favorites.length}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/watchroom"
                className={({ isActive }) =>
                  `h-full px-5 flex items-center gap-2 text-xs font-bold border-l border-[var(--border-hairline)] border-b-[3px] transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-b-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]'
                      : 'border-b-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
                  }`
                }
              >
                <span className="font-display-ar text-sm font-bold">غرفة البث</span>
              </NavLink>
            </nav>
          </div>

          {/* Left Compartment: Quick Search Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="بحث سريع في القنوات والمباريات"
            >
              <Search className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>بحث عن فريق أو قناة...</span>
              <span className="hidden sm:inline font-display-num text-[11px] px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-muted)]">
                CTRL+K
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Broadcast Quick Search Modal */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center pt-12 sm:pt-20 px-3"
          dir="rtl"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[2px] overflow-hidden flex flex-col max-h-[82vh]"
          >
            {/* Search Input Header */}
            <div className="p-3.5 border-b border-[var(--border-hairline)] flex items-center gap-3 bg-[var(--bg-elevated)]">
              <Search className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={quickQuery}
                onChange={e => setQuickQuery(e.target.value)}
                placeholder="اكتب اسم الفريق أو القناة (beIN 1، ريال مدريد، ليفربول...)"
                className="w-full bg-transparent text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              {quickQuery && (
                <button
                  type="button"
                  onClick={() => setQuickQuery('')}
                  className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] cursor-pointer"
                >
                  مسح
                </button>
              )}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-[2px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
                aria-label="إغلاق البحث"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Body */}
            <div className="overflow-y-auto divide-y divide-[var(--border-hairline)] text-xs">
              {quickResults.matches.length > 0 && (
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                    <span>المباريات المباشرة والمجدولة</span>
                    <span className="font-display-num text-sm text-[var(--accent-primary)]">
                      {quickResults.matches.length}
                    </span>
                  </div>
                  <div className="border border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)]">
                    {quickResults.matches.map(m => (
                      <div
                        key={m.id}
                        className="px-3 py-2.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-row-hover)] flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          {m.status === 'LIVE' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--signal-live)] text-white font-display-num text-xs font-bold shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span>{formatBroadcastMinute(m.minute)}</span>
                            </span>
                          ) : (
                            <span className="font-display-num text-sm font-bold text-[var(--text-secondary)] shrink-0">
                              {m.time}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[var(--text-primary)] truncate">
                              {m.teamA.name} — {m.teamB.name}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] truncate">
                              {m.competition}
                            </div>
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
                            className="px-3 py-1 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>البث الحي</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {quickResults.recentList.length > 0 && (
                <div className="p-3.5 space-y-2">
                  <div className="text-[11px] font-bold text-[var(--text-secondary)]">
                    القنوات المشاهدة مؤخراً
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-r border-[var(--border-hairline)]">
                    {quickResults.recentList.map(ch => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setActiveStreamingChannel(ch);
                          setCommandPaletteOpen(false);
                          navigate(`/watchroom/${ch.id}`);
                        }}
                        className="p-2.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-row-hover)] border-b border-l border-[var(--border-hairline)] flex items-center justify-between gap-2 text-right transition-colors cursor-pointer"
                      >
                        <div className="truncate font-bold text-[var(--text-primary)]">
                          {ch.arabicName || ch.name}
                        </div>
                        <span className="font-display-num text-xs font-bold text-[var(--accent-primary)] shrink-0">
                          CH {String(ch.id).padStart(2, '0')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                  <span>دليل القنوات الناقلة</span>
                  <span className="font-display-num text-sm text-[var(--text-muted)]">
                    {quickResults.channels.length}
                  </span>
                </div>
                {quickResults.channels.length === 0 ? (
                  <div className="py-8 text-center text-[var(--text-muted)] border border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
                    لا توجد قناة أو مباراة تطابق "{quickQuery}" — جرب البحث باسم البطولة أو رقم القناة.
                  </div>
                ) : (
                  <div className="border border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)]">
                    {quickResults.channels.map(ch => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setActiveStreamingChannel(ch);
                          setCommandPaletteOpen(false);
                          navigate(`/watchroom/${ch.id}`);
                        }}
                        className="w-full px-3 py-2 bg-[var(--bg-canvas)] hover:bg-[var(--bg-row-hover)] flex items-center justify-between gap-2 text-right transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-display-num text-sm font-extrabold text-[var(--accent-primary)] w-12 shrink-0">
                            #{String(ch.id).padStart(2, '0')}
                          </span>
                          <span className="font-bold text-[var(--text-primary)] truncate">
                            {ch.arabicName || ch.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-display-num text-xs text-[var(--text-muted)]">
                            {ch.quality || '1080p FHD'}
                          </span>
                          <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--accent-primary)] text-[10px] font-bold">
                            تشغيل
                          </span>
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
