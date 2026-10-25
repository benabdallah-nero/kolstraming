import express, { type Request, type Response } from 'express';
import zlib from 'zlib';

const app = express();

app.use(express.json());

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
  return /ssc|alkass|al kass|abu dhabi|ad sport|dubai|israel|5plus|sport\s*[1-5]\s*il|yes\s*sport|one\s*il/i.test(rawName);
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
async function fetchDliveSoccerCatalog(): Promise<DliveCatalogData> {
  const cached = getCached<DliveCatalogData>('dlive_soccer_catalog_v2', 3 * 60 * 1000);
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

        // Calculate status from UTC kickoff time
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

          // Register discovered channel if not already registered or if previous name was generic "Event Stream"
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

        // Sort channels: beIN Arabic first, then beIN Global/European named channels, then Event Streams
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
    // Graceful fallback if catalog fetch times out
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

// API: Live Matches & Schedules (Integrated with BOTH Yallakora & DaddyLive All Soccer Events Catalog)
app.get('/api/live-matches', async (req: Request, res: Response) => {
  const cachedMatches = getCached<any>('live_matches_realtime_v2', 20 * 1000);
  if (cachedMatches) {
    return res.json({ success: true, matches: cachedMatches });
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
    const [ykRes, dliveCatalog] = await Promise.allSettled([
      fetch('https://www.yallakora.com/matches-center', {
        headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8' },
        signal: AbortSignal.timeout(3500)
      }),
      fetchDliveSoccerCatalog()
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

        const items = card.split(/<div class="allData">/);
        for (let j = 1; j < items.length; j++) {
          const item = items[j];

          const teamAMatch = item.match(/class="teams teamA".*?<p>(.*?)<\/p>/s);
          const teamA = teamAMatch ? teamAMatch[1].trim() : null;

          const teamBMatch = item.match(/class="teams teamB".*?<p>(.*?)<\/p>/s);
          const teamB = teamBMatch ? teamBMatch[1].trim() : null;

          if (!teamA || !teamB) continue;

          if (/إسرائيل|الكيان|مكابي|هابويل|هبوعيل|تل أبيب|بئر سبع|بيتار|سخنين|maccabi|hapoel/i.test(`${teamA} ${teamB}`)) {
            continue;
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
            id: `yk_${matchIdx}`,
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

    liveList.sort((a, b) => {
      const order: Record<string, number> = { LIVE: 0, FIXTURE: 1, RESULT: 2 };
      const orderA = order[a.status] ?? 3;
      const orderB = order[b.status] ?? 3;
      if (orderA !== orderB) return orderA - orderB;
      const aHasBein = a.isBeinArabic ? 2 : a.channels.length > 0 ? 1 : 0;
      const bHasBein = b.isBeinArabic ? 2 : b.channels.length > 0 ? 1 : 0;
      return bHasBein - aHasBein;
    });

    setCache('live_matches_realtime_v2', liveList);
    return res.json({ success: true, matches: liveList });
  } catch (err: any) {
    return res.json({ success: true, matches: [] });
  }
});

// API: Real-Time EPG & Broadcast Guide ("يبث الآن") strictly built from real live matches & catalog events
app.get('/api/epg/live', async (req: Request, res: Response) => {
  try {
    const cachedEpg = getCached<Record<number, any>>('live_epg_cache_v2', 20 * 1000);
    if (cachedEpg) {
      return res.json({ success: true, epg: cachedEpg });
    }

    const matchesRes = getCached<any[]>('live_matches_realtime_v2', 60 * 1000) || [];
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
          edge: edgeMatch?.[1] || 'https://edge.cowedd4855ws.sbs',
          channel: chMatch?.[1] || `premium${strId}`
        };
        setCache(`dembed_cfg_${strId}`, cfg);
        return cfg;
      }
    }
  } catch {
    // Use default pattern
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
  if (bytes.length >= 188 && bytes[0] === 0x47 && bytes[188] === 0x47) {
    return bytes;
  }

  // 1. WebP EXIF TS
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

  // 2. PNG IEND TS or PNG RGB Pixels (TIKTIKPX)
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
          Buffer.from(recon.buffer).copy(rgb, dst);
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
    }
  }

  // 3. TRAW / TSGZ / raw 0x47 search
  const trawIdx = bytes.indexOf(TRAW);
  if (trawIdx !== -1) {
    return bytes.subarray(trawIdx + TRAW.length);
  }
  const tsgzIdx = bytes.indexOf(TSGZ);
  if (tsgzIdx !== -1) {
    return zlib.gunzipSync(bytes.subarray(tsgzIdx + TSGZ.length));
  }
  for (let i = 0; i + 188 < bytes.length; i++) {
    if (bytes[i] === 0x47 && bytes[i + 188] === 0x47) return bytes.subarray(i);
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

// API: Stream resolver info & dynamic channel metadata
app.get('/api/resolve-m3u8/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const [slug, channelMeta] = await Promise.all([
      getChannelStreamSlug(id),
      resolveDynamicChannelInfo(id)
    ]);

    const proxyStreamUrl = `/api/proxy-stream/${id}/live.m3u8`;
    const servers = [
      {
        id: 'srv-1',
        name: 'سيرفر 1 (المشغل المحمي FHD 1080p)',
        folder: 'player',
        quality: '1080p FHD 60fps',
        url: `/api/clean-embed/player/${id}`,
        embedUrl: `/api/clean-embed/player/${id}`,
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

    res.json({
      success: true,
      channelId: id,
      channelName: channelMeta.name,
      lang: channelMeta.lang,
      category: channelMeta.category,
      slug: slug || `premium${id}`,
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

  // Strict Content-Security-Policy makes it impossible for any external ad script, popup, or frame to load
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; media-src * blob: data:; connect-src *; img-src 'self' data: blob:; worker-src blob:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';"
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

        var streamUrl = '/api/proxy-stream/${safeId}/live.m3u8?source=' + currentSourceMode + '&_t=' + Date.now();

        if (window.Hls && Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            defaultAudioCodec: 'mp4a.40.2',
            maxAudioFramesDrift: 8,
            backBufferLength: 60,
            maxBufferLength: 45,
            maxMaxBufferLength: 90,
            maxBufferSize: 50 * 1000 * 1000,
            maxBufferHole: 1.5,
            liveSyncDurationCount: 5,
            liveMaxLatencyDurationCount: 12,
            manifestLoadingTimeOut: 15000,
            manifestLoadingMaxRetry: 4,
            levelLoadingTimeOut: 15000,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            enableSoftwareAES: true
          });
          if (hls.config) {
            hls.config.defaultAudioCodec = 'mp4a.40.2';
            hls.config.maxAudioFramesDrift = 8;
          }

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

      // Stall Recovery Watchdog
      var stallTimer = null;
      function handleStall() {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(function() {
          if (video.buffered && video.buffered.length > 0) {
            var end = video.buffered.end(video.buffered.length - 1);
            if (end > video.currentTime + 1.0) {
              video.currentTime = end - 0.4;
            }
          }
          video.play().catch(function() {});
          window.parent.postMessage({ type: 'KOLSTREAM_STALL_RECOVERED' }, '*');
        }, 3500);
      }
      video.addEventListener('waiting', handleStall);
      video.addEventListener('stalled', handleStall);
      video.addEventListener('playing', function() {
        if (stallTimer) clearTimeout(stallTimer);
      });

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

async function fetchDembedRewrittenPlaylist(id: string | number): Promise<string | null> {
  try {
    const dembedM3u8Url = await getDembedAuthedM3u8Url(id);
    if (!dembedM3u8Url) return null;
    const dembedRes = await fetch(dembedM3u8Url, {
      headers: {
        'User-Agent': UA,
        'Origin': 'https://dembed.st',
        'Referer': 'https://dembed.st/'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!dembedRes.ok) return null;
    const playlistText = await dembedRes.text();
    if (!playlistText.includes('#EXTM3U')) return null;

    const baseUrl = dembedM3u8Url.substring(0, dembedM3u8Url.lastIndexOf('/') + 1);
    return playlistText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        let abs = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          abs = new URL(trimmed, baseUrl).href;
        }
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=dembed`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

async function fetchCastRewrittenPlaylist(id: string | number): Promise<string | null> {
  try {
    const castInfo = await getCastServerM3u8(id);
    if (!castInfo) return null;
    const castRes = await fetch(castInfo.m3u8Url, {
      headers: {
        'User-Agent': UA,
        'Origin': castInfo.origin,
        'Referer': `${castInfo.origin}/`
      },
      signal: AbortSignal.timeout(7000)
    });
    if (!castRes.ok) return null;
    const playlistText = await castRes.text();
    if (!playlistText.includes('#EXTM3U')) return null;

    const baseUrl = castInfo.m3u8Url.substring(0, castInfo.m3u8Url.lastIndexOf('/') + 1);
    return playlistText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        let abs = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          abs = new URL(trimmed, baseUrl).href;
        }
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=cast&origin=${encodeURIComponent(castInfo.origin)}`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

async function fetchWideRewrittenPlaylist(id: string | number): Promise<string | null> {
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

    // Skip broken upstream streams (e.g. beINAR when bandwidth < 300kbps or missing audio track)
    const bwMatch = playlistText.match(/BANDWIDTH=(\d+)/);
    if (bwMatch && parseInt(bwMatch[1], 10) < 300000) {
      return null;
    }
    if (playlistText.includes('tracks-v1/mono.m3u8')) {
      return null;
    }

    const baseUrl = directUrl.substring(0, directUrl.lastIndexOf('/') + 1);
    return playlistText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        let abs = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          abs = new URL(trimmed, baseUrl).href;
        }
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=wide`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

// API: Proxy Master/Media M3U8 playlist supporting 3 distinct upstream CDNs:
// - source=dembed (Server 1 Primary: Dembed Edge 1080p H.264 + AAC)
// - source=cast   (Server 2 Alternate: Cast / Tossequip HLS CDN)
// - source=wide   (Server 3 Backup: WideIPTV / Bluetier CDN)
app.get('/api/proxy-stream/:id/live.m3u8', async (req: Request, res: Response) => {
  const id = req.params.id;
  const preferredSource = (req.query.source as string) || 'dembed';

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  try {
    const order: Array<'dembed' | 'cast' | 'wide'> =
      preferredSource === 'cast'
        ? ['cast', 'dembed', 'wide']
        : preferredSource === 'wide'
          ? ['wide', 'dembed', 'cast']
          : ['dembed', 'cast', 'wide'];

    for (const provider of order) {
      let playlist: string | null = null;
      if (provider === 'dembed') {
        playlist = await fetchDembedRewrittenPlaylist(id);
      } else if (provider === 'cast') {
        playlist = await fetchCastRewrittenPlaylist(id);
      } else if (provider === 'wide') {
        playlist = await fetchWideRewrittenPlaylist(id);
      }
      if (playlist) {
        res.setHeader('X-Active-Stream-Provider', provider);
        return res.send(playlist);
      }
    }

    return res.status(404).send('#EXTM3U\n#EXT-X-ERROR: Stream currently offline or waiting for event kickoff');
  } catch {
    return res.status(500).send('#EXTM3U\n#EXT-X-ERROR: Internal proxy error');
  }
});

// API: Proxy video TS chunks & child m3u8 playlists (Automatically unwraps Dembed PNG/WebP segments into pure MPEG-TS)
app.get('/api/proxy-chunk', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const mode = (req.query.mode as string) || 'dembed';
  const customOrigin = (req.query.origin as string) || 'https://tossequip.net';
  if (!url) return res.status(400).send('Missing url');

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

    const upstreamRes = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(12000)
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Chunk fetch failed');
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
      const text = await upstreamRes.text();
      if (text.includes('#EXTM3U')) {
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        const rewritten = text
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return line;
            let abs = trimmed;
            if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
              abs = new URL(trimmed, baseUrl).href;
            }
            return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=${mode}&origin=${encodeURIComponent(customOrigin)}`;
          })
          .join('\n');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.send(rewritten);
      }
    }

    const rawBuffer = Buffer.from(await upstreamRes.arrayBuffer());
    const tsBuffer = mode === 'dembed' || (rawBuffer.length > 0 && rawBuffer[0] !== 0x47)
      ? unwrapDembedSegment(rawBuffer)
      : rawBuffer;

    res.setHeader('Content-Type', 'video/MP2T');
    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.send(tsBuffer);
  } catch {
    return res.status(500).send('Chunk proxy error');
  }
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
