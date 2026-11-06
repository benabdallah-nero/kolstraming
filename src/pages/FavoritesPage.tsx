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
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h1 className="font-display-ar text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
              قنواتي المفضلة
            </h1>
            <span className="font-display-num text-xs font-bold text-[var(--accent-primary)] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] px-2 py-0.5 rounded-[2px]">
              {favorites.length} CHANNELS
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            قنواتك الرياضية المختارة للوصول الفوري أو المشاهدة في وضع الشاشة المتعددة
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {favorites.length >= 2 && (
              <button
                type="button"
                onClick={handleLaunchFavoritesMultiView}
                className="px-3.5 py-2 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>تشغيل المفضلة في شاشة متعددة ({Math.min(4, favorites.length)})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/home')}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] px-3 py-2 rounded-[2px] transition cursor-pointer"
            >
              <span>دليل القنوات الكامل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Empty State when zero favorites */}
      {favorites.length === 0 ? (
        <div className="py-20 text-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-[2px] p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-[2px] bg-[var(--bg-canvas)] border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
            <Star className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
              قائمتك المفضلة فارغة حالياً
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              لم تقم بإضافة أي قناة إلى المفضلة. اضغط على أيقونة النجمة بجانب أي قناة في الدليل لإضافتها والوصول إليها بسرعة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="px-5 py-2.5 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold text-xs inline-flex items-center gap-2 transition cursor-pointer"
          >
            <Tv className="w-4 h-4" />
            <span>الانتقال إلى دليل القنوات</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-t border-r border-[var(--border-hairline)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedChannels.map(channel => {
              const broadcast = getChannelBroadcast(channel.id);
              return (
                <div
                  key={channel.id}
                  onClick={() => handleTuneIn(channel.id)}
                  className="group bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] border-b border-l border-[var(--border-hairline)] p-3.5 flex flex-col justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display-num text-xs font-extrabold text-[var(--accent-primary)] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] px-2 py-0.5 rounded-[2px]">
                        CH {String(channel.id).padStart(2, '0')}
                      </span>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite(channel.id);
                        }}
                        className="p-1 rounded-[2px] text-amber-400 hover:text-[var(--text-muted)] hover:bg-[var(--bg-canvas)] transition cursor-pointer"
                        title="إزالة من المفضلة"
                        aria-label="إزالة من المفضلة"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h3 className="font-display-ar text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mt-2.5 truncate">
                      {channel.arabicName || channel.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1 font-display-num">
                      <span>{channel.quality || '1080p FHD'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans text-[11px]">{channel.lang || 'عربي'}</span>
                    </div>

                    {broadcast && (
                      <div className="mt-2.5 p-2 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] flex items-center gap-1.5 truncate">
                        <Radio className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                        <span className="truncate">{broadcast.programTitle}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Play className="w-3.5 h-3.5 fill-current text-[var(--accent-primary)]" />
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
