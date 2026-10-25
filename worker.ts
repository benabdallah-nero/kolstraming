// Cloudflare Worker Entry Point (Full-Stack Edge Backend + Static Assets SPA Fallback)
// Handles /api/channels, /api/live-matches, /api/epg/live, /api/resolve-m3u8/:id,
// /api/proxy-stream/:id/live.m3u8, /api/proxy-chunk, /robots.txt, /sitemap.xml

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

// Core 24/7 base channels (verified IDs from DaddyLive catalog)
const CURATED_SPECIAL_CHANNELS = [
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
  [/نابولي/i, /napoli/i],
  [/روما/i, /\broma\b/i],
  [/لاتسيو/i, /lazio/i],
  [/باريس سان جيرمان/i, /psg|paris saint/i],
  [/ليون/i, /lyon/i],
  [/مارسيليا/i, /marseille/i],
  [/موناكو/i, /monaco/i],
  [/ليل/i, /\blille\b/i],
  [/بنفيكا/i, /benfica/i],
  [/بورتو/i, /porto/i]
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
  [/netherlands\s*-\s*eredivisie/i, 'الدوري الهولندي']
];

function translateCompetition(comp: string): string {
  for (const [rx, ar] of COMPETITION_AR_MAP) {
    if (rx.test(comp)) return ar;
  }
  return comp;
}

async function getLiveMatchesList(): Promise<any[]> {
  const cachedMatches = getCached<any[]>('live_matches_realtime_v2', 20 * 1000);
  if (cachedMatches) return cachedMatches;

  const mapBroadcaster = (rawChannel: string | null) => {
    if (!rawChannel || rawChannel.trim().length === 0) {
      return { channels: [] as any[], isBeinArabic: false, broadcasterLabel: '', network: 'unbroadcast' as const };
    }
    const trimmed = rawChannel.trim();
    const lower = trimmed.toLowerCase();
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
    if (lower.includes('اكسترا') || lower.includes('إكسترا') || lower.includes('xtra')) {
      return {
        channels: [{ channel_id: 100, channel_name: 'beIN SPORTS XTRA 1', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'beIN SPORTS XTRA',
        network: 'bein_ar' as const
      };
    }
    if (lower.includes('news') || lower.includes('إخبار') || lower.includes('اخبار')) {
      return {
        channels: [{ channel_id: 578, channel_name: 'beIN Sports News HD', quality: '1080p FHD', isBeinArabic: true }],
        isBeinArabic: true,
        broadcasterLabel: 'beIN Sports News HD',
        network: 'bein_ar' as const
      };
    }
    return { channels: [], isBeinArabic: false, broadcasterLabel: trimmed, network: 'other' as const };
  };

  const [ykRes, dliveCatalog] = await Promise.allSettled([
    fetch('https://www.yallakora.com/matches-center', {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8' },
      signal: AbortSignal.timeout(4500)
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
      const tournament = tournMatch ? tournMatch[1].replace(/<[^>]+>/g, '').trim() : 'مباراة رسمية';
      const lowerTourn = tournament.toLowerCase();
      if (/طائرة|يد|سلة|قسم ثاني|القسم الثاني|درجة ثانية|هواة/.test(lowerTourn)) continue;

      const items = card.split(/<div class="allData">/);
      for (let j = 1; j < items.length; j++) {
        const item = items[j];
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
    setCache('live_matches_realtime_v2', liveList);
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

async function fetchDembedRewrittenPlaylist(id: string | number): Promise<string | null> {
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
    return playlistText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const abs = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
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
      headers: { 'User-Agent': UA, 'Origin': castInfo.origin, 'Referer': `${castInfo.origin}/` },
      signal: AbortSignal.timeout(6000)
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
        const abs = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
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

    const bwMatch = playlistText.match(/BANDWIDTH=(\d+)/);
    if (bwMatch && parseInt(bwMatch[1], 10) < 300000) return null;
    if (playlistText.includes('tracks-v1/mono.m3u8')) return null;

    const baseUrl = directUrl.substring(0, directUrl.lastIndexOf('/') + 1);
    return playlistText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const abs = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=wide`;
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
        const matches = await getLiveMatchesList();
        return jsonResponse({ success: true, count: matches.length, matches }, 200, 30);
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

      // /api/resolve-m3u8/:id
      const resolveMatch = pathname.match(/^\/api\/resolve-m3u8\/([^/]+)$/);
      if (resolveMatch) {
        const id = resolveMatch[1];
        const slug = await getChannelStreamSlug(id);
        const found = CURATED_SPECIAL_CHANNELS.find(c => String(c.id) === String(id));
        const proxyStreamUrl = `/api/proxy-stream/${id}/live.m3u8`;
        return jsonResponse({
          success: true,
          channelId: id,
          channelName: found ? (found.arabicName || found.name) : `Live Sports Channel #${id}`,
          lang: found?.lang || 'International',
          category: found?.category || 'other',
          slug: slug || `premium${id}`,
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
        const order: Array<'dembed' | 'cast' | 'wide'> =
          preferredSource === 'cast'
            ? ['cast', 'dembed', 'wide']
            : preferredSource === 'wide'
              ? ['wide', 'dembed', 'cast']
              : ['dembed', 'cast', 'wide'];

        for (const provider of order) {
          let playlist: string | null = null;
          if (provider === 'dembed') playlist = await fetchDembedRewrittenPlaylist(id);
          else if (provider === 'cast') playlist = await fetchCastRewrittenPlaylist(id);
          else if (provider === 'wide') playlist = await fetchWideRewrittenPlaylist(id);

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
        if (!chunkUrl) return new Response('Missing url', { status: 400, headers: CORS_HEADERS });

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
              const rewritten = text
                .split('\n')
                .map(line => {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed.startsWith('#')) return line;
                  const abs = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
                  return `/api/proxy-chunk?url=${encodeURIComponent(abs)}&mode=${mode}&origin=${encodeURIComponent(customOrigin)}`;
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
