// Cloudflare Worker Entry Point (Full-Stack Edge Backend + Static Assets SPA Fallback)
// Handles /api/channels, /api/live-matches, /api/standings, /api/match-details/:id,
// /api/epg/live, /api/resolve-m3u8/:id, /api/proxy-stream/:id/live.m3u8, /api/proxy-chunk

import {
  LEAGUES_CATALOG,
  YALLAKORA_STANDING_PATHS,
  ESPN_LEAGUE_SLUGS,
  parseYallakoraStandingsHtml,
  parseEspnStandingsToArabic,
  buildMatchDetailsForMatch,
  parseYallakoraEventsFromHtml
} from './src/utils/footballData';
import { CHANNELS as CURATED_SPECIAL_CHANNELS } from './src/data/channels';
import { resolveBroadcaster } from './src/utils/broadcasterResolver';
import { findEventForTeams } from './src/utils/teamMatching';

interface Env {
  ASSETS?: {
    fetch: (req: Request | string) => Promise<Response>;
  };
  VERCEL_BACKEND_URL?: string;
  API_BACKEND_URL?: string;
  [key: string]: any;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const edgeCache: Record<string, CacheEntry<any>> = {};

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = edgeCache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    delete edgeCache[key];
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  edgeCache[key] = { data, timestamp: Date.now() };
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range'
};

function jsonResponse(data: any, status = 200, cacheSec = 60): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${cacheSec}, s-maxage=${cacheSec}`
    }
  });
}

const DEFAULT_SECRET = 'kolstream_secure_hmac_secret_2026_9b8a7c6d';

async function signStreamTokenEdge(
  channelId: string | number,
  exp: number,
  secret: string = DEFAULT_SECRET
): Promise<string> {
  const enc = new TextEncoder();
  const data = `stream:${channelId}:${exp}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const hashArr = Array.from(new Uint8Array(sig));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function verifyStreamTokenEdge(
  channelId: string | number,
  expStr: string | number | null,
  token: string | null,
  secret: string = DEFAULT_SECRET
): Promise<boolean> {
  if (!token || !expStr) return false;
  const exp = typeof expStr === 'number' ? expStr : parseInt(expStr, 10);
  if (isNaN(exp)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (exp < now - 300) return false;
  if (exp > now + 86400) return false;

  const expected = await signStreamTokenEdge(channelId, exp, secret);
  if (token === expected) return true;
  const universal = await signStreamTokenEdge('*', exp, secret);
  return token === universal;
}

function isOriginAllowedEdge(originOrReferer: string | null | undefined, requestHost?: string | null): boolean {
  if (!originOrReferer) return true;
  try {
    const parsed = new URL(originOrReferer);
    const hostname = parsed.hostname.toLowerCase();
    if (requestHost) {
      const cleanHost = requestHost.split(':')[0].toLowerCase();
      if (hostname === cleanHost) return true;
    }
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.workers.dev') ||
      hostname.endsWith('.pages.dev') ||
      hostname.endsWith('.run.app') ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.kolnovel.com') ||
      hostname.endsWith('.kolstreaming.com')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Core 24/7 base channels (verified IDs from DaddyLive catalog)


function isExcludedChannelName(rawName: string): boolean {
  return /ssc|alkass|al kass|abu dhabi|ad sport|dubai|israel|5plus|sport\s*[1-5]\s*il|yes\s*sport|one\s*il/i.test(rawName);
}

function categorizeChannel(name: string): { category: 'ar' | 'bein' | 'euro' | 'other'; subcat: string; lang: string } {
  const lower = name.toLowerCase();
  if (lower.includes('bein')) {
    if (lower.includes('arabic') || /bein\s*sports?\s*(?:mena\s*)?[1-9]\b/i.test(lower)) {
      if (lower.includes('english')) return { category: 'bein', subcat: 'bein_mena', lang: 'English' };
      if (!lower.includes('france') && !lower.includes('turkey') && !lower.includes('australia') && !lower.includes('malaysia')) {
        return { category: 'ar', subcat: 'bein_ar', lang: 'Arabic' };
      }
    }
    if (lower.includes('france') || lower.includes('max')) return { category: 'bein', subcat: 'bein_fr', lang: 'French' };
    if (lower.includes('turkey')) return { category: 'bein', subcat: 'bein_tr', lang: 'Turkish' };
    if (lower.includes('australia')) return { category: 'bein', subcat: 'bein_au', lang: 'English' };
    if (lower.includes('usa') || lower.includes('xtra')) return { category: 'bein', subcat: 'bein_us', lang: 'English' };
    if (lower.includes('español')) return { category: 'bein', subcat: 'bein_es', lang: 'Spanish' };
    return { category: 'bein', subcat: 'bein_global', lang: 'Multilingual' };
  }
  if (/euro|arena|astro|sky sport|tnt sport|dazn|espn|canal\+|paramount|supersport|super sport|premier sport|sport tv|eleven sport|ziggo|viaplay|movistar|laliga|ligue1/i.test(lower)) {
    return { category: 'euro', subcat: 'euro_sports', lang: 'European' };
  }
  return { category: 'other', subcat: 'global', lang: 'International' };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{26BD}\u{1F3C6}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface DliveSoccerEvent {
  id: string;
  gmtTime: string;
  meccaTime: string;
  gmtMinutes: number;
  competition: string;
  teamA: string;
  teamB: string;
  status: 'LIVE' | 'FIXTURE' | 'RESULT';
  statusText: string;
  minute: string | null;
  channels: Array<{ channel_id: number; channel_name: string; quality: string; isBeinArabic: boolean }>;
}

interface DliveCatalogData {
  events: DliveSoccerEvent[];
  discoveredChannels: Array<{ id: number; name: string; category: string; subcat: string; quality: string; lang: string; country: string; description?: string }>;
}

async function fetchDliveSoccerCatalog(): Promise<DliveCatalogData> {
  const cached = getCached<DliveCatalogData>('dlive_soccer_catalog_v2', 3 * 60 * 1000);
  if (cached) return cached;

  const events: DliveSoccerEvent[] = [];
  const channelMap = new Map<number, { id: number; name: string; category: string; subcat: string; quality: string; lang: string; country: string; description?: string }>();

  try {
    const res = await fetch('https://dlive.sx/index.php?cat=All+Soccer+Events+%E2%9A%BD', {
      headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const html = await res.text();
      const blocks = html.split(/<div class="schedule__event">/);
      const now = new Date();
      const nowUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

      for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        const rawTime = block.match(/class="schedule__time"[^>]*>(.*?)<\/span>/)?.[1]?.trim() || '00:00';
        const rawTitle = block.match(/class="schedule__eventTitle"[^>]*>([\s\S]*?)<\/span>/)?.[1] || '';
        const cleanTitle = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, ''));
        if (!cleanTitle || !cleanTitle.toLowerCase().includes(' vs ')) continue;
        if (/israel|maccabi|hapoel|beitar|bnei sakhnin/i.test(cleanTitle)) continue;

        let competition = 'مباريات كرة القدم العالمية';
        let teamsPart = cleanTitle;
        const colonIdx = cleanTitle.indexOf(':');
        if (colonIdx !== -1) {
          competition = cleanTitle.slice(0, colonIdx).trim();
          teamsPart = cleanTitle.slice(colonIdx + 1).trim();
        }

        const vsParts = teamsPart.split(/\s+vs\s+/i);
        if (vsParts.length < 2) continue;
        const teamA = vsParts[0].trim();
        const teamB = vsParts.slice(1).join(' vs ').trim();

        const [hhStr, mmStr] = rawTime.split(':');
        const gmtH = parseInt(hhStr || '0', 10);
        const gmtM = parseInt(mmStr || '0', 10);
        const gmtMinutes = gmtH * 60 + gmtM;
        const meccaH = (gmtH + 3) % 24;
        const meccaTime = `${String(meccaH).padStart(2, '0')}:${String(gmtM).padStart(2, '0')}`;

        let diff = nowUtcMinutes - gmtMinutes;
        if (diff < -720) diff += 1440;
        let status: 'LIVE' | 'FIXTURE' | 'RESULT' = 'FIXTURE';
        let statusText = 'لم تبدأ بعد';
        let minute: string | null = null;

        if (diff >= 0 && diff <= 115) {
          status = 'LIVE';
          if (diff <= 45) {
            statusText = 'الشوط الأول';
            minute = `${Math.max(1, diff)}'`;
          } else if (diff <= 60) {
            statusText = 'استراحة ما بين الشوطين';
            minute = 'HT';
          } else {
            const secHalfMin = Math.min(90, 45 + (diff - 60));
            statusText = 'الشوط الثاني';
            minute = `${secHalfMin}'`;
          }
        } else if (diff > 115 && diff < 600) {
          status = 'RESULT';
          statusText = 'انتهت';
        }

        const chLinks = [...block.matchAll(/href=["']\/watch\.php\?id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/g)];
        const eventChannels: Array<{ channel_id: number; channel_name: string; quality: string; isBeinArabic: boolean }> = [];
        const seenInEvent = new Set<number>();

        for (const m of chLinks) {
          const chId = parseInt(m[1], 10);
          const chName = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
          if (!chId || !chName || seenInEvent.has(chId) || isExcludedChannelName(chName)) continue;
          seenInEvent.add(chId);

          const isBeinAr = (chId >= 91 && chId <= 99) || chId === 578 || /bein\s*sports\s*mena\s*[1-9]\b/i.test(chName);
          const displayName = isBeinAr && chId >= 91 && chId <= 99 ? `beIN Sports ${chId - 90} HD` : chName;

          eventChannels.push({
            channel_id: chId,
            channel_name: displayName,
            quality: '1080p FHD',
            isBeinArabic: isBeinAr
          });

          const existing = channelMap.get(chId);
          const isGenericEventStream = /event\s*(sd\s*)?stream/i.test(chName);
          if (!existing || (/event\s*(sd\s*)?stream/i.test(existing.name) && !isGenericEventStream)) {
            const { category, subcat, lang } = categorizeChannel(chName);
            const finalName = isGenericEventStream ? `${chName} #${chId} (${teamA} vs ${teamB})` : chName;
            channelMap.set(chId, {
              id: chId,
              name: finalName,
              category,
              subcat,
              quality: '1080p FHD',
              lang,
              country: 'Global',
              description: `${competition}: ${teamA} vs ${teamB} (${meccaTime} بتوقيت مكة)`
            });
          }
        }

        eventChannels.sort((a, b) => {
          const score = (c: { channel_id: number; channel_name: string; isBeinArabic: boolean }) => {
            if (c.isBeinArabic) return 100;
            if (/bein/i.test(c.channel_name)) return 80;
            if (/sky|tnt|dazn|paramount|canal\+|arena|espn|cbs|eurosport|sport tv|premier/i.test(c.channel_name)) return 60;
            if (/event/i.test(c.channel_name)) return 10;
            return 40;
          };
          return score(b) - score(a);
        });

        events.push({
          id: `dlive_ev_${i}_${gmtMinutes}`,
          gmtTime: rawTime,
          meccaTime,
          gmtMinutes,
          competition,
          teamA,
          teamB,
          status,
          statusText,
          minute,
          channels: eventChannels
        });
      }
    }
  } catch {
    // Fallback
  }

  const result: DliveCatalogData = {
    events,
    discoveredChannels: Array.from(channelMap.values())
  };
  if (events.length > 0) {
    setCache('dlive_soccer_catalog_v2', result);
  }
  return result;
}

const COMPETITION_AR_MAP: Array<[RegExp, string]> = [
  [/england\s*-\s*premier league/i, 'الدوري الإنجليزي الممتاز'],
  [/spain\s*-\s*la\s*liga/i, 'الدوري الإسباني (لا ليغا)'],
  [/italy\s*-\s*serie a/i, 'الدوري الإيطالي (سيريا آ)'],
  [/germany\s*-\s*bundesliga/i, 'الدوري الألماني (البوندسليغا)'],
  [/france\s*-\s*ligue 1/i, 'الدوري الفرنسي (ليغ 1)'],
  [/portugal\s*-\s*primeira liga/i, 'الدوري البرتغالي الممتاز'],
  [/uefa champions league/i, 'دوري أبطال أوروبا'],
  [/uefa europa league/i, 'الدوري الأوروبي'],
  [/turkey\s*-\s*super lig/i, 'الدوري التركي الممتاز'],
  [/netherlands\s*-\s*eredivisie/i, 'الدوري الهولندي']
];

function translateCompetition(comp: string): string {
  for (const [rx, ar] of COMPETITION_AR_MAP) {
    if (rx.test(comp)) return ar;
  }
  return comp;
}

async function getLiveMatchesList(dateKey: 'yesterday' | 'today' | 'tomorrow' = 'today'): Promise<any[]> {
  const cacheKey = `live_matches_realtime_v3_${dateKey}`;
  const cachedMatches = getCached<any[]>(cacheKey, dateKey === 'today' ? 20 * 1000 : 120 * 1000);
  if (cachedMatches) return cachedMatches;

  const targetDate = new Date();
  if (dateKey === 'yesterday') targetDate.setUTCDate(targetDate.getUTCDate() - 1);
  else if (dateKey === 'tomorrow') targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  const ykDate = `${targetDate.getUTCMonth() + 1}/${targetDate.getUTCDate()}/${targetDate.getUTCFullYear()}`;
  const ykUrl =
    dateKey === 'today'
      ? 'https://www.yallakora.com/matches-center'
      : `https://www.yallakora.com/matches-center?date=${encodeURIComponent(ykDate)}`;

  const mapBroadcaster = (rawChannel: string | null) => resolveBroadcaster(rawChannel);

  const [ykRes, dliveCatalog] = await Promise.allSettled([
    fetch(ykUrl, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8' },
      signal: AbortSignal.timeout(4500)
    }),
    dateKey === 'today' ? fetchDliveSoccerCatalog() : Promise.resolve({ events: [], discoveredChannels: [] })
  ]);

  const dliveEvents = dliveCatalog.status === 'fulfilled' ? dliveCatalog.value.events : [];
  const matchedDliveIds = new Set<string>();
  const liveList: any[] = [];
  let matchIdx = 0;

  if (ykRes.status === 'fulfilled' && ykRes.value.ok) {
    const html = await ykRes.value.text();
    const cards = html.split(/<div[^>]*class="[^"]*matchCard[^"]*"[^>]*>/);

    for (let i = 1; i < cards.length; i++) {
      const card = cards[i];
      const tournMatch = card.match(/class="tourTitle"[^>]*>(.*?)<\/a>/s);
      const tournament = tournMatch ? tournMatch[1].replace(/<[^>]+>/g, '').trim() : 'مباراة رسمية';
      const lowerTourn = tournament.toLowerCase();
      if (/طائرة|يد|سلة|قسم ثاني|القسم الثاني|درجة ثانية|هواة/.test(lowerTourn)) continue;

      const items = card.split(/<div[^>]*livescorematchid=/i);
      for (let j = 1; j < items.length; j++) {
        const item = 'livescorematchid=' + items[j];
        const ykIdMatch = item.match(/livescorematchid=["'](\d+)["']/i) || item.match(/\/match\/(\d+)\//i);
        const ykMatchId = ykIdMatch ? ykIdMatch[1] : null;

        const teamAMatch = item.match(/class="teams teamA".*?<p>(.*?)<\/p>/s);
        const teamA = teamAMatch ? teamAMatch[1].trim() : null;
        const teamBMatch = item.match(/class="teams teamB".*?<p>(.*?)<\/p>/s);
        const teamB = teamBMatch ? teamBMatch[1].trim() : null;
        if (!teamA || !teamB) continue;
        if (/إسرائيل|الكيان|مكابي|هابويل|هبوعيل|تل أبيب|بئر سبع|بيتار|سخنين|maccabi|hapoel/i.test(`${teamA} ${teamB}`)) continue;

        const chMatch = item.match(/<div class="channel[^"]*">(.*?)<\/div>/);
        const rawChannel = chMatch ? chMatch[1].replace(/<[^>]+>/g, '').trim() : null;
        const mapped = mapBroadcaster(rawChannel);

        const timeMatch = item.match(/class="time">(.*?)<\/span>/);
        const timeStr = timeMatch ? timeMatch[1].trim() : '21:00';

        const statusMatch = item.match(/class="matchStatus[^"]*".*?<span>(.*?)<\/span>/s);
        const rawStatus = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : 'لم تبدأ';

        let status: 'LIVE' | 'FIXTURE' | 'RESULT' = 'FIXTURE';
        const sLower = rawStatus.toLowerCase();
        if (/مباشر|شوط|استراحة|الان|الآن/.test(sLower)) status = 'LIVE';
        else if (sLower.includes('انتهت')) status = 'RESULT';

        const scores = [...item.matchAll(/<span class="score">([0-9]+)<\/span>/g)].map(m => parseInt(m[1], 10));
        const scoreA = scores.length > 0 ? scores[0] : null;
        const scoreB = scores.length > 1 ? scores[1] : null;

        const logoAMatch = item.match(/class="teams teamA".*?<img[^>]*src="([^"]+)"/s);
        const logoA = logoAMatch ? logoAMatch[1].replace(/\\/g, '/') : null;
        const logoBMatch = item.match(/class="teams teamB".*?<img[^>]*src="([^"]+)"/s);
        const logoB = logoBMatch ? logoBMatch[1].replace(/\\/g, '/') : null;

        const matchedDlive = findEventForTeams(teamA, teamB, timeStr, dliveEvents, tournament);
        const mergedChannels = [...mapped.channels];
        const seenChIds = new Set(mergedChannels.map(c => c.channel_id));

        if (matchedDlive) {
          matchedDliveIds.add(matchedDlive.id);
          for (const dch of matchedDlive.channels) {
            if (!seenChIds.has(dch.channel_id)) {
              mergedChannels.push(dch);
              seenChIds.add(dch.channel_id);
            }
          }
        }

        const hasBeinAr = mergedChannels.some(c => c.isBeinArabic);
        let broadcasterLabel = mapped.broadcasterLabel;
        if (mergedChannels.length > 0) {
          broadcasterLabel = mergedChannels.slice(0, 3).map(c => c.channel_name).join(' / ');
        } else if (!broadcasterLabel) {
          broadcasterLabel = 'غير منقولة تلفزيونياً';
        }

        matchIdx++;
        liveList.push({
          id: ykMatchId ? `yk_${ykMatchId}` : `yk_${matchIdx}`,
          competition: tournament,
          teamA: { name: teamA, logo: logoA },
          teamB: { name: teamB, logo: logoB },
          scoreA,
          scoreB,
          status,
          statusText: rawStatus,
          minute: status === 'LIVE' ? (rawStatus || 'مباشر') : null,
          time: `${timeStr} بتوقيت مكة`,
          localTime: `${timeStr} بتوقيت مكة`,
          channels: mergedChannels.slice(0, 6),
          isBeinArabic: hasBeinAr,
          broadcasterLabel,
          network: hasBeinAr ? 'bein_ar' : mergedChannels.length > 0 ? 'other' : 'unbroadcast'
        });
      }
    }
  }

  for (const ev of dliveEvents) {
    if (matchedDliveIds.has(ev.id)) continue;
    if (ev.channels.length === 0) continue;
    const hasBeinAr = ev.channels.some(c => c.isBeinArabic);

    liveList.push({
      id: ev.id,
      competition: translateCompetition(ev.competition),
      teamA: { name: ev.teamA },
      teamB: { name: ev.teamB },
      scoreA: null,
      scoreB: null,
      status: ev.status,
      statusText: ev.statusText,
      minute: ev.minute,
      time: `${ev.meccaTime} بتوقيت مكة`,
      localTime: `${ev.meccaTime} بتوقيت مكة`,
      channels: ev.channels.slice(0, 6),
      isBeinArabic: hasBeinAr,
      broadcasterLabel: ev.channels.slice(0, 3).map(c => c.channel_name).join(' / '),
      network: hasBeinAr ? 'bein_ar' : 'other'
    });
  }

  liveList.sort((a, b) => {
    const order: Record<string, number> = { LIVE: 0, FIXTURE: 1, RESULT: 2 };
    const orderA = order[a.status] ?? 3;
    const orderB = order[b.status] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    const aHasBein = a.isBeinArabic ? 2 : a.channels.length > 0 ? 1 : 0;
    const bHasBein = b.isBeinArabic ? 2 : b.channels.length > 0 ? 1 : 0;
    return bHasBein - aHasBein;
  });

  if (liveList.length > 0) {
    setCache(cacheKey, liveList);
  }
  return liveList;
}

const CHANNEL_SLUG_MAP: Record<string, string> = {
  '91': 'beINAR',
  '92': 'beINAR2',
  '93': 'beINAR3',
  '94': 'beINAR4',
  '95': 'beINAR5',
  '96': 'beINAR6',
  '97': 'beINAR7',
  '98': 'beINAR8',
  '99': 'beINAR9',
  '578': 'beINNews',
  '61': 'beINEN1',
  '90': 'beINEN2',
  '100': 'beINXTRA1',
  '101': 'beINXTRA2',
  '425': 'beINSPORTSUS',
  '426': 'beINSPORTSen',
  '427': 'beINSPORTSes',
  '116': 'beINSPORTS1FR',
  '117': 'beINSPORTS2FR',
  '118': 'beINSPORTS3FR',
  '771': 'Euro1',
  '772': 'Euro1FR',
  '773': 'Euro2',
  '774': 'Euro2FR',
  '524': 'Euro1ES',
  '525': 'Euro2ES'
};

async function getChannelStreamSlug(channelId: string | number): Promise<string | null> {
  const strId = String(channelId);
  if (CHANNEL_SLUG_MAP[strId]) return CHANNEL_SLUG_MAP[strId];
  const cachedSlug = getCached<string>(`slug_${strId}`, 24 * 60 * 60 * 1000);
  if (cachedSlug) return cachedSlug;

  try {
    const res = await fetch(`https://dlive.sx/player/stream-${strId}.php`, {
      headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/stream=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      setCache(`slug_${strId}`, match[1]);
      return match[1];
    }
  } catch {
    // Fallback
  }
  return null;
}

async function getDirectM3u8Url(slug: string): Promise<string | null> {
  const cachedUrl = getCached<string>(`m3u8_${slug}`, 45 * 1000);
  if (cachedUrl) return cachedUrl;

  try {
    const res = await fetch(`https://wideiptv.top/player/${slug}`, {
      headers: { 'User-Agent': UA, 'Referer': 'https://wideiptv.top/' },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/streamUrl:\s*["'](https:\\[/\\]+[^"']+)["']/);
    if (match && match[1]) {
      const directUrl = match[1].replace(/\\\//g, '/');
      setCache(`m3u8_${slug}`, directUrl);
      return directUrl;
    }
  } catch {
    // Fallback
  }
  return null;
}

interface DembedConfig {
  src: string;
  edge: string;
  channel: string;
}

async function getDembedConfig(channelId: string | number): Promise<DembedConfig> {
  const strId = String(channelId);
  const cached = getCached<DembedConfig>(`dembed_cfg_${strId}`, 10 * 60 * 1000);
  if (cached) return cached;

  const fallbackCfg: DembedConfig = {
    src: `https://edge.cowedd4855ws.sbs/premium${strId}/index.m3u8`,
    edge: 'https://edge.cowedd4855ws.sbs',
    channel: `premium${strId}`
  };

  try {
    const dembedRes = await fetch(`https://dembed.st/premiumtv/daddy.php?id=${strId}`, {
      headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
      signal: AbortSignal.timeout(3500)
    });
    if (dembedRes.ok) {
      const html = await dembedRes.text();
      const srcMatch = html.match(/const\s+SRC\s*=\s*["']([^"']+)["']/);
      const edgeMatch = html.match(/const\s+EDGE\s*=\s*["']([^"']+)["']/);
      const chMatch = html.match(/const\s+CHANNEL\s*=\s*["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        const cfg: DembedConfig = {
          src: srcMatch[1],
          edge: edgeMatch?.[1] || 'https://edge.cowedd4855ws.sbs',
          channel: chMatch?.[1] || `premium${strId}`
        };
        setCache(`dembed_cfg_${strId}`, cfg);
        return cfg;
      }
    }
  } catch {
    // Fallback
  }
  return fallbackCfg;
}

async function getDembedAuthedM3u8Url(channelId: string | number): Promise<string | null> {
  const cfg = await getDembedConfig(channelId);
  const tokenKey = `dembed_tok_${cfg.channel}`;
  let token = getCached<string>(tokenKey, 50 * 1000);

  if (!token) {
    try {
      const tokRes = await fetch(`${cfg.edge}/api/playlist-token?slug=${encodeURIComponent(cfg.channel)}`, {
        headers: {
          'User-Agent': UA,
          'Origin': 'https://dembed.st',
          'Referer': 'https://dembed.st/'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (tokRes.ok) {
        const tokData = (await tokRes.json()) as { token?: string };
        if (tokData && tokData.token) {
          token = tokData.token;
          setCache(tokenKey, token);
        }
      }
    } catch {
      // Fallback
    }
  }

  if (!token) return null;
  const cleanSrc = cfg.src.split('?')[0];
  return `${cleanSrc}?t=${encodeURIComponent(token)}&_=${Date.now()}`;
}

function decodeCastEconfig(str: string): { stream_url?: string; stream_url_nop2p?: string } | null {
  try {
    if (!str) return null;
    const order = [2, 0, 3, 1];
    const s1 = atob(str);
    const chunkLen = Math.ceil(s1.length / 4);
    const parts: string[] = [];
    let offset = 0;
    for (let i = 0; i < 4; i++) {
      parts.push(s1.slice(offset, offset + chunkLen));
      offset += chunkLen;
    }
    const reordered: string[] = [];
    for (let i = 0; i < order.length; i++) {
      let p = String(parts[i]);
      p = p.slice(0, 3) + p.slice(4);
      reordered[order[i]] = atob(p);
    }
    const joined = reordered.join('');
    const jsonStr = atob(joined);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

async function getCastServerM3u8(channelId: string | number): Promise<{ m3u8Url: string; origin: string } | null> {
  const strId = String(channelId);
  const cacheKey = `cast_m3u8_${strId}`;
  const cached = getCached<{ m3u8Url: string; origin: string }>(cacheKey, 45 * 1000);
  if (cached) return cached;

  try {
    const castPageUrl = `https://dlive.sx/cast/stream-${strId}.php`;
    const castPageRes = await fetch(castPageUrl, {
      headers: { 'User-Agent': UA, 'Referer': `https://dlive.sx/watch.php?id=${strId}` },
      signal: AbortSignal.timeout(5000)
    });
    if (!castPageRes.ok) return null;
    const castPageHtml = await castPageRes.text();
    const iframeMatch = castPageHtml.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (!iframeMatch || !iframeMatch[1]) return null;
    const embedUrl = iframeMatch[1];

    const origin = new URL(embedUrl).origin;
    const embedRes = await fetch(embedUrl, {
      headers: {
        'User-Agent': UA,
        'Referer': castPageUrl,
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!embedRes.ok) return null;
    const embedHtml = await embedRes.text();
    const cfgMatch = embedHtml.match(/window\._econfig=['"]([^'"]+)['"]/);
    if (!cfgMatch || !cfgMatch[1]) return null;

    const decoded = decodeCastEconfig(cfgMatch[1]);
    const m3u8Url = decoded?.stream_url_nop2p || decoded?.stream_url;
    if (m3u8Url && m3u8Url.startsWith('http')) {
      const result = { m3u8Url, origin };
      setCache(cacheKey, result);
      return result;
    }
  } catch {
    // Fallback
  }
  return null;
}

async function fetchDembedRewrittenPlaylist(
  id: string | number,
  token?: string | null,
  exp?: string | number | null
): Promise<string | null> {
  try {
    const dembedM3u8Url = await getDembedAuthedM3u8Url(id);
    if (!dembedM3u8Url) return null;
    const dembedRes = await fetch(dembedM3u8Url, {
      headers: { 'User-Agent': UA, 'Origin': 'https://dembed.st', 'Referer': 'https://dembed.st/' },
      signal: AbortSignal.timeout(5500)
    });
    if (!dembedRes.ok) return null;
    const playlistText = await dembedRes.text();
    if (!playlistText.includes('#EXTM3U')) return null;

    const baseUrl = dembedM3u8Url.substring(0, dembedM3u8Url.lastIndexOf('/') + 1);
    const authSuffix =
      token && exp
        ? `&id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&exp=${encodeURIComponent(exp)}`
        : '';

    return playlistText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const abs = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=dembed${authSuffix}`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

async function fetchCastRewrittenPlaylist(
  id: string | number,
  token?: string | null,
  exp?: string | number | null
): Promise<string | null> {
  try {
    const castInfo = await getCastServerM3u8(id);
    if (!castInfo) return null;
    const castRes = await fetch(castInfo.m3u8Url, {
      headers: { 'User-Agent': UA, 'Origin': castInfo.origin, 'Referer': `${castInfo.origin}/` },
      signal: AbortSignal.timeout(6000)
    });
    if (!castRes.ok) return null;
    const playlistText = await castRes.text();
    if (!playlistText.includes('#EXTM3U')) return null;

    const baseUrl = castInfo.m3u8Url.substring(0, castInfo.m3u8Url.lastIndexOf('/') + 1);
    const authSuffix =
      token && exp
        ? `&id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&exp=${encodeURIComponent(exp)}`
        : '';

    return playlistText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const abs = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=cast&origin=${encodeURIComponent(castInfo.origin)}${authSuffix}`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

async function fetchWideRewrittenPlaylist(
  id: string | number,
  token?: string | null,
  exp?: string | number | null
): Promise<string | null> {
  try {
    const slug = await getChannelStreamSlug(id);
    if (!slug) return null;
    const directUrl = await getDirectM3u8Url(slug);
    if (!directUrl) return null;

    const m3u8Res = await fetch(directUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://wideiptv.top/' },
      signal: AbortSignal.timeout(4500)
    });
    if (!m3u8Res.ok) return null;
    const playlistText = await m3u8Res.text();
    if (!playlistText.includes('#EXTM3U')) return null;

    const bwMatch = playlistText.match(/BANDWIDTH=(\d+)/);
    if (bwMatch && parseInt(bwMatch[1], 10) < 300000) return null;
    if (playlistText.includes('tracks-v1/mono.m3u8')) return null;

    const baseUrl = directUrl.substring(0, directUrl.lastIndexOf('/') + 1);
    const authSuffix =
      token && exp
        ? `&id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&exp=${encodeURIComponent(exp)}`
        : '';

    return playlistText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const abs = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=wide${authSuffix}`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

// Web-Standard DecompressionStream unwrapper for Dembed PNG/WebP/TSGZ segments on Cloudflare Edge
const TRAW = new Uint8Array([84, 73, 75, 84, 73, 75, 82, 65, 87]);
const TSGZ = new Uint8Array([84, 73, 75, 84, 73, 75, 84, 83, 71, 90]);
const TPIX = new Uint8Array([84, 73, 75, 84, 73, 75, 80, 88]);

function findSequence(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function readUInt32BE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

function readUInt32LE(buf: Uint8Array, offset: number): number {
  return ((buf[offset + 3] << 24) | (buf[offset + 2] << 16) | (buf[offset + 1] << 8) | buf[offset]) >>> 0;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

async function decompressStream(data: Uint8Array, format: 'gzip' | 'deflate'): Promise<Uint8Array> {
  const ds = new DecompressionStream(format);
  const writer = ds.writable.getWriter();
  writer.write(data as unknown as BufferSource);
  writer.close();
  const ab = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(ab);
}

async function unwrapDembedSegmentEdge(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes.length >= 188 && bytes[0] === 0x47 && bytes[188] === 0x47) {
    return bytes;
  }

  // 1. WebP EXIF TS
  if (
    bytes.length >= 16 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    let off = 12;
    while (off + 8 <= bytes.length) {
      const tag = String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);
      const n = readUInt32LE(bytes, off + 4);
      off += 8;
      if (n < 0 || off + n > bytes.length) break;
      if (tag === 'EXIF') {
        const data = bytes.subarray(off, off + n);
        if (data.length >= 188 && data[0] === 0x47 && data[188] === 0x47) return data;
        break;
      }
      off += n + (n & 1);
    }
  }

  // 2. PNG IEND TS or PNG RGB Pixels (TIKTIKPX)
  if (bytes.length >= 16 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    let off = 8;
    let w = 0, h = 0, depth = 0, ctype = 0, interlace = 0;
    const idats: Uint8Array[] = [];
    let totalIdatLen = 0;

    while (off + 8 <= bytes.length) {
      const len = readUInt32BE(bytes, off);
      if (len > bytes.length - off - 12) break;
      const type = String.fromCharCode(bytes[off + 4], bytes[off + 5], bytes[off + 6], bytes[off + 7]);
      const data = bytes.subarray(off + 8, off + 8 + len);
      if (type === 'IHDR') {
        w = readUInt32BE(data, 0);
        h = readUInt32BE(data, 4);
        depth = data[8];
        ctype = data[9];
        interlace = data[12];
      } else if (type === 'IDAT') {
        idats.push(data);
        totalIdatLen += data.length;
      } else if (type === 'IEND') {
        const after = off + 12 + len;
        if (after + 188 < bytes.length && bytes[after] === 0x47 && bytes[after + 188] === 0x47) {
          return bytes.subarray(after);
        }
        break;
      }
      off += 12 + len;
    }

    if (w && h && depth === 8 && !interlace && (ctype === 2 || ctype === 6) && idats.length > 0) {
      try {
        const concatIdats = new Uint8Array(totalIdatLen);
        let pos = 0;
        for (const chunk of idats) {
          concatIdats.set(chunk, pos);
          pos += chunk.length;
        }
        const raw = await decompressStream(concatIdats, 'deflate');
        const bpp = ctype === 6 ? 4 : 3;
        const stride = w * bpp;
        const rgb = new Uint8Array(w * h * 3);
        let src = 0;
        let dst = 0;
        let prev: Uint8Array<ArrayBufferLike> = new Uint8Array(stride);

        for (let y = 0; y < h; y++) {
          if (src + 1 + stride > raw.length) break;
          const filter = raw[src++];
          const row = raw.subarray(src, src + stride);
          src += stride;

          if (filter === 0) {
            if (ctype === 2) {
              rgb.set(row, dst);
              dst += w * 3;
            } else {
              for (let i = 0; i < stride; i += 4) {
                rgb[dst++] = row[i];
                rgb[dst++] = row[i + 1];
                rgb[dst++] = row[i + 2];
              }
            }
            prev = row;
            continue;
          }

          const recon = new Uint8Array(stride);
          for (let i = 0; i < stride; i++) {
            const a = i >= bpp ? recon[i - bpp] : 0;
            const b = prev[i];
            const c = i >= bpp ? prev[i - bpp] : 0;
            let v = row[i];
            if (filter === 1) v += a;
            else if (filter === 2) v += b;
            else if (filter === 3) v += (a + b) >> 1;
            else if (filter === 4) v += paeth(a, b, c);
            recon[i] = v & 255;
          }

          if (ctype === 2) {
            rgb.set(recon, dst);
            dst += stride;
          } else {
            for (let i = 0; i < stride; i += 4) {
              rgb[dst++] = recon[i];
              rgb[dst++] = recon[i + 1];
              rgb[dst++] = recon[i + 2];
            }
          }
          prev = recon;
        }

        if (rgb.length >= 12 && findSequence(rgb.subarray(0, 8), TPIX) === 0) {
          const n = readUInt32BE(rgb, 8);
          if (n > 0 && 12 + n <= rgb.length) {
            const gz = rgb.subarray(12, 12 + n);
            return await decompressStream(gz, 'gzip');
          }
        }
      } catch {
        // Fall through
      }
    }
  }

  // 3. TRAW / TSGZ / raw 0x47 search
  const trawIdx = findSequence(bytes, TRAW);
  if (trawIdx !== -1) {
    return bytes.subarray(trawIdx + TRAW.length);
  }
  const tsgzIdx = findSequence(bytes, TSGZ);
  if (tsgzIdx !== -1) {
    try {
      return await decompressStream(bytes.subarray(tsgzIdx + TSGZ.length), 'gzip');
    } catch {
      // Fall through
    }
  }
  for (let i = 0; i + 188 < bytes.length; i++) {
    if (bytes[i] === 0x47 && bytes[i + 188] === 0x47) return bytes.subarray(i);
  }
  return bytes;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 1. API Routes handled directly on Cloudflare Edge (Unlimited Bandwidth)
    if (pathname.startsWith('/api/')) {
      // Optional upstream proxy if configured
      const proxyBackend = env.VERCEL_BACKEND_URL || env.API_BACKEND_URL;
      if (proxyBackend && !pathname.startsWith('/api/proxy-chunk')) {
        try {
          const cleanBase = proxyBackend.replace(/\/+$/, '');
          const backendRes = await fetch(`${cleanBase}${pathname}${url.search}`, {
            method: request.method,
            headers: { 'User-Agent': UA, 'Accept': '*/*' }
          });
          if (backendRes.ok) {
            const headers = new Headers(backendRes.headers);
            headers.set('Access-Control-Allow-Origin', '*');
            return new Response(backendRes.body, { status: backendRes.status, headers });
          }
        } catch {
          // Fall through to native Cloudflare Edge handler
        }
      }

      // /api/channels
      if (pathname === '/api/channels') {
        const cached = getCached<any[]>('all_channels_v2', 15 * 60 * 1000);
        if (cached) return jsonResponse({ success: true, count: cached.length, channels: cached }, 200, 300);

        const allChannels: any[] = [];
        const knownIds = new Set<number>();
        for (const ch of CURATED_SPECIAL_CHANNELS) {
          if (!knownIds.has(ch.id)) {
            allChannels.push({ ...ch });
            knownIds.add(ch.id);
          }
        }

        const [res247, soccerCatalog] = await Promise.allSettled([
          fetch('https://dlive.sx/24-7-channels.php', {
            headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
            signal: AbortSignal.timeout(4000)
          }),
          fetchDliveSoccerCatalog()
        ]);

        if (res247.status === 'fulfilled' && res247.value.ok) {
          const html = await res247.value.text();
          const regex = /href=["']\/watch\.php\?id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/g;
          let match;
          while ((match = regex.exec(html)) !== null) {
            const id = parseInt(match[1], 10);
            if (!knownIds.has(id)) {
              const rawName = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').replace(/ID:\s*\d+/, ''));
              if (!rawName || isExcludedChannelName(rawName)) continue;
              const { category, subcat, lang } = categorizeChannel(rawName);
              allChannels.push({ id, name: rawName, category, subcat, quality: '1080p FHD', lang, country: 'Global' });
              knownIds.add(id);
            }
          }
        }

        if (soccerCatalog.status === 'fulfilled') {
          for (const ch of soccerCatalog.value.discoveredChannels) {
            if (!knownIds.has(ch.id)) {
              allChannels.push(ch);
              knownIds.add(ch.id);
            } else {
              const existing = allChannels.find(c => c.id === ch.id);
              if (existing && ch.description && !existing.description) {
                existing.description = ch.description;
              }
            }
          }
        }

        setCache('all_channels_v2', allChannels);
        return jsonResponse({ success: true, count: allChannels.length, channels: allChannels }, 200, 300);
      }

      // /api/live-matches
      if (pathname === '/api/live-matches') {
        const rawDate = url.searchParams.get('date') || 'today';
        const dateKey: 'yesterday' | 'today' | 'tomorrow' =
          rawDate === 'yesterday' ? 'yesterday' : rawDate === 'tomorrow' ? 'tomorrow' : 'today';
        const matches = await getLiveMatchesList(dateKey);
        return jsonResponse({ success: true, date: dateKey, count: matches.length, matches }, 200, 30);
      }

      // /api/standings (Live from Yallakora Arabic Standings + ESPN Standings API — Zero Hardcoded Data)
      if (pathname === '/api/standings') {
        const leagueId = (url.searchParams.get('league') || 'epl').toLowerCase();
        const baseLeagueInfo = LEAGUES_CATALOG.find(l => l.id === leagueId) || LEAGUES_CATALOG[0];
        const cacheKey = `edge_standings_v3_${baseLeagueInfo.id}`;
        const cached = getCached<{ rows: any[]; season: string }>(cacheKey, 5 * 60 * 1000);
        if (cached) {
          return jsonResponse({
            success: true,
            league: { ...baseLeagueInfo, season: cached.season },
            leagues: LEAGUES_CATALOG,
            standings: cached.rows
          }, 200, 180);
        }

        const ykPath = YALLAKORA_STANDING_PATHS[baseLeagueInfo.id];
        if (ykPath) {
          const targetYkUrl = `https://www.yallakora.com${ykPath}`;
          const reqConfigs: Array<{ url: string; headers: Record<string, string> }> = [
            { url: targetYkUrl, headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8' } },
            { url: `https://r.jina.ai/${targetYkUrl}`, headers: { 'X-Return-Format': 'html', 'User-Agent': UA } }
          ];
          for (const reqCfg of reqConfigs) {
            try {
              const ykRes = await fetch(reqCfg.url, {
                headers: reqCfg.headers,
                signal: AbortSignal.timeout(5500)
              });
              if (ykRes.ok) {
                const html = await ykRes.text();
                const parsedYk = parseYallakoraStandingsHtml(html, baseLeagueInfo);
                if (parsedYk && parsedYk.rows.length > 0) {
                  const liveSeason = parsedYk.season || baseLeagueInfo.season;
                  setCache(cacheKey, { rows: parsedYk.rows, season: liveSeason });
                  return jsonResponse({
                    success: true,
                    league: { ...baseLeagueInfo, season: liveSeason },
                    leagues: LEAGUES_CATALOG,
                    standings: parsedYk.rows
                  }, 200, 180);
                }
              }
            } catch {
              // Try next source
            }
          }
        }

        const espnSlug = ESPN_LEAGUE_SLUGS[baseLeagueInfo.id];
        if (espnSlug) {
          try {
            const espnRes = await fetch(
              `https://site.api.espn.com/apis/v2/sports/soccer/${espnSlug}/standings`,
              {
                headers: { 'User-Agent': UA },
                signal: AbortSignal.timeout(5000)
              }
            );
            if (espnRes.ok) {
              const espnJson = await espnRes.json();
              const parsed = parseEspnStandingsToArabic(espnJson, baseLeagueInfo);
              if (parsed && parsed.length > 0) {
                const espnSeasonMatch = String(
                  (espnJson as any)?.children?.[0]?.standings?.seasonDisplayName ||
                    (espnJson as any)?.seasons?.[0]?.displayName ||
                    ''
                ).match(/(\d{4})[-/](\d{2,4})/);
                const liveSeason = espnSeasonMatch
                  ? `${espnSeasonMatch[1]} / ${
                      espnSeasonMatch[2].length === 2
                        ? espnSeasonMatch[1].slice(0, 2) + espnSeasonMatch[2]
                        : espnSeasonMatch[2]
                    }`
                  : baseLeagueInfo.season;
                setCache(cacheKey, { rows: parsed, season: liveSeason });
                return jsonResponse({
                  success: true,
                  league: { ...baseLeagueInfo, season: liveSeason },
                  leagues: LEAGUES_CATALOG,
                  standings: parsed
                }, 200, 180);
              }
            }
          } catch {
            // ignore
          }
        }

        return jsonResponse({
          success: false,
          league: baseLeagueInfo,
          leagues: LEAGUES_CATALOG,
          standings: []
        }, 200, 15);
      }

      // /api/match-details/:id
      const detailsMatch = pathname.match(/^\/api\/match-details\/([^/]+)$/);
      if (detailsMatch) {
        const matchId = decodeURIComponent(detailsMatch[1]);
        const teamAName = (url.searchParams.get('teamA') || '').trim();
        const teamBName = (url.searchParams.get('teamB') || '').trim();
        if (!teamAName || !teamBName) {
          return jsonResponse({ success: false, error: 'teamA and teamB are required' }, 400);
        }
        const competition = url.searchParams.get('competition') || '';
        const status = (url.searchParams.get('status') || 'FIXTURE') as 'LIVE' | 'FIXTURE' | 'RESULT';
        const scoreARaw = url.searchParams.get('scoreA');
        const scoreBRaw = url.searchParams.get('scoreB');

        const baseDetails = buildMatchDetailsForMatch({
          id: matchId,
          competition,
          teamA: { name: teamAName },
          teamB: { name: teamBName },
          scoreA: scoreARaw !== null && scoreARaw !== '' ? Number(scoreARaw) : null,
          scoreB: scoreBRaw !== null && scoreBRaw !== '' ? Number(scoreBRaw) : null,
          status,
          time: '',
          channels: [],
          isBeinArabic: false,
          broadcasterLabel: '',
          network: 'unbroadcast'
        });

        const ykDirect = matchId.match(/^yk_(\d+)$/);
        const ykId = ykDirect && parseInt(ykDirect[1], 10) > 1000 ? ykDirect[1] : null;

        if (ykId) {
          const postHeaders = {
            'User-Agent': UA,
            'Content-Type': 'application/json; charset=utf-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.yallakora.com/'
          };
          const pageUrl = `https://www.yallakora.com/Match/?matchID=${ykId}`;

          const [sqRes, stRes, h2hRes, pageRes, minPage2Res] = await Promise.allSettled([
            fetch(`https://www.yallakora.com/Match/Matchsquad2?matchID=${ykId}`, {
              method: 'POST',
              headers: postHeaders,
              signal: AbortSignal.timeout(4500)
            }),
            fetch(`https://www.yallakora.com/Match/EuroMatchStats2?matchID=${ykId}`, {
              method: 'POST',
              headers: postHeaders,
              signal: AbortSignal.timeout(4500)
            }),
            fetch(`https://www.yallakora.com/Match/GetTeamsHeadToHeadMatches?matchID=${ykId}`, {
              method: 'POST',
              headers: postHeaders,
              signal: AbortSignal.timeout(4500)
            }),
            fetch(pageUrl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4500) }),
            fetch(`https://www.yallakora.com/match/MatchMinByMinPaging?matchId=${ykId}&PageIndex=2&PageSize=30`, {
              headers: { 'User-Agent': UA, 'X-Requested-With': 'XMLHttpRequest', 'Referer': pageUrl },
              signal: AbortSignal.timeout(4500)
            })
          ]);

          if (sqRes.status === 'fulfilled' && sqRes.value.ok) {
            const sqHtml = await sqRes.value.text();
            const formMatches = [...sqHtml.matchAll(/<div class="formName">\s*<span>(.*?)<\/span>/gs)];
            const formationA = formMatches[0]?.[1]?.trim() || '';
            const formationB = formMatches[1]?.[1]?.trim() || '';

            const parseSquadBlock = (blockHtml: string, isSub: boolean) => {
              const players: Array<{ number: number; name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' | '' }> = [];
              const rx = /<div class="playerNum">\s*([0-9]+)\s*<\/div>\s*<p class="playerName">\s*(.*?)\s*<\/p>/gs;
              let m: RegExpExecArray | null;
              let idx = 0;
              while ((m = rx.exec(blockHtml)) !== null) {
                const num = parseInt(m[1], 10) || idx + 1;
                const name = m[2].replace(/<[^>]+>/g, '').trim();
                if (name) {
                  players.push({
                    number: num,
                    name,
                    position: ''
                  });
                  idx++;
                }
              }
              return isSub ? players.slice(0, 9) : players;
            };

            const mainIdx = sqHtml.indexOf('teamSquad Main');
            const subIdx = sqHtml.indexOf('teamSquad Sub');
            if (mainIdx !== -1) {
              const mainSec = subIdx !== -1 ? sqHtml.slice(mainIdx, subIdx) : sqHtml.slice(mainIdx);
              const tBIdx = mainSec.indexOf('<div class="teamB">');
              if (tBIdx !== -1) {
                baseDetails.lineupA.formation = formationA;
                baseDetails.lineupB.formation = formationB;
                baseDetails.lineupA.startingXI = parseSquadBlock(mainSec.slice(0, tBIdx), false);
                baseDetails.lineupB.startingXI = parseSquadBlock(mainSec.slice(tBIdx), false);
              }
            }
            if (subIdx !== -1) {
              const subSec = sqHtml.slice(subIdx);
              const tBSubIdx = subSec.indexOf('<div class="teamB">');
              if (tBSubIdx !== -1) {
                baseDetails.lineupA.substitutes = parseSquadBlock(subSec.slice(0, tBSubIdx), true);
                baseDetails.lineupB.substitutes = parseSquadBlock(subSec.slice(tBSubIdx), true);
              }
            }
          }

          if (pageRes.status === 'fulfilled' && pageRes.value.ok) {
            const pageHtml = await pageRes.value.text();
            const minPage2Html =
              minPage2Res.status === 'fulfilled' && minPage2Res.value.ok
                ? await minPage2Res.value.text()
                : '';
            const events = parseYallakoraEventsFromHtml(pageHtml, minPage2Html);
            if (events.length > 0) baseDetails.events = events;
          }

          if (stRes.status === 'fulfilled' && stRes.value.ok) {
            const stHtml = await stRes.value.text();
            const statItems = [
              ...stHtml.matchAll(
                /<li>\s*<div class="team teamA">\s*([0-9.%]+)\s*<\/div>\s*<div class="desc">\s*(.*?)\s*<\/div>\s*<div class="team teamB">\s*([0-9.%]+)\s*<\/div>\s*<\/li>/gs
              )
            ];
            for (const st of statItems) {
              const valA = parseFloat(st[1]) || 0;
              const label = st[2].replace(/<[^>]+>/g, '').trim();
              const valB = parseFloat(st[3]) || 0;
              const total = valA + valB;
              baseDetails.stats.push({
                label,
                valueA: st[1].trim(),
                valueB: st[3].trim(),
                percentA: total > 0 ? Math.round((valA / total) * 100) : 50,
                percentB: total > 0 ? Math.round((valB / total) * 100) : 50
              });
            }
          }

          if (h2hRes.status === 'fulfilled' && h2hRes.value.ok) {
            const h2hHtml = await h2hRes.value.text();
            const blocks = h2hHtml.split(/<div class="matchDtls">/);
            for (let i = 1; i < blocks.length && baseDetails.h2h.length < 6; i++) {
              const b = blocks[i];
              const dateStr = b.match(/<p class="day">\s*(.*?)\s*<\/p>/s)?.[1]?.trim() || '';
              const t1Score = b.match(/class="teamresult team1">\s*<span>([0-9]+)<\/span>/s)?.[1];
              const t1Name = b.match(/class="teamresult team1">[\s\S]*?<div class="teamName">\s*(.*?)\s*<\/div>/s)?.[1]?.trim();
              const t2Score = b.match(/class="teamresult team2">\s*<span>([0-9]+)<\/span>/s)?.[1];
              const t2Name = b.match(/class="teamresult team2">[\s\S]*?<div class="teamName">\s*(.*?)\s*<\/div>/s)?.[1]?.trim();
              if (t1Name && t2Name && t1Score !== undefined && t2Score !== undefined) {
                baseDetails.h2h.push({
                  date: dateStr,
                  competition: 'مواجهة سابقة',
                  teamA: t1Name,
                  teamB: t2Name,
                  scoreA: parseInt(t1Score, 10) || 0,
                  scoreB: parseInt(t2Score, 10) || 0
                });
              }
            }
          }
        }

        const hasSourceData =
          baseDetails.events.length > 0 ||
          baseDetails.lineupA.startingXI.length > 0 ||
          baseDetails.lineupB.startingXI.length > 0 ||
          baseDetails.stats.length > 0 ||
          baseDetails.h2h.length > 0 ||
          Boolean(baseDetails.stadium);

        if (!hasSourceData) {
          return jsonResponse({ success: false, error: 'NO_SOURCE_DATA', details: baseDetails }, 200, 10);
        }

        return jsonResponse({ success: true, details: baseDetails }, 200, 20);
      }

      // /api/epg/live
      if (pathname === '/api/epg/live') {
        const matches = await getLiveMatchesList();
        const soccerCatalog = await fetchDliveSoccerCatalog();
        const epgMap: Record<number, any> = {};

        for (const match of matches) {
          if (match.channels && Array.isArray(match.channels)) {
            for (const ch of match.channels) {
              const chId = Number(ch.channel_id);
              if (!chId) continue;
              const isLive = match.status === 'LIVE';
              if (!epgMap[chId] || (isLive && !epgMap[chId].isLive)) {
                epgMap[chId] = {
                  channelId: chId,
                  programTitle: `${match.competition}: ${match.teamA.name} ${match.scoreA !== null ? `${match.scoreA} - ${match.scoreB}` : 'ضد'} ${match.teamB.name}`,
                  category: match.competition,
                  tournament: match.competition,
                  isLive,
                  isMatch: true,
                  match,
                  startTime: match.time,
                  commentator: match.commentator
                };
              }
            }
          }
        }

        for (const ev of soccerCatalog.events) {
          for (const ch of ev.channels) {
            const chId = Number(ch.channel_id);
            if (!chId) continue;
            const isLive = ev.status === 'LIVE';
            if (!epgMap[chId] || (isLive && !epgMap[chId].isLive)) {
              epgMap[chId] = {
                channelId: chId,
                programTitle: `${translateCompetition(ev.competition)}: ${ev.teamA} ضد ${ev.teamB} (${ev.meccaTime} بتوقيت مكة)`,
                category: translateCompetition(ev.competition),
                tournament: translateCompetition(ev.competition),
                isLive,
                isMatch: true,
                startTime: `${ev.meccaTime} بتوقيت مكة`
              };
            }
          }
        }

        return jsonResponse({ success: true, epg: epgMap }, 200, 30);
      }

      // /api/stream-auth/:id
      const authMatch = pathname.match(/^\/api\/stream-auth\/([^/]+)$/);
      if (authMatch) {
        const id = authMatch[1];
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        if ((origin && !isOriginAllowedEdge(origin, url.host)) || (referer && !isOriginAllowedEdge(referer, url.host))) {
          return jsonResponse({ success: false, error: 'Access denied: unauthorized origin' }, 403);
        }

        const exp = Math.floor(Date.now() / 1000) + 7200;
        const secret = env.STREAM_AUTH_SECRET || DEFAULT_SECRET;
        const token = await signStreamTokenEdge(id, exp, secret);
        return jsonResponse({
          success: true,
          channelId: id,
          token,
          exp,
          streamUrl: `/api/proxy-stream/${id}/live.m3u8?token=${token}&exp=${exp}`
        });
      }

      // /api/resolve-m3u8/:id
      const resolveMatch = pathname.match(/^\/api\/resolve-m3u8\/([^/]+)$/);
      if (resolveMatch) {
        const id = resolveMatch[1];
        const slug = await getChannelStreamSlug(id);
        const found = CURATED_SPECIAL_CHANNELS.find(c => String(c.id) === String(id));
        const exp = Math.floor(Date.now() / 1000) + 7200;
        const secret = env.STREAM_AUTH_SECRET || DEFAULT_SECRET;
        const token = await signStreamTokenEdge(id, exp, secret);
        const proxyStreamUrl = `/api/proxy-stream/${id}/live.m3u8?token=${token}&exp=${exp}`;
        return jsonResponse({
          success: true,
          channelId: id,
          channelName: found ? (found.arabicName || found.name) : `Live Sports Channel #${id}`,
          lang: found?.lang || 'International',
          category: found?.category || 'other',
          slug: slug || `premium${id}`,
          token,
          exp,
          streamUrl: proxyStreamUrl,
          servers: [
            {
              id: 'srv-1',
              name: 'سيرفر 1 (المشغل المحمي FHD 1080p)',
              folder: 'player',
              quality: '1080p FHD 60fps',
              url: proxyStreamUrl,
              embedUrl: proxyStreamUrl,
              type: 'native',
              isDefault: true
            }
          ]
        });
      }

      // /api/proxy-stream/:id/live.m3u8
      const streamMatch = pathname.match(/^\/api\/proxy-stream\/([^/]+)\/live\.m3u8$/);
      if (streamMatch) {
        const id = streamMatch[1];
        const preferredSource = url.searchParams.get('source') || 'dembed';
        const token = url.searchParams.get('token');
        const exp = url.searchParams.get('exp');

        // 1. Anti-Hotlinking Origin Verification
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        if ((origin && !isOriginAllowedEdge(origin, url.host)) || (referer && !isOriginAllowedEdge(referer, url.host))) {
          return new Response('#EXTM3U\n#EXT-X-ERROR: 403 Forbidden - Hotlinking not allowed\n', {
            status: 403,
            headers: { 'Content-Type': 'application/vnd.apple.mpegurl' }
          });
        }

        // 2. Cryptographic Token Verification
        const secret = env.STREAM_AUTH_SECRET || DEFAULT_SECRET;
        const isValid = await verifyStreamTokenEdge(id, exp, token, secret);
        if (!isValid) {
          return new Response('#EXTM3U\n#EXT-X-ERROR: 403 Forbidden - Stream signature missing or expired. Unauthorized fetch blocked.\n', {
            status: 403,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }

        const order: Array<'dembed' | 'cast' | 'wide'> =
          preferredSource === 'cast'
            ? ['cast', 'dembed', 'wide']
            : preferredSource === 'wide'
              ? ['wide', 'dembed', 'cast']
              : ['dembed', 'cast', 'wide'];

        for (const provider of order) {
          let playlist: string | null = null;
          if (provider === 'dembed') playlist = await fetchDembedRewrittenPlaylist(id, token, exp);
          else if (provider === 'cast') playlist = await fetchCastRewrittenPlaylist(id, token, exp);
          else if (provider === 'wide') playlist = await fetchWideRewrittenPlaylist(id, token, exp);

          if (playlist) {
            return new Response(playlist, {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Active-Stream-Provider': provider
              }
            });
          }
        }

        return new Response('#EXTM3U\n#EXT-X-ERROR: Stream currently offline', {
          status: 404,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/vnd.apple.mpegurl' }
        });
      }

      // /api/proxy-chunk
      if (pathname === '/api/proxy-chunk') {
        const chunkUrl = url.searchParams.get('url');
        const mode = url.searchParams.get('mode') || 'dembed';
        const customOrigin = url.searchParams.get('origin') || 'https://tossequip.net';
        const chunkId = url.searchParams.get('id') || '*';
        const token = url.searchParams.get('token');
        const exp = url.searchParams.get('exp');

        if (!chunkUrl) return new Response('Missing url', { status: 400, headers: CORS_HEADERS });

        // Verify chunk token
        const secret = env.STREAM_AUTH_SECRET || DEFAULT_SECRET;
        const isValid = await verifyStreamTokenEdge(chunkId, exp, token, secret);
        if (!isValid) {
          return new Response('403 Forbidden: Invalid or expired chunk signature', {
            status: 403,
            headers: CORS_HEADERS
          });
        }

        try {
          const headers: Record<string, string> = { 'User-Agent': UA };
          if (mode === 'dembed') {
            headers['Origin'] = 'https://dembed.st';
            headers['Referer'] = 'https://dembed.st/';
          } else if (mode === 'cast') {
            headers['Origin'] = customOrigin;
            headers['Referer'] = `${customOrigin}/`;
          } else {
            headers['Referer'] = 'https://wideiptv.top/';
          }

          const upstreamRes = await fetch(chunkUrl, { headers, signal: AbortSignal.timeout(10000) });
          if (!upstreamRes.ok) {
            return new Response('Chunk fetch failed', { status: upstreamRes.status, headers: CORS_HEADERS });
          }

          const contentType = upstreamRes.headers.get('content-type') || '';
          if (contentType.includes('mpegurl') || chunkUrl.includes('.m3u8')) {
            const text = await upstreamRes.text();
            if (text.includes('#EXTM3U')) {
              const baseUrl = chunkUrl.substring(0, chunkUrl.lastIndexOf('/') + 1);
              const authSuffix =
                token && exp
                  ? `&id=${encodeURIComponent(chunkId)}&token=${encodeURIComponent(token)}&exp=${encodeURIComponent(exp)}`
                  : '';
              const rewritten = text
                .split('\n')
                .map(line => {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed.startsWith('#')) return line;
                  const abs = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
                  return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=${mode}&origin=${encodeURIComponent(customOrigin)}${authSuffix}`;
                })
                .join('\n');
              return new Response(rewritten, {
                status: 200,
                headers: {
                  ...CORS_HEADERS,
                  'Content-Type': 'application/vnd.apple.mpegurl',
                  'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
              });
            }
          }

          const rawBytes = new Uint8Array(await upstreamRes.arrayBuffer());
          const tsBytes =
            mode === 'dembed' || (rawBytes.length > 0 && rawBytes[0] !== 0x47)
              ? await unwrapDembedSegmentEdge(rawBytes)
              : rawBytes;

          return new Response(tsBytes as unknown as BodyInit, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'video/MP2T',
              'Cache-Control': 'public, max-age=10'
            }
          });
        } catch {
          return new Response('Chunk proxy error', { status: 500, headers: CORS_HEADERS });
        }
      }

      // /api/status
      if (pathname === '/api/status') {
        return jsonResponse({ status: 'online', platform: 'cloudflare-workers-edge', timestamp: new Date().toISOString() });
      }

      return jsonResponse({ error: 'API endpoint not found' }, 404);
    }

    // 2. SEO Routes (/robots.txt & /sitemap.xml)
    if (pathname === '/robots.txt') {
      return new Response(
        `User-agent: *\nAllow: /\nAllow: /schedule\nAllow: /watchroom/\nSitemap: ${url.origin}/sitemap.xml\n`,
        { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    if (pathname === '/sitemap.xml') {
      const today = new Date().toISOString().split('T')[0];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      xml += `  <url><loc>${url.origin}/</loc><lastmod>${today}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>\n`;
      xml += `  <url><loc>${url.origin}/schedule</loc><lastmod>${today}</lastmod><changefreq>always</changefreq><priority>0.9</priority></url>\n`;
      for (const ch of CURATED_SPECIAL_CHANNELS) {
        xml += `  <url><loc>${url.origin}/watchroom/${ch.id}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
      }
      xml += `</urlset>`;
      return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
    }

    // 3. Static Assets + SPA Fallback for React Router (/home, /schedule, /watchroom/:id, etc.)
    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status !== 404) {
        return assetRes;
      }
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }

    return new Response('Not Found', { status: 404 });
  }
};
