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

function createSvgDataUri(svgContent: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svgContent.trim())}")`;
}

const BROADCAST_GRID_SVG = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320">
  <rect width="600" height="320" fill="#121815"/>
  <line x1="0" y1="80" x2="600" y2="80" stroke="#232e28" stroke-width="1"/>
  <line x1="0" y1="160" x2="600" y2="160" stroke="#232e28" stroke-width="1"/>
  <line x1="0" y1="240" x2="600" y2="240" stroke="#232e28" stroke-width="1"/>
  <line x1="150" y1="0" x2="150" y2="320" stroke="#232e28" stroke-width="1"/>
  <line x1="450" y1="0" x2="450" y2="320" stroke="#232e28" stroke-width="1"/>
  <polygon points="490,0 600,0 600,320 420,320" fill="#c8f526" fill-opacity="0.06"/>
</svg>
`);

/**
 * Returns crisp broadcast technical call-sign identity for any channel in the catalog
 * without decorative purple/blue SaaS gradients.
 */
export function getChannelBrandIdentity(channel: Channel): ChannelBrandIdentity {
  const fullText = `${channel.name} ${channel.arabicName || ''} ${channel.subcat || ''}`.toLowerCase();

  const numMatch = channel.name.match(/(\d+)/);
  const channelNum = numMatch ? numMatch[1].padStart(2, '0') : String(channel.id).padStart(2, '0');

  if (fullText.includes('max') || fullText.includes('xtra')) {
    return {
      brandKey: 'bein_max',
      networkName: 'beIN SPORTS MAX',
      networkSubLabel: 'تغطية البطولات القارية الكبرى',
      channelShortCode: `MAX ${channelNum}`,
      backgroundCss: 'linear-gradient(180deg, #161d19 0%, #101512 100%)',
      svgPatternUrl: BROADCAST_GRID_SVG,
      badgeBg: 'bg-[#c8f526] text-[#0a0f0c]',
      badgeText: 'beIN MAX',
      accentHex: '#c8f526'
    };
  }

  if (fullText.includes('eurosport')) {
    return {
      brandKey: 'eurosport',
      networkName: 'EUROSPORT',
      networkSubLabel: 'الشبكة الرياضية الأوروبية',
      channelShortCode: `EUR ${channelNum}`,
      backgroundCss: 'linear-gradient(180deg, #161d19 0%, #101512 100%)',
      svgPatternUrl: BROADCAST_GRID_SVG,
      badgeBg: 'bg-[#1f2924] text-[#eef2ed] border border-[#35453c]',
      badgeText: 'EUROSPORT',
      accentHex: '#eef2ed'
    };
  }

  if (fullText.includes('sky')) {
    return {
      brandKey: 'sky_sports',
      networkName: 'SKY SPORTS',
      networkSubLabel: 'البث الأوروبي المباشر',
      channelShortCode: `SKY ${channelNum}`,
      backgroundCss: 'linear-gradient(180deg, #161d19 0%, #101512 100%)',
      svgPatternUrl: BROADCAST_GRID_SVG,
      badgeBg: 'bg-[#1f2924] text-[#eef2ed] border border-[#35453c]',
      badgeText: 'SKY SPORTS',
      accentHex: '#eef2ed'
    };
  }

  if (fullText.includes('arena') || channel.category === 'euro') {
    return {
      brandKey: 'arena_sport',
      networkName: fullText.includes('arena') ? 'ARENA SPORT' : 'EURO FEED',
      networkSubLabel: 'القنوات الأوروبية الناقلة',
      channelShortCode: `EUR ${channelNum}`,
      backgroundCss: 'linear-gradient(180deg, #161d19 0%, #101512 100%)',
      svgPatternUrl: BROADCAST_GRID_SVG,
      badgeBg: 'bg-[#1f2924] text-[#9aa89f] border border-[#35453c]',
      badgeText: fullText.includes('arena') ? 'ARENA' : 'EURO HD',
      accentHex: '#9aa89f'
    };
  }

  if (fullText.includes('ssc') || fullText.includes('kass') || fullText.includes('alkass') || fullText.includes('الكأس')) {
    return {
      brandKey: 'ssc_alkass',
      networkName: fullText.includes('ssc') ? 'SSC SPORTS' : 'ALKASS HD',
      networkSubLabel: 'البث الرياضي العربي',
      channelShortCode: `AR ${channelNum}`,
      backgroundCss: 'linear-gradient(180deg, #161d19 0%, #101512 100%)',
      svgPatternUrl: BROADCAST_GRID_SVG,
      badgeBg: 'bg-[#c8f526] text-[#0a0f0c]',
      badgeText: fullText.includes('ssc') ? 'SSC HD' : 'ALKASS',
      accentHex: '#c8f526'
    };
  }

  if (channel.subcat === 'bein_en' || channel.subcat === 'bein_fr' || fullText.includes('english') || fullText.includes('french') || fullText.includes('فرنسي') || fullText.includes('إنجليزي')) {
    return {
      brandKey: 'bein_global',
      networkName: 'beIN GLOBAL',
      networkSubLabel: channel.subcat === 'bein_fr' ? 'البث الفرنسي المباشر' : 'البث الدولي الإنجليزي',
      channelShortCode: `INT ${channelNum}`,
      backgroundCss: 'linear-gradient(180deg, #161d19 0%, #101512 100%)',
      svgPatternUrl: BROADCAST_GRID_SVG,
      badgeBg: 'bg-[#1f2924] text-[#eef2ed] border border-[#35453c]',
      badgeText: 'beIN INT',
      accentHex: '#9aa89f'
    };
  }

  const isPremium = fullText.includes('premium') || channel.id === 91 || channel.id === 92 || channel.id === 93;
  return {
    brandKey: isPremium ? 'bein_premium' : 'bein_ar',
    networkName: isPremium ? 'beIN PREMIUM' : 'beIN SPORTS',
    networkSubLabel: 'البث المباشر بالعربية',
    channelShortCode: `CH ${channelNum}`,
    backgroundCss: 'linear-gradient(180deg, #161d19 0%, #101512 100%)',
    svgPatternUrl: BROADCAST_GRID_SVG,
    badgeBg: isPremium ? 'bg-[#c8f526] text-[#0a0f0c]' : 'bg-[#1f2924] text-[#c8f526] border border-[#35453c]',
    badgeText: isPremium ? 'PREMIUM' : 'beIN AR',
    accentHex: '#c8f526'
  };
}
