import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Hls from 'hls.js';
import {
  RotateCw,
  Maximize,
  Tv,
  AlertCircle,
  Calendar,
  Check,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Play,
  Share2,
  Grid,
  Plus,
  X
} from 'lucide-react';
import { useApp, getApiUrl } from '../context/AppContext';
import { Channel, QualityResolution } from '../types';
import { usePageSeo } from '../hooks/usePageSeo';
import { getChannelBrandIdentity } from '../utils/channelBranding';

interface QualityOptionItem {
  id: QualityResolution;
  badge: string;
}

const QUALITY_OPTIONS: QualityOptionItem[] = [
  { id: 'auto', badge: 'تلقائي' },
  { id: '1080p', badge: '1080p' },
  { id: '720p', badge: '720p' },
  { id: '480p', badge: '480p' }
];

// Clean, standard Hls.js configuration for live MPEG-TS streams (no nudging or frame-jumping)
function createCleanHlsInstance(): Hls {
  return new Hls({
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 30,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: 10,
    enableSoftwareAES: true,
    manifestLoadingTimeOut: 15000,
    manifestLoadingMaxRetry: 4,
    levelLoadingTimeOut: 15000,
    levelLoadingMaxRetry: 4,
    fragLoadingTimeOut: 20000,
    fragLoadingMaxRetry: 6
  });
}

// Self-contained Multi-Screen Cell Player
const MultiViewCellPlayer: React.FC<{
  channel: Channel;
  allChannels: Channel[];
  isAudioActive: boolean;
  onSelectAudio: () => void;
  onChangeChannel: (newChannelId: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}> = ({
  channel,
  allChannels,
  isAudioActive,
  onSelectAudio,
  onChangeChannel,
  onRemove,
  canRemove
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [sourceMode, setSourceMode] = useState<'dembed' | 'cast' | 'wide'>('dembed');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setStatus('loading');

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = getApiUrl(
      `/api/proxy-stream/${channel.id}/live.m3u8?source=${sourceMode}`
    );

    if (Hls.isSupported()) {
      const hls = createCleanHlsInstance();
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = !isAudioActive;
        video
          .play()
          .then(() => setStatus('playing'))
          .catch(() => {
            video.muted = true;
            video.play().catch(() => {});
            setStatus('playing');
          });
      });

      let errCount = 0;
      hls.on(Hls.Events.ERROR, (_ev, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          errCount++;
          if (errCount <= 2) {
            hls.startLoad();
          } else if (sourceMode === 'dembed') {
            setSourceMode('cast');
          } else {
            setStatus('error');
          }
        } else {
          setStatus('error');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.muted = !isAudioActive;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        setStatus('playing');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.id, sourceMode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isAudioActive;
    if (isAudioActive) {
      video.volume = 1.0;
      video.play().catch(() => {});
    }
  }, [isAudioActive]);

  const brand = getChannelBrandIdentity(channel);

  return (
    <div
      onClick={onSelectAudio}
      className={`relative rounded-2xl overflow-hidden bg-black border transition-all flex flex-col ${
        isAudioActive
          ? 'border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg'
          : 'border-stone-800 hover:border-stone-700'
      }`}
    >
      {/* Cell Header */}
      <div className="bg-[#101218] px-3 py-2 border-b border-stone-800/80 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold shrink-0 ${brand.badgeBg}`}
          >
            {brand.channelShortCode}
          </span>
          <select
            value={channel.id}
            onChange={e => onChangeChannel(Number(e.target.value))}
            onClick={e => e.stopPropagation()}
            className="bg-[#090b0f] border border-stone-800 rounded-lg px-2 py-1 text-xs font-bold text-stone-100 truncate max-w-[180px] focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {allChannels.slice(0, 45).map(ch => (
              <option key={ch.id} value={ch.id}>
                {ch.arabicName || ch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSelectAudio();
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
              isAudioActive
                ? 'bg-emerald-500 text-stone-950'
                : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
            }`}
            title="تفعيل الصوت لهذه الشاشة"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="w-3 h-3" />
                <span>الصوت مفعل</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3" />
                <span>صامت</span>
              </>
            )}
          </button>

          {canRemove && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 rounded-lg bg-stone-900 hover:bg-rose-950/60 border border-stone-800 text-stone-400 hover:text-rose-300 transition cursor-pointer"
              title="إغلاق هذه الشاشة"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Video Surface */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          controls
          className="w-full h-full object-contain bg-black"
          onPlaying={() => setStatus('playing')}
        />
        {status === 'loading' && (
          <div className="absolute inset-0 bg-black/65 flex items-center justify-center pointer-events-none">
            <RotateCw className="w-5 h-5 animate-spin text-emerald-400" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-3 text-center gap-2">
            <span className="text-xs text-stone-300 font-bold">تعذر تشغيل هذا المصدر</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSourceMode(prev => (prev === 'dembed' ? 'cast' : 'wide'));
              }}
              className="px-3 py-1 rounded-lg bg-emerald-500 text-stone-950 text-[11px] font-bold cursor-pointer"
            >
              تجربة سيرفر بديل
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const WatchRoomPage: React.FC = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    channels,
    loadingChannels,
    matches,
    addToWatchHistory,
    setActiveStreamingChannel,
    multiViewIds,
    setMultiViewIds
  } = useApp();

  // Dynamically resolved metadata for channels opened directly via URL
  const [resolvedMeta, setResolvedMeta] = useState<{
    id: number;
    name: string;
    lang: string;
    category: Channel['category'];
  } | null>(null);

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

  // Target channel
  const currentChannel = useMemo<Channel | null>(() => {
    if (channelId) {
      const found = channels.find(c => String(c.id) === String(channelId));
      if (found) return found;

      const numId = parseInt(channelId, 10);
      if (!isNaN(numId) && numId > 0) {
        const dynamicName =
          resolvedMeta && resolvedMeta.id === numId ? resolvedMeta.name : `Channel #${numId}`;
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
      ? `مشاهدة ${currentChannel.arabicName || currentChannel.name} بث مباشر – kolstream`
      : 'غرفة المشاهدة المباشرة – kolstream',
    description: currentChannel
      ? `شاهد البث المباشر لقناة ${currentChannel.arabicName || currentChannel.name} بجودة عالية على kolstream.`
      : 'بث مباشر للقنوات الرياضية على مدار الساعة.',
    canonicalPath: currentChannel ? `/watchroom/${currentChannel.id}` : '/watchroom'
  });

  // Clean 4-server state: server1, server2, server3, direct
  const [playerMode, setPlayerMode] = useState<'server1' | 'server2' | 'server3' | 'direct'>('server1');
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState<number>(0);
  const [selectedQuality, setSelectedQuality] = useState<QualityResolution>('auto');
  const [hasMultipleLevels, setHasMultipleLevels] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subtle Multi-Screen state (strictly controlled from Watch Room player bar)
  const [isMultiViewMode, setIsMultiViewMode] = useState<boolean>(() => {
    return searchParams.get('multiview') === '1';
  });
  const [activeAudioSlotIndex, setActiveAudioSlotIndex] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  }, []);

  // Sync active streaming channel and scroll to top on channel change
  useEffect(() => {
    if (currentChannel) {
      setActiveStreamingChannel(currentChannel);
      addToWatchHistory(currentChannel.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChannel, setActiveStreamingChannel, addToWatchHistory]);

  // Active match on this channel if any
  const currentMatch = useMemo(() => {
    if (!currentChannel) return null;
    return matches.find(
      m => m.channels && m.channels.some(c => Number(c.channel_id) === Number(currentChannel.id))
    );
  }, [matches, currentChannel]);

  // Related channels in the same network (compact 8-channel quick switcher)
  const relatedChannels = useMemo(() => {
    if (!currentChannel) return [];
    const sameCategory = channels.filter(
      c => c.id !== currentChannel.id && (c.subcat === currentChannel.subcat || c.category === currentChannel.category)
    );
    const list = sameCategory.length >= 8 ? sameCategory : channels.filter(c => c.id !== currentChannel.id);
    return list.slice(0, 8);
  }, [channels, currentChannel]);

  // Toggle Multi-Screen mode subtly from the player bar
  const handleToggleMultiView = useCallback(() => {
    if (!isMultiViewMode) {
      if (currentChannel) {
        const nextIds = [...multiViewIds];
        if (!nextIds.includes(currentChannel.id)) {
          nextIds.unshift(currentChannel.id);
        }
        if (nextIds.length < 2) {
          const fallbackSecond =
            channels.find(c => c.id !== currentChannel.id && c.id >= 91 && c.id <= 99) ||
            channels.find(c => c.id !== currentChannel.id);
          if (fallbackSecond) nextIds.push(fallbackSecond.id);
        }
        setMultiViewIds(nextIds.slice(0, 4));
      }
      setIsMultiViewMode(true);
      showToast('تم تفعيل وضع الشاشة المتعددة');
    } else {
      setIsMultiViewMode(false);
      showToast('تم العودة إلى الشاشة المفردة');
    }
  }, [isMultiViewMode, currentChannel, multiViewIds, channels, setMultiViewIds, showToast]);

  const handleAddMultiViewSlot = useCallback(() => {
    if (multiViewIds.length >= 4) return;
    const candidate =
      channels.find(c => !multiViewIds.includes(c.id) && c.id >= 91 && c.id <= 99) ||
      channels.find(c => !multiViewIds.includes(c.id));
    if (candidate) {
      setMultiViewIds(prev => [...prev, candidate.id].slice(0, 4));
    }
  }, [multiViewIds, channels, setMultiViewIds]);

  const handleReload = useCallback(() => {
    setPlayerStatus('loading');
    setRetryKey(prev => prev + 1);
    showToast('جاري تحديث البث المباشر...');
  }, [showToast]);

  const handleStepChannel = useCallback(
    (delta: number) => {
      if (!currentChannel || channels.length === 0) return;
      const idx = channels.findIndex(c => c.id === currentChannel.id);
      const nextIndex = idx === -1 ? 0 : (idx + delta + channels.length) % channels.length;
      const target = channels[nextIndex];
      if (target) {
        navigate(`/watchroom/${target.id}`);
      }
    },
    [currentChannel, channels, navigate]
  );

  const handleToggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
  }, []);

  const handleForceUnmute = useCallback(() => {
    setIsMuted(false);
    const targetVol = volume > 0.05 ? volume : 1.0;
    setVolume(targetVol);
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = targetVol;
      videoRef.current.play().catch(() => {});
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_MUTE', muted: false }, '*');
    }
  }, [volume]);

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

    const targetHeight =
      quality === '1080p' ? 1080 : quality === '720p' ? 720 : quality === '480p' ? 480 : 360;

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

  const handleSelectQuality = (quality: QualityResolution) => {
    setSelectedQuality(quality);
    applyQualityToHls(quality);
    showToast(`تم اختيار الجودة: ${quality === 'auto' ? 'تلقائي' : quality}`);
  };

  // Smooth, Anti-Stutter HLS Video Player
  useEffect(() => {
    if (isMultiViewMode) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    if (!currentChannel || playerMode === 'direct') {
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

    const sourceParam =
      playerMode === 'server1' ? 'dembed' : playerMode === 'server2' ? 'cast' : 'wide';
    const streamUrl = getApiUrl(
      `/api/proxy-stream/${currentChannel.id}/live.m3u8?source=${sourceParam}&r=${retryKey}`
    );

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
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .then(() => setPlayerStatus('playing'))
            .catch(() => setPlayerStatus('playing'));
        });
    };

    if (Hls.isSupported()) {
      const hls = createCleanHlsInstance();
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const lvls = hls.levels || [];
        setHasMultipleLevels(lvls.length > 1);
        applyQualityToHls(selectedQuality);
        tryPlayDirect();
      });

      let netErrorCount = 0;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            netErrorCount++;
            if (netErrorCount <= 3) {
              hls.startLoad();
            } else if (playerMode === 'server1') {
              setPlayerMode('server2');
            } else {
              setPlayerStatus('error');
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
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', tryPlayDirect, { once: true });
      video.addEventListener('error', () => setPlayerStatus('error'), { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel?.id, retryKey, playerMode, isMultiViewMode, applyQualityToHls, selectedQuality]);

  if (loadingChannels && !currentChannel) {
    return (
      <div className="py-24 text-center space-y-3" dir="rtl">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-stone-400">جاري تجهيز المشغل...</div>
      </div>
    );
  }

  if (!currentChannel) {
    return (
      <div
        className="py-24 text-center border border-dashed border-stone-800 rounded-2xl p-8 space-y-3"
        dir="rtl"
      >
        <AlertCircle className="w-8 h-8 text-stone-500 mx-auto" />
        <div className="text-sm font-semibold text-stone-200">القناة المطلوبة غير متوفرة</div>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 hover:text-white transition cursor-pointer"
        >
          العودة إلى دليل القنوات
        </button>
      </div>
    );
  }

  const brand = getChannelBrandIdentity(currentChannel);

  const activeMultiChannels = multiViewIds
    .map(id => channels.find(c => c.id === id))
    .filter((c): c is Channel => Boolean(c));

  return (
    <div
      className={`space-y-5 animate-in fade-in duration-200 ${
        isTheaterMode || isMultiViewMode ? 'max-w-none w-full' : 'max-w-6xl mx-auto'
      }`}
      dir="rtl"
    >
      {/* Subtle Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Bar Above Player: Channel Identity + Clean Server 1-4 Switcher */}
      <div className="bg-[#101218] border border-stone-800/90 rounded-2xl p-3.5 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg font-extrabold shrink-0 ${brand.badgeBg}`}
          >
            {brand.badgeText}
          </span>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white truncate">
              {currentChannel.arabicName || currentChannel.name}
            </h1>
            <p className="text-[11px] text-stone-400 truncate">
              {currentMatch
                ? `${currentMatch.competition}: ${currentMatch.teamA.name} ضد ${currentMatch.teamB.name}`
                : brand.networkSubLabel}
            </p>
          </div>
        </div>

        {/* Clean Server 1-4 Buttons (or Multi-Screen Controls when active) */}
        {isMultiViewMode ? (
          <div className="flex items-center gap-2 flex-wrap">
            {activeMultiChannels.length < 4 && (
              <button
                type="button"
                onClick={handleAddMultiViewSlot}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة قناة ({activeMultiChannels.length}/4)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleMultiView}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
            >
              إنهاء الشاشة المتعددة
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              { id: 'server1', label: 'سيرفر 1 (أساسي)' },
              { id: 'server2', label: 'سيرفر 2 (بديل مستقر)' },
              { id: 'server3', label: 'سيرفر 3' },
              { id: 'direct', label: 'سيرفر 4 (مباشر)' }
            ] as const).map(srv => {
              const active = playerMode === srv.id;
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => {
                    setPlayerMode(srv.id);
                    if (srv.id === 'direct') setPlayerStatus('playing');
                    showToast(`تم التبديل إلى ${srv.label}`);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-stone-950 shadow-sm'
                      : 'bg-[#090b0f] hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  {srv.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Video Player Viewport (Single Stream OR Multi-Screen 2x2 Grid) */}
      {isMultiViewMode ? (
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#090b0f] p-3 rounded-2xl border border-stone-800/90"
        >
          {activeMultiChannels.map((ch, idx) => (
            <MultiViewCellPlayer
              key={`${ch.id}_${idx}`}
              channel={ch}
              allChannels={channels}
              isAudioActive={activeAudioSlotIndex === idx}
              onSelectAudio={() => setActiveAudioSlotIndex(idx)}
              onChangeChannel={newId => {
                setMultiViewIds(prev => {
                  const copy = [...prev];
                  copy[idx] = newId;
                  return copy;
                });
              }}
              onRemove={() => {
                const next = multiViewIds.filter((_, i) => i !== idx);
                setMultiViewIds(next);
                if (next.length <= 1) {
                  setIsMultiViewMode(false);
                }
              }}
              canRemove={activeMultiChannels.length > 2}
            />
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          onClick={() => {
            if (isMuted) handleForceUnmute();
          }}
          className={`relative w-full bg-black rounded-2xl overflow-hidden border border-stone-800/90 shadow-2xl flex items-center justify-center ${
            isTheaterMode ? 'aspect-[16/9] sm:aspect-[21/9] max-h-[78vh]' : 'aspect-video'
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
              className="w-full h-full bg-black object-contain"
              onPlaying={() => setPlayerStatus('playing')}
              onCanPlay={() => setPlayerStatus('playing')}
            />
          )}

          {/* Unmute Prompt if Browser Autoplay Muted */}
          {isMuted && playerMode !== 'direct' && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleForceUnmute();
              }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-500 hover:bg-emerald-400 text-stone-950 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold shadow-2xl flex items-center gap-2 transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4 shrink-0" />
              <span>اضغط لتشغيل صوت البث</span>
            </button>
          )}

          {/* Error Recovery */}
          {playerStatus === 'error' && playerMode !== 'direct' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center z-20 space-y-3">
              <AlertCircle className="w-9 h-9 text-amber-400" />
              <div className="text-sm font-bold text-stone-100">تعذر الاتصال بهذا السيرفر حالياً</div>
              <p className="text-xs text-stone-400 max-w-sm">
                يرجى اختيار سيرفر آخر من الأزرار بالأعلى أو الانتقال إلى المشغل المباشر.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const next =
                      playerMode === 'server1'
                        ? 'server2'
                        : playerMode === 'server2'
                        ? 'server3'
                        : 'direct';
                    setPlayerMode(next);
                    if (next === 'direct') setPlayerStatus('playing');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs transition cursor-pointer"
                >
                  التبديل للسيرفر البديل
                </button>
                <button
                  type="button"
                  onClick={handleReload}
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          )}

          {/* Initial Loading Spinner (only shown before playback begins) */}
          {playerStatus === 'loading' && playerMode !== 'direct' && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-stone-300 gap-2 z-10 pointer-events-none">
              <RotateCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs font-medium">جاري الاتصال بالبث المباشر...</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Essential Consumer Player Controls Bar (including subtle Multi-Screen button) */}
      <div className="bg-[#101218] border border-stone-800/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Prev/Next Channel Zapper */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStepChannel(-1)}
            className="px-3 py-2 rounded-xl bg-[#090b0f] hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>القناة السابقة</span>
          </button>
          <button
            type="button"
            onClick={() => handleStepChannel(1)}
            className="px-3 py-2 rounded-xl bg-[#090b0f] hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <span>القناة التالية</span>
            <ChevronLeft className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>

        {/* Right: Mute, Quality, Reload, Subtle Multi-Screen Toggle, Theater, Fullscreen, Share */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isMultiViewMode && hasMultipleLevels && playerMode !== 'direct' && (
            <div className="flex items-center gap-1 bg-[#090b0f] border border-stone-800 rounded-xl p-1">
              {QUALITY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectQuality(opt.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono-num transition cursor-pointer ${
                    selectedQuality === opt.id
                      ? 'bg-emerald-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {opt.badge}
                </button>
              ))}
            </div>
          )}

          {!isMultiViewMode && (
            <button
              type="button"
              onClick={handleToggleMute}
              className="px-3 py-2 rounded-xl bg-[#090b0f] hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span>إلغاء الكتم</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">الصوت</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleReload}
            className="px-3 py-2 rounded-xl bg-[#090b0f] hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            title="إعادة تحميل البث"
          >
            <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>تحديث</span>
          </button>

          {/* Subtle Multi-Screen Toggle Button (Strictly in Player Bar Only) */}
          <button
            type="button"
            onClick={handleToggleMultiView}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isMultiViewMode
                ? 'bg-purple-600/30 border-purple-400 text-white'
                : 'bg-[#090b0f] hover:bg-stone-800 border-stone-800 text-stone-300 hover:text-white'
            }`}
            title="تشغيل أكثر من قناة في وقت واحد"
          >
            <Grid className="w-3.5 h-3.5 text-purple-400" />
            <span>شاشة متعددة</span>
          </button>

          {!isMultiViewMode && (
            <button
              type="button"
              onClick={() => setIsTheaterMode(prev => !prev)}
              className="hidden md:flex px-3 py-2 rounded-xl bg-[#090b0f] hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white items-center gap-1.5 transition cursor-pointer"
            >
              <span>{isTheaterMode ? 'الحجم العادي' : 'وضع المسرح'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-3 py-2 rounded-xl bg-[#090b0f] hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <Maximize className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">ملء الشاشة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('تم نسخ رابط القناة');
            }}
            className="p-2 rounded-xl bg-[#090b0f] hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition cursor-pointer"
            title="نسخ رابط القناة"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Compact Related Channels Strip */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
            <Tv className="w-4 h-4 text-purple-400" />
            <span>قنوات رياضية ذات صلة</span>
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => navigate('/schedual')}
              className="text-stone-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>جدول المباريات</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="text-emerald-400 hover:underline font-bold cursor-pointer"
            >
              كل القنوات ←
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {relatedChannels.map(ch => {
            const relBrand = getChannelBrandIdentity(ch);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => navigate(`/watchroom/${ch.id}`)}
                className="group rounded-xl border border-stone-800 hover:border-stone-600 bg-[#101218] overflow-hidden text-right transition cursor-pointer flex flex-col justify-between"
              >
                <div
                  className="h-14 p-2.5 flex items-center justify-between text-white bg-cover bg-center"
                  style={{
                    backgroundImage: `${relBrand.svgPatternUrl}, ${relBrand.backgroundCss}`
                  }}
                >
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold ${relBrand.badgeBg}`}
                  >
                    {relBrand.channelShortCode}
                  </span>
                  <Play className="w-3.5 h-3.5 text-white fill-current opacity-80 group-hover:opacity-100" />
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-bold text-stone-100 truncate group-hover:text-emerald-400 transition">
                    {ch.arabicName || ch.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
