import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Play,
  RefreshCw
} from 'lucide-react';
import { useApp, getApiUrl } from '../context/AppContext';
import { LeagueInfo, StandingRow, LiveMatch } from '../types';
import {
  LEAGUES_CATALOG,
  fetchStandingsWithFallback
} from '../utils/footballData';
import { MatchDetailsModal } from '../components/MatchDetailsModal';
import { usePageSeo } from '../hooks/usePageSeo';
import {
  deriveStandingForm,
  formatBroadcastMinute
} from '../utils/broadcastFormatters';

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
    if (!rx) return matches.slice(0, 5);
    const matched = matches.filter(m => rx.test(m.competition));
    return matched.length > 0 ? matched.slice(0, 6) : matches.slice(0, 5);
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
    <div className="space-y-6" dir="rtl">
      {/* 1. BROADCAST LEAGUE SELECTOR HEADER */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-7 bg-[var(--accent-primary)] shrink-0" />
            <div>
              <h1 className="font-display-ar text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                جداول ترتيب الدوريات والبطولات
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                المراكز، النقاط، فارق الأهداف، وسلسلة نتائج آخر 5 جولات محدثة تلقائياً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/schedual')}
            className="px-4 py-2 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            جدول مباريات اليوم ←
          </button>
        </div>

        {/* League Selector Strip */}
        <div className="flex items-center gap-2 p-2 overflow-x-auto no-scrollbar bg-[var(--bg-canvas)] border-t border-[var(--border-hairline)]">
          {LEAGUES_CATALOG.map(lg => {
            const active = lg.id === selectedLeagueId;
            return (
              <button
                key={lg.id}
                type="button"
                onClick={() => handleSelectLeague(lg.id)}
                className={`px-3.5 py-2 text-xs rounded-xl whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-extrabold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] font-semibold'
                }`}
              >
                <span className="font-display-ar">{lg.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN SCOREBOARD LAYOUT: STANDINGS TABLE (8 COLS) + MATCHDAY SIDEBAR (4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Standings Broadcast Table */}
        <div className="lg:col-span-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-display-num text-xs font-extrabold uppercase">
                STANDINGS
              </span>
              <div>
                <div className="font-display-ar text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                  {activeLeague.name}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  الموسم <span className="font-display-num text-xs text-[var(--text-secondary)]">{liveSeason}</span> · {activeLeague.country}
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--accent-primary)] font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>تحديث الترتيب...</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-muted)] font-bold text-[11px] uppercase">
                  <th className="py-2.5 px-2.5 w-10 text-center border-l border-[var(--border-hairline)]">#</th>
                  <th className="py-2.5 px-3 border-l border-[var(--border-hairline)]">الفريق</th>
                  <th className="py-2.5 px-2 text-center border-l border-[var(--border-hairline)]">لعب</th>
                  <th className="py-2.5 px-2 text-center border-l border-[var(--border-hairline)]">ف</th>
                  <th className="py-2.5 px-2 text-center border-l border-[var(--border-hairline)]">ت</th>
                  <th className="py-2.5 px-2 text-center border-l border-[var(--border-hairline)]">خ</th>
                  <th className="py-2.5 px-2 text-center border-l border-[var(--border-hairline)] hidden sm:table-cell">الأهداف</th>
                  <th className="py-2.5 px-2 text-center border-l border-[var(--border-hairline)]">+/-</th>
                  <th className="py-2.5 px-2.5 text-center border-l border-[var(--border-hairline)] hidden md:table-cell">آخر 5</th>
                  <th className="py-2.5 px-3 text-center text-[var(--accent-primary)] font-extrabold">نقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {loading && standings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
                        <span className="text-xs font-bold">جاري سحب جدول الترتيب الرسمي...</span>
                      </div>
                    </td>
                  </tr>
                ) : standings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-[var(--text-muted)] text-xs">
                      تعذر الاتصال بمصدر جدول الترتيب حالياً — أعد المحاولة بعد قليل.
                    </td>
                  </tr>
                ) : (
                  standings.map(row => {
                    const zoneEdge =
                      row.zone === 'ucl'
                        ? 'border-r-[3px] border-r-[var(--accent-primary)]'
                        : row.zone === 'uel'
                        ? 'border-r-[3px] border-r-[#f59e0b]'
                        : row.zone === 'relegation'
                        ? 'border-r-[3px] border-r-[var(--signal-live)]'
                        : 'border-r-[3px] border-r-transparent';

                    const formSquares = deriveStandingForm(row);

                    return (
                      <tr
                        key={`${row.rank}_${row.team.name}`}
                        className={`broadcast-row ${zoneEdge}`}
                      >
                        <td className="py-2.5 px-2.5 text-center font-display-num text-base font-extrabold text-[var(--text-secondary)] border-l border-[var(--border-hairline)]">
                          {row.rank}
                        </td>
                        <td className="py-2.5 px-3 border-l border-[var(--border-hairline)]">
                          <div className="flex items-center gap-2.5 min-w-[140px]">
                            {row.team.logo ? (
                              <img
                                src={row.team.logo}
                                alt={row.team.name}
                                className="w-5 h-5 object-contain shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[9px] font-extrabold text-[var(--text-secondary)] shrink-0">
                                {row.team.name.slice(0, 2)}
                              </div>
                            )}
                            <span className="font-bold text-[var(--text-primary)] truncate">
                              {row.team.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-display-num text-sm text-[var(--text-secondary)] border-l border-[var(--border-hairline)]">
                          {row.played}
                        </td>
                        <td className="py-2.5 px-2 text-center font-display-num text-sm text-[var(--accent-primary)] font-bold border-l border-[var(--border-hairline)]">
                          {row.won}
                        </td>
                        <td className="py-2.5 px-2 text-center font-display-num text-sm text-[var(--text-secondary)] border-l border-[var(--border-hairline)]">
                          {row.drawn}
                        </td>
                        <td className="py-2.5 px-2 text-center font-display-num text-sm text-[var(--signal-live)] border-l border-[var(--border-hairline)]">
                          {row.lost}
                        </td>
                        <td className="py-2.5 px-2 text-center font-display-num text-sm text-[var(--text-muted)] border-l border-[var(--border-hairline)] hidden sm:table-cell">
                          {row.goalsFor}:{row.goalsAgainst}
                        </td>
                        <td
                          className={`py-2.5 px-2 text-center font-display-num text-sm font-bold border-l border-[var(--border-hairline)] ${
                            row.goalDiff > 0
                              ? 'text-[var(--accent-primary)]'
                              : row.goalDiff < 0
                              ? 'text-[var(--signal-live)]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                        </td>
                        <td className="py-2.5 px-2.5 text-center border-l border-[var(--border-hairline)] hidden md:table-cell">
                          <div className="inline-flex items-center gap-1">
                            {formSquares.map((res, idx) => (
                              <span
                                key={idx}
                                className={`w-4 h-4 rounded-[2px] font-display-num text-[10px] font-extrabold inline-flex items-center justify-center leading-none ${
                                  res === 'W'
                                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                                    : res === 'D'
                                    ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-strong)]'
                                    : 'bg-[#2a1215] text-[var(--signal-live)] border border-[var(--signal-live)]/40'
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-display-num font-extrabold text-lg text-[var(--text-primary)] bg-[var(--bg-canvas)]">
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
          <div className="px-4 py-2.5 bg-[var(--bg-canvas)] border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[var(--text-secondary)]">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[var(--accent-primary)]" />
                <span>دوري الأبطال / المربع الذهبي</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#f59e0b]" />
                <span>المشاركة القارية</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[var(--signal-live)]" />
                <span>منطقة الهبوط</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-display-num">
              <span>W = فوز</span>
              <span>·</span>
              <span>D = تعادل</span>
              <span>·</span>
              <span>L = خسارة</span>
            </div>
          </div>
        </div>

        {/* Left Sidebar: Related Fixtures Strip */}
        <div className="lg:col-span-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] flex items-center justify-between">
            <h2 className="font-display-ar text-sm font-extrabold text-[var(--text-primary)]">
              مواجهات مرتبطة بالبطولة
            </h2>
            <button
              type="button"
              onClick={() => navigate('/schedual')}
              className="text-xs text-[var(--accent-primary)] font-bold hover:underline cursor-pointer"
            >
              كل الجدول ←
            </button>
          </div>

          {leagueMatches.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              لا توجد مباريات مدرجة اليوم في هذه البطولة.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {leagueMatches.map(m => {
                const isLive = m.status === 'LIVE';
                const hasScore = m.scoreA !== null && m.scoreB !== null;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatchForDetails(m)}
                    className="p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-row-hover)] transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="truncate">{m.competition}</span>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--signal-live)]/15 text-[var(--signal-live)] border border-[var(--signal-live)]/20 font-display-num text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-live)] animate-ping" />
                          <span>{formatBroadcastMinute(m.minute)}</span>
                        </span>
                      ) : (
                        <span className="font-display-num text-xs font-bold text-[var(--text-secondary)]">
                          {m.time}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-primary)]">
                      <span className="truncate flex-1">{m.teamA.name}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-sm font-extrabold text-[var(--accent-primary)]">
                        {hasScore ? `${m.scoreA} - ${m.scoreB}` : 'VS'}
                      </span>
                      <span className="truncate flex-1 text-left">{m.teamB.name}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-hairline)]">
                      <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                        الأحداث والإحصائيات
                      </span>

                      {m.channels && m.channels.length > 0 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleTuneIn(m.channels[0].channel_id, m.channels[0].channel_name);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-extrabold flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>مشاهدة</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
