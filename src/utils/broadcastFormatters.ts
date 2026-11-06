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


