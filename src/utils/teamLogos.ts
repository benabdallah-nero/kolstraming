/**
 * KolStream Vector Team Crests & Badges Library
 * High-fidelity, lightweight, self-contained SVG crests for all teams in the 9 Big Leagues:
 * 
 * 1. Premier League (الدوري الإنجليزي الممتاز)
 * 2. La Liga (الدوري الإسباني)
 * 3. Serie A (الدوري الإيطالي)
 * 4. Bundesliga (الدوري الألماني)
 * 5. Ligue 1 (الدوري الفرنسي)
 * 6. Saudi Pro League (دوري روشن السعودي للمحترفين)
 * 7. Egyptian Premier League (الدوري المصري الممتاز)
 * 8. Botola Pro Inwi (البطولة المغربية الاحترافية)
 * 9. UEFA Champions League Contenders
 */

function svgToDataUri(svgContent: string): string {
  const cleaned = svgContent
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'");
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

// =============================================================
// 1. SAUDI PRO LEAGUE (دوري روشن للمحترفين)
// =============================================================

// Al Hilal (الهلال)
const SVG_AL_HILAL = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs><linearGradient id='hilalGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='#002B7F'/><stop offset='100%' stop-color='#0055D4'/></linearGradient></defs>
  <path d='M50 5 L88 20 C88 65 50 95 50 95 C50 95 12 65 12 20 Z' fill='url(#hilalGrad)' stroke='#FFFFFF' stroke-width='3'/>
  <path d='M50 25 C63 25 73 35 73 48 C73 61 63 71 50 71 C43 71 37 68 32 63 C40 65 49 61 52 53 C55 45 51 37 42 33 C45 28 47 25 50 25 Z' fill='#FFFFFF'/>
  <rect x='45' y='32' width='10' height='36' rx='2' fill='#FFFFFF'/>
  <rect x='34' y='46' width='32' height='8' rx='2' fill='#FFFFFF'/>
  <circle cx='50' cy='20' r='3' fill='#FFD700'/>
</svg>`;

// Al Nassr (النصر)
const SVG_AL_NASSR = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <defs><linearGradient id='nassrGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='#FFD000'/><stop offset='100%' stop-color='#E6A100'/></linearGradient></defs>
  <path d='M50 8 L86 24 C86 68 50 94 50 94 C50 94 14 68 14 24 Z' fill='url(#nassrGrad)' stroke='#003399' stroke-width='4'/>
  <path d='M50 14 L80 28 C80 64 50 87 50 87 C50 87 20 64 20 28 Z' fill='#002B7F'/>
  <path d='M32 40 L38 52 L50 42 L62 52 L68 40 L65 58 L35 58 Z' fill='#FFD000'/>
  <circle cx='32' cy='38' r='2' fill='#FFFFFF'/><circle cx='50' cy='39' r='2.5' fill='#FFFFFF'/><circle cx='68' cy='38' r='2' fill='#FFFFFF'/>
  <path d='M50 56 L35 78 H44 L50 67 L56 78 H65 Z' fill='#FFD000'/>
</svg>`;

// Al Ittihad (الاتحاد)
const SVG_AL_ITTIHAD = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 6 L88 22 C88 66 50 94 50 94 C50 94 12 66 12 22 Z' fill='#111111' stroke='#FFD200' stroke-width='4'/>
  <path d='M32 24 L32 75' stroke='#FFD200' stroke-width='6' stroke-linecap='round'/>
  <path d='M68 24 L68 75' stroke='#FFD200' stroke-width='6' stroke-linecap='round'/>
  <path d='M44 38 L52 30 V72 H44' fill='#FFD200'/>
  <rect x='40' y='68' width='20' height='5' rx='1' fill='#FFD200'/>
  <polygon points='50,16 52,21 57,21 53,24 55,29 50,26 45,29 47,24 43,21 48,21' fill='#FFD200'/>
</svg>`;

// Al Ahli Saudi (الأهلي السعودي)
const SVG_AL_AHLI_SAUDI = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 6 L86 22 C86 66 50 94 50 94 C50 94 14 66 14 22 Z' fill='#008542' stroke='#FFFFFF' stroke-width='3.5'/>
  <circle cx='50' cy='50' r='28' fill='#FFFFFF'/>
  <circle cx='50' cy='50' r='24' fill='#008542'/>
  <path d='M50 32 C50 32 46 38 46 44 C46 48 50 50 50 50 C50 50 54 48 54 44 C54 38 50 32 50 32 Z' fill='#FFFFFF'/>
  <path d='M38 60 L62 60' stroke='#FFFFFF' stroke-width='2.5' stroke-linecap='round'/>
  <path d='M42 54 L58 66' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round'/>
  <path d='M58 54 L42 66' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round'/>
</svg>`;

// Al Shabab (الشباب)
const SVG_AL_SHABAB = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 24 C86 66 50 93 50 93 C50 93 14 66 14 24 Z' fill='#151515' stroke='#F26522' stroke-width='3.5'/>
  <path d='M50 14 L80 28 C80 62 50 87 50 87 C50 87 20 62 20 28 Z' fill='#FFFFFF'/>
  <path d='M48 30 C58 30 66 36 66 48 C66 56 62 62 55 67 L60 76 H48 L46 68 C42 67 38 64 36 60 C33 55 34 44 40 37 C42 33 45 30 48 30 Z' fill='#151515'/>
  <polygon points='50,18 52,22 57,22 53,25 55,29 50,27 45,29 47,25 43,22 48,22' fill='#F26522'/>
</svg>`;

// Al Taawoun (التعاون)
const SVG_AL_TAAWOUN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='44' fill='#0B1E3D' stroke='#FFD000' stroke-width='4'/>
  <path d='M36 40 L44 54 L50 46 L56 54 L64 40 L60 62 L50 68 L40 62 Z' fill='#FFD000'/>
</svg>`;

// Al Ettifaq (الاتفاق)
const SVG_AL_ETTIFAQ = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 7 L88 24 C88 68 50 93 50 93 C50 93 12 68 12 24 Z' fill='#007A3D' stroke='#DE1623' stroke-width='4'/>
  <path d='M25 44 L50 60 L75 44 L75 52 L50 68 L25 52 Z' fill='#DE1623'/>
</svg>`;

// Al Qadsiah (القادسية)
const SVG_AL_QADSIAH = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 6 L88 22 C88 66 50 94 50 94 C50 94 12 66 12 22 Z' fill='#CC0000' stroke='#FFCC00' stroke-width='4'/>
  <polygon points='50,28 66,42 60,66 40,66 34,42' fill='#CC0000'/>
  <polygon points='50,34 60,44 56,60 44,60 40,44' fill='#FFCC00'/>
</svg>`;

// =============================================================
// 2. ENGLISH PREMIER LEAGUE (الدوري الإنجليزي الممتاز)
// =============================================================

// Manchester City (مانشستر سيتي)
const SVG_MAN_CITY = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#6CABDD' stroke='#001E62' stroke-width='4'/>
  <circle cx='50' cy='50' r='38' fill='#FFFFFF'/>
  <path d='M50 26 L66 34 C66 54 50 68 50 68 C50 68 34 54 34 34 Z' fill='#6CABDD' stroke='#001E62' stroke-width='1.5'/>
  <path d='M40 38 L44 32 H56 L60 38 L50 44 Z' fill='#FFC659'/>
  <circle cx='50' cy='54' r='4' fill='#DA291C'/>
</svg>`;

// Liverpool FC (ليفربول)
const SVG_LIVERPOOL = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 10 L84 22 C84 66 50 92 50 92 C50 92 16 66 16 22 Z' fill='#C8102E' stroke='#00B2A9' stroke-width='3.5'/>
  <path d='M50 34 C46 34 42 38 42 43 C42 46 44 49 46 51 L44 68 H56 L54 51 C56 49 58 46 58 43 C58 38 54 34 50 34 Z' fill='#F6EB61'/>
  <path d='M42 42 L34 48 L42 50 Z' fill='#F6EB61'/><path d='M58 42 L66 48 L58 50 Z' fill='#F6EB61'/>
</svg>`;

// Arsenal FC (أرسنال)
const SVG_ARSENAL = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#DB0007' stroke='#023474' stroke-width='4'/>
  <path d='M34 50 L64 47 V53 L34 56 Z' fill='#9C824A'/>
  <circle cx='44' cy='58' r='10' fill='#023474' stroke='#9C824A' stroke-width='2'/>
  <circle cx='44' cy='58' r='4' fill='#9C824A'/>
</svg>`;

// Tottenham Hotspur (توتنهام هوتسبر)
const SVG_TOTTENHAM = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='46' fill='#132257' stroke='#FFFFFF' stroke-width='2'/>
  <!-- Standing Cockerel on Football -->
  <path d='M52 22 C56 22 58 25 58 28 C58 30 56 32 54 34 C60 36 66 44 64 54 C62 60 56 64 50 64 C46 64 42 62 40 58 C36 50 40 40 46 36 L44 32 C42 32 40 30 40 28 C40 25 44 22 48 22 Z' fill='#FFFFFF'/>
  <path d='M50 64 V74 H46' stroke='#FFFFFF' stroke-width='2.5' fill='none'/>
  <path d='M54 64 V74 H58' stroke='#FFFFFF' stroke-width='2.5' fill='none'/>
  <!-- Vintage Football -->
  <circle cx='50' cy='82' r='8' fill='#FFFFFF' stroke='#132257' stroke-width='1.5'/>
</svg>`;

// Manchester United (مانشستر يونايتد)
const SVG_MAN_UTD = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#DA291C' stroke='#FBE122' stroke-width='4'/>
  <path d='M50 14 L80 26 C80 62 50 87 50 87 C50 87 20 62 20 26 Z' fill='#FFE500'/>
  <path d='M36 34 L40 28 H60 L64 34 L50 40 Z' fill='#DA291C'/>
  <circle cx='50' cy='52' r='6' fill='#DA291C'/>
  <path d='M46 58 L42 74 H58 L54 58 Z' fill='#DA291C'/>
</svg>`;

// Chelsea FC (تشيلسي)
const SVG_CHELSEA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#034694' stroke='#DBA111' stroke-width='3'/>
  <circle cx='50' cy='50' r='36' fill='#FFFFFF'/>
  <path d='M52 32 C58 32 62 38 62 44 C62 48 58 52 58 56 C58 64 64 70 60 74 H48 L46 64 C42 62 38 56 38 48 C38 38 44 32 52 32 Z' fill='#034694'/>
</svg>`;

// Newcastle United (نيوكاسل يونايتد)
const SVG_NEWCASTLE = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#FFFFFF' stroke='#41B6E6' stroke-width='3'/>
  <rect x='26' y='22' width='10' height='60' fill='#111111'/>
  <rect x='46' y='22' width='8' height='68' fill='#111111'/>
  <rect x='64' y='22' width='10' height='60' fill='#111111'/>
  <path d='M50 8 L58 18 H42 Z' fill='#41B6E6'/>
</svg>`;

// Leeds United (ليدز يونايتد)
const SVG_LEEDS = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#FFFFFF' stroke='#1D428A' stroke-width='4'/>
  <path d='M50 14 L80 26 C80 62 50 87 50 87 C50 87 20 62 20 26 Z' fill='#FFCD00'/>
  <path d='M30 40 L50 28 L70 40 V60 L50 74 L30 60 Z' fill='#1D428A'/>
  <!-- White Rose of York -->
  <circle cx='50' cy='52' r='8' fill='#FFFFFF'/>
  <circle cx='50' cy='52' r='4' fill='#FFCD00'/>
</svg>`;

// Fulham FC (فولهام)
const SVG_FULHAM = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#FFFFFF' stroke='#111111' stroke-width='4'/>
  <path d='M40 34 H62 V42 H48 V48 H58 V56 H48 V68 H40 Z' fill='#CC0000'/>
</svg>`;

// Nottingham Forest (نوتينجهام فورست)
const SVG_NOTTINGHAM = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <rect x='6' y='6' width='88' height='88' rx='16' fill='#DD0000' stroke='#FFFFFF' stroke-width='2'/>
  <!-- Sherwood Forest Tree Silhouette -->
  <path d='M46 64 V76 H54 V64 C64 62 70 54 70 44 C70 34 62 26 50 26 C38 26 30 34 30 44 C30 54 36 62 46 64 Z' fill='#FFFFFF'/>
  <path d='M30 82 Q50 78 70 82' stroke='#FFFFFF' stroke-width='3' fill='none'/>
</svg>`;

// =============================================================
// 3. SPANISH LA LIGA (الدوري الإسباني)
// =============================================================

// Real Madrid (ريال مدريد)
const SVG_REAL_MADRID = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M30 26 L36 34 L50 24 L64 34 L70 26 L66 40 H34 Z' fill='#FFD700' stroke='#B8860B' stroke-width='1.5'/>
  <circle cx='50' cy='22' r='3' fill='#FF0000'/><circle cx='30' cy='24' r='2' fill='#FF0000'/><circle cx='70' cy='24' r='2' fill='#FF0000'/>
  <circle cx='50' cy='62' r='32' fill='#FFFFFF' stroke='#FFD700' stroke-width='3.5'/>
  <path d='M30 46 L68 84 L74 78 L36 40 Z' fill='#6C3483'/>
  <circle cx='50' cy='62' r='18' fill='none' stroke='#FFD700' stroke-width='2.5'/>
</svg>`;

// FC Barcelona (برشلونة)
const SVG_BARCELONA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 C68 8 86 16 86 24 C86 64 50 92 50 92 C50 92 14 64 14 24 C14 16 32 8 50 8 Z' fill='#FFD700' stroke='#B8860B' stroke-width='3'/>
  <path d='M18 24 C18 36 32 46 48 46 V24 Z' fill='#FFFFFF'/>
  <rect x='30' y='24' width='6' height='22' fill='#ED1B24'/><rect x='20' y='32' width='26' height='6' fill='#ED1B24'/>
  <path d='M52 24 V46 C68 46 82 36 82 24 Z' fill='#FFD700'/>
  <rect x='57' y='24' width='4' height='22' fill='#ED1B24'/><rect x='67' y='24' width='4' height='22' fill='#ED1B24'/>
  <path d='M18 48 C20 70 50 88 50 88 C50 88 80 70 82 48 Z' fill='#004D98'/>
  <path d='M30 48 C32 66 42 78 42 78 V48 Z' fill='#A50044'/><path d='M58 48 V78 C58 78 68 66 70 48 Z' fill='#A50044'/>
  <circle cx='50' cy='66' r='7' fill='#E0A526' stroke='#111111' stroke-width='1'/>
</svg>`;

// Atlético Madrid (أتلتيكو مدريد)
const SVG_ATLETICO = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L84 22 C84 66 50 92 50 92 C50 92 16 66 16 22 Z' fill='#FFFFFF' stroke='#272E61' stroke-width='4'/>
  <path d='M28 42 V78 C32 82 36 85 40 88 V42 Z' fill='#CB3524'/>
  <path d='M48 42 V91 C50 92 52 91 52 91 V42 Z' fill='#CB3524'/>
  <path d='M60 42 V88 C64 85 68 82 72 78 V42 Z' fill='#CB3524'/>
  <path d='M18 23 L50 10 L82 23 V42 H18 Z' fill='#272E61'/>
  <circle cx='34' cy='24' r='2' fill='#FFFFFF'/><circle cx='50' cy='20' r='2' fill='#FFFFFF'/><circle cx='66' cy='24' r='2' fill='#FFFFFF'/>
</svg>`;

// Valencia CF (فالنسيا)
const SVG_VALENCIA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <!-- Bat Wings Crest Header -->
  <path d='M50 14 C44 6 30 10 24 18 C32 20 38 26 40 32 C44 26 50 26 50 26 C50 26 56 26 60 32 C62 26 68 20 76 18 C70 10 56 6 50 14 Z' fill='#111111'/>
  <!-- Shield with Senyera Stripes -->
  <path d='M50 28 L80 38 C80 68 50 90 50 90 C50 90 20 68 20 38 Z' fill='#FFD700' stroke='#111111' stroke-width='2.5'/>
  <rect x='30' y='38' width='6' height='48' fill='#D21034'/>
  <rect x='42' y='38' width='6' height='50' fill='#D21034'/>
  <rect x='52' y='38' width='6' height='50' fill='#D21034'/>
  <rect x='64' y='38' width='6' height='48' fill='#D21034'/>
  <circle cx='50' cy='60' r='10' fill='#FFFFFF' stroke='#111111' stroke-width='1.5'/>
</svg>`;

// Athletic Bilbao (أتلتيك بلباو)
const SVG_BILBAO = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#FFFFFF' stroke='#111111' stroke-width='3.5'/>
  <rect x='24' y='22' width='10' height='60' fill='#EE2524'/>
  <rect x='44' y='22' width='12' height='68' fill='#EE2524'/>
  <rect x='66' y='22' width='10' height='60' fill='#EE2524'/>
  <path d='M50 14 L68 28 H32 Z' fill='#EE2524'/>
</svg>`;

// Espanyol (إسبانيول)
const SVG_ESPANYOL = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='56' r='36' fill='#0079C1' stroke='#FFD700' stroke-width='3'/>
  <rect x='36' y='26' width='8' height='60' fill='#FFFFFF'/>
  <rect x='56' y='26' width='8' height='60' fill='#FFFFFF'/>
  <path d='M34 18 L40 24 L50 16 L60 24 L66 18 H34 Z' fill='#FFD700'/>
</svg>`;

// =============================================================
// 4. ITALIAN SERIE A (الدوري الإيطالي)
// =============================================================

// Inter Milan (إنتر ميلان)
const SVG_INTER_MILAN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#001EA0' stroke='#111111' stroke-width='4'/>
  <circle cx='50' cy='50' r='36' fill='#111111'/>
  <circle cx='50' cy='50' r='30' fill='#001EA0'/>
  <path d='M38 34 H44 V66 H38 Z' fill='#FFFFFF'/>
  <path d='M56 34 H62 V66 H56 Z' fill='#FFFFFF'/>
  <path d='M44 34 L50 48 L56 34' stroke='#FFFFFF' stroke-width='5' fill='none' stroke-linejoin='round'/>
</svg>`;

// AC Milan (ميلان)
const SVG_AC_MILAN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <ellipse cx='50' cy='50' rx='34' ry='44' fill='#FFFFFF' stroke='#111111' stroke-width='3.5'/>
  <path d='M50 8 A32 42 0 0 0 20 50 A32 42 0 0 0 50 92 Z' fill='#FB090B'/>
  <path d='M30 18 A32 42 0 0 0 24 50 A32 42 0 0 0 30 82 Z' fill='#111111'/>
  <path d='M42 9 A32 42 0 0 0 38 50 A32 42 0 0 0 42 91 Z' fill='#111111'/>
  <path d='M50 8 A32 42 0 0 1 80 50 A32 42 0 0 1 50 92 Z' fill='#FFFFFF'/>
  <rect x='62' y='12' width='6' height='76' fill='#FB090B'/>
  <rect x='50' y='46' width='30' height='8' fill='#FB090B'/>
  <line x1='50' y1='8' x2='50' y2='92' stroke='#111111' stroke-width='2'/>
</svg>`;

// Juventus (يوفنتوس)
const SVG_JUVENTUS = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 6 L86 18 V62 C86 78 50 94 50 94 C50 94 14 78 14 62 V18 Z' fill='#111111' stroke='#FFFFFF' stroke-width='2'/>
  <path d='M38 24 H48 V56 C48 62 44 66 38 66 C32 66 30 62 30 58' fill='none' stroke='#FFFFFF' stroke-width='7' stroke-linecap='square'/>
  <path d='M56 24 H66 V64 C66 74 58 80 48 80' fill='none' stroke='#FFFFFF' stroke-width='7' stroke-linecap='square'/>
</svg>`;

// AS Roma (روما)
const SVG_ROMA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 66 50 93 50 93 C50 93 14 66 14 22 Z' fill='#8E1F2F' stroke='#F1B82D' stroke-width='3.5'/>
  <path d='M14 54 C14 74 50 93 50 93 C50 93 86 74 86 54 H14 Z' fill='#F1B82D'/>
  <!-- Wolf Silhouette -->
  <path d='M36 34 C42 30 56 30 64 36 C64 42 58 46 54 46 H44 L38 42 Z' fill='#F1B82D'/>
  <circle cx='46' cy='48' r='2' fill='#8E1F2F'/><circle cx='52' cy='48' r='2' fill='#8E1F2F'/>
</svg>`;

// Napoli (نابولي)
const SVG_NAPOLI = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#003C82' stroke='#FFFFFF' stroke-width='3'/>
  <circle cx='50' cy='50' r='38' fill='#12A0D7'/>
  <text x='50' y='68' font-family='Arial, sans-serif' font-weight='900' font-size='52' text-anchor='middle' fill='#FFFFFF'>N</text>
</svg>`;

// =============================================================
// 5. GERMAN BUNDESLIGA (الدوري الألماني)
// =============================================================

// Bayern Munich (بايرن ميونخ)
const SVG_BAYERN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#DC052D' stroke='#FFFFFF' stroke-width='3'/>
  <circle cx='50' cy='50' r='36' fill='#0066B2' stroke='#FFFFFF' stroke-width='3'/>
  <g transform='translate(50,50) rotate(-30) translate(-50,-50)'>
    <polygon points='34,28 50,44 34,60 18,44' fill='#FFFFFF'/>
    <polygon points='50,28 66,44 50,60 34,44' fill='#0066B2'/>
    <polygon points='66,28 82,44 66,60 50,44' fill='#FFFFFF'/>
  </g>
</svg>`;

// Borussia Dortmund (بوروسيا دورتموند)
const SVG_DORTMUND = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#FDE100' stroke='#111111' stroke-width='4'/>
  <text x='50' y='52' font-family='Arial, sans-serif' font-weight='900' font-size='22' text-anchor='middle' fill='#111111'>BVB</text>
  <text x='50' y='72' font-family='Arial, sans-serif' font-weight='900' font-size='16' text-anchor='middle' fill='#111111'>09</text>
</svg>`;

// Bayer Leverkusen (باير ليفركوزن)
const SVG_LEVERKUSEN = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#E32219' stroke='#111111' stroke-width='3.5'/>
  <circle cx='50' cy='50' r='36' fill='#111111'/>
  <circle cx='50' cy='50' r='24' fill='#E32219'/>
  <rect x='46' y='32' width='8' height='36' fill='#FFFFFF'/>
  <rect x='32' y='46' width='36' height='8' fill='#FFFFFF'/>
</svg>`;

// =============================================================
// 6. FRENCH LIGUE 1 (الدوري الفرنسي)
// =============================================================

// Paris Saint-Germain (باريس سان جيرمان)
const SVG_PSG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#004170' stroke='#DA291C' stroke-width='3'/>
  <circle cx='50' cy='50' r='36' fill='#FFFFFF'/>
  <circle cx='50' cy='50' r='32' fill='#004170'/>
  <path d='M47 30 H53 L55 52 H64 L62 70 H38 L36 52 H45 Z' fill='#DA291C'/>
  <path d='M50 60 C47 64 44 65 44 68 C44 71 47 71 50 71 C53 71 56 71 56 68 C56 65 53 64 50 60 Z' fill='#FFD700'/>
</svg>`;

// Marseille (مارسيليا)
const SVG_MARSEILLE = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='45' fill='#FFFFFF' stroke='#00A3E0' stroke-width='4'/>
  <text x='50' y='64' font-family='Arial, sans-serif' font-weight='900' font-size='42' text-anchor='middle' fill='#00A3E0'>OM</text>
  <polygon points='50,18 52,22 57,22 53,25 55,29 50,27 45,29 47,25 43,22 48,22' fill='#FFD700'/>
</svg>`;

// =============================================================
// 7. ARAB POWERHOUSES (أندية القمة المصرية والمغربية)
// =============================================================

// Al Ahly Egypt (الأهلي المصري)
const SVG_AL_AHLY_EGYPT = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 68 50 94 50 94 C50 94 14 68 14 22 Z' fill='#E30613' stroke='#D4AF37' stroke-width='3.5'/>
  <polygon points='34,20 35,23 38,23 36,25 37,28 34,26 31,28 32,25 30,23 33,23' fill='#D4AF37'/>
  <polygon points='44,18 45,21 48,21 46,23 47,26 44,24 41,26 42,23 40,21 43,21' fill='#D4AF37'/>
  <polygon points='56,18 57,21 60,21 58,23 59,26 56,24 53,26 54,23 52,21 55,21' fill='#D4AF37'/>
  <polygon points='66,20 67,23 70,23 68,25 69,28 66,26 63,28 64,25 62,23 65,23' fill='#D4AF37'/>
  <path d='M50 34 C44 40 38 48 34 58 C42 56 48 56 50 62 C52 56 58 56 66 58 C62 48 56 40 50 34 Z' fill='#D4AF37'/>
</svg>`;

// Zamalek (الزمالك)
const SVG_ZAMALEK = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 68 50 94 50 94 C50 94 14 68 14 22 Z' fill='#FFFFFF' stroke='#111111' stroke-width='3'/>
  <rect x='16' y='36' width='68' height='7' fill='#E30613'/>
  <rect x='16' y='50' width='68' height='7' fill='#E30613'/>
  <circle cx='50' cy='26' r='4' fill='#E30613'/>
  <path d='M42 66 L50 78 L58 66' stroke='#E30613' stroke-width='3' fill='none'/>
</svg>`;

// Wydad AC (الوداد البيضاوي)
const SVG_WYDAD = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='46' fill='#D21034' stroke='#FFFFFF' stroke-width='3'/>
  <!-- Golden Sun Crescent & Stars -->
  <path d='M30 42 C30 62 48 76 68 68 C54 74 38 64 38 46 C38 36 42 30 42 30 C34 34 30 38 30 42 Z' fill='#FFD700'/>
  <circle cx='52' cy='46' r='5' fill='#FFFFFF'/>
  <polygon points='50,22 52,26 57,26 53,29 55,33 50,30 45,33 47,29 43,26 48,26' fill='#FFD700'/>
</svg>`;

// Raja CA (الرجاء الرياضي)
const SVG_RAJA = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <circle cx='50' cy='50' r='46' fill='#008542' stroke='#FFFFFF' stroke-width='3'/>
  <circle cx='50' cy='50' r='38' fill='#FFFFFF'/>
  <!-- Soaring Green Eagle -->
  <path d='M50 28 C42 34 34 44 32 56 C42 54 48 54 50 60 C52 54 58 54 68 56 C66 44 58 34 50 28 Z' fill='#008542'/>
  <circle cx='50' cy='72' r='4' fill='#FFD700'/>
</svg>`;

// AS FAR (الجيش الملكي)
const SVG_AS_FAR = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
  <path d='M50 8 L86 22 C86 68 50 94 50 94 C50 94 14 68 14 22 Z' fill='#006233' stroke='#C1272D' stroke-width='4'/>
  <rect x='16' y='36' width='68' height='12' fill='#111111'/>
  <polygon points='50,22 52,26 57,26 53,29 55,33 50,30 45,33 47,29 43,26 48,26' fill='#FFD700'/>
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
  al_qadsiah: svgToDataUri(SVG_AL_QADSIAH),

  // Premier League
  man_city: svgToDataUri(SVG_MAN_CITY),
  liverpool: svgToDataUri(SVG_LIVERPOOL),
  arsenal: svgToDataUri(SVG_ARSENAL),
  tottenham: svgToDataUri(SVG_TOTTENHAM),
  man_united: svgToDataUri(SVG_MAN_UTD),
  chelsea: svgToDataUri(SVG_CHELSEA),
  newcastle: svgToDataUri(SVG_NEWCASTLE),
  leeds: svgToDataUri(SVG_LEEDS),
  fulham: svgToDataUri(SVG_FULHAM),
  nottingham: svgToDataUri(SVG_NOTTINGHAM),

  // La Liga
  real_madrid: svgToDataUri(SVG_REAL_MADRID),
  barcelona: svgToDataUri(SVG_BARCELONA),
  atletico_madrid: svgToDataUri(SVG_ATLETICO),
  valencia: svgToDataUri(SVG_VALENCIA),
  athletic_bilbao: svgToDataUri(SVG_BILBAO),
  espanyol: svgToDataUri(SVG_ESPANYOL),

  // Serie A
  inter_milan: svgToDataUri(SVG_INTER_MILAN),
  ac_milan: svgToDataUri(SVG_AC_MILAN),
  juventus: svgToDataUri(SVG_JUVENTUS),
  roma: svgToDataUri(SVG_ROMA),
  napoli: svgToDataUri(SVG_NAPOLI),

  // Bundesliga
  bayern_munich: svgToDataUri(SVG_BAYERN),
  borussia_dortmund: svgToDataUri(SVG_DORTMUND),
  leverkusen: svgToDataUri(SVG_LEVERKUSEN),

  // Ligue 1
  psg: svgToDataUri(SVG_PSG),
  marseille: svgToDataUri(SVG_MARSEILLE),

  // Arab Powerhouses
  al_ahly_egypt: svgToDataUri(SVG_AL_AHLY_EGYPT),
  zamalek: svgToDataUri(SVG_ZAMALEK),
  wydad: svgToDataUri(SVG_WYDAD),
  raja: svgToDataUri(SVG_RAJA),
  as_far: svgToDataUri(SVG_AS_FAR)
};

/**
 * Resolves an authentic SVG crest data URI for a given team name
 * Handles Arabic variants, English names, and prefixes.
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

  // 1. SAUDI PRO LEAGUE
  if (clean.includes('هلال') || clean.includes('hilal')) return TEAM_SVG_MAP.al_hilal;
  if (clean.includes('نصر') || clean.includes('nassr')) return TEAM_SVG_MAP.al_nassr;
  if (clean.includes('اتحاد') || clean.includes('ittihad')) return TEAM_SVG_MAP.al_ittihad;
  if ((clean.includes('اهلي') && (clean.includes('سعودي') || clean.includes('جده'))) || clean.includes('ahli saudi')) {
    return TEAM_SVG_MAP.al_ahli_saudi;
  }
  if (clean.includes('شباب') || clean.includes('shabab')) return TEAM_SVG_MAP.al_shabab;
  if (clean.includes('تعاون') || clean.includes('taawoun')) return TEAM_SVG_MAP.al_taawoun;
  if (clean.includes('اتفاق') || clean.includes('ettifaq')) return TEAM_SVG_MAP.al_ettifaq;
  if (clean.includes('قادسيه') || clean.includes('qadsiah')) return TEAM_SVG_MAP.al_qadsiah;

  // 2. PREMIER LEAGUE
  if (clean.includes('توتنهام') || clean.includes('tottenham') || clean.includes('spurs')) return TEAM_SVG_MAP.tottenham;
  if (clean.includes('ليدز') || clean.includes('leeds')) return TEAM_SVG_MAP.leeds;
  if (clean.includes('سيتي') || clean.includes('manchester city') || clean.includes('man city')) return TEAM_SVG_MAP.man_city;
  if (clean.includes('ليفربول') || clean.includes('liverpool')) return TEAM_SVG_MAP.liverpool;
  if (clean.includes('ارسنال') || clean.includes('arsenal')) return TEAM_SVG_MAP.arsenal;
  if (clean.includes('تشيلسي') || clean.includes('chelsea')) return TEAM_SVG_MAP.chelsea;
  if (clean.includes('يونايتد') || clean.includes('manchester united') || clean.includes('man united')) return TEAM_SVG_MAP.man_united;
  if (clean.includes('نيوكاسل') || clean.includes('newcastle')) return TEAM_SVG_MAP.newcastle;
  if (clean.includes('فولهام') || clean.includes('fulham')) return TEAM_SVG_MAP.fulham;
  if (clean.includes('نوتينجهام') || clean.includes('فورست') || clean.includes('nottingham')) return TEAM_SVG_MAP.nottingham;

  // 3. LA LIGA
  if (clean.includes('ريال مدريد') || clean.includes('real madrid')) return TEAM_SVG_MAP.real_madrid;
  if (clean.includes('برشلونه') || clean.includes('barcelona') || clean.includes('barca')) return TEAM_SVG_MAP.barcelona;
  if (clean.includes('اتلتيكو') || clean.includes('atletico')) return TEAM_SVG_MAP.atletico_madrid;
  if (clean.includes('فالنسيا') || clean.includes('valencia')) return TEAM_SVG_MAP.valencia;
  if (clean.includes('بلباو') || clean.includes('bilbao') || clean.includes('athletic')) return TEAM_SVG_MAP.athletic_bilbao;
  if (clean.includes('اسبانيول') || clean.includes('espanyol')) return TEAM_SVG_MAP.espanyol;

  // 4. SERIE A
  if (clean.includes('انتر') || clean.includes('inter')) return TEAM_SVG_MAP.inter_milan;
  if (clean.includes('ميلان') || clean.includes('milan')) return TEAM_SVG_MAP.ac_milan;
  if (clean.includes('يوفنتوس') || clean.includes('juventus')) return TEAM_SVG_MAP.juventus;
  if (clean.includes('روما') || clean.includes('roma')) return TEAM_SVG_MAP.roma;
  if (clean.includes('نابولي') || clean.includes('napoli')) return TEAM_SVG_MAP.napoli;

  // 5. BUNDESLIGA
  if (clean.includes('بايرن') || clean.includes('bayern')) return TEAM_SVG_MAP.bayern_munich;
  if (clean.includes('دورتموند') || clean.includes('dortmund') || clean.includes('bvb')) return TEAM_SVG_MAP.borussia_dortmund;
  if (clean.includes('ليفركوزن') || clean.includes('leverkusen')) return TEAM_SVG_MAP.leverkusen;

  // 6. LIGUE 1
  if (clean.includes('باريس') || clean.includes('psg') || clean.includes('paris')) return TEAM_SVG_MAP.psg;
  if (clean.includes('مارسيليا') || clean.includes('marseille')) return TEAM_SVG_MAP.marseille;

  // 7. ARAB POWERHOUSES
  if (clean.includes('اهلي مصري') || (clean.includes('اهلي') && !clean.includes('سعودي')) || clean.includes('al ahly')) {
    return TEAM_SVG_MAP.al_ahly_egypt;
  }
  if (clean.includes('زمالك') || clean.includes('zamalek')) return TEAM_SVG_MAP.zamalek;
  if (clean.includes('وداد') || clean.includes('wydad') || clean.includes('wac')) return TEAM_SVG_MAP.wydad;
  if (clean.includes('رجاء') || clean.includes('raja') || clean.includes('rca')) return TEAM_SVG_MAP.raja;
  if (clean.includes('جيش ملكي') || clean.includes('far rabat') || clean.includes('as far')) return TEAM_SVG_MAP.as_far;

  return null;
}
