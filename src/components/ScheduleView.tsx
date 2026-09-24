import React, { useState, useEffect, useMemo } from 'react';
import { LiveMatch } from '../types';
import {
  Search,
  RefreshCw,
  Play
} from 'lucide-react';

interface ScheduleViewProps {
  onTuneInChannel: (channelId: number, channelName: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onTuneInChannel }) => {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [filterCategory, setFilterCategory] = useState<'all' | 'live' | 'bein' | 'ssc' | 'alkass'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/live-matches');
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.success && Array.isArray(data.matches) && data.matches.length > 0) {
            setMatches(data.matches);
            setIsLoading(false);
            return;
          }
        } catch {
          // Continue to fallback
        }
      }
    } catch {
      // Continue to fallback
    }

    // Default premier fallback matches
    setMatches([
      {
        id: 'fb_1',
        competition: 'دوري أبطال أوروبا',
        teamA: { name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/541.png' },
        teamB: { name: 'مانشستر سيتي', logo: 'https://media.api-sports.io/football/teams/50.png' },
        scoreA: 2,
        scoreB: 1,
        status: 'LIVE',
        statusText: 'الشوط الثاني',
        minute: "68'",
        time: '22:00 بتوقيت مكة',
        localTime: '22:00 بتوقيت مكة',
        channels: [{ channel_id: 91, channel_name: 'beIN Sports 1 HD' }],
        commentator: 'عصام الشوالي',
        isBeinArabic: true,
        broadcasterLabel: 'beIN Sports 1 HD',
        network: 'bein_ar'
      },
      {
        id: 'fb_2',
        competition: 'الدوري الإنجليزي الممتاز',
        teamA: { name: 'ليفربول', logo: 'https://media.api-sports.io/football/teams/40.png' },
        teamB: { name: 'آرسنال', logo: 'https://media.api-sports.io/football/teams/42.png' },
        scoreA: null,
        scoreB: null,
        status: 'FIXTURE',
        statusText: 'لم تبدأ بعد',
        minute: null,
        time: '19:30 بتوقيت مكة',
        localTime: '19:30 بتوقيت مكة',
        channels: [{ channel_id: 92, channel_name: 'beIN Sports 2 HD' }],
        commentator: 'حفيظ دراجي',
        isBeinArabic: true,
        broadcasterLabel: 'beIN Sports 2 HD',
        network: 'bein_ar'
      },
      {
        id: 'fb_3',
        competition: 'الدوري الإسباني (لا ليغا)',
        teamA: { name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/529.png' },
        teamB: { name: 'أتلتيكو مدريد', logo: 'https://media.api-sports.io/football/teams/530.png' },
        scoreA: null,
        scoreB: null,
        status: 'FIXTURE',
        statusText: 'لم تبدأ بعد',
        minute: null,
        time: '22:00 بتوقيت مكة',
        localTime: '22:00 بتوقيت مكة',
        channels: [{ channel_id: 93, channel_name: 'beIN Sports 3 HD' }],
        commentator: 'حسن العيدروس',
        isBeinArabic: true,
        broadcasterLabel: 'beIN Sports 3 HD',
        network: 'bein_ar'
      },
      {
        id: 'fb_4',
        competition: 'دوري روشن السعودي',
        teamA: { name: 'الهلال', logo: 'https://media.api-sports.io/football/teams/2939.png' },
        teamB: { name: 'النصر', logo: 'https://media.api-sports.io/football/teams/2940.png' },
        scoreA: 1,
        scoreB: 0,
        status: 'LIVE',
        statusText: 'الشوط الأول',
        minute: "35'",
        time: '21:00 بتوقيت مكة',
        localTime: '21:00 بتوقيت مكة',
        channels: [{ channel_id: 614, channel_name: 'SSC 1 HD' }],
        commentator: 'فهد العتيبي',
        isBeinArabic: false,
        broadcasterLabel: 'SSC 1 HD',
        network: 'ssc'
      },
      {
        id: 'fb_5',
        competition: 'دوري روشن السعودي',
        teamA: { name: 'الاتحاد', logo: 'https://media.api-sports.io/football/teams/2941.png' },
        teamB: { name: 'الأهلي السعودي', logo: 'https://media.api-sports.io/football/teams/2942.png' },
        scoreA: null,
        scoreB: null,
        status: 'FIXTURE',
        statusText: 'لم تبدأ بعد',
        minute: null,
        time: '21:00 بتوقيت مكة',
        localTime: '21:00 بتوقيت مكة',
        channels: [{ channel_id: 615, channel_name: 'SSC 2 HD' }],
        commentator: 'فارس عوض',
        isBeinArabic: false,
        broadcasterLabel: 'SSC 2 HD',
        network: 'ssc'
      }
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMatches();
    const timer = setInterval(fetchMatches, 30000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    const live = matches.filter(m => m.status === 'LIVE').length;
    const bein = matches.filter(m => m.isBeinArabic || (m.network && m.network === 'bein_ar')).length;
    const ssc = matches.filter(m => m.network === 'ssc' || (m.broadcasterLabel && m.broadcasterLabel.includes('SSC'))).length;
    const alkass = matches.filter(m => m.network === 'alkass' || (m.broadcasterLabel && m.broadcasterLabel.includes('الكأس'))).length;
    return { all: matches.length, live, bein, ssc, alkass };
  }, [matches]);

  const filteredMatches = useMemo(() => {
    let list = matches;

    if (filterCategory === 'live') {
      list = list.filter(m => m.status === 'LIVE');
    } else if (filterCategory === 'bein') {
      list = list.filter(m => m.isBeinArabic || m.network === 'bein_ar');
    } else if (filterCategory === 'ssc') {
      list = list.filter(m => m.network === 'ssc' || (m.broadcasterLabel && m.broadcasterLabel.includes('SSC')));
    } else if (filterCategory === 'alkass') {
      list = list.filter(m => m.network === 'alkass' || (m.broadcasterLabel && m.broadcasterLabel.includes('الكأس')));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.teamA.name.toLowerCase().includes(q) ||
        m.teamB.name.toLowerCase().includes(q) ||
        m.competition.toLowerCase().includes(q) ||
        (m.broadcasterLabel && m.broadcasterLabel.toLowerCase().includes(q)) ||
        (m.commentator && m.commentator.toLowerCase().includes(q)) ||
        m.channels.some(c => c.channel_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [matches, filterCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-3.5 select-none" dir="rtl">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            filterCategory === 'all'
              ? 'bg-stone-100 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          كافة المباريات ({matches.length})
        </button>

        {counts.live > 0 && (
          <button
            onClick={() => setFilterCategory('live')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterCategory === 'live'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-stone-900/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>مباشر الآن ({counts.live})</span>
          </button>
        )}

        <button
          onClick={() => setFilterCategory('bein')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            filterCategory === 'bein'
              ? 'bg-stone-100 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          beIN Sports ({counts.bein})
        </button>

        {counts.ssc > 0 && (
          <button
            onClick={() => setFilterCategory('ssc')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterCategory === 'ssc'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            دوري روشن (SSC)
          </button>
        )}

        {counts.alkass > 0 && (
          <button
            onClick={() => setFilterCategory('alkass')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterCategory === 'alkass'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            قنوات الكأس
          </button>
        )}

        <button
          onClick={fetchMatches}
          disabled={isLoading}
          className="p-2 rounded-lg text-stone-500 hover:text-stone-300 transition mr-auto shrink-0"
          title="تحديث الجدول"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-stone-300' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ابحث عن فريق، بطولة، أو معلق..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-8 py-2 bg-[#121316] border border-stone-800/60 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-600 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white"
          >
            &times;
          </button>
        )}
      </div>

      {/* Match Ledger / Editorial Cards */}
      {isLoading && matches.length === 0 ? (
        <div className="py-16 text-center text-stone-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 text-stone-400 animate-spin" />
          <span>جاري مراجعة جدول البث المباشر...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-12 text-center text-stone-500 text-xs">
          لا توجد مباريات مطابقة للبحث أو الفلتر المحدد.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMatches.map((m) => {
            const isLive = m.status === 'LIVE';
            const isFinished = m.status === 'RESULT';
            const hasChannels = m.channels && m.channels.length > 0;
            const primaryChannel = hasChannels ? m.channels[0] : null;

            return (
              <div
                key={m.id}
                onClick={() => {
                  if (primaryChannel) {
                    onTuneInChannel(primaryChannel.channel_id, primaryChannel.channel_name);
                  }
                }}
                className={`p-3.5 bg-[#121316] hover:bg-[#16181d] border rounded-xl transition ${
                  isLive
                    ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    : 'border-stone-800/50 hover:border-stone-700/60'
                } ${primaryChannel ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Header: Competition & Unboxed Broadcaster */}
                <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-850">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-stone-300 font-medium">{m.competition}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span className={m.isBeinArabic ? 'text-stone-300' : 'text-stone-400'}>
                      {m.broadcasterLabel || 'بث مباشر'}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {isLive ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium shrink-0 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{m.minute || 'مباشر الآن'}</span>
                    </div>
                  ) : isFinished ? (
                    <span className="text-stone-400 shrink-0 text-xs">انتهت</span>
                  ) : (
                    <span className="font-mono-num text-[11px] text-stone-400 shrink-0">
                      {m.time}
                    </span>
                  )}
                </div>

                {/* Score & Teams */}
                <div className="py-3 flex items-center justify-between gap-3">
                  {/* Team A */}
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    {m.teamA.logo && (
                      <img
                        src={m.teamA.logo}
                        alt={m.teamA.name}
                        className="w-6 h-6 object-contain shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-sm font-medium text-stone-100 truncate">
                      {m.teamA.name}
                    </span>
                  </div>

                  {/* Score or Time */}
                  <div className="font-mono-num text-sm text-center shrink-0 px-2">
                    {isLive || isFinished ? (
                      <div className="flex items-center gap-1.5 text-stone-100 font-semibold">
                        <span>{m.scoreA ?? 0}</span>
                        <span className="text-stone-600">-</span>
                        <span>{m.scoreB ?? 0}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 font-medium">{m.time.split(' ')[0]}</span>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0 text-left">
                    <span className="text-sm font-medium text-stone-100 truncate">
                      {m.teamB.name}
                    </span>
                    {m.teamB.logo && (
                      <img
                        src={m.teamB.logo}
                        alt={m.teamB.name}
                        className="w-6 h-6 object-contain shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Footer: Channel Action & Commentator */}
                <div className="pt-2 border-t border-stone-850 flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    {hasChannels ? (
                      m.channels.map((ch, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTuneInChannel(ch.channel_id, ch.channel_name);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-800 text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
                        >
                          <Play className="w-3 h-3 fill-current text-stone-400" />
                          <span>{ch.channel_name}</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-stone-400 text-[11px]">
                        {m.broadcasterLabel}
                      </span>
                    )}
                  </div>

                  {m.commentator && (
                    <div className="text-[11px] text-stone-400">
                      المعلق: <span className="text-stone-300 font-medium">{m.commentator}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
