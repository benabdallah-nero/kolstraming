import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Play,
  AlertCircle,
  Tv,
  Trophy,
  Calendar,
  Radio,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Channel } from '../types';
import { usePageSeo } from '../hooks/usePageSeo';
import { getChannelBrandIdentity } from '../utils/channelBranding';

type ChannelSortOption = 'default' | 'live_first' | 'id_asc' | 'name_asc';

const BATCH_SIZE = 12;

export const HomePage: React.FC = () => {
  usePageSeo({
    title: 'kolstream – بث مباشر للمباريات ودليل القنوات الرياضية',
    description:
      'شاهد البث المباشر لأهم مباريات اليوم وقنوات beIN Sports العربية والعالمية و Eurosport وجداول ترتيب الدوريات على kolstream.',
    canonicalPath: '/'
  });

  const {
    channels,
    loadingChannels,
    matches,
    setActiveStreamingChannel,
    getChannelBroadcast
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawCategory = searchParams.get('category') || 'all';
  const rawSearch = searchParams.get('q') || '';
  const rawSort = (searchParams.get('sort') as ChannelSortOption) || 'default';

  const [category, setCategory] = useState<string>(rawCategory);
  const [searchQuery, setSearchQuery] = useState<string>(rawSearch);
  const [sortBy, setSortBy] = useState<ChannelSortOption>(
    ['default', 'live_first', 'id_asc', 'name_asc'].includes(rawSort) ? rawSort : 'default'
  );
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number>(0);

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (rawCategory !== category) setCategory(rawCategory);
  }, [rawCategory, category]);

  useEffect(() => {
    if (rawSearch !== searchQuery) setSearchQuery(rawSearch);
  }, [rawSearch, searchQuery]);

  // Reset visibleCount when filters or sorting change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [category, searchQuery, sortBy]);

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

  // Featured Match of Today (prioritizing LIVE matches, then top upcoming matches)
  const spotlightMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    const liveOnes = matches.filter(m => m.status === 'LIVE');
    const upcomingOnes = matches.filter(m => m.status !== 'LIVE');
    return [...liveOnes, ...upcomingOnes].slice(0, 5);
  }, [matches]);

  const activeHeroMatch = spotlightMatches[selectedHeroIndex] || spotlightMatches[0] || null;

  // Filter & Sort channels
  const filteredChannels = useMemo(() => {
    let list = [...channels];

    if (category === 'live_now') {
      list = list.filter(c => liveBroadcastingChannelIds.has(c.id));
    } else if (category === 'bein_ar') {
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
          c.name.toLowerCase().includes('arena') ||
          c.name.toLowerCase().includes('sky')
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

    // Apply Sorting
    if (sortBy === 'live_first') {
      list.sort((a, b) => {
        const aLive = liveBroadcastingChannelIds.has(a.id) ? 2 : getChannelBroadcast(a.id)?.isMatch ? 1 : 0;
        const bLive = liveBroadcastingChannelIds.has(b.id) ? 2 : getChannelBroadcast(b.id)?.isMatch ? 1 : 0;
        if (bLive !== aLive) return bLive - aLive;
        return 0;
      });
    } else if (sortBy === 'id_asc') {
      list.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) =>
        (a.arabicName || a.name).localeCompare(b.arabicName || b.name, 'ar')
      );
    }

    return list;
  }, [channels, category, searchQuery, sortBy, liveBroadcastingChannelIds, getChannelBroadcast]);

  // Slice visible channels for Infinite Scroll
  const visibleChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const hasMoreChannels = visibleCount < filteredChannels.length;

  // IntersectionObserver for automatic load-more while scrolling
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMoreChannels) return;

    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredChannels.length));
        }
      },
      { rootMargin: '280px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreChannels, filteredChannels.length]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const nextParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      nextParams.set('q', val.trim());
    } else {
      nextParams.delete('q');
    }
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
    setSearchParams(nextParams, { replace: true });
  };

  const handleSortChange = (newSort: ChannelSortOption) => {
    setSortBy(newSort);
    const nextParams = new URLSearchParams(searchParams);
    if (newSort !== 'default') {
      nextParams.set('sort', newSort);
    } else {
      nextParams.delete('sort');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleTuneIn = (channel: Channel) => {
    setActiveStreamingChannel(channel);
    navigate(`/watchroom/${channel.id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300" dir="rtl">
      {/* 1. Featured Match of Today Hero */}
      {activeHeroMatch ? (
        <section
          aria-label="مباراة اليوم الأبرز"
          className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#1d0738] via-[#11131c] to-[#080a0f] p-5 sm:p-8 shadow-2xl"
        >
          <div className="relative z-10 space-y-6">
            {/* Top Bar: Tournament & Match Time/Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-extrabold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>قمة مباريات اليوم</span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-stone-200">
                  {activeHeroMatch.competition}
                </span>
                {activeHeroMatch.commentator && (
                  <span className="text-xs text-stone-400 hidden sm:inline">
                    · المعلق: {activeHeroMatch.commentator}
                  </span>
                )}
              </div>

              {activeHeroMatch.status === 'LIVE' ? (
                <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-mono-num text-xs font-extrabold">
                  مباشر الآن · {activeHeroMatch.minute || 'الشوط الحالي'}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-stone-900/90 border border-stone-700/80 text-stone-200 font-mono-num text-xs font-bold">
                  موعد الانطلاق: {activeHeroMatch.time}
                </span>
              )}
            </div>

            {/* Scoreboard & Watch CTA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Teams & Score (8 cols) */}
              <div className="lg:col-span-8 rounded-2xl bg-black/45 border border-white/10 p-4 sm:p-6 flex items-center justify-between gap-3 sm:gap-6 backdrop-blur-md">
                {/* Team A */}
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 text-center sm:text-right">
                  {activeHeroMatch.teamA.logo ? (
                    <img
                      src={activeHeroMatch.teamA.logo}
                      alt={activeHeroMatch.teamA.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center text-lg sm:text-xl font-extrabold shrink-0">
                      {activeHeroMatch.teamA.name.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm sm:text-xl font-extrabold text-white truncate">
                      {activeHeroMatch.teamA.name}
                    </div>
                  </div>
                </div>

                {/* Score / Time */}
                <div className="flex flex-col items-center justify-center shrink-0 px-4 sm:px-6 py-2.5 rounded-2xl bg-stone-900/90 border border-stone-700/80">
                  {activeHeroMatch.scoreA !== null && activeHeroMatch.scoreB !== null ? (
                    <div className="text-xl sm:text-3xl font-mono-num font-black tracking-wider text-emerald-400">
                      {activeHeroMatch.scoreA} : {activeHeroMatch.scoreB}
                    </div>
                  ) : (
                    <div className="text-base sm:text-xl font-mono-num font-extrabold text-white">
                      {activeHeroMatch.time}
                    </div>
                  )}
                  <span className="text-[10px] text-stone-400 mt-0.5">
                    {activeHeroMatch.status === 'LIVE' ? 'النتيجة الحالية' : 'بتوقيت مكة'}
                  </span>
                </div>

                {/* Team B */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 flex-1 text-center sm:text-left">
                  <div className="min-w-0">
                    <div className="text-sm sm:text-xl font-extrabold text-white truncate">
                      {activeHeroMatch.teamB.name}
                    </div>
                  </div>
                  {activeHeroMatch.teamB.logo ? (
                    <img
                      src={activeHeroMatch.teamB.logo}
                      alt={activeHeroMatch.teamB.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center text-lg sm:text-xl font-extrabold shrink-0">
                      {activeHeroMatch.teamB.name.slice(0, 2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Primary CTA (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-2.5">
                {activeHeroMatch.channels && activeHeroMatch.channels.length > 0 ? (
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
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg transition cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>مشاهدة عبر {activeHeroMatch.channels[0].channel_name}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (channels[0]) handleTuneIn(channels[0]);
                    }}
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>فتح البث المباشر</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/schedual')}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">جدول المباريات</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/leagues')}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">ترتيب الدوريات</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Other Featured Matches Switcher */}
            {spotlightMatches.length > 1 && (
              <div className="pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-stone-400 shrink-0 pl-1">
                  مباريات أخرى اليوم:
                </span>
                {spotlightMatches.map((m, idx) => {
                  const isCurrent = idx === selectedHeroIndex;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedHeroIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer border ${
                        isCurrent
                          ? 'bg-purple-600/30 border-purple-400 text-white'
                          : 'bg-black/40 border-white/10 text-stone-300 hover:text-white'
                      }`}
                    >
                      <span className="truncate max-w-[180px]">
                        {m.teamA.name} ضد {m.teamB.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 2. Channel Catalog Section Header, Sorting & Network Filter Bar */}
      <section className="space-y-5">
        <div className="bg-[#101218] border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-purple-400" />
                <span>دليل القنوات الرياضية</span>
                <span className="text-xs font-mono-num font-bold text-stone-400">
                  ({filteredChannels.length} قناة)
                </span>
              </h1>
              <p className="text-xs text-stone-400 mt-1">
                تصفح الشبكات الرياضية أو رتب القنوات حسب البث المباشر الحالي
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Sort Select */}
              <div className="relative">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={e => handleSortChange(e.target.value as ChannelSortOption)}
                  aria-label="ترتيب القنوات"
                  className="w-full sm:w-auto rounded-xl bg-[#090b0f] border border-stone-800 pr-8 pl-4 py-2.5 text-xs font-bold text-stone-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                >
                  <option value="default">الترتيب: الافتراضي (الأشهر)</option>
                  <option value="live_first">الترتيب: يبث مباريات الآن أولاً</option>
                  <option value="name_asc">الترتيب: الأبجدي (أ - ي)</option>
                  <option value="id_asc">الترتيب: حسب رقم القناة</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="ابحث عن قناة (beIN 1, Eurosport...)"
                  className="w-full rounded-xl bg-[#090b0f] border border-stone-800 pr-10 pl-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Network Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs pt-2 border-t border-stone-800/60">
            {[
              { id: 'all', label: 'جميع القنوات' },
              ...(liveBroadcastingChannelIds.size > 0
                ? [
                    {
                      id: 'live_now',
                      label: `قنوات تنقل مباريات الآن (${liveBroadcastingChannelIds.size})`
                    }
                  ]
                : []),
              { id: 'bein_ar', label: 'beIN Sports العربية' },
              { id: 'bein_global', label: 'beIN Sports العالمية (EN / FR)' },
              { id: 'euro', label: 'Eurosport والقنوات الأوروبية' }
            ].map(cat => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-stone-950 border-emerald-400 font-extrabold shadow-sm'
                      : 'bg-[#090b0f] border-stone-800 text-stone-300 hover:text-white font-medium'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Infinite-Scroll Branded Channel Cards Grid */}
        {loadingChannels ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-stone-800 bg-[#101218] overflow-hidden animate-pulse h-60"
              >
                <div className="h-32 bg-stone-800/60" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 w-2/3 bg-stone-800 rounded" />
                  <div className="h-3 w-1/2 bg-stone-800/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-stone-800 bg-[#101218] rounded-3xl p-8 space-y-3">
            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
            <div className="text-sm font-bold text-white">لا توجد قنوات تطابق بحثك</div>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              جرب البحث باسم آخر أو عرض جميع الشبكات الرياضية.
            </p>
            <button
              type="button"
              onClick={() => {
                handleSearchChange('');
                handleCategoryChange('all');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-stone-950 text-xs font-extrabold transition cursor-pointer"
            >
              عرض جميع القنوات
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleChannels.map(channel => {
                const broadcast = getChannelBroadcast(channel.id);
                const isMatch = Boolean(broadcast?.isMatch && broadcast?.match);
                const matchData = broadcast?.match;
                const isLiveNow = Boolean(isMatch && matchData?.status === 'LIVE');
                const brand = getChannelBrandIdentity(channel);

                return (
                  <div
                    key={channel.id}
                    onClick={() => handleTuneIn(channel)}
                    className="group rounded-2xl border border-stone-800/90 hover:border-stone-600 bg-[#101218] overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
                  >
                    {/* Network-Branded Visual Artwork Header */}
                    <div
                      className="relative h-36 p-4 flex flex-col justify-between text-white overflow-hidden bg-cover bg-center"
                      style={{
                        backgroundImage: `${brand.svgPatternUrl}, ${brand.backgroundCss}`
                      }}
                    >
                      {/* Top Row: Official Network Badge & Live Status */}
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md font-extrabold shadow-sm ${brand.badgeBg}`}
                        >
                          {brand.badgeText}
                        </span>

                        {isLiveNow ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono-num text-[10px] font-extrabold">
                            مباراة مباشرة
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-black/45 backdrop-blur-xs border border-white/15 text-white/90 font-mono-num text-[10px] font-bold">
                            {channel.quality || '1080p FHD'}
                          </span>
                        )}
                      </div>

                      {/* Center/Bottom Network Channel Title & Play Trigger */}
                      <div className="relative z-10 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-white/75 font-bold">
                            {brand.networkName}
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white truncate drop-shadow-sm">
                            {channel.arabicName || channel.name}
                          </h3>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-white/15 group-hover:bg-emerald-500 text-white group-hover:text-stone-950 backdrop-blur-xs border border-white/20 group-hover:border-emerald-400 flex items-center justify-center transition-all shrink-0 shadow-md">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                      </div>
                    </div>

                    {/* Card Body: Current Broadcast / Match Info */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-3 bg-[#101218]">
                      {isMatch && matchData ? (
                        <div className="rounded-xl bg-stone-900/90 border border-stone-800 p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                            <span className="truncate">{matchData.competition}</span>
                            <span className="font-mono-num shrink-0">
                              {matchData.status === 'LIVE' ? matchData.minute || 'مباشر' : matchData.time}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-white truncate">
                            {matchData.teamA.name} ضد {matchData.teamB.name}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-stone-300 py-1">
                          <span className="truncate flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate">
                              {broadcast?.programTitle || brand.networkSubLabel}
                            </span>
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                        <span>التعليق: {channel.lang === 'Arabic' ? 'عربي' : channel.lang || 'عربي'}</span>
                        <span className="text-emerald-400 font-bold group-hover:underline">
                          تشغيل القناة ←
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. Infinite Scroll Sentinel & Load-More Status */}
            <div ref={loadMoreSentinelRef} className="py-6 flex flex-col items-center justify-center gap-3">
              {hasMoreChannels ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredChannels.length))
                  }
                  className="px-6 py-3 rounded-2xl bg-[#101218] hover:bg-stone-800/90 border border-stone-800 text-xs font-extrabold text-stone-200 hover:text-white flex items-center gap-2 transition cursor-pointer shadow-md"
                >
                  <ChevronDown className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span>
                    عرض المزيد من القنوات ({visibleChannels.length} من {filteredChannels.length})
                  </span>
                </button>
              ) : (
                <div className="text-xs text-stone-500 font-medium">
                  تم عرض جميع القنوات المتاحة ({filteredChannels.length} قناة)
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
