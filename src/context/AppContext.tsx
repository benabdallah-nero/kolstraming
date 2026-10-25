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

// Helper to fetch external HTML from browser when deployed on static-only hosting (e.g. Cloudflare static assets)
async function fetchHtmlViaCorsProxy(targetUrl: string): Promise<string | null> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200) {
          return text;
        }
      }
    } catch {
      // try next proxy
    }
  }
  return null;
}

function isExcludedChannelName(rawName: string): boolean {
  return /ssc|alkass|al kass|abu dhabi|ad sport|dubai|israel|5plus|sport\s*[1-5]\s*il|yes\s*sport|one\s*il/i.test(rawName);
}

function categorizeChannelClient(name: string): { category: 'ar' | 'bein' | 'euro' | 'other'; subcat: string; lang: string } {
  const lower = name.toLowerCase();
  if (lower.includes('bein')) {
    if (lower.includes('arabic') || /bein\s*sports?\s*(mena\s*)?[1-9]\b/i.test(lower)) {
      if (lower.includes('english')) return { category: 'bein', subcat: 'bein_mena', lang: 'English' };
      if (!lower.includes('france') && !lower.includes('turkey') && !lower.includes('australia') && !lower.includes('malaysia')) {
        return { category: 'ar', subcat: 'bein_ar', lang: 'عربي' };
      }
    }
    if (lower.includes('france') || lower.includes('max')) return { category: 'bein', subcat: 'bein_fr', lang: 'French' };
    if (lower.includes('turkey')) return { category: 'bein', subcat: 'bein_tr', lang: 'Turkish' };
    if (lower.includes('australia')) return { category: 'bein', subcat: 'bein_au', lang: 'English' };
    if (lower.includes('usa') || lower.includes('xtra')) return { category: 'bein', subcat: 'bein_us', lang: 'English' };
    if (lower.includes('español')) return { category: 'bein', subcat: 'bein_es', lang: 'Spanish' };
    return { category: 'bein', subcat: 'bein_global', lang: 'Multilingual' };
  }
  if (/euro|arena|astro|sky sport|tnt sport|dazn|espn|canal\+|paramount|supersport|super sport|premier sport|sport tv|eleven sport|ziggo|viaplay|movistar|laliga|ligue1/i.test(lower)) {
    return { category: 'euro', subcat: 'euro_sports', lang: 'European' };
  }
  return { category: 'other', subcat: 'global', lang: 'International' };
}

function decodeHtmlEntitiesClient(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{26BD}\u{1F3C6}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const TEAM_TRANSLATION_KEYWORDS_CLIENT: Array<[RegExp, RegExp]> = [
  [/ليفربول/i, /liverpool/i],
  [/برايتون/i, /brighton/i],
  [/مانشستر يونايتد/i, /manchester united/i],
  [/مانشستر سيتي/i, /manchester city/i],
  [/بورنموث/i, /bournemouth/i],
  [/برينتفورد/i, /brentford/i],
  [/كريستال بالاس/i, /crystal palace/i],
  [/نيوكاسل/i, /newcastle/i],
  [/سندرلاند/i, /sunderland/i],
  [/ليدز/i, /leeds/i],
  [/أرسنال|آرسنال/i, /arsenal/i],
  [/تشيلسي/i, /chelsea/i],
  [/توتنهام/i, /tottenham/i],
  [/أستون فيلا/i, /aston villa/i],
  [/برشلونة/i, /barcelona/i],
  [/ريال مدريد/i, /real madrid/i],
  [/أتلتيكو مدريد/i, /atletico madrid|atlético/i],
  [/بلباو/i, /athletic club|bilbao/i],
  [/خيتافي/i, /getafe/i],
  [/سيلتا فيجو/i, /celta/i],
  [/ريال بيتيس/i, /betis/i],
  [/ريال سوسيداد/i, /real sociedad/i],
  [/إشبيلية/i, /sevilla/i],
  [/فالنسيا/i, /valencia/i],
  [/فياريال/i, /villarreal/i],
  [/بايرن ميونخ|بايرن ميونيخ/i, /bayern/i],
  [/ليفركوزن/i, /leverkusen/i],
  [/دورتموند/i, /dortmund/i],
  [/لايبزيج|لايبزيغ/i, /leipzig/i],
  [/فرانكفورت/i, /frankfurt/i],
  [/شتوتجارت/i, /stuttgart/i],
  [/يوفنتوس/i, /juventus/i],
  [/إنتر ميلان|انتر ميلان/i, /internazionale|inter\b/i],
  [/فيورنتينا/i, /fiorentina/i],
  [/ميلان/i, /\bmilan\b/i],
  [/أتالانتا/i, /atalanta/i],
  [/نابولي/i, /napoli/i],
  [/روما/i, /\broma\b/i],
  [/لاتسيو/i, /lazio/i],
  [/باريس سان جيرمان/i, /psg|paris saint/i],
  [/ليون/i, /lyon/i],
  [/مارسيليا/i, /marseille/i],
  [/موناكو/i, /monaco/i],
  [/ليل/i, /\blille\b/i],
  [/سبورتنج لشبونة|سبورتينج لشبونة/i, /sporting cp/i],
  [/بنفيكا/i, /benfica/i],
  [/بورتو/i, /porto/i]
];

const COMPETITION_AR_MAP_CLIENT: Array<[RegExp, string]> = [
  [/england\s*-\s*premier league/i, 'الدوري الإنجليزي الممتاز'],
  [/spain\s*-\s*la\s*liga/i, 'الدوري الإسباني (لا ليغا)'],
  [/italy\s*-\s*serie a/i, 'الدوري الإيطالي (سيريا آ)'],
  [/germany\s*-\s*bundesliga/i, 'الدوري الألماني (البوندسليغا)'],
  [/france\s*-\s*ligue 1/i, 'الدوري الفرنسي (ليغ 1)'],
  [/portugal\s*-\s*primeira liga/i, 'الدوري البرتغالي الممتاز'],
  [/uefa champions league/i, 'دوري أبطال أوروبا'],
  [/uefa europa league/i, 'الدوري الأوروبي'],
  [/turkey\s*-\s*super lig/i, 'الدوري التركي الممتاز'],
  [/netherlands\s*-\s*eredivisie/i, 'الدوري الهولندي']
];

function translateCompetitionClient(comp: string): string {
  for (const [rx, ar] of COMPETITION_AR_MAP_CLIENT) {
    if (rx.test(comp)) return ar;
  }
  return comp;
}

interface ClientDliveEvent {
  id: string;
  gmtTime: string;
  meccaTime: string;
  gmtMinutes: number;
  competition: string;
  teamA: string;
  teamB: string;
  status: 'LIVE' | 'FIXTURE' | 'RESULT';
  statusText: string;
  minute: string | null;
  channels: Array<{ channel_id: number; channel_name: string; quality: string; isBeinArabic: boolean }>;
}

async function scrapeDliveCatalogClient(): Promise<{ events: ClientDliveEvent[]; discoveredChannels: Channel[] }> {
  const events: ClientDliveEvent[] = [];
  const channelMap = new Map<number, Channel>();
  const html = await fetchHtmlViaCorsProxy('https://dlive.sx/index.php?cat=All+Soccer+Events+%E2%9A%BD');
  if (!html) return { events, discoveredChannels: [] };

  const blocks = html.split(/<div class="schedule__event">/);
  const now = new Date();
  const nowUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const rawTime = block.match(/class="schedule__time"[^>]*>(.*?)<\/span>/)?.[1]?.trim() || '00:00';
    const rawTitle = block.match(/class="schedule__eventTitle"[^>]*>([\s\S]*?)<\/span>/)?.[1] || '';
    const cleanTitle = decodeHtmlEntitiesClient(rawTitle.replace(/<[^>]+>/g, ''));
    if (!cleanTitle || !cleanTitle.toLowerCase().includes(' vs ')) continue;
    if (/israel|maccabi|hapoel|beitar|bnei sakhnin/i.test(cleanTitle)) continue;

    let competition = 'مباريات كرة القدم العالمية';
    let teamsPart = cleanTitle;
    const colonIdx = cleanTitle.indexOf(':');
    if (colonIdx !== -1) {
      competition = cleanTitle.slice(0, colonIdx).trim();
      teamsPart = cleanTitle.slice(colonIdx + 1).trim();
    }

    const vsParts = teamsPart.split(/\s+vs\s+/i);
    if (vsParts.length < 2) continue;
    const teamA = vsParts[0].trim();
    const teamB = vsParts.slice(1).join(' vs ').trim();

    const [hhStr, mmStr] = rawTime.split(':');
    const gmtH = parseInt(hhStr || '0', 10);
    const gmtM = parseInt(mmStr || '0', 10);
    const gmtMinutes = gmtH * 60 + gmtM;
    const meccaH = (gmtH + 3) % 24;
    const meccaTime = `${String(meccaH).padStart(2, '0')}:${String(gmtM).padStart(2, '0')}`;

    let diff = nowUtcMinutes - gmtMinutes;
    if (diff < -720) diff += 1440;
    let status: 'LIVE' | 'FIXTURE' | 'RESULT' = 'FIXTURE';
    let statusText = 'لم تبدأ بعد';
    let minute: string | null = null;

    if (diff >= 0 && diff <= 115) {
      status = 'LIVE';
      if (diff <= 45) {
        statusText = 'الشوط الأول';
        minute = `${Math.max(1, diff)}'`;
      } else if (diff <= 60) {
        statusText = 'استراحة ما بين الشوطين';
        minute = 'HT';
      } else {
        const secHalfMin = Math.min(90, 45 + (diff - 60));
        statusText = 'الشوط الثاني';
        minute = `${secHalfMin}'`;
      }
    } else if (diff > 115 && diff < 600) {
      status = 'RESULT';
      statusText = 'انتهت';
    }

    const chLinks = [...block.matchAll(/href=["']\/watch\.php\?id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/g)];
    const eventChannels: Array<{ channel_id: number; channel_name: string; quality: string; isBeinArabic: boolean }> = [];
    const seenInEvent = new Set<number>();

    for (const m of chLinks) {
      const chId = parseInt(m[1], 10);
      const chName = decodeHtmlEntitiesClient(m[2].replace(/<[^>]+>/g, ''));
      if (!chId || !chName || seenInEvent.has(chId) || isExcludedChannelName(chName)) continue;
      seenInEvent.add(chId);

      const isBeinAr = (chId >= 91 && chId <= 99) || chId === 578 || /bein\s*sports\s*mena\s*[1-9]\b/i.test(chName);
      const displayName = isBeinAr && chId >= 91 && chId <= 99 ? `beIN Sports ${chId - 90} HD` : chName;

      eventChannels.push({
        channel_id: chId,
        channel_name: displayName,
        quality: '1080p FHD',
        isBeinArabic: isBeinAr
      });

      const existing = channelMap.get(chId);
      const isGenericEventStream = /event\s*(sd\s*)?stream/i.test(chName);
      if (!existing || (/event\s*(sd\s*)?stream/i.test(existing.name) && !isGenericEventStream)) {
        const { category, subcat, lang } = categorizeChannelClient(chName);
        const finalName = isGenericEventStream ? `${chName} #${chId} (${teamA} vs ${teamB})` : chName;
        channelMap.set(chId, {
          id: chId,
          name: finalName,
          category,
          subcat,
          quality: '1080p FHD',
          lang,
          country: 'Global',
          description: `${competition}: ${teamA} vs ${teamB} (${meccaTime} بتوقيت مكة)`
        });
      }
    }

    events.push({
      id: `dlive_ev_${i}_${gmtMinutes}`,
      gmtTime: rawTime,
      meccaTime,
      gmtMinutes,
      competition,
      teamA,
      teamB,
      status,
      statusText,
      minute,
      channels: eventChannels
    });
  }

  return { events, discoveredChannels: Array.from(channelMap.values()) };
}

async function scrapeRealMatchesClientSide(): Promise<{ matches: LiveMatch[]; discoveredChannels: Channel[] }> {
  const [ykHtml, dliveCatalog] = await Promise.all([
    fetchHtmlViaCorsProxy('https://www.yallakora.com/matches-center'),
    scrapeDliveCatalogClient()
  ]);

  const dliveEvents = dliveCatalog.events;
  const matchedDliveIds = new Set<string>();
  const liveList: LiveMatch[] = [];
  let matchIdx = 0;

  if (ykHtml) {
    const cards = ykHtml.split(/<div[^>]*class="[^"]*matchCard[^"]*"[^>]*>/);
    for (let i = 1; i < cards.length; i++) {
      const card = cards[i];
      const tournMatch = card.match(/class="tourTitle"[^>]*>(.*?)<\/a>/s);
      let tournament = tournMatch ? tournMatch[1].replace(/<[^>]+>/g, '').trim() : 'مباراة رسمية';
      if (/طائرة|يد|سلة|قسم ثاني|القسم الثاني|درجة ثانية|هواة/i.test(tournament)) continue;

      const items = card.split(/<div class="allData">/);
      for (let j = 1; j < items.length; j++) {
        const item = items[j];
        const teamA = item.match(/class="teams teamA".*?<p>(.*?)<\/p>/s)?.[1]?.trim();
        const teamB = item.match(/class="teams teamB".*?<p>(.*?)<\/p>/s)?.[1]?.trim();
        if (!teamA || !teamB) continue;
        if (/إسرائيل|الكيان|مكابي|هابويل|هبوعيل|تل أبيب|بئر سبع|بيتار|سخنين|maccabi|hapoel/i.test(`${teamA} ${teamB}`)) continue;

        const rawChannel = item.match(/<div class="channel[^"]*">(.*?)<\/div>/)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
        const mergedChannels: Array<{ channel_id: number; channel_name: string; quality: string; isBeinArabic: boolean }> = [];
        const beinNumMatch = rawChannel.match(/(?:bein\s*sports?|ب[يى]\s*إن\s*سبورت|ب[يى]\s*ان\s*سبورت)\s*(\d+)/i) || rawChannel.match(/(\d+)\s*(?:ب[يى]\s*إن\s*سبورت|ب[يى]\s*ان\s*سبورت)/i);
        if (beinNumMatch) {
          const num = parseInt(beinNumMatch[1], 10);
          const chId = 90 + num;
          if (chId >= 91 && chId <= 99) {
            mergedChannels.push({ channel_id: chId, channel_name: `beIN Sports ${num} HD`, quality: '1080p FHD', isBeinArabic: true });
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

        // Match Arabic teams to DaddyLive events
        const arCombined = `${teamA} ${teamB}`;
        for (const ev of dliveEvents) {
          const enCombined = `${ev.teamA} ${ev.teamB}`;
          let matched = false;
          for (const [arRx, enRx] of TEAM_TRANSLATION_KEYWORDS_CLIENT) {
            if (arRx.test(arCombined) && enRx.test(enCombined)) {
              matched = true;
              break;
            }
          }
          if (matched) {
            matchedDliveIds.add(ev.id);
            const seenIds = new Set(mergedChannels.map(c => c.channel_id));
            for (const dch of ev.channels) {
              if (!seenIds.has(dch.channel_id)) {
                mergedChannels.push(dch);
                seenIds.add(dch.channel_id);
              }
            }
            break;
          }
        }

        const hasBeinAr = mergedChannels.some(c => c.isBeinArabic);
        const broadcasterLabel = mergedChannels.length > 0
          ? mergedChannels.slice(0, 3).map(c => c.channel_name).join(' / ')
          : rawChannel || 'غير منقولة تلفزيونياً';

        matchIdx++;
        liveList.push({
          id: `yk_${matchIdx}`,
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
  }

  for (const ev of dliveEvents) {
    if (matchedDliveIds.has(ev.id) || ev.channels.length === 0) continue;
    const hasBeinAr = ev.channels.some(c => c.isBeinArabic);
    liveList.push({
      id: ev.id,
      competition: translateCompetitionClient(ev.competition),
      teamA: { name: ev.teamA },
      teamB: { name: ev.teamB },
      scoreA: null,
      scoreB: null,
      status: ev.status,
      statusText: ev.statusText,
      minute: ev.minute,
      time: `${ev.meccaTime} بتوقيت مكة`,
      localTime: `${ev.meccaTime} بتوقيت مكة`,
      channels: ev.channels.slice(0, 6),
      isBeinArabic: hasBeinAr,
      broadcasterLabel: ev.channels.slice(0, 3).map(c => c.channel_name).join(' / '),
      network: hasBeinAr ? 'bein_ar' : 'other'
    });
  }

  liveList.sort((a, b) => {
    const order: Record<string, number> = { LIVE: 0, FIXTURE: 1, RESULT: 2 };
    const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
    if (diff !== 0) return diff;
    const aScore = a.isBeinArabic ? 2 : a.channels.length > 0 ? 1 : 0;
    const bScore = b.isBeinArabic ? 2 : b.channels.length > 0 ? 1 : 0;
    return bScore - aScore;
  });

  return { matches: liveList, discoveredChannels: dliveCatalog.discoveredChannels };
}

const CHANNELS_CACHE_KEY = 'kolstream_cached_channels_v3';
const MATCHES_CACHE_KEY = 'kolstream_cached_matches_v3';

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

  // Initialize channels with cached data or verified base channels
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
  const [loadingChannels, setLoadingChannels] = useState<boolean>(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  // Initialize matches empty (NO fake hardcoded matches!) and load real matches from API or live scraper
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
    return [];
  });
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [lastMatchesUpdated, setLastMatchesUpdated] = useState<Date | null>(null);

  const [epg, setEpg] = useState<Record<number, BroadcastInfo>>({});
  const [loadingEpg, setLoadingEpg] = useState<boolean>(true);

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
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.channels) && data.channels.length > 0) {
          setChannels(data.channels);
          try {
            localStorage.setItem(CHANNELS_CACHE_KEY, JSON.stringify(data.channels));
          } catch {}
          return;
        }
      }

      // If /api/channels returned HTML (static Cloudflare host without backend), scrape live 24/7 channels directly
      const html247 = await fetchHtmlViaCorsProxy('https://dlive.sx/24-7-channels.php');
      if (html247) {
        const merged: Channel[] = [...STATIC_CHANNELS];
        const knownIds = new Set<number>(merged.map(c => c.id));
        const regex = /href=["']\/watch\.php\?id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/g;
        let match;
        while ((match = regex.exec(html247)) !== null) {
          const id = parseInt(match[1], 10);
          if (!knownIds.has(id)) {
            const rawName = decodeHtmlEntitiesClient(match[2].replace(/<[^>]+>/g, '').replace(/ID:\s*\d+/, ''));
            if (!rawName || isExcludedChannelName(rawName)) continue;
            const { category, subcat, lang } = categorizeChannelClient(rawName);
            merged.push({
              id,
              name: rawName,
              category,
              subcat,
              quality: '1080p FHD',
              lang,
              country: 'Global'
            });
            knownIds.add(id);
          }
        }
        setChannels(merged);
        try {
          localStorage.setItem(CHANNELS_CACHE_KEY, JSON.stringify(merged));
        } catch {}
      }
    } catch {
      // Retain existing channels
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
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.matches)) {
          setMatches(data.matches);
          setLastMatchesUpdated(new Date());
          try {
            localStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(data.matches));
          } catch {}
          return;
        }
      }

      // Static Cloudflare fallback: scrape REAL today's matches from Yallakora + DaddyLive directly
      const { matches: scrapedMatches, discoveredChannels } = await scrapeRealMatchesClientSide();
      if (scrapedMatches.length > 0) {
        setMatches(scrapedMatches);
        setLastMatchesUpdated(new Date());
        try {
          localStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(scrapedMatches));
        } catch {}
      }
      if (discoveredChannels.length > 0) {
        setChannels(prev => {
          const knownIds = new Set(prev.map(c => c.id));
          const updated = [...prev];
          for (const ch of discoveredChannels) {
            if (!knownIds.has(ch.id)) {
              updated.push(ch);
              knownIds.add(ch.id);
            }
          }
          return updated;
        });
      }
    } catch {
      // ignore
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
      // Dynamic EPG is computed from real matches in getChannelBroadcast
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
