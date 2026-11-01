import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Play,
  RefreshCw,
  AlertCircle,
  Bell,
  Trophy,
  BarChart3
} from 'lucide-react';
import { useApp, getApiUrl } from '../context/AppContext';
import { LiveMatch, MatchDateKey } from '../types';
import { fetchMatchesByDateWithFallback } from '../utils/footballData';
import { Pagination } from '../components/Pagination';
import { MatchDetailsModal } from '../components/MatchDetailsModal';
import { usePageSeo } from '../hooks/usePageSeo';

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

  // URL state
  const rawDate = (searchParams.get('date') as MatchDateKey) || 'today';
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '12', 10);
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

  // Sync todayMatches from AppContext
  useEffect(() => {
    setDateMatchesMap(prev => ({ ...prev, today: todayMatches }));
  }, [todayMatches]);

  useEffect(() => {
    if (rawCategory !== category) setCategory(rawCategory);
  }, [rawCategory, category]);

  useEffect(() => {
    if (rawSearch !== searchQuery) setSearchQuery(rawSearch);
  }, [rawSearch, searchQuery]);

  // Fetch matches for yesterday or tomorrow when selected
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
  const pageSize = [6, 12, 24, 36].includes(rawPageSize) ? rawPageSize : 12;

  // Filter matches across all networks
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

  // Counts for filter chips
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
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* Header, Date Switcher & Search */}
      <div className="bg-[#101218] border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>جدول المباريات والنتائج المباشرة</span>
              <span className="text-xs font-mono-num font-bold text-stone-400 bg-stone-900 border border-stone-800 px-2.5 py-0.5 rounded-lg">
                {filteredMatches.length} مباراة
              </span>
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              اضغط على أي مباراة لعرض التشكيلة الرسمية، الأهداف، الإحصائيات، والقنوات الناقلة
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/leagues')}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              <span>ترتيب الدوريات</span>
            </button>

            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="ابحث عن فريق أو بطولة..."
                className="w-full bg-[#090b0f] border border-stone-800 rounded-xl pr-9 pl-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-purple-500 transition"
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
              className="p-2 rounded-xl bg-[#090b0f] border border-stone-800 text-stone-400 hover:text-stone-200 transition shrink-0 cursor-pointer"
              title="تحديث النتائج"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCurrentList ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Tabs: Yesterday / Today / Tomorrow */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {([
            { id: 'yesterday', label: 'مباريات الأمس', sub: 'النتائج الكاملة' },
            { id: 'today', label: 'مباريات اليوم', sub: 'مباشر ومواعيد اليوم' },
            { id: 'tomorrow', label: 'مباريات الغد', sub: 'المواجهات القادمة' }
          ] as const).map(tab => {
            const active = selectedDate === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleDateChange(tab.id)}
                className={`py-2.5 px-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  active
                    ? 'bg-emerald-500 text-stone-950 border-emerald-400 font-extrabold shadow-md'
                    : 'bg-[#090b0f] border-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                <span className="text-xs sm:text-sm font-black">{tab.label}</span>
                <span className={`text-[10px] ${active ? 'text-stone-900 font-bold' : 'text-stone-500'}`}>
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs pt-2 border-t border-stone-800/60">
          {[
            { id: 'all', label: 'جميع المباريات', count: counts.all },
            { id: 'live', label: 'مباشر الآن', count: counts.live, isLive: true },
            { id: 'playable', label: 'منقولة ببث مباشر', count: counts.playable },
            { id: 'bein', label: 'قنوات beIN Sports', count: counts.bein },
            { id: 'euro', label: 'قنوات أوروبية وعالمية', count: counts.euro },
            ...(counts.reminders > 0
              ? [{ id: 'reminders', label: 'مبارياتي المهمة 🔔', count: counts.reminders }]
              : [])
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategoryChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 font-medium cursor-pointer ${
                category === tab.id
                  ? 'bg-stone-100 text-stone-950 border-stone-100 font-bold shadow-sm'
                  : 'bg-[#090b0f] text-stone-400 hover:text-stone-200 border-stone-800 hover:border-stone-700'
              }`}
            >
              {tab.isLive && counts.live > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono-num opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Matches Grid */}
      {isLoadingCurrentList ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">جاري تحميل جدول المباريات والنتائج...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-stone-800 rounded-2xl p-8 space-y-3 bg-[#101218]">
          <AlertCircle className="w-8 h-8 text-stone-500 mx-auto" />
          <div className="text-sm font-semibold text-stone-200">لا توجد مباريات مطابقة</div>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            جرب تغيير التاريخ (الأمس / اليوم / الغد) أو عرض جميع البطولات.
          </p>
          <button
            type="button"
            onClick={() => {
              handleSearchChange('');
              handleCategoryChange('all');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-stone-950 font-extrabold text-xs transition cursor-pointer"
          >
            عرض كافة المباريات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {paginatedMatches.map(match => {
            const isLive = match.status === 'LIVE';
            const hasScore = match.scoreA !== null && match.scoreB !== null;
            const hasReminder = isMatchReminderSet(match.id);

            return (
              <div
                key={match.id}
                onClick={() => setSelectedMatchForDetails(match)}
                className={`bg-[#101218] border rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all shadow-sm cursor-pointer ${
                  isLive
                    ? 'border-emerald-500/40 hover:border-emerald-500/80'
                    : 'border-stone-800/90 hover:border-stone-600'
                }`}
              >
                {/* Tournament, Status & Reminder Button */}
                <div className="flex items-center justify-between gap-2 border-b border-stone-800/60 pb-2.5">
                  <span className="text-xs font-bold text-stone-300 truncate">
                    {match.competition}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLive ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono-num font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>{match.minute || 'مباشر'}</span>
                      </span>
                    ) : match.status === 'RESULT' ? (
                      <span className="text-[10px] text-stone-300 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md font-bold">
                        انتهت
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono-num text-stone-300 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">
                        {match.time}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleMatchReminder(match.id);
                      }}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        hasReminder
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
                      }`}
                      title={hasReminder ? 'إلغاء تذكير المباراة' : 'حفظ وتذكير بالمباراة'}
                    >
                      <Bell className={`w-3.5 h-3.5 ${hasReminder ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Teams & Score Display */}
                <div className="flex items-center justify-between gap-4 py-1.5">
                  {/* Team A */}
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    {match.teamA.logo ? (
                      <img
                        src={match.teamA.logo}
                        alt={match.teamA.name}
                        className="w-8 h-8 object-contain shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-xs font-extrabold text-purple-300 shrink-0">
                        {match.teamA.name.slice(0, 2)}
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                      {match.teamA.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="px-3.5 py-1.5 bg-[#090b0f] border border-stone-800 rounded-xl text-xs sm:text-base font-mono-num font-black text-stone-100 shrink-0 text-center min-w-[64px]">
                    {hasScore ? (
                      <span className={isLive ? 'text-emerald-400' : 'text-white'}>
                        {match.scoreA} - {match.scoreB}
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 font-bold">ضد</span>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0 text-left">
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate text-left">
                      {match.teamB.name}
                    </span>
                    {match.teamB.logo ? (
                      <img
                        src={match.teamB.logo}
                        alt={match.teamB.name}
                        className="w-8 h-8 object-contain shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-xs font-extrabold text-purple-300 shrink-0">
                        {match.teamB.name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info: Match Details Trigger & Broadcaster Channels */}
                <div className="pt-2.5 border-t border-stone-800/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedMatchForDetails(match);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                    <span>التشكيلة والإحصائيات</span>
                  </button>

                  {match.channels && match.channels.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {match.channels.slice(0, 2).map((ch, idx) => (
                        <button
                          key={ch.channel_id}
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleTuneIn(ch.channel_id, ch.channel_name);
                          }}
                          className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 shrink-0 cursor-pointer ${
                            idx === 0
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                          }`}
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{ch.channel_name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-stone-500">
                      {match.broadcasterLabel || 'غير منقولة تلفزيونياً'}
                    </span>
                  )}
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
        pageSizeOptions={[6, 12, 24, 36]}
        itemLabel="مباراة"
      />

      {/* Match Details Modal (Lineups, Events, Stats & H2H) */}
      <MatchDetailsModal
        match={selectedMatchForDetails}
        onClose={() => setSelectedMatchForDetails(null)}
        onTuneIn={handleTuneIn}
      />
    </div>
  );
};
