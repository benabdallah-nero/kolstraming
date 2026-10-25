import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Play,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Pagination } from '../components/Pagination';
import { usePageSeo } from '../hooks/usePageSeo';

export const SchedulePage: React.FC = () => {
  usePageSeo({
    title: 'جدول مباريات اليوم والقنوات الناقلة (beIN والأوروبية) – kolstream',
    description: 'جدول مواعيد مباريات اليوم المباشرة في كافة البطولات العالمية مع القنوات الناقلة على beIN Sports والقنوات الأوروبية والعالمية على kolstream.',
    canonicalPath: '/schedule'
  });
  const { matches, loadingMatches, refreshMatches, setActiveStreamingChannel, channels } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL state
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '12', 10);
  const rawCategory = searchParams.get('category') || 'all';
  const rawSearch = searchParams.get('q') || '';

  const [category, setCategory] = useState<string>(rawCategory);
  const [searchQuery, setSearchQuery] = useState<string>(rawSearch);

  useEffect(() => {
    if (rawCategory !== category) setCategory(rawCategory);
  }, [rawCategory, category]);

  useEffect(() => {
    if (rawSearch !== searchQuery) setSearchQuery(rawSearch);
  }, [rawSearch, searchQuery]);

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = [6, 12, 24, 36].includes(rawPageSize) ? rawPageSize : 12;

  // Filter matches across all networks (beIN + European/Global + All Playable)
  const filteredMatches = useMemo(() => {
    let list = matches;

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

    // Search query
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
  }, [matches, category, searchQuery]);

  const totalPages = Math.ceil(filteredMatches.length / pageSize) || 1;

  // Paginated slice
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMatches.slice(start, start + pageSize);
  }, [filteredMatches, currentPage, pageSize]);

  // Counts for filter chips
  const counts = useMemo(() => {
    const live = matches.filter(m => m.status === 'LIVE').length;
    const playable = matches.filter(m => m.channels && m.channels.length > 0).length;
    const bein = matches.filter(
      m =>
        m.isBeinArabic ||
        m.network === 'bein_ar' ||
        (m.channels && m.channels.some(c => c.channel_name.toLowerCase().includes('bein')))
    ).length;
    const euro = matches.filter(
      m => m.channels && m.channels.length > 0 && m.channels.some(c => !c.isBeinArabic)
    ).length;
    return { all: matches.length, live, playable, bein, euro };
  }, [matches]);

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
      {/* Header & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>جدول مباريات اليوم والقنوات الناقلة</span>
              <span className="text-xs font-mono-num font-normal text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">
                {filteredMatches.length} مباراة
              </span>
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              تغطية شاملة لمباريات اليوم مع ربط مباشر بقنوات beIN Sports والقنوات الأوروبية والعالمية الناقلة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="ابحث عن فريق، بطولة، أو قناة ناقلة..."
                className="w-full bg-[#121316] border border-stone-800/80 rounded-xl pr-9 pl-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-600 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => refreshMatches()}
              disabled={loadingMatches}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition shrink-0"
              title="تحديث المباريات"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMatches ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'جميع المباريات', count: counts.all },
            { id: 'live', label: 'مباشر الآن', count: counts.live, isLive: true },
            { id: 'playable', label: 'منقولة ببث مباشر', count: counts.playable },
            { id: 'bein', label: 'قنوات beIN Sports', count: counts.bein },
            { id: 'euro', label: 'قنوات أوروبية وعالمية', count: counts.euro }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategoryChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 font-medium ${
                category === tab.id
                  ? 'bg-stone-100 text-stone-950 border-stone-100 font-bold shadow-sm'
                  : 'bg-[#121316] text-stone-400 hover:text-stone-200 border-stone-800/80 hover:border-stone-700'
              }`}
            >
              {tab.isLive && counts.live > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              )}
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono-num opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Matches List */}
      {loadingMatches && matches.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">جاري تحميل جدول المباريات المباشرة...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-stone-800 rounded-2xl p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-stone-500 mx-auto" />
          <div className="text-sm font-semibold text-stone-200">لا توجد مباريات مطابقة</div>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            لا توجد مباريات تطابق الفلتر أو كلمة البحث المحددة حالياً.
          </p>
          <button
            type="button"
            onClick={() => {
              handleSearchChange('');
              handleCategoryChange('all');
            }}
            className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 hover:text-white transition"
          >
            عرض كافة المباريات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paginatedMatches.map(match => {
            const isLive = match.status === 'LIVE';
            const hasScore = match.scoreA !== null && match.scoreB !== null;

            return (
              <div
                key={match.id}
                className="bg-[#121316]/90 border border-stone-800/80 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-stone-700/80 transition-all shadow-sm"
              >
                {/* Tournament & Status */}
                <div className="flex items-center justify-between gap-2 border-b border-stone-800/60 pb-2.5">
                  <span className="text-xs font-semibold text-stone-300 truncate">
                    {match.competition}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLive ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono-num font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span>{match.minute || 'مباشر'}</span>
                      </span>
                    ) : match.status === 'RESULT' ? (
                      <span className="text-[10px] text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-full">
                        انتهت
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono-num text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-full">
                        {match.time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Teams & Score Display */}
                <div className="flex items-center justify-between gap-4 py-1">
                  {/* Team A */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    {match.teamA.logo ? (
                      <img
                        src={match.teamA.logo}
                        alt={match.teamA.name}
                        className="w-7 h-7 object-contain shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-stone-850 flex items-center justify-center text-xs font-bold text-stone-400 shrink-0">
                        {match.teamA.name.slice(0, 1)}
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-bold text-stone-100 truncate">
                      {match.teamA.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="px-3 py-1 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm font-mono-num font-extrabold text-stone-200 shrink-0 text-center min-w-[50px]">
                    {hasScore ? (
                      <span className={isLive ? 'text-emerald-400' : 'text-stone-200'}>
                        {match.scoreA} - {match.scoreB}
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-500 font-normal">vs</span>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="flex-1 flex items-center justify-end gap-2 min-w-0 text-left">
                    <span className="text-xs sm:text-sm font-bold text-stone-100 truncate text-left">
                      {match.teamB.name}
                    </span>
                    {match.teamB.logo ? (
                      <img
                        src={match.teamB.logo}
                        alt={match.teamB.name}
                        className="w-7 h-7 object-contain shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-stone-850 flex items-center justify-center text-xs font-bold text-stone-400 shrink-0">
                        {match.teamB.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info: Broadcaster & Multi-Channel Tune-in Buttons */}
                <div className="pt-2.5 border-t border-stone-800/60 flex flex-col gap-2 text-xs">
                  {match.channels && match.channels.length > 0 ? (
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] text-stone-400">
                        القنوات المتاحة للبث ({match.channels.length}):
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {match.channels.slice(0, 4).map((ch, idx) => (
                          <button
                            key={ch.channel_id}
                            type="button"
                            onClick={() => handleTuneIn(ch.channel_id, ch.channel_name)}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 shrink-0 ${
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
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>القناة: {match.broadcasterLabel || 'غير منقولة تلفزيونياً'}</span>
                      <span className="italic">بدون بث فضائي مباشر</span>
                    </div>
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
    </div>
  );
};
