import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Channel, LiveMatch, BroadcastInfo } from '../types';

export type ThemeId = 'stadium' | 'champions' | 'royal' | 'arena' | 'daylight';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  primaryColor: string;
  bgPreview: string;
  isLight?: boolean;
}

export const APP_THEMES: ThemeOption[] = [
  {
    id: 'stadium',
    name: 'المدرج الأخضر',
    subtitle: 'أخضر زمردي احترافي',
    primaryColor: '#10b981',
    bgPreview: 'linear-gradient(135deg, #061510 0%, #0b291e 50%, #10b981 100%)'
  },
  {
    id: 'champions',
    name: 'ليالي الأبطال',
    subtitle: 'أزرق ملكي وسماوي',
    primaryColor: '#38bdf8',
    bgPreview: 'linear-gradient(135deg, #060d1f 0%, #0f2547 50%, #38bdf8 100%)'
  },
  {
    id: 'royal',
    name: 'الملكي الذهبي',
    subtitle: 'فخامة الأسود والذهب',
    primaryColor: '#f59e0b',
    bgPreview: 'linear-gradient(135deg, #120f07 0%, #2b2108 50%, #f59e0b 100%)'
  },
  {
    id: 'arena',
    name: 'الحلبة القرمزية',
    subtitle: 'أحمر ناري حماسي',
    primaryColor: '#f43f5e',
    bgPreview: 'linear-gradient(135deg, #17070b 0%, #380d18 50%, #f43f5e 100%)'
  },
  {
    id: 'daylight',
    name: 'النهار الساطع',
    subtitle: 'وضع فاتح مريح للعين',
    primaryColor: '#059669',
    bgPreview: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #10b981 100%)',
    isLight: true
  }
];

interface AppContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  channels: Channel[];
  loadingChannels: boolean;
  channelsError: string | null;
  matches: LiveMatch[];
  loadingMatches: boolean;
  matchesError: string | null;
  epg: Record<number, BroadcastInfo>;
  loadingEpg: boolean;
  getChannelBroadcast: (channelId: number) => BroadcastInfo | null;
  favorites: number[];
  toggleFavorite: (channelId: number) => void;
  isFavorite: (channelId: number) => boolean;
  watchHistory: number[];
  addToWatchHistory: (channelId: number) => void;
  clearWatchHistory: () => void;
  multiViewIds: number[];
  toggleMultiViewId: (channelId: number) => void;
  setMultiViewIds: React.Dispatch<React.SetStateAction<number[]>>;
  matchReminders: string[];
  toggleMatchReminder: (matchId: string) => void;
  isMatchReminderSet: (matchId: string) => boolean;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  activeStreamingChannel: Channel | null;
  setActiveStreamingChannel: (channel: Channel | null) => void;
  refreshChannels: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  refreshEpg: () => Promise<void>;
  lastMatchesUpdated: Date | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'kolstream_favorite_channels';
const HISTORY_STORAGE_KEY = 'kolstream_watch_history';
const REMINDERS_STORAGE_KEY = 'kolstream_match_reminders';
const THEME_STORAGE_KEY = 'kolstream_ui_theme';

export const getApiUrl = (endpoint: string): string => {
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || '';
  if (envBase) {
    const cleanBase = String(envBase).replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
  }
  return endpoint;
};

export const STATIC_CHANNELS: Channel[] = [
  // beIN Sports Arabic 1-9 (Qatar)
  { id: 91, name: 'beIN Sports 1 Arabic', arabicName: 'بي إن سبورت 1 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'القناة الرئيسية لأقوى قمم الدوري الإنجليزي ودوري أبطال أوروبا' },
  { id: 92, name: 'beIN Sports 2 Arabic', arabicName: 'بي إن سبورت 2 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'الدوري الإسباني (لا ليغا) ومباريات ريال مدريد وبرشلونة' },
  { id: 93, name: 'beIN Sports 3 Arabic', arabicName: 'بي إن سبورت 3 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'الدوري الإيطالي (سيريا آ) ودوري أبطال أوروبا' },
  { id: 94, name: 'beIN Sports 4 Arabic', arabicName: 'بي إن سبورت 4 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'الدوري الفرنسي (ليغ 1) والدوريات الأوروبية' },
  { id: 95, name: 'beIN Sports 5 Arabic', arabicName: 'بي إن سبورت 5 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'البطولات الإفريقية ودوري أبطال إفريقيا' },
  { id: 96, name: 'beIN Sports 6 Arabic', arabicName: 'بي إن سبورت 6 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'الدوري الألماني والبطولات الآسيوية' },
  { id: 97, name: 'beIN Sports 7 Arabic', arabicName: 'بي إن سبورت 7 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'تغطيات حية للمباريات المتزامنة والرياضات المتنوعة' },
  { id: 98, name: 'beIN Sports 8 Arabic', arabicName: 'بي إن سبورت 8 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'مباريات مباشرة وألعاب القوى والتنس العالمي' },
  { id: 99, name: 'beIN Sports 9 Arabic', arabicName: 'بي إن سبورت 9 HD', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'بث مباشر للأحداث الرياضية والبطولات الأولمبية' },
  { id: 578, name: 'beIN Sports News HD Qatar', arabicName: 'بي إن سبورت الإخبارية', category: 'ar', subcat: 'bein_ar', quality: '1080p FHD', lang: 'عربي', country: 'QA', description: 'نشرات إخبارية رياضية متواصلة وتقارير الملاعب على مدار 24 ساعة' },
  { id: 61, name: 'beIN Sports MENA English 1', arabicName: 'بي إن سبورت الإنجليزية 1 HD', category: 'bein', subcat: 'bein_mena', quality: '1080p FHD', lang: 'English', country: 'QA', description: 'Premier League & Champions League English Studio & Commentary' },
  { id: 90, name: 'beIN Sports MENA English 2', arabicName: 'بي إن سبورت الإنجليزية 2 HD', category: 'bein', subcat: 'bein_mena', quality: '1080p FHD', lang: 'English', country: 'QA', description: 'English football coverage & European sports events' },
  { id: 100, name: 'beIN SPORTS XTRA 1', arabicName: 'بي إن سبورت إكسترا 1', category: 'bein', subcat: 'bein_xtra', quality: '1080p FHD', lang: 'English', country: 'USA', description: 'Major international sports, Ligue 1 & Copa Libertadores' },
  { id: 425, name: 'beIN SPORTS USA', arabicName: 'بي إن سبورت الأمريكية HD', category: 'bein', subcat: 'bein_us', quality: '1080p FHD', lang: 'English', country: 'US', description: 'American broadcast for La Liga, Ligue 1 & motorsports' },
  { id: 372, name: 'beIN SPORTS en Español', arabicName: 'بي إن سبورت الإسبانية (USA)', category: 'bein', subcat: 'bein_es', quality: '1080p FHD', lang: 'Spanish', country: 'US', description: 'Transmisión en vivo en español de los mejores partidos europeos' },
  // beIN Sports France
  { id: 116, name: 'beIN SPORTS 1 France', arabicName: 'بي إن سبورت 1 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR', description: 'UEFA Champions League & Ligue 2 en direct' },
  { id: 117, name: 'beIN SPORTS 2 France', arabicName: 'بي إن سبورت 2 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR', description: 'Liga, Serie A, Bundesliga et NBA' },
  { id: 118, name: 'beIN SPORTS 3 France', arabicName: 'بي إن سبورت 3 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR', description: 'Omnisports, handball, tennis et sports mécaniques' },
  { id: 494, name: 'beIN Sports MAX 4 France', arabicName: 'بي إن سبورت ماكس 4 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 495, name: 'beIN Sports MAX 5 France', arabicName: 'بي إن سبورت ماكس 5 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 496, name: 'beIN Sports MAX 6 France', arabicName: 'بي إن سبورت ماكس 6 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 497, name: 'beIN Sports MAX 7 France', arabicName: 'بي إن سبورت ماكس 7 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 498, name: 'beIN Sports MAX 8 France', arabicName: 'بي إن سبورت ماكس 8 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 499, name: 'beIN Sports MAX 9 France', arabicName: 'بي إن سبورت ماكس 9 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 500, name: 'beIN Sports MAX 10 France', arabicName: 'بي إن سبورت ماكس 10 الفرنسية', category: 'bein', subcat: 'bein_fr', quality: '1080p FHD', lang: 'French', country: 'FR' },
  // Eurosport Network
  { id: 772, name: 'Eurosport 1 France', arabicName: 'يوروسبورت 1 الفرنسية HD', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'French', country: 'FR', description: 'Les plus grands événements sportifs mondiaux en direct' },
  { id: 773, name: 'Eurosport 2 France', arabicName: 'يوروسبورت 2 الفرنسية HD', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'French', country: 'FR', description: 'Sports d hiver, cyclisme et tennis Grand Chelem' },
  { id: 524, name: 'EuroSport 1 Spain', arabicName: 'يوروسبورت 1 الإسبانية', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Spanish', country: 'ES' },
  { id: 525, name: 'EuroSport 2 Spain', arabicName: 'يوروسبورت 2 الإسبانية', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Spanish', country: 'ES' },
  { id: 878, name: 'EuroSport 1 Italy', arabicName: 'يوروسبورت 1 الإيطالية', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Italian', country: 'IT' },
  { id: 879, name: 'EuroSport 2 Italy', arabicName: 'يوروسبورت 2 الإيطالية', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Italian', country: 'IT' },
  { id: 57, name: 'EuroSport 1 Poland', arabicName: 'يوروسبورت 1 بولندا', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Polish', country: 'PL' },
  { id: 58, name: 'EuroSport 2 Poland', arabicName: 'يوروسبورت 2 بولندا', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Polish', country: 'PL' },
  { id: 41, name: 'EuroSport 1 Greece', arabicName: 'يوروسبورت 1 اليونان', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Greek', country: 'GR' },
  { id: 42, name: 'EuroSport 2 Greece', arabicName: 'يوروسبورت 2 اليونان', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Greek', country: 'GR' },
  { id: 233, name: 'Eurosport 1 Netherlands', arabicName: 'يوروسبورت 1 هولندا', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Dutch', country: 'NL' },
  { id: 234, name: 'Eurosport 2 Netherlands', arabicName: 'يوروسبورت 2 هولندا', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Dutch', country: 'NL' },
  { id: 231, name: 'Eurosport 1 Nordic', arabicName: 'يوروسبورت 1 السويد/النورديك', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Swedish', country: 'SE' },
  { id: 232, name: 'Eurosport 2 Nordic', arabicName: 'يوروسبورت 2 السويد/النورديك', category: 'euro', subcat: 'eurosport', quality: '1080p FHD', lang: 'Swedish', country: 'SE' },
  // Arena Sport & Balkan Premium
  { id: 134, name: 'Arena Sport 1 Premium', arabicName: 'أرينا سبورت 1 بريميوم', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', country: 'RS', description: 'Premier League, Champions League and top tier European football' },
  { id: 135, name: 'Arena Sport 2 Premium', arabicName: 'أرينا سبورت 2 بريميوم', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', country: 'RS' },
  { id: 139, name: 'Arena Sport 3 Premium', arabicName: 'أرينا سبورت 3 بريميوم', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', country: 'RS' },
  { id: 429, name: 'Arena Sport 1 Serbia', arabicName: 'أرينا سبورت 1 صربيا', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', country: 'RS' },
  { id: 430, name: 'Arena Sport 2 Serbia', arabicName: 'أرينا سبورت 2 صربيا', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Serbian', country: 'RS' },
  { id: 432, name: 'Arena Sport 1 Croatia', arabicName: 'أرينا سبورت 1 كرواتيا', category: 'euro', subcat: 'arena', quality: '1080p FHD', lang: 'Croatian', country: 'HR' },
  // Astro SuperSport & Asia
  { id: 123, name: 'Astro SuperSport 1', arabicName: 'أسترو سوبر سبورت 1 (ماليزيا)', category: 'euro', subcat: 'astro', quality: '1080p FHD', lang: 'English', country: 'MY', description: 'English Premier League 24/7 dedicated broadcast' },
  { id: 124, name: 'Astro SuperSport 2', arabicName: 'أسترو سوبر سبورت 2 (ماليزيا)', category: 'euro', subcat: 'astro', quality: '1080p FHD', lang: 'English', country: 'MY' },
  // Turkey & Australia beIN
  { id: 62, name: 'beIN SPORTS 1 Turkey', arabicName: 'بي إن سبورت 1 تركيا', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', country: 'TR', description: 'Süper Lig & European football coverage' },
  { id: 63, name: 'beIN SPORTS 2 Turkey', arabicName: 'بي إن سبورت 2 تركيا', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', country: 'TR' },
  { id: 64, name: 'beIN SPORTS 3 Turkey', arabicName: 'بي إن سبورت 3 تركيا', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', country: 'TR' },
  { id: 67, name: 'beIN SPORTS 4 Turkey', arabicName: 'بي إن سبورت 4 تركيا', category: 'bein', subcat: 'bein_tr', quality: '1080p FHD', lang: 'Turkish', country: 'TR' },
  { id: 491, name: 'beIN SPORTS Australia 1', arabicName: 'بي إن سبورت أستراليا 1', category: 'bein', subcat: 'bein_au', quality: '1080p FHD', lang: 'English', country: 'AU' },
  { id: 492, name: 'beIN SPORTS Australia 2', arabicName: 'بي إن سبورت أستراليا 2', category: 'bein', subcat: 'bein_au', quality: '1080p FHD', lang: 'English', country: 'AU' },
  { id: 493, name: 'beIN SPORTS Australia 3', arabicName: 'بي إن سبورت أستراليا 3', category: 'bein', subcat: 'bein_au', quality: '1080p FHD', lang: 'English', country: 'AU' },
  // Top International Soccer Event Channels
  { id: 55, name: 'Paramount+ Sports HD', arabicName: 'باراماونت بلس سبورتس', category: 'other', subcat: 'us_sports', quality: '1080p FHD', lang: 'English', country: 'US', description: 'UEFA Champions League, Serie A & NWSL' },
  { id: 156, name: 'Liga 1 Max Peru HD', arabicName: 'ليغا 1 ماكس البيروفية', category: 'other', subcat: 'south_america', quality: '1080p FHD', lang: 'Spanish', country: 'PE' },
  { id: 181, name: 'TNT Sports 1 UK', arabicName: 'تي إن تي سبورتس 1 بريطانيا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'English', country: 'UK', description: 'Premier League, UEFA Champions League & European sports' },
  { id: 182, name: 'TNT Sports 2 UK', arabicName: 'تي إن تي سبورتس 2 بريطانيا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'English', country: 'UK' },
  { id: 183, name: 'TNT Sports 3 UK', arabicName: 'تي إن تي سبورتس 3 بريطانيا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'English', country: 'UK' },
  { id: 201, name: 'Sky Sports Main Event UK', arabicName: 'سكاي سبورتس مين إيفنت', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'English', country: 'UK', description: 'Premier League, F1, boxing and marquee sports' },
  { id: 202, name: 'Sky Sports Premier League UK', arabicName: 'سكاي سبورتس بريمير ليج', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'English', country: 'UK' },
  { id: 203, name: 'Sky Sports Football UK', arabicName: 'سكاي سبورتس فوتبول', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'English', country: 'UK' },
  { id: 301, name: 'DAZN 1 Bar HD', arabicName: 'دازون 1 HD', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'German', country: 'DE', description: 'Bundesliga, UEFA Champions League, La Liga & Serie A' },
  { id: 302, name: 'DAZN 2 Bar HD', arabicName: 'دازون 2 HD', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'German', country: 'DE' },
  { id: 310, name: 'Canal+ Sport France', arabicName: 'كانال بلوس سبورت فرنسا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 311, name: 'Canal+ Foot France', arabicName: 'كانال بلوس فوت فرنسا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'French', country: 'FR' },
  { id: 320, name: 'Movistar LaLiga Spain', arabicName: 'موفيستار لا ليغا إسبانيا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'Spanish', country: 'ES' },
  { id: 321, name: 'Movistar Liga de Campeones', arabicName: 'موفيستار دوري أبطال أوروبا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'Spanish', country: 'ES' },
  { id: 330, name: 'Sport TV 1 Portugal', arabicName: 'سبورت تي في 1 البرتغال', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'Portuguese', country: 'PT' },
  { id: 331, name: 'Sport TV 2 Portugal', arabicName: 'سبورت تي في 2 البرتغال', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'Portuguese', country: 'PT' },
  { id: 340, name: 'Ziggo Sport Select NL', arabicName: 'زيغو سبورت هولندا', category: 'euro', subcat: 'euro_sports', quality: '1080p FHD', lang: 'Dutch', country: 'NL' },
  { id: 350, name: 'ESPN USA HD', arabicName: 'إي إس بي إن الأمريكية HD', category: 'other', subcat: 'us_sports', quality: '1080p FHD', lang: 'English', country: 'US' },
  { id: 351, name: 'ESPN 2 USA HD', arabicName: 'إي إس بي إن 2 الأمريكية HD', category: 'other', subcat: 'us_sports', quality: '1080p FHD', lang: 'English', country: 'US' }
];

export const STATIC_MATCHES: LiveMatch[] = [
  {
    id: 'static_match_1',
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
      { channel_id: 61, channel_name: 'beIN Sports MENA English 1', quality: '1080p FHD', isBeinArabic: false },
      { channel_id: 202, channel_name: 'Sky Sports Premier League UK', quality: '1080p FHD', isBeinArabic: false }
    ],
    commentator: 'حفيظ دراجي',
    isBeinArabic: true,
    broadcasterLabel: 'beIN Sports 1 HD',
    network: 'bein_ar'
  },
  {
    id: 'static_match_2',
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
      { channel_id: 92, channel_name: 'beIN Sports 2 HD', quality: '1080p FHD', isBeinArabic: true },
      { channel_id: 320, channel_name: 'Movistar LaLiga Spain', quality: '1080p FHD', isBeinArabic: false }
    ],
    commentator: 'عصام الشوالي',
    isBeinArabic: true,
    broadcasterLabel: 'beIN Sports 1 HD / beIN Sports 2 HD',
    network: 'bein_ar'
  },
  {
    id: 'static_match_3',
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
      { channel_id: 116, channel_name: 'beIN SPORTS 1 France', quality: '1080p FHD', isBeinArabic: false },
      { channel_id: 181, channel_name: 'TNT Sports 1 UK', quality: '1080p FHD', isBeinArabic: false }
    ],
    commentator: 'خليل البلوشي',
    isBeinArabic: true,
    broadcasterLabel: 'beIN Sports 3 HD',
    network: 'bein_ar'
  },
  {
    id: 'static_match_4',
    competition: 'الدوري الإيطالي (سيريا آ)',
    teamA: { name: 'إنتر ميلان', logo: 'https://media.api-sports.io/football/teams/505.png' },
    teamB: { name: 'يوفنتوس', logo: 'https://media.api-sports.io/football/teams/496.png' },
    scoreA: null,
    scoreB: null,
    status: 'FIXTURE',
    statusText: 'لم تبدأ بعد',
    minute: null,
    time: '21:45 بتوقيت مكة',
    localTime: '21:45 بتوقيت مكة',
    channels: [
      { channel_id: 94, channel_name: 'beIN Sports 4 HD', quality: '1080p FHD', isBeinArabic: true },
      { channel_id: 878, channel_name: 'EuroSport 1 Italy', quality: '1080p FHD', isBeinArabic: false }
    ],
    commentator: 'عامر عبد الله',
    isBeinArabic: true,
    broadcasterLabel: 'beIN Sports 4 HD',
    network: 'bein_ar'
  },
  {
    id: 'static_match_5',
    competition: 'الدوري الإنجليزي الممتاز',
    teamA: { name: 'أرسنال', logo: 'https://media.api-sports.io/football/teams/42.png' },
    teamB: { name: 'تشيلسي', logo: 'https://media.api-sports.io/football/teams/49.png' },
    scoreA: null,
    scoreB: null,
    status: 'FIXTURE',
    statusText: 'لم تبدأ بعد',
    minute: null,
    time: '19:30 بتوقيت مكة',
    localTime: '19:30 بتوقيت مكة',
    channels: [
      { channel_id: 91, channel_name: 'beIN Sports 1 HD', quality: '1080p FHD', isBeinArabic: true },
      { channel_id: 61, channel_name: 'beIN Sports MENA English 1', quality: '1080p FHD', isBeinArabic: false }
    ],
    commentator: 'علي محمد علي',
    isBeinArabic: true,
    broadcasterLabel: 'beIN Sports 1 HD',
    network: 'bein_ar'
  }
];

export const STATIC_EPG: Record<number, BroadcastInfo> = {
  91: { channelId: 91, programTitle: 'الدوري الإنجليزي الممتاز: ليفربول ضد مانشستر سيتي', category: 'كرة قدم', tournament: 'الدوري الإنجليزي الممتاز', isLive: true, isMatch: true, startTime: '18:30 بتوقيت مكة', commentator: 'حفيظ دراجي' },
  92: { channelId: 92, programTitle: 'الدوري الإسباني (لا ليغا): ريال مدريد ضد برشلونة (الكلاسيكو)', category: 'كرة قدم', tournament: 'الدوري الإسباني', isLive: false, isMatch: true, startTime: '21:00 بتوقيت مكة', commentator: 'عصام الشوالي' },
  93: { channelId: 93, programTitle: 'دوري أبطال أوروبا: بايرن ميونخ ضد باريس سان جيرمان', category: 'كرة قدم', tournament: 'دوري أبطال أوروبا', isLive: true, isMatch: true, startTime: '22:00 بتوقيت مكة', commentator: 'خليل البلوشي' },
  94: { channelId: 94, programTitle: 'الدوري الإيطالي: إنتر ميلان ضد يوفنتوس', category: 'كرة قدم', tournament: 'الدوري الإيطالي', isLive: false, isMatch: true, startTime: '21:45 بتوقيت مكة', commentator: 'عامر عبد الله' },
  578: { channelId: 578, programTitle: 'الحصاد الرياضي – أخبار الملاعب وتحليلات الجولة', category: 'أخبار ورياضة', tournament: 'نشرة أخبار beIN', isLive: true, isMatch: false, startTime: 'مستمر 24/7' }
};

const CHANNELS_CACHE_KEY = 'kolstream_cached_channels_v2';
const MATCHES_CACHE_KEY = 'kolstream_cached_matches_v2';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && APP_THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'stadium';
  });

  const setTheme = useCallback((nextTheme: ThemeId) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize channels with cached data or bundled static catalog (NEVER 0 channels)
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const cached = localStorage.getItem(CHANNELS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return STATIC_CHANNELS;
  });
  const [loadingChannels, setLoadingChannels] = useState<boolean>(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  // Initialize matches with cached data or static fallback
  const [matches, setMatches] = useState<LiveMatch[]>(() => {
    try {
      const cached = localStorage.getItem(MATCHES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return STATIC_MATCHES;
  });
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [lastMatchesUpdated, setLastMatchesUpdated] = useState<Date | null>(() => new Date());

  const [epg, setEpg] = useState<Record<number, BroadcastInfo>>(() => STATIC_EPG);
  const [loadingEpg, setLoadingEpg] = useState<boolean>(false);

  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [watchHistory, setWatchHistory] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [matchReminders, setMatchReminders] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [multiViewIds, setMultiViewIds] = useState<number[]>([]);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [activeStreamingChannel, setActiveStreamingChannel] = useState<Channel | null>(null);

  const toggleFavorite = useCallback((channelId: number) => {
    setFavorites(prev => {
      const next = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((channelId: number) => {
    return favorites.includes(channelId);
  }, [favorites]);

  const addToWatchHistory = useCallback((channelId: number) => {
    if (!channelId || isNaN(channelId)) return;
    setWatchHistory(prev => {
      const filtered = prev.filter(id => id !== channelId);
      const next = [channelId, ...filtered].slice(0, 16);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearWatchHistory = useCallback(() => {
    setWatchHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const toggleMultiViewId = useCallback((channelId: number) => {
    setMultiViewIds(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), channelId];
      }
      return [...prev, channelId];
    });
  }, []);

  const toggleMatchReminder = useCallback((matchId: string) => {
    setMatchReminders(prev => {
      const next = prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId];
      try {
        localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isMatchReminderSet = useCallback((matchId: string) => {
    return matchReminders.includes(matchId);
  }, [matchReminders]);

  const fetchChannels = useCallback(async () => {
    setChannelsError(null);
    try {
      const targetUrl = getApiUrl('/api/channels');
      const res = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000)
      });

      const contentType = res.headers.get('content-type') || '';
      // If 404 or static host returns HTML doctype (e.g. Cloudflare Pages SPA rewrite)
      if (!res.ok || !contentType.includes('application/json')) {
        setChannels(prev => (prev.length > 0 ? prev : STATIC_CHANNELS));
        return;
      }

      const data = await res.json();
      if (data && data.success && Array.isArray(data.channels) && data.channels.length > 0) {
        setChannels(data.channels);
        try {
          localStorage.setItem(CHANNELS_CACHE_KEY, JSON.stringify(data.channels));
        } catch {
          // ignore
        }
      } else {
        setChannels(prev => (prev.length > 0 ? prev : STATIC_CHANNELS));
      }
    } catch {
      // Always preserve bundled or cached channels; never reset to 0
      setChannels(prev => (prev.length > 0 ? prev : STATIC_CHANNELS));
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const targetUrl = getApiUrl('/api/live-matches');
      const res = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000)
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        setMatches(prev => (prev.length > 0 ? prev : STATIC_MATCHES));
        return;
      }

      const data = await res.json();
      if (data && data.success && Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
        setLastMatchesUpdated(new Date());
        try {
          localStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(data.matches));
        } catch {
          // ignore
        }
      } else {
        setMatches(prev => (prev.length > 0 ? prev : STATIC_MATCHES));
      }
    } catch {
      setMatches(prev => (prev.length > 0 ? prev : STATIC_MATCHES));
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  const fetchEpg = useCallback(async () => {
    try {
      const targetUrl = getApiUrl('/api/epg/live');
      const res = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4500)
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) return;
      const data = await res.json();
      if (data && data.success && data.epg) {
        setEpg(data.epg);
      }
    } catch {
      // Graceful fallback to existing EPG
    } finally {
      setLoadingEpg(false);
    }
  }, []);

  const getChannelBroadcast = useCallback((channelId: number): BroadcastInfo | null => {
    if (epg[channelId]) {
      return epg[channelId];
    }
    const activeMatch = matches.find(m => m.channels && m.channels.some(c => c.channel_id === channelId));
    if (activeMatch) {
      return {
        channelId,
        programTitle: `${activeMatch.competition}: ${activeMatch.teamA.name} ${activeMatch.scoreA !== null ? `${activeMatch.scoreA} - ${activeMatch.scoreB}` : 'ضد'} ${activeMatch.teamB.name}`,
        category: activeMatch.competition,
        tournament: activeMatch.competition,
        isLive: activeMatch.status === 'LIVE',
        isMatch: true,
        match: activeMatch,
        startTime: activeMatch.time,
        commentator: activeMatch.commentator
      };
    }
    return null;
  }, [epg, matches]);

  useEffect(() => {
    fetchChannels();
    fetchMatches();
    fetchEpg();
  }, [fetchChannels, fetchMatches, fetchEpg]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches();
      fetchEpg();
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchMatches, fetchEpg]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        channels,
        loadingChannels,
        channelsError,
        matches,
        loadingMatches,
        matchesError,
        epg,
        loadingEpg,
        getChannelBroadcast,
        favorites,
        toggleFavorite,
        isFavorite,
        watchHistory,
        addToWatchHistory,
        clearWatchHistory,
        multiViewIds,
        toggleMultiViewId,
        setMultiViewIds,
        matchReminders,
        toggleMatchReminder,
        isMatchReminderSet,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        activeStreamingChannel,
        setActiveStreamingChannel,
        refreshChannels: fetchChannels,
        refreshMatches: fetchMatches,
        refreshEpg: fetchEpg,
        lastMatchesUpdated
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
