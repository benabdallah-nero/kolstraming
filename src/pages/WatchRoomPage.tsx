import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Hls from 'hls.js';
import {
  RotateCw,
  Maximize,
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
import { getAuthorizedStreamUrl } from '../services/streamAuth';
import { Channel, QualityResolution } from '../types';
import { usePageSeo } from '../hooks/usePageSeo';
import { getChannelBrandIdentity } from '../utils/channelBranding';
import { formatBroadcastMinute } from '../utils/broadcastFormatters';

interface QualityOptionItem {
  id: QualityResolution;
  badge: string;
}

const QUALITY_OPTIONS: QualityOptionItem[] = [
  { id: 'auto', badge: 'AUTO' },
  { id: '1080p', badge: '1080P' },
  { id: '720p', badge: '720P' },
  { id: '480p', badge: '480P' }
];

// Clean, standard Hls.js configuration for live MPEG-TS streams
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

    let cancelled = false;

    getAuthorizedStreamUrl(channel.id, sourceMode).then(streamUrl => {
      if (cancelled || !videoRef.current) return;

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
    });

    return () => {
      cancelled = true;
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

  return (
    <div
      onClick={onSelectAudio}
      className={`relative rounded-[2px] overflow-hidden bg-black border transition-colors flex flex-col ${
        isAudioActive
          ? 'border-[var(--accent-primary)]'
          : 'border-[var(--border-hairline)] hover:border-[var(--border-strong)]'
      }`}
    >
      {/* Cell Header */}
      <div className="bg-[var(--bg-surface)] px-3 py-2 border-b border-[var(--border-hairline)] flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-display-num text-xs font-extrabold px-1.5 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--accent-primary)] shrink-0">
            CH {String(channel.id).padStart(2, '0')}
          </span>
          <select
            value={channel.id}
            onChange={e => onChangeChannel(Number(e.target.value))}
            onClick={e => e.stopPropagation()}
            className="bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-[2px] px-2 py-1 text-xs font-bold text-[var(--text-primary)] truncate max-w-[180px] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
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
            className={`px-2 py-1 rounded-[2px] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              isAudioActive
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold'
                : 'bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="تفعيل الصوت لهذه الشاشة"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="w-3 h-3" />
                <span>الصوت نشط</span>
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
              className="p-1 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--signal-live)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
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
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none">
            <RotateCw className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-3 text-center gap-2">
            <span className="text-xs text-[var(--text-primary)] font-bold">انقطع الاتصال بهذا المصدر</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSourceMode(prev => (prev === 'dembed' ? 'cast' : 'wide'));
              }}
              className="px-3 py-1 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-extrabold cursor-pointer"
            >
              تبديل المصدر الاحتياطي
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
      .then(r => (r.ok ? (r.json() as Promise<any>) : null))
      .then((data: any) => {
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

  const [playerMode, setPlayerMode] = useState<'server1' | 'server2' | 'server3'>('server1');
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState<number>(0);
  const [selectedQuality, setSelectedQuality] = useState<QualityResolution>('auto');
  const [hasMultipleLevels, setHasMultipleLevels] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isMultiViewMode, setIsMultiViewMode] = useState<boolean>(() => {
    return searchParams.get('multiview') === '1';
  });
  const [activeAudioSlotIndex, setActiveAudioSlotIndex] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  }, []);

  useEffect(() => {
    if (currentChannel) {
      setActiveStreamingChannel(currentChannel);
      addToWatchHistory(currentChannel.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChannel, setActiveStreamingChannel, addToWatchHistory]);

  const currentMatch = useMemo(() => {
    if (!currentChannel) return null;
    return matches.find(
      m => m.channels && m.channels.some(c => Number(c.channel_id) === Number(currentChannel.id))
    );
  }, [matches, currentChannel]);

  const relatedChannels = useMemo(() => {
    if (!currentChannel) return [];
    const sameCategory = channels.filter(
      c => c.id !== currentChannel.id && (c.subcat === currentChannel.subcat || c.category === currentChannel.category)
    );
    const list = sameCategory.length >= 8 ? sameCategory : channels.filter(c => c.id !== currentChannel.id);
    return list.slice(0, 8);
  }, [channels, currentChannel]);

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
    showToast('جاري إعادة الاتصال بمصدر البث...');
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
    showToast(`تم اختيار الدقة: ${quality === 'auto' ? 'تلقائي' : quality}`);
  };

  useEffect(() => {
    if (isMultiViewMode) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    if (!currentChannel) {
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

    let cancelled = false;
    const sourceParam =
      playerMode === 'server1' ? 'dembed' : playerMode === 'server2' ? 'cast' : 'wide';

    getAuthorizedStreamUrl(currentChannel.id, sourceParam, retryKey).then(streamUrl => {
      if (cancelled || !videoRef.current) return;

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
    });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel?.id, retryKey, playerMode, isMultiViewMode, applyQualityToHls, selectedQuality]);

  if (loadingChannels && !currentChannel) {
    return (
      <div className="py-24 text-center space-y-3 border border-[var(--border-hairline)] bg-[var(--bg-surface)]" dir="rtl">
        <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-[var(--text-secondary)] font-bold">جاري تهيئة وحدة البث المباشر...</div>
      </div>
    );
  }

  if (!currentChannel) {
    return (
      <div
        className="py-20 text-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-[2px] p-8 space-y-3"
        dir="rtl"
      >
        <div className="font-display-num text-2xl font-extrabold text-[var(--text-muted)]">
          SIGNAL UNAVAILABLE
        </div>
        <div className="text-sm font-bold text-[var(--text-primary)]">القناة المطلوبة غير متوفرة حالياً</div>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-extrabold transition cursor-pointer"
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
      className={`space-y-4 ${
        isTheaterMode || isMultiViewMode ? 'max-w-none w-full' : 'max-w-6xl mx-auto'
      }`}
      dir="rtl"
    >
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-surface)] border border-[var(--accent-primary)] text-[var(--accent-primary)] px-4 py-2 rounded-[2px] text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. BROADCAST LOWER-THIRD SCOREBOARD & SERVER SWITCHER HEADER */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] flex flex-col lg:flex-row lg:items-stretch justify-between">
        {/* Channel Call-Sign + Active Match Scoreline */}
        <div className="flex items-stretch min-w-0 border-b lg:border-b-0 border-[var(--border-hairline)]">
          <div className="w-20 bg-[var(--bg-canvas)] border-l border-[var(--border-hairline)] flex flex-col items-center justify-center px-2 py-2.5 shrink-0">
            <span className="font-display-num text-2xl font-extrabold text-[var(--accent-primary)] leading-none">
              CH {String(currentChannel.id).padStart(2, '0')}
            </span>
            <span className="font-display-num text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1">
              {brand.badgeText}
            </span>
          </div>

          <div className="px-4 py-2.5 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full live-dot-pulse shrink-0" />
              <h1 className="font-display-ar text-base sm:text-lg font-extrabold text-[var(--text-primary)] truncate">
                {currentChannel.arabicName || currentChannel.name}
              </h1>
            </div>

            {currentMatch ? (
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="text-[var(--text-secondary)] truncate">
                  {currentMatch.competition}:
                </span>
                <span className="font-bold text-[var(--accent-primary)] truncate">
                  {currentMatch.teamA.name}{' '}
                  {currentMatch.scoreA !== null && currentMatch.scoreB !== null
                    ? `(${currentMatch.scoreA} - ${currentMatch.scoreB})`
                    : 'ضد'}{' '}
                  {currentMatch.teamB.name}
                </span>
                {currentMatch.status === 'LIVE' && (
                  <span className="font-display-num text-xs font-extrabold text-[var(--signal-live)]">
                    [{formatBroadcastMinute(currentMatch.minute)}]
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                {brand.networkSubLabel} · جودة {currentChannel.quality || '1080p FHD'}
              </p>
            )}
          </div>
        </div>

        {/* Server 1-4 Switcher Matrix */}
        {isMultiViewMode ? (
          <div className="p-2.5 flex items-center gap-2 flex-wrap bg-[var(--bg-canvas)]">
            {activeMultiChannels.length < 4 && (
              <button
                type="button"
                onClick={handleAddMultiViewSlot}
                className="px-3.5 py-2 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة شاشة ({activeMultiChannels.length}/4)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleMultiView}
              className="px-3.5 py-2 rounded-[2px] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-xs font-bold transition cursor-pointer"
            >
              إنهاء الشاشة المتعددة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:flex items-stretch bg-[var(--bg-canvas)]">
            {([
              { id: 'server1', code: 'FEED 01', label: 'المصدر الرئيسي' },
              { id: 'server2', code: 'FEED 02', label: 'المصدر البديل' },
              { id: 'server3', code: 'FEED 03', label: 'سيرفر احتياطي' }
            ] as const).map(srv => {
              const active = playerMode === srv.id;
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => {
                    setPlayerMode(srv.id);
                    showToast(`تم التحويل إلى ${srv.label}`);
                  }}
                  className={`px-4 py-2.5 border-r border-[var(--border-hairline)] border-b-[3px] text-right transition-colors cursor-pointer flex flex-col justify-center ${
                    active
                      ? 'border-b-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]'
                      : 'border-b-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <span className="font-display-num text-[10px] font-extrabold tracking-widest uppercase opacity-80">
                    {srv.code}
                  </span>
                  <span className="text-xs font-extrabold whitespace-nowrap">{srv.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. VIDEO PLAYER VIEWPORT */}
      {isMultiViewMode ? (
        <div
          ref={containerRef}
          className="grid grid-cols-2 gap-2 bg-[var(--bg-surface)] p-2 rounded-[2px] border border-[var(--border-hairline)]"
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
          className={`relative w-full bg-black rounded-[2px] overflow-hidden border border-[var(--border-hairline)] flex items-center justify-center ${
            isTheaterMode ? 'aspect-[16/9] sm:aspect-[21/9] max-h-[78vh]' : 'aspect-video'
          }`}
        >
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

          {isMuted && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleForceUnmute();
              }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[var(--accent-primary)] text-[var(--accent-contrast)] px-4 py-2 rounded-[2px] text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4 shrink-0" />
              <span>اضغط لتفعيل صوت البث المباشر</span>
            </button>
          )}

          {playerStatus === 'error' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 text-center z-20 space-y-3">
              <div className="font-display-num text-2xl font-extrabold text-[var(--signal-live)]">
                SIGNAL INTERRUPTED
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                تعذر استلام إشارة هذا المصدر حالياً
              </div>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                انتقل فوراً إلى المصدر البديل بالأعلى أو اضغط أدناه للتحويل التلقائي.
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
                        : 'server1';
                    setPlayerMode(next);
                  }}
                  className="px-4 py-2 rounded-[2px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold text-xs transition cursor-pointer"
                >
                  التحويل للمصدر البديل
                </button>
                <button
                  type="button"
                  onClick={handleReload}
                  className="px-3.5 py-2 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-bold transition cursor-pointer"
                >
                  إعادة الاتصال
                </button>
              </div>
            </div>
          )}

          {playerStatus === 'loading' && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-[var(--text-primary)] gap-2 z-10 pointer-events-none">
              <RotateCw className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
              <span className="text-xs font-bold">جاري استقبال إشارة البث المباشر...</span>
            </div>
          )}
        </div>
      )}

      {/* 3. BROADCAST CONTROL DECK */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStepChannel(-1)}
            className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>القناة السابقة</span>
          </button>
          <button
            type="button"
            onClick={() => handleStepChannel(1)}
            className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>القناة التالية</span>
            <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {!isMultiViewMode && hasMultipleLevels && (
            <div className="flex items-center bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-[2px]">
              {QUALITY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectQuality(opt.id)}
                  className={`px-2.5 py-1 text-xs font-display-num font-bold border-l last:border-l-0 border-[var(--border-hairline)] transition-colors cursor-pointer ${
                    selectedQuality === opt.id
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
              className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[var(--signal-live)]" />
                  <span>إلغاء الكتم</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span className="hidden sm:inline">الصوت</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleReload}
            className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>تحديث الإشارة</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMultiView}
            className={`px-3 py-1.5 rounded-[2px] border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMultiViewMode
                ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold'
                : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>شاشة متعددة</span>
          </button>

          {!isMultiViewMode && (
            <button
              type="button"
              onClick={() => setIsTheaterMode(prev => !prev)}
              className="hidden md:flex px-3 py-1.5 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isTheaterMode ? 'العرض القياسي' : 'وضع المسرح'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Maximize className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="hidden sm:inline">ملء الشاشة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('تم نسخ رابط القناة');
            }}
            className="p-1.5 rounded-[2px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="نسخ الرابط"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. RELATED CHANNELS SWITCHING MATRIX */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-[var(--accent-primary)]" />
            <h2 className="font-display-ar text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
              قنوات ناقلة أخرى على نفس الحزمة
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => navigate('/schedule')}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition-colors cursor-pointer"
            >
              جدول المباريات
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="text-[var(--accent-primary)] hover:underline font-bold cursor-pointer"
            >
              دليل القنوات الكامل ←
            </button>
          </div>
        </div>

        <div className="border-t border-r border-[var(--border-hairline)] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          {relatedChannels.map(ch => (
            <button
              key={ch.id}
              type="button"
              onClick={() => navigate(`/watchroom/${ch.id}`)}
              className="group border-b border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] p-3 text-right transition-colors cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-display-num text-base font-extrabold text-[var(--accent-primary)]">
                  #{String(ch.id).padStart(2, '0')}
                </span>
                <Play className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] fill-current" />
              </div>
              <div className="text-xs font-bold text-[var(--text-primary)] truncate w-full">
                {ch.arabicName || ch.name}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
