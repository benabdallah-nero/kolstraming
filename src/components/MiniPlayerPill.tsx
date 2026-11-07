import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Maximize2, X, Volume2, VolumeX, ChevronRight, ChevronLeft, Play, Pause } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAuthorizedStreamUrl } from '../services/streamAuth';

export const MiniPlayerPill: React.FC = () => {
  const { activeStreamingChannel, setActiveStreamingChannel, channels } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showDesktopVideo, setShowDesktopVideo] = useState<boolean>(true);

  const isInsideWatchroom = location.pathname.startsWith('/watchroom');

  useEffect(() => {
    if (!activeStreamingChannel || isInsideWatchroom) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let cancelled = false;

    const startPlayback = () => {
      video.muted = isMuted;
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    };

    getAuthorizedStreamUrl(activeStreamingChannel.id, 'dembed').then(streamUrl => {
      if (cancelled || !videoRef.current) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 20
        });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          startPlayback();
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', startPlayback, { once: true });
      }
    });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamingChannel?.id, isInsideWatchroom]);

  if (!activeStreamingChannel || isInsideWatchroom) {
    return null;
  }

  const handleReturnToWatchroom = () => {
    navigate(`/watchroom/${activeStreamingChannel.id}`);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setActiveStreamingChannel(null);
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
      if (!next) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleStepChannel = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (channels.length === 0) return;
    const idx = channels.findIndex(c => c.id === activeStreamingChannel.id);
    const nextIdx = idx === -1 ? 0 : (idx + delta + channels.length) % channels.length;
    setActiveStreamingChannel(channels[nextIdx]);
  };

  return (
    <aside
      aria-label="مشغل البث المصغر"
      className="fixed bottom-15 md:bottom-5 left-2 right-2 sm:left-auto sm:right-6 sm:w-88 z-40 select-none animate-in fade-in slide-in-from-bottom-2 duration-200"
      dir="rtl"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] border-r-[3px] border-r-[var(--accent-primary)] rounded-md shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Desktop Optional Video Box (Hidden on Mobile to prevent viewport obstruction) */}
        <div className="hidden md:block">
          {showDesktopVideo && (
            <div
              onClick={handleReturnToWatchroom}
              className="relative aspect-video bg-black cursor-pointer group overflow-hidden border-b border-[var(--border-hairline)]"
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleReturnToWatchroom()}
              aria-label="العودة لشاشة البث الرئيسية"
            >
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted={isMuted}
                className="w-full h-full object-contain bg-black"
              />

              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-[var(--bg-canvas)]/90 px-2 py-0.5 rounded-[2px] border border-[var(--border-hairline)] text-xs font-display-num text-[var(--text-primary)] font-bold">
                <span className="w-1.5 h-1.5 rounded-full live-dot-pulse" />
                <span>CH {String(activeStreamingChannel.id).padStart(2, '0')}</span>
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1.5 bg-black/80 px-3 py-1.5 rounded border border-[var(--accent-primary)]/40">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>تكبير البث</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden video element for mobile so audio continues playing seamlessly */}
        <div className="md:hidden">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted={isMuted}
            className="hidden"
          />
        </div>

        {/* 52px Slim Broadcast Bar (Mobile & Desktop) */}
        <div className="h-13 px-3 flex items-center justify-between gap-2.5 bg-[var(--bg-surface)]">
          {/* Channel Info & Return to Fullscreen Watchroom */}
          <button
            type="button"
            onClick={handleReturnToWatchroom}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-right cursor-pointer hover:opacity-85 transition-opacity py-1"
            title="انقر لفتح البث على كامل الشاشة"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full live-dot-pulse" />
              <span className="px-1.5 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-xs font-black text-[var(--accent-primary)]">
                #{String(activeStreamingChannel.id).padStart(2, '0')}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold font-display-ar text-[var(--text-primary)] truncate">
                {activeStreamingChannel.arabicName || activeStreamingChannel.name}
              </div>
              <div className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1">
                <span className="text-[var(--accent-primary)]">مباشر</span>
                <span>• اضغط لتكبير الشاشة</span>
              </div>
            </div>
          </button>

          {/* Quick Playback Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Step Prev Channel */}
            <button
              type="button"
              onClick={e => handleStepChannel(e, -1)}
              className="p-2 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title="القناة السابقة"
              aria-label="القناة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Step Next Channel */}
            <button
              type="button"
              onClick={e => handleStepChannel(e, 1)}
              className="p-2 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title="القناة التالية"
              aria-label="القناة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Play / Pause Toggle */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="p-2 rounded text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'استئناف'}
              aria-label={isPlaying ? 'إيقاف مؤقت' : 'استئناف'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Mute Toggle */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2 rounded transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-[var(--signal-live)]/20 text-[var(--signal-live)]'
                  : 'text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Desktop PIP Video Toggle */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setShowDesktopVideo(prev => !prev);
              }}
              className="hidden md:flex p-2 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title={showDesktopVideo ? 'إخفاء معاينة الفيديو' : 'إظهار معاينة الفيديو'}
              aria-label="تبديل معاينة الفيديو"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close Mini Player */}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 rounded text-[var(--text-muted)] hover:text-[var(--signal-live)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title="إغلاق البث المصغر"
              aria-label="إغلاق المشغل المصغر"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
