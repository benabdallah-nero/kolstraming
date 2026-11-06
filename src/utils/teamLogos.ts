/**
 * KolStream Vector Team Crests & Badges Library
 * High-fidelity, lightweight SVG crests focused on the Saudi Pro League (دوري روشن)
 * followed by European and Arab football powerhouses.
 * 
 * Returns data:image/svg+xml;utf8,... URIs that render seamlessly in <img> tags
 * without external network dependency or CORS/hotlink failure.
 */

function svgToDataUri(svgContent: string): string {
  const cleaned = svgContent
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'");
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

// -------------------------------------------------------------
// 1. SAUDI PRO LEAGUE (دوري روشن للمحترفين)
// -------------------------------------------------------------

// Al Hilal SFC (الهلال) - Royal Blue & White Crescent Shield
const SVG_AL_HILAL = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='hilalGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#002B7F'/>
      <stop offset='100%' stop-color='#0055D4'/>
    </linearGradient>
  </defs>
  <path d='M50 5 L88 20 C88 65 50 95 50 95 C50 95 12 65 12 20 Z' fill='url(#hilalGrad)' stroke='#FFFFFF' stroke-width='3'/>
  <path d='M50 12 L82 24 C82 60 50 88 50 88 C50 88 18 60 18 24 Z' fill='none' stroke='#0090FF' stroke-width='1.5'/>
  <!-- Stylized Crescent & Modern 'H' Cross -->
  <path d='M50 25 C63 25 73 35 73 48 C73 61 63 71 50 71 C43 71 37 68 32 63 C40 65 49 61 52 53 C55 45 51 37 42 33 C45 28 47 25 50 25 Z' fill='#FFFFFF'/>
  <rect x='45' y='32' width='10' height='36' rx='2' fill='#FFFFFF'/>
  <rect x='34' y='46' width='32' height='8' rx='2' fill='#FFFFFF'/>
  <circle cx='50' cy='20' r='3' fill='#FFD700'/>
</svg>`;

// Al Nassr FC (النصر) - Royal Gold & Blue Knight Crown Shield
const SVG_AL_NASSR = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='nassrGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#FFD000'/>
      <stop offset='100%' stop-color='#E6A100'/>
    </linearGradient>
  </defs>
  <path d='M50 8 L86 24 C86 68 50 94 50 94 C50 94 14 68 14 24 Z' fill='url(#nassrGrad)' stroke='#003399' stroke-width='4'/>
  <path d='M50 14 L80 28 C80 64 50 87 50 87 C50 87 20 64 20 28 Z' fill='#002B7F'/>
  <!-- Golden Crown -->
  <path d='M32 40 L38 52 L50 42 L62 52 L68 40 L65 58 L35 58 Z' fill='#FFD000'/>
  <circle cx='32' cy='38' r='2' fill='#FFFFFF'/>
  <circle cx='50' cy='39' r='2.5' fill='#FFFFFF'/>
  <circle cx='68' cy='38' r='2' fill='#FFFFFF'/>
  <!-- Victory 'V' / Arabic Nassr Emblem -->
  <path d='M50 56 L35 78 H44 L50 67 L56 78 H65 Z' fill='#FFD000'/>
</svg>`;

// Al Ittihad (الاتحاد) - Black & Yellow Dean Tigers Crest
const SVG_AL_ITTIHAD = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 6 L88 22 C88 66 50 94 50 94 C50 94 12 66 12 22 Z' fill='#111111' stroke='#FFD200' stroke-width='4'/>
  <path d='M50 12 L82 26 C82 62 50 88 50 88 C50 88 18 62 18 26 Z' fill='#1A1A1A'/>
  <!-- Yellow Stripes -->
  <path d='M32 24 L32 75' stroke='#FFD200' stroke-width='6' stroke-linecap='round'/>
  <path d='M68 24 L68 75' stroke='#FFD200' stroke-width='6' stroke-linecap='round'/>
  <!-- The Famous Number 1 Emblem -->
  <path d='M44 38 L52 30 V72 H44' fill='#FFD200'/>
  <rect x='40' y='68' width='20' height='5' rx='1' fill='#FFD200'/>
  <!-- Yellow Crown Stars -->
  <polygon points='50,16 52,21 57,21 53,24 55,29 50,26 45,29 47,24 43,21 48,21' fill='#FFD200'/>
</svg>`;

// Al Ahli Saudi FC (الأهلي السعودي) - Emerald Green & White Royal Palm
const SVG_AL_AHLI_SAUDI = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='ahliSGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#008542'/>
      <stop offset='100%' stop-color='#005A2B'/>
    </linearGradient>
  </defs>
  <path d='M50 6 L86 22 C86 66 50 94 50 94 C50 94 14 66 14 22 Z' fill='url(#ahliSGrad)' stroke='#FFFFFF' stroke-width='3.5'/>
  <circle cx='50' cy='50' r='30' fill='#FFFFFF'/>
  <circle cx='50' cy='50' r='26' fill='#008542'/>
  <!-- Saudi Royal Palm & Crossed Swords -->
  <path d='M50 32 C50 32 46 38 46 44 C46 48 50 50 50 50 C50 50 54 48 54 44 C54 38 50 32 50 32 Z' fill='#FFFFFF'/>
  <path d='M42 38 C44 42 47 45 47 45' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round'/>
  <path d='M58 38 C56 42 53 45 53 45' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round'/>
  <path d='M38 60 L62 60' stroke='#FFFFFF' stroke-width='2.5' stroke-linecap='round'/>
  <path d='M42 54 L58 66' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round'/>
  <path d='M58 54 L42 66' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round'/>
</svg>`;

// Al Shabab FC (الشباب) - White & Black Lion Crest with Orange Flame
const SVG_AL_SHABAB = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 24 C86 66 50 93 50 93 C50 93 14 66 14 24 Z' fill='#151515' stroke='#F26522' stroke-width='3.5'/>
  <path d='M50 14 L80 28 C80 62 50 87 50 87 C50 87 20 62 20 28 Z' fill='#FFFFFF'/>
  <!-- Lion Profile Silhouette in Black & Orange -->
  <path d='M48 30 C58 30 66 36 66 48 C66 56 62 62 55 67 L60 76 H48 L46 68 C42 67 38 64 36 60 C33 55 34 44 40 37 C42 33 45 30 48 30 Z' fill='#151515'/>
  <path d='M46 45 C50 42 54 44 54 48 C54 52 50 54 46 51 Z' fill='#F26522'/>
  <polygon points='50,18 52,22 57,22 53,25 55,29 50,27 45,29 47,25 43,22 48,22' fill='#F26522'/>
</svg>`;

// Al Taawoun FC (التعاون) - Royal Yellow & Navy Blue Wolves
const SVG_AL_TAAWOUN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='44' fill='#0B1E3D' stroke='#FFD000' stroke-width='4'/>
  <circle cx='50' cy='50' r='36' fill='#FFD000'/>
  <circle cx='50' cy='50' r='28' fill='#0B1E3D'/>
  <!-- Wolf Head Icon -->
  <path d='M36 40 L44 54 L50 46 L56 54 L64 40 L60 62 L50 68 L40 62 Z' fill='#FFD000'/>
  <circle cx='44' cy='48' r='2' fill='#0B1E3D'/>
  <circle cx='56' cy='48' r='2' fill='#0B1E3D'/>
</svg>`;

// Al Ettifaq FC (الاتفاق) - Commandos Green & Red Shield
const SVG_AL_ETTIFAQ = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 7 L88 24 C88 68 50 93 50 93 C50 93 12 68 12 24 Z' fill='#007A3D' stroke='#DE1623' stroke-width='4'/>
  <path d='M50 14 L82 28 C82 64 50 87 50 87 C50 87 18 64 18 28 Z' fill='#FFFFFF'/>
  <!-- Green & Red Chevron -->
  <path d='M25 44 L50 60 L75 44 L75 52 L50 68 L25 52 Z' fill='#DE1623'/>
  <path d='M25 32 L50 48 L75 32 L75 40 L50 56 L25 40 Z' fill='#007A3D'/>
  <circle cx='50' cy='74' r='4' fill='#007A3D'/>
</svg>`;

// Al Fateh FC (الفتح) - Blue & Green Oasis Crest
const SVG_AL_FATEH = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='44' fill='#004B87' stroke='#00A859' stroke-width='4'/>
  <circle cx='50' cy='50' r='36' fill='#FFFFFF'/>
  <!-- Date Palm Symbol of Al-Ahsa Oasis -->
  <path d='M48 45 V72 H52 V45 Z' fill='#8B5A2B'/>
  <path d='M50 30 C45 35 40 42 40 46 C46 44 49 42 50 42 C51 42 54 44 60 46 C60 42 55 35 50 30 Z' fill='#00A859'/>
  <path d='M50 36 C42 36 34 40 32 44 C38 45 44 44 48 41 Z' fill='#00A859'/>
  <path d='M50 36 C58 36 66 40 68 44 C62 45 56 44 52 41 Z' fill='#00A859'/>
</svg>`;

// Al Fayha FC (الفيحاء) - Orange & Blue Knights
const SVG_AL_FAYHA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 7 L87 23 C87 67 50 93 50 93 C50 93 13 67 13 23 Z' fill='#FF6600' stroke='#002B7F' stroke-width='4'/>
  <path d='M50 14 L81 27 C81 63 50 87 50 87 C50 87 19 63 19 27 Z' fill='#002B7F'/>
  <path d='M30 40 L50 28 L70 40 V58 L50 72 L30 58 Z' fill='#FFFFFF'/>
  <path d='M36 44 L50 36 L64 44 V56 L50 66 L36 56 Z' fill='#FF6600'/>
</svg>`;

// Damac FC (ضمك) - Mountain Red & Yellow Crest
const SVG_DAMAC = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='44' fill='#C8102E' stroke='#FFD100' stroke-width='4'/>
  <circle cx='50' cy='50' r='36' fill='#111111'/>
  <!-- Asir Mountain Peaks -->
  <polygon points='25,68 40,42 52,68' fill='#FFD100'/>
  <polygon points='45,68 60,34 75,68' fill='#C8102E'/>
  <polygon points='38,68 50,48 62,68' fill='#FFFFFF'/>
</svg>`;

// Al Khaleej (الخليج) - Emerald & Sun Yellow
const SVG_AL_KHALEEJ = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 C28 8 10 26 10 48 C10 70 50 92 50 92 C50 92 90 70 90 48 C90 26 72 8 50 8 Z' fill='#008542' stroke='#FFD100' stroke-width='4'/>
  <path d='M25 45 C35 35 65 35 75 45 C65 55 35 55 25 45 Z' fill='#FFD100'/>
  <circle cx='50' cy='58' r='7' fill='#FFFFFF'/>
</svg>`;

// Al Raed (الرائد) - Red & Black Buraidah Crest
const SVG_AL_RAED = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='44' fill='#111111' stroke='#D00000' stroke-width='4'/>
  <path d='M50 14 A36 36 0 0 1 50 86 Z' fill='#D00000'/>
  <path d='M50 14 A36 36 0 0 0 50 86 Z' fill='#111111'/>
  <circle cx='50' cy='50' r='20' fill='#FFFFFF'/>
  <polygon points='50,38 53,46 62,46 55,51 57,59 50,54 43,59 45,51 38,46 47,46' fill='#D00000'/>
</svg>`;

// Al Wehda (الوحدة) - Red & White Mecca Knights
const SVG_AL_WEHDA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 7 L86 23 C86 67 50 93 50 93 C50 93 14 67 14 23 Z' fill='#D21034' stroke='#FFFFFF' stroke-width='3'/>
  <circle cx='50' cy='52' r='26' fill='#FFFFFF'/>
  <!-- Torch / Flame of Makkah -->
  <path d='M50 32 C44 40 44 48 50 54 C56 48 56 40 50 32 Z' fill='#D21034'/>
  <rect x='46' y='55' width='8' height='14' fill='#111111' rx='1'/>
</svg>`;

// Al Qadsiah (القادسية) - Red & Yellow Knight Shield
const SVG_AL_QADSIAH = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 6 L88 22 C88 66 50 94 50 94 C50 94 12 66 12 22 Z' fill='#CC0000' stroke='#FFCC00' stroke-width='4'/>
  <path d='M50 12 L82 26 C82 62 50 88 50 88 C50 88 18 62 18 26 Z' fill='#FFFFFF'/>
  <polygon points='50,28 66,42 60,66 40,66 34,42' fill='#CC0000'/>
  <polygon points='50,34 60,44 56,60 44,60 40,44' fill='#FFCC00'/>
</svg>`;

// Al Riyadh FC (الرياض) - Red & Black Capital Shield
const SVG_AL_RIYADH = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='44' fill='#B22222' stroke='#111111' stroke-width='4'/>
  <circle cx='50' cy='50' r='36' fill='#FFFFFF'/>
  <path d='M34 38 H66 V62 H34 Z' fill='#B22222'/>
  <polygon points='50,28 66,38 34,38' fill='#111111'/>
</svg>`;

// -------------------------------------------------------------
// 2. EUROPEAN GIANTS (عمالقة أوروبا)
// -------------------------------------------------------------

// Real Madrid CF (ريال مدريد) - Royal White, Gold Crown & Purple Sash
const SVG_REAL_MADRID = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <!-- Royal Crown -->
  <path d='M30 26 L36 34 L50 24 L64 34 L70 26 L66 40 H34 Z' fill='#FFD700' stroke='#B8860B' stroke-width='1.5'/>
  <circle cx='50' cy='22' r='3' fill='#FF0000'/>
  <circle cx='30' cy='24' r='2' fill='#FF0000'/>
  <circle cx='70' cy='24' r='2' fill='#FF0000'/>
  <!-- Main Circular Crest -->
  <circle cx='50' cy='62' r='32' fill='#FFFFFF' stroke='#FFD700' stroke-width='3.5'/>
  <circle cx='50' cy='62' r='27' fill='#FFFFFF' stroke='#003399' stroke-width='1.5'/>
  <!-- Diagonal Purple Sash -->
  <path d='M30 46 L68 84 L74 78 L36 40 Z' fill='#6C3483'/>
  <!-- Royal Monogram Cipher (MFC) -->
  <path d='M44 50 C44 50 50 48 56 52 C56 58 50 62 44 64 C44 70 52 74 58 70' fill='none' stroke='#FFD700' stroke-width='3' stroke-linecap='round'/>
</svg>`;

// FC Barcelona (برشلونة) - Blaugrana, St. George Cross & Senyera
const SVG_BARCELONA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <!-- Bowl Shield Base -->
  <path d='M50 8 C68 8 86 16 86 24 C86 64 50 92 50 92 C50 92 14 64 14 24 C14 16 32 8 50 8 Z' fill='#FFD700' stroke='#B8860B' stroke-width='3'/>
  <!-- Upper Left: St George Red Cross on White -->
  <path d='M18 24 C18 36 32 46 48 46 V24 Z' fill='#FFFFFF'/>
  <rect x='30' y='24' width='6' height='22' fill='#ED1B24'/>
  <rect x='20' y='32' width='26' height='6' fill='#ED1B24'/>
  <!-- Upper Right: Senyera Red & Yellow Stripes -->
  <path d='M52 24 V46 C68 46 82 36 82 24 Z' fill='#FFD700'/>
  <rect x='57' y='24' width='4' height='22' fill='#ED1B24'/>
  <rect x='67' y='24' width='4' height='22' fill='#ED1B24'/>
  <rect x='77' y='24' width='4' height='18' fill='#ED1B24'/>
  <!-- Lower Field: Blaugrana Stripes -->
  <path d='M18 48 C20 70 50 88 50 88 C50 88 80 70 82 48 Z' fill='#004D98'/>
  <path d='M30 48 C32 66 42 78 42 78 V48 Z' fill='#A50044'/>
  <path d='M58 48 V78 C58 78 68 66 70 48 Z' fill='#A50044'/>
  <!-- Central Ball -->
  <circle cx='50' cy='66' r='7' fill='#E0A526' stroke='#111111' stroke-width='1'/>
</svg>`;

// Manchester City (مانشستر سيتي) - Circular Sky Blue Ship & Red Rose
const SVG_MAN_CITY = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#6CABDD' stroke='#001E62' stroke-width='4'/>
  <circle cx='50' cy='50' r='38' fill='#FFFFFF'/>
  <circle cx='50' cy='50' r='34' fill='#6CABDD'/>
  <!-- Center Shield -->
  <path d='M50 26 L66 34 C66 54 50 68 50 68 C50 68 34 54 34 34 Z' fill='#FFFFFF' stroke='#001E62' stroke-width='1.5'/>
  <!-- Golden Ship -->
  <path d='M40 38 L44 32 H56 L60 38 L50 44 Z' fill='#FFC659'/>
  <path d='M44 36 H56' stroke='#001E62' stroke-width='1'/>
  <!-- Lancashire Red Rose -->
  <circle cx='50' cy='54' r='5' fill='#DA291C'/>
  <circle cx='50' cy='54' r='2' fill='#FFC659'/>
</svg>`;

// Liverpool FC (ليفربول) - Red Shield with Liver Bird & Shankly Gates
const SVG_LIVERPOOL = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs>
    <linearGradient id='lfcGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#C8102E'/>
      <stop offset='100%' stop-color='#960B22'/>
    </linearGradient>
  </defs>
  <path d='M50 10 L84 22 C84 66 50 92 50 92 C50 92 16 66 16 22 Z' fill='url(#lfcGrad)' stroke='#00B2A9' stroke-width='3.5'/>
  <path d='M50 16 L78 26 C78 62 50 86 50 86 C50 86 22 62 22 26 Z' fill='none' stroke='#F6EB61' stroke-width='1.5'/>
  <!-- Iconic Liver Bird (Cormorant) in Gold -->
  <path d='M50 34 C46 34 42 38 42 43 C42 46 44 49 46 51 L44 68 H56 L54 51 C56 49 58 46 58 43 C58 38 54 34 50 34 Z' fill='#F6EB61'/>
  <path d='M42 42 L34 48 L42 50 Z' fill='#F6EB61'/>
  <path d='M58 42 L66 48 L58 50 Z' fill='#F6EB61'/>
  <circle cx='50' cy='36' r='2' fill='#C8102E'/>
  <!-- 97 Eternal Flames / YNWA Banner -->
  <path d='M30 76 L50 72 L70 76 L50 80 Z' fill='#00B2A9'/>
</svg>`;

// Arsenal FC (أرسنال) - Red Shield & Golden Cannon
const SVG_ARSENAL = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#DB0007' stroke='#023474' stroke-width='4'/>
  <path d='M50 14 L80 26 C80 62 50 87 50 87 C50 87 20 62 20 26 Z' fill='none' stroke='#9C824A' stroke-width='2'/>
  <!-- Golden Cannon Facing Right -->
  <path d='M34 50 L64 47 V53 L34 56 Z' fill='#9C824A'/>
  <circle cx='44' cy='58' r='10' fill='#023474' stroke='#9C824A' stroke-width='2'/>
  <circle cx='44' cy='58' r='4' fill='#9C824A'/>
  <circle cx='66' cy='50' r='3.5' fill='#9C824A'/>
</svg>`;

// Bayern Munich (بايرن ميونخ) - Red Circle with Bavarian Diamonds
const SVG_BAYERN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#DC052D' stroke='#FFFFFF' stroke-width='3'/>
  <circle cx='50' cy='50' r='36' fill='#0066B2' stroke='#FFFFFF' stroke-width='3'/>
  <g transform='translate(50,50) rotate(-30) translate(-50,-50)'>
    <!-- Bavarian Blue & White Diamonds Pattern -->
    <rect x='28' y='28' width='44' height='44' fill='#0066B2'/>
    <polygon points='34,28 50,44 34,60 18,44' fill='#FFFFFF'/>
    <polygon points='50,28 66,44 50,60 34,44' fill='#0066B2'/>
    <polygon points='66,28 82,44 66,60 50,44' fill='#FFFFFF'/>
    <polygon points='50,44 66,60 50,76 34,60' fill='#FFFFFF'/>
  </g>
  <circle cx='50' cy='50' r='24' fill='none' stroke='#FFFFFF' stroke-width='2'/>
</svg>`;

// Paris Saint-Germain (باريس سان جيرمان) - Navy, Red Eiffel Tower & Gold Fleur-de-lis
const SVG_PSG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#004170' stroke='#DA291C' stroke-width='3'/>
  <circle cx='50' cy='50' r='36' fill='#FFFFFF'/>
  <circle cx='50' cy='50' r='32' fill='#004170'/>
  <!-- Red Eiffel Tower -->
  <path d='M47 30 H53 L55 52 H64 L62 70 H38 L36 52 H45 Z' fill='#DA291C'/>
  <path d='M45 56 C45 56 50 52 55 56' stroke='#FFFFFF' stroke-width='2' fill='none'/>
  <!-- Golden Fleur-de-lis of Saint-Germain -->
  <path d='M50 60 C47 64 44 65 44 68 C44 71 47 71 50 71 C53 71 56 71 56 68 C56 65 53 64 50 60 Z' fill='#FFD700'/>
</svg>`;

// Chelsea FC (تشيلسي) - Royal Blue with Rampant Lion & Staff
const SVG_CHELSEA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#034694' stroke='#DBA111' stroke-width='3'/>
  <circle cx='50' cy='50' r='36' fill='#FFFFFF'/>
  <!-- Rampant Blue Lion Reguardant -->
  <path d='M52 32 C58 32 62 38 62 44 C62 48 58 52 58 56 C58 64 64 70 60 74 H48 L46 64 C42 62 38 56 38 48 C38 38 44 32 52 32 Z' fill='#034694'/>
  <!-- Abbot's Staff in Gold & Red Rose -->
  <line x1='58' y1='28' x2='68' y2='68' stroke='#DBA111' stroke-width='3' stroke-linecap='round'/>
  <circle cx='36' cy='50' r='4' fill='#ED1C24'/>
  <circle cx='64' cy='50' r='4' fill='#ED1C24'/>
</svg>`;

// Manchester United (مانشستر يونايتد) - Red Devil & Three-Masted Ship Shield
const SVG_MAN_UTD = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#DA291C' stroke='#FBE122' stroke-width='4'/>
  <path d='M50 14 L80 26 C80 62 50 87 50 87 C50 87 20 62 20 26 Z' fill='#FFE500'/>
  <!-- Three-Masted Golden Ship -->
  <path d='M36 34 L40 28 H60 L64 34 L50 40 Z' fill='#DA291C'/>
  <!-- The Red Devil with Pitchfork -->
  <circle cx='50' cy='52' r='7' fill='#DA291C'/>
  <path d='M46 58 L42 74 H58 L54 58 Z' fill='#DA291C'/>
  <line x1='36' y1='48' x2='34' y2='74' stroke='#DA291C' stroke-width='2'/>
  <polygon points='34,44 31,48 37,48' fill='#DA291C'/>
</svg>`;

// Atlético Madrid (أتلتيكو مدريد) - Red & White Stripes, Bear & Strawberry Tree
const SVG_ATLETICO = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L84 22 C84 66 50 92 50 92 C50 92 16 66 16 22 Z' fill='#FFFFFF' stroke='#272E61' stroke-width='4'/>
  <!-- Red Stripes -->
  <path d='M28 42 V78 C32 82 36 85 40 88 V42 Z' fill='#CB3524'/>
  <path d='M48 42 V91 C50 92 52 91 52 91 V42 Z' fill='#CB3524'/>
  <path d='M60 42 V88 C64 85 68 82 72 78 V42 Z' fill='#CB3524'/>
  <!-- Top Blue Field with Bear & Stars -->
  <path d='M18 23 L50 10 L82 23 V42 H18 Z' fill='#272E61'/>
  <circle cx='34' cy='24' r='2' fill='#FFFFFF'/>
  <circle cx='50' cy='20' r='2' fill='#FFFFFF'/>
  <circle cx='66' cy='24' r='2' fill='#FFFFFF'/>
  <circle cx='42' cy='32' r='2' fill='#FFFFFF'/>
  <circle cx='58' cy='32' r='2' fill='#FFFFFF'/>
</svg>`;

// Inter Milan (إنتر ميلان) - Modern Black & Blue Monogram
const SVG_INTER_MILAN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#001EA0' stroke='#111111' stroke-width='4'/>
  <circle cx='50' cy='50' r='36' fill='#111111'/>
  <circle cx='50' cy='50' r='30' fill='#001EA0'/>
  <!-- White IM Monogram -->
  <path d='M38 34 H44 V66 H38 Z' fill='#FFFFFF'/>
  <path d='M56 34 H62 V66 H56 Z' fill='#FFFFFF'/>
  <path d='M44 34 L50 48 L56 34' stroke='#FFFFFF' stroke-width='5' fill='none' stroke-linejoin='round'/>
</svg>`;

// AC Milan (ميلان) - Oval Red/Black Stripes & St. Ambrose Red Cross
const SVG_AC_MILAN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <ellipse cx='50' cy='50' rx='34' ry='44' fill='#FFFFFF' stroke='#111111' stroke-width='3.5'/>
  <!-- Left Half: Red & Black Stripes -->
  <path d='M50 8 A32 42 0 0 0 20 50 A32 42 0 0 0 50 92 Z' fill='#FB090B'/>
  <path d='M30 18 A32 42 0 0 0 24 50 A32 42 0 0 0 30 82 Z' fill='#111111'/>
  <path d='M42 9 A32 42 0 0 0 38 50 A32 42 0 0 0 42 91 Z' fill='#111111'/>
  <!-- Right Half: St Ambrose Red Cross -->
  <path d='M50 8 A32 42 0 0 1 80 50 A32 42 0 0 1 50 92 Z' fill='#FFFFFF'/>
  <rect x='62' y='12' width='6' height='76' fill='#FB090B'/>
  <rect x='50' y='46' width='30' height='8' fill='#FB090B'/>
  <!-- Dividing line -->
  <line x1='50' y1='8' x2='50' y2='92' stroke='#111111' stroke-width='2'/>
</svg>`;

// Borussia Dortmund (بوروسيا دورتموند) - BVB 09 Golden Circle
const SVG_DORTMUND = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#FDE100' stroke='#111111' stroke-width='4'/>
  <circle cx='50' cy='50' r='40' fill='none' stroke='#111111' stroke-width='1.5'/>
  <text x='50' y='52' font-family='Arial, sans-serif' font-weight='900' font-size='22' text-anchor='middle' fill='#111111'>BVB</text>
  <text x='50' y='72' font-family='Arial, sans-serif' font-weight='900' font-size='16' text-anchor='middle' fill='#111111'>09</text>
</svg>`;

// Juventus (يوفنتوس) - Modern Black & White Monogram Shield
const SVG_JUVENTUS = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 6 L86 18 V62 C86 78 50 94 50 94 C50 94 14 78 14 62 V18 Z' fill='#111111' stroke='#FFFFFF' stroke-width='2'/>
  <!-- Iconic Modern J Monograms -->
  <path d='M38 24 H48 V56 C48 62 44 66 38 66 C32 66 30 62 30 58' fill='none' stroke='#FFFFFF' stroke-width='7' stroke-linecap='square'/>
  <path d='M56 24 H66 V64 C66 74 58 80 48 80' fill='none' stroke='#FFFFFF' stroke-width='7' stroke-linecap='square'/>
</svg>`;

// -------------------------------------------------------------
// 3. ARAB POWERHOUSES (أندية القمة العربية)
// -------------------------------------------------------------

// Al Ahly SC Egypt (الأهلي المصري / نادي القرن) - Red Shield & Soaring Eagle
const SVG_AL_AHLY_EGYPT = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 68 50 94 50 94 C50 94 14 68 14 22 Z' fill='#E30613' stroke='#D4AF37' stroke-width='3.5'/>
  <!-- 4 Continental Stars -->
  <polygon points='34,20 35,23 38,23 36,25 37,28 34,26 31,28 32,25 30,23 33,23' fill='#D4AF37'/>
  <polygon points='44,18 45,21 48,21 46,23 47,26 44,24 41,26 42,23 40,21 43,21' fill='#D4AF37'/>
  <polygon points='56,18 57,21 60,21 58,23 59,26 56,24 53,26 54,23 52,21 55,21' fill='#D4AF37'/>
  <polygon points='66,20 67,23 70,23 68,25 69,28 66,26 63,28 64,25 62,23 65,23' fill='#D4AF37'/>
  <!-- Soaring Eagle Profile in Gold & Black -->
  <path d='M50 34 C44 40 38 48 34 58 C42 56 48 56 50 62 C52 56 58 56 66 58 C62 48 56 40 50 34 Z' fill='#D4AF37'/>
  <path d='M44 48 L50 42 L56 48 L50 45 Z' fill='#111111'/>
</svg>`;

// Zamalek SC (الزمالك) - White Shield with Two Red Stripes & Archer
const SVG_ZAMALEK = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 68 50 94 50 94 C50 94 14 68 14 22 Z' fill='#FFFFFF' stroke='#111111' stroke-width='3'/>
  <!-- The Famous Two Red Horizontal Stripes -->
  <rect x='16' y='36' width='68' height='7' fill='#E30613'/>
  <rect x='16' y='50' width='68' height='7' fill='#E30613'/>
  <!-- Pharaonic Archer Symbol -->
  <circle cx='50' cy='26' r='4' fill='#E30613'/>
  <path d='M46 30 L54 30 L58 40 L44 40 Z' fill='#E30613'/>
  <path d='M42 66 L50 78 L58 66' stroke='#E30613' stroke-width='3' fill='none'/>
</svg>`;

// Map SVG definitions to data URIs
const TEAM_SVG_MAP: Record<string, string> = {
  // Saudi Pro League
  al_hilal: svgToDataUri(SVG_AL_HILAL),
  al_nassr: svgToDataUri(SVG_AL_NASSR),
  al_ittihad: svgToDataUri(SVG_AL_ITTIHAD),
  al_ahli_saudi: svgToDataUri(SVG_AL_AHLI_SAUDI),
  al_shabab: svgToDataUri(SVG_AL_SHABAB),
  al_taawoun: svgToDataUri(SVG_AL_TAAWOUN),
  al_ettifaq: svgToDataUri(SVG_AL_ETTIFAQ),
  al_fateh: svgToDataUri(SVG_AL_FATEH),
  al_fayha: svgToDataUri(SVG_AL_FAYHA),
  damac: svgToDataUri(SVG_DAMAC),
  al_khaleej: svgToDataUri(SVG_AL_KHALEEJ),
  al_raed: svgToDataUri(SVG_AL_RAED),
  al_wehda: svgToDataUri(SVG_AL_WEHDA),
  al_qadsiah: svgToDataUri(SVG_AL_QADSIAH),
  al_riyadh: svgToDataUri(SVG_AL_RIYADH),

  // Europe
  real_madrid: svgToDataUri(SVG_REAL_MADRID),
  barcelona: svgToDataUri(SVG_BARCELONA),
  man_city: svgToDataUri(SVG_MAN_CITY),
  liverpool: svgToDataUri(SVG_LIVERPOOL),
  arsenal: svgToDataUri(SVG_ARSENAL),
  bayern_munich: svgToDataUri(SVG_BAYERN),
  psg: svgToDataUri(SVG_PSG),
  chelsea: svgToDataUri(SVG_CHELSEA),
  man_united: svgToDataUri(SVG_MAN_UTD),
  atletico_madrid: svgToDataUri(SVG_ATLETICO),
  inter_milan: svgToDataUri(SVG_INTER_MILAN),
  ac_milan: svgToDataUri(SVG_AC_MILAN),
  borussia_dortmund: svgToDataUri(SVG_DORTMUND),
  juventus: svgToDataUri(SVG_JUVENTUS),

  // Arab Powerhouses
  al_ahly_egypt: svgToDataUri(SVG_AL_AHLY_EGYPT),
  zamalek: svgToDataUri(SVG_ZAMALEK)
};

/**
 * Resolves an authentic SVG crest data URI for a given team name
 * Handles Arabic variants, English names, prefixes (نادي, FC, SC), and common typos.
 */
export function getTeamLogoSvg(rawName?: string | null): string | null {
  if (!rawName) return null;
  const clean = rawName
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. SAUDI PRO LEAGUE (Focus on Saudi)
  if (clean.includes('هلال') || clean.includes('hilal')) return TEAM_SVG_MAP.al_hilal;
  if (clean.includes('نصر') || clean.includes('nassr')) return TEAM_SVG_MAP.al_nassr;
  if (clean.includes('اتحاد') || clean.includes('ittihad')) return TEAM_SVG_MAP.al_ittihad;
  if ((clean.includes('اهلي') && (clean.includes('سعودي') || clean.includes('جده'))) || clean.includes('ahli saudi')) {
    return TEAM_SVG_MAP.al_ahli_saudi;
  }
  if (clean.includes('شباب') || clean.includes('shabab')) return TEAM_SVG_MAP.al_shabab;
  if (clean.includes('تعاون') || clean.includes('taawoun') || clean.includes('taawon')) return TEAM_SVG_MAP.al_taawoun;
  if (clean.includes('اتفاق') || clean.includes('ettifaq') || clean.includes('ittifaq')) return TEAM_SVG_MAP.al_ettifaq;
  if (clean.includes('فتح') || clean.includes('fateh')) return TEAM_SVG_MAP.al_fateh;
  if (clean.includes('فيحاء') || clean.includes('fayha') || clean.includes('faiha')) return TEAM_SVG_MAP.al_fayha;
  if (clean.includes('ضمك') || clean.includes('damac') || clean.includes('dhamk')) return TEAM_SVG_MAP.damac;
  if (clean.includes('خليج') || clean.includes('khaleej')) return TEAM_SVG_MAP.al_khaleej;
  if (clean.includes('رائد') || clean.includes('raed')) return TEAM_SVG_MAP.al_raed;
  if (clean.includes('وحده') || clean.includes('wehda')) return TEAM_SVG_MAP.al_wehda;
  if (clean.includes('قادسيه') || clean.includes('qadsiah') || clean.includes('qadisiyah')) return TEAM_SVG_MAP.al_qadsiah;
  if (clean.includes('رياض') || clean.includes('riyadh')) return TEAM_SVG_MAP.al_riyadh;

  // 2. EUROPEAN GIANTS
  if (clean.includes('ريال مدريد') || clean.includes('real madrid')) return TEAM_SVG_MAP.real_madrid;
  if (clean.includes('برشلونه') || clean.includes('barcelona') || clean.includes('barca')) return TEAM_SVG_MAP.barcelona;
  if (clean.includes('سيتي') || clean.includes('manchester city') || clean.includes('man city')) return TEAM_SVG_MAP.man_city;
  if (clean.includes('ليفربول') || clean.includes('liverpool')) return TEAM_SVG_MAP.liverpool;
  if (clean.includes('ارسنال') || clean.includes('arsenal')) return TEAM_SVG_MAP.arsenal;
  if (clean.includes('بايرن') || clean.includes('bayern')) return TEAM_SVG_MAP.bayern_munich;
  if (clean.includes('باريس') || clean.includes('psg') || clean.includes('paris saint')) return TEAM_SVG_MAP.psg;
  if (clean.includes('تشيلسي') || clean.includes('chelsea')) return TEAM_SVG_MAP.chelsea;
  if (clean.includes('يونايتد') || clean.includes('man united') || clean.includes('manchester united')) return TEAM_SVG_MAP.man_united;
  if (clean.includes('اتلتيكو') || clean.includes('atletico')) return TEAM_SVG_MAP.atletico_madrid;
  if (clean.includes('انتر') || clean.includes('inter milan')) return TEAM_SVG_MAP.inter_milan;
  if (clean.includes('ميلان') || clean.includes('ac milan')) return TEAM_SVG_MAP.ac_milan;
  if (clean.includes('دورتموند') || clean.includes('dortmund') || clean.includes('bvb')) return TEAM_SVG_MAP.borussia_dortmund;
  if (clean.includes('يوفنتوس') || clean.includes('juventus')) return TEAM_SVG_MAP.juventus;

  // 3. ARAB POWERHOUSES
  if (clean.includes('اهلي مصري') || (clean.includes('اهلي') && !clean.includes('سعودي')) || clean.includes('al ahly')) {
    return TEAM_SVG_MAP.al_ahly_egypt;
  }
  if (clean.includes('زمالك') || clean.includes('zamalek')) return TEAM_SVG_MAP.zamalek;

  return null;
}
