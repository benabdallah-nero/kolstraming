import express, { type Request, type Response } from 'express';
import zlib from 'zlib';
import crypto from 'crypto';
import {
  LEAGUES_CATALOG,
  YALLAKORA_STANDING_PATHS,
  ESPN_LEAGUE_SLUGS,
  parseYallakoraStandingsHtml,
  parseEspnStandingsToArabic,
  translateTeamNameAr,
  buildMatchDetailsForMatch
} from '../src/utils/footballData.ts';
import { getTeamLogoSvg } from '../src/utils/teamLogos.ts';

const app = express();

app.use(express.json());

// Cryptographic Secret for HLS Live Stream Tokens
const STREAM_AUTH_SECRET = process.env.STREAM_AUTH_SECRET || crypto.randomBytes(32).toString('hex');

export function signStreamToken(channelId: string | number, exp: number): string {
  const data = `stream:${channelId}:${exp}`;
  return crypto.createHmac('sha256', STREAM_AUTH_SECRET).update(data).digest('hex').slice(0, 32);
}

export function verifyStreamToken(channelId: string | number, expStr: any, token: any): boolean {
  if (!token || !expStr) return false;
  const exp = typeof expStr === 'number' ? expStr : parseInt(String(expStr), 10);
  if (isNaN(exp)) return false;
  const now = Math.floor(Date.now() / 1000);
  // Valid within reasonable time window (allow 5m clock skew, max 24h into future)
  if (exp < now - 300) return false;
  if (exp > now + 86400) return false;

  const expected = signStreamToken(channelId, exp);
  return token === expected;
}

export function isOriginAllowed(originOrReferer: string | null | undefined, requestHost?: string | null): boolean {
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

export function isDisallowedTargetUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === 'metadata.google.internal' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return true;
    }
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const b0 = parseInt(ipMatch[1], 10);
      const b1 = parseInt(ipMatch[2], 10);
      if (b0 === 10) return true;
      if (b0 === 127) return true;
      if (b0 === 169 && b1 === 254) return true;
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
      if (b0 === 192 && b1 === 168) return true;
      if (b0 === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function setStreamCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin as string | undefined;
  const referer = req.headers.referer as string | undefined;
  const host = req.headers.host;

  if (origin && isOriginAllowed(origin, host)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (referer && isOriginAllowed(referer, host)) {
    try {
      const originFromReferer = new URL(referer).origin;
      res.setHeader('Access-Control-Allow-Origin', originFromReferer);
    } catch {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, X-Requested-With');
}

// In-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache: Record<string, CacheEntry<any>> = {};

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Core 24/7 base channels (verified IDs from DaddyLive catalog)
const CURATED_SPECIAL_CHANNELS = [
  // beIN Sports Arabic
  { id: 91, name: 'beIN Sports 1 Arabic', arabicName: 'بي إن سبورت 1 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein1.png', country: 'QA' },
  { id: 92, name: 'beIN Sports 2 Arabic', arabicName: 'بي إن سبورت 2 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein2.png', country: 'QA' },
  { id: 93, name: 'beIN Sports 3 Arabic', arabicName: 'بي إن سبورت 3 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein3.png', country: 'QA' },
  { id: 94, name: 'beIN Sports 4 Arabic', arabicName: 'بي إن سبورت 4 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein4.png', country: 'QA' },
  { id: 95, name: 'beIN Sports 5 Arabic', arabicName: 'بي إن سبورت 5 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein5.png', country: 'QA' },
  { id: 96, name: 'beIN Sports 6 Arabic', arabicName: 'بي إن سبورت 6 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein6.png', country: 'QA' },
  { id: 97, name: 'beIN Sports 7 Arabic', arabicName: 'بي إن سبورت 7 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein7.png', country: 'QA' },
  { id: 98, name: 'beIN Sports 8 Arabic', arabicName: 'بي إن سبورت 8 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein8.png', country: 'QA' },
  { id: 99, name: 'beIN Sports 9 Arabic', arabicName: 'بي إن سبورت 9 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein9.png', country: 'QA' },
  { id: 61, name: 'beIN Sports MENA English 1', arabicName: 'بي إن سبورت الإنجليزية 1', category: 'bein', subcat: 'bein_mena', quality: '1080p FHD', lang: 'English', logo: 'bein_en.png', country: 'QA' },
  { id: 90, name: 'beIN Sports MENA English 2', arabicName: 'بي إن سبورت الإنجليزية 2', category: 'bein', subcat: 'bein_mena', quality: '1080p FHD', lang: 'English', logo: 'bein_en2.png', country: 'QA' },
  { id: 100, name: 'beIN SPORTS XTRA 1', arabicName: 'بي إن سبورت إكسترا 1', category: 'bein', subcat: 'bein_xtra', quality: '1080p FHD', lang: 'English', logo: 'bein_xtra.png', country: 'USA' },
  { id: 578, name: 'BeIN Sports HD Qatar', arabicName: 'بي إن سبورت الإخبارية', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein_news.png', country: 'QA' },
  { id: 425, name: 'BeIN SPORTS USA', category: 'bein', subcat: 'bein_us', quality: '1080p FHD', lang: 'English', logo: 'bein_us.png', country: 'US' },

  // Eurosport Channels
  { id: 772, name: 'Eurosport 1 France', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'French', logo: 'eurosport1.png', country: 'FR' },
  { id: 773, name: 'Eurosport 2 France', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'French', logo: 'eurosport2.png', country: 'FR' },
  { id: 524, name: 'EuroSport 1 Spain', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Spanish', logo: 'eurosport1.png', country: 'ES' },
  { id: 525, name: 'EuroSport 2 Spain', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Spanish', logo: 'eurosport2.png', country: 'ES' },
  { id: 878, name: 'EuroSport 1 Italy', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Italian', logo: 'eurosport1.png', country: 'IT' },
  { id: 879, name: 'EuroSport 2 Italy', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Italian', logo: 'eurosport2.png', country: 'IT' },
  { id: 57, name: 'EuroSport 1 Poland', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Polish', logo: 'eurosport1.png', country: 'PL' },
  { id: 58, name: 'EuroSport 2 Poland', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Polish', logo: 'eurosport2.png', country: 'PL' },
  { id: 41, name: 'EuroSport 1 Greece', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Greek', logo: 'eurosport1.png', country: 'GR' },
  { id: 42, name: 'EuroSport 2 Greece', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Greek', logo: 'eurosport2.png', country: 'GR' },
  { id: 233, name: 'Eurosport 1 NL', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Dutch', logo: 'eurosport1.png', country: 'NL' },
  { id: 234, name: 'Eurosport 2 NL', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Dutch', logo: 'eurosport2.png', country: 'NL' },
  { id: 231, name: 'Eurosport 1 Sweden/Nordic', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Swedish', logo: 'eurosport1.png', country: 'SE' },
  { id: 232, name: 'Eurosport 2 Sweden/Nordic', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Swedish', logo: 'eurosport2.png', country: 'SE' },

  // beIN France & Global
  { id: 116, name: 'beIN SPORTS 1 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein1_fr.png', country: 'FR' },
  { id: 117, name: 'beIN SPORTS 2 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein2_fr.png', country: 'FR' },
  { id: 118, name: 'beIN SPORTS 3 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein3_fr.png', country: 'FR' },
  { id: 494, name: 'beIN Sports MAX 4 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein_max.png', country: 'FR' },
  { id: 495, name: 'beIN Sports MAX 5 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein_max.png', country: 'FR' },
  { id: 496, name: 'beIN Sports MAX 6 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein_max.png', country: 'FR' },
  { id: 497, name: 'beIN Sports MAX 7 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein_max.png', country: 'FR' },
  { id: 498, name: 'beIN Sports MAX 8 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein_max.png', country: 'FR' },
  { id: 499, name: 'beIN Sports MAX 9 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein_max.png', country: 'FR' },
  { id: 500, name: 'beIN Sports MAX 10 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', logo: 'bein_max.png', country: 'FR' },
  { id: 372, name: 'beIN SPORTS en Español', category: 'bein', subcat: 'bein_es', quality: '1080p FHD', lang: 'Spanish', logo: 'bein_es.png', country: 'US' },
  { id: 491, name: 'beIN SPORTS Australia 1', category: 'bein', subcat: 'bein_au', quality: '1080p FHD', lang: 'English', logo: 'bein_au.png', country: 'AU' },
  { id: 492, name: 'beIN SPORTS Australia 2', category: 'bein', subcat: 'bein_au', quality: '1080p FHD', lang: 'English', logo: 'bein_au.png', country: 'AU' },
  { id: 493, name: 'beIN SPORTS Australia 3', category: 'bein', subcat: 'bein_au', quality: '1080p FHD', lang: 'English', logo: 'bein_au.png', country: 'AU' },
  { id: 62, name: 'beIN SPORTS 1 Turkey', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', logo: 'bein_tr.png', country: 'TR' },
  { id: 63, name: 'beIN SPORTS 2 Turkey', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', logo: 'bein_tr.png', country: 'TR' },
  { id: 64, name: 'beIN SPORTS 3 Turkey', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', logo: 'bein_tr.png', country: 'TR' },
  { id: 67, name: 'beIN SPORTS 4 Turkey', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', logo: 'bein_tr.png', country: 'TR' },

  // Arena & European Premium
  { id: 134, name: 'Arena Sport 1 Premium', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', logo: 'arena.png', country: 'RS' },
  { id: 135, name: 'Arena Sport 2 Premium', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', logo: 'arena.png', country: 'RS' },
  { id: 139, name: 'Arena Sport 3 Premium', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', logo: 'arena.png', country: 'RS' },
  { id: 429, name: 'Arena Sport 1 Serbia', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', logo: 'arena.png', country: 'RS' },
  { id: 430, name: 'Arena Sport 2 Serbia', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', logo: 'arena.png', country: 'RS' },
  { id: 432, name: 'Arena Sport 1 Croatia', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Croatian', logo: 'arena.png', country: 'HR' },
  { id: 123, name: 'Astro SuperSport 1', category: 'euro', subcat: 'astro', quality: '1080p FHD', lang: 'English', logo: 'astro.png', country: 'MY' },
  { id: 124, name: 'Astro SuperSport 2', category: 'euro', subcat: 'astro', quality: '1080p FHD', lang: 'English', logo: 'astro.png', country: 'MY' }
];

function isExcludedChannelName(rawName: string): boolean {
  return /ssc|alkass|al kass|abu dhabi|ad sport|dubai|israel|5plus|5stars|5live|5sport|sport\s*[1-5]\s*israel|sport\s*[1-5]\s*il|yes\s*sport|one\s*il/i.test(rawName);
}

// Determines if a competition officially broadcasts on beIN Sports MENA (Arabic Channels 91-99).
// Lower divisions (Ligue 2, Championship, Serie B, 2. Bundesliga, Segunda) and domestic non-MENA leagues
// do NOT air on beIN MENA Arabic, so any beIN MENA channel tags from third-party scrapers are fake and filtered out.
function isCompetitionWithBeinMenaRights(competition: string): boolean {
  if (!competition) return false;
  const c = competition.toLowerCase();

  // Exclude lower divisions and leagues without beIN MENA Arabic rights
  if (
    c.includes('ligue 2') ||
    c.includes('championship') ||
    c.includes('league one') ||
    c.includes('league two') ||
    c.includes('segunda') ||
    c.includes('la liga 2') ||
    c.includes('hypermotion') ||
    c.includes('serie b') ||
    c.includes('serie c') ||
    c.includes('2. bundesliga') ||
    c.includes('bundesliga 2') ||
    c.includes('cyprus') ||
    c.includes('serbia') ||
    c.includes('austria') ||
    c.includes('poland') ||
    c.includes('croatia') ||
    c.includes('greece') ||
    c.includes('romania') ||
    c.includes('czech') ||
    c.includes('denmark') ||
    c.includes('sweden') ||
    c.includes('norway') ||
    c.includes('mexico') ||
    c.includes('liga mx') ||
    c.includes('peru') ||
    c.includes('colombia') ||
    c.includes('chile') ||
    c.includes('argentina') ||
    c.includes('women') ||
    c.includes('frauen') ||
    c.includes('u17') ||
    c.includes('u19') ||
    c.includes('u20') ||
    c.includes('u21')
  ) {
    return false;
  }

  // Official beIN MENA rights holders
  return (
    c.includes('champions league') ||
    c.includes('europa league') ||
    c.includes('conference league') ||
    c.includes('premier league') ||
    c.includes('la liga') ||
    c.includes('ligue 1') ||
    c.includes('bundesliga') ||
    c.includes('fa cup') ||
    c.includes('carabao') ||
    c.includes('efl cup') ||
    c.includes('afc') ||
    c.includes('caf') ||
    c.includes('world cup') ||
    c.includes('nations league') ||
    c.includes('أبطال أوروبا') ||
    c.includes('الدوري الإنجليزي') ||
    c.includes('الدوري الإسباني') ||
    c.includes('الدوري الفرنسي') ||
    c.includes('الدوري الألماني')
  );
}

function categorizeChannel(name: string): { category: 'ar' | 'bein' | 'euro' | 'other'; subcat: string; lang: string } {
  const lower = name.toLowerCase();
  if (lower.includes('bein')) {
    if (lower.includes('arabic') || lower.includes('mena 1') || lower.includes('mena 2') || lower.includes('mena 3') || lower.includes('mena 4') || lower.includes('mena 5') || lower.includes('mena 6') || lower.includes('mena 7') || lower.includes('mena 8') || lower.includes('mena 9') || /bein\s*sports?\s*[1-9]\b/i.test(lower)) {
      if (lower.includes('english')) return { category: 'bein', subcat: 'bein_mena', lang: 'English' };
      if (lower.includes('france') || lower.includes('turkey') || lower.includes('australia') || lower.includes('malaysia')) {
        // handled below
      } else {
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
  if (
    lower.includes('euro') ||
    lower.includes('arena') ||
    lower.includes('astro') ||
    lower.includes('sky sport') ||
    lower.includes('tnt sport') ||
    lower.includes('dazn') ||
    lower.includes('espn') ||
    lower.includes('canal+') ||
    lower.includes('paramount') ||
    lower.includes('supersport') ||
    lower.includes('super sport') ||
    lower.includes('premier sport') ||
    lower.includes('sport tv') ||
    lower.includes('eleven sport') ||
    lower.includes('ziggo') ||
    lower.includes('viaplay') ||
    lower.includes('movistar') ||
    lower.includes('laliga') ||
    lower.includes('ligue1')
  ) {
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

// Scrape DaddyLive All Soccer Events Catalog (https://dlive.sx/index.php?cat=All+Soccer+Events+%E2%9A%BD)
async function fetchDliveSoccerCatalog(targetDateKey: 'yesterday' | 'today' | 'tomorrow' = 'today'): Promise<DliveCatalogData> {
  const cacheKey = `dlive_soccer_catalog_v5_${targetDateKey}`;
  const cached = getCached<DliveCatalogData>(cacheKey, 2 * 60 * 1000);
  if (cached) return cached;

  const events: DliveSoccerEvent[] = [];
  const channelMap = new Map<number, { id: number; name: string; category: string; subcat: string; quality: string; lang: string; country: string; description?: string }>();

  try {
    const res = await fetch('https://dlive.sx/index.php?cat=All+Soccer+Events+%E2%9A%BD', {
      headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
      signal: AbortSignal.timeout(4500)
    });

    if (res.ok) {
      const html = await res.text();
      const now = new Date();
      const nowUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

      // Calculate target calendar date in UTC/GMT
      const targetDate = new Date();
      if (targetDateKey === 'yesterday') targetDate.setUTCDate(targetDate.getUTCDate() - 1);
      else if (targetDateKey === 'tomorrow') targetDate.setUTCDate(targetDate.getUTCDate() + 1);

      const targetDay = targetDate.getUTCDate();
      const targetMonth = targetDate.getUTCMonth(); // 0-11
      const targetYear = targetDate.getUTCFullYear();
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

      // Split into day blocks: <div class="schedule__day">
      const daySections = html.split(/<div class="schedule__day">/i);

      for (let d = 1; d < daySections.length; d++) {
        const daySection = daySections[d];
        const dayTitleMatch = daySection.match(/class="schedule__dayTitle">([^<]+)/i);
        const dayTitle = dayTitleMatch ? dayTitleMatch[1].trim() : '';

        // Parse date from e.g. "Monday 02nd Nov 2026 - Schedule Time UK GMT"
        const dm = dayTitle.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i);
        let isTargetDay = false;
        let dayDiff = 0; // 0 = today, -1 = yesterday, 1 = tomorrow
        if (dm) {
          const parsedDay = parseInt(dm[1], 10);
          const parsedMonth = monthNames.indexOf(dm[2].slice(0, 3).toLowerCase());
          const parsedYear = parseInt(dm[3], 10);
          isTargetDay = parsedDay === targetDay && parsedMonth === targetMonth && parsedYear === targetYear;
          const eventDate = new Date(Date.UTC(parsedYear, parsedMonth, parsedDay));
          const todayDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          dayDiff = Math.round((eventDate.getTime() - todayDate.getTime()) / (24 * 3600 * 1000));
        } else if (targetDateKey === 'today' && d === 1) {
          isTargetDay = true;
        }

        const blocks = daySection.split(/<div class="schedule__event">/i);

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

          const chLinks = [...block.matchAll(/href=["']\/watch\.php\?id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/g)];
          const eventChannels: Array<{ channel_id: number; channel_name: string; quality: string; isBeinArabic: boolean }> = [];
          const seenInEvent = new Set<number>();

          for (const m of chLinks) {
            const chId = parseInt(m[1], 10);
            const chName = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            if (!chId || !chName || seenInEvent.has(chId) || isExcludedChannelName(chName)) continue;

            const isBeinArCandidate = (chId >= 91 && chId <= 99) || chId === 578 || /bein\s*sports\s*mena\s*[1-9]\b/i.test(chName);
            // Verify broadcasting rights: if competition does NOT have beIN MENA Arabic rights (e.g. Ligue 2, Championship, etc.),
            // skip fake beIN MENA Arabic channel tag erroneously attached by DaddyLive!
            if (isBeinArCandidate && !isCompetitionWithBeinMenaRights(competition)) {
              continue;
            }

            seenInEvent.add(chId);

            const isBeinAr = isBeinArCandidate && isCompetitionWithBeinMenaRights(competition);
            let displayName = chName;
            if (isBeinAr && chId >= 91 && chId <= 99) {
              displayName = `beIN Sports ${chId - 90} HD`;
            } else if (chId === 1 || /thmanyah/i.test(chName)) {
              displayName = 'ثمانية (Thmanyah) HD';
            }

            eventChannels.push({
              channel_id: chId,
              channel_name: displayName,
              quality: '1080p FHD',
              isBeinArabic: isBeinAr
            });

            // Register discovered channel across all day blocks so no channels are missed
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

          const diff = nowUtcMinutes - gmtMinutes;
          const isCurrentlyLive = diff >= 0 && diff <= 125;

          // Inclusion logic: NEVER drop an active live match or match kicking off soon for today!
          let shouldInclude = false;
          if (targetDateKey === 'today') {
            if (isCurrentlyLive || isTargetDay || (dayDiff <= 0 && diff >= -60 && diff <= 125)) {
              shouldInclude = true;
            }
          } else if (targetDateKey === 'yesterday') {
            if ((isTargetDay || dayDiff < 0) && !isCurrentlyLive && diff > 125) {
              shouldInclude = true;
            }
          } else if (targetDateKey === 'tomorrow') {
            if (isTargetDay || dayDiff > 0) {
              shouldInclude = true;
            }
          }

          if (!shouldInclude) continue;

          let status: 'LIVE' | 'FIXTURE' | 'RESULT' = 'FIXTURE';
          let statusText = 'لم تبدأ بعد';
          let minute: string | null = null;

          if (isCurrentlyLive && targetDateKey === 'today') {
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
          } else if (targetDateKey === 'yesterday' || (targetDateKey === 'today' && diff > 125 && isTargetDay)) {
            status = 'RESULT';
            statusText = 'انتهت';
          } else {
            status = 'FIXTURE';
            statusText = 'لم تبدأ بعد';
          }

          eventChannels.sort((a, b) => {
            const score = (c: { channel_id: number; channel_name: string; isBeinArabic: boolean }) => {
              if (c.isBeinArabic) return 100;
              // If Saudi / Arab competition, prioritize Arabic broadcaster (Thmanyah, SSC, etc.)
              if (/saudi|arabia|pro league|roshn|king cup|كأس الملك|دوري روشن|السعودي/i.test(competition)) {
                if (/thmanyah|ثمانية|ssc|riyadiah/i.test(c.channel_name) || c.channel_id === 1) return 98;
              }
              // General Arabic broadcaster
              if (/thmanyah|ثمانية|عربي|arabic/i.test(c.channel_name) || c.channel_id === 1) return 96;

              // If French competition, prioritize French sports channels (beIN Sports France, Canal+, Ligue 1+)
              if (/ligue 2|ligue 1|france|coupe de france/i.test(competition)) {
                if (/france|canal\+|ligue1\+/i.test(c.channel_name)) return 95;
              }
              // If English competition, prioritize UK sports channels
              if (/premier league|championship|fa cup|carabao|england/i.test(competition)) {
                if (/uk|sky sports|tnt sports/i.test(c.channel_name)) return 95;
              }
              // If Spanish competition, prioritize Spanish channels
              if (/la liga|spain|copa del rey/i.test(competition)) {
                if (/spain|dazn laliga|movistar/i.test(c.channel_name)) return 95;
              }
              // If German competition, prioritize German channels
              if (/bundesliga|germany|dfb/i.test(competition)) {
                if (/sky sport bundesliga|dazn.*de/i.test(c.channel_name)) return 95;
              }
              // If Italian competition, prioritize Italian channels
              if (/serie a|serie b|italy|coppa italia/i.test(competition)) {
                if (/dazn italia|sky sport.*it/i.test(c.channel_name)) return 95;
              }
              // If Portuguese competition, prioritize Portuguese channels
              if (/portugal|primeira/i.test(competition)) {
                if (/sport tv.*portugal|sport tv/i.test(c.channel_name)) return 95;
              }

              if (/bein/i.test(c.channel_name)) return 75;
              if (/sky|tnt|dazn|paramount|canal\+|arena|espn|cbs|eurosport|sport tv|premier/i.test(c.channel_name)) return 60;
              if (/event/i.test(c.channel_name)) return 10;
              return 40;
            };
            return score(b) - score(a);
          });

          events.push({
            id: `dlive_ev_${d}_${i}_${gmtMinutes}`,
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
    }
  } catch {
    // Graceful fallback if catalog fetch times out
  }

  const result: DliveCatalogData = {
    events,
    discoveredChannels: Array.from(channelMap.values())
  };
  if (events.length > 0) {
    setCache(cacheKey, result);
  }
  return result;
}

// API: Channels list (Merges Curated + 24/7 Channels + All Soccer Events Catalog Channels)
app.get('/api/channels', async (req: Request, res: Response) => {
  try {
    const cached = getCached<any[]>('all_channels_v2', 15 * 60 * 1000);
    if (cached) {
      return res.json({ success: true, count: cached.length, channels: cached });
    }

    const allChannels: any[] = [];
    const knownIds = new Set<number>();

    for (const ch of CURATED_SPECIAL_CHANNELS) {
      if (!knownIds.has(ch.id)) {
        allChannels.push({ ...ch });
        knownIds.add(ch.id);
      }
    }

    // Fetch 24/7 channels and Soccer Event catalog in parallel
    const [res247, soccerCatalog] = await Promise.allSettled([
      fetch('https://dlive.sx/24-7-channels.php', {
        headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
        signal: AbortSignal.timeout(3500)
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
          allChannels.push({
            id,
            name: rawName,
            category,
            subcat,
            quality: '1080p FHD',
            lang,
            country: 'Global'
          });
          knownIds.add(id);
        }
      }
    }

    // Merge all channels from All Soccer Events catalog (e.g., #55 Paramount+, #156 Liga 1 Max Peru, etc.)
    if (soccerCatalog.status === 'fulfilled') {
      for (const ch of soccerCatalog.value.discoveredChannels) {
        if (!knownIds.has(ch.id)) {
          allChannels.push(ch);
          knownIds.add(ch.id);
        } else {
          // Enrich existing channel with live event description if available
          const existing = allChannels.find(c => c.id === ch.id);
          if (existing && ch.description && !existing.description) {
            existing.description = ch.description;
          }
        }
      }
    }

    setCache('all_channels_v2', allChannels);
    res.json({ success: true, count: allChannels.length, channels: allChannels });
  } catch {
    res.status(200).json({ success: true, count: CURATED_SPECIAL_CHANNELS.length, channels: CURATED_SPECIAL_CHANNELS });
  }
});

// Bilingual keyword mapping to link Yallakora Arabic matches with DaddyLive English soccer events
const TEAM_TRANSLATION_KEYWORDS: Array<[RegExp, RegExp]> = [
  [/ليفربول/i, /liverpool/i],
  [/برايتون/i, /brighton/i],
  [/مانشستر يونايتد/i, /manchester united/i],
  [/مانشستر سيتي/i, /manchester city/i],
  [/بورنموث/i, /bournemouth/i],
  [/برينتفورد/i, /brentford/i],
  [/كريستال بالاس/i, /crystal palace/i],
  [/نيوكاسل/i, /newcastle/i],
  [/سندرلاند/i, /sunderland/i],
  [/ليدز/i, /leeds/i],
  [/أرسنال|آرسنال/i, /arsenal/i],
  [/تشيلسي/i, /chelsea/i],
  [/توتنهام/i, /tottenham/i],
  [/أستون فيلا/i, /aston villa/i],
  [/برشلونة/i, /barcelona/i],
  [/ريال مدريد/i, /real madrid/i],
  [/أتلتيكو مدريد/i, /atletico madrid|atlético/i],
  [/بلباو/i, /athletic club|bilbao/i],
  [/خيتافي/i, /getafe/i],
  [/سيلتا فيجو/i, /celta/i],
  [/ريال بيتيس/i, /betis/i],
  [/ريال سوسيداد/i, /real sociedad/i],
  [/ليفانتي/i, /levante/i],
  [/إشبيلية/i, /sevilla/i],
  [/فالنسيا/i, /valencia/i],
  [/فياريال/i, /villarreal/i],
  [/بايرن ميونخ|بايرن ميونيخ/i, /bayern/i],
  [/فرايبورج|فرايبورغ/i, /freiburg/i],
  [/باير ليفركوزن|ليفركوزن/i, /leverkusen/i],
  [/هوفنهايم/i, /hoffenheim/i],
  [/دورتموند/i, /dortmund/i],
  [/لايبزيج|لايبزيغ/i, /leipzig/i],
  [/فرانكفورت/i, /frankfurt/i],
  [/شتوتجارت/i, /stuttgart/i],
  [/يوفنتوس/i, /juventus/i],
  [/ليتشي/i, /lecce/i],
  [/إنتر ميلان|انتر ميلان/i, /internazionale|inter\b/i],
  [/فيورنتينا/i, /fiorentina/i],
  [/ميلان/i, /\bmilan\b/i],
  [/أودينيزي/i, /udinese/i],
  [/أتالانتا/i, /atalanta/i],
  [/فروزينوني/i, /frosinone/i],
  [/نابولي/i, /napoli/i],
  [/روما/i, /\broma\b/i],
  [/لاتسيو/i, /lazio/i],
  [/جنوى/i, /genoa/i],
  [/فينيزيا/i, /venezia/i],
  [/باريس سان جيرمان/i, /psg|paris saint/i],
  [/ليون/i, /lyon/i],
  [/مارسيليا/i, /marseille/i],
  [/موناكو/i, /monaco/i],
  [/ليل/i, /\blille\b/i],
  [/رين/i, /rennes/i],
  [/ستراسبورج|ستراسبورغ/i, /strasbourg/i],
  [/تولوز/i, /toulouse/i],
  [/تروا/i, /troyes/i],
  [/أنجيه/i, /angers/i],
  [/لوريان/i, /lorient/i],
  [/أوكسير|اوكسير/i, /auxerre/i],
  [/سبورتنج لشبونة|سبورتينج لشبونة/i, /sporting cp/i],
  [/سبورتينج براجا|براجا/i, /braga/i],
  [/ناسيونال/i, /nacional/i],
  [/بنفيكا/i, /benfica/i],
  [/بورتو/i, /porto/i],
  [/جوزتيبي/i, /goztepe|göztepe/i],
  [/كونيا سبور/i, /konyaspor/i]
];

function matchArabicToDliveEvent(arTeamA: string, arTeamB: string, ykTimeStr: string, dliveEvents: DliveSoccerEvent[]): DliveSoccerEvent | null {
  const arCombined = `${arTeamA} ${arTeamB}`;
  const [ykH, ykM] = ykTimeStr.split(':').map(n => parseInt(n || '0', 10));
  const ykTotalMins = ykH * 60 + ykM;

  let bestEvent: DliveSoccerEvent | null = null;
  let bestScore = 0;

  for (const ev of dliveEvents) {
    if (/women|frauen|u17|u19|u21/i.test(ev.competition)) continue;
    const enCombined = `${ev.teamA} ${ev.teamB}`;
    let teamMatches = 0;

    for (const [arRx, enRx] of TEAM_TRANSLATION_KEYWORDS) {
      if (arRx.test(arCombined) && enRx.test(enCombined)) {
        teamMatches++;
      }
    }

    if (teamMatches === 0) continue;

    const [evH, evM] = ev.meccaTime.split(':').map(n => parseInt(n || '0', 10));
    const evTotalMins = evH * 60 + evM;
    const timeDiff = Math.abs(ykTotalMins - evTotalMins);

    let score = teamMatches * 10;
    if (timeDiff <= 60) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestEvent = ev;
    }
  }

  return bestScore >= 10 ? bestEvent : null;
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
  [/netherlands\s*-\s*eredivisie/i, 'الدوري الهولندي'],
  [/peru\s*-\s*primera/i, 'الدوري البيروفي الممتاز'],
  [/russian premier league/i, 'الدوري الروسي الممتاز'],
  [/usa\s*-\s*mls|major league soccer/i, 'الدوري الأمريكي MLS']
];

function translateCompetition(comp: string): string {
  for (const [rx, ar] of COMPETITION_AR_MAP) {
    if (rx.test(comp)) return ar;
  }
  return comp;
}

// Helper to format date for Yallakora (MM/DD/YYYY) and ESPN (YYYYMMDD)
function getTargetDateFormats(dateParam: string): {
  dateKey: 'yesterday' | 'today' | 'tomorrow';
  ykDate: string;
  espnDate: string;
} {
  const now = new Date();
  // Shift to Mecca time (UTC+3) so day boundaries match Arab viewers
  const meccaNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  let dateKey: 'yesterday' | 'today' | 'tomorrow' = 'today';
  if (dateParam === 'yesterday') {
    meccaNow.setUTCDate(meccaNow.getUTCDate() - 1);
    dateKey = 'yesterday';
  } else if (dateParam === 'tomorrow') {
    meccaNow.setUTCDate(meccaNow.getUTCDate() + 1);
    dateKey = 'tomorrow';
  }
  const yyyy = meccaNow.getUTCFullYear();
  const mm = String(meccaNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(meccaNow.getUTCDate()).padStart(2, '0');
  return {
    dateKey,
    ykDate: `${mm}/${dd}/${yyyy}`,
    espnDate: `${yyyy}${mm}${dd}`
  };
}

// Lookup maps for Yallakora and ESPN match metadata
const yallakoraMatchMetaMap = new Map<
  string,
  { ykId: string; ykPath: string; teamA: string; teamB: string; competition: string }
>();
const espnEventLookupMap = new Map<string, string>();

// API: Live Matches & Schedules (Supports ?date=yesterday|today|tomorrow)
app.get('/api/live-matches', async (req: Request, res: Response) => {
  const rawDate = String(req.query.date || 'today').toLowerCase();
  const { dateKey, ykDate, espnDate } = getTargetDateFormats(rawDate);
  const cacheKey = `live_matches_realtime_v5_${dateKey}`;
  const cacheTtl = dateKey === 'today' ? 20 * 1000 : 120 * 1000;

  const cachedMatches = getCached<any>(cacheKey, cacheTtl);
  if (cachedMatches) {
    return res.json({ success: true, date: dateKey, matches: cachedMatches });
  }

  const mapBroadcaster = (rawChannel: string | null) => {
    if (!rawChannel || rawChannel.trim().length === 0) {
      return {
        channels: [] as Array<{ channel_id: number; channel_name: string; quality: string; isBeinArabic: boolean }>,
        isBeinArabic: false,
        broadcasterLabel: '',
        network: 'unbroadcast' as const
      };
    }

    const trimmed = rawChannel.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check beIN Arabic 1-9
    const beinNumMatch =
      trimmed.match(/(?:bein\s*sports?|ب[يى]\s*إن\s*سبورت|ب[يى]\s*ان\s*سبورت)\s*(\d+)/i) ||
      trimmed.match(/(\d+)\s*(?:ب[يى]\s*إن\s*سبورت|ب[يى]\s*ان\s*سبورت)/i);
    if (beinNumMatch) {
      const num = parseInt(beinNumMatch[1], 10);
      const chId = 90 + num;
      if (chId >= 91 && chId <= 99) {
        return {
          channels: [{ channel_id: chId, channel_name: `beIN Sports ${num} HD`, quality: '1080p FHD', isBeinArabic: true }],
          isBeinArabic: true,
          broadcasterLabel: `beIN Sports ${num} HD`,
          network: 'bein_ar' as const
        };
      }
    }

    // 2. Check beIN Xtra
    if (lower.includes('اكسترا') || lower.includes('إكسترا') || lower.includes('xtra')) {
      return {
        channels: [{ channel_id: 100, channel_name: 'beIN SPORTS XTRA 1', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'beIN SPORTS XTRA',
        network: 'bein_ar' as const
      };
    }

    // 3. Check beIN News
    if (lower.includes('news') || lower.includes('إخبار') || lower.includes('اخبار')) {
      return {
        channels: [{ channel_id: 578, channel_name: 'beIN Sports News HD', quality: '1080p FHD', isBeinArabic: true }],
        isBeinArabic: true,
        broadcasterLabel: 'beIN Sports News HD',
        network: 'bein_ar' as const
      };
    }

    if (lower.includes('غير') || lower.includes('tod') || lower.includes('starz')) {
      return {
        channels: [],
        isBeinArabic: false,
        broadcasterLabel: trimmed,
        network: 'other' as const
      };
    }

    return {
      channels: [],
      isBeinArabic: false,
      broadcasterLabel: trimmed,
      network: 'other' as const
    };
  };

  try {
    const ykUrl = `https://www.yallakora.com/matches-center?date=${encodeURIComponent(ykDate)}`;

    const [ykRes, dliveCatalog, espnRes] = await Promise.allSettled([
      fetch(ykUrl, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8' },
        signal: AbortSignal.timeout(4000)
      }),
      fetchDliveSoccerCatalog(dateKey),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${espnDate}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(4000)
      })
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
        let tournament = 'مباراة رسمية';
        if (tournMatch) {
          tournament = tournMatch[1].replace(/<[^>]+>/g, '').trim();
        }

        const lowerTourn = tournament.toLowerCase();
        if (
          lowerTourn.includes('طائرة') ||
          lowerTourn.includes('يد') ||
          lowerTourn.includes('سلة') ||
          lowerTourn.includes('قسم ثاني') ||
          lowerTourn.includes('القسم الثاني') ||
          lowerTourn.includes('درجة ثانية') ||
          lowerTourn.includes('هواة')
        ) {
          continue;
        }

        // Split by match item so we preserve livescorematchid="112619" and <a href=".../match/112619/...">
        const items = card.split(/<div[^>]*livescorematchid=/i);
        for (let j = 1; j < items.length; j++) {
          const item = 'livescorematchid=' + items[j];

          const ykIdMatch = item.match(/livescorematchid=["'](\d+)["']/i) || item.match(/\/match\/(\d+)\//i);
          const ykMatchId = ykIdMatch ? ykIdMatch[1] : null;
          const ykHrefMatch = item.match(/href=["']([^"']*\/match\/\d+[^"']*)["']/i);
          const ykMatchPath = ykHrefMatch ? ykHrefMatch[1].split('#')[0] : ykMatchId ? `/Match/?matchID=${ykMatchId}` : null;

          const teamAMatch = item.match(/class="teams teamA".*?<p>(.*?)<\/p>/s);
          const teamA = teamAMatch ? teamAMatch[1].trim() : null;

          const teamBMatch = item.match(/class="teams teamB".*?<p>(.*?)<\/p>/s);
          const teamB = teamBMatch ? teamBMatch[1].trim() : null;

          if (!teamA || !teamB) continue;

          if (/إسرائيل|الكيان|مكابي|هابويل|هبوعيل|تل أبيب|بئر سبع|بيتار|سخنين|maccabi|hapoel/i.test(`${teamA} ${teamB}`)) {
            continue;
          }

          if (ykMatchId) {
            yallakoraMatchMetaMap.set(ykMatchId, {
              ykId: ykMatchId,
              ykPath: ykMatchPath || '',
              teamA,
              teamB,
              competition: tournament
            });
          }

          const chMatch = item.match(/<div class="channel[^"]*">(.*?)<\/div>/);
          const rawChannel = chMatch ? chMatch[1].replace(/<[^>]+>/g, '').trim() : null;
          const mapped = mapBroadcaster(rawChannel);

          const timeMatch = item.match(/class="time">(.*?)<\/span>/);
          const timeStr = timeMatch ? timeMatch[1].trim() : '21:00';

          const statusMatch = item.match(/class="matchStatus[^"]*".*?<span>(.*?)<\/span>/s);
          const rawStatus = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : 'لم تبدأ';

          let status: 'LIVE' | 'FIXTURE' | 'RESULT' = 'FIXTURE';
          const sLower = rawStatus.toLowerCase();
          if (
            sLower.includes('مباشر') ||
            sLower.includes('شوط') ||
            sLower.includes('استراحة') ||
            sLower.includes('الان') ||
            sLower.includes('الآن')
          ) {
            status = 'LIVE';
          } else if (sLower.includes('انتهت')) {
            status = 'RESULT';
          }

          const scores = [...item.matchAll(/<span class="score">([0-9]+)<\/span>/g)].map(m => parseInt(m[1], 10));
          const scoreA = scores.length > 0 ? scores[0] : null;
          const scoreB = scores.length > 1 ? scores[1] : null;

          const logoAMatch = item.match(/class="teams teamA".*?<img[^>]*src="([^"]+)"/s);
          const logoA = logoAMatch ? logoAMatch[1].replace(/\\/g, '/') : null;

          const logoBMatch = item.match(/class="teams teamB".*?<img[^>]*src="([^"]+)"/s);
          const logoB = logoBMatch ? logoBMatch[1].replace(/\\/g, '/') : null;

          // Cross-reference with DaddyLive All Soccer Events catalog to get ALL playable international & beIN channels
          const matchedDlive = matchArabicToDliveEvent(teamA, teamB, timeStr, dliveEvents);
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
            teamA: { name: teamA, logo: logoA || getTeamLogoSvg(teamA) || undefined },
            teamB: { name: teamB, logo: logoB || getTeamLogoSvg(teamB) || undefined },
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

    // Also include remaining live/upcoming soccer events from DaddyLive catalog so users have full global coverage
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

    // Parse ESPN scoreboard events to cache ESPN event IDs and enrich or add matches
    if (espnRes.status === 'fulfilled' && espnRes.value.ok) {
      try {
        const espnJson = (await espnRes.value.json()) as any;
        const events = espnJson?.events || [];
        for (const ev of events) {
          const compObj = ev?.competitions?.[0];
          const competitors = compObj?.competitors || [];
          if (competitors.length < 2) continue;
          const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
          const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];
          const rawHome = home?.team?.displayName || home?.team?.name || '';
          const rawAway = away?.team?.displayName || away?.team?.name || '';
          if (!rawHome || !rawAway) continue;
          if (/israel|maccabi|hapoel/i.test(`${rawHome} ${rawAway}`)) continue;

          const teamAName = translateTeamNameAr(rawHome);
          const teamBName = translateTeamNameAr(rawAway);
          if (ev.id) {
            espnEventLookupMap.set(`${teamAName}|${teamBName}`, String(ev.id));
            espnEventLookupMap.set(`${rawHome.toLowerCase()}|${rawAway.toLowerCase()}`, String(ev.id));
          }

          const state = ev?.status?.type?.state;
          const status: 'LIVE' | 'FIXTURE' | 'RESULT' =
            state === 'in' ? 'LIVE' : state === 'post' ? 'RESULT' : 'FIXTURE';
          const scoreA = status !== 'FIXTURE' ? parseInt(home?.score || '0', 10) : null;
          const scoreB = status !== 'FIXTURE' ? parseInt(away?.score || '0', 10) : null;

          // Check if already in liveList (from Yallakora or DaddyLive)
          const existing = liveList.find(m => {
            const mA = m.teamA.name.toLowerCase();
            const mB = m.teamB.name.toLowerCase();
            const tA = teamAName.toLowerCase();
            const tB = teamBName.toLowerCase();
            const rH = rawHome.toLowerCase();
            const rA = rawAway.toLowerCase();
            return (
              (mA.includes(tA) || tA.includes(mA) || mA.includes(rH) || rH.includes(mA)) &&
              (mB.includes(tB) || tB.includes(mB) || mB.includes(rA) || rA.includes(mB))
            );
          });

          if (existing) {
            // Enrich existing match with logos, scores, clock, and status
            if (!existing.teamA.logo && home?.team?.logo) existing.teamA.logo = home.team.logo;
            if (!existing.teamB.logo && away?.team?.logo) existing.teamB.logo = away.team.logo;
            if (existing.scoreA === null && scoreA !== null) existing.scoreA = scoreA;
            if (existing.scoreB === null && scoreB !== null) existing.scoreB = scoreB;
            if (status === 'LIVE') {
              existing.status = 'LIVE';
              if (ev?.status?.displayClock) existing.minute = ev.status.displayClock;
            } else if (status === 'RESULT' && existing.status === 'FIXTURE') {
              existing.status = 'RESULT';
              existing.statusText = 'انتهت';
            }
          } else if (liveList.length < 80) {
            // Match with DaddyLive events to find playable broadcast channels
            const matchedDlive = matchArabicToDliveEvent(teamAName, teamBName, '', dliveEvents);
            const evChannels = matchedDlive ? [...matchedDlive.channels] : [];
            const hasBeinAr = evChannels.some(c => c.isBeinArabic);

            const evDate = ev?.date ? new Date(ev.date) : new Date();
            const meccaH = (evDate.getUTCHours() + 3) % 24;
            const meccaM = String(evDate.getUTCMinutes()).padStart(2, '0');
            const timeStr = `${String(meccaH).padStart(2, '0')}:${meccaM}`;

            const leagueName = translateCompetition(ev?.league?.name || compObj?.league?.name || 'بطولة كرة قدم عالمية');

            matchIdx++;
            liveList.push({
              id: `espn_${ev.id || matchIdx}`,
              competition: leagueName,
              teamA: { name: teamAName, logo: home?.team?.logo || getTeamLogoSvg(teamAName) || undefined },
              teamB: { name: teamBName, logo: away?.team?.logo || getTeamLogoSvg(teamBName) || undefined },
              scoreA,
              scoreB,
              status,
              statusText: status === 'LIVE' ? 'مباشر' : status === 'RESULT' ? 'انتهت' : 'لم تبدأ',
              minute: status === 'LIVE' ? (ev?.status?.displayClock || 'مباشر') : null,
              time: `${timeStr} بتوقيت مكة`,
              localTime: `${timeStr} بتوقيت مكة`,
              channels: evChannels.slice(0, 6),
              isBeinArabic: hasBeinAr,
              broadcasterLabel: evChannels.length > 0 ? evChannels.slice(0, 3).map(c => c.channel_name).join(' / ') : 'غير منقولة تلفزيونياً',
              network: hasBeinAr ? 'bein_ar' : evChannels.length > 0 ? 'other' : 'unbroadcast'
            });
          }
        }
      } catch {
        // ignore ESPN parse error
      }
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

    setCache(cacheKey, liveList);
    if (dateKey === 'today') {
      setCache('live_matches_realtime_v2', liveList);
    }
    return res.json({ success: true, date: dateKey, matches: liveList });
  } catch (err: any) {
    return res.json({ success: true, date: dateKey, matches: [] });
  }
});

// API: League Standings (Live from Yallakora Arabic Standings & ESPN API — Zero Hardcoded Data)
app.get('/api/standings', async (req: Request, res: Response) => {
  const leagueId = String(req.query.league || 'epl').toLowerCase();
  const baseLeagueInfo = LEAGUES_CATALOG.find(l => l.id === leagueId) || LEAGUES_CATALOG[0];
  const cacheKey = `standings_live_v3_${baseLeagueInfo.id}`;
  const cached = getCached<{ rows: any[]; season: string }>(cacheKey, 5 * 60 * 1000);
  if (cached) {
    return res.json({
      success: true,
      league: { ...baseLeagueInfo, season: cached.season },
      leagues: LEAGUES_CATALOG,
      standings: cached.rows
    });
  }

  // 1. Primary live Arabic standings source: Yallakora (/standing/ and /group-standing/)
  const ykPath = YALLAKORA_STANDING_PATHS[baseLeagueInfo.id];
  if (ykPath) {
    try {
      const ykRes = await fetch(`https://www.yallakora.com${ykPath}`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(5000)
      });
      if (ykRes.ok) {
        const html = await ykRes.text();
        const parsedYk = parseYallakoraStandingsHtml(html, baseLeagueInfo);
        if (parsedYk && parsedYk.rows.length > 0) {
          const liveSeason = parsedYk.season || baseLeagueInfo.season;
          setCache(cacheKey, { rows: parsedYk.rows, season: liveSeason });
          return res.json({
            success: true,
            league: { ...baseLeagueInfo, season: liveSeason },
            leagues: LEAGUES_CATALOG,
            standings: parsedYk.rows
          });
        }
      }
    } catch {
      // Fallback to live ESPN standings API below
    }
  }

  // 2. Secondary live source: ESPN Standings API
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
        const espnJson = (await espnRes.json()) as any;
        const parsed = parseEspnStandingsToArabic(espnJson, baseLeagueInfo);
        if (parsed && parsed.length > 0) {
          const espnSeasonMatch = String(
            espnJson?.children?.[0]?.standings?.seasonDisplayName ||
              espnJson?.seasons?.[0]?.displayName ||
              ''
          ).match(/(\d{4})[-/](\d{2,4})/);
          const liveSeason = espnSeasonMatch
            ? `${espnSeasonMatch[1]} / ${espnSeasonMatch[2].length === 2 ? espnSeasonMatch[1].slice(0, 2) + espnSeasonMatch[2] : espnSeasonMatch[2]}`
            : baseLeagueInfo.season;

          setCache(cacheKey, { rows: parsed, season: liveSeason });
          return res.json({
            success: true,
            league: { ...baseLeagueInfo, season: liveSeason },
            leagues: LEAGUES_CATALOG,
            standings: parsed
          });
        }
      }
    } catch {
      // ignore error
    }
  }

  return res.json({
    success: false,
    league: baseLeagueInfo,
    leagues: LEAGUES_CATALOG,
    standings: []
  });
});

function inferPositionFromFormation(idx: number, formation: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (idx === 0) return 'GK';
  const parts = formation.split('-').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
  const defCount = parts[0] || 4;
  const fwdCount = parts.length > 1 ? parts[parts.length - 1] : 3;
  if (idx <= defCount) return 'DEF';
  if (idx >= 11 - fwdCount) return 'FWD';
  return 'MID';
}

function mapArabicPosToCode(posAr: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (posAr.includes('حارس')) return 'GK';
  if (posAr.includes('مدافع') || posAr.includes('ظهير')) return 'DEF';
  if (posAr.includes('مهاجم') || posAr.includes('جناح')) return 'FWD';
  return 'MID';
}

function mapEspnPosToCode(posAbbr: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  const u = (posAbbr || '').toUpperCase();
  if (u === 'G' || u === 'GK') return 'GK';
  if (u.includes('D') || u.includes('B')) return 'DEF';
  if (u.includes('F') || u.includes('W') || u === 'ST' || u === 'CF') return 'FWD';
  return 'MID';
}

async function fetchYallakoraTeamSquadFallback(teamUrlPath: string): Promise<{
  startingXI: Array<{ number: number; name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }>;
  substitutes: Array<{ number: number; name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }>;
} | null> {
  try {
    const squadPath = teamUrlPath.replace('/team/', '/team-squad/');
    const res = await fetch(`https://www.yallakora.com${squadPath}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const matches = [
      ...html.matchAll(
        /<div class="playerInfo">\s*<p class="shirt">(.*?)<\/p>\s*<p class="name">(.*?)<\/p>\s*<p class="position">(.*?)<\/p>/gs
      )
    ];
    if (matches.length === 0) return null;

    const allPlayers = matches.map((m, idx) => ({
      number: parseInt(m[1].trim(), 10) || idx + 1,
      name: m[2].replace(/<[^>]+>/g, '').trim(),
      position: mapArabicPosToCode(m[3].trim())
    })).filter(p => p.name.length > 1);

    const gks = allPlayers.filter(p => p.position === 'GK');
    const defs = allPlayers.filter(p => p.position === 'DEF');
    const mids = allPlayers.filter(p => p.position === 'MID');
    const fwds = allPlayers.filter(p => p.position === 'FWD');

    const startingXI = [
      ...gks.slice(0, 1),
      ...defs.slice(0, 4),
      ...mids.slice(0, 3),
      ...fwds.slice(0, 3)
    ];
    const usedNames = new Set(startingXI.map(p => p.name));
    for (const p of allPlayers) {
      if (startingXI.length >= 11) break;
      if (!usedNames.has(p.name)) {
        startingXI.push(p);
        usedNames.add(p.name);
      }
    }

    const substitutes = allPlayers.filter(p => !usedNames.has(p.name)).slice(0, 9);
    return { startingXI, substitutes };
  } catch {
    return null;
  }
}

async function fetchYallakoraRealMatchDetails(ykId: string, ykPath?: string) {
  const postHeaders = {
    'User-Agent': UA,
    'Content-Type': 'application/json; charset=utf-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://www.yallakora.com/'
  };

  const pageUrl = ykPath && ykPath.startsWith('/')
    ? `https://www.yallakora.com${ykPath}`
    : `https://www.yallakora.com/Match/?matchID=${ykId}`;

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
    fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(4500)
    }),
    fetch(`https://www.yallakora.com/match/MatchMinByMinPaging?matchId=${ykId}&PageIndex=2&PageSize=30`, {
      headers: {
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': pageUrl
      },
      signal: AbortSignal.timeout(4500)
    })
  ]);

  let formationA = '';
  let formationB = '';
  let startingA: Array<{ number: number; name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }> = [];
  let startingB: Array<{ number: number; name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }> = [];
  let subsA: Array<{ number: number; name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }> = [];
  let subsB: Array<{ number: number; name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }> = [];

  if (sqRes.status === 'fulfilled' && sqRes.value.ok) {
    const sqHtml = await sqRes.value.text();

    const formMatches = [...sqHtml.matchAll(/<div class="formName">\s*<span>(.*?)<\/span>/gs)];
    if (formMatches[0]?.[1]) formationA = formMatches[0][1].trim();
    if (formMatches[1]?.[1]) formationB = formMatches[1][1].trim();

    const parseSquadBlock = (blockHtml: string, form: string, isSub: boolean) => {
      const players: Array<{ number: number; name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }> = [];
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
            position: isSub
              ? idx === 0
                ? 'GK'
                : idx <= 3
                ? 'DEF'
                : idx <= 6
                ? 'MID'
                : 'FWD'
              : inferPositionFromFormation(idx, form)
          });
          idx++;
        }
      }
      return players;
    };

    const mainIdx = sqHtml.indexOf('teamSquad Main');
    const subIdx = sqHtml.indexOf('teamSquad Sub');
    if (mainIdx !== -1) {
      const mainSection = subIdx !== -1 ? sqHtml.slice(mainIdx, subIdx) : sqHtml.slice(mainIdx);
      const teamBMainIdx = mainSection.indexOf('<div class="teamB">');
      if (teamBMainIdx !== -1) {
        startingA = parseSquadBlock(mainSection.slice(0, teamBMainIdx), formationA, false);
        startingB = parseSquadBlock(mainSection.slice(teamBMainIdx), formationB, false);
      }
    }

    if (subIdx !== -1) {
      const subSection = sqHtml.slice(subIdx);
      const teamBSubIdx = subSection.indexOf('<div class="teamB">');
      if (teamBSubIdx !== -1) {
        subsA = parseSquadBlock(subSection.slice(0, teamBSubIdx), formationA, true);
        subsB = parseSquadBlock(subSection.slice(teamBSubIdx), formationB, true);
      }
    }

    // If official match starting XI is not announced yet, fetch both teams' real Arabic squad from Yallakora team-squad page!
    if (startingA.length === 0 || startingB.length === 0) {
      const teamLinks = [...sqHtml.matchAll(/href=["']([^"']*\/team\/\d+\/[^"']+)["']/gi)].map(m => m[1]);
      const uniqueTeamLinks = [...new Set(teamLinks)];
      if (uniqueTeamLinks.length >= 2) {
        const [fbA, fbB] = await Promise.all([
          startingA.length === 0 ? fetchYallakoraTeamSquadFallback(uniqueTeamLinks[0]) : Promise.resolve(null),
          startingB.length === 0 ? fetchYallakoraTeamSquadFallback(uniqueTeamLinks[1]) : Promise.resolve(null)
        ]);
        if (fbA) {
          startingA = fbA.startingXI;
          subsA = fbA.substitutes;
        }
        if (fbB) {
          startingB = fbB.startingXI;
          subsB = fbB.substitutes;
        }
      }
    }
  }

  // Parse real match events from Yallakora match page (both timeline events AND live minUl feed)
  const events: Array<{
    id: string;
    minute: string;
    team: 'A' | 'B';
    type: 'goal' | 'penalty_goal' | 'yellow_card' | 'red_card' | 'sub';
    player: string;
    assistOrSubOut?: string;
    detail?: string;
  }> = [];

  const parseMinValue = (minStr: string): number => {
    const clean = minStr.replace(/[^0-9+]/g, '');
    if (clean.includes('+')) {
      const [base, extra] = clean.split('+');
      return (parseInt(base, 10) || 0) + (parseInt(extra, 10) || 0) * 0.1;
    }
    return parseInt(clean, 10) || 0;
  };

  if (pageRes.status === 'fulfilled' && pageRes.value.ok) {
    const pageHtml = await pageRes.value.text();
    const minPage2Html =
      minPage2Res.status === 'fulfilled' && minPage2Res.value.ok
        ? await minPage2Res.value.text()
        : '';

    let evIdx = 0;

    // 1. Parse summary timeline events section
    const evStart = pageHtml.indexOf('timeline events');
    if (evStart !== -1) {
      const minByMinPos = pageHtml.indexOf('minbymin', evStart);
      const evHtml = pageHtml.slice(evStart, minByMinPos !== -1 ? minByMinPos : evStart + 18000);
      const liMatches = [...evHtml.matchAll(/<li class="([^"]+)">([\s\S]*?)<\/li>/g)];
      for (const li of liMatches) {
        const cls = li[1];
        const inner = li[2];
        if (cls.includes('referee') || cls.includes('websites')) continue;
        const minMatch = inner.match(/<div class="min">(.*?)<\/div>/s);
        const minRaw = minMatch ? minMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        if (!minRaw || minRaw === '0') continue;

        const team: 'A' | 'B' = cls.includes('right') ? 'A' : 'B';
        const minute = minRaw.includes("'") ? minRaw : `${minRaw}'`;

        if (cls.includes('sub')) {
          const subIn = inner.match(/<span class="subIn">(.*?)<\/span>/s)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
          const subOut = inner.match(/<span class="subOut">(.*?)<\/span>/s)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
          if (subIn) {
            evIdx++;
            events.push({
              id: `yk_ev_${evIdx}`,
              minute,
              team,
              type: 'sub',
              player: subIn,
              assistOrSubOut: subOut ? `خروج: ${subOut}` : undefined
            });
          }
        } else if (cls.includes('goal') || cls.includes('penIn')) {
          const assist = inner.match(/<span class="assister">(.*?)<\/span>/s)?.[1]?.replace(/[()]/g, '').trim();
          const descClean = inner
            .replace(/<div class="min">[\s\S]*?<\/div>/g, '')
            .replace(/<span class="assister">[\s\S]*?<\/span>/g, '')
            .replace(/<[^>]+>/g, '')
            .trim();
          if (descClean) {
            evIdx++;
            events.push({
              id: `yk_ev_${evIdx}`,
              minute,
              team,
              type: cls.includes('pen') ? 'penalty_goal' : 'goal',
              player: descClean,
              assistOrSubOut: assist ? `تمريرة حاسمة: ${assist}` : cls.includes('pen') ? 'ركلة جزاء' : undefined
            });
          }
        } else if (cls.includes('yellowCard') || cls.includes('redCard')) {
          const playerClean = inner
            .replace(/<div class="min">[\s\S]*?<\/div>/g, '')
            .replace(/<[^>]+>/g, '')
            .trim();
          if (playerClean) {
            evIdx++;
            events.push({
              id: `yk_ev_${evIdx}`,
              minute,
              team,
              type: cls.includes('redCard') ? 'red_card' : 'yellow_card',
              player: playerClean
            });
          }
        }
      }
    }

    // 2. Also parse live minute-by-minute (<ul id="minUl"> + Page 2) where live yellow/red cards and subs appear immediately
    const combinedMinHtml = `${pageHtml}\n${minPage2Html}`;
    const minLiMatches = [
      ...combinedMinHtml.matchAll(/<li\s+id="id_\d+"[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/li>/g)
    ];

    for (const m of minLiMatches) {
      const cls = m[1];
      const inner = m[2];
      if (!/yellowCard|redCard|sub|goal|penIn/i.test(cls)) continue;

      const minRaw = inner.match(/<div class="minNumber">\s*(.*?)\s*<\/div>/s)?.[1]?.trim() || '';
      if (!minRaw || minRaw === '0') continue;

      const minute = minRaw.includes("'") ? minRaw : `${minRaw}'`;
      const minNum = parseMinValue(minRaw);
      const team: 'A' | 'B' = /TeamA/i.test(cls) ? 'A' : 'B';

      if (/yellowCard|redCard/i.test(cls)) {
        const type = /redCard/i.test(cls) ? 'red_card' : 'yellow_card';
        const desc =
          inner
            .match(/<p class="description">([\s\S]*?)<\/p>/i)?.[1]
            ?.replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim() || '';
        if (!desc) continue;

        // Extract player name from Arabic card description (e.g. "انذار لـ برادلي باركولا لاعب ليفربول")
        const extractedPlayer =
          desc.match(/(?:انذار|إنذار|بطاقة صفراء|بطاقة حمراء|طرد)\s+(?:لـ\s*|ل)?(.*?)(?:\s+لاعب\s+.*|$)/)?.[1]?.trim() ||
          desc;

        const alreadyExists = events.some(
          e =>
            e.type === type &&
            e.team === team &&
            (Math.abs(parseMinValue(e.minute) - minNum) <= 1.5 ||
              e.player.includes(extractedPlayer) ||
              extractedPlayer.includes(e.player))
        );

        if (!alreadyExists) {
          evIdx++;
          events.push({
            id: `yk_min_ev_${evIdx}`,
            minute,
            team,
            type,
            player: extractedPlayer,
            assistOrSubOut: extractedPlayer !== desc ? desc : undefined
          });
        }
      } else if (/\bsub\b/i.test(cls)) {
        const subIn =
          inner
            .match(/<p class="subIn"><\/p>\s*<a[^>]*>([\s\S]*?)<\/a>/i)?.[1]
            ?.replace(/<[^>]+>/g, '')
            .trim() || '';
        const subOut =
          inner
            .match(/<p class="subOut"><\/p>\s*<a[^>]*>([\s\S]*?)<\/a>/i)?.[1]
            ?.replace(/<[^>]+>/g, '')
            .trim() || '';
        if (!subIn) continue;

        const alreadyExists = events.some(
          e =>
            e.type === 'sub' &&
            e.team === team &&
            (e.player === subIn || Math.abs(parseMinValue(e.minute) - minNum) <= 1)
        );
        if (!alreadyExists) {
          evIdx++;
          events.push({
            id: `yk_min_ev_${evIdx}`,
            minute,
            team,
            type: 'sub',
            player: subIn,
            assistOrSubOut: subOut ? `خروج: ${subOut}` : undefined
          });
        }
      } else if (/goal|penIn/i.test(cls)) {
        const scorer =
          inner
            .match(/<div class="name">\s*<p><\/p>\s*<a[^>]*>([\s\S]*?)<\/a>/i)?.[1]
            ?.replace(/<[^>]+>/g, '')
            .trim() || '';
        if (!scorer) continue;

        const alreadyExists = events.some(
          e =>
            (e.type === 'goal' || e.type === 'penalty_goal') &&
            e.team === team &&
            (e.player.includes(scorer) ||
              scorer.includes(e.player) ||
              Math.abs(parseMinValue(e.minute) - minNum) <= 1.5)
        );
        if (!alreadyExists) {
          evIdx++;
          events.push({
            id: `yk_min_ev_${evIdx}`,
            minute,
            team,
            type: /pen/i.test(cls) ? 'penalty_goal' : 'goal',
            player: scorer
          });
        }
      }
    }

    // Sort events chronologically by minute
    events.sort((a, b) => parseMinValue(a.minute) - parseMinValue(b.minute));
  }

  // Parse real match statistics from EuroMatchStats2
  const stats: Array<{
    label: string;
    valueA: string | number;
    valueB: string | number;
    percentA: number;
    percentB: number;
  }> = [];

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
      stats.push({
        label,
        valueA: st[1].trim(),
        valueB: st[3].trim(),
        percentA: total > 0 ? Math.round((valA / total) * 100) : 50,
        percentB: total > 0 ? Math.round((valB / total) * 100) : 50
      });
    }
  }

  // Parse real H2H matches from GetTeamsHeadToHeadMatches
  const h2h: Array<{
    date: string;
    competition: string;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
  }> = [];

  if (h2hRes.status === 'fulfilled' && h2hRes.value.ok) {
    const h2hHtml = await h2hRes.value.text();
    const blocks = h2hHtml.split(/<div class="matchDtls">/);
    for (let i = 1; i < blocks.length && h2h.length < 6; i++) {
      const b = blocks[i];
      const dateStr = b.match(/<p class="day">\s*(.*?)\s*<\/p>/s)?.[1]?.trim() || '';
      const t1Score = b.match(/class="teamresult team1">\s*<span>([0-9]+)<\/span>/s)?.[1];
      const t1Name = b.match(/class="teamresult team1">[\s\S]*?<div class="teamName">\s*(.*?)\s*<\/div>/s)?.[1]?.trim();
      const t2Score = b.match(/class="teamresult team2">\s*<span>([0-9]+)<\/span>/s)?.[1];
      const t2Name = b.match(/class="teamresult team2">[\s\S]*?<div class="teamName">\s*(.*?)\s*<\/div>/s)?.[1]?.trim();
      if (t1Name && t2Name && t1Score !== undefined && t2Score !== undefined) {
        h2h.push({
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

  return {
    lineupA: { formation: formationA, coach: '', startingXI: startingA, substitutes: subsA },
    lineupB: { formation: formationB, coach: '', startingXI: startingB, substitutes: subsB },
    events,
    stats,
    h2h
  };
}

async function fetchEspnRealMatchDetails(espnEventId: string) {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${encodeURIComponent(espnEventId)}`,
      {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(4500)
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as any;

    const rosters = json?.rosters || [];
    const homeRoster = rosters.find((r: any) => r.homeAway === 'home') || rosters[0];
    const awayRoster = rosters.find((r: any) => r.homeAway === 'away') || rosters[1];

    const parseEspnRoster = (rObj: any) => {
      const formation = rObj?.formation || '';
      const list = Array.isArray(rObj?.roster) ? rObj.roster : [];
      const startingXI = list
        .filter((p: any) => p.starter)
        .map((p: any, idx: number) => ({
          number: parseInt(p.jersey || String(idx + 1), 10) || idx + 1,
          name: p.athlete?.displayName || p.athlete?.fullName || '',
          position: mapEspnPosToCode(p.position?.abbreviation || ''),
          isCaptain: !!p.captain
        }))
        .filter((p: any) => p.name);

      const substitutes = list
        .filter((p: any) => !p.starter)
        .map((p: any, idx: number) => ({
          number: parseInt(p.jersey || String(idx + 12), 10) || idx + 12,
          name: p.athlete?.displayName || p.athlete?.fullName || '',
          position: mapEspnPosToCode(p.position?.abbreviation || '')
        }))
        .filter((p: any) => p.name);

      const coach = rObj?.coach?.[0]?.athlete?.displayName || rObj?.coach?.displayName || '';
      return { formation, coach, startingXI, substitutes };
    };

    const homeTeamName = homeRoster?.team?.displayName || '';
    const events: Array<{
      id: string;
      minute: string;
      team: 'A' | 'B';
      type: 'goal' | 'penalty_goal' | 'yellow_card' | 'red_card' | 'sub';
      player: string;
      assistOrSubOut?: string;
    }> = [];

    const keyEvents = json?.keyEvents || [];
    keyEvents.forEach((ke: any, idx: number) => {
      const tCode = String(ke?.type?.type || ke?.type?.text || '').toLowerCase();
      const clock = ke?.clock?.displayValue || '';
      if (!clock) return;
      const isHome = ke?.team?.displayName === homeTeamName;
      const team: 'A' | 'B' = isHome ? 'A' : 'B';
      const p1 = ke?.participants?.[0]?.athlete?.displayName || '';
      const p2 = ke?.participants?.[1]?.athlete?.displayName || '';

      if (tCode.includes('goal') || ke?.scoringPlay) {
        events.push({
          id: `espn_ev_${idx}`,
          minute: clock,
          team,
          type: tCode.includes('penalty') ? 'penalty_goal' : 'goal',
          player: p1 || ke?.text || 'هدف',
          assistOrSubOut: p2 ? `تمريرة حاسمة: ${p2}` : undefined
        });
      } else if (tCode.includes('yellow')) {
        if (p1) {
          events.push({ id: `espn_ev_${idx}`, minute: clock, team, type: 'yellow_card', player: p1 });
        }
      } else if (tCode.includes('red')) {
        if (p1) {
          events.push({ id: `espn_ev_${idx}`, minute: clock, team, type: 'red_card', player: p1 });
        }
      } else if (tCode.includes('sub')) {
        if (p1) {
          events.push({
            id: `espn_ev_${idx}`,
            minute: clock,
            team,
            type: 'sub',
            player: p1,
            assistOrSubOut: p2 ? `خروج: ${p2}` : undefined
          });
        }
      }
    });

    const stats: Array<{
      label: string;
      valueA: string | number;
      valueB: string | number;
      percentA: number;
      percentB: number;
    }> = [];

    const boxTeams = json?.boxscore?.teams || [];
    if (boxTeams.length >= 2) {
      const getStat = (tIdx: number, name: string) =>
        boxTeams[tIdx]?.statistics?.find((s: any) => s.name === name)?.displayValue;

      const statDefs: Array<[string, string]> = [
        ['possessionPct', 'الاستحواذ على الكرة (%)'],
        ['totalShots', 'إجمالي التسديدات'],
        ['shotsOnTarget', 'التسديدات على المرمى'],
        ['wonCorners', 'الضربات الركنية'],
        ['foulsCommitted', 'الأخطاء المرتكبة'],
        ['offsides', 'التسلل'],
        ['saves', 'تصديات الحارس']
      ];

      for (const [key, label] of statDefs) {
        const vA = getStat(0, key);
        const vB = getStat(1, key);
        if (vA !== undefined && vB !== undefined) {
          const nA = parseFloat(vA) || 0;
          const nB = parseFloat(vB) || 0;
          const tot = nA + nB;
          stats.push({
            label,
            valueA: key === 'possessionPct' ? `${vA}%` : vA,
            valueB: key === 'possessionPct' ? `${vB}%` : vB,
            percentA: tot > 0 ? Math.round((nA / tot) * 100) : 50,
            percentB: tot > 0 ? Math.round((nB / tot) * 100) : 50
          });
        }
      }
    }

    return {
      stadium: json?.gameInfo?.venue?.fullName || '',
      lineupA: parseEspnRoster(homeRoster),
      lineupB: parseEspnRoster(awayRoster),
      events,
      stats
    };
  } catch {
    return null;
  }
}

// API: Match Details (Real Live Events, Starting Lineups, Substitutes, Statistics & Head-to-Head)
app.get('/api/match-details/:id', async (req: Request, res: Response) => {
  const matchId = String(req.params.id || 'match_1');
  const teamAName = String(req.query.teamA || 'الفريق الأول');
  const teamBName = String(req.query.teamB || 'الفريق الثاني');
  const competition = String(req.query.competition || 'بطولة كرة القدم');
  const status = (String(req.query.status || 'FIXTURE') as 'LIVE' | 'FIXTURE' | 'RESULT');
  const scoreA = req.query.scoreA !== undefined && req.query.scoreA !== '' ? Number(req.query.scoreA) : null;
  const scoreB = req.query.scoreB !== undefined && req.query.scoreB !== '' ? Number(req.query.scoreB) : null;

  const cacheKey = `real_match_details_${matchId}_${teamAName}_${teamBName}`;
  const cached = getCached<any>(cacheKey, 25 * 1000);
  if (cached) {
    return res.json({ success: true, details: cached });
  }

  const baseDetails = buildMatchDetailsForMatch({
    id: matchId,
    competition,
    teamA: { name: teamAName },
    teamB: { name: teamBName },
    scoreA: scoreA !== null && !isNaN(scoreA) ? scoreA : null,
    scoreB: scoreB !== null && !isNaN(scoreB) ? scoreB : null,
    status,
    time: '21:00',
    channels: [],
    isBeinArabic: true,
    broadcasterLabel: '',
    network: 'bein_ar'
  });

  // 1. Check if we have a real Yallakora match ID
  let ykId: string | null = null;
  let ykPath: string | undefined;
  const ykDirectMatch = matchId.match(/^yk_(\d+)$/);
  if (ykDirectMatch && parseInt(ykDirectMatch[1], 10) > 1000) {
    ykId = ykDirectMatch[1];
    ykPath = yallakoraMatchMetaMap.get(ykId)?.ykPath;
  } else {
    for (const meta of yallakoraMatchMetaMap.values()) {
      if (
        (meta.teamA.includes(teamAName) || teamAName.includes(meta.teamA)) &&
        (meta.teamB.includes(teamBName) || teamBName.includes(meta.teamB))
      ) {
        ykId = meta.ykId;
        ykPath = meta.ykPath;
        break;
      }
    }
  }

  // 2. Check if we have a real ESPN event ID
  let espnId: string | null = null;
  if (matchId.startsWith('espn_')) {
    espnId = matchId.replace('espn_', '');
  } else {
    espnId = espnEventLookupMap.get(`${teamAName}|${teamBName}`) || null;
  }

  const [ykData, espnData] = await Promise.all([
    ykId ? fetchYallakoraRealMatchDetails(ykId, ykPath) : Promise.resolve(null),
    espnId ? fetchEspnRealMatchDetails(espnId) : Promise.resolve(null)
  ]);

  if (ykData) {
    if (ykData.lineupA.startingXI.length > 0) baseDetails.lineupA = ykData.lineupA;
    if (ykData.lineupB.startingXI.length > 0) baseDetails.lineupB = ykData.lineupB;
    if (ykData.events.length > 0) baseDetails.events = ykData.events;
    if (ykData.stats.length > 0) baseDetails.stats = ykData.stats;
    if (ykData.h2h.length > 0) baseDetails.h2h = ykData.h2h;
  }

  if (espnData) {
    if (espnData.stadium) baseDetails.stadium = espnData.stadium;
    if (baseDetails.lineupA.startingXI.length === 0 && espnData.lineupA.startingXI.length > 0) {
      baseDetails.lineupA = espnData.lineupA;
    }
    if (baseDetails.lineupB.startingXI.length === 0 && espnData.lineupB.startingXI.length > 0) {
      baseDetails.lineupB = espnData.lineupB;
    }
    if (baseDetails.events.length === 0 && espnData.events.length > 0) {
      baseDetails.events = espnData.events;
    }
    if (espnData.stats.length > 0) {
      baseDetails.stats = espnData.stats;
    }
  }

  setCache(cacheKey, baseDetails);
  return res.json({
    success: true,
    details: baseDetails
  });
});

// API: Real-Time EPG & Broadcast Guide ("يبث الآن") strictly built from real live matches & catalog events
app.get('/api/epg/live', async (req: Request, res: Response) => {
  try {
    const cachedEpg = getCached<Record<number, any>>('live_epg_cache_v2', 20 * 1000);
    if (cachedEpg) {
      return res.json({ success: true, epg: cachedEpg });
    }

    const matchesRes =
      getCached<any[]>('live_matches_realtime_v5_today', 120 * 1000) ||
      getCached<any[]>('live_matches_realtime_v2', 60 * 1000) ||
      [];
    const soccerCatalog = await fetchDliveSoccerCatalog();
    const epgMap: Record<number, any> = {};

    // 1. Map all channels from active/upcoming matches in live-matches
    for (const match of matchesRes) {
      if (match.channels && Array.isArray(match.channels)) {
        for (const ch of match.channels) {
          const chId = Number(ch.channel_id);
          if (!chId) continue;
          const isLive = match.status === 'LIVE';
          // Prefer LIVE match over FIXTURE if channel has multiple matches today
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

    // 2. Also map any remaining channels from DaddyLive soccer catalog
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

    setCache('live_epg_cache_v2', epgMap);
    res.json({ success: true, epg: epgMap });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, epg: {} });
  }
});

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
  if (CHANNEL_SLUG_MAP[strId]) {
    return CHANNEL_SLUG_MAP[strId];
  }

  const cachedSlug = getCached<string>(`slug_${strId}`, 24 * 60 * 60 * 1000);
  if (cachedSlug) return cachedSlug;

  try {
    const res = await fetch(`https://dlive.sx/player/stream-${strId}.php`, {
      headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
      signal: AbortSignal.timeout(2500)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/stream=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const slug = match[1];
      setCache(`slug_${strId}`, slug);
      return slug;
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

async function getDembedConfig(channelId: string | number): Promise<DembedConfig | null> {
  const strId = String(channelId);
  const cached = getCached<DembedConfig>(`dembed_cfg_${strId}`, 10 * 60 * 1000);
  if (cached) return cached;

  try {
    const dembedRes = await fetch(`https://dembed.st/premiumtv/daddy.php?id=${strId}`, {
      headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
      signal: AbortSignal.timeout(3000)
    });
    if (dembedRes.ok) {
      const html = await dembedRes.text();
      const srcMatch = html.match(/const\s+SRC\s*=\s*["']([^"']+)["']/);
      const edgeMatch = html.match(/const\s+EDGE\s*=\s*["']([^"']+)["']/);
      const chMatch = html.match(/const\s+CHANNEL\s*=\s*["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        const cfg: DembedConfig = {
          src: srcMatch[1],
          edge: edgeMatch?.[1] || 'https://edge.wedd48c.top',
          channel: chMatch?.[1] || `premium${strId}`
        };
        setCache(`dembed_cfg_${strId}`, cfg);
        return cfg;
      }
    }
  } catch {
    // Upstream stream currently offline
  }

  return null;
}

async function getDembedAuthedM3u8Url(channelId: string | number, forceRefresh = false): Promise<string | null> {
  const cfg = await getDembedConfig(channelId);
  if (!cfg) return null;
  const tokenKey = `dembed_tok_${cfg.channel}`;
  // Cache token for 22s (well below upstream expiry) so playlists never hit 403 mid-stream
  let token = forceRefresh ? null : getCached<string>(tokenKey, 22 * 1000);

  if (!token) {
    try {
      const tokRes = await fetch(`${cfg.edge}/api/playlist-token?slug=${encodeURIComponent(cfg.channel)}`, {
        headers: {
          'User-Agent': UA,
          'Origin': 'https://dembed.st',
          'Referer': 'https://dembed.st/'
        },
        signal: AbortSignal.timeout(3000)
      });
      if (tokRes.ok) {
        const tokData = (await tokRes.json()) as { token?: string; ttl?: number };
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

// Fast Server-Side Dembed PNG/WebP/TSGZ Unwrapper -> Pure MPEG-TS (0x47)
const TRAW = Buffer.from([84, 73, 75, 84, 73, 75, 82, 65, 87]);
const TSGZ = Buffer.from([84, 73, 75, 84, 73, 75, 84, 83, 71, 90]);
const TPIX = Buffer.from([84, 73, 75, 84, 73, 75, 80, 88]);

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unwrapDembedSegment(bytes: Buffer): Buffer {
  // 1. Already raw MPEG-TS
  if (bytes.length >= 188 && bytes[0] === 0x47 && bytes[188] === 0x47) {
    return bytes;
  }

  // 2. WebP EXIF TS (matches daddy.php order)
  if (bytes.length >= 16 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    let off = 12;
    while (off + 8 <= bytes.length) {
      const tag = bytes.subarray(off, off + 4).toString('ascii');
      const n = bytes.readUInt32LE(off + 4);
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

  // 3. PNG IEND TS or PNG RGB Pixels (TIKTIKPX) (matches daddy.php order)
  if (bytes.length >= 16 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    let off = 8;
    let w = 0;
    let h = 0;
    let depth = 0;
    let ctype = 0;
    let interlace = 0;
    const idats: Buffer[] = [];

    while (off + 8 <= bytes.length) {
      const len = bytes.readUInt32BE(off);
      if (len > bytes.length - off - 12) break;
      const type = bytes.subarray(off + 4, off + 8).toString('ascii');
      const data = bytes.subarray(off + 8, off + 8 + len);
      if (type === 'IHDR') {
        w = data.readUInt32BE(0);
        h = data.readUInt32BE(4);
        depth = data[8];
        ctype = data[9];
        interlace = data[12];
      } else if (type === 'IDAT') {
        idats.push(data);
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
        const raw = zlib.inflateSync(Buffer.concat(idats));
        const bpp = ctype === 6 ? 4 : 3;
        const stride = w * bpp;
        const rgb = Buffer.allocUnsafe(w * h * 3);
        let src = 0;
        let dst = 0;
        let prev = new Uint8Array(stride);

        for (let y = 0; y < h; y++) {
          if (src + 1 + stride > raw.length) break;
          const filter = raw[src++];
          const row = raw.subarray(src, src + stride);
          src += stride;

          if (filter === 0) {
            if (ctype === 2) {
              row.copy(rgb, dst);
              dst += stride;
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

        if (rgb.length >= 12 && rgb.subarray(0, 8).equals(TPIX)) {
          const n = rgb.readUInt32BE(8);
          if (n > 0 && 12 + n <= rgb.length) {
            const gz = rgb.subarray(12, 12 + n);
            return zlib.gunzipSync(gz);
          }
        }
      } catch {
        // Fallback below
      }
    }
  }

  // 4. TRAW / TSGZ markers
  const trawIdx = bytes.indexOf(TRAW);
  if (trawIdx !== -1) {
    return bytes.subarray(trawIdx + TRAW.length);
  }
  const tsgzIdx = bytes.indexOf(TSGZ);
  if (tsgzIdx !== -1) {
    try {
      return zlib.gunzipSync(bytes.subarray(tsgzIdx + TSGZ.length));
    } catch {
      // Continue if gunzip fails
    }
  }

  // 5. Full scan for raw 0x47 sync byte alignment
  for (let i = 0; i < bytes.length - 376; i++) {
    if (bytes[i] === 0x47 && bytes[i + 188] === 0x47 && bytes[i + 376] === 0x47) {
      return bytes.subarray(i);
    }
  }
  return bytes;
}

// Resolve channel display name dynamically from catalog or dlive watch page
async function resolveDynamicChannelInfo(id: string | number): Promise<{ name: string; lang: string; category: string }> {
  const numId = Number(id);
  const allChannels = getCached<any[]>('all_channels_v2', 60 * 60 * 1000);
  if (allChannels) {
    const found = allChannels.find(c => Number(c.id) === numId);
    if (found) {
      return { name: found.arabicName || found.name, lang: found.lang || 'International', category: found.category || 'other' };
    }
  }

  const catalog = await fetchDliveSoccerCatalog();
  const catCh = catalog.discoveredChannels.find(c => Number(c.id) === numId);
  if (catCh) {
    return { name: catCh.name, lang: catCh.lang, category: catCh.category };
  }

  try {
    const r = await fetch(`https://dlive.sx/watch.php?id=${numId}`, {
      headers: { 'User-Agent': UA, 'Referer': 'https://dlive.sx/' },
      signal: AbortSignal.timeout(2500)
    });
    if (r.ok) {
      const html = await r.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const rawTitle = titleMatch[1].split('|')[0].trim();
        if (rawTitle && !/^\d+$/.test(rawTitle)) {
          const { category, lang } = categorizeChannel(rawTitle);
          return { name: rawTitle, lang, category };
        }
      }
    }
  } catch {
    // Fallback
  }

  return { name: `Live Sports Channel #${numId}`, lang: 'International', category: 'other' };
}

// API: Issue signed stream session token
app.get('/api/stream-auth/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Origin check
  if ((origin && !isOriginAllowed(origin, req.headers.host)) || (referer && !isOriginAllowed(referer, req.headers.host))) {
    return res.status(403).json({ success: false, error: 'Access denied: unauthorized origin' });
  }

  // Token valid for 2 hours (7200 seconds)
  const exp = Math.floor(Date.now() / 1000) + 7200;
  const token = signStreamToken(id, exp);

  setStreamCorsHeaders(req, res);
  return res.json({
    success: true,
    channelId: id,
    token,
    exp,
    streamUrl: `/api/proxy-stream/${id}/live.m3u8?token=${token}&exp=${exp}`
  });
});

// API: Stream resolver info & dynamic channel metadata
app.get('/api/resolve-m3u8/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const [slug, channelMeta] = await Promise.all([
      getChannelStreamSlug(id),
      resolveDynamicChannelInfo(id)
    ]);

    const exp = Math.floor(Date.now() / 1000) + 7200;
    const token = signStreamToken(id, exp);
    const proxyStreamUrl = `/api/proxy-stream/${id}/live.m3u8?token=${token}&exp=${exp}`;
    const cleanEmbedUrl = `/api/clean-embed/player/${id}?token=${token}&exp=${exp}`;

    const servers = [
      {
        id: 'srv-1',
        name: 'سيرفر 1 (المشغل المحمي FHD 1080p)',
        folder: 'player',
        quality: '1080p FHD 60fps',
        url: cleanEmbedUrl,
        embedUrl: cleanEmbedUrl,
        type: 'clean-embed',
        isDefault: true
      },
      {
        id: 'srv-2',
        name: 'سيرفر 2 (مشغل HTML5 المباشر + مانع التقطيع)',
        folder: 'native',
        quality: '1080p FHD',
        url: proxyStreamUrl,
        embedUrl: proxyStreamUrl,
        type: 'native',
        isDefault: false
      }
    ];

    setStreamCorsHeaders(req, res);
    res.json({
      success: true,
      channelId: id,
      channelName: channelMeta.name,
      lang: channelMeta.lang,
      category: channelMeta.category,
      slug: slug || null,
      token,
      exp,
      streamUrl: proxyStreamUrl,
      servers
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 100% Self-Hosted, Zero-Ad Clean HTML5 + Hls.js Video Player
// NEVER serves third-party HTML or scripts from dembed.st, dlive.sx, or wideiptv.top!
app.get('/api/clean-embed/:folder/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const safeId = String(id).replace(/[^0-9a-zA-Z_-]/g, '');
  const embedExp = Math.floor(Date.now() / 1000) + 7200;
  const embedToken = signStreamToken(safeId, embedExp);

  // Strict Content-Security-Policy makes it impossible for any external ad script, popup, or frame to load
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; media-src * blob: data:; connect-src *; img-src 'self' data: blob:; worker-src blob:; frame-ancestors 'self' https://*.workers.dev https://*.pages.dev http://localhost:* https://*.run.app https://*.vercel.app; object-src 'none'; base-uri 'none'; form-action 'none';"
  );
  res.removeHeader('X-Frame-Options');

  const cleanPlayerHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>kolstream Clean Player</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: #000000;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      user-select: none;
    }
    .player-wrap {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }
    #unmuteBanner {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 25;
      background: rgba(16, 185, 129, 0.95);
      color: #052e16;
      border: 2px solid #6ee7b7;
      padding: 10px 20px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      display: none;
      align-items: center;
      gap: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75);
      transition: transform 0.15s ease, background 0.15s ease;
    }
    #unmuteBanner:hover {
      background: #34d399;
      transform: translateX(-50%) scale(1.04);
    }
    #unmuteBanner.visible {
      display: inline-flex;
    }
    #statusOverlay {
      position: absolute;
      inset: 0;
      background: rgba(8, 9, 11, 0.88);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #e7e5e4;
      z-index: 10;
      padding: 20px;
      text-align: center;
      transition: opacity 0.25s ease;
    }
    #statusOverlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .spinner {
      width: 34px;
      height: 34px;
      border: 3px solid rgba(16, 185, 129, 0.25);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .status-title {
      font-size: 13px;
      font-weight: 700;
      color: #f5f5f4;
    }
    .status-sub {
      font-size: 11px;
      color: #a8a29e;
      max-width: 360px;
      line-height: 1.6;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="player-wrap">
    <video id="video" controls autoplay playsinline></video>
    <button id="unmuteBanner" type="button">
      <span>🔊</span>
      <span>اضغط هنا لتشغيل صوت البث (Unmute)</span>
    </button>
    <div id="statusOverlay">
      <div class="spinner" id="spinner"></div>
      <div class="status-title" id="statusTitle">جاري الاتصال بالسيرفر المحمي...</div>
      <div class="status-sub" id="statusSub">بث مباشر نظيف 100% بدون أي إعلانات أو نوافذ منبثقة</div>
    </div>
  </div>
  <script>
    (function() {
      var video = document.getElementById('video');
      var unmuteBanner = document.getElementById('unmuteBanner');
      var overlay = document.getElementById('statusOverlay');
      var statusTitle = document.getElementById('statusTitle');
      var statusSub = document.getElementById('statusSub');
      var hls = null;
      var currentSourceMode = 'auto';
      var retryTimer = null;
      var audioCtx = null;
      var gainNode = null;

      video.volume = 1.0;

      function syncMuteState() {
        var isMutedNow = video.muted || video.volume === 0;
        if (isMutedNow) {
          unmuteBanner.classList.add('visible');
        } else {
          unmuteBanner.classList.remove('visible');
        }
        window.parent.postMessage({
          type: 'KOLSTREAM_MUTE_STATE',
          muted: isMutedNow,
          volume: video.volume
        }, '*');
      }

      function forceUnmute() {
        video.muted = false;
        if (video.volume === 0) video.volume = 1.0;
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(function() {});
        }
        video.play().catch(function() {});
        syncMuteState();
      }

      unmuteBanner.addEventListener('click', function(e) {
        e.stopPropagation();
        forceUnmute();
      });

      document.body.addEventListener('click', function() {
        if (video.muted || video.volume === 0) {
          forceUnmute();
        }
      }, true);

      video.addEventListener('volumechange', syncMuteState);

      function hideOverlay() {
        overlay.classList.add('hidden');
        syncMuteState();
      }

      function showOverlay(title, sub) {
        statusTitle.textContent = title;
        if (sub) statusSub.textContent = sub;
        overlay.classList.remove('hidden');
      }

      function setupAudioBoost(boosted) {
        try {
          if (video.muted) {
            video.muted = false;
            if (video.volume === 0) video.volume = 1.0;
          }
          if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            audioCtx = new Ctx();
            var source = audioCtx.createMediaElementSource(video);
            gainNode = audioCtx.createGain();
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
          }
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          if (gainNode) {
            gainNode.gain.value = boosted ? 1.8 : 1.0;
          }
          syncMuteState();
        } catch (e) {}
      }

      function reportLevels() {
        if (!hls) return;
        var lvls = (hls.levels || []).map(function(l) {
          return { height: l.height || 1080, bitrate: l.bitrate || 0 };
        });
        window.parent.postMessage({
          type: 'KOLSTREAM_STREAM_INFO',
          levelsCount: lvls.length,
          levels: lvls,
          isSingleSourceBitrate: lvls.length <= 1
        }, '*');
      }

      function attemptPlayWithSound() {
        video.muted = false;
        video.volume = 1.0;
        video.play().then(function() {
          syncMuteState();
        }).catch(function() {
          // Browser blocked unmuted autoplay; start muted and show big Unmute button
          video.muted = true;
          syncMuteState();
          video.play().catch(function() {});
        });
      }

      function startStream(mode) {
        currentSourceMode = mode || 'auto';
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        if (hls) {
          try { hls.destroy(); } catch (e) {}
          hls = null;
        }

        var streamUrl = '/api/proxy-stream/${safeId}/live.m3u8?source=' + currentSourceMode + '&token=${embedToken}&exp=${embedExp}&_t=' + Date.now();

        if (window.Hls && Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            manifestLoadingTimeOut: 15000,
            manifestLoadingMaxRetry: 4,
            levelLoadingTimeOut: 15000,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            enableSoftwareAES: true
          });

          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, function() {
            hideOverlay();
            reportLevels();
            attemptPlayWithSound();
          });

          hls.on(Hls.Events.LEVEL_LOADED, function() {
            hideOverlay();
            reportLevels();
          });

          hls.on(Hls.Events.ERROR, function(event, data) {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else if (currentSourceMode === 'auto') {
                showOverlay('جاري التبديل إلى السيرفر الاحتياطي للمباراة...', 'يتم جلب إشارة البث المباشر');
                retryTimer = setTimeout(function() { startStream('dembed'); }, 1200);
              } else {
                showOverlay('القناة مخصصة لنقل الحدث المباشر — جاري فحص الإشارة...', 'تعمل قنوات الأحداث تلقائياً فور انطلاق البث المباشر للمباراة');
                retryTimer = setTimeout(function() { startStream('auto'); }, 6000);
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          video.addEventListener('loadedmetadata', function() {
            hideOverlay();
            attemptPlayWithSound();
          });
        }
      }

      video.addEventListener('playing', hideOverlay);

      // Listen for parent controls
      window.addEventListener('message', function(ev) {
        if (!ev.data) return;
        if (ev.data.type === 'SET_BUFFER_MODE' && hls) {
          if (ev.data.mode === 'anti-lag') {
            hls.config.maxBufferLength = 50;
            hls.config.maxMaxBufferLength = 90;
            hls.config.liveSyncDurationCount = 7;
            hls.startLoad();
          } else {
            hls.config.maxBufferLength = 15;
            hls.config.maxMaxBufferLength = 30;
            hls.config.liveSyncDurationCount = 3;
          }
        } else if (ev.data.type === 'SET_QUALITY_LEVEL' && hls) {
          var targetH = ev.data.targetHeight;
          if (!targetH || ev.data.quality === 'auto') {
            hls.currentLevel = -1;
            hls.loadLevel = -1;
          } else if (hls.levels && hls.levels.length > 1) {
            var bestIdx = 0;
            var minDiff = 99999;
            hls.levels.forEach(function(lvl, idx) {
              var diff = Math.abs((lvl.height || 720) - targetH);
              if (diff < minDiff) {
                minDiff = diff;
                bestIdx = idx;
              }
            });
            hls.currentLevel = bestIdx;
            hls.loadLevel = bestIdx;
          }
        } else if (ev.data.type === 'RELOAD_STREAM') {
          startStream('auto');
        } else if (ev.data.type === 'TOGGLE_MUTE') {
          if (video.muted || video.volume === 0) {
            forceUnmute();
          } else {
            video.muted = true;
            syncMuteState();
          }
        } else if (ev.data.type === 'SET_MUTE') {
          if (ev.data.muted) {
            video.muted = true;
            syncMuteState();
          } else {
            forceUnmute();
          }
        } else if (ev.data.type === 'SET_VOLUME') {
          var vol = Number(ev.data.volume);
          if (!isNaN(vol)) {
            video.volume = Math.max(0, Math.min(1, vol));
            video.muted = video.volume === 0;
            syncMuteState();
          }
        } else if (ev.data.type === 'SET_AUDIO_BOOST') {
          setupAudioBoost(!!ev.data.boosted);
        }
      });

      startStream('auto');
    })();
  </script>
</body>
</html>`;

  return res.send(cleanPlayerHtml);
});

function decodeCastEconfig(str: string): { stream_url?: string; stream_url_nop2p?: string } | null {
  try {
    if (!str) return null;
    const order = [2, 0, 3, 1];
    const s1 = Buffer.from(str, 'base64').toString('binary');
    const chunkLen = Math.ceil(s1.length / 4);
    const parts: string[] = [];
    let offset = 0;
    for (let i = 0; i < 4; i++) {
      parts.push(s1.substr(offset, chunkLen));
      offset += chunkLen;
    }
    const reordered: string[] = [];
    for (let i = 0; i < order.length; i++) {
      let p = String(parts[i]);
      p = p.slice(0, 3) + p.slice(4);
      reordered[order[i]] = Buffer.from(p, 'base64').toString('binary');
    }
    const joined = reordered.join('');
    const jsonStr = Buffer.from(joined, 'base64').toString('utf8');
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
      headers: {
        'User-Agent': UA,
        'Referer': `https://dlive.sx/watch.php?id=${strId}`
      },
      signal: AbortSignal.timeout(6000)
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
      signal: AbortSignal.timeout(7000)
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
  token?: string,
  exp?: number | string
): Promise<string | null> {
  const attemptFetch = async (forceNewToken: boolean): Promise<string | null> => {
    try {
      const dembedM3u8Url = await getDembedAuthedM3u8Url(id, forceNewToken);
      if (!dembedM3u8Url) return null;
      const dembedRes = await fetch(dembedM3u8Url, {
        headers: {
          'User-Agent': UA,
          'Origin': 'https://dembed.st',
          'Referer': 'https://dembed.st/'
        },
        signal: AbortSignal.timeout(4500)
      });
      if (!dembedRes.ok) return null;
      const playlistText = await dembedRes.text();
      if (!playlistText.includes('#EXTM3U')) return null;

      const baseUrl = dembedM3u8Url.substring(0, dembedM3u8Url.lastIndexOf('/') + 1);
      const rawLines = playlistText.split('\n');
      const outLines: string[] = [];
      let lastExtInfDuration = 5.0;
      const authSuffix =
        token && exp
          ? `&id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&exp=${encodeURIComponent(exp)}`
          : '';

      for (const line of rawLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('#')) {
          const extMatch = trimmed.match(/^#EXTINF:([0-9.]+)/);
          if (extMatch) {
            lastExtInfDuration = parseFloat(extMatch[1]) || 5.0;
          }
          outLines.push(trimmed);
          continue;
        }
        let abs = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          abs = new URL(trimmed, baseUrl).href;
        }
        outLines.push(`/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=dembed${authSuffix}`);
        // Dembed's upstream restreamer has a PTS discontinuity right after partial segments (<4.95s).
        // Injecting #EXT-X-DISCONTINUITY tells Hls.js to cleanly realign PTS without freezing video or jumping!
        if (lastExtInfDuration < 4.95) {
          outLines.push('#EXT-X-DISCONTINUITY');
          lastExtInfDuration = 5.0;
        }
      }
      return outLines.join('\n');
    } catch {
      return null;
    }
  };

  // First try with cached token; if expired/rejected, immediately refresh token once and retry
  // so we never drop Dembed and switch MEDIA-SEQUENCE mid-stream!
  const firstTry = await attemptFetch(false);
  if (firstTry) return firstTry;
  return attemptFetch(true);
}

async function fetchCastRewrittenPlaylist(
  id: string | number,
  token?: string,
  exp?: number | string
): Promise<string | null> {
  try {
    const castInfo = await getCastServerM3u8(id);
    if (!castInfo) return null;
    const castRes = await fetch(castInfo.m3u8Url, {
      headers: {
        'User-Agent': UA,
        'Origin': castInfo.origin,
        'Referer': `${castInfo.origin}/`
      },
      signal: AbortSignal.timeout(5000)
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
        let abs = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          abs = new URL(trimmed, baseUrl).href;
        }
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=cast&origin=${encodeURIComponent(castInfo.origin)}${authSuffix}`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

async function fetchWideRewrittenPlaylist(
  id: string | number,
  token?: string,
  exp?: number | string
): Promise<string | null> {
  try {
    const slug = await getChannelStreamSlug(id);
    if (!slug) return null;
    const directUrl = await getDirectM3u8Url(slug);
    if (!directUrl) return null;

    const m3u8Res = await fetch(directUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://wideiptv.top/' },
      signal: AbortSignal.timeout(4000)
    });
    if (!m3u8Res.ok) return null;
    const playlistText = await m3u8Res.text();
    if (!playlistText.includes('#EXTM3U')) return null;

    const bwMatch = playlistText.match(/BANDWIDTH=(\d+)/);
    if (bwMatch && parseInt(bwMatch[1], 10) < 300000) {
      return null;
    }
    if (playlistText.includes('tracks-v1/mono.m3u8')) {
      return null;
    }

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
        let abs = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          abs = new URL(trimmed, baseUrl).href;
        }
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=wide${authSuffix}`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

// Keep track of sticky provider per channel+source so MEDIA-SEQUENCE never flips mid-playback
const stickyProviderMap = new Map<string, { provider: 'dembed' | 'cast' | 'wide'; ts: number }>();
// Track recent chunk/segment failures per provider and channel to auto-failover seamlessly
const providerFailureMap = new Map<string, { count: number; lastFailed: number }>();

function recordProviderFailure(channelId: string | number, provider: 'dembed' | 'cast' | 'wide') {
  const key = `${channelId}_${provider}`;
  const curr = providerFailureMap.get(key) || { count: 0, lastFailed: 0 };
  providerFailureMap.set(key, { count: curr.count + 1, lastFailed: Date.now() });
}

function isProviderRecentlyFailed(channelId: string | number, provider: 'dembed' | 'cast' | 'wide'): boolean {
  const key = `${channelId}_${provider}`;
  const rec = providerFailureMap.get(key);
  if (!rec) return false;
  // If provider failed more than twice in the last 3 minutes, consider it degraded
  return rec.count >= 2 && Date.now() - rec.lastFailed < 180000;
}

// API: Proxy Master/Media M3U8 playlist supporting 3 distinct upstream CDNs
app.get('/api/proxy-stream/:id/live.m3u8', async (req: Request, res: Response) => {
  const id = req.params.id;
  const preferredSource = (req.query.source as string) || 'cast';
  const token = req.query.token as string | undefined;
  const exp = req.query.exp as string | undefined;

  // 1. Anti-Hotlinking Origin & Referer Verification
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  if ((origin && !isOriginAllowed(origin, req.headers.host)) || (referer && !isOriginAllowed(referer, req.headers.host))) {
    return res.status(403).send('#EXTM3U\n#EXT-X-ERROR: 403 Forbidden - Hotlinking not allowed\n');
  }

  // 2. Cryptographic Token Verification
  if (!verifyStreamToken(id, exp, token)) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(403).send('#EXTM3U\n#EXT-X-ERROR: 403 Forbidden - Stream signature missing or expired. Unauthorized fetch blocked.\n');
  }

  setStreamCorsHeaders(req, res);
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  try {
    const stickyKey = `${id}_${preferredSource}`;
    const sticky = stickyProviderMap.get(stickyKey);

    // Cast is the most stable CDN upstream. Prioritize cast -> wide -> dembed
    let baseOrder: Array<'dembed' | 'cast' | 'wide'> =
      preferredSource === 'dembed'
        ? ['dembed', 'cast', 'wide']
        : preferredSource === 'wide'
          ? ['wide', 'cast', 'dembed']
          : ['cast', 'wide', 'dembed'];

    // Deprioritize any provider that has recent 502/404 chunk failures for this channel
    baseOrder.sort((a, b) => {
      const aBad = isProviderRecentlyFailed(id, a) ? 1 : 0;
      const bBad = isProviderRecentlyFailed(id, b) ? 1 : 0;
      return aBad - bBad;
    });

    // If a provider is already actively serving this channel within the last 2 minutes without recent failure, try it first!
    if (sticky && Date.now() - sticky.ts < 120000 && !isProviderRecentlyFailed(id, sticky.provider)) {
      baseOrder = [sticky.provider, ...baseOrder.filter(p => p !== sticky.provider)];
    }

    for (const provider of baseOrder) {
      let playlist: string | null = null;
      if (provider === 'cast') {
        playlist = await fetchCastRewrittenPlaylist(id, token, exp);
      } else if (provider === 'wide') {
        playlist = await fetchWideRewrittenPlaylist(id, token, exp);
      } else if (provider === 'dembed') {
        playlist = await fetchDembedRewrittenPlaylist(id, token, exp);
      }
      if (playlist) {
        stickyProviderMap.set(stickyKey, { provider, ts: Date.now() });
        res.setHeader('X-Active-Stream-Provider', provider);
        return res.send(playlist);
      }
    }

    return res.status(404).send('#EXTM3U\n#EXT-X-ERROR: Stream currently offline or waiting for event kickoff');
  } catch {
    return res.status(500).send('#EXTM3U\n#EXT-X-ERROR: Internal proxy error');
  }
});

// High-speed in-memory LRU cache & in-flight deduplication for TS video chunks
// Prevents duplicate upstream downloads and CPU stalls during live playback or Multi-Screen
const tsSegmentCache = new Map<string, { buffer: Buffer; ts: number }>();
const inflightSegmentFetches = new Map<string, Promise<{ kind: 'm3u8' | 'ts'; data: string | Buffer } | null>>();

function getCachedSegment(url: string): Buffer | null {
  const entry = tsSegmentCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.ts > 25000) {
    tsSegmentCache.delete(url);
    return null;
  }
  return entry.buffer;
}

function setCachedSegment(url: string, buffer: Buffer): void {
  if (tsSegmentCache.size >= 45) {
    const oldestKey = tsSegmentCache.keys().next().value;
    if (oldestKey) tsSegmentCache.delete(oldestKey);
  }
  tsSegmentCache.set(url, { buffer, ts: Date.now() });
}

// API: Proxy video TS chunks & child m3u8 playlists (Automatically unwraps Dembed PNG/WebP segments into pure MPEG-TS)
app.get('/api/proxy-chunk', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const mode = (req.query.mode as string) || 'dembed';
  const customOrigin = (req.query.origin as string) || 'https://tossequip.net';
  const chunkId = req.query.id as string | undefined;
  const token = req.query.token as string | undefined;
  const exp = req.query.exp as string | undefined;

  if (!url) return res.status(400).send('Missing url');

  // SSRF Protection: Disallow loopback, private ranges, and internal metadata
  if (isDisallowedTargetUrl(url)) {
    return res.status(400).send('400 Bad Request: Disallowed proxy destination');
  }

  // Verify chunk token: Require strict HMAC matching specific channel ID
  if (!chunkId || chunkId === '*' || !verifyStreamToken(chunkId, exp, token)) {
    return res.status(403).send('403 Forbidden: Invalid or expired chunk token');
  }

  setStreamCorsHeaders(req, res);

  // 1. Check in-memory decoded TS segment cache first (<1ms response!)
  if (!url.includes('.m3u8')) {
    const cachedTs = getCachedSegment(url);
    if (cachedTs) {
      res.setHeader('Content-Type', 'video/MP2T');
      res.setHeader('Cache-Control', 'public, max-age=30');
      return res.send(cachedTs);
    }
  }

  // 2. Deduplicate concurrent in-flight requests for the same URL
  let inflight = inflightSegmentFetches.get(url);
  if (!inflight) {
    inflight = (async () => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': UA,
          'Connection': 'keep-alive'
        };
        if (mode === 'dembed') {
          headers['Origin'] = 'https://dembed.st';
          headers['Referer'] = 'https://dembed.st/';
        } else if (mode === 'cast') {
          headers['Origin'] = customOrigin;
          headers['Referer'] = `${customOrigin}/`;
        } else {
          headers['Referer'] = 'https://wideiptv.top/';
        }

        // Fast fetch with automatic retry if upstream CDN hiccups
        let upstreamRes: globalThis.Response | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const r = await fetch(url, {
              headers,
              signal: AbortSignal.timeout(8000)
            });
            if (r.ok) {
              upstreamRes = r;
              break;
            }
          } catch {
            // retry once
          }
        }

        if (!upstreamRes || !upstreamRes.ok) return null;

        const contentType = upstreamRes.headers.get('content-type') || '';
        if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
          const text = await upstreamRes.text();
          if (text.includes('#EXTM3U')) {
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            const authSuffix =
              token && exp
                ? `&id=${encodeURIComponent(chunkId)}&token=${encodeURIComponent(token)}&exp=${encodeURIComponent(exp)}`
                : '';
            const rewritten = text
              .split('\n')
              .map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return line;
                let abs = trimmed;
                if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
                  abs = new URL(trimmed, baseUrl).href;
                }
                return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=${mode}&origin=${encodeURIComponent(customOrigin)}${authSuffix}`;
              })
              .join('\n');
            return { kind: 'm3u8' as const, data: rewritten };
          }
        }

        const rawBuffer = Buffer.from(await upstreamRes.arrayBuffer());
        const tsBuffer =
          mode === 'dembed' || (rawBuffer.length > 0 && rawBuffer[0] !== 0x47)
            ? unwrapDembedSegment(rawBuffer)
            : rawBuffer;

        setCachedSegment(url, tsBuffer);
        return { kind: 'ts' as const, data: tsBuffer };
      } catch {
        return null;
      } finally {
        inflightSegmentFetches.delete(url);
      }
    })();
    inflightSegmentFetches.set(url, inflight);
  }

  const result = await inflight;
  if (!result) {
    if (chunkId && (mode === 'dembed' || mode === 'cast' || mode === 'wide')) {
      recordProviderFailure(chunkId, mode as 'dembed' | 'cast' | 'wide');
    }
    return res.status(502).send('Chunk fetch failed');
  }

  if (result.kind === 'm3u8') {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(result.data);
  }

  res.setHeader('Content-Type', 'video/MP2T');
  res.setHeader('Cache-Control', 'public, max-age=30');
  return res.send(result.data);
});

// SEO: robots.txt
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'https';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Allow: /
Allow: /schedule
Allow: /watchroom/
Allow: /privacy
Allow: /terms
Allow: /dmca

Sitemap: ${protocol}://${host}/sitemap.xml
`);
});

// SEO: dynamic sitemap.xml
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;

  const channels = CURATED_SPECIAL_CHANNELS;
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/schedule</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>`;

  for (const ch of channels) {
    xml += `
  <url>
    <loc>${baseUrl}/watchroom/${ch.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  xml += `
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/dmca</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

export default app;
