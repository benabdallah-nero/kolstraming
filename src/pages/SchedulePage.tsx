import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Play,
  RefreshCw,
  X,
  Tv
} from 'lucide-react';
import { useApp, getApiUrl } from '../context/AppContext';
import { LiveMatch, MatchDateKey } from '../types';
import { fetchMatchesByDateWithFallback } from '../utils/footballData';
import { Pagination } from '../components/Pagination';
import { TeamBadge } from '../components/TeamBadge';
import { LeagueBadge } from '../components/LeagueBadge';
import { usePageSeo } from '../hooks/usePageSeo';
import {
  getKickoffCountdown,
  formatBroadcastMinute
} from '../utils/broadcastFormatters';

export const SchedulePage: React.FC = () => {
  usePageSeo({
    title: 'جدول المباريات والنتائج المباشرة – kolstream',
    description:
      'تابع مواعيد ونتائج مباريات اليوم والأمس والغد والقنوات الناقلة المباشرة لجميع الدوريات العربية والعالمية على kolstream.',
    canonicalPath: '/schedule'
  });

  const {
    matches: todayMatches,
    loadingMatches: loadingTodayMatches,
    refreshMatches,
    setActiveStreamingChannel,
    channels
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawDate = (searchParams.get('date') as MatchDateKey) || 'today';
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '25', 10);
  const rawCategory = searchParams.get('category') || 'all';
  const rawSearch = searchParams.get('q') || '';

  const [selectedDate, setSelectedDate] = useState<MatchDateKey>(
    ['yesterday', 'today', 'tomorrow'].includes(rawDate) ? rawDate : 'today'
  );
  const [dateMatchesMap, setDateMatchesMap] = useState<Record<MatchDateKey, LiveMatch[]>>({
    yesterday: [],
    today: todayMatches,
    tomorrow: []
  });
  const [loadingDateMatches, setLoadingDateMatches] = useState<boolean>(false);
  const [category, setCategory] = useState<string>(rawCategory);
  const [searchQuery, setSearchQuery] = useState<string>(rawSearch);
  const [selectedMatchForChannelPick, setSelectedMatchForChannelPick] = useState<LiveMatch | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDateMatchesMap(prev => ({ ...prev, today: todayMatches }));
  }, [todayMatches]);

  useEffect(() => {
    if (rawCategory !== category) setCategory(rawCategory);
  }, [rawCategory, category]);

  useEffect(() => {
    if (rawSearch !== searchQuery) setSearchQuery(rawSearch);
  }, [rawSearch, searchQuery]);

  const fetchMatchesForDate = useCallback(
    async (dateKey: MatchDateKey, force = false) => {
      if (dateKey === 'today' && !force) return;
      setLoadingDateMatches(true);
      try {
        const list = await fetchMatchesByDateWithFallback(
          dateKey,
          getApiUrl(`/api/live-matches?date=${dateKey}`)
        );
        if (list.length > 0) {
          setDateMatchesMap(prev => ({ ...prev, [dateKey]: list }));
        }
      } catch {
        // Keep existing state
      } finally {
        setLoadingDateMatches(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedDate !== 'today' && dateMatchesMap[selectedDate].length === 0) {
      fetchMatchesForDate(selectedDate);
    }
  }, [selectedDate, dateMatchesMap, fetchMatchesForDate]);

  const activeMatchesList =
    selectedDate === 'today' ? todayMatches : dateMatchesMap[selectedDate] || [];
  const isLoadingCurrentList =
    selectedDate === 'today' ? loadingTodayMatches && todayMatches.length === 0 : loadingDateMatches;

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = [15, 25, 50].includes(rawPageSize) ? rawPageSize : 25;

  const filteredMatches = useMemo(() => {
    let list = activeMatchesList;

    if (category === 'live') {
      list = list.filter(m => m.status === 'LIVE');
    } else if (category === 'playable') {
      list = list.filter(m => m.channels && m.channels.length > 0);
    } else if (category === 'bein') {
      list = list.filter(
        m =>
          m.isBeinArabic ||
          m.network === 'bein_ar' ||
          (m.channels && m.channels.some(c => c.channel_name.toLowerCase().includes('bein')))
      );
    } else if (category === 'euro') {
      list = list.filter(
        m =>
          m.channels &&
          m.channels.length > 0 &&
          m.channels.some(c => !c.isBeinArabic)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        m =>
          m.teamA.name.toLowerCase().includes(q) ||
          m.teamB.name.toLowerCase().includes(q) ||
          m.competition.toLowerCase().includes(q) ||
          (m.channels && m.channels.some(c => c.channel_name.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [activeMatchesList, category, searchQuery]);

  const totalPages = Math.ceil(filteredMatches.length / pageSize) || 1;

  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMatches.slice(start, start + pageSize);
  }, [filteredMatches, currentPage, pageSize]);

  const counts = useMemo(() => {
    const live = activeMatchesList.filter(m => m.status === 'LIVE').length;
    const playable = activeMatchesList.filter(m => m.channels && m.channels.length > 0).length;
    const bein = activeMatchesList.filter(
      m =>
        m.isBeinArabic ||
        m.network === 'bein_ar' ||
        (m.channels && m.channels.some(c => c.channel_name.toLowerCase().includes('bein')))
    ).length;
    const euro = activeMatchesList.filter(
      m => m.channels && m.channels.length > 0 && m.channels.some(c => !c.isBeinArabic)
    ).length;
    return { all: activeMatchesList.length, live, playable, bein, euro };
  }, [activeMatchesList]);

  const handleDateChange = (newDate: MatchDateKey) => {
    setSelectedDate(newDate);
    const next = new URLSearchParams(searchParams);
    if (newDate !== 'today') {
      next.set('date', newDate);
    } else {
      next.delete('date');
    }
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const next = new URLSearchParams(searchParams);
    if (val.trim()) {
      next.set('q', val.trim());
    } else {
      next.delete('q');
    }
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const next = new URLSearchParams(searchParams);
    if (newCat !== 'all') {
      next.set('category', newCat);
    } else {
      next.delete('category');
    }
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const handleTuneIn = (channelId: number, channelName?: string) => {
    const ch = channels.find(c => c.id === channelId);
    if (ch) {
      setActiveStreamingChannel(ch);
    } else if (channelName) {
      setActiveStreamingChannel({
        id: channelId,
        name: channelName,
        category: 'other',
        quality: '1080p FHD',
        lang: 'Arabic',
        country: 'Global'
      });
    }
    setSelectedMatchForChannelPick(null);
    navigate(`/watchroom/${channelId}`);
  };

  const handleMatchRowClick = (match: LiveMatch) => {
    if (!match.channels || match.channels.length === 0) {
      return;
    }
    if (match.channels.length === 1) {
      handleTuneIn(match.channels[0].channel_id, match.channels[0].channel_name);
    } else {
      setSelectedMatchForChannelPick(match);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. CONTROL BAR & DATE TABS */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-md overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-8 bg-[var(--accent-primary)] shrink-0" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display-ar text-base sm:text-lg font-black text-[var(--text-primary)]">
                  جدول المباريات والنتائج المباشرة
                </h1>
                <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-xs font-bold text-[var(--accent-primary)]">
                  {filteredMatches.length} MATCHES
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                مواعيد المباريات، النتائج اللحظية، والقنوات الناقلة بنقرة واحدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="ابحث عن فريق أو بطولة..."
                className="w-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-[2px] pr-9 pl-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedDate === 'today') {
                  refreshMatches();
                } else {
                  fetchMatchesForDate(selectedDate, true);
                }
              }}
              disabled={isLoadingCurrentList}
              className="p-2.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all shrink-0 cursor-pointer"
              title="تحديث النتائج"
              aria-label="تحديث النتائج"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCurrentList ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Tabs (Yesterday / Today / Tomorrow) */}
        <div className="grid grid-cols-3 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1 gap-1">
          {([
            { id: 'yesterday', label: 'نتائج الأمس', code: 'YESTERDAY' },
            { id: 'today', label: 'مباريات اليوم', code: 'TODAY' },
            { id: 'tomorrow', label: 'مواجهات الغد', code: 'TOMORROW' }
          ] as const).map(tab => {
            const active = selectedDate === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleDateChange(tab.id)}
                className={`py-2 px-3 rounded-[2px] text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <span className={`font-display-num text-[10px] tracking-wider uppercase ${active ? 'opacity-90' : 'opacity-60'}`}>
                  {tab.code}
                </span>
                <span className="font-display-ar text-xs sm:text-sm font-bold mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-3 bg-[var(--bg-surface)]">
          {[
            { id: 'all', label: 'كل المباريات', count: counts.all },
            { id: 'live', label: 'مباشر الآن', count: counts.live, isLive: true },
            { id: 'playable', label: 'منقولة تلفزيونياً', count: counts.playable },
            { id: 'bein', label: 'beIN Sports', count: counts.bein },
            { id: 'euro', label: 'قنوات أوروبية', count: counts.euro }
          ].map(tab => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-[2px] text-xs whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  active
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold shadow-sm'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold hover:border-[var(--border-strong)]'
                }`}
              >
                {tab.isLive && counts.live > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? 'bg-[var(--accent-contrast)]' : 'live-dot-pulse'
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                <span className="font-display-num text-xs opacity-80">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MATCH FIXTURES LIST */}
      {isLoadingCurrentList ? (
        <div className="py-20 flex flex-col items-center justify-center text-[var(--text-secondary)] gap-3 border border-[var(--border-hairline)] rounded-md bg-[var(--bg-surface)]">
          <div className="w-7 h-7 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">جاري تحميل المباريات...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-14 text-center border border-[var(--border-hairline)] rounded-md p-6 space-y-3 bg-[var(--bg-surface)]">
          <div className="font-display-num text-xl font-bold text-[var(--text-muted)]">
            NO FIXTURES SCHEDULED
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)]">
            لا توجد مباريات مطابقة لهذا الاختيار
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            جرب اختيار يوم آخر أو إعادة ضبط البحث.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-[var(--border-hairline)] rounded-md divide-y divide-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
            {paginatedMatches.map(match => {
              const isLive = match.status === 'LIVE';
              const hasScore = match.scoreA !== null && match.scoreB !== null;
              const hasChannels = Boolean(match.channels && match.channels.length > 0);
              const countdown = getKickoffCountdown(match.time, match.status, nowMs);

              return (
                <div
                  key={match.id}
                  onClick={() => handleMatchRowClick(match)}
                  className={`px-3 sm:px-5 py-3 transition-colors ${
                    hasChannels ? 'cursor-pointer hover:bg-[var(--bg-row-hover)]' : ''
                  } ${isLive ? 'bg-[var(--signal-live)]/5 border-r-3 border-r-[var(--signal-live)]' : 'border-r-3 border-r-transparent'}`}
                >
                  {/* Top Meta Line: Competition & Status */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                    <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                      <LeagueBadge competition={match.competition} size="xs" />
                      <span className="font-semibold truncate">
                        {match.competition}
                      </span>
                    </div>
                    <div>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[var(--signal-live)] text-white font-display-num text-xs font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>{formatBroadcastMinute(match.minute)}</span>
                        </span>
                      ) : match.status === 'RESULT' ? (
                        <span className="font-bold text-[var(--text-muted)]">
                          FT · انتهت
                        </span>
                      ) : (
                        <span className="font-display-num font-bold text-[var(--accent-primary)]">
                          {countdown ? countdown : match.time}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Fixture Line: Clean Horizontal Strip on Mobile & Desktop */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* Teams & Score Strip */}
                    <div className="flex-1 grid grid-cols-11 items-center gap-1 sm:gap-3 min-w-0">
                      {/* Team A */}
                      <div className="col-span-4 flex items-center justify-end gap-1.5 sm:gap-2.5 min-w-0 text-left">
                        <span className="font-display-ar text-xs sm:text-base font-bold text-[var(--text-primary)] truncate">
                          {match.teamA.name}
                        </span>
                        <TeamBadge name={match.teamA.name} logo={match.teamA.logo} size="sm" />
                      </div>

                      {/* Center Score / Time Badge */}
                      <div className="col-span-3 flex items-center justify-center">
                        <div className="px-2 sm:px-3 py-1 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] min-w-[56px] sm:min-w-[70px] text-center">
                          {hasScore ? (
                            <span
                              className={`font-display-num font-black leading-none text-base sm:text-xl ${
                                isLive ? 'text-[var(--signal-live)]' : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {match.scoreA} - {match.scoreB}
                            </span>
                          ) : (
                            <span className="font-display-num text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                              {match.time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Team B */}
                      <div className="col-span-4 flex items-center gap-1.5 sm:gap-2.5 min-w-0 text-right">
                        <TeamBadge name={match.teamB.name} logo={match.teamB.logo} size="sm" />
                        <span className="font-display-ar text-xs sm:text-base font-bold text-[var(--text-primary)] truncate">
                          {match.teamB.name}
                        </span>
                      </div>
                    </div>

                    {/* Channel / Watch Action */}
                    <div className="shrink-0 flex items-center gap-1">
                      {hasChannels ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleMatchRowClick(match);
                          }}
                          className="px-3 py-1.5 rounded-[2px] bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-contrast)] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          title="انقر لمشاهدة البث المباشر"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">
                            {match.channels!.length > 1
                              ? `${match.channels!.length} قنوات`
                              : match.channels![0].channel_name}
                          </span>
                          <span className="sm:hidden">بث</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-[2px]">
                          قيد التحديد
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredMatches.length}
                pageSize={pageSize}
                itemLabel="مباراة"
                onPageChange={page => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(page));
                  setSearchParams(next);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. MULTI-CHANNEL QUICK SELECTOR MODAL */}
      {selectedMatchForChannelPick && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          dir="rtl"
          onClick={() => setSelectedMatchForChannelPick(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-md overflow-hidden shadow-2xl p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="font-display-ar text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  اختر القناة الناقلة للمباراة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMatchForChannelPick(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[var(--text-secondary)] text-center font-bold">
              {selectedMatchForChannelPick.teamA.name} × {selectedMatchForChannelPick.teamB.name}
            </div>

            <div className="space-y-2">
              {selectedMatchForChannelPick.channels?.map(ch => (
                <button
                  key={ch.channel_id}
                  type="button"
                  onClick={() => handleTuneIn(ch.channel_id, ch.channel_name)}
                  className="w-full p-3 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-contrast)] border border-[var(--border-hairline)] flex items-center justify-between gap-3 text-right transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Play className="w-4 h-4 text-[var(--accent-primary)] group-hover:text-[var(--accent-contrast)] fill-current" />
                    <span className="font-bold text-xs sm:text-sm">
                      {ch.channel_name}
                    </span>
                  </div>
                  <span className="font-display-num text-xs font-bold opacity-80">
                    CH #{String(ch.channel_id).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
