import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Play,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useApp, getApiUrl } from '../context/AppContext';
import { LeagueInfo, StandingRow, LiveMatch } from '../types';
import {
  LEAGUES_CATALOG,
  fetchStandingsWithFallback
} from '../utils/footballData';
import { MatchDetailsModal } from '../components/MatchDetailsModal';
import { usePageSeo } from '../hooks/usePageSeo';

export const LeaguesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { matches, channels, setActiveStreamingChannel } = useApp();

  const rawLeagueId = searchParams.get('league') || 'epl';
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(
    LEAGUES_CATALOG.some(l => l.id === rawLeagueId) ? rawLeagueId : 'epl'
  );

  const activeLeague: LeagueInfo = useMemo(() => {
    return LEAGUES_CATALOG.find(l => l.id === selectedLeagueId) || LEAGUES_CATALOG[0];
  }, [selectedLeagueId]);

  usePageSeo({
    title: `جدول ترتيب ${activeLeague.name} ومواعيد المباريات – kolstream`,
    description: `تعرف على جدول ترتيب ${activeLeague.name} المحدث، نقاط الفرق، الأهداف، ونتائج المباريات المباشرة على kolstream.`,
    canonicalPath: '/leagues'
  });

  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [liveSeason, setLiveSeason] = useState<string>(activeLeague.season);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<LiveMatch | null>(null);

  useEffect(() => {
    setStandings([]);
    setLiveSeason(activeLeague.season);
    setLoading(true);

    let cancelled = false;
    fetchStandingsWithFallback(
      selectedLeagueId,
      getApiUrl(`/api/standings?league=${encodeURIComponent(selectedLeagueId)}`)
    )
      .then(result => {
        if (!cancelled) {
          if (result.season) {
            setLiveSeason(result.season);
          }
          setStandings(result.rows);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedLeagueId, activeLeague.season]);

  const handleSelectLeague = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
    const next = new URLSearchParams(searchParams);
    next.set('league', leagueId);
    setSearchParams(next, { replace: true });
  };

  // Related matches from today's schedule matching this league or top matches
  const leagueMatches = useMemo(() => {
    const keywords: Record<string, RegExp> = {
      epl: /إنجليزي|انجليزي|premier/i,
      laliga: /إسباني|اسباني|ليغا|liga/i,
      seriea: /إيطالي|ايطالي|سيريا|serie/i,
      bundesliga: /ألماني|الماني|بوندسليغا|bundesliga/i,
      ligue1: /فرنسي|ليغ|ligue/i,
      ucl: /أبطال أوروبا|ابطال اوروبا|champions/i,
      saudi: /سعودي|روشن/i,
      egypt: /مصري/i,
      morocco: /مغربي|البطولة/i
    };
    const rx = keywords[selectedLeagueId];
    if (!rx) return matches.slice(0, 4);
    const matched = matches.filter(m => rx.test(m.competition));
    return matched.length > 0 ? matched.slice(0, 6) : matches.slice(0, 4);
  }, [matches, selectedLeagueId]);

  const handleTuneIn = (channelId: number, channelName?: string) => {
    const ch = channels.find(c => c.id === channelId);
    if (ch) {
      setActiveStreamingChannel(ch);
    } else if (channelName) {
      setActiveStreamingChannel({
        id: channelId,
        name: channelName,
        category: 'other',
        quality: '1080p FHD',
        lang: 'International',
        country: 'Global'
      });
    }
    navigate(`/watchroom/${channelId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* 1. Page Header & League Selector */}
      <div className="bg-[#101218] border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span>البطولات وجدول ترتيب الدوريات</span>
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              ترتيب الفرق، النقاط، فارق الأهداف، ونتائج آخر الجولات في الدوريات الأوروبية والعربية
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/schedual')}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>مباريات اليوم والغد</span>
          </button>
        </div>

        {/* League Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-stone-800/60">
          {LEAGUES_CATALOG.map(lg => {
            const active = lg.id === selectedLeagueId;
            return (
              <button
                key={lg.id}
                type="button"
                onClick={() => handleSelectLeague(lg.id)}
                className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all border shrink-0 cursor-pointer flex items-center gap-2 ${
                  active
                    ? 'bg-emerald-500 text-stone-950 border-emerald-400 font-extrabold shadow-sm'
                    : 'bg-[#090b0f] border-stone-800 text-stone-300 hover:text-white font-bold'
                }`}
              >
                <span>{lg.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Layout: Standings Table (8 cols) + League Matches Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Standings Table Card */}
        <div className="lg:col-span-8 bg-[#101218] border border-stone-800/90 rounded-2xl overflow-hidden shadow-xl">
          {/* Table Header Banner */}
          <div className="p-4 sm:px-5 bg-gradient-to-l from-[#1d0738] via-[#131620] to-[#101218] border-b border-stone-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm sm:text-base font-black text-white">
                جدول ترتيب {activeLeague.name}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                الموسم الرياضي {liveSeason} · {activeLeague.country}
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>تحديث مباشر...</span>
              </div>
            )}
          </div>

          {/* Responsive Standings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-800 bg-[#0b0d12] text-stone-400 font-bold text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3">الفريق</th>
                  <th className="py-3 px-2 text-center">لعب</th>
                  <th className="py-3 px-2 text-center">فاز</th>
                  <th className="py-3 px-2 text-center">تعادل</th>
                  <th className="py-3 px-2 text-center">خسر</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell">له:عليه</th>
                  <th className="py-3 px-2 text-center">+/-</th>
                  <th className="py-3 px-3 text-center text-emerald-400 font-extrabold">نقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {loading && standings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-stone-400">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                        <span className="text-xs font-bold">جاري جلب جدول الترتيب المباشر...</span>
                      </div>
                    </td>
                  </tr>
                ) : standings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-stone-500 text-xs">
                      تعذر تحميل جدول الترتيب حالياً، يرجى المحاولة مرة أخرى
                    </td>
                  </tr>
                ) : (
                  standings.map(row => {
                    const zoneColor =
                      row.zone === 'ucl'
                        ? 'border-r-4 border-r-emerald-500'
                        : row.zone === 'uel'
                        ? 'border-r-4 border-r-purple-500'
                        : row.zone === 'relegation'
                        ? 'border-r-4 border-r-rose-500'
                        : 'border-r-4 border-r-transparent';

                    return (
                      <tr
                        key={`${row.rank}_${row.team.name}`}
                        className={`hover:bg-stone-900/60 transition ${zoneColor}`}
                      >
                        <td className="py-3 px-3 text-center font-mono-num font-extrabold text-stone-300">
                          {row.rank}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5 min-w-[140px]">
                            {row.team.logo ? (
                              <img
                                src={row.team.logo}
                                alt={row.team.name}
                                className="w-6 h-6 object-contain shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-[10px] font-extrabold text-purple-300 shrink-0">
                                {row.team.name.slice(0, 2)}
                              </div>
                            )}
                            <span className="font-extrabold text-white truncate">
                              {row.team.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono-num text-stone-300">
                          {row.played}
                        </td>
                        <td className="py-3 px-2 text-center font-mono-num text-emerald-400 font-bold">
                          {row.won}
                        </td>
                        <td className="py-3 px-2 text-center font-mono-num text-stone-400">
                          {row.drawn}
                        </td>
                        <td className="py-3 px-2 text-center font-mono-num text-rose-400">
                          {row.lost}
                        </td>
                        <td className="py-3 px-2 text-center font-mono-num text-stone-400 hidden sm:table-cell">
                          {row.goalsFor}:{row.goalsAgainst}
                        </td>
                        <td
                          className={`py-3 px-2 text-center font-mono-num font-bold ${
                            row.goalDiff > 0
                              ? 'text-emerald-400'
                              : row.goalDiff < 0
                              ? 'text-rose-400'
                              : 'text-stone-400'
                          }`}
                        >
                          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                        </td>
                        <td className="py-3 px-3 text-center font-mono-num font-black text-sm text-white bg-stone-900/50">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Qualification Legend */}
          <div className="p-3.5 bg-[#0b0d12] border-t border-stone-800 flex flex-wrap items-center gap-4 text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
              <span>دوري الأبطال / التأهل المباشر</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-purple-500" />
              <span>البطولات القارية</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
              <span>منطقة الهبوط</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Featured Matches & Quick Stats */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#101218] border border-stone-800/90 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>أبرز المباريات المرتبطة</span>
              </h2>
              <button
                type="button"
                onClick={() => navigate('/schedual')}
                className="text-[11px] text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                كل المباريات ←
              </button>
            </div>

            {leagueMatches.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                لا توجد مباريات جارية حالياً في هذا القسم
              </div>
            ) : (
              <div className="space-y-2.5">
                {leagueMatches.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatchForDetails(m)}
                    className="p-3 rounded-xl bg-[#090b0f] border border-stone-800 hover:border-stone-600 transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span className="truncate">{m.competition}</span>
                      <span className="font-mono-num text-emerald-400 font-bold">
                        {m.status === 'LIVE' ? m.minute || 'مباشر' : m.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-white">
                      <span className="truncate flex-1">{m.teamA.name}</span>
                      <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono-num text-emerald-400">
                        {m.scoreA !== null && m.scoreB !== null
                          ? `${m.scoreA} - ${m.scoreB}`
                          : 'ضد'}
                      </span>
                      <span className="truncate flex-1 text-left">{m.teamB.name}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-stone-800/70">
                      <span className="text-[10px] text-purple-300 flex items-center gap-1 font-bold">
                        <BarChart3 className="w-3 h-3" />
                        <span>التشكيلة والإحصائيات</span>
                      </span>

                      {m.channels && m.channels.length > 0 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleTuneIn(m.channels[0].channel_id, m.channels[0].channel_name);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500 text-stone-950 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>بث مباشر</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Details Modal */}
      <MatchDetailsModal
        match={selectedMatchForDetails}
        onClose={() => setSelectedMatchForDetails(null)}
        onTuneIn={handleTuneIn}
      />
    </div>
  );
};
