const SAUDI_TEAM_LOGOS: Array<{ names: string[]; src: string }> = [
  { names: ['الهلال', 'al hilal', 'alhilal'], src: '/teams/al-hilal.svg' },
  { names: ['النصر', 'al nassr', 'alnassr'], src: '/teams/al-nassr.svg' },
  { names: ['الاتحاد', 'al ittihad', 'alittihad'], src: '/teams/al-ittihad.svg' },
  { names: ['الأهلي', 'الاهلي', 'al ahli', 'alahli'], src: '/teams/al-ahli.svg' },
  { names: ['الشباب', 'al shabab', 'alshabab'], src: '/teams/al-shabab.svg' },
  { names: ['الاتفاق', 'al ettifaq', 'alettifaq'], src: '/teams/al-ettifaq.svg' },
  { names: ['التعاون', 'al taawoun', 'altaawoun'], src: '/teams/al-taawoun.svg' },
  { names: ['الفتح', 'al fateh', 'alfateh'], src: '/teams/al-fateh.svg' },
  { names: ['الخليج', 'al khaleej', 'alkhaleej'], src: '/teams/al-khaleej.svg' },
  { names: ['الرياض', 'al riyadh', 'alriyadh'], src: '/teams/al-riyadh.svg' },
  { names: ['الفيحاء', 'al fayha', 'alfayha'], src: '/teams/al-fayha.svg' },
  { names: ['الأخدود', 'الاخدود', 'al okhdood', 'alokhdood'], src: '/teams/al-okhdood.svg' },
  { names: ['الخلود', 'al kholood', 'alkholood'], src: '/teams/al-kholood.svg' },
  { names: ['القادسية', 'al qadsiah', 'alqadsiah'], src: '/teams/al-qadsiah.svg' },
  { names: ['ضمك', 'damac'], src: '/teams/damac.svg' },
  { names: ['الحزم', 'al hazem', 'alhazem'], src: '/teams/al-hazem.svg' },
  { names: ['النجمة', 'al najma', 'alnajma'], src: '/teams/al-najma.svg' },
  { names: ['العروبة', 'al orobah', 'alorobah'], src: '/teams/al-orobah.svg' },
  { names: ['الرائد', 'al raed', 'alraed'], src: '/teams/al-raed.svg' },
  { names: ['الوحدة', 'al wehda', 'alwehda'], src: '/teams/al-wehda.svg' }
];

function normalizeTeamName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u0640\u064b-\u065f\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/-/g, ' ')
    .replace(/\b(?:fc|sc|cf|club|football|saudi)\b/g, ' ')
    .replace(/(?:السعودي|السعوديه|نادي|فريق)/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getGeneratedTeamLogo(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('') || '؟';

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="hsl(${hue} 52% 30%)" stroke="hsl(${hue} 72% 66%)" stroke-width="3"/><text x="32" y="40" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">${escapeXml(letters)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getLocalTeamLogo(name: string | null | undefined): string | null {
  if (!name) return null;
  const normalized = normalizeTeamName(name);
  if (!normalized) return null;

  const entry = SAUDI_TEAM_LOGOS.find(team =>
    team.names.some(alias => normalizeTeamName(alias) === normalized)
  );
  return entry ? entry.src : null;
}

export function resolveTeamLogo(name: string, remoteLogo?: string | null): string {
  const local = getLocalTeamLogo(name);
  if (local) return local;
  if (remoteLogo && /^(https?:\/\/|\/)/i.test(remoteLogo)) return remoteLogo;
  return getGeneratedTeamLogo(name);
}
