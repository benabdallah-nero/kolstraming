import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Tv,
  PlayCircle,
  Calendar,
  Star,
  RefreshCw,
  Search,
  Grid,
  X,
  Play,
  Plus,
  Check,
  Clock,
  Palette
} from 'lucide-react';
import { useApp, APP_THEMES } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    theme,
    setTheme,
    channels,
    matches,
    favorites,
    watchHistory,
    multiViewIds,
    toggleMultiViewId,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveStreamingChannel,
    refreshMatches,
    loadingMatches
  } = useApp();
  const navigate = useNavigate();
  const [quickQuery, setQuickQuery] = useState('');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  const liveMatchesCount = matches.filter(m => m.status === 'LIVE').length;
  const activeThemeObj = APP_THEMES.find(t => t.id === theme) || APP_THEMES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut for Command Palette
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

  // Quick search results for Command Palette
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
        className="backdrop-blur-xl border-b sticky top-0 z-40 select-none transition-colors duration-300"
        style={{
          backgroundColor: theme === 'daylight' ? 'rgba(255,255,255,0.9)' : 'rgba(9, 11, 15, 0.88)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* Brandmark */}
          <div
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-80 transition-opacity shrink-0 group"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition shadow-sm"
              style={{
                backgroundColor: 'var(--accent-soft)',
                border: '1px solid var(--border-strong)',
                color: 'var(--accent-primary)'
              }}
            >
              <Tv className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono-num text-lg font-extrabold tracking-tight">
                  kolstream
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded font-bold theme-accent-badge">
                  PRO
                </span>
              </div>
              <span className="text-[10px] opacity-60 hidden sm:inline">
                منصة البث الرياضي المباشر
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-1 p-1 rounded-xl border"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'theme-accent-btn font-bold'
                    : 'opacity-75 hover:opacity-100'
                }`
              }
            >
              <Tv className="w-3.5 h-3.5" />
              <span>الرئيسية والقنوات</span>
              {channels.length > 0 && (
                <span className="text-[10px] font-mono-num opacity-75">({channels.length})</span>
              )}
            </NavLink>

            <NavLink
              to="/watchroom"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'theme-accent-btn font-bold'
                    : 'opacity-75 hover:opacity-100'
                }`
              }
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>غرفة المشاهدة</span>
              {multiViewIds.length > 1 && (
                <span className="text-[10px] font-mono-num theme-accent-badge px-1.5 rounded">
                  {multiViewIds.length} شاشات
                </span>
              )}
            </NavLink>

            <NavLink
              to="/schedual"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'theme-accent-btn font-bold'
                    : 'opacity-75 hover:opacity-100'
                }`
              }
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>جدول المباريات</span>
              {liveMatchesCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] bg-rose-500 text-white font-mono-num px-1.5 py-0.2 rounded-full font-bold">
                  {liveMatchesCount} مباشر
                </span>
              )}
            </NavLink>

            <NavLink
              to="/favorit"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'theme-accent-btn font-bold'
                    : 'opacity-75 hover:opacity-100'
                }`
              }
            >
              <Star className="w-3.5 h-3.5" />
              <span>المفضلة</span>
              {favorites.length > 0 && (
                <span className="text-[10px] bg-amber-400/20 text-amber-400 font-mono-num px-1.5 py-0.2 rounded-full">
                  {favorites.length}
                </span>
              )}
            </NavLink>
          </nav>

          {/* Right Tools: Quick Search (Ctrl+K), Theme Switcher, Multi-View Shortcut, Refresh */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Command Search Trigger */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
              title="بحث سريع في القنوات والمباريات (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 theme-accent-text" />
              <span className="hidden sm:inline opacity-75">بحث سريع...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded opacity-70 border border-current/20">
                ⌘K
              </kbd>
            </button>

            {/* Theme Picker Popover Trigger */}
            <div className="relative" ref={themeMenuRef}>
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer"
                style={{
                  backgroundColor: isThemeMenuOpen ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  borderColor: isThemeMenuOpen ? 'var(--border-strong)' : 'var(--border-subtle)'
                }}
                title="تغيير مظهر وألوان التطبيق"
              >
                <Palette className="w-3.5 h-3.5 theme-accent-text" />
                <span className="hidden xl:inline">{activeThemeObj.name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/30"
                  style={{ backgroundColor: activeThemeObj.primaryColor }}
                />
              </button>

              {isThemeMenuOpen && (
                <div
                  className="absolute left-0 mt-2 w-64 rounded-2xl border p-2.5 shadow-2xl z-50 space-y-1.5 animate-in fade-in duration-150"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)'
                  }}
                >
                  <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold opacity-75">
                    <span>اختر ثيم التطبيق</span>
                    <Palette className="w-3.5 h-3.5 theme-accent-text" />
                  </div>
                  {APP_THEMES.map(t => {
                    const isSelected = t.id === theme;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTheme(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className="w-full p-2 rounded-xl flex items-center justify-between gap-2.5 text-right transition cursor-pointer border"
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                          borderColor: isSelected ? 'var(--border-strong)' : 'transparent'
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-inner"
                            style={{ background: t.bgPreview }}
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold truncate">{t.name}</div>
                            <div className="text-[10px] opacity-65 truncate">{t.subtitle}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 theme-accent-text shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Multi-View Direct Button if channels are queued */}
            {multiViewIds.length > 0 && (
              <button
                type="button"
                onClick={() => navigate(`/watchroom/${multiViewIds[0]}?multiview=1`)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl theme-accent-badge text-xs font-bold transition cursor-pointer"
                title="فتح الشاشة المتعددة"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">شاشة متعددة</span>
                <span className="font-mono-num text-[11px] px-1.5 rounded-md font-extrabold theme-accent-btn">
                  {multiViewIds.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => refreshMatches()}
              disabled={loadingMatches}
              className="p-2 rounded-xl border transition active:rotate-180 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
              title="تحديث البيانات المباشرة"
              aria-label="تحديث المباريات المباشرة"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMatches ? 'animate-spin theme-accent-text' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Command Palette Modal (Ctrl+K) */}
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
                placeholder="ابحث عن قناة (مثل beIN 1 أو رقم القناة) أو اسم فريق أو بطولة..."
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
              {/* Recent Watch History */}
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
                        className="p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 flex items-center justify-between gap-2 text-right transition"
                      >
                        <div className="truncate">
                          <div className="font-bold text-stone-200 truncate">
                            {ch.arabicName || ch.name}
                          </div>
                          <div className="text-[10px] font-mono-num text-stone-500">#{ch.id}</div>
                        </div>
                        <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Matches Section */}
              {quickResults.matches.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-stone-400">
                    المباريات المباشرة والقادمة ({quickResults.matches.length})
                  </div>
                  <div className="space-y-1.5">
                    {quickResults.matches.map(m => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800/80 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-100 truncate">
                              {m.teamA.name} vs {m.teamB.name}
                            </span>
                            {m.status === 'LIVE' && (
                              <span className="text-[10px] font-mono-num bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1.5 rounded">
                                مباشر
                              </span>
                            )}
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
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-[11px] shrink-0 flex items-center gap-1"
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

              {/* Channels List */}
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
                    {quickResults.channels.map(ch => {
                      const inMulti = multiViewIds.includes(ch.id);
                      return (
                        <div
                          key={ch.id}
                          className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800/80 flex items-center justify-between gap-2 transition"
                        >
                          <div
                            onClick={() => {
                              setActiveStreamingChannel(ch);
                              setCommandPaletteOpen(false);
                              navigate(`/watchroom/${ch.id}`);
                            }}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <span className="font-mono-num text-[11px] text-stone-400 bg-stone-950 border border-stone-800 px-2 py-0.5 rounded shrink-0">
                              #{ch.id}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-stone-100 truncate">
                                {ch.arabicName || ch.name}
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono-num">
                                {ch.quality || '1080p FHD'} · {ch.lang || 'عربي'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleMultiViewId(ch.id)}
                              className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                inMulti
                                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                              }`}
                              title="إضافة أو إزالة من الشاشة المتعددة"
                            >
                              {inMulti ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              <span>شاشة متعددة</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveStreamingChannel(ch);
                                setCommandPaletteOpen(false);
                                navigate(`/watchroom/${ch.id}`);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition cursor-pointer"
                              title="تشغيل القناة"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-[#0d0f13] border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
              <span>اضغط على أي قناة للانتقال المباشر أو أضف حتى 4 قنوات للشاشة المتعددة</span>
              <span className="font-mono">ESC للإغلاق</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
