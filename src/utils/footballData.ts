import {
  LeagueInfo,
  StandingRow,
  MatchDetailsData,
  MatchEventItem,
  MatchLineupTeam,
  MatchStatItem,
  MatchH2HItem,
  LiveMatch
} from '../types';

export function getCurrentFootballSeason(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12
  // Football season runs July–June (e.g. Nov 2026 -> 2026 / 2027)
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear} / ${startYear + 1}`;
}

export const CURRENT_FOOTBALL_SEASON = getCurrentFootballSeason();

export const LEAGUES_CATALOG: LeagueInfo[] = [
  {
    id: 'epl',
    name: 'الدوري الإنجليزي الممتاز',
    shortName: 'البريميرليغ',
    country: 'إنجلترا',
    region: 'europe',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 4,
    elSpots: 2,
    relegationSpots: 3
  },
  {
    id: 'laliga',
    name: 'الدوري الإسباني (لا ليغا)',
    shortName: 'لا ليغا',
    country: 'إسبانيا',
    region: 'europe',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 4,
    elSpots: 2,
    relegationSpots: 3
  },
  {
    id: 'seriea',
    name: 'الدوري الإيطالي (سيريا آ)',
    shortName: 'سيريا آ',
    country: 'إيطاليا',
    region: 'europe',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 4,
    elSpots: 2,
    relegationSpots: 3
  },
  {
    id: 'bundesliga',
    name: 'الدوري الألماني (البوندسليغا)',
    shortName: 'البوندسليغا',
    country: 'ألمانيا',
    region: 'europe',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 4,
    elSpots: 2,
    relegationSpots: 3
  },
  {
    id: 'ligue1',
    name: 'الدوري الفرنسي (ليغ 1)',
    shortName: 'ليغ 1',
    country: 'فرنسا',
    region: 'europe',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 3,
    elSpots: 2,
    relegationSpots: 3
  },
  {
    id: 'ucl',
    name: 'دوري أبطال أوروبا',
    shortName: 'أبطال أوروبا',
    country: 'أوروبا',
    region: 'continental',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 8,
    elSpots: 16,
    relegationSpots: 12
  },
  {
    id: 'saudi',
    name: 'دوري روشن السعودي للمحترفين',
    shortName: 'دوري روشن',
    country: 'السعودية',
    region: 'arab',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 3,
    elSpots: 1,
    relegationSpots: 3
  },
  {
    id: 'egypt',
    name: 'الدوري المصري الممتاز',
    shortName: 'الدوري المصري',
    country: 'مصر',
    region: 'arab',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 2,
    elSpots: 2,
    relegationSpots: 3
  },
  {
    id: 'morocco',
    name: 'البطولة المغربية الاحترافية إنوي',
    shortName: 'البطولة المغربية',
    country: 'المغرب',
    region: 'arab',
    season: CURRENT_FOOTBALL_SEASON,
    clSpots: 2,
    elSpots: 2,
    relegationSpots: 2
  }
];

export const YALLAKORA_STANDING_PATHS: Record<string, string> = {
  epl: '/epl/3033/standing/x',
  laliga: '/la-liga/3034/standing/x',
  seriea: '/serie-a/3035/standing/x',
  bundesliga: '/bundesliga/3036/standing/x',
  ligue1: '/ligue1/3037/standing/x',
  ucl: '/group-standing/105/x',
  saudi: '/ksa-league/3040/standing/x',
  egypt: '/group-standing/160/x',
  morocco: '/morrocan-league/3043/standing/x'
};

export const ESPN_LEAGUE_SLUGS: Record<string, string> = {
  epl: 'eng.1',
  laliga: 'esp.1',
  seriea: 'ita.1',
  bundesliga: 'ger.1',
  ligue1: 'fra.1',
  ucl: 'uefa.champions',
  saudi: 'sau.1'
};

const EN_TO_AR_TEAM_MAP: Array<[RegExp, string]> = [
  [/^liverpool$/i, 'ليفربول'],
  [/^arsenal$/i, 'أرسنال'],
  [/^manchester city$/i, 'مانشستر سيتي'],
  [/^chelsea$/i, 'تشيلسي'],
  [/^aston villa$/i, 'أستون فيلا'],
  [/^newcastle united$/i, 'نيوكاسل يونايتد'],
  [/^brighton.*hove albion$/i, 'برايتون'],
  [/^fulham$/i, 'فولهام'],
  [/^tottenham hotspur$/i, 'توتنهام هوتسبير'],
  [/^nottingham forest$/i, 'نوتينغهام فورست'],
  [/^brentford$/i, 'برينتفورد'],
  [/^manchester united$/i, 'مانشستر يونايتد'],
  [/^west ham united$/i, 'وست هام يونايتد'],
  [/^afc bournemouth|bournemouth$/i, 'بورنموث'],
  [/^crystal palace$/i, 'كريستال بالاس'],
  [/^everton$/i, 'إيفرتون'],
  [/^wolverhampton wanderers|wolves$/i, 'وولفرهامبتون'],
  [/^leicester city$/i, 'ليستر سيتي'],
  [/^ipswich town$/i, 'إبسويتش تاون'],
  [/^southampton$/i, 'ساوثهامبتون'],
  [/^real madrid$/i, 'ريال مدريد'],
  [/^barcelona$/i, 'برشلونة'],
  [/^atletico madrid|atlético madrid$/i, 'أتلتيكو مدريد'],
  [/^athletic club|athletic bilbao$/i, 'أتلتيك بلباو'],
  [/^villarreal$/i, 'فياريال'],
  [/^real betis$/i, 'ريال بيتيس'],
  [/^real sociedad$/i, 'ريال سوسيداد'],
  [/^mallorca$/i, 'ريال مايوركا'],
  [/^rayo vallecano$/i, 'رايو فاليكانو'],
  [/^celta vigo$/i, 'سيلتا فيغو'],
  [/^osasuna$/i, 'أوساسونا'],
  [/^sevilla$/i, 'إشبيلية'],
  [/^girona$/i, 'جيرونا'],
  [/^getafe$/i, 'خيتافي'],
  [/^espanyol$/i, 'إسبانيول'],
  [/^leganes|leganés$/i, 'ليغانيس'],
  [/^las palmas$/i, 'لاس بالماس'],
  [/^valencia$/i, 'فالنسيا'],
  [/^alaves|alavés$/i, 'ديبورتيفو ألافيس'],
  [/^real valladolid$/i, 'بلد الوليد'],
  [/^internazionale|inter milan|inter$/i, 'إنتر ميلان'],
  [/^napoli$/i, 'نابولي'],
  [/^atalanta$/i, 'أتالانتا'],
  [/^juventus$/i, 'يوفنتوس'],
  [/^lazio$/i, 'لاتسيو'],
  [/^fiorentina$/i, 'فيورنتينا'],
  [/^bologna$/i, 'بولونيا'],
  [/^ac milan|milan$/i, 'إيه سي ميلان'],
  [/^as roma|roma$/i, 'روما'],
  [/^udinese$/i, 'أودينيزي'],
  [/^torino$/i, 'تورينو'],
  [/^genoa$/i, 'جنوى'],
  [/^como$/i, 'كومو'],
  [/^hellas verona|verona$/i, 'هيلاس فيرونا'],
  [/^cagliari$/i, 'كالياري'],
  [/^parma$/i, 'بارما'],
  [/^lecce$/i, 'ليتشي'],
  [/^empoli$/i, 'إمبولي'],
  [/^venezia$/i, 'فينيزيا'],
  [/^monza$/i, 'مونزا'],
  [/^bayern munich|fc bayern münchen$/i, 'بايرن ميونخ'],
  [/^bayer leverkusen$/i, 'باير ليفركوزن'],
  [/^eintracht frankfurt$/i, 'آينتراخت فرانكفورت'],
  [/^rb leipzig$/i, 'لايبزيغ'],
  [/^sc freiburg|freiburg$/i, 'فرايبورغ'],
  [/^mainz 05|mainz$/i, 'ماينز 05'],
  [/^borussia dortmund$/i, 'بوروسيا دورتموند'],
  [/^vfb stuttgart|stuttgart$/i, 'شتوتغارت'],
  [/^borussia monchengladbach|mönchengladbach$/i, 'بوروسيا مونشنغلادباخ'],
  [/^vfl wolfsburg|wolfsburg$/i, 'فولفسبورغ'],
  [/^werder bremen$/i, 'فيردر بريمن'],
  [/^fc augsburg|augsburg$/i, 'أوغسبورغ'],
  [/^union berlin$/i, 'يونيون برلين'],
  [/^st\.?\s*pauli$/i, 'سانت باولي'],
  [/^tsg hoffenheim|hoffenheim$/i, 'هوفنهايم'],
  [/^heidenheim$/i, 'هايدنهايم'],
  [/^vfl bochum|bochum$/i, 'بوخوم'],
  [/^holstein kiel$/i, 'هولشتاين كيل'],
  [/^paris saint-germain|psg$/i, 'باريس سان جيرمان'],
  [/^marseille|olympique de marseille$/i, 'أولمبيك مارسيليا'],
  [/^as monaco|monaco$/i, 'موناكو'],
  [/^nice|ogc nice$/i, 'نيس'],
  [/^lille|losc lille$/i, 'ليل'],
  [/^lyon|olympique lyonnais$/i, 'أولمبيك ليون'],
  [/^strasbourg$/i, 'ستراسبورغ'],
  [/^lens|rc lens$/i, 'لانس'],
  [/^brest|stade brestois$/i, 'ستاد بريست'],
  [/^toulouse$/i, 'تولوز'],
  [/^auxerre$/i, 'أوكسير'],
  [/^rennes|stade rennais$/i, 'رين'],
  [/^angers$/i, 'أنجيه'],
  [/^nantes|fc nantes$/i, 'نانت'],
  [/^reims|stade de reims$/i, 'ريمس'],
  [/^le havre$/i, 'لوهافر'],
  [/^saint-etienne|saint-étienne$/i, 'سانت إيتيان'],
  [/^montpellier$/i, 'مونبلييه'],
  [/^al hilal|al-hilal$/i, 'الهلال'],
  [/^al ittihad|al-ittihad$/i, 'الاتحاد'],
  [/^al nassr|al-nassr$/i, 'النصر'],
  [/^al qadsiah|al-qadsiah$/i, 'القادسية'],
  [/^al ahli|al-ahli$/i, 'الأهلي السعودي'],
  [/^al shabab|al-shabab$/i, 'الشباب'],
  [/^al ettifaq|al-ettifaq$/i, 'الاتفاق'],
  [/^al taawoun|al-taawoun$/i, 'التعاون'],
  [/^al riyadh|al-riyadh$/i, 'الرياض'],
  [/^al khaleej|al-khaleej$/i, 'الخليج']
];

export function translateTeamNameAr(name: string): string {
  const clean = name.trim();
  for (const [rx, ar] of EN_TO_AR_TEAM_MAP) {
    if (rx.test(clean)) return ar;
  }
  return clean;
}

export function parseEspnStandingsToArabic(
  espnJson: any,
  leagueInfo: LeagueInfo
): StandingRow[] | null {
  try {
    const entries =
      espnJson?.children?.[0]?.standings?.entries ||
      espnJson?.standings?.entries ||
      [];
    if (!Array.isArray(entries) || entries.length === 0) return null;

    const total = entries.length;
    const rows: StandingRow[] = entries.map((entry: any, idx: number) => {
      const rawName = entry?.team?.displayName || entry?.team?.name || `Team ${idx + 1}`;
      const logo = entry?.team?.logos?.[0]?.href || undefined;
      const stats: any[] = entry?.stats || [];
      const getStat = (statName: string, fallback = 0): number => {
        const found = stats.find((s: any) => s.name === statName || s.abbreviation === statName);
        return found && typeof found.value === 'number' ? found.value : fallback;
      };

      const rank = getStat('rank', idx + 1);
      const played = getStat('gamesPlayed', 0);
      const won = getStat('wins', 0);
      const drawn = getStat('ties', 0);
      const lost = getStat('losses', 0);
      const goalsFor = getStat('pointsFor', 0);
      const goalsAgainst = getStat('pointsAgainst', 0);
      const goalDiff = getStat('pointDifferential', goalsFor - goalsAgainst);
      const points = getStat('points', won * 3 + drawn);

      let zone: StandingRow['zone'] = 'normal';
      if (rank <= leagueInfo.clSpots) zone = 'ucl';
      else if (rank <= leagueInfo.clSpots + leagueInfo.elSpots) zone = 'uel';
      else if (rank > total - leagueInfo.relegationSpots) zone = 'relegation';

      return {
        rank,
        team: {
          name: translateTeamNameAr(rawName),
          logo
        },
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDiff,
        points,
        form: [],
        zone
      };
    });

    rows.sort((a, b) => a.rank - b.rank);
    return rows;
  } catch {
    return null;
  }
}

export function parseYallakoraStandingsHtml(
  html: string,
  leagueInfo: LeagueInfo
): { rows: StandingRow[]; season?: string } | null {
  try {
    if (!html || !html.includes('wRow')) return null;

    // Extract live season from <title> if present (e.g. "2026/2027" -> "2026 / 2027")
    let detectedSeason: string | undefined;
    const titleMatch = html.match(/<title>[^<]*?(\d{4})\s*\/\s*(\d{4})[^<]*?<\/title>/i);
    if (titleMatch) {
      detectedSeason = `${titleMatch[1]} / ${titleMatch[2]}`;
    }

    const rowParts = html.split(/<div class="wRow"/i).slice(1);
    if (rowParts.length === 0) return null;

    const parsedRaw: Array<{
      rank: number;
      name: string;
      logo?: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDiff: number;
      points: number;
    }> = [];

    rowParts.forEach((part, idx) => {
      const block = part.split(/<div class="wRow"|<\/section>/i)[0];
      const nameMatch = block.match(/<div class="item team"[\s\S]*?<p>\s*([\s\S]*?)\s*<\/p>/i);
      const rawName = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (!rawName || /اسرائيل|مكابي|هبوعيل/i.test(rawName)) return;

      const logoMatch = block.match(/<div class="item team"[\s\S]*?<img[^>]+src="([^"]+)"/i);
      const logo = logoMatch ? logoMatch[1].replace(/\\/g, '/').trim() : undefined;

      const arrngMatch = block.match(/<div class="item arrng">([\s\S]*?)<\/div>/i);
      const rankNum = arrngMatch
        ? parseInt(arrngMatch[1].replace(/<[^>]+>/g, '').trim(), 10)
        : NaN;
      const rank = !isNaN(rankNum) && rankNum > 0 ? rankNum : idx + 1;

      const dtls = [...block.matchAll(/<div class="item dtls">\s*(-?\d+)\s*<\/div>/gi)].map(m =>
        parseInt(m[1], 10)
      );
      if (dtls.length < 7) return;

      const played = dtls[0] || 0;
      const won = dtls[1] || 0;
      const drawn = dtls[2] || 0;
      const lost = dtls[3] || 0;
      const goalsFor = dtls[4] || 0;
      const goalsAgainst = dtls[5] || 0;
      const goalDiff = dtls.length >= 8 ? dtls[6] : goalsFor - goalsAgainst;
      const points = dtls.length >= 8 ? dtls[7] : dtls[6];

      parsedRaw.push({
        rank,
        name: rawName,
        logo,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDiff,
        points
      });
    });

    if (parsedRaw.length === 0) return null;

    const total = parsedRaw.length;
    const rows: StandingRow[] = parsedRaw.map((item, idx) => {
      const rank = idx + 1;
      let zone: StandingRow['zone'] = 'normal';
      if (rank <= leagueInfo.clSpots) zone = 'ucl';
      else if (rank <= leagueInfo.clSpots + leagueInfo.elSpots) zone = 'uel';
      else if (rank > total - leagueInfo.relegationSpots) zone = 'relegation';

      return {
        rank,
        team: {
          name: item.name,
          logo: item.logo
        },
        played: item.played,
        won: item.won,
        drawn: item.drawn,
        lost: item.lost,
        goalsFor: item.goalsFor,
        goalsAgainst: item.goalsAgainst,
        goalDiff: item.goalDiff,
        points: item.points,
        form: [],
        zone
      };
    });

    return { rows, season: detectedSeason };
  } catch {
    return null;
  }
}

export function buildMatchDetailsForMatch(match: LiveMatch): MatchDetailsData {
  return {
    matchId: match.id,
    stadium: '',
    referee: '',
    attendance: '',
    round: match.competition,
    events: [],
    lineupA: {
      formation: '4-3-3',
      coach: '',
      startingXI: [],
      substitutes: []
    },
    lineupB: {
      formation: '4-3-3',
      coach: '',
      startingXI: [],
      substitutes: []
    },
    stats: [],
    h2h: []
  };
}

export async function fetchViaCorsProxy(targetUrl: string, timeoutMs = 7000): Promise<string | null> {
  const attempts: Array<{ url: string; headers?: Record<string, string> }> = [
    { url: `https://r.jina.ai/${targetUrl}`, headers: { 'X-Return-Format': 'html' } },
    { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}` },
    { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` }
  ];

  try {
    const html = await Promise.any(
      attempts.map(async item => {
        const res = await fetch(item.url, {
          headers: item.headers,
          signal: AbortSignal.timeout(timeoutMs)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!text || text.length < 200) throw new Error('Empty response');
        return text;
      })
    );
    return html;
  } catch {
    return null;
  }
}

export async function fetchStandingsWithFallback(
  leagueId: string,
  apiEndpointUrl: string
): Promise<{ rows: StandingRow[]; season: string }> {
  const baseLeagueInfo = LEAGUES_CATALOG.find(l => l.id === leagueId) || LEAGUES_CATALOG[0];

  // 1. Try Backend / Cloudflare Worker API first
  try {
    const res = await fetch(apiEndpointUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5500)
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.standings) && data.standings.length > 0) {
          return {
            rows: data.standings,
            season: data.league?.season || baseLeagueInfo.season
          };
        }
      }
    }
  } catch {
    // Fall through to direct client-side live sources
  }

  // 2. Client-Side Fallback A & B in parallel:
  //    A) Yallakora Arabic Standings via CORS Proxy (covers all 9 leagues including Egypt & Morocco)
  //    B) Direct ESPN Standings API (CORS-enabled natively in browsers for EPL, LaLiga, SerieA, Bundesliga, Ligue1, UCL, Saudi)
  const ykPath = YALLAKORA_STANDING_PATHS[baseLeagueInfo.id];
  const espnSlug = ESPN_LEAGUE_SLUGS[baseLeagueInfo.id];

  const fetchYkClient = async (): Promise<{ rows: StandingRow[]; season: string } | null> => {
    if (!ykPath) return null;
    const html = await fetchViaCorsProxy(`https://www.yallakora.com${ykPath}`, 6500);
    if (!html) return null;
    const parsed = parseYallakoraStandingsHtml(html, baseLeagueInfo);
    if (parsed && parsed.rows.length > 0) {
      return {
        rows: parsed.rows,
        season: parsed.season || baseLeagueInfo.season
      };
    }
    return null;
  };

  const fetchEspnClient = async (): Promise<{ rows: StandingRow[]; season: string } | null> => {
    if (!espnSlug) return null;
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/v2/sports/soccer/${espnSlug}/standings`,
        { signal: AbortSignal.timeout(5500) }
      );
      if (!res.ok) return null;
      const espnJson = await res.json();
      const rows = parseEspnStandingsToArabic(espnJson, baseLeagueInfo);
      if (rows && rows.length > 0) {
        const espnSeasonMatch = String(
          espnJson?.children?.[0]?.standings?.seasonDisplayName ||
            espnJson?.seasons?.[0]?.displayName ||
            ''
        ).match(/(\d{4})[-/](\d{2,4})/);
        const liveSeason = espnSeasonMatch
          ? `${espnSeasonMatch[1]} / ${
              espnSeasonMatch[2].length === 2
                ? espnSeasonMatch[1].slice(0, 2) + espnSeasonMatch[2]
                : espnSeasonMatch[2]
            }`
          : baseLeagueInfo.season;
        return { rows, season: liveSeason };
      }
    } catch {
      // ignore
    }
    return null;
  };

  const [ykResult, espnResult] = await Promise.all([fetchYkClient(), fetchEspnClient()]);
  if (ykResult && ykResult.rows.length > 0) return ykResult;
  if (espnResult && espnResult.rows.length > 0) return espnResult;

  return { rows: [], season: baseLeagueInfo.season };
}

function inferPosFromFormation(idx: number, formation: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (idx === 0) return 'GK';
  const parts = formation
    .split('-')
    .map(n => parseInt(n, 10))
    .filter(n => !isNaN(n));
  const defCount = parts[0] || 4;
  const fwdCount = parts.length > 1 ? parts[parts.length - 1] : 3;
  if (idx <= defCount) return 'DEF';
  if (idx >= 11 - fwdCount) return 'FWD';
  return 'MID';
}

function mapEspnPosCode(posAbbr: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  const u = (posAbbr || '').toUpperCase();
  if (u === 'G' || u === 'GK') return 'GK';
  if (u.includes('D') || u.includes('B')) return 'DEF';
  if (u.includes('F') || u.includes('W') || u === 'ST' || u === 'CF') return 'FWD';
  return 'MID';
}

export function parseYallakoraEventsFromHtml(
  pageHtml: string,
  minPage2Html = ''
): MatchEventItem[] {
  const events: MatchEventItem[] = [];
  let evIdx = 0;

  const parseMinValue = (minStr: string): number => {
    const clean = minStr.replace(/[^0-9+]/g, '');
    if (clean.includes('+')) {
      const [base, extra] = clean.split('+');
      return (parseInt(base, 10) || 0) + (parseInt(extra, 10) || 0) * 0.1;
    }
    return parseInt(clean, 10) || 0;
  };

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
        const subIn =
          inner.match(/<span class="subIn">(.*?)<\/span>/s)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
        const subOut =
          inner.match(/<span class="subOut">(.*?)<\/span>/s)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
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
        const assist = inner
          .match(/<span class="assister">(.*?)<\/span>/s)?.[1]
          ?.replace(/[()]/g, '')
          .trim();
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
            assistOrSubOut: assist
              ? `تمريرة حاسمة: ${assist}`
              : cls.includes('pen')
              ? 'ركلة جزاء'
              : undefined
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

  // 2. Also parse live minute-by-minute (<ul id="minUl"> + Page 2)
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

      const extractedPlayer =
        desc
          .match(/(?:انذار|إنذار|بطاقة صفراء|بطاقة حمراء|طرد)\s+(?:لـ\s*|ل)?(.*?)(?:\s+لاعب\s+.*|$)/)?.[1]
          ?.trim() || desc;

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

  events.sort((a, b) => parseMinValue(a.minute) - parseMinValue(b.minute));
  return events;
}

export async function fetchMatchDetailsWithFallback(
  match: LiveMatch,
  apiEndpointUrl: string
): Promise<MatchDetailsData> {
  const baseDetails = buildMatchDetailsForMatch(match);

  // 1. Try Backend / Cloudflare Worker API first
  try {
    const res = await fetch(apiEndpointUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5500)
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && data.details) {
          const d: MatchDetailsData = data.details;
          if (
            d.events.length > 0 ||
            d.lineupA.startingXI.length > 0 ||
            d.stats.length > 0 ||
            d.h2h.length > 0
          ) {
            return d;
          }
        }
      }
    }
  } catch {
    // Fall through to client-side live fetch
  }

  // 2. Client-Side Fallback: Yallakora match page + ESPN summary API
  const ykMatch = match.id.match(/^yk_(\d+)$/);
  const ykId = ykMatch && parseInt(ykMatch[1], 10) > 1000 ? ykMatch[1] : null;

  if (ykId) {
    const [pageHtml, minPage2Html] = await Promise.all([
      fetchViaCorsProxy(`https://www.yallakora.com/Match/?matchID=${ykId}`, 6000),
      fetchViaCorsProxy(
        `https://www.yallakora.com/match/MatchMinByMinPaging?matchId=${ykId}&PageIndex=2&PageSize=30`,
        6000
      )
    ]);

    if (pageHtml) {
      const parsedEvents = parseYallakoraEventsFromHtml(pageHtml, minPage2Html || '');
      if (parsedEvents.length > 0) {
        baseDetails.events = parsedEvents;
      }
    }
  }

  // Also query ESPN Scoreboard & Summary API (CORS-enabled directly in browser)
  try {
    let espnEventId = match.id.startsWith('espn_') ? match.id.replace('espn_', '') : null;

    if (!espnEventId) {
      const sbRes = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard',
        { signal: AbortSignal.timeout(4500) }
      );
      if (sbRes.ok) {
        const sbJson = await sbRes.json();
        const events = sbJson?.events || [];
        for (const ev of events) {
          const compObj = ev?.competitions?.[0];
          const competitors = compObj?.competitors || [];
          if (competitors.length < 2) continue;
          const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
          const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];
          const rawHome = home?.team?.displayName || home?.team?.name || '';
          const rawAway = away?.team?.displayName || away?.team?.name || '';
          const arHome = translateTeamNameAr(rawHome);
          const arAway = translateTeamNameAr(rawAway);

          const matchA =
            match.teamA.name.includes(arHome) ||
            arHome.includes(match.teamA.name) ||
            match.teamA.name.toLowerCase() === rawHome.toLowerCase();
          const matchB =
            match.teamB.name.includes(arAway) ||
            arAway.includes(match.teamB.name) ||
            match.teamB.name.toLowerCase() === rawAway.toLowerCase();

          if ((matchA && matchB) || (matchA && ev.id) || (matchB && ev.id)) {
            if (matchA && matchB) {
              espnEventId = String(ev.id);
              break;
            }
          }
        }
      }
    }

    if (espnEventId) {
      const sumRes = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${encodeURIComponent(
          espnEventId
        )}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (sumRes.ok) {
        const json = await sumRes.json();
        if (json?.gameInfo?.venue?.fullName) {
          baseDetails.stadium = json.gameInfo.venue.fullName;
        }

        const rosters = json?.rosters || [];
        const homeRoster = rosters.find((r: any) => r.homeAway === 'home') || rosters[0];
        const awayRoster = rosters.find((r: any) => r.homeAway === 'away') || rosters[1];

        const parseRoster = (rObj: any): MatchLineupTeam => {
          const formation = rObj?.formation || '4-3-3';
          const list = Array.isArray(rObj?.roster) ? rObj.roster : [];
          const startingXI = list
            .filter((p: any) => p.starter)
            .map((p: any, idx: number) => ({
              number: parseInt(p.jersey || String(idx + 1), 10) || idx + 1,
              name: p.athlete?.displayName || p.athlete?.fullName || '',
              position: mapEspnPosCode(p.position?.abbreviation || ''),
              isCaptain: !!p.captain
            }))
            .filter((p: any) => p.name);

          const substitutes = list
            .filter((p: any) => !p.starter)
            .map((p: any, idx: number) => ({
              number: parseInt(p.jersey || String(idx + 12), 10) || idx + 12,
              name: p.athlete?.displayName || p.athlete?.fullName || '',
              position: mapEspnPosCode(p.position?.abbreviation || '')
            }))
            .filter((p: any) => p.name);

          return {
            formation,
            coach: 'المدير الفني',
            startingXI: startingXI.map((p: any, idx: number) => ({
              ...p,
              position: p.position || inferPosFromFormation(idx, formation)
            })),
            substitutes
          };
        };

        if (homeRoster && baseDetails.lineupA.startingXI.length === 0) {
          baseDetails.lineupA = parseRoster(homeRoster);
        }
        if (awayRoster && baseDetails.lineupB.startingXI.length === 0) {
          baseDetails.lineupB = parseRoster(awayRoster);
        }

        if (baseDetails.events.length === 0) {
          const homeTeamName = homeRoster?.team?.displayName || '';
          const keyEvents = json?.keyEvents || [];
          const espnEvents: MatchEventItem[] = [];
          keyEvents.forEach((ke: any, idx: number) => {
            const tCode = String(ke?.type?.type || ke?.type?.text || '').toLowerCase();
            const clock = ke?.clock?.displayValue || '';
            if (!clock) return;
            const isHome = ke?.team?.displayName === homeTeamName;
            const team: 'A' | 'B' = isHome ? 'A' : 'B';
            const p1 = ke?.participants?.[0]?.athlete?.displayName || '';
            const p2 = ke?.participants?.[1]?.athlete?.displayName || '';

            if (tCode.includes('goal') || ke?.scoringPlay) {
              espnEvents.push({
                id: `espn_ev_${idx}`,
                minute: clock,
                team,
                type: tCode.includes('penalty') ? 'penalty_goal' : 'goal',
                player: p1 || ke?.text || 'هدف',
                assistOrSubOut: p2 ? `تمريرة حاسمة: ${p2}` : undefined
              });
            } else if (tCode.includes('yellow') && p1) {
              espnEvents.push({
                id: `espn_ev_${idx}`,
                minute: clock,
                team,
                type: 'yellow_card',
                player: p1
              });
            } else if (tCode.includes('red') && p1) {
              espnEvents.push({
                id: `espn_ev_${idx}`,
                minute: clock,
                team,
                type: 'red_card',
                player: p1
              });
            } else if (tCode.includes('sub') && p1) {
              espnEvents.push({
                id: `espn_ev_${idx}`,
                minute: clock,
                team,
                type: 'sub',
                player: p1,
                assistOrSubOut: p2 ? `خروج: ${p2}` : undefined
              });
            }
          });
          if (espnEvents.length > 0) {
            baseDetails.events = espnEvents;
          }
        }

        const boxTeams = json?.boxscore?.teams || [];
        if (boxTeams.length >= 2 && baseDetails.stats.length === 0) {
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

          const parsedStats: MatchStatItem[] = [];
          for (const [key, label] of statDefs) {
            const vA = getStat(0, key);
            const vB = getStat(1, key);
            if (vA !== undefined && vB !== undefined) {
              const nA = parseFloat(vA) || 0;
              const nB = parseFloat(vB) || 0;
              const tot = nA + nB;
              parsedStats.push({
                label,
                valueA: key === 'possessionPct' ? `${vA}%` : vA,
                valueB: key === 'possessionPct' ? `${vB}%` : vB,
                percentA: tot > 0 ? Math.round((nA / tot) * 100) : 50,
                percentB: tot > 0 ? Math.round((nB / tot) * 100) : 50
              });
            }
          }
          baseDetails.stats = parsedStats;
        }
      }
    }
  } catch {
    // ignore
  }

  return baseDetails;
}

export async function fetchMatchesByDateWithFallback(
  dateKey: 'yesterday' | 'today' | 'tomorrow',
  apiEndpointUrl: string
): Promise<LiveMatch[]> {
  try {
    const res = await fetch(apiEndpointUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5500)
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.matches) && data.matches.length > 0) {
          return data.matches;
        }
      }
    }
  } catch {
    // Fall through to client-side Yallakora date scraper
  }

  const now = new Date();
  const meccaNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  if (dateKey === 'yesterday') meccaNow.setUTCDate(meccaNow.getUTCDate() - 1);
  else if (dateKey === 'tomorrow') meccaNow.setUTCDate(meccaNow.getUTCDate() + 1);
  const mm = String(meccaNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(meccaNow.getUTCDate()).padStart(2, '0');
  const yyyy = meccaNow.getUTCFullYear();
  const ykDate = `${mm}/${dd}/${yyyy}`;
  const ykUrl = `https://www.yallakora.com/matches-center?date=${encodeURIComponent(ykDate)}`;

  const html = await fetchViaCorsProxy(ykUrl, 6500);
  if (!html) return [];

  const liveList: LiveMatch[] = [];
  let matchIdx = 0;
  const cards = html.split(/<div[^>]*class="[^"]*matchCard[^"]*"[^>]*>/);

  for (let i = 1; i < cards.length; i++) {
    const card = cards[i];
    const tournMatch = card.match(/class="tourTitle"[^>]*>(.*?)<\/a>/s);
    const tournament = tournMatch ? tournMatch[1].replace(/<[^>]+>/g, '').trim() : 'مباراة رسمية';
    if (/طائرة|يد|سلة|قسم ثاني|القسم الثاني|درجة ثانية|هواة/i.test(tournament)) continue;

    const items = card.split(/<div[^>]*livescorematchid=/i);
    for (let j = 1; j < items.length; j++) {
      const item = 'livescorematchid=' + items[j];
      const ykIdMatch = item.match(/livescorematchid=["'](\d+)["']/i) || item.match(/\/match\/(\d+)\//i);
      const ykMatchId = ykIdMatch ? ykIdMatch[1] : null;
      const teamA = item.match(/class="teams teamA".*?<p>(.*?)<\/p>/s)?.[1]?.trim();
      const teamB = item.match(/class="teams teamB".*?<p>(.*?)<\/p>/s)?.[1]?.trim();
      if (!teamA || !teamB) continue;
      if (/إسرائيل|الكيان|مكابي|هابويل|هبوعيل|تل أبيب|بئر سبع|بيتار|سخنين|maccabi|hapoel/i.test(`${teamA} ${teamB}`)) continue;

      const rawChannel = item.match(/<div class="channel[^"]*">(.*?)<\/div>/)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const mergedChannels: Array<{ channel_id: number; channel_name: string; quality: string; isBeinArabic: boolean }> = [];
      const beinNumMatch =
        rawChannel.match(/(?:bein\s*sports?|ب[يى]\s*إن\s*سبورت|ب[يى]\s*ان\s*سبورت)\s*(\d+)/i) ||
        rawChannel.match(/(\d+)\s*(?:ب[يى]\s*إن\s*سبورت|ب[يى]\s*ان\s*سبورت)/i);
      if (beinNumMatch) {
        const num = parseInt(beinNumMatch[1], 10);
        const chId = 90 + num;
        if (chId >= 91 && chId <= 99) {
          mergedChannels.push({
            channel_id: chId,
            channel_name: `beIN Sports ${num} HD`,
            quality: '1080p FHD',
            isBeinArabic: true
          });
        }
      }

      const timeStr = item.match(/class="time">(.*?)<\/span>/)?.[1]?.trim() || '21:00';
      const rawStatus = item.match(/class="matchStatus[^"]*".*?<span>(.*?)<\/span>/s)?.[1]?.replace(/<[^>]+>/g, '').trim() || 'لم تبدأ';
      let status: 'LIVE' | 'FIXTURE' | 'RESULT' = 'FIXTURE';
      if (/مباشر|شوط|استراحة|الان|الآن/i.test(rawStatus)) status = 'LIVE';
      else if (/انتهت/i.test(rawStatus)) status = 'RESULT';

      const scores = [...item.matchAll(/<span class="score">([0-9]+)<\/span>/g)].map(m => parseInt(m[1], 10));
      const scoreA = scores.length > 0 ? scores[0] : null;
      const scoreB = scores.length > 1 ? scores[1] : null;

      const logoA = item.match(/class="teams teamA".*?<img[^>]*src="([^"]+)"/s)?.[1]?.replace(/\\/g, '/');
      const logoB = item.match(/class="teams teamB".*?<img[^>]*src="([^"]+)"/s)?.[1]?.replace(/\\/g, '/');

      const hasBeinAr = mergedChannels.some(c => c.isBeinArabic);
      const broadcasterLabel =
        mergedChannels.length > 0
          ? mergedChannels.slice(0, 3).map(c => c.channel_name).join(' / ')
          : rawChannel || 'غير منقولة تلفزيونياً';

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

  return liveList;
}



