import React from 'react';

interface HeaderProps {
  activeTab: 'channels' | 'matches' | 'favorites';
  setActiveTab: (tab: 'channels' | 'matches' | 'favorites') => void;
  channelCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  channelCount
}) => {
  return (
    <header className="bg-[#0b0c0e]/95 backdrop-blur-md border-b border-stone-800/40 sticky top-0 z-40 text-stone-200 select-none" dir="rtl">
      <div className="max-w-md md:max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Minimalist Human Brandmark */}
        <div
          className="flex items-center gap-2 cursor-pointer active:opacity-75 transition-opacity"
          onClick={() => setActiveTab('channels')}
        >
          <span className="font-mono-num text-lg font-semibold tracking-tight text-stone-100">
            kolstream
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
            beta
          </span>
        </div>

        {/* Quiet Live Status */}
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
          <span className="font-mono-num text-[11px] text-stone-400">مباشر 1080p</span>
        </div>
      </div>
    </header>
  );
};
