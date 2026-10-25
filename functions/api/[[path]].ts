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

function mapBroadcasterChannel(channelText: string) {
  const clean = channelText.toLowerCase();
  const numMatch = clean.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 1;
  if (clean.includes('xtra')) {
    return [{ channel_id: 100, channel_name: 'beIN SPORTS XTRA 1', quality: '1080p FHD', isBeinArabic: false }];
  }
  if (clean.includes('english')) {
    return [{ channel_id: num === 2 ? 90 : 61, channel_name: `beIN Sports English ${num}`, quality: '1080p FHD', isBeinArabic: false }];
  }
  if (clean.includes('france') || clean.includes('fr ')) {
    const frMap: Record<number, number> = { 1: 116, 2: 117, 3: 118 };
    return [{ channel_id: frMap[num] || 116, channel_name: `beIN SPORTS ${num} France`, quality: '1080p FHD', isBeinArabic: false }];
  }
  const chNum = num >= 1 && num <= 9 ? num : 1;
  return [
    { channel_id: 90 + chNum, channel_name: `beIN Sports ${chNum} HD`, quality: '1080p FHD', isBeinArabic: true },
    { channel_id: 61, channel_name: 'beIN Sports MENA English 1', quality: '1080p FHD', isBeinArabic: false }
  ];
}

async function scrapeLiveMatchesEdge(): Promise<any[]> {
  const matches: any[] = [];
  try {
    const res = await fetch('https://www.yallakora.com/matches-center', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    });
    if (res.ok) {
      const html = await res.text();
      const cardBlocks = html.split(/class=["'][^"']*matchCard[^"']*["']/i).slice(1);
      let idx = 0;
      for (const card of cardBlocks) {
        const compMatch = card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        const competition = compMatch ? compMatch[1].replace(/<[^>]+>/g, '').trim() : 'بطولة كروية';
        const items = card.split(/class=["'][^"']*item\s+(?:future|now|finish|liItem)[^"']*["']/i).slice(1);
        for (const item of items) {
          const teamAMatch = item.match(/class=["'][^"']*teamA[^"']*["'][\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
          const teamBMatch = item.match(/class=["'][^"']*teamB[^"']*["'][\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
          if (!teamAMatch || !teamBMatch) continue;
          const teamAName = teamAMatch[1].replace(/<[^>]+>/g, '').trim();
          const teamBName = teamBMatch[1].replace(/<[^>]+>/g, '').trim();

          const logoAMatch = item.match(/class=["'][^"']*teamA[^"']*["'][\s\S]*?<img[^>]+(?:data-src|src)=["']([^"']+)["']/i);
          const logoBMatch = item.match(/class=["'][^"']*teamB[^"']*["'][\s\S]*?<img[^>]+(?:data-src|src)=["']([^"']+)["']/i);

          const scores = [...item.matchAll(/class=["'][^"']*score[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)].map(m =>
            m[1].replace(/<[^>]+>/g, '').trim()
          );
          const parsedA = scores[0] && scores[0] !== '-' ? parseInt(scores[0], 10) : null;
          const parsedB = scores[1] && scores[1] !== '-' ? parseInt(scores[1], 10) : null;

          const timeMatch = item.match(/class=["'][^"']*time[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
          const matchTime = timeMatch ? timeMatch[1].replace(/<[^>]+>/g, '').trim() : '20:00';

          const statusMatch = item.match(/class=["'][^"']*matchStatus[^"']*["'][\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
          const statusRaw = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          const chMatch = item.match(/class=["'][^"']*channel[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
          const channelRaw = chMatch ? chMatch[1].replace(/<[^>]+>/g, '').trim() : 'beIN Sports 1 HD';

          let status: 'LIVE' | 'FIXTURE' | 'FINISHED' = 'FIXTURE';
          let statusText = 'لم تبدأ بعد';
          if (/مباشر|الشوط|جارية|الان|الآن/i.test(statusRaw)) {
            status = 'LIVE';
            statusText = statusRaw || 'مباشر الآن';
          } else if (/انتهت|نهاية/i.test(statusRaw)) {
            status = 'FINISHED';
            statusText = 'انتهت المباراة';
          }

          idx++;
          matches.push({
            id: `yk_edge_${idx}`,
            competition,
            teamA: { name: teamAName, logo: logoAMatch?.[1] || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamAName)}&background=141419&color=10b981&bold=true` },
            teamB: { name: teamBName, logo: logoBMatch?.[1] || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamBName)}&background=141419&color=06b6d4&bold=true` },
            scoreA: Number.isNaN(parsedA) ? null : parsedA,
            scoreB: Number.isNaN(parsedB) ? null : parsedB,
            status,
            statusText,
            minute: status === 'LIVE' ? 'مباشر' : null,
            time: matchTime ? `${matchTime} بتوقيت القاهرة` : 'اليوم',
            localTime: matchTime ? `${matchTime} بتوقيت القاهرة` : 'اليوم',
            channels: mapBroadcasterChannel(channelRaw),
            isBeinArabic: true,
            broadcasterLabel: channelRaw || 'beIN Sports HD',
            network: 'bein_ar'
          });
        }
      }
    }
  } catch {
    // Ignore edge fetch errors
  }
  return matches;
}

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

  // 1. If user configured an upstream Vercel/Node backend, proxy routes there
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
      // Fall through to native handler
    }
  }

  // 2. Native Cloudflare Pages Functions Handlers
  const pathname = url.pathname;

  if (pathname.endsWith('/channels')) {
    const channels = [...STATIC_CHANNELS_DATA];
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
      // Return base channels
    }

    return new Response(JSON.stringify({ success: true, count: channels.length, channels }), {
      status: 200,
      headers: JSON_HEADERS
    });
  }

  if (pathname.endsWith('/live-matches')) {
    const matches = await scrapeLiveMatchesEdge();
    return new Response(JSON.stringify({ success: true, count: matches.length, matches }), {
      status: 200,
      headers: JSON_HEADERS
    });
  }

  if (pathname.endsWith('/epg/live')) {
    const matches = await scrapeLiveMatchesEdge();
    const epg: Record<number, any> = {};
    for (const m of matches) {
      for (const ch of m.channels || []) {
        if (!epg[ch.channel_id] || m.status === 'LIVE') {
          epg[ch.channel_id] = {
            channelId: ch.channel_id,
            programTitle: `${m.competition}: ${m.teamA.name} ضد ${m.teamB.name}`,
            category: 'كرة قدم',
            tournament: m.competition,
            isLive: m.status === 'LIVE',
            isMatch: true,
            startTime: m.localTime || m.time,
            commentator: m.commentator
          };
        }
      }
    }
    return new Response(JSON.stringify({ success: true, epg }), {
      status: 200,
      headers: JSON_HEADERS
    });
  }

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

  return new Response(JSON.stringify({ error: 'Endpoint not found on Cloudflare Pages Worker' }), {
    status: 404,
    headers: JSON_HEADERS
  });
};
