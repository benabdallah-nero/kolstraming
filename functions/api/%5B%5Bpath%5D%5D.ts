// Cloudflare Pages Functions Edge Handler for /api/* routes

interface Env {
  VERCEL_BACKEND_URL?: string;
  API_BACKEND_URL?: string;
  [key: string]: any;
}

const STATIC_CHANNELS_DATA = [
  { id: 91, name: 'beIN Sports 1 Arabic', arabicName: 'بي إن سبورت 1 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 92, name: 'beIN Sports 2 Arabic', arabicName: 'بي إن سبورت 2 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 93, name: 'beIN Sports 3 Arabic', arabicName: 'بي إن سبورت 3 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 94, name: 'beIN Sports 4 Arabic', arabicName: 'بي إن سبورت 4 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 95, name: 'beIN Sports 5 Arabic', arabicName: 'بي إن سبورت 5 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 96, name: 'beIN Sports 6 Arabic', arabicName: 'بي إن سبورت 6 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 97, name: 'beIN Sports 7 Arabic', arabicName: 'بي إن سبورت 7 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 98, name: 'beIN Sports 8 Arabic', arabicName: 'بي إن سبورت 8 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 99, name: 'beIN Sports 9 Arabic', arabicName: 'بي إن سبورت 9 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 578, name: 'beIN Sports News HD Qatar', arabicName: 'بي إن سبورت الإخبارية', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA' },
  { id: 61, name: 'beIN Sports MENA English 1', arabicName: 'بي إن سبورت الإنجليزية 1 HD', category: 'bein', subcat: 'bein_mena', quality: '1080p FHD', lang: 'English', country: 'QA' },
  { id: 90, name: 'beIN Sports MENA English 2', arabicName: 'بي إن سبورت الإنجليزية 2 HD', category: 'bein', subcat: 'bein_mena', quality: '1080p FHD', lang: 'English', country: 'QA' },
  { id: 100, name: 'beIN SPORTS XTRA 1', arabicName: 'بي إن سبورت إكسترا 1', category: 'bein', subcat: 'bein_xtra', quality: '1080p FHD', lang: 'English', country: 'USA' },
  { id: 425, name: 'beIN SPORTS USA', arabicName: 'بي إن سبورت الأمريكية HD', category: 'bein', subcat: 'bein_us', quality: '1080p FHD', lang: 'English', country: 'US' },
  { id: 372, name: 'beIN SPORTS en Español', arabicName: 'بي إن سبورت الإسبانية', category: 'bein', subcat: 'bein_es', quality: '1080p FHD', lang: 'Spanish', country: 'US' },
  { id: 116, name: 'beIN SPORTS 1 France', arabicName: 'بي إن سبورت 1 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 117, name: 'beIN SPORTS 2 France', arabicName: 'بي إن سبورت 2 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 118, name: 'beIN SPORTS 3 France', arabicName: 'بي إن سبورت 3 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 494, name: 'beIN Sports MAX 4 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 495, name: 'beIN Sports MAX 5 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 496, name: 'beIN Sports MAX 6 France', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 772, name: 'Eurosport 1 France', arabicName: 'يوروسبورت 1 الفرنسية HD', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 773, name: 'Eurosport 2 France', arabicName: 'يوروسبورت 2 الفرنسية HD', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 524, name: 'EuroSport 1 Spain', arabicName: 'يوروسبورت 1 الإسبانية', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Spanish', country: 'ES' },
  { id: 525, name: 'EuroSport 2 Spain', arabicName: 'يوروسبورت 2 الإسبانية', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Spanish', country: 'ES' },
  { id: 878, name: 'EuroSport 1 Italy', arabicName: 'يوروسبورت 1 الإيطالية', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Italian', country: 'IT' },
  { id: 879, name: 'EuroSport 2 Italy', arabicName: 'يوروسبورت 2 الإيطالية', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Italian', country: 'IT' },
  { id: 134, name: 'Arena Sport 1 Premium', arabicName: 'أرينا سبورت 1 بريميوم', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', country: 'RS' },
  { id: 135, name: 'Arena Sport 2 Premium', arabicName: 'أرينا سبورت 2 بريميوم', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', country: 'RS' },
  { id: 139, name: 'Arena Sport 3 Premium', arabicName: 'أرينا سبورت 3 بريميوم', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', country: 'RS' },
  { id: 123, name: 'Astro SuperSport 1', arabicName: 'أسترو سوبر سبورت 1', category: 'euro', subcat: 'astro', quality: '1080p FHD', lang: 'English', country: 'MY' },
  { id: 124, name: 'Astro SuperSport 2', arabicName: 'أسترو سوبر سبورت 2', category: 'euro', subcat: 'astro', quality: '1080p FHD', lang: 'English', country: 'MY' },
  { id: 62, name: 'beIN SPORTS 1 Turkey', arabicName: 'بي إن سبورت 1 تركيا', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', country: 'TR' },
  { id: 63, name: 'beIN SPORTS 2 Turkey', arabicName: 'بي إن سبورت 2 تركيا', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', country: 'TR' },
  { id: 491, name: 'beIN SPORTS Australia 1', arabicName: 'بي إن سبورت أستراليا 1', category: 'bein', subcat: 'bein_au', quality: '1080p FHD', lang: 'English', country: 'AU' },
  { id: 492, name: 'beIN SPORTS Australia 2', arabicName: 'بي إن سبورت أستراليا 2', category: 'bein', subcat: 'bein_au', quality: '1080p FHD', lang: 'English', country: 'AU' },
  { id: 55, name: 'Paramount+ Sports HD', arabicName: 'باراماونت بلس سبورتس', category: 'other', subcat: 'us_sports', quality: '1080p FHD', lang: 'English', country: 'US' },
  { id: 181, name: 'TNT Sports 1 UK', arabicName: 'تي إن تي سبورتس 1 بريطانيا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'English', country: 'UK' },
  { id: 201, name: 'Sky Sports Main Event UK', arabicName: 'سكاي سبورتس مين إيفنت', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'English', country: 'UK' },
  { id: 301, name: 'DAZN 1 Bar HD', arabicName: 'دازون 1 HD', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'German', country: 'DE' }
];

const STATIC_MATCHES_DATA = [
  {
    id: 'cf_match_1',
    competition: 'الدوري الإنجليزي الممتاز',
    teamA: { name: 'ليفربول', logo: 'https://media.api-sports.io/football/teams/40.png' },
    teamB: { name: 'مانشستر سيتي', logo: 'https://media.api-sports.io/football/teams/50.png' },
    scoreA: 2,
    scoreB: 1,
    status: 'LIVE',
    statusText: 'الشوط الثاني',
    minute: "74'",
    time: '18:30 بتوقيت مكة',
    localTime: '18:30 بتوقيت مكة',
    channels: [
      { channel_id: 91, channel_name: 'beIN Sports 1 HD', quality: '1080p FHD', isBeinArabic: true },
      { channel_id: 61, channel_name: 'beIN Sports MENA English 1', quality: '1080p FHD', isBeinArabic: false }
    ],
    commentator: 'حفيظ دراجي',
    isBeinArabic: true,
    broadcasterLabel: 'beIN Sports 1 HD',
    network: 'bein_ar'
  },
  {
    id: 'cf_match_2',
    competition: 'الدوري الإسباني (لا ليغا)',
    teamA: { name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/541.png' },
    teamB: { name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/529.png' },
    scoreA: null,
    scoreB: null,
    status: 'FIXTURE',
    statusText: 'لم تبدأ بعد',
    minute: null,
    time: '21:00 بتوقيت مكة',
    localTime: '21:00 بتوقيت مكة',
    channels: [
      { channel_id: 91, channel_name: 'beIN Sports 1 HD', quality: '1080p FHD', isBeinArabic: true },
      { channel_id: 92, channel_name: 'beIN Sports 2 HD', quality: '1080p FHD', isBeinArabic: true }
    ],
    commentator: 'عصام الشوالي',
    isBeinArabic: true,
    broadcasterLabel: 'beIN Sports 1 HD / beIN Sports 2 HD',
    network: 'bein_ar'
  },
  {
    id: 'cf_match_3',
    competition: 'دوري أبطال أوروبا',
    teamA: { name: 'بايرن ميونخ', logo: 'https://media.api-sports.io/football/teams/157.png' },
    teamB: { name: 'باريس سان جيرمان', logo: 'https://media.api-sports.io/football/teams/85.png' },
    scoreA: 1,
    scoreB: 0,
    status: 'LIVE',
    statusText: 'الشوط الأول',
    minute: "38'",
    time: '22:00 بتوقيت مكة',
    localTime: '22:00 بتوقيت مكة',
    channels: [
      { channel_id: 93, channel_name: 'beIN Sports 3 HD', quality: '1080p FHD', isBeinArabic: true },
      { channel_id: 116, channel_name: 'beIN SPORTS 1 France', quality: '1080p FHD', isBeinArabic: false }
    ],
    commentator: 'خليل البلوشي',
    isBeinArabic: true,
    broadcasterLabel: 'beIN Sports 3 HD',
    network: 'bein_ar'
  }
];

const STATIC_EPG_DATA: Record<number, any> = {
  91: {
    channelId: 91,
    programTitle: 'الدوري الإنجليزي الممتاز: ليفربول ضد مانشستر سيتي',
    category: 'كرة قدم',
    tournament: 'الدوري الإنجليزي الممتاز',
    isLive: true,
    isMatch: true,
    startTime: '18:30 بتوقيت مكة',
    commentator: 'حفيظ دراجي'
  },
  92: {
    channelId: 92,
    programTitle: 'الدوري الإسباني: ريال مدريد ضد برشلونة (الكلاسيكو)',
    category: 'كرة قدم',
    tournament: 'الدوري الإسباني',
    isLive: false,
    isMatch: true,
    startTime: '21:00 بتوقيت مكة',
    commentator: 'عصام الشوالي'
  },
  93: {
    channelId: 93,
    programTitle: 'دوري أبطال أوروبا: بايرن ميونخ ضد باريس سان جيرمان',
    category: 'كرة قدم',
    tournament: 'دوري أبطال أوروبا',
    isLive: true,
    isMatch: true,
    startTime: '22:00 بتوقيت مكة',
    commentator: 'خليل البلوشي'
  },
  578: {
    channelId: 578,
    programTitle: 'الحصاد الرياضي – نشرة الأخبار الرياضية على مدار 24 ساعة',
    category: 'أخبار ورياضة',
    tournament: 'نشرة أخبار beIN',
    isLive: true,
    isMatch: false,
    startTime: 'مستمر 24/7'
  }
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
  'Cache-Control': 'public, max-age=60, s-maxage=120'
};

export const onRequest = async (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range'
      }
    });
  }

  // 1. If user configured an upstream Vercel/Node backend, proxy non-static routes there
  const proxyBackend = env.VERCEL_BACKEND_URL || env.API_BACKEND_URL;
  if (proxyBackend) {
    try {
      const cleanBase = proxyBackend.replace(/\/+$/, '');
      const targetUrl = `${cleanBase}${url.pathname}${url.search}`;
      const backendRes = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'Cloudflare-Pages-Worker',
          'Accept': request.headers.get('Accept') || '*/*',
          'Accept-Language': request.headers.get('Accept-Language') || 'ar,en;q=0.9'
        }
      });
      if (backendRes.ok) {
        const resHeaders = new Headers(backendRes.headers);
        resHeaders.set('Access-Control-Allow-Origin', '*');
        return new Response(backendRes.body, {
          status: backendRes.status,
          headers: resHeaders
        });
      }
    } catch {
      // Fall through to native handler if proxy backend is unreachable
    }
  }

  // 2. Native Cloudflare Pages Functions Handlers
  const pathname = url.pathname;

  // /api/channels
  if (pathname.endsWith('/channels')) {
    // Attempt dynamic fetch from DaddyLive 24-7 channels
    let channels = [...STATIC_CHANNELS_DATA];
    try {
      const dliveRes = await fetch('https://dlive.sx/24-7-channels.php', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36', 'Referer': 'https://dlive.sx/' }
      });
      if (dliveRes.ok) {
        const html = await dliveRes.text();
        const regex = /href=["']\/watch\.php\?id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/g;
        const knownIds = new Set(channels.map(c => c.id));
        let match;
        while ((match = regex.exec(html)) !== null) {
          const id = parseInt(match[1], 10);
          if (!knownIds.has(id)) {
            const rawName = match[2].replace(/<[^>]+>/g, '').replace(/ID:\s*\d+/, '').trim();
            if (!rawName || /ssc|alkass|israel/i.test(rawName)) continue;
            channels.push({
              id,
              name: rawName,
              category: /bein/i.test(rawName) ? 'bein' : 'euro',
              subcat: 'live_event',
              quality: '1080p FHD',
              lang: /arabic/i.test(rawName) ? 'عربي' : 'English',
              country: 'Global'
            });
            knownIds.add(id);
          }
        }
      }
    } catch {
      // Use STATIC_CHANNELS_DATA
    }

    return new Response(JSON.stringify({ success: true, count: channels.length, channels }), {
      status: 200,
      headers: JSON_HEADERS
    });
  }

  // /api/live-matches
  if (pathname.endsWith('/live-matches')) {
    return new Response(JSON.stringify({ success: true, count: STATIC_MATCHES_DATA.length, matches: STATIC_MATCHES_DATA }), {
      status: 200,
      headers: JSON_HEADERS
    });
  }

  // /api/epg/live
  if (pathname.endsWith('/epg/live')) {
    return new Response(JSON.stringify({ success: true, epg: STATIC_EPG_DATA }), {
      status: 200,
      headers: JSON_HEADERS
    });
  }

  // /api/status
  if (pathname.endsWith('/status')) {
    return new Response(JSON.stringify({
      status: 'online',
      platform: 'cloudflare-pages-functions',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: JSON_HEADERS
    });
  }

  // Fallback for unknown /api/* endpoint
  return new Response(JSON.stringify({ error: 'Endpoint not found on Cloudflare Pages Worker' }), {
    status: 404,
    headers: JSON_HEADERS
  });
};
