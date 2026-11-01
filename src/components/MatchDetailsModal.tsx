import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Trophy,
  Clock,
  Users,
  BarChart3,
  Activity,
  Shield,
  ArrowLeftRight
} from 'lucide-react';
import { LiveMatch, MatchDetailsData } from '../types';
import { getApiUrl } from '../context/AppContext';
import { buildMatchDetailsForMatch } from '../utils/footballData';

interface MatchDetailsModalProps {
  match: LiveMatch | null;
  onClose: () => void;
  onTuneIn: (channelId: number, channelName?: string) => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  onClose,
  onTuneIn
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'lineups' | 'stats'>('events');
  const [details, setDetails] = useState<MatchDetailsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!match) return;
    setActiveTab(match.status === 'FIXTURE' ? 'lineups' : 'events');
    setLoading(true);

    // Build instant local details first so UI is immediate, and also query API
    const instantDetails = buildMatchDetailsForMatch(match);
    setDetails(instantDetails);

    const qs = new URLSearchParams({
      teamA: match.teamA.name,
      teamB: match.teamB.name,
      competition: match.competition,
      status: match.status,
      scoreA: match.scoreA !== null ? String(match.scoreA) : '',
      scoreB: match.scoreB !== null ? String(match.scoreB) : ''
    });

    let cancelled = false;
    fetch(getApiUrl(`/api/match-details/${encodeURIComponent(match.id)}?${qs.toString()}`))
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data && data.success && data.details) {
          setDetails(data.details);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [match]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!match || !details) return null;

  const isLive = match.status === 'LIVE';
  const hasScore = match.scoreA !== null && match.scoreB !== null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#101218] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Modal Header: Match Scoreboard */}
        <div className="relative bg-gradient-to-br from-[#1d0738] via-[#12151f] to-[#0a0c12] p-4 sm:p-6 border-b border-stone-800">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Trophy className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{match.competition}</span>
              {details.stadium && (
                <span className="text-stone-400 font-normal hidden sm:inline">
                  · {details.stadium}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Teams & Score Row */}
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Team A */}
            <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
              {match.teamA.logo ? (
                <img
                  src={match.teamA.logo}
                  alt={match.teamA.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-base sm:text-xl font-black text-purple-300">
                  {match.teamA.name.slice(0, 2)}
                </div>
              )}
              <span className="text-xs sm:text-base font-extrabold text-white truncate max-w-full">
                {match.teamA.name}
              </span>
            </div>

            {/* Center Score / Time */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10">
              {hasScore ? (
                <div className="text-2xl sm:text-3xl font-mono-num font-black text-emerald-400 tracking-wider">
                  {match.scoreA} : {match.scoreB}
                </div>
              ) : (
                <div className="text-base sm:text-xl font-mono-num font-extrabold text-white">
                  {match.time}
                </div>
              )}

              {isLive ? (
                <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-mono-num font-extrabold">
                  مباشر · {match.minute || 'الآن'}
                </span>
              ) : match.status === 'RESULT' ? (
                <span className="text-[11px] text-stone-400 font-bold">انتهت المباراة</span>
              ) : (
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>لم تبدأ بعد</span>
                </span>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
              {match.teamB.logo ? (
                <img
                  src={match.teamB.logo}
                  alt={match.teamB.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-base sm:text-xl font-black text-purple-300">
                  {match.teamB.name.slice(0, 2)}
                </div>
              )}
              <span className="text-xs sm:text-base font-extrabold text-white truncate max-w-full">
                {match.teamB.name}
              </span>
            </div>
          </div>

          {/* Direct Watch CTA if playable */}
          {match.channels && match.channels.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
              {match.channels.slice(0, 3).map((ch, idx) => (
                <button
                  key={ch.channel_id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onTuneIn(ch.channel_id, ch.channel_name);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                    idx === 0
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>مشاهدة على {ch.channel_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-stone-800 bg-[#0c0e14] text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'events'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>أحداث المباراة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lineups')}
            className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'lineups'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>التشكيلة ({details.lineupA.formation})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'stats'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات والمواجهات</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {loading && (
            <div className="text-center text-stone-500 text-[11px]">
              جاري تحديث بيانات المباراة...
            </div>
          )}

          {/* TAB 1: MATCH EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {details.events.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-stone-800 p-6 space-y-2">
                  <Clock className="w-7 h-7 text-stone-500 mx-auto" />
                  <div className="text-sm font-bold text-stone-200">
                    لم تنطلق أحداث المباراة بعد
                  </div>
                  <p className="text-xs text-stone-400">
                    ستظهر الأهداف والبطاقات والتبديلات لحظة بلحظة فور انطلاق صافرة البداية ({match.time}).
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {details.events.map(ev => {
                    const isTeamA = ev.team === 'A';
                    const badgeLabel =
                      ev.type === 'goal'
                        ? '⚽ هدف'
                        : ev.type === 'penalty_goal'
                        ? '⚽ هدف (ركلة جزاء)'
                        : ev.type === 'yellow_card'
                        ? '🟨 بطاقة صفراء'
                        : ev.type === 'red_card'
                        ? '🟥 بطاقة حمراء'
                        : '🔄 تبديل';

                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-2xl border border-stone-800/90 bg-[#0b0d12] flex items-center justify-between gap-3 ${
                          isTeamA ? 'border-r-4 border-r-emerald-500' : 'border-l-4 border-l-purple-500'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 font-mono-num font-extrabold text-emerald-400 shrink-0">
                            {ev.minute}
                          </span>
                          <div className="min-w-0">
                            <div className="font-extrabold text-stone-100 flex items-center gap-2 flex-wrap">
                              <span>{ev.player}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-800">
                                {badgeLabel}
                              </span>
                            </div>
                            {(ev.assistOrSubOut || ev.detail) && (
                              <div className="text-[11px] text-stone-400 mt-0.5">
                                {ev.assistOrSubOut || ev.detail}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-stone-400 shrink-0">
                          {isTeamA ? match.teamA.name : match.teamB.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STARTING LINEUPS & SUBSTITUTES */}
          {activeTab === 'lineups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { teamName: match.teamA.name, lineup: details.lineupA, accent: 'text-emerald-400' },
                { teamName: match.teamB.name, lineup: details.lineupB, accent: 'text-purple-400' }
              ].map((side, sIdx) => (
                <div
                  key={sIdx}
                  className="rounded-2xl border border-stone-800 bg-[#0b0d12] p-4 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                    <div>
                      <div className="text-sm font-black text-white">{side.teamName}</div>
                      {side.lineup.coach && (
                        <div className="text-[11px] text-stone-400">
                          المدرب: {side.lineup.coach}
                        </div>
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 font-mono-num font-extrabold text-emerald-400">
                      {side.lineup.formation || '4-3-3'}
                    </span>
                  </div>

                  {side.lineup.startingXI.length === 0 ? (
                    <div className="py-8 text-center text-stone-400 text-xs">
                      {loading
                        ? 'جاري جلب التشكيلة الرسمية وأسماء اللاعبين...'
                        : 'لم يتم الإعلان عن التشكيلة الرسمية لهذه المباراة بعد'}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-extrabold text-emerald-400 mb-1 flex items-center justify-between">
                          <span>التشكيل الأساسي ({side.lineup.startingXI.length})</span>
                          <span className="text-[10px] text-stone-500 font-normal">المركز</span>
                        </div>
                        {side.lineup.startingXI.map((p, pIdx) => (
                          <div
                            key={`${p.number}_${pIdx}`}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#101218] border border-stone-800/70"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-stone-900 border border-stone-800 font-mono-num text-[11px] font-extrabold text-stone-300 flex items-center justify-center shrink-0">
                                {p.number || pIdx + 1}
                              </span>
                              <span className="font-bold text-stone-100 truncate">
                                {p.name}
                              </span>
                              {p.isCaptain && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-extrabold">
                                  C
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-stone-400 px-1.5 py-0.5 rounded bg-stone-900/90 border border-stone-800">
                                {p.position}
                              </span>
                              {p.rating && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono-num text-[10px] font-extrabold">
                                  {p.rating}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {side.lineup.substitutes && side.lineup.substitutes.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                          <div className="text-[11px] font-extrabold text-purple-300 mb-1">
                            مقاعد البدلاء ({side.lineup.substitutes.length})
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {side.lineup.substitutes.map((sub, subIdx) => (
                              <div
                                key={`sub_${sub.number}_${subIdx}`}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#0d0f15] border border-stone-800/50 text-stone-300"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded bg-stone-900 border border-stone-800 font-mono-num text-[10px] font-bold text-stone-400 flex items-center justify-center shrink-0">
                                    {sub.number || '-'}
                                  </span>
                                  <span className="font-semibold text-stone-200 truncate text-[11px]">
                                    {sub.name}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-stone-500">
                                  {sub.position}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: STATS & HEAD-TO-HEAD */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Team Comparison Bars */}
              <div className="rounded-2xl border border-stone-800 bg-[#0b0d12] p-4 space-y-4">
                <div className="flex items-center justify-between text-xs font-extrabold text-stone-200 border-b border-stone-800 pb-2.5">
                  <span className="text-emerald-400">{match.teamA.name}</span>
                  <span>إحصائيات الفريقين</span>
                  <span className="text-purple-400">{match.teamB.name}</span>
                </div>

                {details.stats.map((st, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="font-mono-num text-emerald-400">{st.valueA}</span>
                      <span className="text-stone-300">{st.label}</span>
                      <span className="font-mono-num text-purple-400">{st.valueB}</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-900 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${st.percentA}%` }}
                      />
                      <div
                        className="bg-purple-500 transition-all"
                        style={{ width: `${st.percentB}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Head-to-Head History */}
              <div className="rounded-2xl border border-stone-800 bg-[#0b0d12] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                  <span>آخر المواجهات المباشرة</span>
                </div>
                <div className="space-y-2">
                  {details.h2h.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#101218] border border-stone-800 flex items-center justify-between gap-2"
                    >
                      <span className="text-[11px] text-stone-400 shrink-0">{item.date}</span>
                      <div className="flex items-center gap-3 font-bold text-stone-200">
                        <span>{item.teamA}</span>
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono-num text-emerald-400">
                          {item.scoreA} - {item.scoreB}
                        </span>
                        <span>{item.teamB}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 truncate hidden sm:inline">
                        {item.competition}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
