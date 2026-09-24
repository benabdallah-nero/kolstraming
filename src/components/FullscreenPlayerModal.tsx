import React, { useState, useEffect, useRef } from 'react';
import { Channel } from '../types';
import {
  RotateCw,
  Maximize,
  Star,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import Hls from 'hls.js';

interface FullscreenPlayerModalProps {
  channel: Channel;
  allChannels: Channel[];
  onClose: () => void;
  onSelectChannel: (channel: Channel) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  activeMatch?: string;
}

export const FullscreenPlayerModal: React.FC<FullscreenPlayerModalProps> = ({
  channel,
  allChannels,
  onClose,
  onSelectChannel,
  isFavorite,
  onToggleFavorite,
  activeMatch
}) => {
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [hlsStatus, setHlsStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReload = () => {
    setHlsStatus('loading');
    setErrorMessage(null);
    setPlayerKey(prev => prev + 1);
  };

  const handleToggleFullscreen = () => {
    const video = videoRef.current;
    if (video) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        if (video.requestFullscreen) {
          video.requestFullscreen().catch(() => {});
        } else if ((video as any).webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
        }
      }
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Pure Direct HLS Stream - 100% Native Video, Zero Iframes, Zero External Ads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHlsStatus('loading');
    setErrorMessage(null);
    let isSubscribed = true;

    fetch(`/api/resolve-m3u8/${channel.id}`)
      .then(res => res.json())
      .then(data => {
        if (!isSubscribed) return;

        if (!data.success || !data.streamUrl) {
          throw new Error('رابط البث المباشر غير متوفر حالياً');
        }

        if (Hls.isSupported()) {
          if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
          }

          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 0,
            maxBufferLength: 15,
            maxMaxBufferLength: 30,
            maxBufferSize: 30 * 1000 * 1000,
            maxBufferHole: 0.2,
            highBufferWatchdogPeriod: 2,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 5,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 6,
            liveDurationInfinity: true,
            enableSoftwareAES: true,
            manifestLoadingMaxRetry: 5,
            levelLoadingMaxRetry: 5,
            fragLoadingMaxRetry: 8,
          });

          hls.loadSource(data.streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!isSubscribed) return;
            setHlsStatus('playing');
            video.play().catch(() => {});
          });

          hls.on(Hls.Events.ERROR, (event, errData) => {
            if (!isSubscribed) return;

            // Handle stalled buffer automatically without dropping to iframe
            if (errData.details === 'bufferStalledError' || errData.details === 'bufferSeekOverHole') {
              if (video.buffered.length > 0) {
                const liveEdge = video.buffered.end(video.buffered.length - 1);
                if (video.currentTime < liveEdge - 15) {
                  video.currentTime = liveEdge - 1.5;
                  video.play().catch(() => {});
                }
              }
            }

            if (errData.fatal) {
              switch (errData.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  // Never use iframe fallback - silently retry fetching stream token
                  if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                  retryTimeoutRef.current = setTimeout(() => {
                    if (isSubscribed) {
                      setPlayerKey(k => k + 1);
                    }
                  }, 3000);
                  break;
              }
            }
          });

          hlsInstanceRef.current = hls;

          // Regular token refresh every 40s to keep live stream active
          if (tokenRefreshTimerRef.current) {
            clearInterval(tokenRefreshTimerRef.current);
          }
          tokenRefreshTimerRef.current = setInterval(() => {
            fetch(`/api/resolve-m3u8/${channel.id}`)
              .then(r => r.json())
              .catch(() => {});
          }, 40000);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = data.streamUrl;
          video.addEventListener('loadedmetadata', () => {
            setHlsStatus('playing');
            video.play().catch(() => {});
          });
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        setHlsStatus('error');
        setErrorMessage(err.message || 'تعذر الاتصال بالبث المباشر');
      });

    return () => {
      isSubscribed = false;
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [channel.id, playerKey]);

  const relatedChannels = allChannels.filter(c => {
    if (channel.subcat && c.subcat === channel.subcat) return true;
    return c.category === channel.category;
  }).slice(0, 16);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#08090a] flex flex-col overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* Quiet Mobile Top Bar */}
      <div className="bg-[#0b0c0e]/95 backdrop-blur-md px-4 py-3 border-b border-stone-800/40 flex items-center justify-between gap-3 shrink-0 z-10 sticky top-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-100 transition active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="text-xs font-medium">الرجوع</span>
        </button>

        <div className="flex-1 text-center min-w-0 px-2">
          <div className="text-sm font-medium text-stone-100 truncate">
            {channel.arabicName || channel.name}
          </div>
          {activeMatch && (
            <div className="text-[11px] text-stone-400 truncate">
              {activeMatch}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggleFavorite(channel.id)}
            className={`p-1.5 rounded-lg transition ${
              isFavorite
                ? 'text-amber-400'
                : 'text-stone-500 hover:text-stone-300'
            }`}
            title="المفضلة"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleReload}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 transition"
            title="إعادة تشغيل البث"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pure Direct Video Viewport - Zero Iframes */}
      <div className="relative w-full bg-black flex items-center justify-center aspect-video sm:max-h-[65vh] shrink-0 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            playsInline
            controls
            autoPlay
            className="w-full h-full object-contain"
          />

          {hlsStatus === 'loading' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-stone-400 gap-2.5">
              <RotateCw className="w-6 h-6 text-stone-400 animate-spin" />
              <span className="text-xs text-stone-300 font-medium">جاري الاتصال بالبث المباشر...</span>
              <span className="text-[11px] text-stone-400 font-mono-num">1080p FHD</span>
            </div>
          )}

          {hlsStatus === 'error' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-stone-400 gap-3 p-6 text-center">
              <AlertCircle className="w-7 h-7 text-stone-500" />
              <div className="text-xs text-stone-300">
                {errorMessage || 'انقطع الاتصال بالبث المباشر'}
              </div>
              <button
                onClick={handleReload}
                className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleToggleFullscreen}
          className="absolute bottom-3 left-3 z-20 p-2 rounded-lg bg-black/60 backdrop-blur-md text-stone-300 hover:text-white transition"
          title="ملء الشاشة"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Minimalist Details & Channel Strip */}
      <div className="p-4 space-y-4 max-w-xl w-full mx-auto flex-1">
        {/* Unboxed Channel Meta */}
        <div className="flex items-center justify-between py-1 border-b border-stone-850">
          <div>
            <h1 className="text-base font-medium text-stone-100">
              {channel.arabicName || channel.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5 font-mono-num">
              <span>{channel.quality || '1080p FHD'}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="font-sans">{channel.lang || 'عربي'}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="text-emerald-500 font-sans">مباشر 60fps</span>
            </div>
          </div>
          <span className="font-mono-num text-xs text-stone-400 bg-stone-900 border border-stone-800 px-2 py-1 rounded-md">
            #{channel.id}
          </span>
        </div>

        {/* Minimal Channel Switcher Reel */}
        <div className="space-y-2">
          <div className="text-xs text-stone-400">تنقل بين القنوات</div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {relatedChannels.map((relCh) => {
              const isActive = relCh.id === channel.id;
              return (
                <button
                  key={relCh.id}
                  onClick={() => onSelectChannel(relCh)}
                  className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all border shrink-0 ${
                    isActive
                      ? 'bg-stone-100 text-stone-950 font-semibold border-stone-100'
                      : 'bg-[#121316] text-stone-300 hover:text-white border-stone-800/60 hover:border-stone-700'
                  }`}
                >
                  <span className="font-mono-num opacity-60 ml-1.5">#{relCh.id}</span>
                  <span>{relCh.arabicName || relCh.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
