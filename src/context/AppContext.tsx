import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Channel, LiveMatch, BroadcastInfo } from '../types';
import { CHANNELS as STATIC_CHANNELS } from '../data/channels';

export type ThemeId = 'stadium' | 'champions' | 'royal' | 'arena' | 'daylight';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  primaryColor: string;
  bgPreview: string;
  isLight?: boolean;
}

export const APP_THEMES: ThemeOption[] = [
  {
    id: 'stadium',
    name: 'المدرج الأخضر',
    subtitle: 'أخضر زمردي احترافي',
    primaryColor: '#10b981',
    bgPreview: 'linear-gradient(135deg, #061510 0%, #0b291e 50%, #10b981 100%)'
  },
  {
    id: 'champions',
    name: 'ليالي الأبطال',
    subtitle: 'أزرق ملكي وسماوي',
    primaryColor: '#38bdf8',
    bgPreview: 'linear-gradient(135deg, #060d1f 0%, #0f2547 50%, #38bdf8 100%)'
  },
  {
    id: 'royal',
    name: 'الملكي الذهبي',
    subtitle: 'فخامة الأسود والذهب',
    primaryColor: '#f59e0b',
    bgPreview: 'linear-gradient(135deg, #120f07 0%, #2b2108 50%, #f59e0b 100%)'
  },
  {
    id: 'arena',
    name: 'الحلبة القرمزية',
    subtitle: 'أحمر ناري حماسي',
    primaryColor: '#f43f5e',
    bgPreview: 'linear-gradient(135deg, #17070b 0%, #380d18 50%, #f43f5e 100%)'
  },
  {
    id: 'daylight',
    name: 'النهار الساطع',
    subtitle: 'وضع فاتح مريح للعين',
    primaryColor: '#059669',
    bgPreview: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #10b981 100%)',
    isLight: true
  }
];

interface AppContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  channels: Channel[];
  loadingChannels: boolean;
  channelsError: string | null;
  matches: LiveMatch[];
  loadingMatches: boolean;
  matchesError: string | null;
  epg: Record<number, BroadcastInfo>;
  loadingEpg: boolean;
  getChannelBroadcast: (channelId: number) => BroadcastInfo | null;
  favorites: number[];
  toggleFavorite: (channelId: number) => void;
  isFavorite: (channelId: number) => boolean;
  watchHistory: number[];
  addToWatchHistory: (channelId: number) => void;
  clearWatchHistory: () => void;
  multiViewIds: number[];
  toggleMultiViewId: (channelId: number) => void;
  setMultiViewIds: React.Dispatch<React.SetStateAction<number[]>>;
  matchReminders: string[];
  toggleMatchReminder: (matchId: string) => void;
  isMatchReminderSet: (matchId: string) => boolean;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  activeStreamingChannel: Channel | null;
  setActiveStreamingChannel: (channel: Channel | null) => void;
  refreshChannels: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  refreshEpg: () => Promise<void>;
  lastMatchesUpdated: Date | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'kolstream_favorite_channels';
const HISTORY_STORAGE_KEY = 'kolstream_watch_history';
const REMINDERS_STORAGE_KEY = 'kolstream_match_reminders';
const THEME_STORAGE_KEY = 'kolstream_ui_theme';

export const getApiUrl = (endpoint: string): string => {
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || '';
  if (envBase) {
    const cleanBase = String(envBase).replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
  }
  return endpoint;
};



const CHANNELS_CACHE_KEY = 'kolstream_cached_channels_v3';
const MATCHES_CACHE_KEY = 'kolstream_cached_matches_v6';

function getTodayMeccaDateString(): string {
  const now = new Date();
  const meccaNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return `${meccaNow.getUTCFullYear()}-${String(meccaNow.getUTCMonth() + 1).padStart(2, '0')}-${String(meccaNow.getUTCDate()).padStart(2, '0')}`;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && APP_THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'stadium';
  });

  const setTheme = useCallback((nextTheme: ThemeId) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize channels with cached data or verified base channels
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const cached = localStorage.getItem(CHANNELS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return STATIC_CHANNELS;
  });
  const [loadingChannels, setLoadingChannels] = useState<boolean>(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  // Initialize matches: validate timestamp and Mecca date to ensure matches from yesterday are never loaded!
  const [matches, setMatches] = useState<LiveMatch[]>(() => {
    try {
      const cached = localStorage.getItem(MATCHES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const todayDate = getTodayMeccaDateString();
        if (
          parsed &&
          parsed.dateKey === todayDate &&
          Date.now() - (parsed.timestamp || 0) < 15 * 60 * 1000 &&
          Array.isArray(parsed.matches) &&
          parsed.matches.length > 0
        ) {
          return parsed.matches;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [lastMatchesUpdated, setLastMatchesUpdated] = useState<Date | null>(null);

  const [epg, setEpg] = useState<Record<number, BroadcastInfo>>({});
  const [loadingEpg, setLoadingEpg] = useState<boolean>(true);

  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [watchHistory, setWatchHistory] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [matchReminders, setMatchReminders] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [multiViewIds, setMultiViewIds] = useState<number[]>([]);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [activeStreamingChannel, setActiveStreamingChannel] = useState<Channel | null>(null);

  const toggleFavorite = useCallback((channelId: number) => {
    setFavorites(prev => {
      const next = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((channelId: number) => {
    return favorites.includes(channelId);
  }, [favorites]);

  const addToWatchHistory = useCallback((channelId: number) => {
    if (!channelId || isNaN(channelId)) return;
    setWatchHistory(prev => {
      const filtered = prev.filter(id => id !== channelId);
      const next = [channelId, ...filtered].slice(0, 16);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearWatchHistory = useCallback(() => {
    setWatchHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const toggleMultiViewId = useCallback((channelId: number) => {
    setMultiViewIds(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), channelId];
      }
      return [...prev, channelId];
    });
  }, []);

  const toggleMatchReminder = useCallback((matchId: string) => {
    setMatchReminders(prev => {
      const next = prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId];
      try {
        localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isMatchReminderSet = useCallback((matchId: string) => {
    return matchReminders.includes(matchId);
  }, [matchReminders]);

  const fetchChannels = useCallback(async () => {
    setChannelsError(null);
    try {
      const targetUrl = getApiUrl('/api/channels');
      const res = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000)
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.channels) && data.channels.length > 0) {
          setChannels(data.channels);
          try {
            localStorage.setItem(CHANNELS_CACHE_KEY, JSON.stringify(data.channels));
          } catch {}
          return;
        }
      }

    } catch {
      // Retain existing channels
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const targetUrl = getApiUrl('/api/live-matches');
      const res = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000)
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.matches)) {
          setMatches(data.matches);
          setLastMatchesUpdated(new Date());
          try {
            localStorage.setItem(
              MATCHES_CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                dateKey: getTodayMeccaDateString(),
                matches: data.matches
              })
            );
          } catch {}
          return;
        }
      }

    } catch {
      // ignore
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  const fetchEpg = useCallback(async () => {
    try {
      const targetUrl = getApiUrl('/api/epg/live');
      const res = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4500)
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) return;
      const data = await res.json();
      if (data && data.success && data.epg) {
        setEpg(data.epg);
      }
    } catch {
      // Dynamic EPG is computed from real matches in getChannelBroadcast
    } finally {
      setLoadingEpg(false);
    }
  }, []);

  const getChannelBroadcast = useCallback((channelId: number): BroadcastInfo | null => {
    if (epg[channelId]) {
      return epg[channelId];
    }
    const activeMatch = matches.find(m => m.channels && m.channels.some(c => c.channel_id === channelId));
    if (activeMatch) {
      return {
        channelId,
        programTitle: `${activeMatch.competition}: ${activeMatch.teamA.name} ${activeMatch.scoreA !== null ? `${activeMatch.scoreA} - ${activeMatch.scoreB}` : 'ضد'} ${activeMatch.teamB.name}`,
        category: activeMatch.competition,
        tournament: activeMatch.competition,
        isLive: activeMatch.status === 'LIVE',
        isMatch: true,
        match: activeMatch,
        startTime: activeMatch.time,
        commentator: activeMatch.commentator
      };
    }
    return null;
  }, [epg, matches]);

  useEffect(() => {
    fetchChannels();
    fetchMatches();
    fetchEpg();
  }, [fetchChannels, fetchMatches, fetchEpg]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches();
      fetchEpg();
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchMatches, fetchEpg]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        channels,
        loadingChannels,
        channelsError,
        matches,
        loadingMatches,
        matchesError,
        epg,
        loadingEpg,
        getChannelBroadcast,
        favorites,
        toggleFavorite,
        isFavorite,
        watchHistory,
        addToWatchHistory,
        clearWatchHistory,
        multiViewIds,
        toggleMultiViewId,
        setMultiViewIds,
        matchReminders,
        toggleMatchReminder,
        isMatchReminderSet,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        activeStreamingChannel,
        setActiveStreamingChannel,
        refreshChannels: fetchChannels,
        refreshMatches: fetchMatches,
        refreshEpg: fetchEpg,
        lastMatchesUpdated
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
