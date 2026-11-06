export interface Channel {
  id: number;
  name: string;
  category: 'ar' | 'bein' | 'euro' | 'football' | 'other';
  subcat?: string;
  quality: string;
  lang: string;
  country: string;
  logo?: string;
  arabicName?: string;
  description?: string;
}

export interface StreamServer {
  serverName: string;
  folder: string;
  embedUrl: string;
  watchUrl: string;
  isRecommended?: boolean;
}

export interface ScheduleChannel {
  channel_name: string;
  channel_id: string;
}

export interface ScheduleEvent {
  time: string;
  event: string;
  channels: ScheduleChannel[];
  sportCategory?: string;
  isLive?: boolean;
}

export interface LiveMatchChannel {
  channel_id: number;
  channel_name: string;
  quality?: string;
  isBeinArabic?: boolean;
}

export interface LiveMatch {
  id: string;
  competition: string;
  teamA: {
    name: string;
    logo?: string;
  };
  teamB: {
    name: string;
    logo?: string;
  };
  scoreA: number | null;
  scoreB: number | null;
  status: 'LIVE' | 'FIXTURE' | 'RESULT';
  statusText?: string;
  minute?: number | string | null;
  time: string;
  localTime?: string;
  channels: LiveMatchChannel[];
  commentator?: string;
  isBeinArabic: boolean;
  broadcasterLabel: string;
  network: 'bein_ar' | 'alkass' | 'ssc' | 'other' | 'unbroadcast';
}

export interface ScraperServer {
  serverName: string;
  url: string;
  headers?: Record<string, string>;
}

export interface ScraperChannelData {
  id: number;
  name: string;
  servers: ScraperServer[];
}

export interface ExpoFile {
  name: string;
  path: string;
  description: string;
  language: string;
  content: string;
}

export interface BroadcastInfo {
  channelId: number;
  programTitle: string;
  category: string;
  tournament?: string;
  isLive: boolean;
  isMatch: boolean;
  match?: LiveMatch;
  startTime?: string;
  endTime?: string;
  commentator?: string;
}

export type QualityResolution = 'auto' | '1080p' | '720p' | '480p' | '360p';

export interface QualityOption {
  id: QualityResolution;
  label: string;
  badge: string;
  description: string;
  bitrateEstimate: string;
}

export type MatchDateKey = 'yesterday' | 'today' | 'tomorrow';

export interface LeagueInfo {
  id: string;
  name: string;
  shortName: string;
  country: string;
  region: 'europe' | 'arab' | 'continental';
  season: string;
  clSpots: number;
  elSpots: number;
  relegationSpots: number;
}

export interface StandingRow {
  rank: number;
  team: {
    name: string;
    logo?: string;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: Array<'W' | 'D' | 'L'>;
  zone?: 'ucl' | 'uel' | 'relegation' | 'normal';
}

export interface MatchEventItem {
  id: string;
  minute: string;
  team: 'A' | 'B';
  type: 'goal' | 'penalty_goal' | 'yellow_card' | 'red_card' | 'sub';
  player: string;
  assistOrSubOut?: string;
  detail?: string;
}

export interface MatchLineupPlayer {
  number: number;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  isCaptain?: boolean;
  rating?: string;
}

export interface MatchLineupTeam {
  formation: string;
  coach: string;
  startingXI: MatchLineupPlayer[];
  substitutes: MatchLineupPlayer[];
}

export interface MatchStatItem {
  label: string;
  valueA: string | number;
  valueB: string | number;
  percentA: number;
  percentB: number;
}

export interface MatchH2HItem {
  date: string;
  competition: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
}

export interface MatchDetailsData {
  matchId: string;
  stadium: string;
  referee: string;
  attendance?: string;
  round?: string;
  events: MatchEventItem[];
  lineupA: MatchLineupTeam;
  lineupB: MatchLineupTeam;
  stats: MatchStatItem[];
  h2h: MatchH2HItem[];
}

