import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Play,
  ChevronLeft,
  AlertCircle,
  Radio,
  Clock,
  Grid,
  LayoutGrid,
  List,
  Plus,
  Check,
  Trash2,
  ArrowUpDown,
  Tv,
  Palette,
  Flame,
  Trophy,
  Volume2,
  Shuffle,
  Bell
} from 'lucide-react';
import { useApp, APP_THEMES } from '../context/AppContext';
import { Channel } from '../types';
import { Pagination } from '../components/Pagination';
import { usePageSeo } from '../hooks/usePageSeo';

/**
 * Generates a rich visual network identity (gradient, badge label, emblem text)
 * for each sports channel so cards feel like a real broadcast streaming platform.
 */
function getChannelVisualIdentity(channel: Channel, isLiveMatch: boolean) {
  const lower = (channel.name + ' ' + (channel.arabicName || '')).toLowerCase();

  if (isLiveMatch) {
    return {
      bannerGradient:
        'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(16, 185, 129, 0.45) 55%, rgba(15, 23, 42, 0.95) 100%)',
      networkTag: 'بث مباراة مباشر',
      emblem: `CH ${channel.id}`,
      accentColor: '#10b981'
    };
  }

  if (lower.includes('premium') || channel.id <= 4) {
    return {
      bannerGradient:
        'linear-gradient(135deg, #2e1065 0%, #4c1d95 48%, #065f46 100%)',
      networkTag: 'beIN PREMIUM',
      emblem: `beIN ${channel.id}`,
      accentColor: '#a78bfa'
    };
  }

  if (lower.includes('max') || lower.includes('xtra')) {
    return {
      bannerGradient:
        'linear-gradient(135deg, #451a03 0%, #92400e 50%, #1c1917 100%)',
      networkTag: 'beIN MAX',
      emblem: `MAX ${channel.id}`,
      accentColor: '#f59e0b'
    };
  }

  if (channel.category === 'euro' || lower.includes('euro') || lower.includes('arena') || lower.includes('sky')) {
    return {
      bannerGradient:
        'linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 52%, #090d16 100%)',
      networkTag: 'EURO SPORTS',
      emblem: `EU ${channel.id}`,
      accentColor: '#38bdf8'
    };
  }

  if (channel.subcat === 'bein_en' || channel.subcat === 'bein_fr' || (channel.category === 'bein' && channel.subcat !== 'bein_ar')) {
    return {
      bannerGradient:
        'linear-gradient(135deg, #1e1b4b 0%, #312e81 52%, #0f172a 100%)',
      networkTag: 'beIN GLOBAL',
      emblem: `GL ${channel.id}`,
      accentColor: '#818cf8'
    };
  }

  return {
    bannerGradient:
      'linear-gradient(135deg, #13111c 0%, #2e1065 45%, #064e3b 100%)',
    networkTag: 'beIN SPORTS',
    emblem: `beIN ${channel.id}`,
    accentColor: '#34d399'
  };
}

export const HomePage: React.FC = () => {
  usePageSeo({
    title: 'kolstream – بث مباشر للمباريات ودليل قنوات beIN Sports 24/7',
    description:
      'تابع البث المباشر لأهم المباريات وقنوات beIN Sports العربية والعالمية مع ميزة منع التقطيع والشاشة المتعددة وجدول البث اللحظي على kolstream.',
    canonicalPath: '/'
  });

  const {
    theme,
    setTheme,
    channels,
    loadingChannels,
    matches,
    toggleFavorite,
    isFavorite,
    watchHistory,
    clearWatchHistory,
    multiViewIds,
    toggleMultiViewId,
    matchReminders,
    toggleMatchReminder,
    setActiveStreamingChannel,
    getChannelBroadcast
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL sync state
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '24', 10);
  const rawCategory = searchParams.get('category') || 'all';
  const rawSearch = searchParams.get('q') || '';

  const [category, setCategory] = useState<string>(rawCategory);
  const [searchQuery, setSearchQuery] = useState<string>(rawSearch);
  const [sortBy, setSortBy] = useState<'default' | 'live_first' | 'id_asc' | 'name_asc'>('default');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number>(0);

  useEffect(() => {
    if (rawCategory !== category) setCategory(rawCategory);
  }, [rawCategory]);

  useEffect(() => {
    if (rawSearch !== searchQuery) setSearchQuery(rawSearch);
  }, [rawSearch]);

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = [12, 24, 36, 48].includes(rawPageSize) ? rawPageSize : 24;

  // Channels that currently have a live match on air
  const liveBroadcastingChannelIds = useMemo(() => {
    const ids = new Set<number>();
    for (const match of matches) {
      if (match.status === 'LIVE' && match.channels) {
        for (const ch of match.channels) {
          ids.add(Number(ch.channel_id));
        }
      }
    }
    return ids;
  }, [matches]);

  // Featured Matches for the Interactive Stadium Hero Carousel
  const spotlightMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    const liveOnes = matches.filter(m => m.status === 'LIVE');
    const upcomingOnes = matches.filter(m => m.status !== 'LIVE');
    return [...liveOnes, ...upcomingOnes].slice(0, 5);
  }, [matches]);

  const activeHeroMatch = spotlightMatches[selectedHeroIndex] || spotlightMatches[0] || null;

  // Recently Watched Channels resolved
  const recentChannels = useMemo(() => {
    return watchHistory
      .map(id => channels.find(c => c.id === id))
      .filter((c): c is Channel => Boolean(c))
      .slice(0, 6);
  }, [watchHistory, channels]);

  // Filter & Sort channels
  const filteredChannels = useMemo(() => {
    let list = [...channels];

    if (category === 'live_now') {
      list = list.filter(c => liveBroadcastingChannelIds.has(c.id));
    } else if (category === 'bein' || category === 'bein_ar') {
      list = list.filter(
        c =>
          c.subcat === 'bein_ar' ||
          (c.category === 'ar' && c.name.toLowerCase().includes('bein')) ||
          (c.lang === 'Arabic' && c.name.toLowerCase().includes('bein'))
      );
    } else if (category === 'bein_global') {
      list = list.filter(c => c.category === 'bein' && c.subcat !== 'bein_ar');
    } else if (category === 'euro') {
      list = list.filter(
        c =>
          c.category === 'euro' ||
          c.subcat?.includes('euro') ||
          c.name.toLowerCase().includes('euro') ||
          c.name.toLowerCase().includes('arena')
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => {
        const broadcast = getChannelBroadcast(c.id);
        const progTitle = broadcast?.programTitle?.toLowerCase() || '';
        return (
          c.name.toLowerCase().includes(q) ||
          (c.arabicName && c.arabicName.toLowerCase().includes(q)) ||
          String(c.id).includes(q) ||
          progTitle.includes(q)
        );
      });
    }

    if (sortBy === 'live_first') {
      list.sort((a, b) => {
        const aLive = liveBroadcastingChannelIds.has(a.id) ? 1 : 0;
        const bLive = liveBroadcastingChannelIds.has(b.id) ? 1 : 0;
        if (bLive !== aLive) return bLive - aLive;
        return a.id - b.id;
      });
    } else if (sortBy === 'id_asc') {
      list.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => (a.arabicName || a.name).localeCompare(b.arabicName || b.name, 'ar'));
    }

    return list;
  }, [channels, category, searchQuery, sortBy, liveBroadcastingChannelIds, getChannelBroadcast]);

  const totalPages = Math.ceil(filteredChannels.length / pageSize) || 1;

  const paginatedChannels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredChannels.slice(start, start + pageSize);
  }, [filteredChannels, currentPage, pageSize]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const nextParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      nextParams.set('q', val.trim());
    } else {
      nextParams.delete('q');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams, { replace: true });
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const nextParams = new URLSearchParams(searchParams);
    if (newCat !== 'all') {
      nextParams.set('category', newCat);
    } else {
      nextParams.delete('category');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams, { replace: true });
  };

  const handleTuneIn = (channel: Channel) => {
    setActiveStreamingChannel(channel);
    navigate(`/watchroom/${channel.id}`);
  };

  const handleRandomChannel = () => {
    if (channels.length === 0) return;
    const randomCh = channels[Math.floor(Math.random() * channels.length)];
    handleTuneIn(randomCh);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* 1. Interactive Theme & Quick Actions Strip */}
      <section
        aria-label="تخصيص المظهر والوصول السريع"
        className="rounded-2xl border p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold pl-2">
            <Palette className="w-4 h-4 theme-accent-text" />
            <span>ثيم الواجهة:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {APP_THEMES.map(t => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    active ? 'scale-[1.02] shadow-sm' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    borderColor: active ? 'var(--border-strong)' : 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: t.primaryColor }}
                  />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Quick Actions */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleRandomChannel}
            className="px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)'
            }}
            title="افتح قناة رياضية عشوائية"
          >
            <Shuffle className="w-3.5 h-3.5 theme-accent-text" />
            <span>قناة عشوائية</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/schedual')}
            className="px-3 py-1.5 rounded-xl theme-accent-badge font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>مركز المباريات ({matches.length})</span>
          </button>
        </div>
      </section>

      {/* 2. Interactive Matchday Arena Hero Showcase */}
      {activeHeroMatch ? (
        <section
          aria-label="الحدث الرياضي الأبرز"
          className="relative overflow-hidden rounded-3xl border theme-hero p-5 sm:p-7 shadow-2xl transition-all duration-300"
        >
          {/* Decorative Stadium Light Beams */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-28 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />

          <div className="relative z-10 space-y-6">
            {/* Top Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 theme-accent-badge">
                  <Flame className="w-3.5 h-3.5" />
                  <span>قمة اليوم في الملاعب</span>
                </span>
                <span className="text-xs sm:text-sm font-bold opacity-85">
                  {activeHeroMatch.competition}
                </span>
                {activeHeroMatch.commentator && (
                  <span className="text-xs opacity-70 hidden sm:inline">
                    · تعليق: {activeHeroMatch.commentator}
                  </span>
                )}
              </div>

              {activeHeroMatch.status === 'LIVE' ? (
                <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 font-mono-num text-xs font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>يبث الآن · {activeHeroMatch.minute || 'مباشر'}</span>
                </span>
              ) : (
                <span
                  className="px-3 py-1 rounded-xl border font-mono-num text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  توقيت المباراة: {activeHeroMatch.time}
                </span>
              )}
            </div>

            {/* Center Match Arena Scoreboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Teams & Scoreboard (8 cols) */}
              <div
                className="lg:col-span-8 rounded-2xl border p-4 sm:p-6 flex items-center justify-between gap-3 sm:gap-6"
                style={{
                  backgroundColor:
                    theme === 'daylight'
                      ? 'rgba(255, 255, 255, 0.78)'
                      : 'rgba(10, 14, 18, 0.68)',
                  borderColor: 'var(--border-subtle)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                {/* Team A */}
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 text-center sm:text-right">
                  {activeHeroMatch.teamA.logo ? (
                    <img
                      src={activeHeroMatch.teamA.logo}
                      alt={activeHeroMatch.teamA.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl theme-accent-badge flex items-center justify-center text-lg sm:text-xl font-extrabold shrink-0">
                      {activeHeroMatch.teamA.name.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm sm:text-xl font-extrabold truncate">
                      {activeHeroMatch.teamA.name}
                    </div>
                    <div className="text-[11px] opacity-60 hidden sm:block">الفريق المضيف</div>
                  </div>
                </div>

                {/* Center Score / Kickoff Box */}
                <div className="flex flex-col items-center justify-center shrink-0 px-3 sm:px-5 py-2.5 rounded-2xl border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-strong)'
                  }}
                >
                  {activeHeroMatch.scoreA !== null && activeHeroMatch.scoreB !== null ? (
                    <div className="text-xl sm:text-3xl font-mono-num font-black tracking-wider theme-accent-text">
                      {activeHeroMatch.scoreA} : {activeHeroMatch.scoreB}
                    </div>
                  ) : (
                    <div className="text-base sm:text-xl font-mono-num font-extrabold theme-accent-text">
                      {activeHeroMatch.time}
                    </div>
                  )}
                  <span className="text-[10px] font-mono-num opacity-70 mt-0.5">
                    {activeHeroMatch.status === 'LIVE' ? 'النتيجة اللحظية' : 'بتوقيت مكة'}
                  </span>
                </div>

                {/* Team B */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 flex-1 text-center sm:text-left">
                  <div className="min-w-0">
                    <div className="text-sm sm:text-xl font-extrabold truncate">
                      {activeHeroMatch.teamB.name}
                    </div>
                    <div className="text-[11px] opacity-60 hidden sm:block">الفريق الضيف</div>
                  </div>
                  {activeHeroMatch.teamB.logo ? (
                    <img
                      src={activeHeroMatch.teamB.logo}
                      alt={activeHeroMatch.teamB.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl theme-accent-badge flex items-center justify-center text-lg sm:text-xl font-extrabold shrink-0">
                      {activeHeroMatch.teamB.name.slice(0, 2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-2.5">
                {activeHeroMatch.channels && activeHeroMatch.channels.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const chId = activeHeroMatch.channels[0].channel_id;
                        const chFound = channels.find(c => c.id === chId) || {
                          id: chId,
                          name: activeHeroMatch.channels[0].channel_name,
                          category: 'bein' as const,
                          quality: '1080p FHD',
                          lang: 'عربي',
                          country: 'QA'
                        };
                        handleTuneIn(chFound);
                      }}
                      className="w-full py-3.5 px-5 rounded-2xl theme-accent-btn font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>شاهد الآن على {activeHeroMatch.channels[0].channel_name}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const chId = activeHeroMatch.channels[0].channel_id;
                          navigate(`/watchroom/${chId}?multiview=1`);
                        }}
                        className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer hover:opacity-90"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)'
                        }}
                      >
                        <Grid className="w-3.5 h-3.5 theme-accent-text" />
                        <span>شاشة متعددة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleMatchReminder(activeHeroMatch.id)}
                        className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer hover:opacity-90"
                        style={{
                          backgroundColor: matchReminders.includes(activeHeroMatch.id)
                            ? 'var(--accent-soft)'
                            : 'var(--bg-elevated)',
                          borderColor: matchReminders.includes(activeHeroMatch.id)
                            ? 'var(--border-strong)'
                            : 'var(--border-subtle)'
                        }}
                      >
                        <Bell className="w-3.5 h-3.5 theme-accent-text" />
                        <span>
                          {matchReminders.includes(activeHeroMatch.id) ? 'تم التذكير' : 'تذكير بالمباراة'}
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (channels[0]) handleTuneIn(channels[0]);
                    }}
                    className="w-full py-3.5 px-5 rounded-2xl theme-accent-btn font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>افتح غرفة المشاهدة المباشرة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Match Switcher Rail inside Hero */}
            {spotlightMatches.length > 1 && (
              <div className="pt-2 border-t border-current/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold opacity-60 shrink-0 pl-1">
                  مباريات اليوم:
                </span>
                {spotlightMatches.map((m, idx) => {
                  const isCurrent = idx === selectedHeroIndex;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedHeroIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer border ${
                        isCurrent ? 'shadow-md' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: isCurrent ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        borderColor: isCurrent ? 'var(--border-strong)' : 'var(--border-subtle)'
                      }}
                    >
                      {m.status === 'LIVE' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      )}
                      <span className="truncate max-w-[180px]">
                        {m.teamA.name} vs {m.teamB.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        /* Featured Channels Banner when no match fixtures are active */
        <section className="relative overflow-hidden rounded-3xl border theme-hero p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold theme-accent-badge">
                <Tv className="w-3.5 h-3.5" />
                <span>البث الحي متاح 24/7 بدون إعلانات</span>
              </span>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight">
                استمتع بمشاهدة كافة قنوات الرياضة العالمية والعربية
              </h2>
              <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
                اختر قناتك المفضلة، تنقل بحرية مع المشغل المصغر العائم، أو افتح حتى 4 قنوات في وقت واحد عبر الشاشة المتعددة.
              </p>
            </div>
            {channels.length > 0 && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleTuneIn(channels[0])}
                  className="px-5 py-3 rounded-2xl theme-accent-btn font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>تشغيل {channels[0].arabicName || channels[0].name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/watchroom/${channels[0].id}?multiview=1`)}
                  className="px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <Grid className="w-4 h-4 theme-accent-text" />
                  <span>الشاشة المتعددة</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Continue Watching Rail ("تابعت مؤخراً") */}
      {recentChannels.length > 0 && !searchQuery && category === 'all' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 theme-accent-text" />
              <h2 className="text-sm sm:text-base font-extrabold">متابعة المشاهدة الأخيرة</h2>
              <span className="text-xs font-mono-num opacity-60">
                ({recentChannels.length})
              </span>
            </div>
            <button
              type="button"
              onClick={clearWatchHistory}
              className="text-xs opacity-60 hover:opacity-100 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentChannels.map(ch => {
              const broadcast = getChannelBroadcast(ch.id);
              const identity = getChannelVisualIdentity(ch, liveBroadcastingChannelIds.has(ch.id));
              return (
                <div
                  key={ch.id}
                  onClick={() => handleTuneIn(ch)}
                  className="group theme-card rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer"
                >
                  <div
                    className="h-14 px-3 flex items-center justify-between text-white relative overflow-hidden"
                    style={{ background: identity.bannerGradient }}
                  >
                    <span className="font-mono-num text-xs font-black tracking-wider bg-black/35 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/15">
                      #{ch.id}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/15 group-hover:bg-white text-white group-hover:text-slate-950 flex items-center justify-center transition">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-extrabold truncate group-hover:theme-accent-text transition">
                      {ch.arabicName || ch.name}
                    </div>
                    <div className="text-[10px] opacity-65 truncate mt-0.5">
                      {broadcast?.programTitle || ch.quality || '1080p FHD'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Directory Header with Filter Chips, Sorting, View Toggle & Search Bar */}
      <div
        className="rounded-2xl border p-4 space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-xl font-black flex items-center gap-2.5">
              <span>دليل القنوات الرياضية المباشرة</span>
              <span className="text-xs font-mono-num font-bold theme-accent-badge px-2.5 py-0.5 rounded-xl">
                {filteredChannels.length} قناة
              </span>
            </h1>
            <p className="text-xs opacity-70 mt-1">
              اضغط على أي قناة للتشغيل الفوري، أو أضف عدة قنوات لفتحها في وضع الشاشة المتعددة
            </p>
          </div>

          {/* Search, Sort & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 opacity-50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="ابحث عن قناة، مباراة، أو بطولة..."
                className="w-full rounded-xl pr-9 pl-4 py-2 text-xs border focus:outline-none transition"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Sort Selector */}
            <div
              className="flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <ArrowUpDown className="w-3.5 h-3.5 theme-accent-text shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-medium"
                style={{ color: 'var(--text-primary)' }}
                aria-label="ترتيب القنوات"
              >
                <option value="default" className="bg-slate-900 text-white">الترتيب الافتراضي</option>
                <option value="live_first" className="bg-slate-900 text-white">يبث مباريات الآن أولاً</option>
                <option value="id_asc" className="bg-slate-900 text-white">حسب رقم القناة</option>
                <option value="name_asc" className="bg-slate-900 text-white">الترتيب الأبجدي</option>
              </select>
            </div>

            {/* View Mode Toggle (Detailed vs Compact) */}
            <div
              className="flex items-center border rounded-xl p-1"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'detailed' ? 'theme-accent-btn' : 'opacity-65 hover:opacity-100'
                }`}
                title="بطاقات البث المرئية"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'compact' ? 'theme-accent-btn' : 'opacity-65 hover:opacity-100'
                }`}
                title="الشبكة المدمجة السريعة"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-current/5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'جميع القنوات' },
              ...(liveBroadcastingChannelIds.size > 0
                ? [
                    {
                      id: 'live_now',
                      label: 'يبث مباريات الآن',
                      count: liveBroadcastingChannelIds.size,
                      isLive: true
                    }
                  ]
                : []),
              { id: 'bein_ar', label: 'beIN الرياضية العربية' },
              { id: 'bein_global', label: 'beIN العالمية (EN / FR)' },
              { id: 'euro', label: 'القنوات الأوروبية (Euro)' }
            ].map(cat => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'theme-accent-btn font-extrabold'
                      : 'opacity-75 hover:opacity-100 font-medium'
                  }`}
                  style={
                    !active
                      ? {
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)'
                        }
                      : undefined
                  }
                >
                  {cat.isLive && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                  <span>{cat.label}</span>
                  {cat.count !== undefined && (
                    <span className="text-[10px] font-mono-num opacity-80">({cat.count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {multiViewIds.length > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/watchroom/${multiViewIds[0]}?multiview=1`)}
              className="px-3.5 py-1.5 rounded-xl theme-accent-btn font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>تشغيل الشاشة المتعددة ({multiViewIds.length} قنوات)</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Channels Grid */}
      {loadingChannels ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border overflow-hidden animate-pulse h-64"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="h-28 bg-current/10" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 bg-current/10 rounded" />
                <div className="h-12 w-full bg-current/5 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <div
          className="py-16 text-center border border-dashed rounded-3xl p-8 space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)'
          }}
        >
          <AlertCircle className="w-8 h-8 theme-accent-text mx-auto" />
          <div className="text-sm font-bold">لا توجد قنوات تطابق بحثك</div>
          <p className="text-xs opacity-65 max-w-sm mx-auto">
            جرب البحث باسم آخر أو إزالة التصفية لعرض كافة القنوات الرياضية المتاحة.
          </p>
          <button
            type="button"
            onClick={() => {
              handleSearchChange('');
              handleCategoryChange('all');
            }}
            className="px-4 py-2 rounded-xl theme-accent-btn text-xs font-bold transition cursor-pointer"
          >
            عرض جميع القنوات
          </button>
        </div>
      ) : viewMode === 'compact' ? (
        /* COMPACT HIGH-DENSITY DIRECTORY VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {paginatedChannels.map(channel => {
            const fav = isFavorite(channel.id);
            const inMulti = multiViewIds.includes(channel.id);
            const isLiveMatch = liveBroadcastingChannelIds.has(channel.id);
            const identity = getChannelVisualIdentity(channel, isLiveMatch);

            return (
              <div
                key={channel.id}
                onClick={() => handleTuneIn(channel)}
                className="group theme-card rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                <div
                  className="h-14 px-3 flex items-center justify-between text-white"
                  style={{ background: identity.bannerGradient }}
                >
                  <span className="font-mono-num text-[11px] font-black bg-black/35 px-2 py-0.5 rounded-lg border border-white/15">
                    #{channel.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleMultiViewId(channel.id);
                      }}
                      className={`p-1 rounded-lg transition cursor-pointer ${
                        inMulti ? 'bg-emerald-500 text-slate-950' : 'bg-black/35 text-white/80 hover:text-white'
                      }`}
                      title="إضافة للشاشة المتعددة"
                    >
                      {inMulti ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(channel.id);
                      }}
                      className={`p-1 rounded-lg bg-black/35 transition cursor-pointer ${
                        fav ? 'text-amber-400' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${fav ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <div className="text-xs font-extrabold truncate group-hover:theme-accent-text transition">
                    {channel.arabicName || channel.name}
                  </div>
                  <div className="pt-2 mt-2 border-t border-current/10 flex items-center justify-between text-[10px] opacity-75 font-mono-num">
                    <span>{channel.quality || '1080p'}</span>
                    <Play className="w-3 h-3 theme-accent-text fill-current" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* RICH VISUAL BROADCAST CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedChannels.map(channel => {
            const fav = isFavorite(channel.id);
            const inMulti = multiViewIds.includes(channel.id);
            const broadcast = getChannelBroadcast(channel.id);
            const isMatch = Boolean(broadcast?.isMatch && broadcast?.match);
            const matchData = broadcast?.match;
            const isLiveNow = Boolean(isMatch && matchData?.status === 'LIVE');
            const identity = getChannelVisualIdentity(channel, isLiveNow);

            return (
              <div
                key={channel.id}
                onClick={() => handleTuneIn(channel)}
                className="group theme-card rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                {/* Top Visual Network Artwork Header */}
                <div
                  className="relative h-28 p-3.5 flex flex-col justify-between text-white overflow-hidden"
                  style={{ background: identity.bannerGradient }}
                >
                  {/* Large Stylized Background Monogram Watermark */}
                  <div className="pointer-events-none select-none absolute -bottom-3 -left-2 font-mono-num text-5xl font-black tracking-tighter text-white/10 group-hover:scale-110 transition-transform duration-300">
                    {identity.emblem}
                  </div>

                  {/* Top Row inside Banner: Channel Number, Network Tag, Quick Actions */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-num text-[11px] font-black bg-black/40 backdrop-blur-xs border border-white/15 px-2 py-0.5 rounded-lg">
                        #{channel.id}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-white/15 backdrop-blur-xs px-2 py-0.5 rounded-lg font-bold">
                        {identity.networkTag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleMultiViewId(channel.id);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer backdrop-blur-xs border ${
                          inMulti
                            ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                            : 'bg-black/40 text-white border-white/15 hover:bg-black/60'
                        }`}
                        title="إضافة أو إزالة من الشاشة المتعددة"
                      >
                        {inMulti ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span>متعددة</span>
                      </button>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite(channel.id);
                        }}
                        className={`p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 transition cursor-pointer ${
                          fav ? 'text-amber-400' : 'text-white/80 hover:text-white'
                        }`}
                        title={fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                        aria-label="المفضلة"
                      >
                        <Star className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row inside Banner: Channel Quality + Floating Play Button */}
                  <div className="relative z-10 flex items-end justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-white drop-shadow-xs truncate max-w-[200px]">
                        {channel.arabicName || channel.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-mono-num">
                        <Volume2 className="w-3 h-3 text-emerald-300" />
                        <span>{channel.quality || '1080p FHD'} · عربي</span>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-white/20 group-hover:bg-white text-white group-hover:text-slate-950 backdrop-blur-xs border border-white/30 flex items-center justify-center shadow-lg transition-all group-hover:scale-105 shrink-0">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Card Body: Live Match / EPG Program Box */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div
                    className="p-2.5 rounded-xl border text-xs space-y-2"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)'
                    }}
                  >
                    {isMatch && matchData ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1 text-[10px] pb-1 border-b border-current/10">
                          <span className="opacity-75 font-bold truncate">
                            {matchData.competition}
                          </span>
                          {matchData.status === 'LIVE' ? (
                            <span className="text-rose-400 font-mono-num font-extrabold shrink-0">
                              {matchData.minute || 'مباشر الآن'}
                            </span>
                          ) : (
                            <span className="opacity-65 font-mono-num shrink-0">
                              {matchData.time}
                            </span>
                          )}
                        </div>

                        {/* Match Teams and Live Score */}
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <span className="font-bold truncate max-w-[42%] text-[11px]">
                            {matchData.teamA.name}
                          </span>

                          <span className="px-2 py-0.5 rounded-md font-mono-num font-black text-[11px] theme-accent-badge shrink-0">
                            {matchData.scoreA !== null && matchData.scoreB !== null
                              ? `${matchData.scoreA} - ${matchData.scoreB}`
                              : 'VS'}
                          </span>

                          <span className="font-bold truncate max-w-[42%] text-left text-[11px]">
                            {matchData.teamB.name}
                          </span>
                        </div>
                      </div>
                    ) : broadcast ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] opacity-70">
                          <span className="flex items-center gap-1 font-bold">
                            <Radio className="w-3 h-3 theme-accent-text shrink-0" />
                            <span>البرنامج الحالي</span>
                          </span>
                          <span className="font-mono-num">24/7</span>
                        </div>
                        <div className="text-[11px] font-semibold line-clamp-1">
                          {broadcast.programTitle}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] opacity-70">
                          <span className="font-bold">استوديو البث المباشر</span>
                          <span className="font-mono-num">FHD</span>
                        </div>
                        <div className="text-[11px] opacity-75 line-clamp-1">
                          {channel.description || 'تغطية رياضية مباشرة على مدار الساعة'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-xs font-bold pt-1">
                    <span className="flex items-center gap-1.5 group-hover:theme-accent-text transition">
                      <Play className="w-3.5 h-3.5 fill-current theme-accent-text" />
                      <span>مشاهدة البث المباشر</span>
                    </span>
                    <ChevronLeft className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredChannels.length}
        pageSize={pageSize}
        onPageChange={newPage => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('page', String(newPage));
          setSearchParams(nextParams);
        }}
        onPageSizeChange={newSize => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('pageSize', String(newSize));
          nextParams.set('page', '1');
          setSearchParams(nextParams);
        }}
        itemLabel="قناة"
      />
    </div>
  );
};
