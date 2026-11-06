import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Maximize2, X, Volume2, VolumeX, ChevronRight, ChevronLeft, Minimize2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAuthorizedStreamUrl } from '../services/streamAuth';

export const MiniPlayerPill: React.FC = () => {
  const { activeStreamingChannel, setActiveStreamingChannel, channels } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMinimizedPill, setIsMinimizedPill] = useState<boolean>(false);

  const isInsideWatchroom = location.pathname.startsWith('/watchroom');

  useEffect(() => {
    if (!activeStreamingChannel || isInsideWatchroom || isMinimizedPill) {
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
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    };

    getAuthorizedStreamUrl(activeStreamingChannel.id, 'dembed').then(streamUrl => {
      if (cancelled || !videoRef.current) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 25
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
  }, [activeStreamingChannel?.id, isInsideWatchroom, isMinimizedPill]);

  if (!activeStreamingChannel || isInsideWatchroom) {
    return null;
  }

  const handleReturnToWatchroom = () => {
    navigate(`/watchroom/${activeStreamingChannel.id}`);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStreamingChannel(null);
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
    <div
      className="fixed bottom-16 md:bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:w-80 z-40 select-none"
      dir="rtl"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] border-r-[3px] border-r-[var(--accent-primary)] rounded-[2px] overflow-hidden">
        {!isMinimizedPill && (
          <div
            onClick={handleReturnToWatchroom}
            className="relative aspect-video bg-black cursor-pointer group overflow-hidden border-b border-[var(--border-hairline)]"
          >
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted={isMuted}
              className="w-full h-full object-contain bg-black"
            />

            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-[var(--bg-canvas)] px-2 py-0.5 rounded-[2px] border border-[var(--border-hairline)]">
              <span className="w-1.5 h-1.5 rounded-full live-dot-pulse" />
              <span className="text-xs font-display-num text-[var(--text-primary)] font-bold">
                CH {String(activeStreamingChannel.id).padStart(2, '0')}
              </span>
            </div>

            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
              <span className="text-[11px] font-bold text-[var(--accent-primary)] flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>العودة إلى شاشة البث</span>
              </span>
            </div>
          </div>
        )}

        <div className="p-2 flex items-center justify-between gap-2 bg-[var(--bg-surface)]">
          <div
            onClick={handleReturnToWatchroom}
            className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
          >
            <span className="px-1.5 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-xs font-extrabold text-[var(--accent-primary)] shrink-0">
              #{String(activeStreamingChannel.id).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                {activeStreamingChannel.arabicName || activeStreamingChannel.name}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate">
                بث مصغر نشط — اضغط للتكبير
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={e => handleStepChannel(e, -1)}
              className="p-1.5 rounded-[2px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title="القناة السابقة"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={e => handleStepChannel(e, 1)}
              className="p-1.5 rounded-[2px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title="القناة التالية"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {!isMinimizedPill && (
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-1.5 rounded-[2px] transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-[var(--signal-live)] text-white'
                    : 'text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
                title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setIsMinimizedPill(prev => !prev);
              }}
              className="p-1.5 rounded-[2px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title={isMinimizedPill ? 'إظهار الفيديو المصغر' : 'تصغير الشريط'}
            >
              {isMinimizedPill ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-[2px] text-[var(--text-muted)] hover:text-[var(--signal-live)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title="إغلاق البث المصغر"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
