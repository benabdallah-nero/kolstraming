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
