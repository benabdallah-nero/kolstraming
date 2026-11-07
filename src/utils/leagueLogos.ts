/**
 * KolStream Vector League Emblems & Badges Library
 * High-fidelity, self-contained SVG logos for all major world football leagues:
 * 
 * 1. UEFA Champions League (دوري أبطال أوروبا)
 * 2. Premier League (الدوري الإنجليزي الممتاز)
 * 3. La Liga (الدوري الإسباني)
 * 4. Serie A (الدوري الإيطالي)
 * 5. Bundesliga (الدوري الألماني)
 * 6. Ligue 1 (الدوري الفرنسي)
 * 7. Saudi Pro League / Roshn (دوري روشن السعودي للمحترفين)
 * 8. Egyptian Premier League (الدوري المصري الممتاز)
 * 9. Botola Pro Inwi (البطولة المغربية الاحترافية)
 */

function svgToDataUri(svgContent: string): string {
  const cleaned = svgContent
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'");
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

// -------------------------------------------------------------
// 1. UEFA CHAMPIONS LEAGUE (دوري أبطال أوروبا)
// Iconic 8-star ball in Midnight Navy & Silver
// -------------------------------------------------------------
const SVG_UCL = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <radialGradient id='uclBg' cx='50%' cy='50%' r='50%'>
      <stop offset='0%' stop-color='#0f2042'/>
      <stop offset='100%' stop-color='#030814'/>
    </radialGradient>
  </defs>
  <circle cx='50' cy='50' r='48' fill='url(#uclBg)' stroke='#1e3a8a' stroke-width='2'/>
  <g fill='#ffffff' stroke='#030814' stroke-width='1'>
    <!-- Interlocking 8-pointed Champions League star ball -->
    <polygon points='50,14 53,24 63,20 57,28 65,34 55,36 58,46 49,41 44,50 42,40 32,41 38,33 31,26 41,27 43,17 48,25'/>
    <polygon points='26,45 32,53 27,61 36,60 38,70 45,63 51,70 51,60 61,61 56,53 62,45 52,47 48,39 42,47'/>
    <polygon points='46,65 54,67 55,77 62,72 68,79 69,69 79,69 73,62 80,56 70,55 70,45 63,50 58,44 58,54'/>
    <polygon points='50,68 47,78 37,74 43,82 35,88 45,86 42,96 51,91 56,100 58,90 68,89 62,81 69,74 59,75 57,65 52,73' transform='scale(0.85) translate(8, 2)'/>
  </g>
  <circle cx='50' cy='50' r='47' fill='none' stroke='#38bdf8' stroke-width='1.5' opacity='0.7'/>
</svg>`;

// -------------------------------------------------------------
// 2. PREMIER LEAGUE (الدوري الإنجليزي الممتاز)
// Iconic Crowned Royal Lion in Deep Plum & Pitch Neon
// -------------------------------------------------------------
const SVG_PREMIER_LEAGUE = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='plBg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#38003c'/>
      <stop offset='100%' stop-color='#200024'/>
    </linearGradient>
  </defs>
  <circle cx='50' cy='50' r='48' fill='url(#plBg)' stroke='#00ff85' stroke-width='2'/>
  <!-- Premier League Crowned Lion Head -->
  <g fill='#ffffff'>
    <!-- Crown -->
    <path d='M34 26 L38 34 L50 24 L62 34 L66 26 L63 37 L37 37 Z' fill='#00ff85'/>
    <circle cx='34' cy='24' r='2' fill='#00ff85'/>
    <circle cx='50' cy='22' r='2.5' fill='#00ff85'/>
    <circle cx='66' cy='24' r='2' fill='#00ff85'/>
    <!-- Lion Mane and Face Silhouette -->
    <path d='M50 37 C42 37 34 42 30 50 C26 58 27 68 33 75 C37 80 43 83 50 83 C57 83 63 80 67 75 C73 68 74 58 70 50 C66 42 58 37 50 37 Z'/>
    <!-- Inner Features -->
    <path d='M50 44 C45 44 40 48 38 54 C36 60 38 66 42 70 C44 72 47 73 50 73 C53 73 56 72 58 70 C62 66 64 60 62 54 C60 48 55 44 50 44 Z' fill='#38003c'/>
    <!-- Lion Eyes & Nose -->
    <circle cx='46' cy='52' r='2' fill='#00ff85'/>
    <circle cx='54' cy='52' r='2' fill='#00ff85'/>
    <path d='M50 56 L47 62 H53 Z' fill='#00ff85'/>
    <path d='M46 64 C48 67 52 67 54 64' stroke='#00ff85' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  </g>
</svg>`;

// -------------------------------------------------------------
// 3. LA LIGA (الدوري الإسباني)
// Iconic Modern LL Emblem in Crimson Red & Slate
// -------------------------------------------------------------
const SVG_LA_LIGA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='laligaBg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#1a1a24'/>
      <stop offset='100%' stop-color='#0a0a0f'/>
    </linearGradient>
    <linearGradient id='llRed' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#FF4B44'/>
      <stop offset='100%' stop-color='#D81B1B'/>
    </linearGradient>
  </defs>
  <rect x='4' y='4' width='92' height='92' rx='22' fill='url(#laligaBg)' stroke='#FF4B44' stroke-width='2'/>
  <!-- Dynamic Interlocking LL Letterform -->
  <g fill='url(#llRed)'>
    <!-- Left L -->
    <path d='M28 22 H40 V62 H58 V74 H28 Z'/>
    <!-- Slanted Overlapping Second L -->
    <path d='M44 32 L56 22 V54 H72 V66 H44 Z' opacity='0.95'/>
  </g>
  <circle cx='68' cy='32' r='5' fill='#FFD700'/>
</svg>`;

// -------------------------------------------------------------
// 4. SERIE A (الدوري الإيطالي)
// Iconic 3D Diamond 'A' in Azzurro Blue & Italian Tricolore
// -------------------------------------------------------------
const SVG_SERIE_A = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='serieBg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#001F4D'/>
      <stop offset='100%' stop-color='#000B1A'/>
    </linearGradient>
    <linearGradient id='serieBlue1' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#00A3E0'/>
      <stop offset='100%' stop-color='#0066B2'/>
    </linearGradient>
    <linearGradient id='serieBlue2' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#0066B2'/>
      <stop offset='100%' stop-color='#003366'/>
    </linearGradient>
  </defs>
  <circle cx='50' cy='50' r='48' fill='url(#serieBg)' stroke='#00A3E0' stroke-width='2'/>
  <!-- Stylized Diamond 'A' Architecture -->
  <polygon points='50,16 68,54 59,54 50,33 41,54 32,54' fill='url(#serieBlue1)'/>
  <polygon points='50,16 68,54 78,54 50,84 22,54 32,54 50,16' fill='none' stroke='#FFFFFF' stroke-width='3' stroke-linejoin='round'/>
  <!-- Lower Facets -->
  <polygon points='50,33 59,54 50,66 41,54' fill='#FFFFFF'/>
  <polygon points='41,54 50,66 50,84 22,54' fill='url(#serieBlue2)'/>
  <polygon points='59,54 50,66 50,84 78,54' fill='url(#serieBlue1)'/>
  <!-- Italian Tricolore Base Ribbon -->
  <g transform='translate(0, 4)'>
    <rect x='34' y='80' width='10.5' height='4' rx='1' fill='#009246'/>
    <rect x='44.5' y='80' width='11' height='4' fill='#FFFFFF'/>
    <rect x='55.5' y='80' width='10.5' height='4' rx='1' fill='#CE2B37'/>
  </g>
</svg>`;

// -------------------------------------------------------------
// 5. BUNDESLIGA (الدوري الألماني)
// Iconic Red Badge with the Dynamic Jumping Kicking Player
// -------------------------------------------------------------
const SVG_BUNDESLIGA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='buliRed' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#E30613'/>
      <stop offset='100%' stop-color='#B0000A'/>
    </linearGradient>
  </defs>
  <rect x='6' y='6' width='88' height='88' rx='16' fill='url(#buliRed)' stroke='#FFFFFF' stroke-width='2.5'/>
  <!-- White Silhouette: Leaping Player Kicking Ball in Mid-Air -->
  <g fill='#FFFFFF'>
    <!-- Head -->
    <circle cx='38' cy='28' r='6.5'/>
    <!-- Torso and Leg 1 (Kicking out) -->
    <path d='M39 36 L47 48 L68 40 L66 47 L48 54 L44 68 L36 65 L40 50 L33 42 Z'/>
    <!-- Trailing Leg -->
    <path d='M44 68 L48 80 L42 82 L37 70 Z'/>
    <!-- Outstretched Arms -->
    <path d='M34 40 L22 47 L25 51 L36 44 Z'/>
    <path d='M42 42 L52 38 L54 43 L44 47 Z'/>
    <!-- Football in Air -->
    <circle cx='75' cy='32' r='7.5'/>
  </g>
</svg>`;

// -------------------------------------------------------------
// 6. LIGUE 1 (الدوري الفرنسي)
// Modern Electric Hexagonal Ligue 1 Emblem
// -------------------------------------------------------------
const SVG_LIGUE_1 = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='l1Bg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#0b1c3d'/>
      <stop offset='100%' stop-color='#030a17'/>
    </linearGradient>
    <linearGradient id='l1Lime' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#b5f000'/>
      <stop offset='100%' stop-color='#84cc00'/>
    </linearGradient>
  </defs>
  <!-- Hexagon Outer -->
  <polygon points='50,6 88,28 88,72 50,94 12,72 12,28' fill='url(#l1Bg)' stroke='url(#l1Lime)' stroke-width='3'/>
  <!-- Stylized Monogram '1' & Circle -->
  <g fill='url(#l1Lime)'>
    <circle cx='38' cy='34' r='8'/>
    <polygon points='48,22 62,18 62,78 48,78'/>
    <polygon points='34,44 48,36 48,48 34,56'/>
    <rect x='42' y='74' width='28' height='6' rx='1'/>
  </g>
</svg>`;

// -------------------------------------------------------------
// 7. SAUDI PRO LEAGUE (دوري روشن السعودي للمحترفين)
// Official Roshn Emerald & Turquoise Dynamic Ribbon Emblem
// -------------------------------------------------------------
const SVG_SAUDI_PRO_LEAGUE = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='splBg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#00381e'/>
      <stop offset='100%' stop-color='#001a0e'/>
    </linearGradient>
    <linearGradient id='roshnGreen' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#00E575'/>
      <stop offset='100%' stop-color='#00A852'/>
    </linearGradient>
    <linearGradient id='roshnGold' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#FFD700'/>
      <stop offset='100%' stop-color='#C99700'/>
    </linearGradient>
  </defs>
  <circle cx='50' cy='50' r='48' fill='url(#splBg)' stroke='url(#roshnGreen)' stroke-width='2.5'/>
  <!-- Dynamic Mobius Loop / Calligraphic Spl Ribbon -->
  <path d='M25 50 C25 32 38 20 50 20 C64 20 75 32 75 46 C75 62 60 76 50 76 C38 76 29 66 29 55 C29 46 36 39 44 39 C51 39 56 44 56 50 C56 58 49 63 43 63' fill='none' stroke='url(#roshnGreen)' stroke-width='7' stroke-linecap='round'/>
  <!-- Golden Crown Star & Inner Ball Point -->
  <circle cx='50' cy='50' r='4' fill='url(#roshnGold)'/>
  <path d='M47 16 L50 11 L53 16 L58 17 L54 21 L55 26 L50 23 L45 26 L46 21 L42 17 Z' fill='url(#roshnGold)'/>
  <!-- Arabic Calligraphy Aesthetic Slash -->
  <path d='M65 32 L78 24' stroke='url(#roshnGold)' stroke-width='3' stroke-linecap='round'/>
</svg>`;

// -------------------------------------------------------------
// 8. EGYPTIAN PREMIER LEAGUE (الدوري المصري الممتاز - دوري النيل)
// Pharaonic Horus Wing Shield in Egyptian Gold & Crimson
// -------------------------------------------------------------
const SVG_EGYPTIAN_PREMIER_LEAGUE = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='egyBg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#1c0808'/>
      <stop offset='100%' stop-color='#0a0202'/>
    </linearGradient>
    <linearGradient id='egyGold' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#FFD700'/>
      <stop offset='100%' stop-color='#D4AF37'/>
    </linearGradient>
  </defs>
  <!-- Classical Shield -->
  <path d='M50 8 L86 22 C86 64 50 92 50 92 C50 92 14 64 14 22 Z' fill='url(#egyBg)' stroke='url(#egyGold)' stroke-width='3'/>
  <!-- Egyptian Flag Colors Strip in Center -->
  <g transform='translate(0, 16)'>
    <rect x='35' y='18' width='30' height='5' fill='#C8102E'/>
    <rect x='35' y='23' width='30' height='5' fill='#FFFFFF'/>
    <rect x='35' y='28' width='30' height='5' fill='#000000'/>
  </g>
  <!-- Horus Eagle / Falcon Wings Silhouette -->
  <g fill='url(#egyGold)'>
    <path d='M50 36 L55 46 L68 40 L62 54 L75 56 L64 66 L50 58 L36 66 L25 56 L38 54 L32 40 L45 46 Z'/>
    <!-- Center Football with Sun Rays -->
    <circle cx='50' cy='52' r='5' fill='#FFFFFF' stroke='#1c0808' stroke-width='1'/>
    <!-- Pyramid Base -->
    <polygon points='50,66 38,82 62,82'/>
  </g>
</svg>`;

// -------------------------------------------------------------
// 9. BOTOLA PRO INWI (البطولة المغربية الاحترافية إنوي)
// Royal Moroccan 5-Pointed Star & Crown in Ruby & Emerald
// -------------------------------------------------------------
const SVG_BOTOLA_PRO = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='morBg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#2b0307'/>
      <stop offset='100%' stop-color='#120002'/>
    </linearGradient>
    <linearGradient id='morGreen' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#00A859'/>
      <stop offset='100%' stop-color='#006233'/>
    </linearGradient>
    <linearGradient id='morGold' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#FFD700'/>
      <stop offset='100%' stop-color='#D99B00'/>
    </linearGradient>
  </defs>
  <circle cx='50' cy='50' r='48' fill='url(#morBg)' stroke='#C1272D' stroke-width='2.5'/>
  <!-- Royal Moroccan Crown -->
  <path d='M36 26 L42 34 L50 24 L58 34 L64 26 L61 38 L39 38 Z' fill='url(#morGold)'/>
  <circle cx='36' cy='24' r='1.5' fill='#FFFFFF'/>
  <circle cx='50' cy='22' r='2' fill='#FFFFFF'/>
  <circle cx='64' cy='24' r='1.5' fill='#FFFFFF'/>
  <!-- Interlocking Moroccan Green Pentagram Seal -->
  <polygon points='50,38 54,49 66,49 56,57 60,68 50,61 40,68 44,57 34,49 46,49' fill='none' stroke='url(#morGreen)' stroke-width='3.5' stroke-linejoin='round'/>
  <!-- Football in Center -->
  <circle cx='50' cy='53' r='4' fill='#FFFFFF' stroke='#006233' stroke-width='1'/>
  <!-- Inwi Purple Brand Arc Accent -->
  <path d='M28 76 C40 84 60 84 72 76' stroke='#8A2BE2' stroke-width='3' fill='none' stroke-linecap='round'/>
</svg>`;

// Convert to high-speed data URIs
export const LEAGUE_LOGOS = {
  UCL: svgToDataUri(SVG_UCL),
  PREMIER_LEAGUE: svgToDataUri(SVG_PREMIER_LEAGUE),
  LA_LIGA: svgToDataUri(SVG_LA_LIGA),
  SERIE_A: svgToDataUri(SVG_SERIE_A),
  BUNDESLIGA: svgToDataUri(SVG_BUNDESLIGA),
  LIGUE_1: svgToDataUri(SVG_LIGUE_1),
  SAUDI_PRO_LEAGUE: svgToDataUri(SVG_SAUDI_PRO_LEAGUE),
  EGYPTIAN_PREMIER_LEAGUE: svgToDataUri(SVG_EGYPTIAN_PREMIER_LEAGUE),
  BOTOLA_PRO: svgToDataUri(SVG_BOTOLA_PRO)
};

export interface LeagueBrandMeta {
  key: string;
  name: string;
  shortName: string;
  englishName: string;
  logoUri: string;
  themeColor: string;
  borderColor: string;
}

/**
 * Resolves a competition string to its authentic vector emblem and brand identity
 */
export function getLeagueBrand(competition?: string): LeagueBrandMeta | null {
  if (!competition) return null;
  const c = competition.toLowerCase().trim();

  // Exclude non-top tiers and women's competitions
  if (/women|سيدات|femenina|frauen|u18|u19|u20|u21|u23|amateur|reserve/.test(c)) {
    return null;
  }

  // 1. UEFA Champions League (دوري أبطال أوروبا)
  if (
    c.includes('أبطال أوروبا') ||
    c.includes('ابطال اوروبا') ||
    c.includes('uefa champions league') ||
    (c.includes('champions league') && !c.includes('afc') && !c.includes('caf'))
  ) {
    return {
      key: 'ucl',
      name: 'دوري أبطال أوروبا',
      shortName: 'UCL',
      englishName: 'UEFA Champions League',
      logoUri: LEAGUE_LOGOS.UCL,
      themeColor: '#0f2042',
      borderColor: '#38bdf8'
    };
  }

  // 2. Premier League (الدوري الإنجليزي الممتاز)
  if (
    c === 'الدوري الإنجليزي' ||
    c === 'الدوري الإنجليزي الممتاز' ||
    c === 'premier league' ||
    c === 'english premier league' ||
    (c.includes('إنجليزي') && !c.includes('درجة')) ||
    (c.includes('انجليزي') && !c.includes('درجة'))
  ) {
    return {
      key: 'epl',
      name: 'الدوري الإنجليزي الممتاز',
      shortName: 'EPL',
      englishName: 'Premier League',
      logoUri: LEAGUE_LOGOS.PREMIER_LEAGUE,
      themeColor: '#38003c',
      borderColor: '#00ff85'
    };
  }

  // 3. La Liga (الدوري الإسباني)
  if (
    c === 'الدوري الإسباني' ||
    c === 'الدوري الإسباني (لا ليغا)' ||
    c === 'la liga' ||
    c === 'laliga' ||
    (c.includes('إسباني') && !c.includes('درجة')) ||
    (c.includes('اسباني') && !c.includes('درجة'))
  ) {
    return {
      key: 'laliga',
      name: 'الدوري الإسباني (لا ليغا)',
      shortName: 'LALIGA',
      englishName: 'La Liga EA Sports',
      logoUri: LEAGUE_LOGOS.LA_LIGA,
      themeColor: '#FF4B44',
      borderColor: '#FF4B44'
    };
  }

  // 4. Serie A (الدوري الإيطالي)
  if (
    c === 'الدوري الإيطالي' ||
    c === 'الدوري الإيطالي (سيريا آ)' ||
    c === 'serie a' ||
    (c.includes('إيطالي') && !c.includes('درجة')) ||
    (c.includes('ايطالي') && !c.includes('درجة'))
  ) {
    return {
      key: 'serie_a',
      name: 'الدوري الإيطالي (سيريا آ)',
      shortName: 'SERIE A',
      englishName: 'Serie A Enilive',
      logoUri: LEAGUE_LOGOS.SERIE_A,
      themeColor: '#002F6C',
      borderColor: '#00A3E0'
    };
  }

  // 5. Bundesliga (الدوري الألماني)
  if (
    c === 'الدوري الألماني' ||
    c === 'الدوري الألماني (البوندسليغا)' ||
    c === 'bundesliga' ||
    (c.includes('ألماني') && !c.includes('درجة')) ||
    (c.includes('الماني') && !c.includes('درجة'))
  ) {
    return {
      key: 'bundesliga',
      name: 'الدوري الألماني (البوندسليغا)',
      shortName: 'BL',
      englishName: 'Bundesliga',
      logoUri: LEAGUE_LOGOS.BUNDESLIGA,
      themeColor: '#E30613',
      borderColor: '#E30613'
    };
  }

  // 6. Ligue 1 (الدوري الفرنسي)
  if (
    c === 'الدوري الفرنسي' ||
    c === 'الدوري الفرنسي (ليغ 1)' ||
    c === 'ligue 1' ||
    (c.includes('فرنسي') && !c.includes('درجة'))
  ) {
    return {
      key: 'ligue_1',
      name: 'الدوري الفرنسي (ليغ 1)',
      shortName: 'L1',
      englishName: 'Ligue 1 McDonald\'s',
      logoUri: LEAGUE_LOGOS.LIGUE_1,
      themeColor: '#091c3e',
      borderColor: '#b5f000'
    };
  }

  // 7. Saudi Pro League (دوري روشن السعودي للمحترفين)
  if (
    c.includes('روشن') ||
    c.includes('saudi pro league') ||
    (c.includes('سعودي') && c.includes('دوري'))
  ) {
    return {
      key: 'spl',
      name: 'دوري روشن السعودي للمحترفين',
      shortName: 'SPL',
      englishName: 'Roshn Saudi League',
      logoUri: LEAGUE_LOGOS.SAUDI_PRO_LEAGUE,
      themeColor: '#00381e',
      borderColor: '#00E575'
    };
  }

  // 8. Egyptian Premier League (الدوري المصري الممتاز)
  if (
    c.includes('الدوري المصري') ||
    c.includes('egyptian premier league')
  ) {
    return {
      key: 'epl_egypt',
      name: 'الدوري المصري الممتاز',
      shortName: 'EGY',
      englishName: 'Egyptian Premier League',
      logoUri: LEAGUE_LOGOS.EGYPTIAN_PREMIER_LEAGUE,
      themeColor: '#1c0808',
      borderColor: '#FFD700'
    };
  }

  // 9. Botola Pro Inwi (البطولة المغربية الاحترافية)
  if (
    c.includes('البطولة المغربية') ||
    c.includes('botola') ||
    c.includes('إنوي') ||
    c.includes('الدوري المغربي')
  ) {
    return {
      key: 'botola',
      name: 'البطولة المغربية الاحترافية',
      shortName: 'BOTOLA',
      englishName: 'Botola Pro Inwi',
      logoUri: LEAGUE_LOGOS.BOTOLA_PRO,
      themeColor: '#2b0307',
      borderColor: '#C1272D'
    };
  }

  return null;
}
