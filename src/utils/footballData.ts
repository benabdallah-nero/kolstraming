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
  [/^al khaleej|al-khaleej$/i, 'الخليج'],
  [/^al fateh|al-fateh$/i, 'الفتح'],
  [/^al fayha|al-fayha$/i, 'الفيحاء'],
  [/^al okhdood|al-okhdood$/i, 'الأخدود'],
  [/^al kholood|al-kholood$/i, 'الخلود'],
  [/^damac$/i, 'ضمك'],
  [/^al hazem|al-hazem$/i, 'الحزم'],
  [/^al najma|al-najma$/i, 'النجمة'],
  [/^al orobah|al-orobah$/i, 'العروبة'],
  [/^al raed|al-raed$/i, 'الرائد'],
  [/^al wehda|al-wehda$/i, 'الوحدة']
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
      formation: '',
      coach: '',
      startingXI: [],
      substitutes: []
    },
    lineupB: {
      formation: '',
      coach: '',
      startingXI: [],
      substitutes: []
    },
    stats: [],
    h2h: []
  };
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
    // Network failure: return no standings rather than scraping in the browser.
  }

  return { rows: [], season: baseLeagueInfo.season };
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
    // Network failure: return no details rather than scraping in the browser.
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
    // Network failure: return no data instead of scraping third-party sites.
  }

  return [];




