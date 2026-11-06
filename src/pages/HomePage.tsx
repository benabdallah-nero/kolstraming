import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Play,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Channel, LiveMatch } from '../types';
import { usePageSeo } from '../hooks/usePageSeo';
import { getChannelBrandIdentity } from '../utils/channelBranding';
import { TeamLogo } from '../components/TeamLogo';
import {
  getKickoffCountdown,
  formatBroadcastMinute,
  isMarqueeMatch
} from '../utils/broadcastFormatters';

type ChannelSortOption = 'default' | 'live_first' | 'id_asc' | 'name_asc';

const BATCH_SIZE = 18;

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
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (rawCategory !== category) setCategory(rawCategory);
  }, [rawCategory, category]);

  useEffect(() => {
    if (rawSearch !== searchQuery) setSearchQuery(rawSearch);
  }, [rawSearch, searchQuery]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [category, searchQuery, sortBy]);

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

  const spotlightMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    // Lead with fixtures we can actually verify: real broadcaster data, a
    // marquee competition, and a Yallakora/ESPN fixture ID. This prevents an
    // arbitrary scrape from being presented as the match of the day.
    const scoreMatch = (match: LiveMatch): number => {
      let score = 0;
      if (match.channels && match.channels.length > 0) score += 4;
      if (match.isBeinArabic) score += 2;
      if (isMarqueeMatch(match)) score += 2;
      if (match.id.startsWith('yk_') || match.id.startsWith('espn_')) score += 1;
      if (match.status === 'LIVE') score += 1;
      return score;
    };

    const liveOnes = matches.filter(m => m.status === 'LIVE');
    const upcomingOnes = matches.filter(m => m.status === 'FIXTURE');
    const finishedOnes = matches.filter(m => m.status === 'RESULT');
    return [...liveOnes, ...upcomingOnes, ...finishedOnes]
      .sort((a, b) => scoreMatch(b) - scoreMatch(a))
      .slice(0, 6);
  }, [matches]);

  const activeHeroMatch = spotlightMatches[selectedHeroIndex] || spotlightMatches[0] || null;

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

  const visibleChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const hasMoreChannels = visibleCount < filteredChannels.length;

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

  const heroCountdown = activeHeroMatch
    ? getKickoffCountdown(activeHeroMatch.time, activeHeroMatch.status, nowMs)
    : null;

  return (
    <div className="space-y-8" dir="rtl">
      {/* 1. ASYMMETRIC BROADCAST SCOREBOARD: OVERSIZED FEATURED MATCH (8 COLS) + DENSE MATCHDAY TICKER (4 COLS) */}
      {activeHeroMatch ? (
        <section
          aria-label="لوحة مباريات اليوم"
          className="grid grid-cols-1 lg:grid-cols-12 border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-xl shadow-black/20"
        >
          {/* Oversized Featured Match Scoreboard (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-[var(--border-hairline)]">
            {/* Top Broadcast Strip */}
            <div className="px-5 py-3 bg-[var(--bg-elevated)]/90 border-b border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-display-ar text-[11px] font-extrabold uppercase">
                  {isMarqueeMatch(activeHeroMatch) && activeHeroMatch.channels.length > 0
                    ? 'مباراة القمة'
                    : 'مباراة اليوم'}
                </span>
                <span className="font-display-ar text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  {activeHeroMatch.competition}
                </span>
                {activeHeroMatch.commentator && (
                  <span className="text-[11px] text-[var(--text-secondary)] hidden sm:inline">
                    | تعليق: {activeHeroMatch.commentator}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeHeroMatch.status === 'LIVE' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--signal-live)] text-white font-display-num text-xs font-black tracking-wide shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>LIVE · {formatBroadcastMinute(activeHeroMatch.minute)}</span>
                  </span>
                ) : activeHeroMatch.status === 'RESULT' ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-muted)] font-display-ar text-[11px] font-bold">
                    انتهت المباراة (FT)
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    {heroCountdown && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-[var(--accent-primary)] font-display-num text-xs font-bold">
                        {heroCountdown}
                      </span>
                    )}
                    <span className="font-display-num text-sm font-bold text-[var(--text-secondary)]">
                      KO {activeHeroMatch.time}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Oversized Scoreboard Chamber */}
            <div className="p-4 sm:p-7 md:p-8 bg-gradient-to-b from-[var(--bg-canvas)] to-[var(--bg-surface)] flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-12 items-center gap-2 sm:gap-4 md:gap-6">
                {/* Team A (Home) - 4 cols on mobile, 4.5 cols on sm+ */}
                <div className="col-span-4 sm:col-span-4 lg:col-span-4 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-right gap-1.5 sm:gap-3.5 min-w-0">
                  <TeamLogo
                    name={activeHeroMatch.teamA.name}
                    src={activeHeroMatch.teamA.logo}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain rounded-full bg-[var(--bg-canvas)] p-1 border border-white/5 shrink-0"
                  />
                  <div className="min-w-0 w-full sm:flex-1">
                    <div
                      title={activeHeroMatch.teamA.name}
                      className="font-display-ar text-xs sm:text-base md:text-xl lg:text-2xl font-extrabold text-[var(--text-primary)] leading-snug sm:leading-tight line-clamp-2 break-words"
                    >
                      {activeHeroMatch.teamA.name}
                    </div>
                    <div className="hidden sm:block text-[11px] text-[var(--text-muted)] mt-0.5">
                      صاحب الأرض
                    </div>
                  </div>
                </div>

                {/* Huge Tabular Score / Kickoff Time (4 cols on mobile, 3 sm, 4 lg) */}
                <div className="col-span-4 sm:col-span-4 lg:col-span-4 flex flex-col items-center justify-center py-2 px-1.5 sm:py-3 sm:px-3 rounded-xl sm:rounded-2xl bg-[var(--bg-canvas)]/90 border border-[var(--border-hairline)] shadow-inner">
                  {activeHeroMatch.scoreA !== null && activeHeroMatch.scoreB !== null ? (
                    <div
                      className={`font-display-num text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-none tracking-tight ${
                        activeHeroMatch.status === 'LIVE'
                          ? 'text-[var(--signal-live)]'
                          : 'text-[var(--accent-primary)]'
                      }`}
                    >
                      {activeHeroMatch.scoreA}
                      <span className="text-[var(--text-muted)] mx-0.5 sm:mx-1">:</span>
                      {activeHeroMatch.scoreB}
                    </div>
                  ) : (
                    <div className="font-display-num text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-none text-[var(--text-primary)]">
                      {activeHeroMatch.time}
                    </div>
                  )}
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1 text-center">
                    {activeHeroMatch.status === 'LIVE'
                      ? 'النتيجة المباشرة'
                      : activeHeroMatch.status === 'RESULT'
                      ? 'النتيجة النهائية'
                      : 'توقيت مكة'}
                  </span>
                </div>

                {/* Team B (Away) - 4 cols on mobile, 4 sm */}
                <div className="col-span-4 sm:col-span-4 lg:col-span-4 flex flex-col-reverse sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3.5 min-w-0">
                  <div className="min-w-0 w-full sm:flex-1 text-center sm:text-left">
                    <div
                      title={activeHeroMatch.teamB.name}
                      className="font-display-ar text-xs sm:text-base md:text-xl lg:text-2xl font-extrabold text-[var(--text-primary)] leading-snug sm:leading-tight line-clamp-2 break-words"
                    >
                      {activeHeroMatch.teamB.name}
                    </div>
                    <div className="hidden sm:block text-[11px] text-[var(--text-muted)] mt-0.5">
                      الفريق الضيف
                    </div>
                  </div>
                  <TeamLogo
                    name={activeHeroMatch.teamB.name}
                    src={activeHeroMatch.teamB.logo}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain rounded-full bg-[var(--bg-canvas)] p-1 border border-white/5 shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="px-5 py-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
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
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-contrast)] font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>بث مباشر · {activeHeroMatch.channels[0].channel_name}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (channels[0]) handleTuneIn(channels[0]);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-contrast)] font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>انتقل إلى البث المباشر</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/schedual')}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer"
                >
                  جميع مباريات اليوم ({matches.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/leagues')}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
              >
                جداول ترتيب الدوريات ←
              </button>
            </div>
          </div>

          {/* Matchday Ticker (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[var(--bg-surface)]">
            <div className="px-4 py-3 bg-[var(--bg-elevated)]/90 border-b border-[var(--border-hairline)] flex items-center justify-between">
              <span className="font-display-ar text-xs font-extrabold text-[var(--text-primary)]">
                أبرز مواجهات اليوم
              </span>
              <span className="font-display-num text-xs font-bold text-[var(--text-muted)] tracking-wider">
                MATCHDAY FEED
              </span>
            </div>

            <div className="divide-y divide-[var(--border-hairline)] flex-1 overflow-y-auto max-h-[360px] no-scrollbar">
              {spotlightMatches.map((m, idx) => {
                const isSelected = idx === selectedHeroIndex;
                const isLive = m.status === 'LIVE';
                const cd = getKickoffCountdown(m.time, m.status, nowMs);
                const hasScore = m.scoreA !== null && m.scoreB !== null;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedHeroIndex(idx)}
                    className={`w-full px-4 text-right transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                      isLive ? 'py-3.5' : 'py-3'
                    } ${
                      isSelected
                        ? 'bg-[var(--bg-elevated)] border-r-2 border-r-[var(--accent-primary)]'
                        : isLive
                        ? 'bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] border-r-2 border-r-[var(--signal-live)]'
                        : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] border-r-2 border-r-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-1">
                        <span className="truncate">{m.competition}</span>
                        {cd && (
                          <span className="font-display-num text-[10px] text-[var(--accent-primary)] font-bold shrink-0">
                            · {cd}
                          </span>
                        )}
                      </div>

                      {/* 2-tier team rows for optimal space for big club names */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <TeamLogo
                              name={m.teamA.name}
                              src={m.teamA.logo}
                              alt=""
                              className="w-3.5 h-3.5 object-contain rounded-full shrink-0 bg-[var(--bg-canvas)]"
                            />
                            <span
                              className="text-xs font-bold text-[var(--text-primary)] truncate"
                              title={m.teamA.name}
                            >
                              {m.teamA.name}
                            </span>
                          </div>
                          {hasScore && (
                            <span
                              className={`font-display-num text-xs font-black shrink-0 ${
                                isLive ? 'text-[var(--signal-live)]' : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {m.scoreA}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <TeamLogo
                              name={m.teamB.name}
                              src={m.teamB.logo}
                              alt=""
                              className="w-3.5 h-3.5 object-contain rounded-full shrink-0 bg-[var(--bg-canvas)]"
                            />
                            <span
                              className="text-xs font-bold text-[var(--text-primary)] truncate"
                              title={m.teamB.name}
                            >
                              {m.teamB.name}
                            </span>
                          </div>
                          {hasScore && (
                            <span
                              className={`font-display-num text-xs font-black shrink-0 ${
                                isLive ? 'text-[var(--signal-live)]' : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {m.scoreB}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-left flex flex-col items-end justify-center pl-1">
                      {isLive ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--signal-live)]/15 text-[var(--signal-live)] border border-[var(--signal-live)]/20 font-display-num text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-live)] animate-ping" />
                            <span>LIVE</span>
                          </span>
                          <span className="font-display-num text-xs font-bold text-[var(--signal-live)]">
                            {formatBroadcastMinute(m.minute)}
                          </span>
                        </div>
                      ) : hasScore ? (
                        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[10px] font-bold text-[var(--text-muted)]">
                          FT
                        </span>
                      ) : (
                        <span className="font-display-num text-xs font-bold text-[var(--text-secondary)]">
                          {m.time}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* 2. BROADCAST CHANNEL MATRIX */}
      <section className="space-y-4">
        {/* Matrix Control Header */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden shadow-lg shadow-black/10">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 rounded-full bg-[var(--accent-primary)] shrink-0" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display-ar text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                    شبكة القنوات الرياضية المباشرة
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-xs sm:text-sm font-bold text-[var(--accent-primary)]">
                    {filteredChannels.length} CH
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  اختر القناة للانتقال الفوري إلى غرفة البث المباشر مع التبديل بين مشغلات مستقرة
                </p>
              </div>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-primary)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={e => handleSortChange(e.target.value as ChannelSortOption)}
                  aria-label="ترتيب القنوات"
                  className="w-full sm:w-auto rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] pr-8 pl-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all cursor-pointer"
                >
                  <option value="default">الترتيب: القنوات الرئيسية</option>
                  <option value="live_first">الترتيب: تنقل مباريات الآن</option>
                  <option value="name_asc">الترتيب: الأبجدي (أ - ي)</option>
                  <option value="id_asc">الترتيب: رقم القناة</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="ابحث عن قناة (beIN 1, Eurosport...)"
                  className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] pr-9 pl-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Network Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-3 bg-[var(--bg-canvas)]/60">
            {[
              { id: 'all', label: 'جميع الشبكات' },
              ...(liveBroadcastingChannelIds.size > 0
                ? [
                    {
                      id: 'live_now',
                      label: `قنوات تنقل الآن (${liveBroadcastingChannelIds.size})`,
                      isLive: true
                    }
                  ]
                : []),
              { id: 'bein_ar', label: 'beIN Sports العربية' },
              { id: 'bein_global', label: 'beIN Sports الدولية' },
              { id: 'euro', label: 'القنوات الأوروبية' }
            ].map(cat => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                    active
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold shadow-sm'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold hover:border-[var(--border-strong)]'
                  }`}
                >
                  {'isLive' in cat && cat.isLive && (
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[var(--accent-contrast)]' : 'live-dot-pulse'}`} />
                  )}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Refined Channel Cards Grid */}
        {loadingChannels ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] animate-pulse p-4"
              />
            ))}
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="py-14 text-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-2xl p-8 space-y-3 shadow-md">
            <div className="font-display-num text-2xl font-extrabold text-[var(--text-muted)]">
              NO FEED MATCHED
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              لا توجد قناة مطابقة لعبارة البحث الحالية
            </div>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              تحقق من اسم القناة أو أعد ضبط التصفية لعرض جميع القنوات العاملة.
            </p>
            <button
              type="button"
              onClick={() => {
                handleSearchChange('');
                handleCategoryChange('all');
              }}
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-extrabold transition-all cursor-pointer"
            >
              إظهار جميع القنوات
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                    className={`group rounded-2xl border bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] transition-all cursor-pointer flex items-stretch justify-between overflow-hidden shadow-sm hover:shadow-md ${
                      isLiveNow
                        ? 'border-[var(--signal-live)]/40 hover:border-[var(--signal-live)]'
                        : 'border-[var(--border-hairline)] hover:border-[var(--accent-primary)]/40'
                    }`}
                  >
                    {/* Left/Start Call-Sign Number Box */}
                    <div className="w-16 sm:w-20 bg-[var(--bg-canvas)]/80 group-hover:bg-[var(--bg-elevated)] border-l border-[var(--border-hairline)] flex flex-col items-center justify-center px-2 py-3.5 shrink-0 transition-colors">
                      <span className="font-display-num text-xl sm:text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] leading-none">
                        {String(channel.id).padStart(2, '0')}
                      </span>
                      <span className="font-display-num text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1">
                        {brand.badgeText}
                      </span>
                    </div>

                    {/* Center Channel Info & Current Broadcast */}
                    <div className="p-3.5 flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display-ar text-sm sm:text-base font-extrabold text-[var(--text-primary)] truncate">
                          {channel.arabicName || channel.name}
                        </h3>

                        {isLiveNow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-live)] text-white font-display-num text-[11px] font-extrabold shrink-0 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>LIVE</span>
                          </span>
                        ) : (
                          <span className="font-display-num text-[11px] font-bold text-[var(--text-muted)] px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] shrink-0">
                            {channel.quality || '1080p'}
                          </span>
                        )}
                      </div>

                      {isMatch && matchData ? (
                        <div className="flex items-center justify-between gap-2 text-[11px] rounded-lg bg-[var(--bg-canvas)]/90 border border-[var(--border-hairline)] px-2.5 py-1">
                          <div className="min-w-0 flex-1 flex items-center gap-1 truncate">
                            <span
                              className="font-bold text-[var(--accent-primary)] truncate max-w-[48%]"
                              title={matchData.teamA.name}
                            >
                              {matchData.teamA.name}
                            </span>
                            <span className="text-[var(--text-muted)] text-[10px] shrink-0">vs</span>
                            <span
                              className="font-bold text-[var(--accent-primary)] truncate max-w-[48%]"
                              title={matchData.teamB.name}
                            >
                              {matchData.teamB.name}
                            </span>
                          </div>
                          <span className="font-display-num text-xs font-black text-[var(--text-primary)] shrink-0 px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                            {matchData.status === 'LIVE'
                              ? formatBroadcastMinute(matchData.minute)
                              : matchData.time}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                          <span className="truncate">
                            {broadcast?.programTitle || brand.networkSubLabel}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                            {channel.lang === 'Arabic' ? 'عربي' : channel.lang || 'عربي'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Play Trigger Column */}
                    <div className="px-3 flex items-center justify-center border-r border-[var(--border-hairline)] bg-[var(--bg-canvas)]/30 group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--accent-contrast)] text-[var(--text-muted)] transition-all shrink-0">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load-More Bar */}
            <div ref={loadMoreSentinelRef} className="py-5 flex flex-col items-center justify-center">
              {hasMoreChannels ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredChannels.length))
                  }
                  className="px-6 py-2.5 rounded-[2px] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>
                    إظهار المزيد من القنوات ({visibleChannels.length} / {filteredChannels.length})
                  </span>
                </button>
              ) : (
                <div className="text-[11px] font-display-num uppercase tracking-wider text-[var(--text-muted)]">
                  END OF DIRECTORY · {filteredChannels.length} CHANNELS LOADED
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
