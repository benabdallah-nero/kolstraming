import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Play,
  RefreshCw,
  Bell
} from 'lucide-react';
import { useApp, getApiUrl } from '../context/AppContext';
import { LiveMatch, MatchDateKey } from '../types';
import { fetchMatchesByDateWithFallback } from '../utils/footballData';
import { Pagination } from '../components/Pagination';
import { MatchDetailsModal } from '../components/MatchDetailsModal';
import { usePageSeo } from '../hooks/usePageSeo';
import {
  getKickoffCountdown,
  formatBroadcastMinute,
  isMarqueeMatch,
  deriveTeamFormByName
} from '../utils/broadcastFormatters';

export const SchedulePage: React.FC = () => {
  usePageSeo({
    title: 'جدول المباريات والنتائج المباشرة (الأمس واليوم والغد) – kolstream',
    description:
      'تابع نتائج ومواعيد مباريات الأمس واليوم والغد في الدوريات العربية والأوروبية مع التشكيلات والإحصائيات والقنوات الناقلة على kolstream.',
    canonicalPath: '/schedual'
  });

  const {
    matches: todayMatches,
    loadingMatches: loadingTodayMatches,
    refreshMatches,
    setActiveStreamingChannel,
    channels,
    matchReminders,
    toggleMatchReminder,
    isMatchReminderSet
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawDate = (searchParams.get('date') as MatchDateKey) || 'today';
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '24', 10);
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
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<LiveMatch | null>(null);
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
  const pageSize = [12, 24, 36, 48].includes(rawPageSize) ? rawPageSize : 24;

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
    } else if (category === 'reminders') {
      list = list.filter(m => matchReminders.includes(m.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        m =>
          m.teamA.name.toLowerCase().includes(q) ||
          m.teamB.name.toLowerCase().includes(q) ||
          m.competition.toLowerCase().includes(q) ||
          (m.broadcasterLabel && m.broadcasterLabel.toLowerCase().includes(q)) ||
          (m.channels && m.channels.some(c => c.channel_name.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [activeMatchesList, category, searchQuery, matchReminders]);

  const totalPages = Math.ceil(filteredMatches.length / pageSize) || 1;

  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMatches.slice(start, start + pageSize);
  }, [filteredMatches, currentPage, pageSize]);

  // Separate oversized featured match on page 1 from the dense list rows
  const featuredTopMatch = useMemo(() => {
    if (currentPage !== 1 || paginatedMatches.length === 0) return null;
    const liveMatch = paginatedMatches.find(m => m.status === 'LIVE');
    return liveMatch || paginatedMatches[0];
  }, [paginatedMatches, currentPage]);

  const listMatches = useMemo(() => {
    if (!featuredTopMatch) return paginatedMatches;
    return paginatedMatches.filter(m => m.id !== featuredTopMatch.id);
  }, [paginatedMatches, featuredTopMatch]);

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
    const reminders = activeMatchesList.filter(m => matchReminders.includes(m.id)).length;
    return { all: activeMatchesList.length, live, playable, bein, euro, reminders };
  }, [activeMatchesList, matchReminders]);

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
        lang: 'International',
        country: 'Global'
      });
    }
    navigate(`/watchroom/${channelId}`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. PROGRAMME CONTROL HEADER & SLIDING DATE BAR */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden shadow-lg shadow-black/20">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-8 rounded-full bg-[var(--accent-primary)] shrink-0" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display-ar text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                  جدول المباريات والنتائج الفورية
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-xs sm:text-sm font-bold text-[var(--accent-primary)]">
                  {filteredMatches.length} MATCH
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                تغطية شاملة لحظة بلحظة مع التشكيلة الرسمية والأحداث والقنوات الناقلة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/leagues')}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer"
            >
              ترتيب الدوريات ←
            </button>

            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="ابحث عن فريق أو بطولة..."
                className="w-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-xl pr-9 pl-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
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
              className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all shrink-0 cursor-pointer"
              title="تحديث النتائج"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCurrentList ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Switcher: Yesterday / Today / Tomorrow */}
        <div className="grid grid-cols-3 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/70 p-1.5 gap-1.5">
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
                className={`py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md font-extrabold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <span className={`font-display-num text-[10px] tracking-widest uppercase ${active ? 'opacity-90' : 'opacity-60'}`}>
                  {tab.code}
                </span>
                <span className="font-display-ar text-xs sm:text-sm font-extrabold mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-3 bg-[var(--bg-surface)]">
          {[
            { id: 'all', label: 'كل المباريات', count: counts.all },
            { id: 'live', label: 'مباشر الآن', count: counts.live, isLive: true },
            { id: 'playable', label: 'منقولة تلفزيونياً', count: counts.playable },
            { id: 'bein', label: 'beIN Sports', count: counts.bein },
            { id: 'euro', label: 'قنوات أوروبية', count: counts.euro },
            ...(counts.reminders > 0
              ? [{ id: 'reminders', label: 'مبارياتي المتابعة', count: counts.reminders }]
              : [])
          ].map(tab => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
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

      {/* 2. MATCHES BOARD: OVERSIZED FEATURED MATCH + REFINED FIXTURE LIST */}
      {isLoadingCurrentList ? (
        <div className="py-20 flex flex-col items-center justify-center text-[var(--text-secondary)] gap-3 border border-[var(--border-hairline)] rounded-2xl bg-[var(--bg-surface)]">
          <div className="w-7 h-7 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">جاري مزامنة جدول المباريات والنتائج المباشرة...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-16 text-center border border-[var(--border-hairline)] rounded-2xl p-8 space-y-3 bg-[var(--bg-surface)] shadow-md">
          <div className="font-display-num text-2xl sm:text-3xl font-extrabold text-[var(--text-muted)]">
            NO FIXTURES SCHEDULED
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)]">
            لا توجد مباريات مجدولة في هذا التوقيت — تفقد جدول الغد أو غيّر تصفية البطولات.
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                handleSearchChange('');
                handleCategoryChange('all');
              }}
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold text-xs transition-all cursor-pointer"
            >
              إظهار جميع المباريات
            </button>
            {selectedDate !== 'tomorrow' && (
              <button
                type="button"
                onClick={() => handleDateChange('tomorrow')}
                className="px-4 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-bold text-xs transition-all cursor-pointer"
              >
                مواجهات الغد ←
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* OVERSIZED FEATURED MATCH BANNER */}
          {featuredTopMatch && (
            <div
              onClick={() => setSelectedMatchForDetails(featuredTopMatch)}
              className={`border rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-surface)] to-[var(--bg-canvas)] overflow-hidden cursor-pointer transition-all shadow-xl ${
                featuredTopMatch.status === 'LIVE'
                  ? 'border-[var(--signal-live)]/60 shadow-[var(--signal-live)]/5'
                  : 'border-[var(--border-hairline)] hover:border-[var(--accent-primary)]/50'
              }`}
            >
              <div className="px-4 sm:px-6 py-3 bg-[var(--bg-elevated)]/80 border-b border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-display-ar text-[11px] font-extrabold">
                    المواجهة الأبرز
                  </span>
                  <span className="font-display-ar text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    {featuredTopMatch.competition}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {featuredTopMatch.status === 'LIVE' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--signal-live)] text-white font-display-num text-xs font-black shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>LIVE · {formatBroadcastMinute(featuredTopMatch.minute)}</span>
                    </span>
                  ) : featuredTopMatch.status === 'RESULT' ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-muted)] text-[11px] font-bold">
                      انتهت (FT)
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {getKickoffCountdown(featuredTopMatch.time, featuredTopMatch.status, nowMs) && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-[var(--accent-primary)] font-display-num text-xs font-bold">
                          {getKickoffCountdown(featuredTopMatch.time, featuredTopMatch.status, nowMs)}
                        </span>
                      )}
                      <span className="font-display-num text-sm font-bold text-[var(--text-secondary)]">
                        KO {featuredTopMatch.time}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-12 items-center gap-5">
                <div className="lg:col-span-8 grid grid-cols-12 items-center gap-2 sm:gap-4 md:gap-5">
                  {/* Team A */}
                  <div className="col-span-4 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-right gap-1.5 sm:gap-3 min-w-0">
                    {featuredTopMatch.teamA.logo ? (
                      <img
                        src={featuredTopMatch.teamA.logo}
                        alt={featuredTopMatch.teamA.name}
                        className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain rounded-full bg-[var(--bg-canvas)] p-1 border border-white/5 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] flex items-center justify-center font-display-ar text-sm sm:text-base font-extrabold text-[var(--text-primary)] shrink-0">
                        {featuredTopMatch.teamA.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 w-full sm:flex-1">
                      <div
                        title={featuredTopMatch.teamA.name}
                        className="font-display-ar text-xs sm:text-base md:text-xl lg:text-2xl font-extrabold text-[var(--text-primary)] leading-snug sm:leading-tight line-clamp-2 break-words"
                      >
                        {featuredTopMatch.teamA.name}
                      </div>
                      <div className="hidden sm:block text-[11px] text-[var(--text-muted)] mt-0.5">
                        صاحب الأرض
                      </div>
                    </div>
                  </div>

                  {/* Center Score / Time */}
                  <div className="col-span-4 flex flex-col items-center justify-center py-2 px-1.5 sm:py-3 sm:px-3 rounded-xl sm:rounded-2xl bg-[var(--bg-canvas)]/80 border border-[var(--border-hairline)] shadow-inner">
                    {featuredTopMatch.scoreA !== null && featuredTopMatch.scoreB !== null ? (
                      <span className="font-display-num text-2xl sm:text-4xl md:text-5xl font-black text-[var(--accent-primary)] leading-none tracking-tight">
                        {featuredTopMatch.scoreA} : {featuredTopMatch.scoreB}
                      </span>
                    ) : (
                      <span className="font-display-num text-xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] leading-none">
                        {featuredTopMatch.time}
                      </span>
                    )}
                    <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] mt-1 text-center">
                      {featuredTopMatch.status === 'LIVE' ? 'مباشر الآن' : featuredTopMatch.status === 'RESULT' ? 'النتيجة النهائية' : 'توقيت مكة'}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className="col-span-4 flex flex-col-reverse sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3 min-w-0">
                    <div className="min-w-0 w-full sm:flex-1 text-center sm:text-left">
                      <div
                        title={featuredTopMatch.teamB.name}
                        className="font-display-ar text-xs sm:text-base md:text-xl lg:text-2xl font-extrabold text-[var(--text-primary)] leading-snug sm:leading-tight line-clamp-2 break-words"
                      >
                        {featuredTopMatch.teamB.name}
                      </div>
                      <div className="hidden sm:block text-[11px] text-[var(--text-muted)] mt-0.5">
                        الضيف
                      </div>
                    </div>
                    {featuredTopMatch.teamB.logo ? (
                      <img
                        src={featuredTopMatch.teamB.logo}
                        alt={featuredTopMatch.teamB.name}
                        className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain rounded-full bg-[var(--bg-canvas)] p-1 border border-white/5 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] flex items-center justify-center font-display-ar text-sm sm:text-base font-extrabold text-[var(--text-primary)] shrink-0">
                        {featuredTopMatch.teamB.name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right/Left Actions */}
                <div className="lg:col-span-4 flex flex-wrap items-center justify-end gap-2 border-t lg:border-t-0 lg:border-r border-[var(--border-hairline)] pt-3 lg:pt-0 lg:pr-5">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedMatchForDetails(featuredTopMatch);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-bold text-[var(--text-primary)] cursor-pointer transition-all"
                  >
                    الأحداث والإحصائيات
                  </button>

                  {featuredTopMatch.channels && featuredTopMatch.channels.length > 0 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleTuneIn(
                          featuredTopMatch.channels[0].channel_id,
                          featuredTopMatch.channels[0].channel_name
                        );
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-contrast)] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{featuredTopMatch.channels[0].channel_name}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REFINED FIXTURE ROWS */}
          {listMatches.length > 0 && (
            <div className="border border-[var(--border-hairline)] rounded-2xl divide-y divide-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden shadow-lg shadow-black/10">
              {listMatches.map(match => {
                const isLive = match.status === 'LIVE';
                const isImportant = isMarqueeMatch(match);
                const hasScore = match.scoreA !== null && match.scoreB !== null;
                const hasReminder = isMatchReminderSet(match.id);
                const countdown = getKickoffCountdown(match.time, match.status, nowMs);

                return (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatchForDetails(match)}
                    className={`broadcast-row px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer transition-all ${
                      isLive
                        ? 'bg-[var(--signal-live)]/5 border-r-2 border-r-[var(--signal-live)]'
                        : isImportant
                        ? 'hover:bg-[var(--bg-row-hover)]'
                        : 'hover:bg-[var(--bg-row-hover)]'
                    }`}
                  >
                    {/* Right Column: Status / Minute / Kickoff + Competition */}
                    <div className="flex items-center justify-between lg:justify-start gap-3 lg:w-64 shrink-0">
                      <div className="w-24 shrink-0">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-live)]/15 border border-[var(--signal-live)]/30 text-[var(--signal-live)] font-display-num text-xs font-black">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-live)] animate-pulse" />
                            <span>{formatBroadcastMinute(match.minute)}</span>
                          </span>
                        ) : match.status === 'RESULT' ? (
                          <span className="px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-xs font-semibold text-[var(--text-muted)] uppercase">
                            FT · انتهت
                          </span>
                        ) : (
                          <div className="flex flex-col leading-tight">
                            <span className="font-display-num text-base font-extrabold text-[var(--text-primary)]">
                              {match.time}
                            </span>
                            {countdown && (
                              <span className="font-display-num text-[11px] font-bold text-[var(--accent-primary)] mt-0.5">
                                {countdown}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[var(--text-secondary)] truncate">
                          {match.competition}
                        </div>
                        {match.commentator && (
                          <div className="text-[10px] text-[var(--text-muted)] truncate">
                            {match.commentator}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center Column: Team A vs Score vs Team B */}
                    <div className="flex-1 grid grid-cols-11 items-center gap-2 max-w-2xl">
                      {/* Team A */}
                      <div className="col-span-4 flex items-center justify-end gap-2.5 min-w-0 text-left">
                        <span
                          className={`font-bold text-[var(--text-primary)] truncate ${
                            isImportant ? 'font-display-ar text-sm sm:text-base' : 'text-xs sm:text-sm'
                          }`}
                        >
                          {match.teamA.name}
                        </span>
                        {match.teamA.logo ? (
                          <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full bg-[var(--bg-canvas)] p-0.5 border border-white/5 shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[10px] font-extrabold text-[var(--text-secondary)] shrink-0">
                            {match.teamA.name.slice(0, 2)}
                          </div>
                        )}
                      </div>

                      {/* Score Box */}
                      <div className="col-span-3 flex items-center justify-center">
                        <div className="px-3 py-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] min-w-[70px] text-center shadow-inner">
                          {hasScore ? (
                            <span
                              className={`font-display-num font-black leading-none ${
                                isImportant ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                              } ${
                                isLive
                                  ? 'text-[var(--signal-live)]'
                                  : 'text-[var(--accent-primary)]'
                              }`}
                            >
                              {match.scoreA} - {match.scoreB}
                            </span>
                          ) : (
                            <span className="font-display-num text-xs font-bold text-[var(--text-muted)] tracking-wider">
                              VS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Team B */}
                      <div className="col-span-4 flex items-center gap-2.5 min-w-0 text-right">
                        {match.teamB.logo ? (
                          <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full bg-[var(--bg-canvas)] p-0.5 border border-white/5 shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[10px] font-extrabold text-[var(--text-secondary)] shrink-0">
                            {match.teamB.name.slice(0, 2)}
                          </div>
                        )}
                        <span
                          className={`font-bold text-[var(--text-primary)] truncate ${
                            isImportant ? 'font-display-ar text-sm sm:text-base' : 'text-xs sm:text-sm'
                          }`}
                        >
                          {match.teamB.name}
                        </span>
                      </div>
                    </div>

                    {/* Left Column: Channels & Details Trigger */}
                    <div className="flex items-center justify-between lg:justify-end gap-2 lg:w-64 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--border-hairline)]">
                      {match.channels && match.channels.length > 0 ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleTuneIn(match.channels[0].channel_id, match.channels[0].channel_name);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-contrast)] font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span className="truncate max-w-[120px]">{match.channels[0].channel_name}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[120px]">
                          {match.broadcasterLabel || 'بدون قناة ناقلة'}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedMatchForDetails(match);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all cursor-pointer"
                        >
                          الأحداث
                        </button>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleMatchReminder(match.id);
                          }}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            hasReminder
                              ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)]'
                              : 'bg-[var(--bg-canvas)] border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                          }`}
                          title={hasReminder ? 'إلغاء التنبيه' : 'تذكير بالمباراة'}
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination Bar */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredMatches.length}
        pageSize={pageSize}
        onPageChange={newPage => {
          const next = new URLSearchParams(searchParams);
          next.set('page', String(newPage));
          setSearchParams(next);
        }}
        onPageSizeChange={newSize => {
          const next = new URLSearchParams(searchParams);
          next.set('pageSize', String(newSize));
          next.set('page', '1');
          setSearchParams(next);
        }}
        pageSizeOptions={[12, 24, 36, 48]}
        itemLabel="مباراة"
      />

      {/* Match Details Modal */}
      <MatchDetailsModal
        match={selectedMatchForDetails}
        onClose={() => setSelectedMatchForDetails(null)}
        onTuneIn={handleTuneIn}
      />
    </div>
  );
};
