import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Star, Play, Sparkles, Filter, ChevronLeft, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Channel } from '../types';
import { Pagination } from '../components/Pagination';

export const HomePage: React.FC = () => {
  const { channels, loadingChannels, matches, favorites, toggleFavorite, isFavorite, setActiveStreamingChannel } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL sync state
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '24', 10);
  const rawCategory = searchParams.get('category') || 'all';
  const rawSearch = searchParams.get('q') || '';

  const [category, setCategory] = useState<string>(rawCategory);
  const [searchQuery, setSearchQuery] = useState<string>(rawSearch);

  // Sync category & search with searchParams
  useEffect(() => {
    if (rawCategory !== category) setCategory(rawCategory);
  }, [rawCategory]);

  useEffect(() => {
    if (rawSearch !== searchQuery) setSearchQuery(rawSearch);
  }, [rawSearch]);

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = [12, 24, 36, 48].includes(rawPageSize) ? rawPageSize : 24;

  // Filter channels
  const filteredChannels = useMemo(() => {
    let list = channels;

    // Category filter
    if (category === 'bein') {
      list = list.filter(c => c.category === 'bein' || c.subcat?.startsWith('bein') || c.name.toLowerCase().includes('bein'));
    } else if (category === 'ssc') {
      list = list.filter(c => c.subcat === 'ssc' || c.name.toLowerCase().includes('ssc'));
    } else if (category === 'alkass') {
      list = list.filter(c => c.subcat === 'alkass' || c.name.toLowerCase().includes('alkass') || c.name.includes('الكأس'));
    } else if (category === 'euro') {
      list = list.filter(c => c.category === 'euro' || c.subcat?.includes('euro') || c.name.toLowerCase().includes('euro') || c.name.toLowerCase().includes('arena'));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.arabicName && c.arabicName.toLowerCase().includes(q)) ||
        String(c.id).includes(q)
      );
    }

    return list;
  }, [channels, category, searchQuery]);

  // Total pages
  const totalPages = Math.ceil(filteredChannels.length / pageSize) || 1;

  // Paginated slice
  const paginatedChannels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredChannels.slice(start, start + pageSize);
  }, [filteredChannels, currentPage, pageSize]);

  // Top Marquee Match from real API
  const topMatch = useMemo(() => {
    if (matches.length === 0) return null;
    // Prefer LIVE match, otherwise first premier match
    const live = matches.find(m => m.status === 'LIVE' && m.channels && m.channels.length > 0);
    if (live) return live;
    return matches.find(m => m.channels && m.channels.length > 0) || matches[0];
  }, [matches]);

  // Handle Search Input Change (Reset Page to 1)
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

  // Handle Category Filter Change (Reset Page to 1)
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

  // Tune into Channel
  const handleTuneIn = (channel: Channel) => {
    setActiveStreamingChannel(channel);
    navigate(`/watchroom/${channel.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* Top Match Dynamic Hero Banner */}
      {topMatch && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14161b] via-[#0f1115] to-[#0a0b0d] border border-stone-800/80 p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>قمة اليوم المباشرة</span>
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {topMatch.competition}
                </span>
                {topMatch.status === 'LIVE' && (
                  <span className="flex items-center gap-1 text-[11px] font-mono-num font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>{topMatch.minute || 'مباشر الآن'}</span>
                  </span>
                )}
              </div>

              {/* Match Teams & Score */}
              <div className="flex items-center gap-3 sm:gap-6 pt-1">
                <div className="flex items-center gap-2">
                  {topMatch.teamA.logo && (
                    <img
                      src={topMatch.teamA.logo}
                      alt={topMatch.teamA.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                      loading="lazy"
                    />
                  )}
                  <span className="text-sm sm:text-base font-bold text-stone-100">
                    {topMatch.teamA.name}
                  </span>
                </div>

                <div className="px-3 py-1 bg-stone-900 border border-stone-800 rounded-lg text-sm sm:text-base font-mono-num font-extrabold text-stone-200">
                  {topMatch.scoreA !== null && topMatch.scoreB !== null ? (
                    `${topMatch.scoreA} - ${topMatch.scoreB}`
                  ) : (
                    <span className="text-xs text-stone-400 font-normal">{topMatch.time}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {topMatch.teamB.logo && (
                    <img
                      src={topMatch.teamB.logo}
                      alt={topMatch.teamB.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                      loading="lazy"
                    />
                  )}
                  <span className="text-sm sm:text-base font-bold text-stone-100">
                    {topMatch.teamB.name}
                  </span>
                </div>
              </div>

              {topMatch.commentator && (
                <div className="text-xs text-stone-400 pt-0.5">
                  معلق المباراة: <span className="text-stone-300 font-medium">{topMatch.commentator}</span>
                </div>
              )}
            </div>

            {/* Tune In Action */}
            {topMatch.channels && topMatch.channels.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const chId = topMatch.channels[0].channel_id;
                    const chFound = channels.find(c => c.id === chId) || {
                      id: chId,
                      name: topMatch.channels[0].channel_name,
                      category: 'bein',
                      quality: '1080p FHD',
                      lang: 'عربي',
                      country: 'QA'
                    };
                    handleTuneIn(chFound);
                  }}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>شاهد البث على {topMatch.channels[0].channel_name}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Directory Header with Filter Chips & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>دليل القنوات الرياضية</span>
              <span className="text-xs font-mono-num font-normal text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">
                {filteredChannels.length} قناة
              </span>
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              بث مباشر بجودة فائقة بدون إعلانات أو نوافذ منبثقة
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="ابحث عن قناة أو رقم..."
              className="w-full bg-[#121316] border border-stone-800/80 rounded-xl pr-9 pl-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-600 transition"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'جميع القنوات' },
            { id: 'bein', label: 'بي إن سبورتس (beIN)' },
            { id: 'ssc', label: 'إس إس سي (SSC السعودية)' },
            { id: 'alkass', label: 'قنوات الكأس (Alkass)' },
            { id: 'euro', label: 'القنوات الأوروبية (Euro)' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border shrink-0 font-medium ${
                category === cat.id
                  ? 'bg-stone-100 text-stone-950 border-stone-100 font-bold shadow-sm'
                  : 'bg-[#121316] text-stone-400 hover:text-stone-200 border-stone-800/80 hover:border-stone-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Channels Paginated Grid */}
      {loadingChannels ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">جاري تحميل دليل القنوات...</span>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-stone-800 rounded-2xl p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-stone-500 mx-auto" />
          <div className="text-sm font-medium text-stone-300">لا توجد قنوات تطابق بحثك</div>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            جرب البحث باسم آخر أو إزالة التصفية لعرض كافة القنوات المتاحة.
          </p>
          <button
            type="button"
            onClick={() => {
              handleSearchChange('');
              handleCategoryChange('all');
            }}
            className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 hover:text-white transition"
          >
            عرض جميع القنوات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {paginatedChannels.map(channel => {
            const fav = isFavorite(channel.id);
            return (
              <div
                key={channel.id}
                onClick={() => handleTuneIn(channel)}
                className="group relative bg-[#121316]/90 hover:bg-[#16181d] border border-stone-800/60 hover:border-stone-700 rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num text-[11px] text-stone-400 bg-stone-900 border border-stone-800/80 px-2 py-0.5 rounded-md">
                      #{channel.id}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(channel.id);
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        fav
                          ? 'text-amber-400'
                          : 'text-stone-500 hover:text-stone-300 hover:bg-stone-850'
                      }`}
                      title={fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                      aria-label="المفضلة"
                    >
                      <Star className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-xs font-semibold text-stone-100 group-hover:text-emerald-400 transition mt-2 truncate">
                    {channel.arabicName || channel.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-1 font-mono-num">
                    <span>{channel.quality || '1080p FHD'}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span className="font-sans">{channel.lang || 'عربي'}</span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-850/60 flex items-center justify-between text-[11px] text-stone-400 group-hover:text-emerald-400 transition">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>مشاهدة البث</span>
                  </span>
                  <ChevronLeft className="w-3.5 h-3.5" />
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
