import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import {
  RotateCw,
  Maximize,
  Star,
  Share2,
  Tv,
  Globe,
  AlertCircle,
  Calendar,
  Layers,
  Search,
  Check,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Channel } from '../types';
import { Pagination } from '../components/Pagination';

export const WatchRoomPage: React.FC = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const navigate = useNavigate();
  const { channels, loadingChannels, matches, isFavorite, toggleFavorite, setActiveStreamingChannel } = useApp();

  // Find target channel by channelId or fallback to premier/first channel (e.g. 91)
  const currentChannel = useMemo<Channel | null>(() => {
    if (channels.length === 0) return null;
    if (channelId) {
      const found = channels.find(c => String(c.id) === String(channelId));
      if (found) return found;
    }
    // Default to beIN 1 (id 91) if available, or first channel
    return channels.find(c => c.id === 91) || channels[0];
  }, [channels, channelId]);

  // Player state
  const [playerMode, setPlayerMode] = useState<'clean-embed' | 'native'>('clean-embed');
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // In-room active tab: 'switcher' (channel browser) vs 'schedule' (today's live fixtures)
  const [activeRoomTab, setActiveRoomTab] = useState<'switcher' | 'schedule'>('switcher');

  // In-room channel switcher search & pagination
  const [switcherSearch, setSwitcherSearch] = useState<string>('');
  const [switcherPage, setSwitcherPage] = useState<number>(1);
  const switcherPageSize = 12;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync active streaming channel to global context
  useEffect(() => {
    if (currentChannel) {
      setActiveStreamingChannel(currentChannel);
    }
  }, [currentChannel, setActiveStreamingChannel]);

  // Check if there is an active match on this specific channel
  const currentMatch = useMemo(() => {
    if (!currentChannel) return null;
    return matches.find(m =>
      m.channels && m.channels.some(c => c.channel_id === currentChannel.id)
    );
  }, [matches, currentChannel]);

  const handleReload = () => {
    setPlayerStatus('loading');
    setErrorMessage(null);
    setRetryKey(prev => prev + 1);
  };

  const handleToggleFullscreen = () => {
    const el = containerRef.current;
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        } else if ((el as any).webkitRequestFullscreen) {
          (el as any).webkitRequestFullscreen();
        }
      }
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Native HLS Video engine
  useEffect(() => {
    if (playerMode !== 'native' || !currentChannel) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    setPlayerStatus('loading');
    setErrorMessage(null);
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = `/api/proxy-stream/${currentChannel.id}/live.m3u8?r=${retryKey}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.5,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        enableSoftwareAES: true
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setPlayerStatus('playing')).catch(() => setPlayerStatus('playing'));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setPlayerMode('clean-embed');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setPlayerMode('clean-embed');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => setPlayerStatus('playing')).catch(() => setPlayerStatus('playing'));
      });
      video.addEventListener('error', () => {
        setPlayerMode('clean-embed');
      });
    } else {
      setPlayerMode('clean-embed');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel?.id, retryKey, playerMode]);

  // In-room channel switcher filtering
  const filteredSwitcherChannels = useMemo(() => {
    if (!switcherSearch.trim()) return channels;
    const q = switcherSearch.toLowerCase().trim();
    return channels.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.arabicName && c.arabicName.toLowerCase().includes(q)) ||
      String(c.id).includes(q)
    );
  }, [channels, switcherSearch]);

  const switcherTotalPages = Math.ceil(filteredSwitcherChannels.length / switcherPageSize) || 1;
  const paginatedSwitcherChannels = useMemo(() => {
    const start = (switcherPage - 1) * switcherPageSize;
    return filteredSwitcherChannels.slice(start, start + switcherPageSize);
  }, [filteredSwitcherChannels, switcherPage, switcherPageSize]);

  if (loadingChannels && !currentChannel) {
    return (
      <div className="py-24 text-center space-y-3" dir="rtl">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="text-xs text-stone-400">جاري الدخول إلى غرفة المشاهدة...</div>
      </div>
    );
  }

  if (!currentChannel) {
    return (
      <div className="py-24 text-center border border-dashed border-stone-800 rounded-2xl p-8 space-y-3" dir="rtl">
        <AlertCircle className="w-8 h-8 text-stone-500 mx-auto" />
        <div className="text-sm font-semibold text-stone-200">القناة المطلوبة غير متوفرة</div>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 hover:text-white transition"
        >
          العودة إلى دليل القنوات
        </button>
      </div>
    );
  }

  const cleanEmbedSrc = `/api/clean-embed/player/${currentChannel.id}?r=${retryKey}`;

  return (
    <div className="space-y-4 animate-in fade-in duration-200 max-w-5xl mx-auto" dir="rtl">
      {/* Theater Video Viewport Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-stone-800/80 shadow-2xl flex items-center justify-center"
      >
        {playerMode === 'clean-embed' ? (
          <iframe
            key={`embed-${currentChannel.id}-${retryKey}`}
            src={cleanEmbedSrc}
            className="w-full h-full border-0 bg-black"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
            title={currentChannel.name}
            onLoad={() => setPlayerStatus('playing')}
          />
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
            onPlaying={() => setPlayerStatus('playing')}
            onWaiting={() => setPlayerStatus('loading')}
          />
        )}

        {/* Live Match Scoreboard Overlay (When Match is broadcast on this channel) */}
        {currentMatch && (
          <div className="absolute top-3 right-3 left-3 sm:left-auto max-w-md z-20 pointer-events-none">
            <div className="bg-[#0b0c0e]/90 backdrop-blur-md border border-stone-700/60 rounded-xl p-2.5 shadow-xl flex items-center justify-between gap-3 pointer-events-auto">
              <div className="flex items-center gap-2 min-w-0">
                {currentMatch.status === 'LIVE' ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-stone-100 truncate">
                    {currentMatch.teamA.name} vs {currentMatch.teamB.name}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    {currentMatch.competition} · {currentMatch.statusText || currentMatch.minute || currentMatch.time}
                  </div>
                </div>
              </div>

              {currentMatch.scoreA !== null && currentMatch.scoreB !== null && (
                <div className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono-num font-extrabold text-xs text-emerald-400 shrink-0">
                  {currentMatch.scoreA} - {currentMatch.scoreB}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Native Loading State */}
        {playerMode === 'native' && playerStatus === 'loading' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-stone-400 gap-2 z-10 pointer-events-none">
            <RotateCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs text-stone-300 font-medium">جاري مزامنة البث المباشر...</span>
          </div>
        )}

        {/* Fullscreen Button Overlay */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="absolute bottom-3 left-3 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md text-stone-300 hover:text-white border border-stone-700/40 transition"
          title="ملء الشاشة"
          aria-label="ملء الشاشة"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Channel Header & Interactive Controls Bar */}
      <div className="bg-[#121316]/95 border border-stone-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-num text-xs font-bold text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">
              #{currentChannel.id}
            </span>
            <h1 className="text-base font-bold text-stone-100">
              {currentChannel.arabicName || currentChannel.name}
            </h1>
            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.2 rounded-full">
              بث مباشر
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400 mt-1 font-mono-num">
            <span>{currentChannel.quality || '1080p FHD'}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="font-sans">{currentChannel.lang || 'عربي'}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="font-sans text-emerald-400">بدون إعلانات</span>
          </div>
        </div>

        {/* Viewport Control Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Mode Switcher */}
          <button
            type="button"
            onClick={() => setPlayerMode(prev => prev === 'clean-embed' ? 'native' : 'clean-embed')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 hover:text-white transition"
            title="تبديل محرك المشغل"
          >
            {playerMode === 'clean-embed' ? (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>مشغل الويب</span>
              </>
            ) : (
              <>
                <Tv className="w-3.5 h-3.5 text-blue-400" />
                <span>مشغل HTML5</span>
              </>
            )}
          </button>

          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={() => toggleFavorite(currentChannel.id)}
            className={`p-2 rounded-xl border border-stone-800 transition ${
              isFavorite(currentChannel.id)
                ? 'bg-amber-950/30 border-amber-800/50 text-amber-400'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
            title="إضافة للمفضلة"
            aria-label="المفضلة"
          >
            <Star className={`w-4 h-4 ${isFavorite(currentChannel.id) ? 'fill-current' : ''}`} />
          </button>

          {/* Reload Stream */}
          <button
            type="button"
            onClick={handleReload}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition active:rotate-180 duration-300"
            title="إعادة تحميل البث"
            aria-label="إعادة تحميل البث"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Share/Copy Link */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 hover:text-white transition"
            title="نسخ رابط القناة"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم النسخ!' : 'مشاركة'}</span>
          </button>
        </div>
      </div>

      {/* In-Room Tabs: Channel Switcher & Live Schedule */}
      <div className="bg-[#121316]/95 border border-stone-800/80 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveRoomTab('switcher')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeRoomTab === 'switcher'
                  ? 'bg-stone-100 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>مبدل القنوات المباشر</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRoomTab('schedule')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeRoomTab === 'schedule'
                  ? 'bg-stone-100 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>جدول مباريات اليوم ({matches.length})</span>
            </button>
          </div>

          {activeRoomTab === 'switcher' && (
            <div className="relative w-44 sm:w-60">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={switcherSearch}
                onChange={e => {
                  setSwitcherSearch(e.target.value);
                  setSwitcherPage(1);
                }}
                placeholder="ابحث عن قناة للتبديل..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-600 transition"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Paginated In-Room Channel Switcher */}
        {activeRoomTab === 'switcher' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {paginatedSwitcherChannels.map(ch => {
                const isActive = ch.id === currentChannel.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      if (!isActive) {
                        navigate(`/watchroom/${ch.id}`);
                      }
                    }}
                    className={`p-2.5 rounded-xl text-right transition border flex flex-col justify-between h-20 ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-bold'
                        : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800/80 text-stone-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono-num text-[10px] opacity-70">#{ch.id}</span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      )}
                    </div>
                    <div className="text-xs truncate font-medium">
                      {ch.arabicName || ch.name}
                    </div>
                    <div className="text-[10px] opacity-50 font-mono-num">
                      {ch.quality || '1080p'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Switcher Pagination */}
            <Pagination
              currentPage={switcherPage}
              totalPages={switcherTotalPages}
              totalItems={filteredSwitcherChannels.length}
              pageSize={switcherPageSize}
              onPageChange={setSwitcherPage}
              syncWithUrl={false}
              itemLabel="قناة"
            />
          </div>
        )}

        {/* Tab 2: Live Schedule in Room */}
        {activeRoomTab === 'schedule' && (
          <div className="space-y-2">
            {matches.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                لا توجد مباريات مسجلة في جدول اليوم حالياً.
              </div>
            ) : (
              <div className="divide-y divide-stone-800/60">
                {matches.slice(0, 10).map(match => (
                  <div key={match.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400 font-medium">{match.competition}</span>
                        {match.status === 'LIVE' && (
                          <span className="text-[10px] font-mono-num text-rose-400 bg-rose-950/60 border border-rose-800/50 px-1.5 py-0.2 rounded font-bold">
                            {match.minute || 'مباشر'}
                          </span>
                        )}
                      </div>
                      <div className="text-stone-100 font-semibold truncate">
                        {match.teamA.name} {match.scoreA !== null ? `${match.scoreA} - ${match.scoreB}` : 'vs'} {match.teamB.name}
                      </div>
                    </div>

                    {match.channels && match.channels.length > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate(`/watchroom/${match.channels[0].channel_id}`)}
                        className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 hover:text-emerald-400 transition shrink-0 flex items-center gap-1"
                      >
                        <span>انتقل إلى {match.channels[0].channel_name}</span>
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
