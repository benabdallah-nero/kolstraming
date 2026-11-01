import { Channel } from '../types';

export interface ChannelBrandIdentity {
  brandKey: 'bein_premium' | 'bein_ar' | 'bein_max' | 'bein_global' | 'eurosport' | 'sky_sports' | 'arena_sport' | 'ssc_alkass' | 'dazn_canal';
  networkName: string;
  networkSubLabel: string;
  channelShortCode: string;
  backgroundCss: string;
  svgPatternUrl: string;
  badgeBg: string;
  badgeText: string;
  accentHex: string;
}

/**
 * Generates an SVG broadcast backdrop encoded as a data URI for authentic network card visuals
 */
function createSvgDataUri(svgContent: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svgContent.trim())}")`;
}

const BEIN_PURPLE_SVG = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22053d"/>
      <stop offset="50%" stop-color="#431070"/>
      <stop offset="100%" stop-color="#140326"/>
    </linearGradient>
    <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="600" height="320" fill="url(#bg)"/>
  <path d="M-60,260 C120,180 280,310 660,120 L660,320 L-60,320 Z" fill="#581c87" fill-opacity="0.35"/>
  <path d="M-40,80 C180,200 360,-20 640,140 L640,0 L-40,0 Z" fill="url(#beam)"/>
  <circle cx="510" cy="60" r="140" fill="#9333ea" fill-opacity="0.16"/>
  <g transform="translate(38, 128)" opacity="0.22">
    <text x="0" y="55" font-family="Arial, sans-serif" font-weight="900" font-size="68" fill="#ffffff" letter-spacing="-2">beIN</text>
    <rect x="165" y="14" width="145" height="46" rx="8" fill="#ffffff"/>
    <text x="177" y="47" font-family="Arial, sans-serif" font-weight="900" font-size="30" fill="#3b0764" letter-spacing="1">SPORTS</text>
  </g>
</svg>
`);

const BEIN_MAX_SVG = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2e074d"/>
      <stop offset="55%" stop-color="#5b1865"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
  </defs>
  <rect width="600" height="320" fill="url(#bg)"/>
  <polygon points="350,0 600,0 600,320 220,320" fill="#f59e0b" fill-opacity="0.12"/>
  <circle cx="480" cy="160" r="150" fill="#fbbf24" fill-opacity="0.1"/>
  <g transform="translate(36, 128)" opacity="0.22">
    <text x="0" y="55" font-family="Arial, sans-serif" font-weight="900" font-size="64" fill="#ffffff" letter-spacing="-2">beIN</text>
    <rect x="155" y="14" width="115" height="46" rx="8" fill="#fbbf24"/>
    <text x="170" y="47" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="#2e074d" letter-spacing="2">MAX</text>
  </g>
</svg>
`);

const EUROSPORT_SVG = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050d24"/>
      <stop offset="55%" stop-color="#0f2557"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="320" fill="url(#bg)"/>
  <path d="M420,0 L600,0 L600,320 L310,320 Z" fill="#e11d48" fill-opacity="0.22"/>
  <path d="M390,0 L435,0 L305,320 L260,320 Z" fill="#e11d48" fill-opacity="0.45"/>
  <g transform="translate(36, 135)" opacity="0.22">
    <text x="0" y="45" font-family="Arial, sans-serif" font-weight="900" font-style="italic" font-size="48" fill="#ffffff" letter-spacing="3">EUROSPORT</text>
  </g>
</svg>
`);

const SKY_SPORTS_SVG = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07163b"/>
      <stop offset="52%" stop-color="#1d3b8b"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </linearGradient>
  </defs>
  <rect width="600" height="320" fill="url(#bg)"/>
  <polygon points="340,0 600,0 600,320 260,320" fill="#dc2626" fill-opacity="0.28"/>
  <g transform="translate(38, 128)" opacity="0.24">
    <rect x="0" y="12" width="95" height="46" rx="6" fill="#ffffff"/>
    <text x="14" y="46" font-family="Arial, sans-serif" font-weight="900" font-size="34" fill="#07163b">sky</text>
    <rect x="102" y="12" width="155" height="46" rx="6" fill="#dc2626"/>
    <text x="115" y="45" font-family="Arial, sans-serif" font-weight="800" font-size="30" fill="#ffffff" letter-spacing="1">SPORTS</text>
  </g>
</svg>
`);

const ARENA_SPORT_SVG = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06151f"/>
      <stop offset="55%" stop-color="#0c3c54"/>
      <stop offset="100%" stop-color="#091e2c"/>
    </linearGradient>
  </defs>
  <rect width="600" height="320" fill="url(#bg)"/>
  <circle cx="490" cy="80" r="150" fill="#06b6d4" fill-opacity="0.18"/>
  <path d="M0,250 L600,140 L600,320 L0,320 Z" fill="#0284c7" fill-opacity="0.2"/>
  <g transform="translate(36, 135)" opacity="0.22">
    <text x="0" y="45" font-family="Arial, sans-serif" font-weight="900" font-size="46" fill="#38bdf8" letter-spacing="2">ARENA SPORT</text>
  </g>
</svg>
`);

const SSC_ALKASS_SVG = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#042619"/>
      <stop offset="55%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#271c04"/>
    </linearGradient>
  </defs>
  <rect width="600" height="320" fill="url(#bg)"/>
  <circle cx="480" cy="90" r="140" fill="#fbbf24" fill-opacity="0.15"/>
  <g transform="translate(38, 130)" opacity="0.22">
    <text x="0" y="48" font-family="Arial, sans-serif" font-weight="900" font-size="54" fill="#fbbf24" letter-spacing="2">SPORTS HD</text>
  </g>
</svg>
`);

/**
 * Returns authentic network branding and visual background for any channel in the catalog.
 */
export function getChannelBrandIdentity(channel: Channel): ChannelBrandIdentity {
  const fullText = `${channel.name} ${channel.arabicName || ''} ${channel.subcat || ''}`.toLowerCase();

  // Extract channel number from name if present (e.g., "beIN Sports 1" -> "1")
  const numMatch = channel.name.match(/(\d+)/);
  const channelNum = numMatch ? numMatch[1] : String(channel.id);

  // 1. beIN Sports MAX / XTRA
  if (fullText.includes('max') || fullText.includes('xtra')) {
    return {
      brandKey: 'bein_max',
      networkName: 'beIN SPORTS MAX',
      networkSubLabel: 'بطولات كبرى وتغطية خاصة',
      channelShortCode: `MAX ${channelNum}`,
      backgroundCss: 'linear-gradient(135deg, #2e074d 0%, #5b1865 55%, #78350f 100%)',
      svgPatternUrl: BEIN_MAX_SVG,
      badgeBg: 'bg-amber-400 text-stone-950',
      badgeText: 'beIN MAX',
      accentHex: '#fbbf24'
    };
  }

  // 2. Eurosport
  if (fullText.includes('eurosport')) {
    return {
      brandKey: 'eurosport',
      networkName: 'EUROSPORT',
      networkSubLabel: 'الشبكة الرياضية الأوروبية',
      channelShortCode: `EURO ${channelNum}`,
      backgroundCss: 'linear-gradient(135deg, #050d24 0%, #0f2557 55%, #881337 100%)',
      svgPatternUrl: EUROSPORT_SVG,
      badgeBg: 'bg-rose-600 text-white',
      badgeText: 'EUROSPORT',
      accentHex: '#f43f5e'
    };
  }

  // 3. Sky Sports
  if (fullText.includes('sky')) {
    return {
      brandKey: 'sky_sports',
      networkName: 'SKY SPORTS',
      networkSubLabel: 'تغطية الدوري الإنجليزي والبطولات الأوروبية',
      channelShortCode: 'SKY HD',
      backgroundCss: 'linear-gradient(135deg, #07163b 0%, #1d3b8b 52%, #7f1d1d 100%)',
      svgPatternUrl: SKY_SPORTS_SVG,
      badgeBg: 'bg-red-600 text-white',
      badgeText: 'SKY SPORTS',
      accentHex: '#ef4444'
    };
  }

  // 4. Arena Sport / European Sports
  if (fullText.includes('arena') || channel.category === 'euro') {
    return {
      brandKey: 'arena_sport',
      networkName: fullText.includes('arena') ? 'ARENA SPORT' : 'EUROPEAN SPORTS',
      networkSubLabel: 'القنوات الرياضية الأوروبية',
      channelShortCode: `EU ${channelNum}`,
      backgroundCss: 'linear-gradient(135deg, #06151f 0%, #0c3c54 55%, #091e2c 100%)',
      svgPatternUrl: ARENA_SPORT_SVG,
      badgeBg: 'bg-sky-500 text-slate-950',
      badgeText: fullText.includes('arena') ? 'ARENA SPORT' : 'EURO HD',
      accentHex: '#38bdf8'
    };
  }

  // 5. SSC / Alkass / Arabic Regional
  if (fullText.includes('ssc') || fullText.includes('kass') || fullText.includes('alkass') || fullText.includes('الكأس')) {
    return {
      brandKey: 'ssc_alkass',
      networkName: fullText.includes('ssc') ? 'SSC SPORTS' : 'قنوات الكأس الرياضية',
      networkSubLabel: 'البث الرياضي العربي المباشر',
      channelShortCode: `HD ${channelNum}`,
      backgroundCss: 'linear-gradient(135deg, #042619 0%, #064e3b 55%, #271c04 100%)',
      svgPatternUrl: SSC_ALKASS_SVG,
      badgeBg: 'bg-amber-500 text-stone-950',
      badgeText: fullText.includes('ssc') ? 'SSC HD' : 'ALKASS HD',
      accentHex: '#10b981'
    };
  }

  // 6. beIN Sports Global (EN / FR)
  if (channel.subcat === 'bein_en' || channel.subcat === 'bein_fr' || fullText.includes('english') || fullText.includes('french') || fullText.includes('فرنسي') || fullText.includes('إنجليزي')) {
    return {
      brandKey: 'bein_global',
      networkName: 'beIN SPORTS GLOBAL',
      networkSubLabel: channel.subcat === 'bein_fr' ? 'البث الفرنسي المباشر' : 'البث الدولي الإنجليزي',
      channelShortCode: `beIN ${channelNum}`,
      backgroundCss: 'linear-gradient(135deg, #1b0636 0%, #31105e 52%, #0f172a 100%)',
      svgPatternUrl: BEIN_PURPLE_SVG,
      badgeBg: 'bg-purple-500 text-white',
      badgeText: 'beIN GLOBAL',
      accentHex: '#c084fc'
    };
  }

  // 7. Default: Official beIN Sports Arabic / Premium Purple Identity
  const isPremium = fullText.includes('premium') || channel.id === 91 || channel.id === 92 || channel.id === 93;
  return {
    brandKey: isPremium ? 'bein_premium' : 'bein_ar',
    networkName: isPremium ? 'beIN SPORTS PREMIUM' : 'beIN SPORTS HD',
    networkSubLabel: 'الشبكة الرياضية العربية الأولى',
    channelShortCode: `beIN ${channelNum}`,
    backgroundCss: 'linear-gradient(135deg, #22053d 0%, #431070 52%, #140326 100%)',
    svgPatternUrl: BEIN_PURPLE_SVG,
    badgeBg: 'bg-[#7e22ce] text-white',
    badgeText: isPremium ? 'beIN PREMIUM' : 'beIN SPORTS',
    accentHex: '#a855f7'
  };
}
