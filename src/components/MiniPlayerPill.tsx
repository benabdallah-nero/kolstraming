import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Maximize2, X, Volume2, VolumeX, ChevronRight, ChevronLeft, Minimize2, Tv } from 'lucide-react';
import { useApp } from '../context/AppContext';

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

    const streamUrl = `/api/proxy-stream/${activeStreamingChannel.id}/live.m3u8?source=dembed`;

    const startPlayback = () => {
      video.muted = isMuted;
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    };

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

    return () => {
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
      className="fixed bottom-16 md:bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40 animate-in slide-in-from-bottom duration-200 select-none"
      dir="rtl"
    >
      <div className="bg-[#111318]/95 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Live Mini Video Viewport (when not collapsed) */}
        {!isMinimizedPill && (
          <div
            onClick={handleReturnToWatchroom}
            className="relative aspect-video bg-black cursor-pointer group overflow-hidden"
          >
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted={isMuted}
              className="w-full h-full object-contain bg-black"
            />

            {/* Top Corner Status */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-stone-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono-num text-stone-200 font-bold">
                #{activeStreamingChannel.id}
              </span>
            </div>

            {/* Quick Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>العودة لغرفة المشاهدة</span>
              </span>
            </div>
          </div>
        )}

        {/* Bottom Control Strip */}
        <div className="p-2.5 flex items-center justify-between gap-2">
          <div
            onClick={handleReturnToWatchroom}
            className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Tv className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-stone-100 truncate">
                {activeStreamingChannel.arabicName || activeStreamingChannel.name}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium truncate">
                مشغل عائم نشط · اضغط للتكبير
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={e => handleStepChannel(e, -1)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title="القناة السابقة"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={e => handleStepChannel(e, 1)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title="القناة التالية"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {!isMinimizedPill && (
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isMuted
                    ? 'bg-emerald-500 text-stone-950'
                    : 'text-emerald-400 hover:bg-stone-800'
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
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title={isMinimizedPill ? 'إظهار الفيديو المصغر' : 'تصغير الشريط'}
            >
              {isMinimizedPill ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition cursor-pointer"
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
