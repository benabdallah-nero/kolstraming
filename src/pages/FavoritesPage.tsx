import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Tv, ChevronLeft, Play, Grid, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Pagination } from '../components/Pagination';

export const FavoritesPage: React.FC = () => {
  const {
    channels,
    favorites,
    toggleFavorite,
    setActiveStreamingChannel,
    setMultiViewIds,
    getChannelBroadcast
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL pagination state
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '24', 10);

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = [12, 24, 36, 48].includes(rawPageSize) ? rawPageSize : 24;

  // Filter channels strictly by user's favorites from localStorage
  const favoriteChannels = useMemo(() => {
    return channels.filter(c => favorites.includes(c.id));
  }, [channels, favorites]);

  const totalPages = Math.ceil(favoriteChannels.length / pageSize) || 1;

  // Paginated slice
  const paginatedChannels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return favoriteChannels.slice(start, start + pageSize);
  }, [favoriteChannels, currentPage, pageSize]);

  const handleTuneIn = (channelId: number) => {
    const ch = channels.find(c => c.id === channelId);
    if (ch) {
      setActiveStreamingChannel(ch);
    }
    navigate(`/watchroom/${channelId}`);
  };

  // Launch up to 4 favorite channels simultaneously in Multi-View
  const handleLaunchFavoritesMultiView = () => {
    const top4 = favoriteChannels.slice(0, 4).map(c => c.id);
    if (top4.length > 0) {
      setMultiViewIds(top4);
      navigate(`/watchroom/${top4[0]}?multiview=1`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>قنواتي المفضلة</span>
            <span className="text-xs font-mono-num font-normal text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">
              {favorites.length} قنوات
            </span>
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            قنواتك الرياضية المختارة للوصول السريع أو التشغيل الجماعي في شاشة متعددة
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {favorites.length >= 2 && (
              <button
                type="button"
                onClick={handleLaunchFavoritesMultiView}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>تشغيل المفضلة في شاشة متعددة ({Math.min(4, favorites.length)})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/home')}
              className="text-xs text-stone-300 hover:text-white flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <span>استعراض باقي القنوات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Empty State when zero favorites */}
      {favorites.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-stone-800 rounded-3xl p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Star className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-stone-100">قائمتك المفضلة فارغة حالياً</h2>
            <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
              لم تقم بتفضيل أي قناة حتى الآن. يمكنك الضغط على أيقونة النجمة بجوار أي قناة في دليل القنوات لإضافتها هنا والوصول إليها فوراً.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95"
          >
            <Tv className="w-4 h-4" />
            <span>الانتقال إلى دليل القنوات</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {paginatedChannels.map(channel => {
              const broadcast = getChannelBroadcast(channel.id);
              return (
                <div
                  key={channel.id}
                  onClick={() => handleTuneIn(channel.id)}
                  className="group relative bg-[#121316]/90 hover:bg-[#16181d] border border-stone-800/60 hover:border-amber-500/50 rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-num text-[11px] text-stone-400 bg-stone-900 border border-stone-800/80 px-2 py-0.5 rounded-md">
                        #{channel.id}
                      </span>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite(channel.id);
                        }}
                        className="p-1.5 rounded-lg text-amber-400 hover:text-stone-400 hover:bg-stone-850 transition"
                        title="إزالة من المفضلة"
                        aria-label="إزالة من المفضلة"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <h3 className="text-xs font-bold text-stone-100 group-hover:text-emerald-400 transition mt-2 truncate">
                      {channel.arabicName || channel.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-1 font-mono-num">
                      <span>{channel.quality || '1080p FHD'}</span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className="font-sans">{channel.lang || 'عربي'}</span>
                    </div>

                    {broadcast && (
                      <div className="mt-2 p-2 rounded-lg bg-stone-900/90 border border-stone-800/70 text-[11px] text-stone-300 flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{broadcast.programTitle}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-850/60 flex items-center justify-between text-[11px] text-stone-400 group-hover:text-emerald-400 transition">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current text-emerald-400" />
                      <span>تشغيل البث</span>
                    </span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Bar */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={favoriteChannels.length}
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
            itemLabel="قناة مفضلة"
          />
        </div>
      )}
    </div>
  );
};
