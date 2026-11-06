/**
 * Links a fixture from an Arabic source (Yallakora/ESPN Arabic names) to an
 * English event (DaddyLive) only when BOTH teams match the same fixture.
 *
 * The old matcher tested every keyword against the concatenated "Team A Team B"
 * strings, so a single loose keyword could attach an unrelated event's whole
 * channel pack (including beIN) to a random match. This matcher resolves each
 * side separately and requires the pairing to line up.
 */

export interface TeamEventLike {
  teamA: string;
  teamB: string;
  meccaTime?: string;
  competition?: string;
}

interface TeamAlias {
  ar: RegExp;
  en: RegExp;
}

const TEAM_ALIASES: TeamAlias[] = [
  { ar: /ليفربول/, en: /liverpool/i },
  { ar: /برايتون/, en: /brighton/i },
  { ar: /مانشستر يونايتد/, en: /manchester united/i },
  { ar: /مانشستر سيتي/, en: /manchester city/i },
  { ar: /بورنموث/, en: /bournemouth/i },
  { ar: /برينتفورد/, en: /brentford/i },
  { ar: /كريستال بالاس/, en: /crystal palace/i },
  { ar: /نيوكاسل/, en: /newcastle/i },
  { ar: /سندرلاند/, en: /sunderland/i },
  { ar: /ليدز/, en: /leeds/i },
  { ar: /أرسنال|آرسنال/, en: /arsenal/i },
  { ar: /تشيلسي/, en: /chelsea/i },
  { ar: /توتنهام/, en: /tottenham/i },
  { ar: /أستون فيلا/, en: /aston villa/i },
  { ar: /برشلونة/, en: /barcelona/i },
  { ar: /ريال مدريد/, en: /real madrid/i },
  { ar: /أتلتيكو مدريد/, en: /atletico madrid|atlético/i },
  { ar: /بلباو/, en: /athletic club|bilbao/i },
  { ar: /خيتافي/, en: /getafe/i },
  { ar: /سيلتا فيجو/, en: /celta/i },
  { ar: /ريال بيتيس/, en: /betis/i },
  { ar: /ريال سوسيداد/, en: /real sociedad/i },
  { ar: /ليفانتي/, en: /levante/i },
  { ar: /إشبيلية/, en: /sevilla/i },
  { ar: /فالنسيا/, en: /valencia/i },
  { ar: /فياريال/, en: /villarreal/i },
  { ar: /بايرن ميونخ|بايرن ميونيخ/, en: /bayern/i },
  { ar: /فرايبورج|فرايبورغ/, en: /freiburg/i },
  { ar: /باير ليفركوزن|ليفركوزن/, en: /leverkusen/i },
  { ar: /هوفنهايم/, en: /hoffenheim/i },
  { ar: /دورتموند/, en: /dortmund/i },
  { ar: /لايبزيج|لايبزيغ/, en: /leipzig/i },
  { ar: /فرانكفورت/, en: /frankfurt/i },
  { ar: /شتوتجارت/, en: /stuttgart/i },
  { ar: /يوفنتوس/, en: /juventus/i },
  { ar: /ليتشي/, en: /lecce/i },
  { ar: /إنتر ميلان|انتر ميلان/, en: /internazionale|inter\b/i },
  { ar: /فيورنتينا/, en: /fiorentina/i },
  { ar: /ميلان/, en: /\bmilan\b/i },
  { ar: /أودينيزي/, en: /udinese/i },
  { ar: /أتالانتا/, en: /atalanta/i },
  { ar: /فروزينوني/, en: /frosinone/i },
  { ar: /نابولي/, en: /napoli/i },
  { ar: /روما/, en: /\broma\b/i },
  { ar: /لاتسيو/, en: /lazio/i },
  { ar: /جنوى/, en: /genoa/i },
  { ar: /فينيزيا/, en: /venezia/i },
  { ar: /باريس سان جيرمان/, en: /psg|paris saint/i },
  { ar: /ليون/, en: /lyon/i },
  { ar: /مارسيليا/, en: /marseille/i },
  { ar: /موناكو/, en: /monaco/i },
  { ar: /ليل/, en: /\blille\b/i },
  { ar: /رين/, en: /rennes/i },
  { ar: /ستراسبورج|ستراسبورغ/, en: /strasbourg/i },
  { ar: /تولوز/, en: /toulouse/i },
  { ar: /تروا/, en: /troyes/i },
  { ar: /أنجيه/, en: /angers/i },
  { ar: /لوريان/, en: /lorient/i },
  { ar: /أوكسير|اوكسير/, en: /auxerre/i },
  { ar: /سبورتنج لشبونة|سبورتينج لشبونة/, en: /sporting cp/i },
  { ar: /سبورتنج براجا|براجا/, en: /braga/i },
  { ar: /ناسيونال/, en: /nacional/i },
  { ar: /بنفيكا/, en: /benfica/i },
  { ar: /بورتو/, en: /porto/i },
  { ar: /جوزتيبي/, en: /goztepe|göztepe/i },
  { ar: /كونيا سبور/, en: /konyaspor/i },

  // Saudi Pro League / روشن
  { ar: /الهلال/, en: /\bal[ -]?hilal\b/i },
  { ar: /النصر/, en: /\bal[ -]?nassr\b/i },
  { ar: /الاتحاد/, en: /\bal[ -]?ittihad\b/i },
  { ar: /الأهلي|الاهلي/, en: /\bal[ -]?ahli\b/i },
  { ar: /الشباب/, en: /\bal[ -]?shabab\b/i },
  { ar: /الاتفاق/, en: /\bal[ -]?ettifaq\b/i },
  { ar: /التعاون/, en: /\bal[ -]?taawoun\b/i },
  { ar: /الفتح/, en: /\bal[ -]?fateh\b/i },
  { ar: /الخليج/, en: /\bal[ -]?khaleej\b/i },
  { ar: /الرياض/, en: /\bal[ -]?riyadh\b/i },
  { ar: /الفيحاء/, en: /\bal[ -]?fayha\b/i },
  { ar: /الأخدود|الاخدود/, en: /\bal[ -]?okhdood\b/i },
  { ar: /الخلود/, en: /\bal[ -]?kholood\b/i },
  { ar: /القادسية/, en: /\bal[ -]?qadsiah\b/i },
  { ar: /ضمك/, en: /\bdamac\b/i },
  { ar: /الحزم/, en: /\bal[ -]?hazem\b/i },
  { ar: /النجمة/, en: /\bal[ -]?najma\b/i },
  { ar: /العروبة/, en: /\bal[ -]?orobah\b/i },
  { ar: /الرائد/, en: /\bal[ -]?raed\b/i },
  { ar: /الوحدة/, en: /\bal[ -]?wehda\b/i }
];

function findAlias(team: string): TeamAlias | undefined {
  return TEAM_ALIASES.find(alias => alias.ar.test(team) || alias.en.test(team));
}

function cleanTeamName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u0640\u064b-\u065f\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\b(?:fc|sc|cf|club|football|نادي|فريق)\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function directTeamMatch(first: string, second: string): boolean {
  const a = cleanTeamName(first);
  const b = cleanTeamName(second);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4) {
    return a.includes(b) || b.includes(a);
  }
  return false;
}

function sideMatches(side: string, alias: TeamAlias): boolean {
  return alias.ar.test(side) || alias.en.test(side);
}

function parseMinutes(value?: string | null): number | null {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function competitionMatches(kickoffCompetition: string | undefined, eventCompetition: string | undefined): boolean {
  if (!kickoffCompetition || !eventCompetition) return false;
  const a = cleanTeamName(kickoffCompetition);
  const b = cleanTeamName(eventCompetition);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function pairMatches(
  firstTeam: string,
  secondTeam: string,
  firstAlias: TeamAlias | undefined,
  secondAlias: TeamAlias | undefined,
  eventA: string,
  eventB: string
): boolean {
  if (firstAlias && secondAlias) {
    const straight =
      sideMatches(eventA, firstAlias) && sideMatches(eventB, secondAlias);
    const swapped =
      sideMatches(eventB, firstAlias) && sideMatches(eventA, secondAlias);
    return straight || swapped;
  }

  if (firstAlias || secondAlias) {
    const knownAlias = firstAlias || secondAlias!;
    const otherTeam = firstAlias ? secondTeam : firstTeam;
    const straight = sideMatches(eventA, knownAlias) && directTeamMatch(eventB, otherTeam);
    const swapped = sideMatches(eventB, knownAlias) && directTeamMatch(eventA, otherTeam);
    return straight || swapped;
  }

  return (
    (directTeamMatch(eventA, firstTeam) && directTeamMatch(eventB, secondTeam)) ||
    (directTeamMatch(eventB, firstTeam) && directTeamMatch(eventA, secondTeam))
  );
}

/**
 * Finds the single DaddyLive event that represents the same fixture.
 * Returns null when both teams cannot be verified, so no foreign channels are
 * merged into a match.
 */
export function findEventForTeams<T extends TeamEventLike>(
  teamA: string,
  teamB: string,
  kickoffTime: string | null | undefined,
  events: T[],
  kickoffCompetition?: string
): T | null {
  if (!teamA || !teamB || events.length === 0) return null;

  const aliasA = findAlias(teamA);
  const aliasB = findAlias(teamB);
  const kickoffMinutes = parseMinutes(kickoffTime);

  let bestEvent: T | null = null;
  let bestScore = 0;

  for (const event of events) {
    if (/women|frauen|u17|u19|u21/i.test(event.competition || '')) continue;
    if (!pairMatches(teamA, teamB, aliasA, aliasB, event.teamA, event.teamB)) continue;

    const eventMinutes = parseMinutes(event.meccaTime);
    if (kickoffMinutes !== null && eventMinutes !== null) {
      const diff = Math.abs(kickoffMinutes - eventMinutes);
      // Same fixture on a different day/time is not a safe link.
      if (diff > 150) continue;
    }

    let score = 20;
    if (kickoffMinutes !== null && eventMinutes !== null) {
      const diff = Math.abs(kickoffMinutes - eventMinutes);
      if (diff <= 45) score += 10;
      else if (diff <= 90) score += 5;
    }
    if (competitionMatches(kickoffCompetition, event.competition)) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestEvent = event;
    }
  }

  return bestScore >= 20 ? bestEvent : null;
}
