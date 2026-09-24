import React, { useState, useMemo } from 'react';
import { Channel } from '../types';
import {
  Search,
  Play,
  Star,
  ArrowUpLeft,
  Tv
} from 'lucide-react';

interface ChannelsViewProps {
  channels: Channel[];
  currentChannelId: number;
  onSelectChannel: (channel: Channel) => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onNavigateToMatches?: () => void;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({
  channels,
  currentChannelId,
  onSelectChannel,
  favorites,
  onToggleFavorite,
  onNavigateToMatches
}) => {
  const [activeCategory, setActiveCategory] = useState<'bein_ar' | 'ssc' | 'alkass' | 'euro' | 'favorites' | 'all'>('bein_ar');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChannels = useMemo(() => {
    let list = channels;

    if (activeCategory === 'favorites') {
      list = list.filter(c => favorites.includes(c.id));
    } else if (activeCategory === 'bein_ar') {
      list = list.filter(c => c.subcat === 'bein_ar' || (c.name.toLowerCase().includes('bein') && c.lang === 'Arabic'));
    } else if (activeCategory === 'ssc') {
      list = list.filter(c => c.subcat === 'ssc' || c.name.toLowerCase().includes('ssc'));
    } else if (activeCategory === 'alkass') {
      list = list.filter(c => c.subcat === 'alkass' || c.name.toLowerCase().includes('alkass') || c.name.includes('الكأس'));
    } else if (activeCategory === 'euro') {
      list = list.filter(c => c.category === 'euro' || c.name.toLowerCase().includes('euro') || c.name.toLowerCase().includes('arena') || c.name.toLowerCase().includes('astro'));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.id.toString() === q ||
        (c.arabicName && c.arabicName.includes(q)) ||
        (c.lang && c.lang.toLowerCase().includes(q))
      );
    }

    return list;
  }, [channels, activeCategory, searchQuery, favorites]);

  return (
    <div className="flex flex-col gap-4 select-none" dir="rtl">
      {/* Quiet Editorial Match Prompt */}
      {onNavigateToMatches && (
        <button
          onClick={onNavigateToMatches}
          className="w-full text-right p-3.5 bg-[#121316] hover:bg-[#16181d] border border-stone-800/60 rounded-xl transition flex items-center justify-between group active:scale-[0.99]"
        >
          <div>
            <div className="text-xs text-stone-400">جدول اليوم المباشر</div>
            <div className="text-sm font-medium text-stone-100 mt-0.5">
              مباريات دوري الأمم الأوروبية وتصفيات أمم إفريقيا
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-stone-400 group-hover:text-stone-200 transition-colors">
            <span>استعراض</span>
            <ArrowUpLeft className="w-3.5 h-3.5" />
          </div>
        </button>
      )}

      {/* Minimalist Segmented Category Switcher */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setActiveCategory('bein_ar')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeCategory === 'bein_ar'
              ? 'bg-stone-100 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          beIN Sports العربية
        </button>

        <button
          onClick={() => setActiveCategory('ssc')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeCategory === 'ssc'
              ? 'bg-stone-100 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          قنوات SSC
        </button>

        <button
          onClick={() => setActiveCategory('alkass')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeCategory === 'alkass'
              ? 'bg-stone-100 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          قنوات الكأس
        </button>

        <button
          onClick={() => setActiveCategory('favorites')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeCategory === 'favorites'
              ? 'bg-stone-100 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          <span>المفضلة</span>
          {favorites.length > 0 && (
            <span className="font-mono-num text-[11px] opacity-70">({favorites.length})</span>
          )}
        </button>

        <button
          onClick={() => setActiveCategory('euro')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeCategory === 'euro'
              ? 'bg-stone-100 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          الأوروبية
        </button>

        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-stone-100 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          الكل ({channels.length})
        </button>
      </div>

      {/* Human-scale Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ابحث عن قناة أو رقم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-8 py-2 bg-[#121316] border border-stone-800/60 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-600 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white"
          >
            &times;
          </button>
        )}
      </div>

      {/* Responsive Minimalist Channel Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filteredChannels.length === 0 ? (
          <div className="py-12 text-center text-stone-500 text-xs">
            لا توجد قنوات تطابق البحث.
          </div>
        ) : (
          filteredChannels.map((ch) => {
            const isPlaying = ch.id === currentChannelId;
            const isFav = favorites.includes(ch.id);

            return (
              <div
                key={ch.id}
                onClick={() => onSelectChannel(ch)}
                className={`group px-3.5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                  isPlaying
                    ? 'bg-stone-900 border-stone-700'
                    : 'bg-[#121316] hover:bg-[#16181d] border-stone-800/40 hover:border-stone-700/60'
                }`}
              >
                {/* Number & Channel Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono-num text-xs text-stone-500 w-7 text-center shrink-0">
                    {ch.id < 10 ? `0${ch.id}` : ch.id}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-100 truncate">
                        {ch.arabicName || ch.name}
                      </span>
                      {isPlaying && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      )}
                    </div>

                    {/* Unboxed inline metadata */}
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5 font-mono-num">
                      <span>{ch.quality || '1080p'}</span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className="font-sans">{ch.lang || 'عربي'}</span>
                      {ch.arabicName && ch.name !== ch.arabicName && (
                        <>
                          <span aria-hidden="true" className="opacity-40">·</span>
                          <span className="truncate opacity-75">{ch.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tactile Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(ch.id);
                    }}
                    className={`p-2 rounded-lg transition ${
                      isFav
                        ? 'text-amber-400'
                        : 'text-stone-600 hover:text-stone-300'
                    }`}
                    title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 group-hover:text-stone-100 group-hover:bg-stone-800 transition">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
