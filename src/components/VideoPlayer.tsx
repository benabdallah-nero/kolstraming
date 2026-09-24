import React, { useState, useEffect, useRef } from 'react';
import { Channel } from '../types';
import {
  RotateCw,
  Maximize,
  Star,
  AlertCircle
} from 'lucide-react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  activeMatch?: string;
  onSelectChannel?: (id: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  isFavorite,
  onToggleFavorite,
  activeMatch,
  onSelectChannel
}) => {
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [hlsStatus, setHlsStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        video.requestFullscreen().catch(() => {});
      }
    }
  };

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
          throw new Error('رابط البث غير متوفر حالياً');
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
                  hls.destroy();
                  setHlsStatus('error');
                  break;
              }
            }
          });

          hlsInstanceRef.current = hls;

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
        setErrorMessage(err.message || 'تعذر الاتصال بالبث');
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
    };
  }, [channel.id, playerKey]);

  return (
    <div className="w-full bg-[#121316] border border-stone-800/60 rounded-xl overflow-hidden" dir="rtl">
      {/* Video Viewport - Zero Iframes */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          controls
          className="w-full h-full object-contain"
        />

        {hlsStatus === 'loading' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-stone-400 gap-2">
            <RotateCw className="w-6 h-6 text-stone-400 animate-spin" />
            <span className="text-xs text-stone-300">جاري تحميل البث المباشر...</span>
          </div>
        )}

        {hlsStatus === 'error' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-stone-400 gap-3 p-4 text-center">
            <AlertCircle className="w-6 h-6 text-stone-500" />
            <div className="text-xs text-stone-300">{errorMessage || 'انقطع الاتصال'}</div>
            <button
              onClick={handleReload}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>

      {/* Stream Controls */}
      <div className="p-3 border-t border-stone-850 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono-num text-xs text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
              #{channel.id}
            </span>
            <span className="text-stone-100 font-medium text-sm truncate">
              {channel.arabicName || channel.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggleFavorite(channel.id)}
            className={`p-2 rounded-lg transition ${
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
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 transition"
            title="إعادة تشغيل البث"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 transition"
            title="ملء الشاشة"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
