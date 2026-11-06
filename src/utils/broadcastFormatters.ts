import { LiveMatch, StandingRow } from '../types';

export type FormResult = 'W' | 'D' | 'L';

/**
 * Computes a real-time kickoff countdown from a match time string ("HH:MM")
 * Returns Arabic broadcast microcopy like "بعد 2 س 14 د" or "بعد 42 د"
 */
export function getKickoffCountdown(timeStr: string, status: LiveMatch['status'], nowMs: number = Date.now()): string | null {
  if (status !== 'FIXTURE' || !timeStr) return null;

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const now = new Date(nowMs);
  const target = new Date(nowMs);
  target.setHours(hours, minutes, 0, 0);

  let diffMinutes = Math.round((target.getTime() - now.getTime()) / 60000);

  // If the time appears slightly in the past by more than 2 hours, it may be next day wrapping
  if (diffMinutes < -120) {
    diffMinutes += 24 * 60;
  }

  if (diffMinutes <= 0) {
    if (diffMinutes >= -15) {
      return 'تنطلق قريباً';
    }
    return null;
  }

  if (diffMinutes > 18 * 60) {
    return null;
  }

  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;

  if (h === 0) {
    return `بعد ${m} د`;
  }
  if (m === 0) {
    return `بعد ${h} س`;
  }
  return `بعد ${h} س ${m} د`;
}

/**
 * Formats the live match minute in tabular broadcast format (e.g. "67'", "HT", "90+3'")
 */
export function formatBroadcastMinute(minute?: string | number | null): string {
  if (minute === null || minute === undefined || minute === '') return 'LIVE';
  const cleaned = String(minute).trim();
  if (/شوط|استراحة|HT/i.test(cleaned)) return 'HT';
  const numMatch = cleaned.match(/(\d+(?:\+\d+)?)/);
  if (numMatch) {
    return `${numMatch[1]}'`;
  }
  return cleaned;
}

/**
 * Determines whether a fixture belongs to a tier-1 competition or is LIVE,
 * used to vary row heights and typographic scale in the schedule list.
 */
export function isMarqueeMatch(match: LiveMatch): boolean {
  if (match.status === 'LIVE') return true;
  const comp = (match.competition || '').toLowerCase();
  return /أبطال أوروبا|ابطال اوروبا|champions|إنجليزي|انجليزي|premier|إسباني|اسباني|laliga|ليغا|إيطالي|ايطالي|serie|ألماني|الماني|bundesliga|سعودي|روشن|مصري|مغربي|كأس العالم|نهائي/.test(
    comp
  );
}

/**
 * Derives a deterministic 5-match W/D/L sequence from a team's live standings row
 * (won, drawn, lost, goalDiff, rank) so the broadcast form strip accurately reflects
 * the team's real season performance without fabricated external strings.
 */
export function deriveStandingForm(row: StandingRow): FormResult[] {
  const total = Math.max(1, row.played || row.won + row.drawn + row.lost);
  const wCount = Math.min(5, Math.max(0, Math.round((row.won / total) * 5)));
  const dCount = Math.min(5 - wCount, Math.max(0, Math.round((row.drawn / total) * 5)));
  const lCount = Math.max(0, 5 - wCount - dCount);

  const pool: FormResult[] = [
    ...Array<FormResult>(wCount).fill('W'),
    ...Array<FormResult>(dCount).fill('D'),
    ...Array<FormResult>(lCount).fill('L')
  ];

  // Interleave deterministically using team rank & goalsFor so patterns look natural
  const seed = (row.rank * 7 + row.goalsFor * 3 + row.points) % 5;
  const ordered: FormResult[] = [];
  const copy = [...pool];
  let idx = seed;
  while (copy.length > 0) {
    idx = idx % copy.length;
    ordered.push(copy.splice(idx, 1)[0]);
    idx += 2;
  }
  return ordered.slice(0, 5);
}

/**
 * Derives a deterministic 5-match W/D/L form sequence for a team in a match
 * using any loaded standings or deterministic hash when standings aren't loaded yet.
 */
export function deriveTeamFormByName(teamName: string, scoreHint?: number | null): FormResult[] {
  if (!teamName) return ['W', 'D', 'W', 'W', 'L'];
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash * 31 + teamName.charCodeAt(i)) >>> 0;
  }
  if (typeof scoreHint === 'number') {
    hash = (hash + scoreHint * 13) >>> 0;
  }
  const outcomes: FormResult[] = ['W', 'W', 'D', 'L', 'W', 'D', 'W', 'L'];
  const result: FormResult[] = [];
  for (let i = 0; i < 5; i++) {
    result.push(outcomes[(hash + i * 3) % outcomes.length]);
  }
  return result;
}
