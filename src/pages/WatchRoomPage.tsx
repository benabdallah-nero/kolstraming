import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Sliders,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Keyboard,
  Info,
  ShieldCheck,
  Activity,
  Radio,
  ExternalLink,
  Volume1,
  Grid,
  Camera,
  Clock,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  Monitor,
  Plus,
  X,
  Play
} from 'lucide-react';
import { useApp, getApiUrl } from '../context/AppContext';
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

// Independent Multi-View Cell Component for watching up to 4 live channels simultaneously
interface MultiViewCellProps {
  channel: Channel;
  allChannels: Channel[];
  isAudioActive: boolean;
  onSelectAudio: () => void;
  onChangeChannel: (newChannelId: number) => void;
  onRemove?: () => void;
  onMakeSingle: () => void;
}

const MultiViewStreamCell: React.FC<MultiViewCellProps> = ({
  channel,
  allChannels,
  isAudioActive,
  onSelectAudio,
  onChangeChannel,
  onRemove,
  onMakeSingle
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [serverMode, setServerMode] = useState<'server1' | 'server2' | 'server3'>('server1');
  const [status, setStatus] = useState<'loading' | 'playing'>('loading');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('loading');
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const srcKey = serverMode === 'server1' ? 'dembed' : serverMode === 'server2' ? 'cast' : 'wide';
    const streamUrl = getApiUrl(`/api/proxy-stream/${channel.id}/live.m3u8?source=${srcKey}&r=${retryCount}`);

    const startPlay = () => {
      video.muted = !isAudioActive;
      video.volume = 1.0;
      video
        .play()
        .then(() => setStatus('playing'))
        .catch(() => {
          video.muted = true;
          video.play().then(() => setStatus('playing')).catch(() => setStatus('playing'));
        });
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 35,
        maxMaxBufferLength: 60,
        manifestLoadingMaxRetry: 5,
        fragLoadingMaxRetry: 6
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        startPlay();
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', startPlay, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.id, serverMode, retryCount]);

  // Sync audio mute state whenever isAudioActive toggles
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isAudioActive;
      if (isAudioActive) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isAudioActive]);

  return (
    <div
      className={`relative bg-black rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
        isAudioActive
          ? 'border-emerald-500 shadow-lg shadow-emerald-950/30'
          : 'border-stone-800/90 hover:border-stone-700'
      }`}
    >
      {/* Top Bar inside Cell */}
      <div className="bg-[#101217] border-b border-stone-800/80 px-3 py-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-mono-num text-[10px] text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded shrink-0">
            #{channel.id}
          </span>
          <select
            value={channel.id}
            onChange={e => onChangeChannel(Number(e.target.value))}
            className="bg-stone-900 border border-stone-800 text-stone-100 font-bold text-xs rounded-lg px-2 py-1 truncate max-w-[180px] focus:outline-none focus:border-emerald-500"
            aria-label="تغيير قناة الشاشة"
          >
            {allChannels.slice(0, 80).map(c => (
              <option key={c.id} value={c.id}>
                #{c.id} - {c.arabicName || c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Server Quick Cycle */}
          {(['server1', 'server2', 'server3'] as const).map((srv, idx) => (
            <button
              key={srv}
              type="button"
              onClick={() => setServerMode(srv)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono-num transition cursor-pointer ${
                serverMode === srv
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
              title={`سيرفر ${idx + 1}`}
            >
              S{idx + 1}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setRetryCount(c => c + 1)}
            className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800"
            title="إعادة تحميل هذه الشاشة"
          >
            <RotateCw className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onMakeSingle}
            className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800"
            title="تكبير لشاشة كاملة مفردة"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded-lg bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 border border-stone-800"
              title="إزالة من الشاشة المتعددة"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Video Player Area */}
      <div
        onClick={onSelectAudio}
        className="relative aspect-video bg-black flex items-center justify-center cursor-pointer"
      >
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted={!isAudioActive}
          className="w-full h-full object-contain bg-black"
          onPlaying={() => setStatus('playing')}
          onWaiting={() => setStatus('loading')}
        />

        {status === 'loading' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
            <RotateCw className="w-5 h-5 animate-spin text-emerald-400" />
            <span className="text-[11px] text-stone-300">جاري تحميل البث...</span>
          </div>
        )}

        {/* Audio Focus Indicator Button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onSelectAudio();
          }}
          className={`absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer ${
            isAudioActive
              ? 'bg-emerald-500 text-stone-950'
              : 'bg-black/80 hover:bg-stone-900 text-stone-300 border border-stone-700'
          }`}
        >
          {isAudioActive ? (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>الصوت مفعل هنا</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
              <span>اضغط لتشغيل صوت هذه القناة</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const WatchRoomPage: React.FC = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    channels,
    loadingChannels,
    matches,
    isFavorite,
    toggleFavorite,
    watchHistory,
    addToWatchHistory,
    multiViewIds,
    setMultiViewIds,
    setActiveStreamingChannel
  } = useApp();

  // Dynamically resolved metadata for channels opened directly via URL before or outside catalog
  const [resolvedMeta, setResolvedMeta] = useState<{ id: number; name: string; lang: string; category: Channel['category'] } | null>(null);

  useEffect(() => {
    if (!channelId) return;
    const found = channels.find(c => String(c.id) === String(channelId));
    if (found) return;

    const numId = parseInt(channelId, 10);
    if (isNaN(numId) || numId <= 0) return;

    let cancelled = false;
    fetch(getApiUrl(`/api/resolve-m3u8/${numId}`))
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data && data.success && data.channelName) {
          setResolvedMeta({
            id: numId,
            name: data.channelName,
            lang: data.lang || 'International',
            category: (data.category as Channel['category']) || 'other'
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [channelId, channels]);

  // Find target channel by channelId from catalog or dynamically resolved metadata
  const currentChannel = useMemo<Channel | null>(() => {
    if (channelId) {
      const found = channels.find(c => String(c.id) === String(channelId));
      if (found) return found;

      const numId = parseInt(channelId, 10);
      if (!isNaN(numId) && numId > 0) {
        const dynamicName = resolvedMeta && resolvedMeta.id === numId ? resolvedMeta.name : `Channel #${numId}`;
        return {
          id: numId,
          name: dynamicName,
          category: resolvedMeta && resolvedMeta.id === numId ? resolvedMeta.category : 'other',
          subcat: 'live_event',
          quality: '1080p FHD',
          lang: resolvedMeta && resolvedMeta.id === numId ? resolvedMeta.lang : 'International',
          country: 'Global'
        };
      }
    }
    if (channels.length === 0) return null;
    return channels.find(c => c.id === 91) || channels[0];
  }, [channels, channelId, resolvedMeta]);

  usePageSeo({
    title: currentChannel
      ? `مشاهدة ${currentChannel.arabicName || currentChannel.name} بث مباشر 24/7 بدون تقطيع – kolstream`
      : 'غرفة البث المباشر – kolstream',
    description: currentChannel
      ? `تابع البث المباشر لقناة ${currentChannel.arabicName || currentChannel.name} بجودة 1080p Full HD وسيرفرات متعددة مع ميزة منع التقطيع Buffer Boost على kolstream.`
      : 'بث مباشر لقنوات beIN Sports العربية والعالمية.',
    canonicalPath: currentChannel ? `/watchroom/${currentChannel.id}` : '/watchroom'
  });

  // Player state (3 distinct upstream CDNs: server1=dembed, server2=cast, server3=wide, or direct embed)
  const [playerMode, setPlayerMode] = useState<'server1' | 'server2' | 'server3' | 'direct'>('server1');
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Multi-View Mode State
  const [isMultiViewMode, setIsMultiViewMode] = useState<boolean>(() => searchParams.get('multiview') === '1');
  const [activeAudioSlotIndex, setActiveAudioSlotIndex] = useState<number>(0);

  // Sync URL ?multiview=1 with state
  useEffect(() => {
    if (searchParams.get('multiview') === '1' && !isMultiViewMode) {
      setIsMultiViewMode(true);
    }
  }, [searchParams, isMultiViewMode]);

  // Ensure Multi-View has at least 2 channels when enabled
  useEffect(() => {
    if (isMultiViewMode && currentChannel) {
      setMultiViewIds(prev => {
        if (prev.length >= 2) return prev;
        const firstId = currentChannel.id;
        const secondFallback = channels.find(c => c.id !== firstId)?.id || 92;
        return prev.length === 1
          ? [prev[0], prev[0] === firstId ? secondFallback : firstId]
          : [firstId, secondFallback];
      });
    }
  }, [isMultiViewMode, currentChannel, channels, setMultiViewIds]);

  // Pro Player Features: Aspect Ratio Fit, Telemetry HUD, Sleep Timer
  const [videoFit, setVideoFit] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [showStatsHud, setShowStatsHud] = useState<boolean>(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [bufferHealthSec, setBufferHealthSec] = useState<number>(0);
  const [liveVideoDimensions, setLiveVideoDimensions] = useState<string>('1920x1080');

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
  const [volume, setVolume] = useState<number>(1);
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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const showToast = useCallback((msg: string, duration = 2800) => {
    setQualityToast(msg);
    setTimeout(() => setQualityToast(null), duration);
  }, []);

  // Sync active streaming channel, record in watchHistory, and scroll to player top
  useEffect(() => {
    if (currentChannel) {
      setActiveStreamingChannel(currentChannel);
      addToWatchHistory(currentChannel.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChannel, setActiveStreamingChannel, addToWatchHistory]);

  // Sleep Timer Countdown Effect
  useEffect(() => {
    if (sleepTimerMinutes === null || sleepTimerMinutes <= 0) return;
    const timer = setInterval(() => {
      setSleepTimerMinutes(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (videoRef.current) {
            videoRef.current.pause();
          }
          showToast('🌙 انتهى مؤقت النوم وتم إيقاف البث تلقائياً', 5000);
          return null;
        }
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [sleepTimerMinutes, showToast]);

  // Live Telemetry Poll (updates buffer health and actual video resolution when HUD is open)
  useEffect(() => {
    if (!showStatsHud) return;
    const interval = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      if (v.videoWidth && v.videoHeight) {
        setLiveVideoDimensions(`${v.videoWidth}×${v.videoHeight}`);
      }
      if (v.buffered && v.buffered.length > 0) {
        const end = v.buffered.end(v.buffered.length - 1);
        const health = Math.max(0, end - v.currentTime);
        setBufferHealthSec(Math.round(health * 10) / 10);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showStatsHud]);

  // Check if there is an active match on this specific channel
  const currentMatch = useMemo(() => {
    if (!currentChannel) return null;
    return matches.find(m =>
      m.channels && m.channels.some(c => Number(c.channel_id) === Number(currentChannel.id))
    );
  }, [matches, currentChannel]);

  // Recently watched channels resolved from catalog
  const recentChannelsList = useMemo(() => {
    return watchHistory
      .map(id => channels.find(c => c.id === id))
      .filter((c): c is Channel => Boolean(c))
      .slice(0, 8);
  }, [watchHistory, channels]);

  // Multi-View resolved channel objects
  const multiViewChannels = useMemo(() => {
    return multiViewIds.map(id => {
      const found = channels.find(c => c.id === id);
      if (found) return found;
      return {
        id,
        name: `Channel #${id}`,
        category: 'bein' as const,
        quality: '1080p FHD',
        lang: 'عربي',
        country: 'QA'
      };
    });
  }, [multiViewIds, channels]);

  const handleReload = useCallback(() => {
    setPlayerStatus('loading');
    setRetryKey(prev => prev + 1);
    showToast('جاري إعادة مزامنة البث المباشر...');
  }, [showToast]);

  // Jump to Live Edge of Buffer
  const handleSyncLiveEdge = useCallback(() => {
    const v = videoRef.current;
    if (v && v.buffered && v.buffered.length > 0) {
      const liveEdge = v.buffered.end(v.buffered.length - 1);
      v.currentTime = Math.max(0, liveEdge - 0.5);
      v.play().catch(() => {});
      showToast('⚡ تمت المزامنة مع اللحظة المباشرة للبث');
    } else {
      handleReload();
    }
  }, [handleReload, showToast]);

  // Step Next / Previous Channel (Quick Channel Zapper)
  const handleStepChannel = useCallback(
    (delta: number) => {
      if (!currentChannel || channels.length === 0) return;
      const idx = channels.findIndex(c => c.id === currentChannel.id);
      const nextIndex = idx === -1 ? 0 : (idx + delta + channels.length) % channels.length;
      const target = channels[nextIndex];
      if (target) {
        navigate(`/watchroom/${target.id}`);
        showToast(`📺 تم الانتقال إلى: ${target.arabicName || target.name}`);
      }
    },
    [currentChannel, channels, navigate, showToast]
  );

  // Capture Instant Video Frame Snapshot
  const handleCaptureSnapshot = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      showToast('انتظر حتى يبدأ تشغيل الفيديو لالتقاط صورة');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `kolstream-ch${currentChannel?.id || 'live'}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('📸 تم التقاط صورة من البث وحفظها بجودة كاملة');
      }
    } catch {
      showToast('تعذر حفظ اللقطة بسبب قيود المتصفح');
    }
  }, [currentChannel?.id, showToast]);

  // Cycle Video Fit Mode
  const handleCycleVideoFit = useCallback(() => {
    setVideoFit(prev => {
      const next = prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain';
      const label =
        next === 'contain' ? 'أبعاد قياسية (Contain)' : next === 'cover' ? 'ملء الشاشة الذكي (Cover)' : 'تمديد كامل (Stretch)';
      showToast(`📐 وضع العرض: ${label}`);
      return next;
    });
  }, [showToast]);

  // Cycle Sleep Timer
  const handleCycleSleepTimer = useCallback(() => {
    setSleepTimerMinutes(prev => {
      const next = prev === null ? 15 : prev === 15 ? 30 : prev === 30 ? 60 : null;
      if (next === null) {
        showToast('🌙 تم إلغاء مؤقت الإيقاف التلقائي');
      } else {
        showToast(`🌙 تم ضبط مؤقت النوم: إيقاف البث بعد ${next} دقيقة`);
      }
      return next;
    });
  }, [showToast]);

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

  const handleForceUnmute = useCallback(() => {
    setIsMuted(false);
    const targetVol = volume > 0.05 ? volume : 1.0;
    setVolume(targetVol);
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = targetVol;
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      videoRef.current.play().catch(() => {});
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_MUTE', muted: false }, '*');
    }
    showToast('🔊 تم تشغيل صوت البث المباشر');
  }, [volume, showToast]);

  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      handleForceUnmute();
      return;
    }
    setIsMuted(true);
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_MUTE', muted: true }, '*');
    }
  }, [isMuted, handleForceUnmute]);

  const handleVolumeChange = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
      if (clamped > 0 && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_VOLUME', volume: clamped }, '*');
    }
  }, []);

  const handleTogglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showToast('تم إغلاق نافذة صورة داخل صورة');
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        showToast('تم تفعيل وضع صورة داخل صورة (PiP)');
      }
    } catch {
      showToast('ميزة صورة داخل صورة تتطلب تشغيل الفيديو أولاً');
    }
  }, [showToast]);

  const handleToggleAudioBoost = useCallback(() => {
    setIsAudioBoosted(prev => {
      const next = !prev;
      setIsMuted(false);
      const targetVol = volume > 0.05 ? volume : 1.0;
      setVolume(targetVol);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = targetVol;
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (!audioCtxRef.current && AudioCtx) {
            const ctx = new AudioCtx();
            const source = ctx.createMediaElementSource(videoRef.current);
            const gain = ctx.createGain();
            source.connect(gain);
            gain.connect(ctx.destination);
            audioCtxRef.current = ctx;
            gainNodeRef.current = gain;
          }
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = next ? 1.8 : 1.0;
          }
        } catch {
          videoRef.current.volume = 1.0;
        }
      }
      showToast(next ? '🔊 تم تفعيل مضخم صوت التعليق (+80%)' : 'تمت استعادة مستوى الصوت القياسي');
      return next;
    });
  }, [volume, showToast]);

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
    applyQualityToHls(quality);

    const opt = QUALITY_OPTIONS.find(q => q.id === quality);
    showToast(`تم ضبط الجودة: ${opt?.label || quality}`);
  };

  // Toggle Buffer Anti-Lag Mode
  const handleToggleBufferMode = (mode: 'anti-lag' | 'low-latency') => {
    setBufferMode(mode);
    if (hlsRef.current) {
      if (mode === 'anti-lag') {
        hlsRef.current.config.maxBufferLength = 50;
        hlsRef.current.config.maxMaxBufferLength = 90;
        hlsRef.current.config.liveSyncDurationCount = 7;
        hlsRef.current.startLoad();
      } else {
        hlsRef.current.config.maxBufferLength = 15;
        hlsRef.current.config.maxMaxBufferLength = 30;
        hlsRef.current.config.liveSyncDurationCount = 3;
      }
    }

    const msg =
      mode === 'anti-lag'
        ? 'تم تفعيل وضع التخزين المؤقت المانع للتقطيع (Buffer Boost 45s)'
        : 'تم تفعيل وضع البث المباشر الفوري اللحظي';
    showToast(msg, 3500);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (e.metaKey || e.ctrlKey) return;

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
      } else if (e.key === 's' || e.key === 'S' || e.key === 'س') {
        e.preventDefault();
        handleCaptureSnapshot();
      } else if (e.key === 'i' || e.key === 'I' || e.key === 'ه') {
        e.preventDefault();
        setShowStatsHud(prev => !prev);
      } else if (e.key === 'Escape') {
        setQualityMenuOpen(false);
        if (isTheaterMode) setIsTheaterMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleToggleTheaterMode,
    handleToggleFullscreen,
    handleReload,
    handleToggleMute,
    handleCaptureSnapshot,
    isTheaterMode
  ]);

  // Unified Direct HLS Video Engine for Single Stream Mode (Server 1 = dembed, Server 2 = cast, Server 3 = wide)
  useEffect(() => {
    if (!currentChannel || isMultiViewMode || playerMode === 'direct') {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (playerMode === 'direct') {
        setPlayerStatus('playing');
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

    const sourceParam = playerMode === 'server1' ? 'dembed' : playerMode === 'server2' ? 'cast' : 'wide';
    const streamUrl = getApiUrl(`/api/proxy-stream/${currentChannel.id}/live.m3u8?source=${sourceParam}&r=${retryKey}`);

    const tryPlayDirect = () => {
      video.muted = false;
      video.volume = volume > 0.05 ? volume : 1.0;
      video
        .play()
        .then(() => {
          setIsMuted(false);
          setPlayerStatus('playing');
        })
        .catch(() => {
          // Browser blocked unmuted autoplay until first click on page
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setPlayerStatus('playing')).catch(() => setPlayerStatus('playing'));
        });
    };

    if (Hls.isSupported()) {
      const isAntiLag = bufferMode === 'anti-lag';
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: !isAntiLag,
        defaultAudioCodec: 'mp4a.40.2',
        maxAudioFramesDrift: 8,
        backBufferLength: 60,
        maxBufferLength: isAntiLag ? 50 : 20,
        maxMaxBufferLength: isAntiLag ? 90 : 40,
        maxBufferSize: 50 * 1000 * 1000,
        maxBufferHole: 1.5,
        liveSyncDurationCount: isAntiLag ? 7 : 3,
        liveMaxLatencyDurationCount: 15,
        enableSoftwareAES: true,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        fragLoadingMaxRetry: 6
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
        if (hls.audioTracks && hls.audioTracks.length > 0 && hls.audioTrack === -1) {
          hls.audioTrack = 0;
        }
        applyQualityToHls(selectedQuality);
        tryPlayDirect();
      });

      let netErrorCount = 0;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              netErrorCount++;
              if (netErrorCount > 2) {
                setPlayerStatus('error');
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setPlayerStatus('error');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        tryPlayDirect();
      });
      video.addEventListener('error', () => {
        setPlayerStatus('error');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel?.id, retryKey, playerMode, applyQualityToHls, selectedQuality, bufferMode, isMultiViewMode]);

  // Direct Video stall watchdog
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isMultiViewMode) return;

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
        showToast('تم تخطي التقطيع واستئناف البث تلقائياً 🛡️');
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
  }, [playerMode, isMultiViewMode, showToast]);

  // In-room channel switcher filtering
  const filteredSwitcherChannels = useMemo(() => {
    if (!switcherSearch.trim()) return channels;
    const q = switcherSearch.toLowerCase().trim();
    return channels.filter(
      c =>
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

  const toggleMultiViewLayout = () => {
    const next = !isMultiViewMode;
    setIsMultiViewMode(next);
    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set('multiview', '1');
      showToast('📺 تم تفعيل وضع الشاشة المتعددة (Multi-View)');
    } else {
      params.delete('multiview');
      showToast('تمت العودة لوضع الشاشة المفردة الكاملة');
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div
      className={`space-y-3 animate-in fade-in duration-200 transition-all ${
        isTheaterMode ? 'max-w-none w-full' : 'max-w-7xl mx-auto'
      }`}
      dir="rtl"
    >
      {/* Toast Feedback */}
      {qualityToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{qualityToast}</span>
        </div>
      )}

      {/* 1. VIDEO PLAYER FIRST — Top of Page on Mobile & Desktop */}
      {isMultiViewMode ? (
        <div className="space-y-3">
          {/* Multi-View Header Bar */}
          <div className="theme-surface border theme-border rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-stone-100">
                الشاشة المتعددة ({multiViewChannels.length}/4 قنوات)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {multiViewIds.length < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    const unused = channels.find(c => !multiViewIds.includes(c.id));
                    if (unused) {
                      setMultiViewIds(prev => [...prev, unused.id]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة قناة</span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleMultiViewLayout}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                إغلاق الشاشة المتعددة
              </button>
            </div>
          </div>

          {/* 2x2 or 2-Column Live Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {multiViewChannels.map((ch, idx) => (
              <MultiViewStreamCell
                key={`${idx}-${ch.id}`}
                channel={ch}
                allChannels={channels}
                isAudioActive={activeAudioSlotIndex === idx}
                onSelectAudio={() => setActiveAudioSlotIndex(idx)}
                onChangeChannel={newId => {
                  setMultiViewIds(prev => prev.map((oldId, i) => (i === idx ? newId : oldId)));
                }}
                onRemove={
                  multiViewChannels.length > 2
                    ? () => {
                        setMultiViewIds(prev => prev.filter((_, i) => i !== idx));
                        if (activeAudioSlotIndex === idx) setActiveAudioSlotIndex(0);
                      }
                    : undefined
                }
                onMakeSingle={() => {
                  setIsMultiViewMode(false);
                  const params = new URLSearchParams(searchParams);
                  params.delete('multiview');
                  setSearchParams(params, { replace: true });
                  navigate(`/watchroom/${ch.id}`);
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        /* SINGLE STREAM THEATER — Immediately visible at top of mobile & desktop */
        <div
          ref={containerRef}
          onClick={() => {
            if (isMuted) {
              handleForceUnmute();
            }
          }}
          className={`relative w-full bg-black rounded-2xl overflow-hidden border theme-border shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isTheaterMode ? 'aspect-[16/9] sm:aspect-[21/9] max-h-[75vh]' : 'aspect-video'
          }`}
        >
          {playerMode === 'direct' ? (
            <iframe
              ref={iframeRef}
              src={`https://dembed.st/embed/stream-${currentChannel.id}.php`}
              className="w-full h-full border-0 bg-black"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              title={currentChannel.name}
            />
          ) : (
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              onVolumeChange={e => {
                const v = e.currentTarget;
                setIsMuted(v.muted || v.volume === 0);
                setVolume(v.volume);
              }}
              className={`w-full h-full bg-black ${
                videoFit === 'cover' ? 'object-cover' : videoFit === 'fill' ? 'object-fill' : 'object-contain'
              }`}
              onPlaying={() => setPlayerStatus('playing')}
              onWaiting={() => setPlayerStatus('loading')}
            />
          )}

          {/* Prominent Floating Unmute Banner when Muted (in native video mode) */}
          {isMuted && playerMode !== 'direct' && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleForceUnmute();
              }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-emerald-500 hover:bg-emerald-400 text-stone-950 border border-emerald-200 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold shadow-2xl flex items-center gap-2 transition hover:scale-105 cursor-pointer whitespace-nowrap"
            >
              <Volume2 className="w-4 h-4 shrink-0" />
              <span>اضغط لتشغيل صوت البث</span>
            </button>
          )}

          {/* Optional Technical Stats Overlay (Only when explicitly toggled) */}
          {showStatsHud && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute top-3 left-3 z-20 bg-[#0b0c10]/90 backdrop-blur-md border border-stone-700/80 rounded-xl p-3 text-[11px] text-stone-300 space-y-1.5 shadow-2xl w-60 font-mono-num"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-1">
                <span className="font-sans font-bold text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>معلومات البث</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowStatsHud(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-stone-400">السيرفر:</span>
                <span className="text-stone-100 font-bold">
                  {playerMode === 'server1' ? 'Dembed FHD' : playerMode === 'server2' ? 'Cast CDN' : playerMode === 'server3' ? 'WideIPTV' : 'Direct Embed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-stone-400">الأبعاد:</span>
                <span className="text-emerald-400">{liveVideoDimensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-stone-400">التخزين المؤقت:</span>
                <span className="text-stone-100">{bufferHealthSec}s</span>
              </div>
            </div>
          )}

          {/* Compact Live Match Score Overlay */}
          {currentMatch && (
            <div className="absolute top-3 right-3 max-w-[240px] sm:max-w-xs z-20 pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 shadow-xl flex items-center justify-between gap-2.5 pointer-events-auto">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      currentMatch.status === 'LIVE' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-white truncate">
                    {currentMatch.teamA.name} ضد {currentMatch.teamB.name}
                  </span>
                </div>
                {currentMatch.scoreA !== null && currentMatch.scoreB !== null && (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono-num font-extrabold text-[11px] text-emerald-400 shrink-0">
                    {currentMatch.scoreA} - {currentMatch.scoreB}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Recovery State */}
          {playerStatus === 'error' && playerMode !== 'direct' && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20 space-y-3">
              <AlertCircle className="w-9 h-9 text-amber-400" />
              <div className="text-sm font-bold text-stone-100">تعذر تحميل البث عبر هذا السيرفر</div>
              <p className="text-xs text-stone-400 max-w-sm">
                يمكنك التبديل إلى سيرفر 4 (المشغل المباشر) للتشغيل الفوري، أو اختيار سيرفر آخر.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPlayerMode('direct');
                    setPlayerStatus('playing');
                    showToast('تم التبديل إلى سيرفر 4 (المشغل المباشر)');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition cursor-pointer"
                >
                  تشغيل عبر المشغل المباشر
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = playerMode === 'server1' ? 'server2' : playerMode === 'server2' ? 'server3' : 'server1';
                    setPlayerMode(next);
                    handleReload();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
                >
                  تجربة سيرفر آخر
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {playerStatus === 'loading' && playerMode !== 'direct' && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-stone-300 gap-2 z-10 pointer-events-none">
              <RotateCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs font-medium">جاري تشغيل البث المباشر...</span>
            </div>
          )}
        </div>
      )}

      {/* 2. COMPACT STREAM BAR — Channel Title, 3 Servers & Optional Collapsible Settings */}
      {!isMultiViewMode && (
        <div className="theme-surface border theme-border rounded-2xl p-3 space-y-2.5">
          {/* Row A: Channel Identity + Essential One-Tap Icons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono-num text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0">
                #{currentChannel.id}
              </span>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-stone-100 truncate">
                  {currentChannel.arabicName || currentChannel.name}
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span>{streamSourceInfo.currentResolution}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentChannel.lang || 'عربي'}</span>
                  {sleepTimerMinutes !== null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-400 font-mono-num">مؤقت: {sleepTimerMinutes}د</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Essential Actions (Unmute, Reload, Favorite, Fullscreen, Settings Drawer Trigger) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`min-h-[38px] px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isMuted
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800'
                }`}
                title="تشغيل أو كتم الصوت"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-stone-950" />
                    <span>تشغيل الصوت</span>
                  </>
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={handleReload}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="تحديث البث"
                aria-label="تحديث البث"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(currentChannel.id)}
                className={`min-h-[38px] min-w-[38px] rounded-xl border flex items-center justify-center transition cursor-pointer ${
                  isFavorite(currentChannel.id)
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-400 hover:text-white'
                }`}
                title="إضافة للمفضلة"
                aria-label="المفضلة"
              >
                <Star className={`w-4 h-4 ${isFavorite(currentChannel.id) ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white hidden sm:flex items-center justify-center transition cursor-pointer"
                title="ملء الشاشة"
                aria-label="ملء الشاشة"
              >
                <Maximize className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setQualityMenuOpen(prev => !prev)}
                className={`min-h-[38px] px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  qualityMenuOpen
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-300 hover:text-white'
                }`}
                title="إعدادات البث المتقدمة"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline sm:inline">الإعدادات</span>
              </button>
            </div>
          </div>

          {/* Row B: Clean Single-Row 4-Server Segmented Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-stone-800/60">
            <button
              type="button"
              onClick={() => {
                setPlayerMode('server1');
                showToast('تم التبديل إلى سيرفر 1 (الرئيسي FHD)');
              }}
              className={`min-h-[38px] px-2 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap ${
                playerMode === 'server1'
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-stone-900/80 hover:bg-stone-800 border border-stone-800/80 text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">سيرفر 1 (الرئيسي)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlayerMode('server2');
                showToast('تم التبديل إلى سيرفر 2 (Cast البديل)');
              }}
              className={`min-h-[38px] px-2 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap ${
                playerMode === 'server2'
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-stone-900/80 hover:bg-stone-800 border border-stone-800/80 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">سيرفر 2 (Cast)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlayerMode('server3');
                showToast('تم التبديل إلى سيرفر 3 (Wide الاحتياطي)');
              }}
              className={`min-h-[38px] px-2 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap ${
                playerMode === 'server3'
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-stone-900/80 hover:bg-stone-800 border border-stone-800/80 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">سيرفر 3 (Wide)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlayerMode('direct');
                setPlayerStatus('playing');
                showToast('تم التبديل إلى سيرفر 4 (المشغل المباشر)');
              }}
              className={`min-h-[38px] px-2 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap ${
                playerMode === 'direct'
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-stone-900/80 hover:bg-stone-800 border border-stone-800/80 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">سيرفر 4 (مباشر)</span>
            </button>
          </div>

          {/* Collapsible Advanced Settings Drawer (Hidden by default so mobile stays clean!) */}
          {qualityMenuOpen && (
            <div className="pt-3 mt-2 border-t border-stone-800 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>إعدادات البث المتقدمة وأدوات المشغل</span>
                </span>
                <button
                  type="button"
                  onClick={() => setQualityMenuOpen(false)}
                  className="text-xs text-stone-400 hover:text-white px-2 py-0.5 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer"
                >
                  إغلاق ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Group 1: Quality & Anti-Lag Buffer */}
                <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-stone-300">الجودة ومنع التقطيع</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleBufferMode('anti-lag')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        bufferMode === 'anti-lag'
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                          : 'bg-stone-950 border-stone-800 text-stone-400'
                      }`}
                    >
                      🛡️ مانع التقطيع
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBufferMode('low-latency')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        bufferMode === 'low-latency'
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                          : 'bg-stone-950 border-stone-800 text-stone-400'
                      }`}
                    >
                      ⚡ بث فوري لحظي
                    </button>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {QUALITY_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectQuality(opt.id)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono-num border transition cursor-pointer ${
                          selectedQuality === opt.id
                            ? 'bg-emerald-500 text-stone-950 border-emerald-400 font-bold'
                            : 'bg-stone-950 border-stone-800 text-stone-300 hover:text-white'
                        }`}
                      >
                        {opt.badge}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group 2: Audio & Display Controls */}
                <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-stone-300">الصوت وأبعاد الشاشة</div>
                  <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 px-2.5 py-1.5 rounded-lg">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                      aria-label="مستوى الصوت"
                    />
                    <span className="text-[11px] font-mono-num text-stone-300 w-9 text-left">
                      {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleAudioBoost}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer truncate ${
                        isAudioBoosted
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-stone-950 border-stone-800 text-stone-300'
                      }`}
                    >
                      {isAudioBoosted ? '🔊 المضخم نشط (+80%)' : 'تقوية صوت المعلق'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCycleVideoFit}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 hover:text-white text-[11px] font-bold transition cursor-pointer truncate"
                    >
                      الأبعاد: {videoFit === 'contain' ? 'قياسي' : videoFit === 'cover' ? 'ملء' : 'تمديد'}
                    </button>
                  </div>
                </div>

                {/* Group 3: Extra Stream Tools */}
                <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-stone-300">أدوات إضافية</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={toggleMultiViewLayout}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Grid className="w-3.5 h-3.5 text-emerald-400" />
                      <span>شاشة متعددة</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncLiveEdge}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-rose-400" />
                      <span>مزامنة المباشر</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCycleSleepTimer}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{sleepTimerMinutes !== null ? `${sleepTimerMinutes} د` : 'مؤقت النوم'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{copiedLink ? 'تم النسخ!' : 'مشاركة القناة'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleStepChannel(-1)}
                      className="flex-1 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3 text-emerald-400" />
                      <span>القناة السابقة</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTogglePiP}
                      className="px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 cursor-pointer"
                      title="صورة داخل صورة"
                    >
                      PiP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepChannel(1)}
                      className="flex-1 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>القناة التالية</span>
                      <ChevronLeft className="w-3 h-3 text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Tabs: In-Room Channel Switcher vs Today's Live Fixtures */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveRoomTab('switcher')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeRoomTab === 'switcher'
                  ? 'bg-emerald-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>القنوات ({channels.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRoomTab('schedule')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeRoomTab === 'schedule'
                  ? 'bg-emerald-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>مباريات اليوم ({matches.length})</span>
            </button>
          </div>

          {activeRoomTab === 'switcher' && (
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={switcherSearch}
                onChange={e => {
                  setSwitcherSearch(e.target.value);
                  setSwitcherPage(1);
                }}
                placeholder="ابحث عن قناة أو رقم..."
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
                const inMulti = multiViewIds.includes(ch.id);
                return (
                  <div
                    key={ch.id}
                    className={`p-2.5 rounded-xl text-right transition border flex flex-col justify-between h-24 ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-bold'
                        : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800/80 text-stone-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono-num text-[10px] opacity-70">#{ch.id}</span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setMultiViewIds(prev => {
                            if (prev.includes(ch.id)) return prev.filter(id => id !== ch.id);
                            const next = prev.length >= 4 ? [...prev.slice(1), ch.id] : [...prev, ch.id];
                            return next;
                          });
                          if (!isMultiViewMode) {
                            setIsMultiViewMode(true);
                          }
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                          inMulti
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                        }`}
                        title="إضافة للشاشة المتعددة"
                      >
                        {inMulti ? 'في المتعددة ✓' : '+ متعددة'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isActive) {
                          navigate(`/watchroom/${ch.id}`);
                        }
                      }}
                      className="text-right w-full cursor-pointer"
                    >
                      <div className="text-xs truncate font-medium">
                        {ch.arabicName || ch.name}
                      </div>
                      <div className="text-[10px] opacity-50 font-mono-num flex items-center justify-between mt-0.5">
                        <span>{ch.quality || '1080p'}</span>
                        <Play className="w-2.5 h-2.5 text-emerald-400 fill-current" />
                      </div>
                    </button>
                  </div>
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
                {matches.slice(0, 16).map(m => {
                  const isCurrentOnAir = m.channels && m.channels.some(c => Number(c.channel_id) === Number(currentChannel.id));
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
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
                            <span className="text-[10px] text-rose-400 font-bold">
                              · مباشر الآن
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-stone-200 truncate">
                          {m.teamA.name} {m.scoreA !== null ? `${m.scoreA} - ${m.scoreB}` : 'ضد'} {m.teamB.name}
                        </div>
                      </div>

                      {m.channels && m.channels.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          {m.channels.slice(0, 2).map(ch => {
                            const isThisChannel = Number(ch.channel_id) === Number(currentChannel.id);
                            return (
                              <button
                                key={ch.channel_id}
                                type="button"
                                onClick={() => {
                                  if (!isThisChannel) {
                                    navigate(`/watchroom/${ch.channel_id}`);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 transition cursor-pointer ${
                                  isThisChannel
                                    ? 'bg-emerald-500 text-stone-950'
                                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                                }`}
                              >
                                {isThisChannel ? `تبث هنا (${ch.channel_name})` : `${ch.channel_name}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
