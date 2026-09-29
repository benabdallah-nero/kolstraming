import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Maximize2, X, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MiniPlayerPill: React.FC = () => {
  const { activeStreamingChannel, setActiveStreamingChannel } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Do not show mini player if no channel is actively streaming, or if user is currently inside watchroom
  if (!activeStreamingChannel || location.pathname.startsWith('/watchroom')) {
    return null;
  }

  const handleReturnToWatchroom = () => {
    navigate(`/watchroom/${activeStreamingChannel.id}`);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStreamingChannel(null);
  };

  return (
    <div
      className="fixed bottom-16 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 animate-in slide-in-from-bottom duration-200"
      dir="rtl"
    >
      <div
        onClick={handleReturnToWatchroom}
        className="group p-3 bg-[#121316]/95 hover:bg-[#16181d] border border-emerald-500/40 hover:border-emerald-500/70 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center shrink-0">
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-100 truncate">
                {activeStreamingChannel.arabicName || activeStreamingChannel.name}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono-num font-medium bg-emerald-950/50 px-1.5 py-0.2 rounded">
                بث نشط
              </span>
            </div>
            <div className="text-[11px] text-stone-400 truncate mt-0.5">
              انقر للعودة إلى غرفة المشاهدة المباشرة
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleReturnToWatchroom}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition"
            title="تكبير"
            aria-label="تكبير المشغل"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition"
            title="إغلاق البث"
            aria-label="إغلاق البث المصغر"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
