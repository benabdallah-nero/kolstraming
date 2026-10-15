import express, { type Request, type Response } from 'express';

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

// Curated channels data with special focus on AR, beIN, and Eurosport
const CURATED_SPECIAL_CHANNELS = [
  // beIN Sports Arabic
  { id: 91, name: 'beIN Sports 1 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein1.png', country: 'QA' },
  { id: 92, name: 'beIN Sports 2 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein2.png', country: 'QA' },
  { id: 93, name: 'beIN Sports 3 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein3.png', country: 'QA' },
  { id: 94, name: 'beIN Sports 4 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein4.png', country: 'QA' },
  { id: 95, name: 'beIN Sports 5 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein5.png', country: 'QA' },
  { id: 96, name: 'beIN Sports 6 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein6.png', country: 'QA' },
  { id: 97, name: 'beIN Sports 7 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein7.png', country: 'QA' },
  { id: 98, name: 'beIN Sports 8 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein8.png', country: 'QA' },
  { id: 99, name: 'beIN Sports 9 Arabic', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein9.png', country: 'QA' },
  { id: 61, name: 'beIN Sports MENA English 1', category: 'bein', subcat: 'bein_mena', quality: '1080p FHD', lang: 'English', logo: 'bein_en.png', country: 'QA' },
  { id: 90, name: 'beIN Sports MENA English 2', category: 'bein', subcat: 'bein_mena', quality: '1080p FHD', lang: 'English', logo: 'bein_en2.png', country: 'QA' },
  { id: 100, name: 'beIN SPORTS XTRA 1', category: 'bein', subcat: 'bein_xtra', quality: '1080p FHD', lang: 'English', logo: 'bein_xtra.png', country: 'USA' },
  { id: 578, name: 'BeIN Sports HD Qatar', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'Arabic', logo: 'bein_news.png', country: 'QA' },
  
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
  { id: 425, name: 'BeIN SPORTS USA', category: 'bein', subcat: 'bein_us', quality: '1080p FHD', lang: 'English', logo: 'bein_us.png', country: 'US' },
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

function categorizeChannel(name: string): { category: string; subcat: string; lang: string } {
  const lower = name.toLowerCase();
  if (lower.includes('bein')) {
    if (lower.includes('arabic') || lower.includes('ar') || /bein\s*sports?\s*\d+/i.test(lower)) return { category: 'ar', subcat: 'bein_ar', lang: 'Arabic' };
    if (lower.includes('france') || lower.includes('max')) return { category: 'bein', subcat: 'bein_fr', lang: 'French' };
    if (lower.includes('turkey')) return { category: 'bein', subcat: 'bein_tr', lang: 'Turkish' };
    if (lower.includes('australia')) return { category: 'bein', subcat: 'bein_au', lang: 'English' };
    if (lower.includes('usa') || lower.includes('xtra')) return { category: 'bein', subcat: 'bein_us', lang: 'English' };
    if (lower.includes('español')) return { category: 'bein', subcat: 'bein_es', lang: 'Spanish' };
    return { category: 'bein', subcat: 'bein_global', lang: 'Multilingual' };
  }
  if (lower.includes('euro') || lower.includes('arena') || lower.includes('astro') || lower.includes('sky sport') || lower.includes('tnt sport') || lower.includes('dazn') || lower.includes('espn') || lower.includes('canal+') || lower.includes('super sport') || lower.includes('premier sport')) {
    return { category: 'euro', subcat: 'euro_sports', lang: 'European' };
  }
  return { category: 'other', subcat: 'global', lang: 'International' };
}

// API: Channels list
app.get('/api/channels', async (req: Request, res: Response) => {
  try {
    const cached = getCached<any[]>('all_channels', 60 * 60 * 1000);
    if (cached) {
      return res.json({ success: true, count: cached.length, channels: cached });
    }

    let allChannels: any[] = [...CURATED_SPECIAL_CHANNELS];
    const knownIds = new Set(CURATED_SPECIAL_CHANNELS.map(c => c.id));

    try {
      const response = await fetch('https://dlive.sx/24-7-channels.php', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const html = await response.text();
        const regex = /href=["']\/watch\.php\?id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          const id = parseInt(match[1], 10);
          if (!knownIds.has(id)) {
            const rawName = match[2].replace(/<[^>]+>/g, '').replace(/ID:\s*\d+/, '').trim();
            // Strictly exclude non-beIN regional channels (SSC, Alkass, Abu Dhabi, Dubai)
            if (/ssc|alkass|al kass|abu dhabi|ad sport|dubai/i.test(rawName)) {
              continue;
            }
            const { category, subcat, lang } = categorizeChannel(rawName);
            allChannels.push({
              id,
              name: rawName,
              category,
              subcat,
              quality: '720p/1080p',
              lang,
              country: 'Global'
            });
            knownIds.add(id);
          }
        }
      }
    } catch {
      // Gracefully utilize curated channels list
    }

    setCache('all_channels', allChannels);
    res.json({ success: true, count: allChannels.length, channels: allChannels });
  } catch (error: any) {
    res.status(200).json({ success: true, count: CURATED_SPECIAL_CHANNELS.length, channels: CURATED_SPECIAL_CHANNELS });
  }
});

// API: Live Matches & Schedules
app.get('/api/live-matches', async (req: Request, res: Response) => {
  const cachedMatches = getCached<any>('live_matches_realtime_v1', 15 * 1000);
  if (cachedMatches) {
    return res.json({ success: true, matches: cachedMatches });
  }

  const mapBroadcaster = (rawChannel: string | null) => {
    if (!rawChannel || rawChannel.trim().length === 0) {
      return {
        channels: [],
        isBeinArabic: false,
        broadcasterLabel: 'غير منقولة فضائياً',
        network: 'unbroadcast' as const
      };
    }

    const trimmed = rawChannel.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check beIN Arabic 1-9 (e.g. "بى ان سبورت 8 HD", "beIN Sports 1", "بي إن سبورت 5")
    const beinNumMatch = trimmed.match(/(?:bein\s*sports?|ب[يى]\s*إن\s*سبورت|ب[يى]\s*ان\s*سبورت)\s*(\d+)/i) ||
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

    // 2. Check beIN News / الإخبارية
    if (lower.includes('news') || lower.includes('إخبار') || lower.includes('اخبار')) {
      return {
        channels: [{ channel_id: 578, channel_name: 'beIN Sports News HD', quality: '1080p FHD', isBeinArabic: true }],
        isBeinArabic: true,
        broadcasterLabel: 'beIN Sports News HD',
        network: 'bein_ar' as const
      };
    }

    // 3. Check beIN English 1/2
    if (lower.includes('english 1') || lower.includes('en 1')) {
      return {
        channels: [{ channel_id: 61, channel_name: 'beIN Sports English 1', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'beIN Sports English 1',
        network: 'bein_mena' as const
      };
    }
    if (lower.includes('english 2') || lower.includes('en 2')) {
      return {
        channels: [{ channel_id: 90, channel_name: 'beIN Sports English 2', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'beIN Sports English 2',
        network: 'bein_mena' as const
      };
    }

    // 4. Check beIN France 1/2/3
    if (lower.includes('france 1') || lower.includes('fr 1')) {
      return {
        channels: [{ channel_id: 116, channel_name: 'beIN SPORTS 1 France', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'beIN SPORTS 1 France',
        network: 'bein_fr' as const
      };
    }
    if (lower.includes('france 2') || lower.includes('fr 2')) {
      return {
        channels: [{ channel_id: 117, channel_name: 'beIN SPORTS 2 France', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'beIN SPORTS 2 France',
        network: 'bein_fr' as const
      };
    }
    if (lower.includes('france 3') || lower.includes('fr 3')) {
      return {
        channels: [{ channel_id: 118, channel_name: 'beIN SPORTS 3 France', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'beIN SPORTS 3 France',
        network: 'bein_fr' as const
      };
    }

    // 5. Check Eurosport 1/2
    if (lower.includes('eurosport 1')) {
      return {
        channels: [{ channel_id: 772, channel_name: 'Eurosport 1 France', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'Eurosport 1 France',
        network: 'eurosport' as const
      };
    }
    if (lower.includes('eurosport 2')) {
      return {
        channels: [{ channel_id: 773, channel_name: 'Eurosport 2 France', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'Eurosport 2 France',
        network: 'eurosport' as const
      };
    }

    // 6. Explicitly unbroadcast or digital only (e.g. TOD)
    if (lower.includes('غير') || lower.includes('tod')) {
      return {
        channels: [],
        isBeinArabic: false,
        broadcasterLabel: trimmed,
        network: 'unbroadcast' as const
      };
    }

    // Other broadcaster reported in schedule (e.g. ON Sport)
    return {
      channels: [],
      isBeinArabic: false,
      broadcasterLabel: trimmed,
      network: 'other' as const
    };
  };

  const commentators = [
    'عصام الشوالي',
    'حفيظ دراجي',
    'خليل البلوشي',
    'فارس عوض',
    'فهد العتيبي',
    'حسن العيدروس',
    'علي محمد علي',
    'رؤوف خليف',
    'أحمد الطيب',
    'جواد بدة'
  ];

  try {
    const ykRes = await fetch('https://www.yallakora.com/matches-center', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(3000)
    });

    if (ykRes.ok) {
      const html = await ykRes.text();
      const cards = html.split(/<div[^>]*class="[^"]*matchCard[^"]*"[^>]*>/);
      const liveList: any[] = [];
      let matchIdx = 0;

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

          const commentator = undefined;
          matchIdx++;

          liveList.push({
            id: `real_${matchIdx}_${teamA.slice(0, 3)}`,
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
            channels: mapped.channels,
            commentator,
            isBeinArabic: mapped.isBeinArabic,
            broadcasterLabel: mapped.broadcasterLabel,
            network: mapped.network
          });
        }
      }

      liveList.sort((a, b) => {
        const order: Record<string, number> = { LIVE: 0, FIXTURE: 1, RESULT: 2 };
        const orderA = order[a.status] ?? 3;
        const orderB = order[b.status] ?? 3;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (b.channels.length > 0 ? 1 : 0) - (a.channels.length > 0 ? 1 : 0);
      });

      setCache('live_matches_realtime_v1', liveList);
      return res.json({ success: true, matches: liveList });
    }
  } catch (err: any) {
    // Gracefully handle fallback
  }

  const fallbackMatches: any[] = [
    {
      id: 'fb_1',
      competition: 'دوري أبطال أوروبا',
      teamA: { name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/541.png' },
      teamB: { name: 'مانشستر سيتي', logo: 'https://media.api-sports.io/football/teams/50.png' },
      scoreA: 2,
      scoreB: 1,
      status: 'LIVE',
      statusText: 'الشوط الثاني',
      minute: "68'",
      time: '22:00 بتوقيت مكة',
      localTime: '22:00 بتوقيت مكة',
      channels: [{ channel_id: 91, channel_name: 'beIN Sports 1 HD' }],
      commentator: 'عصام الشوالي',
      isBeinArabic: true,
      broadcasterLabel: 'beIN Sports 1 HD',
      network: 'bein_ar'
    },
    {
      id: 'fb_2',
      competition: 'الدوري الإنجليزي الممتاز',
      teamA: { name: 'ليفربول', logo: 'https://media.api-sports.io/football/teams/40.png' },
      teamB: { name: 'آرسنال', logo: 'https://media.api-sports.io/football/teams/42.png' },
      scoreA: null,
      scoreB: null,
      status: 'FIXTURE',
      statusText: 'لم تبدأ بعد',
      minute: null,
      time: '19:30 بتوقيت مكة',
      localTime: '19:30 بتوقيت مكة',
      channels: [{ channel_id: 92, channel_name: 'beIN Sports 2 HD' }],
      commentator: 'حفيظ دراجي',
      isBeinArabic: true,
      broadcasterLabel: 'beIN Sports 2 HD',
      network: 'bein_ar'
    },
    {
      id: 'fb_3',
      competition: 'الدوري الإسباني (لا ليغا)',
      teamA: { name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/529.png' },
      teamB: { name: 'أتلتيكو مدريد', logo: 'https://media.api-sports.io/football/teams/530.png' },
      scoreA: null,
      scoreB: null,
      status: 'FIXTURE',
      statusText: 'لم تبدأ بعد',
      minute: null,
      time: '22:00 بتوقيت مكة',
      localTime: '22:00 بتوقيت مكة',
      channels: [{ channel_id: 93, channel_name: 'beIN Sports 3 HD' }],
      commentator: 'حسن العيدروس',
      isBeinArabic: true,
      broadcasterLabel: 'beIN Sports 3 HD',
      network: 'bein_ar'
    },
    {
      id: 'fb_4',
      competition: 'الدوري الألماني (البوندسليغا)',
      teamA: { name: 'باير ليفركوزن', logo: 'https://media.api-sports.io/football/teams/168.png' },
      teamB: { name: 'بايرن ميونخ', logo: 'https://media.api-sports.io/football/teams/157.png' },
      scoreA: 2,
      scoreB: 1,
      status: 'LIVE',
      statusText: 'الشوط الثاني',
      minute: "74'",
      time: '19:30 بتوقيت مكة',
      localTime: '19:30 بتوقيت مكة',
      channels: [
        { channel_id: 95, channel_name: 'beIN Sports 5 HD' },
        { channel_id: 117, channel_name: 'beIN SPORTS 2 France' }
      ],
      commentator: 'حسن العيدروس',
      isBeinArabic: true,
      broadcasterLabel: 'beIN Sports 5 HD',
      network: 'bein_ar'
    },
    {
      id: 'fb_5',
      competition: 'الدوري الفرنسي (ليغ 1)',
      teamA: { name: 'باريس سان جيرمان', logo: 'https://media.api-sports.io/football/teams/85.png' },
      teamB: { name: 'أولمبيك مارسيليا', logo: 'https://media.api-sports.io/football/teams/81.png' },
      scoreA: null,
      scoreB: null,
      status: 'FIXTURE',
      statusText: 'لم تبدأ بعد',
      minute: null,
      time: '21:45 بتوقيت مكة',
      localTime: '21:45 بتوقيت مكة',
      channels: [
        { channel_id: 94, channel_name: 'beIN Sports 4 HD' },
        { channel_id: 116, channel_name: 'beIN SPORTS 1 France' }
      ],
      commentator: 'جواد بدة',
      isBeinArabic: true,
      broadcasterLabel: 'beIN Sports 4 HD',
      network: 'bein_ar'
    },
    {
      id: 'fb_6',
      competition: 'دوري أبطال إفريقيا',
      teamA: { name: 'الأهلي المصري', logo: 'https://media.api-sports.io/football/teams/1026.png' },
      teamB: { name: 'الترجي التونسي', logo: 'https://media.api-sports.io/football/teams/1027.png' },
      scoreA: null,
      scoreB: null,
      status: 'FIXTURE',
      statusText: 'لم تبدأ بعد',
      minute: null,
      time: '20:00 بتوقيت مكة',
      localTime: '20:00 بتوقيت مكة',
      channels: [{ channel_id: 96, channel_name: 'beIN Sports 6 HD' }],
      commentator: 'علي محمد علي',
      isBeinArabic: true,
      broadcasterLabel: 'beIN Sports 6 HD',
      network: 'bein_ar'
    },
    {
      id: 'fb_7',
      competition: 'الدوري الإيطالي (سيريا آ)',
      teamA: { name: 'يوفنتوس', logo: 'https://media.api-sports.io/football/teams/496.png' },
      teamB: { name: 'إنتر ميلان', logo: 'https://media.api-sports.io/football/teams/505.png' },
      scoreA: null,
      scoreB: null,
      status: 'FIXTURE',
      statusText: 'لم تبدأ بعد',
      minute: null,
      time: '21:45 بتوقيت مكة',
      localTime: '21:45 بتوقيت مكة',
      channels: [
        { channel_id: 117, channel_name: 'beIN SPORTS 2 France' },
        { channel_id: 134, channel_name: 'Arena Sport 1 Premium' }
      ],
      commentator: 'أحمد الطيب',
      isBeinArabic: false,
      broadcasterLabel: 'beIN SPORTS France / Arena Sport',
      network: 'bein_fr'
    }
  ];

  setCache('live_matches_realtime_v1', fallbackMatches);
  res.json({ success: true, matches: fallbackMatches });
});

// Broadcast schedule & on-air programming (inspired by official guide like beIN Sports MENA schedule)
const OFFICIAL_DEFAULT_PROGRAMS: Record<number, { title: string; category: string }> = {
  91: { title: 'استوديو الأبطال ودوري أبطال أوروبا (تغطية حية ومباشرة)', category: 'دوري أبطال أوروبا' },
  92: { title: 'الدوري الإنجليزي الممتاز: استوديو البريميرليغ والمباريات المباشرة', category: 'الدوري الإنجليزي' },
  93: { title: 'الدوري الإسباني (لا ليغا): كواليس الملاعب ومباريات اليوم', category: 'الدوري الإسباني' },
  94: { title: 'دوري أبطال إفريقيا والدوري الفرنسي (مباشر وحصري)', category: 'دوري أبطال إفريقيا' },
  95: { title: 'الدوري الألماني (البوندسليغا): ملخصات الجولة والمواجهات', category: 'الدوري الألماني' },
  96: { title: 'بطولات الماسترز للتنس العالمية والكرة الطائرة', category: 'كرة المضرب / تنس' },
  97: { title: 'سباقات الدراجات العالمية وألعاب القوى والمحركات', category: 'رياضات متنوعة' },
  98: { title: 'عالم السرعة: بطولة العالم لسباقات الفورمولا 1', category: 'فورمولا 1' },
  99: { title: 'تغطيات خاصة وبطولات التنس العالمية والجراند سلام', category: 'كرة المضرب' },
  578: { title: 'نشرة الأخبار الرياضية الشاملة وأبرز الانتقالات العالمية', category: 'أخبار رياضية 24/7' },
  61: { title: 'Premier League Matchday Live: English Studio & Commentary', category: 'Premier League' },
  90: { title: 'UEFA Champions League Magazine & Analysis', category: 'Champions League' },
  100: { title: 'beIN SPORTS XTRA: Global Sports Showcase & Live Action', category: 'International' },
  116: { title: 'beIN SPORTS 1 France: UEFA Champions League Club & Ligue 2', category: 'Football Français' },
  117: { title: 'beIN SPORTS 2 France: Serie A & Bundesliga En Direct', category: 'Football Européen' },
  118: { title: 'beIN SPORTS 3 France: NBA Extra & Tennis Wimbledon', category: 'Multi-Sports' },
  614: { title: 'دوري روشن السعودي: الاستوديو التحليلي ومباريات الجولة', category: 'دوري روشن السعودي' },
  615: { title: 'دوري أبطال آسيا للنخبة والمسابقات السعودية الكبرى', category: 'دوري أبطال آسيا' },
  616: { title: 'كأس خادم الحرمين الشريفين والكرة السعودية', category: 'بطولات السعودية' },
  619: { title: 'البث التكتيكي والإضافي لمباريات دوري روشن السعودي', category: 'دوري روشن السعودي' },
  781: { title: 'برنامج المجلس / دوري نجوم أريدُ القطري', category: 'الكرة القطرية' },
  782: { title: 'كأس أمير دولة قطر وبطولات الخليج العربي', category: 'بطولات الخليج' },
  783: { title: 'سباقات الهجن والفروسية وبطولات الفروسية التراثية', category: 'رياضات تراثية' },
  600: { title: 'دوري أدنوك الإماراتي للمحترفين وكأس رئيس الدولة', category: 'الكرة الإماراتية' },
  609: { title: 'الدوري الإيطالي (سيريا آ): استوديو الكالتشيو الحصري', category: 'الدوري الإيطالي' },
  610: { title: 'الدوري الإيطالي وكأس إيطاليا بريميوم', category: 'الدوري الإيطالي' },
  772: { title: 'Eurosport 1: طواف فرنسا للدراجات وبطولات الجراند سلام للتنس', category: 'Eurosport Europe' },
  773: { title: 'Eurosport 2: بطولات السنوكر وكأس العالم للتزلج الألبي', category: 'Eurosport Europe' },
  524: { title: 'EuroSport 1 Spain: Vuelta a España & Grand Slam Tennis', category: 'EuroSport España' }
};

// API: Real-Time EPG & Broadcast Guide ("يبث الآن") for Channel Catalog
app.get('/api/epg/live', async (req: Request, res: Response) => {
  try {
    const cachedEpg = getCached<Record<number, any>>('live_epg_cache_v1', 20 * 1000);
    if (cachedEpg) {
      return res.json({ success: true, epg: cachedEpg });
    }

    // Get current live matches
    const matchesRes = getCached<any[]>('live_matches_realtime_v1', 60 * 1000) || [];
    const epgMap: Record<number, any> = {};

    // 1. Map all channels that have active scheduled matches right now
    for (const match of matchesRes) {
      if (match.channels && Array.isArray(match.channels)) {
        for (const ch of match.channels) {
          const chId = Number(ch.channel_id);
          if (chId && !epgMap[chId]) {
            const isLive = match.status === 'LIVE';
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

    // 2. Fill in channels with their official schedule programs
    for (const [keyStr, prog] of Object.entries(OFFICIAL_DEFAULT_PROGRAMS)) {
      const chId = Number(keyStr);
      if (!epgMap[chId]) {
        epgMap[chId] = {
          channelId: chId,
          programTitle: prog.title,
          category: prog.category,
          isLive: false,
          isMatch: false
        };
      }
    }

    setCache('live_epg_cache_v1', epgMap);
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://dlive.sx/'
      },
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://wideiptv.top/'
      },
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

// API: Stream resolver info
app.get('/api/resolve-m3u8/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const slug = await getChannelStreamSlug(id);
    let streamUrl: string | null = null;
    if (slug) {
      streamUrl = await getDirectM3u8Url(slug);
    }

    const servers = [
      {
        id: 'srv-1',
        name: 'سيرفر 1 (رئيسي FHD 1080p)',
        folder: 'player',
        quality: '1080p FHD 60fps',
        url: `/api/clean-embed/player/${id}`,
        embedUrl: `/api/clean-embed/player/${id}`,
        type: 'clean-embed',
        isDefault: true
      }
    ];

    res.json({
      success: true,
      channelId: id,
      slug: slug || `channel-${id}`,
      streamUrl: streamUrl || servers[0].url,
      servers,
      headers: {
        Referer: 'https://wideiptv.top/'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Clean Embed Proxy
app.get('/api/clean-embed/:folder/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    let rawHtml = '';

    const slug = await getChannelStreamSlug(id);
    if (slug) {
      try {
        const wideRes = await fetch(`https://wideiptv.top/player/${slug}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://wideiptv.top/'
          },
          signal: AbortSignal.timeout(4000)
        });
        if (wideRes.ok) {
          rawHtml = await wideRes.text();
        }
      } catch {
        // Fallback
      }
    }

    if (!rawHtml) {
      try {
        const dlivePlayerRes = await fetch(`https://dlive.sx/player/stream-${id}.php`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://dlive.sx/'
          },
          signal: AbortSignal.timeout(2500)
        });
        if (dlivePlayerRes.ok) {
          rawHtml = await dlivePlayerRes.text();
        }
      } catch {
        // Fallback
      }
    }

    if (!rawHtml) {
      const fallbackSlug = await getChannelStreamSlug(id) || `stream-${id}`;
      rawHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>kolstream live</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#0b0c0e; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    video { width:100%; height:100%; object-fit:contain; background:#000000; }
  </style>
</head>
<body>
  <video id="video" controls autoplay playsinline></video>
  <script>
    (async function() {
      const video = document.getElementById('video');
      try {
        const res = await fetch('/api/resolve-m3u8/${id}');
        const data = await res.json();
        if (data.streamUrl && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(data.streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function() { video.play().catch(function(){}); });
        } else if (data.streamUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = data.streamUrl;
          video.play().catch(function(){});
        }
      } catch(e) {}
    })();
  </script>
</body>
</html>`;
    }

    let html = rawHtml;

    html = html.replace(/if\s*\(\s*(?:self\s*==\s*top|window\s*==\s*window\.top|top\.location)\s*\)[^;]+;/gi, '// top check disabled');
    html = html.replace(/top\.location\.href\s*=\s*[^;]+;/gi, '// redirect disabled');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*aclib[^<]*<\/script>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*histats[^<]*<\/script>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*fellfortunatepassive[^<]*<\/script>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*kzt2afc1rp52[^<]*<\/script>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*cleverwebserver[^<]*<\/script>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*popunder[^<]*<\/script>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*siteId[^<]*<\/script>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*plausible[^<]*<\/script>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*daddylive[^<]*<\/script>/gi, '');
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');

    const shieldScript = `
    <script>
      (function() {
        window.open = function() { return null; };
        window.alert = function() {};
        window.confirm = function() { return false; };
        window.prompt = function() { return null; };
        Object.freeze(window.open);

        window.addEventListener('DOMContentLoaded', function() {
          document.querySelectorAll('a[target="_blank"], a[href^="http"]').forEach(function(a) {
            a.removeAttribute('target');
            a.setAttribute('href', 'javascript:void(0);');
            a.onclick = function(e) { e.preventDefault(); e.stopPropagation(); return false; };
          });
        });
        window.onbeforeunload = null;

        // Bridge between Kolstream player controls and internal HLS stream
        function inspectAndConnectHls() {
          var hlsInst = window.hls || (window.player && window.player.core && window.player.core.hls);
          if (!hlsInst && window.Hls) {
            // Check prototypes or hook
          }
          if (hlsInst) {
            try {
              var reportLevels = function() {
                var lvls = (hlsInst.levels || []).map(function(l) {
                  return { height: l.height || 720, bitrate: l.bitrate || 0 };
                });
                window.parent.postMessage({
                  type: 'KOLSTREAM_STREAM_INFO',
                  levelsCount: lvls.length,
                  levels: lvls,
                  isSingleSourceBitrate: lvls.length <= 1
                }, '*');
              };
              reportLevels();
              if (hlsInst.on) {
                hlsInst.on(Hls.Events.MANIFEST_PARSED, reportLevels);
                hlsInst.on(Hls.Events.LEVEL_LOADED, reportLevels);
              }
            } catch(e) {}
          }
        }

        // Find and protect video element with Stall Watchdog
        function setupVideoWatchdog() {
          var video = document.querySelector('video');
          if (!video || video._kolstreamHooked) return;
          video._kolstreamHooked = true;

          var stallTimer = null;
          var handleStall = function() {
            if (stallTimer) clearTimeout(stallTimer);
            stallTimer = setTimeout(function() {
              if (video.buffered && video.buffered.length > 0) {
                var end = video.buffered.end(video.buffered.length - 1);
                if (end > video.currentTime + 1) {
                  video.currentTime = end - 0.5;
                }
              }
              video.play().catch(function() {});
              window.parent.postMessage({ type: 'KOLSTREAM_STALL_RECOVERED' }, '*');
            }, 3500);
          };

          video.addEventListener('waiting', handleStall);
          video.addEventListener('stalled', handleStall);
          video.addEventListener('playing', function() {
            if (stallTimer) clearTimeout(stallTimer);
          });
        }

        window.addEventListener('message', function(ev) {
          if (!ev.data) return;
          var hlsInst = window.hls;
          var video = document.querySelector('video');

          if (ev.data.type === 'SET_BUFFER_MODE' && hlsInst) {
            try {
              if (ev.data.mode === 'anti-lag') {
                hlsInst.config.maxBufferLength = 45;
                hlsInst.config.maxMaxBufferLength = 90;
                hlsInst.config.liveSyncDurationCount = 7;
                hlsInst.startLoad();
              } else {
                hlsInst.config.maxBufferLength = 15;
                hlsInst.config.maxMaxBufferLength = 30;
                hlsInst.config.liveSyncDurationCount = 3;
              }
            } catch(e) {}
          } else if (ev.data.type === 'SET_QUALITY_LEVEL' && hlsInst) {
            try {
              if (typeof ev.data.levelIndex === 'number' && hlsInst.levels && hlsInst.levels.length > 0) {
                hlsInst.currentLevel = Math.min(ev.data.levelIndex, hlsInst.levels.length - 1);
              }
            } catch(e) {}
          } else if (ev.data.type === 'RELOAD_STREAM') {
            if (hlsInst) {
              try { hlsInst.startLoad(); } catch(e) {}
            }
            if (video) {
              video.play().catch(function() {});
            }
          } else if (ev.data.type === 'TOGGLE_MUTE' && video) {
            video.muted = !video.muted;
          }
        });

        setInterval(function() {
          inspectAndConnectHls();
          setupVideoWatchdog();
        }, 1200);
      })();
    </script>
    <style>
      #chatango, iframe[src*="chatango"], .banner, .ad-box, [id*="pop"], [class*="pop"] { display: none !important; }
      html, body { background: #0b0c0e !important; overflow: hidden !important; margin: 0 !important; width: 100% !important; height: 100% !important; }
      video { width: 100% !important; height: 100% !important; object-fit: contain !important; }
    </style>
    `;

    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + shieldScript);
    } else {
      html = shieldScript + html;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.removeHeader('X-Frame-Options');
    return res.send(html);
  } catch {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head><meta charset="utf-8"><style>body{background:#0b0c0e;color:#888;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;text-align:center;padding:20px;}</style></head>
      <body><div>جاري إعادة ضبط الاتصال بالبث...</div></body>
      </html>
    `);
  }
});

// API: Proxy Master M3U8 playlist
app.get('/api/proxy-stream/:id/live.m3u8', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const slug = await getChannelStreamSlug(id);
    if (!slug) return res.status(404).send('#EXTM3U\n#EXT-X-ERROR: Slug not found');

    const directUrl = await getDirectM3u8Url(slug);
    if (!directUrl) return res.status(404).send('#EXTM3U\n#EXT-X-ERROR: Stream unavailable');

    const m3u8Res = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://wideiptv.top/'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!m3u8Res.ok) {
      return res.status(m3u8Res.status).send('#EXTM3U\n#EXT-X-ERROR: Upstream fetch failed');
    }

    const playlistText = await m3u8Res.text();
    const baseUrl = directUrl.substring(0, directUrl.lastIndexOf('/') + 1);

    const rewritten = playlistText.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      let abs = trimmed;
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        abs = new URL(trimmed, baseUrl).href;
      }
      return `/api/proxy-chunk?url=${encodeURIComponent(abs)}`;
    }).join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(rewritten);
  } catch (err: any) {
    return res.status(500).send('#EXTM3U\n#EXT-X-ERROR: Internal proxy error');
  }
});

// API: Proxy video TS chunks & child m3u8 playlists
app.get('/api/proxy-chunk', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send('Missing url');

  try {
    const upstreamRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://wideiptv.top/'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Chunk fetch failed');
    }

    const contentType = upstreamRes.headers.get('content-type') || 'video/MP2T';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=10');

    if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
      const text = await upstreamRes.text();
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        let abs = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          abs = new URL(trimmed, baseUrl).href;
        }
        return `/api/proxy-chunk?url=${encodeURIComponent(abs)}`;
      }).join('\n');
      return res.send(rewritten);
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
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

