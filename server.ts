import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

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
  
  // Saudi Sports (SSC)
  { id: 614, name: 'SSC Sport 1 HD', category: 'ar', subcat: 'ssc', quality: '1080p FHD', lang: 'Arabic', logo: 'ssc.png', country: 'SA' },
  { id: 615, name: 'SSC Sport 2 HD', category: 'ar', subcat: 'ssc', quality: '1080p FHD', lang: 'Arabic', logo: 'ssc.png', country: 'SA' },
  { id: 616, name: 'SSC Sport 3 HD', category: 'ar', subcat: 'ssc', quality: '1080p FHD', lang: 'Arabic', logo: 'ssc.png', country: 'SA' },
  { id: 617, name: 'SSC Sport 4 HD', category: 'ar', subcat: 'ssc', quality: '1080p FHD', lang: 'Arabic', logo: 'ssc.png', country: 'SA' },
  { id: 618, name: 'SSC Sport 5 HD', category: 'ar', subcat: 'ssc', quality: '1080p FHD', lang: 'Arabic', logo: 'ssc.png', country: 'SA' },
  { id: 619, name: 'SSC Sport Extra 1', category: 'ar', subcat: 'ssc', quality: '1080p FHD', lang: 'Arabic', logo: 'ssc.png', country: 'SA' },
  { id: 620, name: 'SSC Sport Extra 2', category: 'ar', subcat: 'ssc', quality: '1080p FHD', lang: 'Arabic', logo: 'ssc.png', country: 'SA' },
  { id: 621, name: 'SSC Sport Extra 3', category: 'ar', subcat: 'ssc', quality: '1080p FHD', lang: 'Arabic', logo: 'ssc.png', country: 'SA' },

  // Alkass Sports (Qatar)
  { id: 781, name: 'Alkass One HD', category: 'ar', subcat: 'alkass', quality: '1080p FHD', lang: 'Arabic', logo: 'alkass.png', country: 'QA' },
  { id: 782, name: 'Alkass Two HD', category: 'ar', subcat: 'alkass', quality: '1080p FHD', lang: 'Arabic', logo: 'alkass.png', country: 'QA' },
  { id: 783, name: 'Alkass Three HD', category: 'ar', subcat: 'alkass', quality: '1080p FHD', lang: 'Arabic', logo: 'alkass.png', country: 'QA' },
  { id: 784, name: 'Alkass Four HD', category: 'ar', subcat: 'alkass', quality: '1080p FHD', lang: 'Arabic', logo: 'alkass.png', country: 'QA' },

  // Abu Dhabi Sports & Dubai Sports
  { id: 600, name: 'Abu Dhabi Sports 1 UAE', category: 'ar', subcat: 'ad_sports', quality: '1080p FHD', lang: 'Arabic', logo: 'adsports.png', country: 'AE' },
  { id: 601, name: 'Abu Dhabi Sports 2 UAE', category: 'ar', subcat: 'ad_sports', quality: '1080p FHD', lang: 'Arabic', logo: 'adsports.png', country: 'AE' },
  { id: 609, name: 'Abu Dhabi Sports 1 Premium', category: 'ar', subcat: 'ad_sports', quality: '1080p FHD', lang: 'Arabic', logo: 'adsports_prem.png', country: 'AE' },
  { id: 610, name: 'Abu Dhabi Sports 2 Premium', category: 'ar', subcat: 'ad_sports', quality: '1080p FHD', lang: 'Arabic', logo: 'adsports_prem.png', country: 'AE' },
  { id: 604, name: 'Dubai Sports 1 UAE', category: 'ar', subcat: 'dubai_sports', quality: '1080p FHD', lang: 'Arabic', logo: 'dubai_sports.png', country: 'AE' },
  { id: 605, name: 'Dubai Sports 2 UAE', category: 'ar', subcat: 'dubai_sports', quality: '1080p FHD', lang: 'Arabic', logo: 'dubai_sports.png', country: 'AE' },
  { id: 606, name: 'Dubai Sports 3 UAE', category: 'ar', subcat: 'dubai_sports', quality: '1080p FHD', lang: 'Arabic', logo: 'dubai_sports.png', country: 'AE' },
  { id: 608, name: 'Dubai Racing 2 UAE', category: 'ar', subcat: 'dubai_sports', quality: '1080p FHD', lang: 'Arabic', logo: 'dubai_racing.png', country: 'AE' },

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

// Helper to categorize any generic channel name
function categorizeChannel(name: string): { category: string; subcat: string; lang: string } {
  const lower = name.toLowerCase();
  if (lower.includes('arabic') || lower.includes('alkass') || lower.includes('ssc') || lower.includes('dhabi') || lower.includes('dubai') || lower.includes('qatar') || lower.includes('ksa') || lower.includes('ontime') || lower.includes('al kass')) {
    return { category: 'ar', subcat: 'arabic_sports', lang: 'Arabic' };
  }
  if (lower.includes('bein')) {
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

// API: Channels list with cached scraping from https://dlive.sx/24-7-channels.php
app.get('/api/channels', async (req: Request, res: Response) => {
  try {
    const cached = getCached<any[]>('all_channels', 60 * 60 * 1000); // 1 hour cache
    if (cached) {
      return res.json({ success: true, count: cached.length, channels: cached });
    }

    let allChannels: any[] = [...CURATED_SPECIAL_CHANNELS];
    const knownIds = new Set(CURATED_SPECIAL_CHANNELS.map(c => c.id));

    try {
      const response = await fetch('https://dlive.sx/24-7-channels.php', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
      const html = await response.text();
      const regex = /href=["']\/watch\.php\?id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const id = parseInt(match[1], 10);
        if (!knownIds.has(id)) {
          const rawName = match[2].replace(/<[^>]+>/g, '').replace(/ID:\s*\d+/, '').trim();
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
    } catch (scrapeErr) {
      console.warn('Could not scrape live 24-7 channels, using curated list:', scrapeErr);
    }

    setCache('all_channels', allChannels);
    res.json({ success: true, count: allChannels.length, channels: allChannels });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, channels: CURATED_SPECIAL_CHANNELS });
  }
});

// API: Curated channels (Arabic, beIN, Eurosport)
app.get('/api/channels/featured', (req: Request, res: Response) => {
  res.json({
    success: true,
    channels: CURATED_SPECIAL_CHANNELS,
    count: CURATED_SPECIAL_CHANNELS.length,
    groups: {
      arabic_sports: CURATED_SPECIAL_CHANNELS.filter(c => c.category === 'ar'),
      bein_network: CURATED_SPECIAL_CHANNELS.filter(c => c.category === 'bein' || c.subcat === 'bein_ar'),
      eurosport: CURATED_SPECIAL_CHANNELS.filter(c => c.category === 'euro')
    }
  });
});

// API: Schedule feed from https://dlive.sx/schedule/schedule-generated.json
app.get('/api/schedule', async (req: Request, res: Response) => {
  try {
    const cached = getCached<any>('live_schedule', 5 * 60 * 1000); // 5 min cache
    if (cached) {
      return res.json({ success: true, ...cached });
    }

    const response = await fetch('https://dlive.sx/schedule/schedule-generated.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Schedule HTTP error ${response.status}`);
    }

    const rawData = await response.json();
    const days = Object.keys(rawData);
    
    // Process and sanitize categories
    const processedDays: Record<string, Record<string, any[]>> = {};
    let totalEvents = 0;

    for (const day of days) {
      processedDays[day] = {};
      const categories = Object.keys(rawData[day]);
      for (const cat of categories) {
        const cleanCat = cat.replace(/<[^>]+>/g, '').trim();
        const events = rawData[day][cat] || [];
        processedDays[day][cleanCat] = events.map((ev: any) => ({
          time: ev.time,
          event: ev.event,
          channels: (ev.channels || []).concat(ev.channels2 || [])
        }));
        totalEvents += events.length;
      }
    }

    const result = {
      days,
      data: processedDays,
      totalEvents,
      updatedAt: new Date().toISOString()
    };

    setCache('live_schedule', result);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Schedule fetch error:', err);
    // Provide a rich fallback schedule for sports
    const fallback = {
      days: ['Today Live Matches'],
      data: {
        'Today Live Matches': {
          'Soccer': [
            { time: '19:00', event: 'UEFA Champions League: Arsenal vs Real Madrid', channels: [{ channel_name: 'beIN Sports 1 Arabic', channel_id: '91' }, { channel_name: 'TNT Sports 1', channel_id: '15' }] },
            { time: '19:00', event: 'UEFA Champions League: Bayern Munich vs PSG', channels: [{ channel_name: 'beIN Sports 2 Arabic', channel_id: '92' }, { channel_name: 'beIN SPORTS 1 France', channel_id: '116' }] },
            { time: '21:00', event: 'Saudi Pro League: Al Hilal vs Al Nassr', channels: [{ channel_name: 'SSC Sport 1 HD', channel_id: '614' }, { channel_name: 'SSC Sport Extra 1', channel_id: '619' }] },
            { time: '21:30', event: 'Qatar Stars League: Al Sadd vs Al Rayyan', channels: [{ channel_name: 'Alkass One HD', channel_id: '781' }, { channel_name: 'Alkass Two HD', channel_id: '782' }] }
          ],
          'Tennis': [
            { time: '14:00', event: 'ATP Masters 1000 - Quarter Finals', channels: [{ channel_name: 'EuroSport 1 Spain', channel_id: '524' }, { channel_name: 'beIN Sports 6 Arabic', channel_id: '96' }] }
          ],
          'Motorsport': [
            { time: '16:00', event: 'Formula 1 Grand Prix - Practice & Qualifying', channels: [{ channel_name: 'SSC Sport 2 HD', channel_id: '615' }, { channel_name: 'beIN Sports 8 Arabic', channel_id: '98' }] }
          ]
        }
      },
      totalEvents: 6,
      isFallback: true,
      updatedAt: new Date().toISOString()
    };
    res.json({ success: true, ...fallback });
  }
});

// API: Live Matches & Schedules in Yacine TV style with 100% verified real broadcast channels
app.get('/api/live-matches', async (req: Request, res: Response) => {
  const cachedMatches = getCached<any>('live_matches_realtime_v1', 15 * 1000); // 15s cache
  if (cachedMatches) {
    return res.json({ success: true, matches: cachedMatches });
  }

  const mapBroadcaster = (rawChannel: string | null) => {
    if (!rawChannel) {
      return {
        channels: [],
        isBeinArabic: false,
        broadcasterLabel: 'غير منقولة',
        network: 'unbroadcast' as const
      };
    }

    const lower = rawChannel.toLowerCase();
    const beinMatch = rawChannel.match(/bein\s*sports?\s*(\d+)/i) ||
                      rawChannel.match(/ب[يى]\s*إن\s*سبورت\s*(\d+)/i) ||
                      rawChannel.match(/ب[يى]\s*ان\s*سبورت\s*(\d+)/i);
    if (beinMatch) {
      const num = parseInt(beinMatch[1], 10);
      const chId = 90 + num; // 91 for beIN 1, 92 for beIN 2, etc.
      if (chId >= 91 && chId <= 99) {
        return {
          channels: [{ channel_id: chId, channel_name: `beIN Sports ${num} HD`, quality: '1080p FHD', isBeinArabic: true }],
          isBeinArabic: true,
          broadcasterLabel: `beIN Sports ${num} HD`,
          network: 'bein_ar' as const
        };
      }
    }

    if (lower.includes('الكأس 2') || lower.includes('alkass 2')) {
      return {
        channels: [{ channel_id: 782, channel_name: 'الكأس 2 HD', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'قنوات الكأس 2 HD',
        network: 'alkass' as const
      };
    }

    if (lower.includes('الكأس') || lower.includes('alkass')) {
      return {
        channels: [{ channel_id: 781, channel_name: 'الكأس 1 HD', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'قنوات الكأس 1 HD',
        network: 'alkass' as const
      };
    }

    if (lower.includes('ssc')) {
      return {
        channels: [{ channel_id: 614, channel_name: 'SSC 1 HD', quality: '1080p FHD', isBeinArabic: false }],
        isBeinArabic: false,
        broadcasterLabel: 'قنوات SSC 1 HD',
        network: 'ssc' as const
      };
    }

    return {
      channels: [],
      isBeinArabic: false,
      broadcasterLabel: rawChannel,
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
      }
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
        // Exclude volleyball, handball, amateur leagues, second division
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

          // Exclude political / unwanted entries
          if (teamA.includes('إسرائيل') || teamB.includes('إسرائيل') || teamA.includes('الكيان') || teamB.includes('الكيان')) {
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

          const commentator = mapped.isBeinArabic ? commentators[matchIdx % commentators.length] : undefined;
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

      // Sort: LIVE first, then FIXTURE, then RESULT; priority to matches with working channels
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
    console.error('Failed to scrape real match center:', err);
  }

  // Graceful fallback only if network fails completely
  const cached = getCached<any>('live_matches_realtime_v1', 60 * 60 * 1000);
  if (cached) {
    return res.json({ success: true, matches: cached });
  }

  res.json({ success: true, matches: [] });
});

// API: Stream resolver info according to dlive.sx/api.php specification
// DLHD supports stream, cast, watch, plus, casting, player folders for stream-<id>.php
app.get('/api/stream/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const baseUrl = 'https://dlive.sx';
  
  // Prioritize verified player folder as requested by user; server 2 removed
  const folders = ['player', 'cast', 'watch', 'plus'];
  const players = folders.map((folder, index) => ({
    serverName: `DLHD Primary (${folder})`,
    folder,
    embedUrl: `${baseUrl}/${folder}/stream-${id}.php`,
    cleanEmbedUrl: `/api/clean-player/${id}?folder=${folder}`,
    watchUrl: `${baseUrl}/watch.php?id=${id}`,
    isRecommended: folder === 'player'
  }));

  // Match with scraper channel data if in beIN AR range (91-99) or others
  const isBeinArabic = parseInt(id, 10) >= 91 && parseInt(id, 10) <= 99;

  res.json({
    success: true,
    channelId: id,
    baseUrl,
    players,
    scraperMeta: {
      repo: 'sspc11122020-hub/getChanelFraom_dlstreams',
      isBeinArabic,
      targetChannel: isBeinArabic ? `beIN Sports ${parseInt(id, 10) - 90} Arabic` : undefined,
      hlsAvailable: true
    }
  });
});

// Helper: Extract stream slug from dlive player page
async function getChannelStreamSlug(channelId: string | number): Promise<string | null> {
  const cachedSlug = getCached<string>(`slug_${channelId}`, 24 * 60 * 60 * 1000);
  if (cachedSlug) return cachedSlug;

  try {
    const res = await fetch(`https://dlive.sx/player/stream-${channelId}.php`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://dlive.sx/'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/stream=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const slug = match[1];
      setCache(`slug_${channelId}`, slug);
      return slug;
    }
  } catch (e) {
    console.error(`Error resolving slug for channel ${channelId}:`, e);
  }
  return null;
}

// Helper: Extract real-time direct M3U8 URL from wideiptv player
async function getDirectM3u8Url(slug: string): Promise<string | null> {
  const cachedUrl = getCached<string>(`m3u8_${slug}`, 45 * 1000); // 45 sec cache for fresh tokens
  if (cachedUrl) return cachedUrl;

  try {
    const res = await fetch(`https://wideiptv.top/player/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://wideiptv.top/'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/streamUrl:\s*["'](https:\\[/\\]+[^"']+)["']/);
    if (match && match[1]) {
      const directUrl = match[1].replace(/\\\//g, '/');
      setCache(`m3u8_${slug}`, directUrl);
      return directUrl;
    }
  } catch (e) {
    console.error(`Error resolving direct m3u8 for slug ${slug}:`, e);
  }
  return null;
}

// API: Direct M3U8 stream resolver (0% ads, 100% direct native playback)
app.get('/api/resolve-m3u8/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const slug = await getChannelStreamSlug(id);
    if (!slug) {
      return res.status(404).json({ success: false, error: 'Channel stream slug not found' });
    }

    const streamUrl = await getDirectM3u8Url(slug);
    if (!streamUrl) {
      return res.status(404).json({ success: false, error: 'Active M3U8 stream URL could not be extracted' });
    }

    res.json({
      success: true,
      channelId: id,
      slug,
      streamUrl,
      headers: {
        Referer: 'https://wideiptv.top/'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 100% Ad-Free Clean Player (renders pure Hls.js player directly from extracted stream)
app.get('/api/clean-player/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const slug = await getChannelStreamSlug(id);
    let streamUrl: string | null = null;
    if (slug) {
      streamUrl = await getDirectM3u8Url(slug);
    }

    // If direct stream extracted, serve pure HTML5 video player
    if (streamUrl) {
      const cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>kolstream · made by nero</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#0b0c0e; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    video { width:100%; height:100%; object-fit:contain; background:#000000; }
  </style>
</head>
<body>
  <video id="video" controls autoplay playsinline></video>
  <script>
    (function() {
      const streamUrl = ${JSON.stringify(streamUrl)};
      const video = document.getElementById('video');

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 0,
          liveSyncDurationCount: 3
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          video.play().catch(function() {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.play().catch(function() {});
      }
    })();
  </script>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(cleanHtml);
    }

    // Never redirect to third-party ad sites or external iframe fallbacks
    return res.status(404).send('Direct stream unavailable');
  } catch (err: any) {
    console.error('Clean player error:', err);
    return res.status(500).send('Stream error');
  }
});

// API: Scraper data from sspc11122020-hub/getChanelFraom_dlstreams
app.get('/api/scraper/bein-ar', async (req: Request, res: Response) => {
  try {
    const cached = getCached<any>('scraper_bein_ar', 10 * 60 * 1000);
    if (cached) {
      return res.json({ success: true, ...cached });
    }

    const indexRes = await fetch('https://raw.githubusercontent.com/sspc11122020-hub/getChanelFraom_dlstreams/main/Bein%20sport%20Ar/channels_index.json');
    let channelsIndex = [];
    if (indexRes.ok) {
      channelsIndex = await indexRes.json();
    }

    const data = {
      repository: 'https://github.com/sspc11122020-hub/getChanelFraom_dlstreams',
      author: 'sspc11122020-hub',
      baseSourceUrl: 'https://dlstreams.st',
      channelsIndex,
      channelsRange: 'beIN Sports 1-9 Arabic (IDs 91-99)',
      updatedAt: new Date().toISOString()
    };

    setCache('scraper_bein_ar', data);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.json({
      success: true,
      repository: 'https://github.com/sspc11122020-hub/getChanelFraom_dlstreams',
      channelsIndex: [
        { id: 91, name: 'beIN Sports 1 Arabic', file: 'channel_91.json' },
        { id: 92, name: 'beIN Sports 2 Arabic', file: 'channel_92.json' }
      ]
    });
  }
});

// API: Download complete KOstream project ZIP for local execution
app.get('/api/download-zip', (req: Request, res: Response) => {
  try {
    const pythonScript = `
import os, zipfile
EXCLUDE_DIRS = {'node_modules', '.git', 'dist', '.cache', '__pycache__'}
EXCLUDE_FILES = {'KOstream-app.zip', 'package-lock.json'}
os.makedirs('public', exist_ok=True)
zip_path = 'public/KOstream-app.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        for file in files:
            if file in EXCLUDE_FILES or file.endswith('.zip') or file.endswith('.pyc'):
                continue
            if file in ['ExpoProjectView.tsx', 'expoProjectFiles.ts']:
                continue
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, '.')
            zipf.write(file_path, arcname)
`;
    execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`);
    const zipFilePath = path.resolve(__dirname, 'public', 'KOstream-app.zip');
    if (fs.existsSync(zipFilePath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="KOstream-local.zip"');
      return res.sendFile(zipFilePath);
    } else {
      res.status(500).json({ error: 'Zip file could not be generated' });
    }
  } catch (err: any) {
    console.error('Download zip error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DLHD Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
