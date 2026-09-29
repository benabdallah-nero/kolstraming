import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Channel, LiveMatch } from '../types';

interface AppContextType {
  channels: Channel[];
  loadingChannels: boolean;
  channelsError: string | null;
  matches: LiveMatch[];
  loadingMatches: boolean;
  matchesError: string | null;
  favorites: number[];
  toggleFavorite: (channelId: number) => void;
  isFavorite: (channelId: number) => boolean;
  activeStreamingChannel: Channel | null;
  setActiveStreamingChannel: (channel: Channel | null) => void;
  refreshChannels: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  lastMatchesUpdated: Date | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'kolstream_favorite_channels';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState<boolean>(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [lastMatchesUpdated, setLastMatchesUpdated] = useState<Date | null>(null);

  // Favorites strictly initialized from localStorage or empty array (no hardcoded pre-selected channels)
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage access fallback
    }
    return [];
  });

  // Active streaming channel for the watch theater and persistent floating mini-player
  const [activeStreamingChannel, setActiveStreamingChannel] = useState<Channel | null>(null);

  // Toggle favorite channel
  const toggleFavorite = useCallback((channelId: number) => {
    setFavorites(prev => {
      const next = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // LocalStorage quota or access error
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((channelId: number) => {
    return favorites.includes(channelId);
  }, [favorites]);

  // Fetch channels dynamically strictly from /api/channels
  const fetchChannels = useCallback(async () => {
    setLoadingChannels(true);
    setChannelsError(null);
    try {
      const res = await fetch('/api/channels');
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.channels)) {
        setChannels(data.channels);
      } else {
        setChannels([]);
      }
    } catch (err: any) {
      setChannelsError(err.message || 'تعذر جلب قائمة القنوات');
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  // Fetch live matches dynamically strictly from /api/live-matches
  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/live-matches');
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.matches)) {
        setMatches(data.matches);
        setLastMatchesUpdated(new Date());
      } else {
        setMatches([]);
      }
    } catch (err: any) {
      setMatchesError(err.message || 'تعذر تحديث جدول المباريات المباشرة');
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchChannels();
    fetchMatches();
  }, [fetchChannels, fetchMatches]);

  // Background polling for live matches (every 25 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches();
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  return (
    <AppContext.Provider
      value={{
        channels,
        loadingChannels,
        channelsError,
        matches,
        loadingMatches,
        matchesError,
        favorites,
        toggleFavorite,
        isFavorite,
        activeStreamingChannel,
        setActiveStreamingChannel,
        refreshChannels: fetchChannels,
        refreshMatches: fetchMatches,
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
