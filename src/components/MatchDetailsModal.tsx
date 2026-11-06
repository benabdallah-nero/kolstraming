import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Activity,
  BarChart3,
  ArrowRightLeft
} from 'lucide-react';
import { LiveMatch, MatchDetailsData } from '../types';
import { getApiUrl } from '../context/AppContext';
import { TeamLogo } from './TeamLogo';
import { buildMatchDetailsForMatch, fetchMatchDetailsWithFallback } from '../utils/footballData';
import {
  formatBroadcastMinute,
  getKickoffCountdown
} from '../utils/broadcastFormatters';

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
  const [activeTab, setActiveTab] = useState<'events' | 'stats'>('events');
  const [details, setDetails] = useState<MatchDetailsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!match) return;
    setActiveTab('events');
    setLoading(true);

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
    fetchMatchDetailsWithFallback(
      match,
      getApiUrl(`/api/match-details/${encodeURIComponent(match.id)}?${qs.toString()}`)
    )
      .then(liveDetails => {
        if (!cancelled && liveDetails) {
          setDetails(liveDetails);
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
  const countdown = getKickoffCountdown(match.time, match.status);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl shadow-black/60"
      >
        {/* 1. BROADCAST SCOREBOARD HEADER */}
        <div className="bg-[var(--bg-canvas)] border-b border-[var(--border-hairline)]">
          {/* Top Metadata Strip */}
          <div className="px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-display-num text-[11px] font-extrabold uppercase">
                MATCH CENTRE
              </span>
              <span className="font-display-ar">{match.competition}</span>
              {details.stadium && (
                <span className="text-[var(--text-muted)] font-normal hidden sm:inline">
                  | {details.stadium}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--signal-live)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Teams & Tabular Scoreline */}
          <div className="p-5 sm:p-7 grid grid-cols-11 items-center gap-3 sm:gap-4">
            {/* Team A (4 cols) */}
            <div className="col-span-4 flex flex-col items-center text-center gap-2 min-w-0">
              <TeamLogo
                name={match.teamA.name}
                src={match.teamA.logo}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-full bg-[var(--bg-canvas)] p-1 border border-white/5"
              />
              <span
                className="font-display-ar text-sm sm:text-base font-extrabold text-[var(--text-primary)] truncate max-w-full"
                title={match.teamA.name}
              >
                {match.teamA.name}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">صاحب الأرض</span>
            </div>

            {/* Center Score / Kickoff (3 cols) */}
            <div className="col-span-3 flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-inner">
              {hasScore ? (
                <div className="font-display-num text-3xl sm:text-5xl font-black text-[var(--accent-primary)] leading-none tracking-tight">
                  {match.scoreA} : {match.scoreB}
                </div>
              ) : (
                <div className="font-display-num text-2xl sm:text-4xl font-black text-[var(--text-primary)] leading-none">
                  {match.time}
                </div>
              )}

              <div className="mt-2">
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-live)] text-white font-display-num text-xs font-black shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{formatBroadcastMinute(match.minute)}</span>
                  </span>
                ) : match.status === 'RESULT' ? (
                  <span className="px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-[11px] font-bold text-[var(--text-muted)] uppercase">
                    FULL TIME · انتهت
                  </span>
                ) : (
                  <span className="font-display-num text-xs font-bold text-[var(--accent-primary)]">
                    {countdown || 'لم تنطلق بعد'}
                  </span>
                )}
              </div>
            </div>

            {/* Team B (4 cols) */}
            <div className="col-span-4 flex flex-col items-center text-center gap-2 min-w-0">
              <TeamLogo
                name={match.teamB.name}
                src={match.teamB.logo}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-full bg-[var(--bg-canvas)] p-1 border border-white/5"
              />
              <span
                className="font-display-ar text-xs sm:text-base font-extrabold text-[var(--text-primary)] truncate max-w-full"
                title={match.teamB.name}
              >
                {match.teamB.name}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">الفريق الضيف</span>
            </div>
          </div>

          {/* Direct Broadcast Channels Strip */}
          {match.channels && match.channels.length > 0 && (
            <div className="px-4 py-2.5 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-center gap-2">
              {match.channels.slice(0, 3).map((ch, idx) => (
                <button
                  key={ch.channel_id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onTuneIn(ch.channel_id, ch.channel_name);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                    idx === 0
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110'
                      : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-hairline)]'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>بث مباشر · {ch.channel_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. REFINED 2-TAB BAR (EVENTS & STATS ONLY) */}
        <div className="grid grid-cols-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`py-3.5 flex items-center justify-center gap-2 border-l border-[var(--border-hairline)] border-b-[3px] transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'border-b-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-elevated)] font-black'
                : 'border-b-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="font-display-ar text-sm">أحداث المباراة المباشرة</span>
            {details.events.length > 0 && (
              <span className="font-display-num text-xs px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-bold">
                {details.events.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`py-3.5 flex items-center justify-center gap-2 border-b-[3px] transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'border-b-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-elevated)] font-black'
                : 'border-b-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="font-display-ar text-sm">إحصائيات المباراة والمواجهات</span>
          </button>
        </div>

        {/* 3. TAB BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs bg-[var(--bg-canvas)]">
          {loading && (
            <div className="text-center text-[var(--accent-primary)] text-xs font-bold py-1 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
              <span>جاري تحديث أحداث وإحصائيات المباراة لحظياً...</span>
            </div>
          )}

          {/* TAB 1: MATCH EVENTS LOG */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {details.events.length === 0 ? (
                <div className="py-14 text-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-2xl p-6 space-y-2.5 shadow-sm">
                  <div className="font-display-num text-xl font-extrabold text-[var(--text-muted)]">
                    NO MATCH EVENTS RECORDED YET
                  </div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    لم تُسجل أحداث في هذه المواجهة حتى الآن
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                    يتم رصد وتسجيل الأهداف، البطاقات الملونة، ركلات الجزاء، والتبديلات تلقائياً لحظة وقوعها أثناء سير المباراة.
                  </p>
                </div>
              ) : (
                <div className="border border-[var(--border-hairline)] rounded-2xl divide-y divide-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
                  {details.events.map(ev => {
                    const isTeamA = ev.team === 'A';

                    return (
                      <div
                        key={ev.id}
                        className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-[var(--bg-row-hover)] border-r-2 ${
                          isTeamA
                            ? 'border-r-[var(--accent-primary)]'
                            : 'border-r-[#3b82f6]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Minute Badge */}
                          <span className="w-12 py-1 text-center bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-lg font-display-num text-xs sm:text-sm font-extrabold text-[var(--accent-primary)] shrink-0 shadow-inner">
                            {formatBroadcastMinute(ev.minute)}
                          </span>

                          {/* Event Type Badge & Description */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {ev.type === 'goal' || ev.type === 'penalty_goal' ? (
                              <span className="px-2.5 py-1 rounded-md bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-display-ar text-xs font-black shrink-0 shadow-sm">
                                {ev.type === 'penalty_goal' ? 'هدف (ركلة جزاء)' : 'هدف'}
                              </span>
                            ) : ev.type === 'yellow_card' ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                                <span className="w-2.5 h-3.5 bg-amber-400 rounded-[1px] inline-block shadow-sm" />
                                <span>بطاقة صفراء</span>
                              </span>
                            ) : ev.type === 'red_card' ? (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--signal-live)]/20 text-[var(--signal-live)] border border-[var(--signal-live)]/30 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                                <span className="w-2.5 h-3.5 bg-[var(--signal-live)] rounded-[1px] inline-block shadow-sm" />
                                <span>بطاقة حمراء</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5 shrink-0">
                                <ArrowRightLeft className="w-3 h-3 text-[var(--accent-primary)]" />
                                <span>تبديل</span>
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[var(--text-primary)] text-xs sm:text-sm truncate">
                                {ev.player}
                              </div>
                              {(ev.assistOrSubOut || ev.detail) && (
                                <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                  {ev.assistOrSubOut || ev.detail}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Team Attribution */}
                        <span
                          className={`text-xs font-extrabold shrink-0 px-2.5 py-1 rounded-lg border ${
                            isTeamA
                              ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {isTeamA ? match.teamA.name : match.teamB.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STATS & HEAD-TO-HEAD */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              {/* Team Comparison Header & Bars */}
              <div className="border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-black border-b border-[var(--border-hairline)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                    <span className="text-[var(--accent-primary)] text-sm">{match.teamA.name}</span>
                  </div>
                  <span className="font-display-ar text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    مقارنة إحصائيات اللعب
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 text-sm">{match.teamB.name}</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                </div>

                {details.stats.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-1">
                    <div className="font-bold text-[var(--text-secondary)]">
                      الإحصائيات المباشرة تصدر مع انطلاق الشوط الأول للمباراة
                    </div>
                    <div>تابع أدناه السجل التاريخي للمواجهات المباشرة بين الفريقين.</div>
                  </div>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    {details.stats.map((st, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="font-display-num text-sm sm:text-base font-black text-[var(--accent-primary)]">
                            {st.valueA}
                          </span>
                          <span className="text-[var(--text-secondary)] font-medium text-xs">
                            {st.label}
                          </span>
                          <span className="font-display-num text-sm sm:text-base font-black text-blue-400">
                            {st.valueB}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] overflow-hidden flex">
                          <div
                            className="bg-[var(--accent-primary)] transition-all rounded-r-full"
                            style={{ width: `${st.percentA}%` }}
                          />
                          <div
                            className="bg-blue-400 transition-all rounded-l-full"
                            style={{ width: `${st.percentB}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Head-to-Head History */}
              <div className="border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] flex items-center justify-between">
                  <h3 className="font-display-ar text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                    سجل المواجهات المباشرة الأخيرة (H2H)
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)] font-display-num">
                    HEAD TO HEAD
                  </span>
                </div>

                {details.h2h.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    لا توجد مواجهات مباشرة مسجلة مؤخراً بين الفريقين في قاعدة البيانات.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-hairline)]">
                    {details.h2h.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-row-hover)] transition-colors"
                      >
                        <span className="font-display-num text-xs text-[var(--text-muted)] shrink-0">
                          {item.date}
                        </span>
                        <div className="flex items-center gap-3 font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                          <span className="truncate max-w-[120px] sm:max-w-[180px]">{item.teamA}</span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-display-num text-xs sm:text-sm font-black text-[var(--accent-primary)] shadow-inner">
                            {item.scoreA} - {item.scoreB}
                          </span>
                          <span className="truncate max-w-[120px] sm:max-w-[180px]">{item.teamB}</span>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)] truncate hidden sm:inline">
                          {item.competition}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
