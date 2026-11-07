import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Play,
  ArrowUpDown,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Channel, LiveMatch } from '../types';
import { usePageSeo } from '../hooks/usePageSeo';
import { getChannelBrandIdentity } from '../utils/channelBranding';
import {
  getKickoffCountdown,
  formatBroadcastMinute
} from '../utils/broadcastFormatters';
import { TeamBadge } from '../components/TeamBadge';
import { LeagueBadge } from '../components/LeagueBadge';

type ChannelSortOption = 'default' | 'live_first' | 'id_asc' | 'name_asc';

const BATCH_SIZE = 18;

// Strictly allow ONLY the 9 designated major competitions on the HomePage spotlight
export function isFeaturedMajorCompetition(competition?: string): boolean {
  if (!competition) return false;
  const c = competition.toLowerCase().trim();

  // Explicitly reject women's competitions, AFC Asian competitions, youth tournaments, and lower divisions
  if (
    /women|سيدات|femenina|frauen|afc|آسيا|اسيا|u18|u19|u20|u21|u23|amateur|reserve|2\.|segunda|bundesliga 2|serie b|ligue 2/.test(
      c
    )
  ) {
    return false;
  }

  // Reject foreign national leagues outside the 9 major competitions
  if (
    /canadian|kuwait|belarus|austria|russia|turkey|bulgaria|poland|estonia|kazakhstan|czech|romania/.test(
      c
    )
  ) {
    return false;
  }

  // 1. الدوري الإنجليزي الممتاز (Premier League)
  if (
    c === 'الدوري الإنجليزي' ||
    c === 'الدوري الإنجليزي الممتاز' ||
    c === 'premier league' ||
    c === 'english premier league' ||
    (c.includes('إنجليزي') && !c.includes('درجة')) ||
    (c.includes('انجليزي') && !c.includes('درجة'))
  ) {
    return true;
  }

  // 2. الدوري الإسباني (لا ليغا) (La Liga)
  if (
    c === 'الدوري الإسباني' ||
    c === 'الدوري الإسباني (لا ليغا)' ||
    c === 'la liga' ||
    c === 'laliga' ||
    (c.includes('إسباني') && !c.includes('درجة')) ||
    (c.includes('اسباني') && !c.includes('درجة'))
  ) {
    return true;
  }

  // 3. الدوري الإيطالي (سيريا آ) (Serie A)
  if (
    c === 'الدوري الإيطالي' ||
    c === 'الدوري الإيطالي (سيريا آ)' ||
    c === 'serie a' ||
    (c.includes('إيطالي') && !c.includes('درجة')) ||
    (c.includes('ايطالي') && !c.includes('درجة'))
  ) {
    return true;
  }

  // 4. الدوري الألماني (البوندسليغا) (Bundesliga)
  if (
    c === 'الدوري الألماني' ||
    c === 'الدوري الألماني (البوندسليغا)' ||
    c === 'bundesliga' ||
    (c.includes('ألماني') && !c.includes('درجة')) ||
    (c.includes('الماني') && !c.includes('درجة'))
  ) {
    return true;
  }

  // 5. الدوري الفرنسي (ليغ 1) (Ligue 1)
  if (
    c === 'الدوري الفرنسي' ||
    c === 'الدوري الفرنسي (ليغ 1)' ||
    c === 'ligue 1' ||
    (c.includes('فرنسي') && !c.includes('درجة'))
  ) {
    return true;
  }

  // 6. دوري أبطال أوروبا (UEFA Champions League only)
  if (
    c.includes('أبطال أوروبا') ||
    c.includes('ابطال اوروبا') ||
    c.includes('uefa champions league') ||
    (c.includes('champions league') && !c.includes('afc') && !c.includes('caf'))
  ) {
    return true;
  }

  // 7. دوري روشن السعودي للمحترفين (Saudi Pro League)
  if (
    c.includes('روشن') ||
    c.includes('saudi pro league') ||
    (c.includes('سعودي') && c.includes('دوري'))
  ) {
    return true;
  }

  // 8. الدوري المصري الممتاز (Egyptian Premier League)
  if (
    c.includes('الدوري المصري') ||
    c.includes('egyptian premier league')
  ) {
    return true;
  }

  // 9. البطولة المغربية الاحترافية إنوي (Botola Pro Morocco)
  if (
    c.includes('البطولة المغربية') ||
    c.includes('botola') ||
    c.includes('إنوي') ||
    c.includes('الدوري المغربي')
  ) {
    return true;
  }

  return false;
}

// Computes a match urgency score prioritizing matches starting soonest
function getMatchUrgencyScore(m: LiveMatch, nowMs: number): number {
  // Live matches are always top priority
  if (m.status === 'LIVE') return -1000000;
  // Finished matches come after upcoming matches
  if (m.status === 'RESULT') return 1000000;

  const timeMatch = m.time ? m.time.trim().match(/^(\d{1,2}):(\d{2})/) : null;
  if (!timeMatch) return 500000;

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  if (isNaN(hours) || isNaN(minutes)) return 500000;

  const now = new Date(nowMs);
  const target = new Date(nowMs);
  target.setHours(hours, minutes, 0, 0);

  let diffMinutes = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diffMinutes < -120) {
    diffMinutes += 24 * 60;
  }
  if (diffMinutes < 0) {
    diffMinutes = 0;
  }

  // Tie-breaker within the same kickoff window (subtract up to 25 minutes for Premier League & elite derbies)
  let prestigeBonus = 0;
  const t = `${m.teamA.name} ${m.teamB.name}`.toLowerCase();
  if (/real madrid|ريال مدريد|barcelona|برشلونة/.test(t)) prestigeBonus += 25;
  if (/tottenham|توتنهام|arsenal|أرسنال|manchester|سيتي|يونايتد|liverpool|ليفربول|chelsea|تشيلسي/.test(t)) prestigeBonus += 20;
  if (/milan|ميلان|inter|إنتر|juventus|يوفنتوس/.test(t)) prestigeBonus += 18;
  if (/bayern|بايرن|dortmund|دورتموند|paris|باريس/.test(t)) prestigeBonus += 15;
  if (/الهلال|النصر|الاتحاد|الأهلي/.test(t)) prestigeBonus += 15;
  if (m.competition.includes('إنجليزي') || m.competition.includes('premier')) prestigeBonus += 10;
  if (m.channels && m.channels.length > 0) prestigeBonus += 5;

  return diffMinutes * 100 - prestigeBonus;
}

export const HomePage: React.FC = () => {
  usePageSeo({
    title: 'kolstream – بث مباشر للمباريات ودليل القنوات الرياضية 24/7',
    description:
      'تابع البث المباشر لأهم مباريات اليوم في دوري روشن السعودي، دوري أبطال أوروبا، والدوريات العالمية الكبرى على kolstream.',
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

  // Filter ONLY matches belonging to the 9 major leagues for the Home Page spotlight
  const majorLeagueMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    return matches.filter(m => isFeaturedMajorCompetition(m.competition));
  }, [matches]);

  const spotlightMatches = useMemo(() => {
    if (majorLeagueMatches.length === 0) {
      return [];
    }
    const sorted = [...majorLeagueMatches].sort(
      (a, b) => getMatchUrgencyScore(a, nowMs) - getMatchUrgencyScore(b, nowMs)
    );
    return sorted.slice(0, 6);
  }, [majorLeagueMatches, nowMs]);

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
      { rootMargin: '300px' }
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
    <div className="space-y-6 sm:space-y-8" dir="rtl">
      {/* 1. CLEAN BROADCAST SPOTLIGHT: FEATURED DERBY / BIG MATCH */}
      {activeHeroMatch ? (
        <section
          aria-label="مباراة القمة المباشرة"
          className="border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-md overflow-hidden shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Primary Match Center (Mobile full-width / Desktop 8 cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-[var(--border-hairline)]">
              {/* Header Strip */}
              <div className="px-4 sm:px-6 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2.5 py-0.5 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-display-ar text-xs font-black shrink-0">
                    مباراة القمة
                  </span>
                  <LeagueBadge competition={activeHeroMatch.competition} size="sm" />
                  <span className="font-display-ar text-sm font-bold text-[var(--text-primary)] truncate">
                    {activeHeroMatch.competition}
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {activeHeroMatch.status === 'LIVE' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[var(--signal-live)] text-white font-display-num text-xs font-black shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>LIVE · {formatBroadcastMinute(activeHeroMatch.minute)}</span>
                    </span>
                  ) : activeHeroMatch.status === 'RESULT' ? (
                    <span className="px-2.5 py-0.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-muted)] font-display-ar text-xs font-bold">
                      انتهت (FT)
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {heroCountdown && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-[var(--accent-primary)] font-display-num text-xs font-bold">
                          {heroCountdown}
                        </span>
                      )}
                      <span className="font-display-num text-sm font-extrabold text-[var(--text-secondary)]">
                        {activeHeroMatch.time}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Match Display Arena */}
              <div className="p-5 sm:p-8 bg-gradient-to-b from-[var(--bg-canvas)] to-[var(--bg-surface)] flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-11 items-center gap-2 sm:gap-4">
                  {/* Team A (Home) */}
                  <div className="col-span-4 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-right gap-2 sm:gap-4 min-w-0">
                    <TeamBadge
                      name={activeHeroMatch.teamA.name}
                      logo={activeHeroMatch.teamA.logo}
                      size="lg"
                      priority
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display-ar text-sm sm:text-xl md:text-2xl font-black text-[var(--text-primary)] leading-tight break-words">
                        {activeHeroMatch.teamA.name}
                      </h2>
                    </div>
                  </div>

                  {/* Scoreboard Center */}
                  <div className="col-span-3 flex flex-col items-center justify-center py-2 px-1 sm:py-3 sm:px-4 rounded-md bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-inner">
                    {activeHeroMatch.scoreA !== null && activeHeroMatch.scoreB !== null ? (
                      <div
                        className={`font-display-num text-2xl sm:text-4xl md:text-5xl font-black leading-none ${
                          activeHeroMatch.status === 'LIVE'
                            ? 'text-[var(--signal-live)]'
                            : 'text-[var(--accent-primary)]'
                        }`}
                      >
                        {activeHeroMatch.scoreA}
                        <span className="text-[var(--text-muted)] mx-1">:</span>
                        {activeHeroMatch.scoreB}
                      </div>
                    ) : (
                      <div className="font-display-num text-lg sm:text-3xl md:text-4xl font-black leading-none text-[var(--text-primary)]">
                        {activeHeroMatch.time}
                      </div>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1 text-center">
                      {activeHeroMatch.status === 'LIVE'
                        ? 'مباشر الآن'
                        : activeHeroMatch.status === 'RESULT'
                        ? 'النتيجة النهائية'
                        : 'توقيت مكة'}
                    </span>
                  </div>

                  {/* Team B (Away) */}
                  <div className="col-span-4 flex flex-col-reverse sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 sm:gap-4 min-w-0">
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <h2 className="font-display-ar text-sm sm:text-xl md:text-2xl font-black text-[var(--text-primary)] leading-tight break-words">
                        {activeHeroMatch.teamB.name}
                      </h2>
                    </div>
                    <TeamBadge
                      name={activeHeroMatch.teamB.name}
                      logo={activeHeroMatch.teamB.logo}
                      size="lg"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 sm:px-6 py-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
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
                          lang: 'Arabic',
                          country: 'QA'
                        };
                        handleTuneIn(chFound);
                      }}
                      className="px-5 py-2.5 rounded-md bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-contrast)] font-extrabold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>شاهد البث الحي · {activeHeroMatch.channels[0].channel_name}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (channels[0]) handleTuneIn(channels[0]);
                      }}
                      className="px-5 py-2.5 rounded-md bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-contrast)] font-extrabold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>انتقل إلى البث المباشر</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate('/schedule')}
                    className="px-4 py-2.5 rounded-md bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>جدول مباريات اليوم ({matches.length})</span>
                  </button>
                </div>

                {activeHeroMatch.commentator && (
                  <div className="text-xs text-[var(--text-muted)] font-semibold hidden md:block">
                    المعلق: <span className="text-[var(--text-primary)]">{activeHeroMatch.commentator}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Matchday Sidebar (Hidden on Mobile to keep home clean) */}
            <div className="hidden lg:flex lg:col-span-4 flex-col justify-between bg-[var(--bg-surface)]">
              <div className="px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] flex items-center justify-between">
                <span className="font-display-ar text-xs font-black text-[var(--text-primary)]">
                  أبرز مواجهات البطولات الكبرى
                </span>
                <span className="font-display-num text-xs font-bold text-[var(--accent-primary)]">
                  {spotlightMatches.length} MATCHES
                </span>
              </div>

              <div className="divide-y divide-[var(--border-hairline)] flex-1 overflow-y-auto max-h-[380px]">
                {spotlightMatches.map((m, idx) => {
                  const isSelected = idx === selectedHeroIndex;
                  const isLive = m.status === 'LIVE';
                  const hasScore = m.scoreA !== null && m.scoreB !== null;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedHeroIndex(idx)}
                      className={`w-full px-4 py-3 text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-elevated)] border-r-3 border-r-[var(--accent-primary)]'
                          : isLive
                          ? 'bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] border-r-3 border-r-[var(--signal-live)]'
                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] border-r-3 border-r-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] truncate mb-1">
                          <LeagueBadge competition={m.competition} size="xs" />
                          <span className="truncate">{m.competition}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <TeamBadge name={m.teamA.name} logo={m.teamA.logo} size="xs" />
                              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {m.teamA.name}
                              </span>
                            </div>
                            {hasScore && (
                              <span className="font-display-num text-xs font-black text-[var(--text-primary)] shrink-0">
                                {m.scoreA}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <TeamBadge name={m.teamB.name} logo={m.teamB.logo} size="xs" />
                              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {m.teamB.name}
                              </span>
                            </div>
                            {hasScore && (
                              <span className="font-display-num text-xs font-black text-[var(--text-primary)] shrink-0">
                                {m.scoreB}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-left flex flex-col items-end">
                        {isLive ? (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--signal-live)] text-white font-display-num text-[11px] font-black">
                            {formatBroadcastMinute(m.minute)}
                          </span>
                        ) : hasScore ? (
                          <span className="text-[11px] font-bold text-[var(--text-muted)]">
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
          </div>
        </section>
      ) : null}

      {/* 2. MAJOR LEAGUES SVG SHOWCASE BAR */}
      <section aria-label="أبرز الدوريات والبطولات الكبرى" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[var(--accent-primary)] rounded-[1px]" />
            <span className="font-display-ar text-xs font-black text-[var(--text-primary)]">
              الدوريات والبطولات الكبرى
            </span>
          </div>
          <span className="font-display-num text-[11px] text-[var(--accent-primary)] font-bold">
            9 MAJOR LEAGUES
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {[
            { name: 'دوري أبطال أوروبا', short: 'الأبطال', comp: 'دوري أبطال أوروبا' },
            { name: 'الدوري الإنجليزي الممتاز', short: 'بريميرليج', comp: 'الدوري الإنجليزي' },
            { name: 'الدوري الإسباني (لا ليغا)', short: 'لا ليغا', comp: 'الدوري الإسباني' },
            { name: 'الدوري الإيطالي (سيريا آ)', short: 'سيريا آ', comp: 'الدوري الإيطالي' },
            { name: 'الدوري الألماني (البوندسليغا)', short: 'بوندسليغا', comp: 'الدوري الألماني' },
            { name: 'الدوري الفرنسي (ليغ 1)', short: 'ليغ 1', comp: 'الدوري الفرنسي' },
            { name: 'دوري روشن السعودي للمحترفين', short: 'دوري روشن', comp: 'دوري روشن' },
            { name: 'الدوري المصري الممتاز', short: 'الدوري المصري', comp: 'الدوري المصري' },
            { name: 'البطولة المغربية الاحترافية إنوي', short: 'البطولة المغربية', comp: 'البطولة المغربية' }
          ].map(lg => (
            <button
              key={lg.comp}
              type="button"
              onClick={() => navigate(`/schedule?q=${encodeURIComponent(lg.comp)}`)}
              className="p-2 sm:p-2.5 rounded-[2px] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--accent-primary)]/70 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer text-center shadow-xs"
              title={`عرض مواجهات ${lg.name}`}
            >
              <LeagueBadge competition={lg.comp} size="md" />
              <span className="font-display-ar text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate w-full">
                {lg.short}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. CHANNELS DIRECTORY & FAST FILTERS */}
      <section className="space-y-4" aria-label="دليل القنوات الرياضية">
        {/* Filter & Search Bar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-md overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-8 bg-[var(--accent-primary)] shrink-0" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display-ar text-base sm:text-lg font-black text-[var(--text-primary)]">
                    دليل القنوات الرياضية الناقلة
                  </h1>
                  <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-xs font-bold text-[var(--accent-primary)]">
                    {filteredChannels.length} CH
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  بث مباشر بجودة FHD متواصل 24/7 لأهم القنوات الرياضية العربية والعالمية
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
                  className="w-full sm:w-auto rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] pr-8 pl-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all cursor-pointer"
                >
                  <option value="default">الترتيب: الافتراضي</option>
                  <option value="live_first">الترتيب: تبث الآن أولاً</option>
                  <option value="name_asc">الترتيب: الأبجدي</option>
                  <option value="id_asc">الترتيب: رقم القناة</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="ابحث عن قناة (beIN, Sky, Eurosport...)"
                  className="w-full rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] pr-9 pl-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Network Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-3 bg-[var(--bg-canvas)]/50">
            {[
              { id: 'all', label: 'جميع القنوات' },
              ...(liveBroadcastingChannelIds.size > 0
                ? [
                    {
                      id: 'live_now',
                      label: `تبث الآن (${liveBroadcastingChannelIds.size})`,
                      isLive: true
                    }
                  ]
                : []),
              { id: 'bein_ar', label: 'beIN Sports العربية' },
              { id: 'bein_global', label: 'beIN Sports العالمية' },
              { id: 'euro', label: 'القنوات الأوروبية' }
            ].map(cat => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3.5 py-1.5 rounded-[2px] text-xs whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
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

        {/* Clean Channel Buttons Grid */}
        {loadingChannels ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div
                key={idx}
                className="h-22 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] animate-pulse"
              />
            ))}
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="py-12 text-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-md p-6 space-y-3">
            <div className="font-display-num text-xl font-black text-[var(--text-muted)]">
              NO MATCHING CHANNELS
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              لم نعثر على قنوات مطابقة لبحثك
            </div>
            <button
              type="button"
              onClick={() => {
                handleSearchChange('');
                handleCategoryChange('all');
              }}
              className="px-4 py-2 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold transition-all cursor-pointer"
            >
              عرض كافة القنوات
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleChannels.map(channel => {
                const broadcast = getChannelBroadcast(channel.id);
                const isMatch = Boolean(broadcast?.isMatch && broadcast?.match);
                const matchData = broadcast?.match;
                const isLiveNow = Boolean(isMatch && matchData?.status === 'LIVE');
                const brand = getChannelBrandIdentity(channel);

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleTuneIn(channel)}
                    className={`group rounded-md border bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] transition-all cursor-pointer flex items-stretch text-right overflow-hidden shadow-sm hover:shadow ${
                      isLiveNow
                        ? 'border-[var(--signal-live)]/40 hover:border-[var(--signal-live)]'
                        : 'border-[var(--border-hairline)] hover:border-[var(--accent-primary)]/50'
                    }`}
                  >
                    {/* Call-Sign Channel Number */}
                    <div className="w-16 sm:w-18 bg-[var(--bg-canvas)] group-hover:bg-[var(--bg-elevated)] border-l border-[var(--border-hairline)] flex flex-col items-center justify-center px-2 py-3 shrink-0 transition-colors">
                      <span className="font-display-num text-xl sm:text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] leading-none">
                        {String(channel.id).padStart(2, '0')}
                      </span>
                      <span className="font-display-num text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1">
                        {brand.badgeText}
                      </span>
                    </div>

                    {/* Channel Info & Current Program */}
                    <div className="p-3.5 flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-display-ar text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
                          {channel.arabicName || channel.name}
                        </div>

                        {isLiveNow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[var(--signal-live)] text-white font-display-num text-xs font-black shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>LIVE</span>
                          </span>
                        ) : (
                          <span className="font-display-num text-xs font-bold text-[var(--text-muted)] px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] shrink-0">
                            {channel.quality || '1080p'}
                          </span>
                        )}
                      </div>

                      {isMatch && matchData ? (
                        <div className="flex items-center justify-between gap-2 text-xs rounded bg-[var(--bg-canvas)] border border-[var(--border-hairline)] px-2 py-1">
                          <div className="min-w-0 flex-1 truncate text-[var(--accent-primary)] font-bold">
                            {matchData.teamA.name} <span className="text-[var(--text-muted)]">×</span> {matchData.teamB.name}
                          </div>
                          <span className="font-display-num text-xs font-black text-[var(--text-primary)] shrink-0">
                            {matchData.status === 'LIVE' ? formatBroadcastMinute(matchData.minute) : matchData.time}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span className="truncate">
                            {broadcast?.programTitle || brand.networkSubLabel}
                          </span>
                          <span className="text-[11px] shrink-0 font-medium">
                            {channel.lang === 'Arabic' ? 'عربي' : channel.lang || 'عربي'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Play Button Indicator */}
                    <div className="px-3 flex items-center justify-center border-r border-[var(--border-hairline)] bg-[var(--bg-canvas)]/40 group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--accent-contrast)] text-[var(--text-muted)] transition-all shrink-0">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Load More Bar */}
            <div ref={loadMoreSentinelRef} className="py-4 flex flex-col items-center justify-center">
              {hasMoreChannels ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredChannels.length))
                  }
                  className="px-6 py-2.5 rounded-[2px] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>
                    إظهار المزيد من القنوات ({visibleChannels.length} / {filteredChannels.length})
                  </span>
                </button>
              ) : (
                <div className="text-xs font-display-num uppercase tracking-wider text-[var(--text-muted)]">
                  ALL {filteredChannels.length} CHANNELS LOADED
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
