import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Channel } from '../types';
import {
  RotateCw,
  Maximize,
  Star,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

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
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleReload = () => {
    setPlayerStatus('loading');
    setErrorMessage(null);
    setRetryCount(prev => prev + 1);
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Pure Native HTML5 Video Stream using Hls.js
  useEffect(() => {
    setPlayerStatus('loading');
    setErrorMessage(null);
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = `/api/proxy-stream/${channel.id}/live.m3u8?t=${Date.now()}`;

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
        video.play().then(() => {
          setPlayerStatus('playing');
        }).catch(() => {
          setPlayerStatus('playing');
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setPlayerStatus('error');
              setErrorMessage('تعذر تحميل البث المباشر. اضغط إعادة المحاولة.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari/iOS)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => setPlayerStatus('playing')).catch(() => setPlayerStatus('playing'));
      });
      video.addEventListener('error', () => {
        setPlayerStatus('error');
        setErrorMessage('تعذر تشغيل البث على هذا المتصفح.');
      });
    } else {
      setPlayerStatus('error');
      setErrorMessage('متصفحك لا يدعم تشغيل بث HLS المباشر.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.id, retryCount]);

  const relatedChannels = allChannels.filter(c => {
    if (channel.subcat && c.subcat === channel.subcat) return true;
    return c.category === channel.category;
  }).slice(0, 16);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#08090a] flex flex-col overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* Top Navigation Bar */}
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
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 transition active:rotate-180 duration-300"
            title="إعادة تحميل البث"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pure HTML5 Native Browser Video Player */}
      <div
        ref={containerRef}
        className="relative w-full bg-black flex items-center justify-center aspect-video sm:max-h-[70vh] shrink-0 overflow-hidden"
      >
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-contain bg-black"
          onPlaying={() => setPlayerStatus('playing')}
          onWaiting={() => setPlayerStatus('loading')}
        />

        {/* Loading Overlay */}
        {playerStatus === 'loading' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-stone-400 gap-2.5 pointer-events-none z-10">
            <RotateCw className="w-6 h-6 text-stone-400 animate-spin" />
            <span className="text-xs text-stone-300 font-medium">جاري الاتصال بالبث المباشر...</span>
            <span className="text-[11px] text-stone-500 font-mono-num">{channel.quality || '1080p FHD'}</span>
          </div>
        )}

        {/* Error Overlay */}
        {playerStatus === 'error' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-stone-400 gap-3 p-6 text-center z-10">
            <AlertCircle className="w-8 h-8 text-rose-500/80" />
            <div className="text-xs text-stone-300 max-w-sm">
              {errorMessage || 'انقطع الاتصال بالبث المباشر'}
            </div>
            <button
              onClick={handleReload}
              className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition flex items-center gap-1.5 active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={handleToggleFullscreen}
          className="absolute bottom-3 left-3 z-20 p-2 rounded-lg bg-black/60 backdrop-blur-md text-stone-300 hover:text-white transition"
          title="ملء الشاشة"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Channel Information & Quick Switching Reel */}
      <div className="p-4 space-y-4 max-w-xl w-full mx-auto flex-1">
        {/* Channel Details Header */}
        <div className="flex items-center justify-between py-2 border-b border-stone-850">
          <div>
            <h1 className="text-base font-medium text-stone-100 flex items-center gap-2">
              <span>{channel.arabicName || channel.name}</span>
            </h1>
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-1 font-mono-num">
              <span>{channel.quality || '1080p FHD'}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="font-sans">{channel.lang || 'عربي'}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="text-emerald-500 font-sans">بث مباشر 60fps</span>
            </div>
          </div>
          <span className="font-mono-num text-xs text-stone-400 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-md">
            #{channel.id}
          </span>
        </div>

        {/* Quick Channel Switcher Reel */}
        <div className="space-y-2 pt-1">
          <div className="text-xs text-stone-400 font-medium">قنوات مشابهة</div>

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
