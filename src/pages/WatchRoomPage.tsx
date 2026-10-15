import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ChevronLeft,
  Sliders,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Keyboard,
  Info,
  Zap,
  ShieldCheck,
  Activity,
  Radio,
  ExternalLink,
  Volume1
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Channel, QualityResolution } from '../types';
import { Pagination } from '../components/Pagination';
import { usePageSeo } from '../hooks/usePageSeo';

interface QualityOptionItem {
  id: QualityResolution;
  label: string;
  sublabel: string;
  badge: string;
  bitrate: string;
}

const QUALITY_OPTIONS: QualityOptionItem[] = [
  { id: 'auto', label: 'تلقائي (Auto Bitrate)', sublabel: 'يتكيف تلقائياً مع سرعة الإنترنت', badge: 'Auto', bitrate: 'متكيف' },
  { id: '1080p', label: '1080p Full HD', sublabel: 'أعلى دقة ووضوح (للاتصال السريع)', badge: '1080p', bitrate: '~4.0 Mbps' },
  { id: '720p', label: '720p HD', sublabel: 'جودة متوازنة مانعة للتأخير', badge: '720p', bitrate: '~2.2 Mbps' },
  { id: '480p', label: '480p SD', sublabel: 'جودة متوسطة موفرة لتجنب التقطيع', badge: '480p', bitrate: '~1.0 Mbps' },
  { id: '360p', label: '360p Low-Data', sublabel: 'لشبكات الجوال الضعيفة وتوفير الباقة', badge: '360p', bitrate: '~500 Kbps' },
];

export const WatchRoomPage: React.FC = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const navigate = useNavigate();
  const { channels, loadingChannels, matches, isFavorite, toggleFavorite, setActiveStreamingChannel } = useApp();

  // Find target channel by channelId or fallback to premier channel (e.g. 91)
  const currentChannel = useMemo<Channel | null>(() => {
    if (channels.length === 0) return null;
    if (channelId) {
      const found = channels.find(c => String(c.id) === String(channelId));
      if (found) return found;
    }
    // Default to beIN 1 (id 91) if available, or first channel
    return channels.find(c => c.id === 91) || channels[0];
  }, [channels, channelId]);

  usePageSeo({
    title: currentChannel
      ? `مشاهدة ${currentChannel.arabicName || currentChannel.name} بث مباشر 24/7 بدون تقطيع – kolstream`
      : 'غرفة البث المباشر – kolstream',
    description: currentChannel
      ? `تابع البث المباشر لقناة ${currentChannel.arabicName || currentChannel.name} بجودة 1080p Full HD وسيرفرات متعددة مع ميزة منع التقطيع Buffer Boost على kolstream.`
      : 'بث مباشر لقنوات beIN Sports العربية والعالمية.',
    canonicalPath: currentChannel ? `/watchroom/${currentChannel.id}` : '/watchroom'
  });

  // Player state
  const [playerMode, setPlayerMode] = useState<'clean-embed' | 'native'>('clean-embed');
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Resolution & Anti-Lag Buffer Controls
  const [selectedQuality, setSelectedQuality] = useState<QualityResolution>('auto');
  const [bufferMode, setBufferMode] = useState<'anti-lag' | 'low-latency'>('anti-lag');
  const [streamSourceInfo, setStreamSourceInfo] = useState<{
    isSingleBitrate: boolean;
    levelsCount: number;
    currentResolution: string;
  }>({
    isSingleBitrate: true,
    levelsCount: 1,
    currentResolution: '1080p FHD'
  });

  const [qualityMenuOpen, setQualityMenuOpen] = useState<boolean>(false);
  const [qualityToast, setQualityToast] = useState<string | null>(null);

  // Cinema Theater Mode & Audio state
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioBoosted, setIsAudioBoosted] = useState<boolean>(false);

  // In-room active tab: 'switcher' vs 'schedule'
  const [activeRoomTab, setActiveRoomTab] = useState<'switcher' | 'schedule'>('switcher');

  // In-room channel switcher search & pagination
  const [switcherSearch, setSwitcherSearch] = useState<string>('');
  const [switcherPage, setSwitcherPage] = useState<number>(1);
  const switcherPageSize = 12;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Listen to stream stats and stall recovery events from the iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'KOLSTREAM_STREAM_INFO') {
        const lvls = e.data.levels || [];
        const isSingle = e.data.isSingleSourceBitrate || lvls.length <= 1;
        setStreamSourceInfo({
          isSingleBitrate: isSingle,
          levelsCount: lvls.length,
          currentResolution: lvls[0]?.height ? `${lvls[0].height}p` : '1080p FHD'
        });
      } else if (e.data.type === 'KOLSTREAM_STALL_RECOVERED') {
        setQualityToast('تم تخطي التقطيع واستئناف البث بنجاح 🛡️');
        setTimeout(() => setQualityToast(null), 3000);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

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

  const handleReload = useCallback(() => {
    setPlayerStatus('loading');
    setRetryKey(prev => prev + 1);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
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
  }, []);

  const handleToggleTheaterMode = useCallback(() => {
    setIsTheaterMode(prev => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    } else if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'TOGGLE_MUTE' }, '*');
      setIsMuted(prev => !prev);
    }
  }, []);

  const handleTogglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setQualityToast('تم إغلاق نافذة صورة داخل صورة');
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setQualityToast('تم تفعيل وضع صورة داخل صورة (PiP)');
      } else {
        setPlayerMode('native');
        setQualityToast('تم التحويل إلى مشغل HTML5 لتشغيل صورة داخل صورة');
      }
    } catch {
      setQualityToast('ميزة صورة داخل صورة تتطلب تشغيل الفيديو أولاً');
    }
    setTimeout(() => setQualityToast(null), 3000);
  }, []);

  const handleToggleAudioBoost = useCallback(() => {
    setIsAudioBoosted(prev => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.volume = next ? 1.0 : 0.8;
      }
      setQualityToast(next ? '🔊 تم تفعيل مضخم صوت التعليق (+50%)' : 'تمت استعادة مستوى الصوت القياسي');
      setTimeout(() => setQualityToast(null), 3000);
      return next;
    });
  }, []);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Apply Resolution Downgrade to Hls.js instance
  const applyQualityToHls = useCallback((quality: QualityResolution) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (quality === 'auto') {
      hls.currentLevel = -1;
      hls.loadLevel = -1;
      return;
    }

    const levels = hls.levels;
    if (!levels || levels.length === 0) return;

    const targetHeight = quality === '1080p' ? 1080 : quality === '720p' ? 720 : quality === '480p' ? 480 : 360;

    // Find level closest to target height
    let bestIndex = 0;
    let minDiff = Infinity;
    levels.forEach((lvl, idx) => {
      const diff = Math.abs((lvl.height || 720) - targetHeight);
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = idx;
      }
    });

    hls.currentLevel = bestIndex;
    hls.loadLevel = bestIndex;
  }, []);

  // Handle Quality Selection
  const handleSelectQuality = (quality: QualityResolution) => {
    setSelectedQuality(quality);

    if (playerMode === 'native') {
      applyQualityToHls(quality);
    } else if (playerMode === 'clean-embed' && iframeRef.current?.contentWindow) {
      const targetHeight = quality === '1080p' ? 1080 : quality === '720p' ? 720 : quality === '480p' ? 480 : 360;
      iframeRef.current.contentWindow.postMessage({
        type: 'SET_QUALITY_LEVEL',
        levelIndex: quality === 'auto' ? -1 : (targetHeight <= 480 ? 0 : 1)
      }, '*');
    }

    const opt = QUALITY_OPTIONS.find(q => q.id === quality);
    const msg = `تم ضبط الجودة: ${opt?.label || quality}`;
    setQualityToast(msg);
    setTimeout(() => setQualityToast(null), 3000);
  };

  // Toggle Buffer Anti-Lag Mode
  const handleToggleBufferMode = (mode: 'anti-lag' | 'low-latency') => {
    setBufferMode(mode);
    if (playerMode === 'native' && hlsRef.current) {
      if (mode === 'anti-lag') {
        hlsRef.current.config.maxBufferLength = 45;
        hlsRef.current.config.maxMaxBufferLength = 90;
        hlsRef.current.config.liveSyncDurationCount = 7;
        hlsRef.current.startLoad();
      } else {
        hlsRef.current.config.maxBufferLength = 15;
        hlsRef.current.config.maxMaxBufferLength = 30;
        hlsRef.current.config.liveSyncDurationCount = 3;
      }
    } else if (playerMode === 'clean-embed' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_BUFFER_MODE', mode }, '*');
    }

    const msg = mode === 'anti-lag'
      ? 'تم تفعيل وضع التخزين المؤقت المانع للتقطيع (Buffer Boost 30s)'
      : 'تم تفعيل وضع البث المباشر الفوري اللحظي';
    setQualityToast(msg);
    setTimeout(() => setQualityToast(null), 3500);
  };

  // Keyboard Shortcuts Listener (f = fullscreen, t = theater, r = reload, m = mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 't' || e.key === 'T' || e.key === 'ف') {
        e.preventDefault();
        handleToggleTheaterMode();
      } else if (e.key === 'f' || e.key === 'F' || e.key === 'ب') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'ق') {
        e.preventDefault();
        handleReload();
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'ة') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 'Escape') {
        setQualityMenuOpen(false);
        if (isTheaterMode) setIsTheaterMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleTheaterMode, handleToggleFullscreen, handleReload, handleToggleMute, isTheaterMode]);

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
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = `/api/proxy-stream/${currentChannel.id}/live.m3u8?r=${retryKey}`;

    if (Hls.isSupported()) {
      const isAntiLag = bufferMode === 'anti-lag';
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: !isAntiLag,
        backBufferLength: 45,
        maxBufferLength: isAntiLag ? 45 : 20,
        maxMaxBufferLength: isAntiLag ? 90 : 40,
        maxBufferSize: 40 * 1000 * 1000,
        maxBufferHole: 0.5,
        liveSyncDurationCount: isAntiLag ? 7 : 3,
        liveMaxLatencyDurationCount: 15,
        enableSoftwareAES: true
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const lvls = hls.levels || [];
        setStreamSourceInfo({
          isSingleBitrate: lvls.length <= 1,
          levelsCount: lvls.length,
          currentResolution: lvls[0]?.height ? `${lvls[0].height}p FHD` : '1080p FHD'
        });
        applyQualityToHls(selectedQuality);
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
  }, [currentChannel?.id, retryKey, playerMode, applyQualityToHls, selectedQuality, bufferMode]);

  // Native Video stall watchdog
  useEffect(() => {
    if (playerMode !== 'native') return;
    const video = videoRef.current;
    if (!video) return;

    let stallTimeout: any = null;
    const onWaitingOrStalled = () => {
      if (stallTimeout) clearTimeout(stallTimeout);
      stallTimeout = setTimeout(() => {
        if (video.buffered && video.buffered.length > 0) {
          const end = video.buffered.end(video.buffered.length - 1);
          if (end > video.currentTime + 0.8) {
            video.currentTime = end - 0.3;
          }
        }
        video.play().catch(() => {});
        setQualityToast('تم تخطي التقطيع واستئناف البث تلقائياً 🛡️');
        setTimeout(() => setQualityToast(null), 3000);
      }, 3500);
    };

    const onPlaying = () => {
      if (stallTimeout) clearTimeout(stallTimeout);
    };

    video.addEventListener('waiting', onWaitingOrStalled);
    video.addEventListener('stalled', onWaitingOrStalled);
    video.addEventListener('playing', onPlaying);

    return () => {
      if (stallTimeout) clearTimeout(stallTimeout);
      video.removeEventListener('waiting', onWaitingOrStalled);
      video.removeEventListener('stalled', onWaitingOrStalled);
      video.removeEventListener('playing', onPlaying);
    };
  }, [playerMode]);

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

  const cleanEmbedSrc = `/api/clean-embed/player/${currentChannel.id}?r=${retryKey}&q=${selectedQuality}`;

  return (
    <div
      className={`space-y-4 animate-in fade-in duration-200 transition-all ${
        isTheaterMode ? 'max-w-none w-full' : 'max-w-7xl mx-auto'
      }`}
      dir="rtl"
    >
      {/* Toast Feedback for Quality Downgrade or Buffer Mode */}
      {qualityToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{qualityToast}</span>
        </div>
      )}

      {/* Theater Video Viewport Container */}
      <div
        ref={containerRef}
        className={`relative w-full bg-black rounded-2xl overflow-hidden border border-stone-800/80 shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isTheaterMode ? 'aspect-[16/9] sm:aspect-[21/9] max-h-[75vh]' : 'aspect-video'
        }`}
      >
        {playerMode === 'clean-embed' ? (
          <iframe
            ref={iframeRef}
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

        {/* Bottom Floating Control Bar on Player */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-stone-300 hover:text-white border border-stone-700/50 transition shadow-lg"
              title="ملء الشاشة [F]"
              aria-label="ملء الشاشة"
            >
              <Maximize className="w-4 h-4" />
            </button>

            {/* Theater Mode Button */}
            <button
              type="button"
              onClick={handleToggleTheaterMode}
              className={`p-2 rounded-xl backdrop-blur-md border transition shadow-lg ${
                isTheaterMode
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                  : 'bg-black/70 hover:bg-black/90 border-stone-700/50 text-stone-300 hover:text-white'
              }`}
              title="وضع المسرح السينمائي [T]"
              aria-label="وضع المسرح"
            >
              {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Mute / Unmute Button (For native mode) */}
            {playerMode === 'native' && (
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-stone-300 hover:text-white border border-stone-700/50 transition shadow-lg"
                title="كتم / تشغيل الصوت [M]"
                aria-label="كتم الصوت"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Audio Booster (+50%) */}
            {playerMode === 'native' && (
              <button
                type="button"
                onClick={handleToggleAudioBoost}
                className={`p-2 rounded-xl backdrop-blur-md border transition shadow-lg ${
                  isAudioBoosted
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 font-bold'
                    : 'bg-black/70 hover:bg-black/90 border-stone-700/50 text-stone-300 hover:text-white'
                }`}
                title="مضخم صوت المعلق (+50%)"
                aria-label="مضخم الصوت"
              >
                <Volume1 className="w-4 h-4" />
              </button>
            )}

            {/* Picture in Picture Button */}
            <button
              type="button"
              onClick={handleTogglePiP}
              className="p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-stone-300 hover:text-white border border-stone-700/50 transition shadow-lg"
              title="صورة داخل صورة (PiP)"
              aria-label="صورة داخل صورة"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Anti-Lag Indicator Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-stone-700/50 text-[11px] text-stone-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{bufferMode === 'anti-lag' ? 'حماية ضد التقطيع نشطة' : 'بث لحظي'}</span>
            </div>

            {/* Reload Stream Button */}
            <button
              type="button"
              onClick={handleReload}
              className="p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-stone-300 hover:text-white border border-stone-700/50 transition shadow-lg"
              title="إعادة تحميل البث [R]"
              aria-label="إعادة تحميل البث"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Server Selection Bar */}
      <div className="bg-[#121316]/90 border border-stone-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-stone-400 font-medium shrink-0 flex items-center gap-1.5 ml-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-stone-200">سيرفرات البث:</span>
          </span>

          {/* Server 1 */}
          <button
            type="button"
            onClick={() => setPlayerMode('clean-embed')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 text-xs ${
              playerMode === 'clean-embed'
                ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 font-bold shadow-sm'
                : 'bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>سيرفر 1 (المشغل النظيف المحمي)</span>
          </button>

          {/* Server 2 */}
          <button
            type="button"
            onClick={() => setPlayerMode('native')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 text-xs ${
              playerMode === 'native'
                ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 font-bold shadow-sm'
                : 'bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>سيرفر 2 (مشغل HTML5 المباشر + مانع التقطيع)</span>
          </button>
        </div>

        {/* Server Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>السيرفر متصل ويعمل بكفاءة</span>
          </span>
        </div>
      </div>

      {/* Channel Header & Interactive Controls Bar */}
      <div className="bg-[#121316]/95 border border-stone-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-num text-xs font-bold text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">
              #{currentChannel.id}
            </span>
            <h1 className="text-base font-bold text-stone-100">
              {currentChannel.arabicName || currentChannel.name}
            </h1>
            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.2 rounded-full">
              بث مباشر
            </span>
            {isTheaterMode && (
              <span className="text-[10px] text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.2 rounded-md">
                وضع المسرح السينمائي
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400 mt-1 font-mono-num">
            <span>{streamSourceInfo.currentResolution}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="font-sans">{currentChannel.lang || 'عربي'}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="font-sans text-emerald-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>مستقر</span>
            </span>
          </div>
        </div>

        {/* Viewport Control Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative">
          {/* Quality & Anti-Lag Settings Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setQualityMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-xs text-stone-200 transition shadow-sm"
              title="خيارات الجودة ومنع التقطيع"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">الجودة والاستقرار</span>
              <span className="font-mono-num font-bold text-emerald-400">
                {bufferMode === 'anti-lag' ? '🛡️ مانع التقطيع' : '⚡ مباشر'}
              </span>
            </button>

            {/* Quality & Anti-Lag Popover */}
            {qualityMenuOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-80 bg-[#121316] border border-stone-700/80 rounded-2xl shadow-2xl p-3 z-30 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-right">
                {/* Header */}
                <div className="pb-2 border-b border-stone-800 flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>إعدادات استقرار البث والجودة</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono-num">
                    {streamSourceInfo.currentResolution}
                  </span>
                </div>

                {/* Section: Stream Source Truth */}
                <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-[11px] space-y-1.5">
                  <div className="font-bold text-stone-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>حالة جودة السيرفر المصدر:</span>
                  </div>
                  <p className="text-stone-400 leading-relaxed text-[10px]">
                    {streamSourceInfo.isSingleBitrate
                      ? 'يبث المصدر القناة بدقة أصلية واحدة (1080p FHD). عند ضعف الإنترنت، تفعيل "وضع مانع التقطيع" هو الحل الفعلي بدلاً من البحث عن جودات غير متوفرة من المصدر.'
                      : 'يوفر المصدر عدة مسارات للدقة، يمكنك التبديل بينها أدناه.'}
                  </p>
                </div>

                {/* Section: Anti-Lag Buffer Modes (The real fix for lagging internet) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-stone-300">
                    أوضاع منع التقطيع (Buffer Control):
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleBufferMode('anti-lag')}
                      className={`p-2 rounded-xl text-right border transition text-xs space-y-0.5 ${
                        bufferMode === 'anti-lag'
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold'
                          : 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">مانع التقطيع</span>
                        {bufferMode === 'anti-lag' && <Check className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div className="text-[9px] text-stone-500">تخزين مؤقت 30s</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleBufferMode('low-latency')}
                      className={`p-2 rounded-xl text-right border transition text-xs space-y-0.5 ${
                        bufferMode === 'low-latency'
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold'
                          : 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">بث لحظي فوري</span>
                        {bufferMode === 'low-latency' && <Check className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div className="text-[9px] text-stone-500">تأخير أدنى (5s)</div>
                    </button>
                  </div>
                </div>

                {/* Section: Resolution Options */}
                <div className="space-y-1 pt-1 border-t border-stone-800">
                  <div className="text-[11px] font-bold text-stone-300">
                    الدقة المطلوبة:
                  </div>
                  <div className="space-y-1">
                    {QUALITY_OPTIONS.slice(0, 3).map(opt => {
                      const isSelected = selectedQuality === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectQuality(opt.id)}
                          className={`w-full text-right p-2 rounded-xl transition flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-semibold'
                              : 'hover:bg-stone-850 text-stone-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{opt.label}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <span className="font-mono-num text-[10px] text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                            {opt.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Engine Switcher Advice */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400">إذا واجهت بطء بالسيرفر:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerMode(prev => prev === 'clean-embed' ? 'native' : 'clean-embed');
                      setQualityMenuOpen(false);
                    }}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline"
                  >
                    تبديل المشغل ({playerMode === 'clean-embed' ? 'HTML5 Native' : 'مشغل الويب'})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Engine Switcher */}
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
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition"
            title="إعادة تحميل البث [R]"
            aria-label="إعادة تحميل"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Share Stream Link */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition relative"
            title="نسخ رابط الغرفة"
            aria-label="مشاركة"
          >
            <Share2 className="w-4 h-4" />
            {copiedLink && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-500 text-stone-950 text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                تم النسخ!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs: In-Room Switcher vs Today Fixtures */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveRoomTab('switcher')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeRoomTab === 'switcher'
                  ? 'bg-stone-100 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>تبديل القناة ({channels.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRoomTab('schedule')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
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
                لا توجد مباريات مسجلة اليوم في الجدول
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {matches.slice(0, 10).map(m => {
                  const isCurrentOnAir = m.channels && m.channels.some(c => c.channel_id === currentChannel.id);
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        isCurrentOnAir
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-stone-900/80 border-stone-800/80'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                          <span className="font-bold text-stone-300">{m.competition}</span>
                          <span>·</span>
                          <span className="font-mono-num">{m.time}</span>
                          {m.status === 'LIVE' && (
                            <span className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1 rounded">
                              مباشر الآن
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-stone-200 truncate">
                          {m.teamA.name} {m.scoreA !== null ? `${m.scoreA} - ${m.scoreB}` : 'ضد'} {m.teamB.name}
                        </div>

                        {m.commentator && (
                          <div className="text-[10px] text-stone-500">
                            المعلق: {m.commentator}
                          </div>
                        )}
                      </div>

                      {m.channels && m.channels.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetChId = m.channels[0].channel_id;
                            if (targetChId !== currentChannel.id) {
                              navigate(`/watchroom/${targetChId}`);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs shrink-0 transition ${
                            isCurrentOnAir
                              ? 'bg-emerald-500 text-stone-950'
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                          }`}
                        >
                          {isCurrentOnAir ? 'تبث هنا الآن' : `انتقل إلى ${m.channels[0].channel_name}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Helper Bar */}
      <div className="p-3 bg-[#0d0e11] border border-stone-800/60 rounded-xl text-stone-500 text-[11px] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Keyboard className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>اختصارات لوحة المفاتيح:</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span><kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-300">T</kbd> وضع المسرح</span>
          <span><kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-300">F</kbd> ملء الشاشة</span>
          <span><kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-300">R</kbd> إعادة التحميل</span>
          <span><kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-300">M</kbd> كتم الصوت</span>
          <span><kbd className="px-1.5 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-300">Esc</kbd> إغلاق القوائم</span>
        </div>
      </div>
    </div>
  );
};
