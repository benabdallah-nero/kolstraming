import { CHANNELS as STATIC_CHANNELS_DATA } from '../../src/data/channels';
import { resolveBroadcaster } from '../../src/utils/broadcasterResolver';

// Cloudflare Pages Functions Edge Handler for /api/* routes

interface Env {
  VERCEL_BACKEND_URL?: string;
  API_BACKEND_URL?: string;
  [key: string]: any;
}



function mapBroadcasterChannel(channelText: string) {
  return resolveBroadcaster(channelText).channels;
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
          const channelRaw = chMatch ? chMatch[1].replace(/<[^>]+>/g, '').trim() : '';
          const resolved = resolveBroadcaster(channelRaw);

          const sourceId =
            item.match(/livescorematchid=["']?(\d+)/i)?.[1] ||
            item.match(/\/match\/(\d+)\//i)?.[1] ||
            `${teamAName}-${teamBName}`.replace(/[^\p{L}\p{N}]+/gu, '_');

          let status: 'LIVE' | 'FIXTURE' | 'RESULT' = 'FIXTURE';
          let statusText = 'لم تبدأ بعد';
          if (/مباشر|الشوط|جارية|الان|الآن/i.test(statusRaw)) {
            status = 'LIVE';
            statusText = statusRaw || 'مباشر الآن';
          } else if (/انتهت|نهاية/i.test(statusRaw)) {
            status = 'RESULT';
            statusText = 'انتهت المباراة';
          }

          idx++;
          matches.push({
            id: `yk_${sourceId}`,
            competition,
            teamA: { name: teamAName, logo: logoAMatch?.[1] },
            teamB: { name: teamBName, logo: logoBMatch?.[1] },
            scoreA: Number.isNaN(parsedA) ? null : parsedA,
            scoreB: Number.isNaN(parsedB) ? null : parsedB,
            status,
            statusText,
            minute: status === 'LIVE' ? 'مباشر' : null,
            time: matchTime ? `${matchTime} بتوقيت القاهرة` : 'اليوم',
            localTime: matchTime ? `${matchTime} بتوقيت القاهرة` : 'اليوم',
            channels: resolved.channels,
            isBeinArabic: resolved.isBeinArabic,
            broadcasterLabel: resolved.broadcasterLabel || 'غير منقولة تلفزيونياً',
            network: resolved.network
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
              quality: '',
              lang: /arabic/i.test(rawName) ? 'عربي' : 'English',
              country: ''
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
