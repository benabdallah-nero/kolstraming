import React, { useState, useEffect } from 'react';
import { Channel } from './types';
import { FEATURED_CHANNELS } from './data/channelsData';
import { Header } from './components/Header';
import { ChannelsView } from './components/ChannelsView';
import { ScheduleView } from './components/ScheduleView';
import { FullscreenPlayerModal } from './components/FullscreenPlayerModal';
import {
  Tv,
  Calendar,
  Star,
  Play,
  Maximize2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'channels' | 'matches' | 'favorites'>('channels');
  const [channels, setChannels] = useState<Channel[]>(FEATURED_CHANNELS);
  const [currentChannel, setCurrentChannel] = useState<Channel>(FEATURED_CHANNELS[0]);
  const [favorites, setFavorites] = useState<number[]>([91, 92, 614, 781, 772]);
  const [activeMatch, setActiveMatch] = useState<string>('تغطية مباشرة');
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [hasStartedStreaming, setHasStartedStreaming] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kolstream_favorite_channels');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('kolstream_favorite_channels', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    fetch('/api/channels')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.channels && data.channels.length > 0) {
          setChannels(data.channels);
        }
      })
      .catch(err => {
        console.warn('Using curated channels:', err);
      });
  }, []);

  const handleTuneInById = (channelId: number, channelName: string) => {
    const found = channels.find(c => c.id === channelId);
    if (found) {
      setCurrentChannel(found);
    } else {
      const newCh: Channel = {
        id: channelId,
        name: channelName,
        arabicName: channelName,
        category: channelName.toLowerCase().includes('bein') ? 'bein' : 'ar',
        quality: '1080p FHD',
        lang: 'العربية',
        country: 'Global'
      };
      setCurrentChannel(newCh);
    }
    setActiveMatch(channelName);
    setHasStartedStreaming(true);
    setIsPlayerOpen(true);
  };

  const handleSelectChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    setActiveMatch(channel.arabicName || channel.name);
    setHasStartedStreaming(true);
    setIsPlayerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-stone-200 flex flex-col pb-24 antialiased selection:bg-stone-700 selection:text-white" dir="rtl">
      {/* Minimal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        channelCount={channels.length}
      />

      {/* Main Container - Responsive on Mobile, Tablet, and Desktop */}
      <main className="flex-1 max-w-xl md:max-w-3xl lg:max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Tab 1: Channels (Home Landing) */}
        {activeTab === 'channels' && (
          <div className="animate-in fade-in duration-150">
            <ChannelsView
              channels={channels}
              currentChannelId={currentChannel.id}
              onSelectChannel={handleSelectChannel}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onNavigateToMatches={() => setActiveTab('matches')}
            />
          </div>
        )}

        {/* Tab 2: Live Matches */}
        {activeTab === 'matches' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-stone-850">
              <h2 className="text-sm font-medium text-stone-100">جدول مباريات اليوم</h2>
              <span className="text-xs text-stone-400 font-mono-num">مباشر</span>
            </div>
            <ScheduleView onTuneInChannel={handleTuneInById} />
          </div>
        )}

        {/* Tab 3: Pinned Favorites */}
        {activeTab === 'favorites' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-stone-850">
              <h2 className="text-sm font-medium text-stone-100">القنوات المفضلة</h2>
              <span className="text-xs text-stone-400 font-mono-num">{favorites.length} قنوات</span>
            </div>
            {favorites.length === 0 ? (
              <div className="py-16 text-center text-stone-500 text-xs">
                لم تقم بحفظ أي قنوات في المفضلة بعد. اضغط على رمز النجمة بجوار أي قناة لإضافتها هنا.
              </div>
            ) : (
              <ChannelsView
                channels={channels.filter(c => favorites.includes(c.id))}
                currentChannelId={currentChannel.id}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onNavigateToMatches={() => setActiveTab('matches')}
              />
            )}
          </div>
        )}
      </main>

      {/* Subtle Floating Mini-Player Pill if minimized */}
      {hasStartedStreaming && !isPlayerOpen && (
        <div className="fixed bottom-16 left-4 right-4 max-w-md md:max-w-xl mx-auto z-40 animate-in slide-in-from-bottom duration-150">
          <div
            onClick={() => setIsPlayerOpen(true)}
            className="p-3 bg-[#16181d] border border-stone-700/60 rounded-xl shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-stone-600 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-stone-100 truncate">
                  {currentChannel.arabicName || currentChannel.name}
                </div>
                <div className="text-[11px] text-stone-400">انقر لملء الشاشة</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-300">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>تكبير</span>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Video Player Modal */}
      {isPlayerOpen && (
        <FullscreenPlayerModal
          channel={currentChannel}
          allChannels={channels}
          onClose={() => setIsPlayerOpen(false)}
          onSelectChannel={handleSelectChannel}
          isFavorite={favorites.includes(currentChannel.id)}
          onToggleFavorite={toggleFavorite}
          activeMatch={activeMatch}
        />
      )}

      {/* Minimalist Tactile Bottom Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0c0e]/95 backdrop-blur-md border-t border-stone-800/40 px-6 py-2.5 flex items-center justify-around max-w-md md:max-w-xl mx-auto select-none" dir="rtl">
        <button
          onClick={() => {
            setActiveTab('channels');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'channels'
              ? 'text-stone-100 font-semibold'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span className="text-[11px] mt-1">القنوات</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('matches');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'matches'
              ? 'text-stone-100 font-semibold'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[11px] mt-1">المباريات</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('favorites');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === 'favorites'
              ? 'text-stone-100 font-semibold'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <Star className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
          <span className="text-[11px] mt-1">المفضلة</span>
        </button>
      </nav>
    </div>
  );
}
