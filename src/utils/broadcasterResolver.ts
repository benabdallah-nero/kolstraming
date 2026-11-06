import { CHANNELS } from '../data/channels';
import type { Channel, LiveMatchChannel } from '../types';

export type BroadcasterNetwork = 'bein_ar' | 'alkass' | 'ssc' | 'other' | 'unbroadcast';

export interface BroadcasterResolution {
  channels: LiveMatchChannel[];
  isBeinArabic: boolean;
  broadcasterLabel: string;
  network: BroadcasterNetwork;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u0640\u064b-\u065f\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripNoise(value: string): string {
  return value
    .replace(/\b(?:hd|fhd|uhd|4k|8k|live|channel|tv|sat|عربي|مباشر|قناة|بث)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toMatchChannel(channel: Channel): LiveMatchChannel {
  return {
    channel_id: channel.id,
    channel_name: channel.name,
    quality: channel.quality,
    isBeinArabic: channel.category === 'ar'
  };
}

function findByName(value: string): Channel | undefined {
  const wanted = stripNoise(normalize(value));
  if (!wanted) return undefined;

  const exact = CHANNELS.find(channel => {
    const english = stripNoise(normalize(channel.name));
    const arabic = stripNoise(normalize(channel.arabicName || ''));
    return english === wanted || arabic === wanted;
  });
  if (exact) return exact;

  // A source label may add a country or "HD" suffix; only accept a catalog
  // entry when the remaining name is unique.
  const partial = CHANNELS.filter(channel => {
    const english = stripNoise(normalize(channel.name));
    const arabic = stripNoise(normalize(channel.arabicName || ''));
    return english.startsWith(`${wanted} `) || arabic.startsWith(`${wanted} `);
  });
  return partial.length === 1 ? partial[0] : undefined;
}

function findExactPattern(pattern: RegExp): Channel | undefined {
  return CHANNELS.find(channel => pattern.test(stripNoise(normalize(channel.name))));
}

function resolveBein(normalized: string): Channel | undefined {
  const numberMatch = normalized.match(/\b(\d{1,2})\b/);
  const number = numberMatch ? parseInt(numberMatch[1], 10) : null;

  if (/xtra|اكسترا/.test(normalized)) {
    return findExactPattern(/\bbein sports xtra\b/);
  }
  if (/news|اخبار/.test(normalized)) {
    return findExactPattern(/\bbein sports news\b/);
  }

  // A regional label must resolve within that exact region. It must never
  // fall back to the Arabic pack just because the channel number is the same.
  if (/france|فرنسا/.test(normalized)) {
    if (number === null) return undefined;
    return findExactPattern(new RegExp(`\\bbein sports (?:max )?${number} france\\b`));
  }
  if (/turkey|تركيا/.test(normalized)) {
    if (number === null) return undefined;
    return findExactPattern(new RegExp(`\\bbein sports ${number} turkey\\b`));
  }
  if (/australia|استراليا/.test(normalized)) {
    if (number === null) return undefined;
    return findExactPattern(new RegExp(`\\bbein sports australia ${number}\\b`));
  }
  if (/malaysia|ماليزيا/.test(normalized)) {
    if (number === null) return undefined;
    return findExactPattern(new RegExp(`\\bbein sports ${number} malaysia\\b`));
  }
  if (/mena english|english|انجليزي/.test(normalized)) {
    if (number === null) return undefined;
    return findExactPattern(new RegExp(`\\bbein sports mena english ${number}\\b`));
  }
  if (/usa|united states|امريكا/.test(normalized)) {
    if (number === null) return undefined;
    return findExactPattern(new RegExp(`\\bbein sports (?:xtra |usa )?${number}\\b`));
  }
  if (/spain|espana|espanol|اسبانيا/.test(normalized)) {
    if (number === null) return undefined;
    return findExactPattern(new RegExp(`\\bbein sports (?:spain |espanol )?${number}\\b`));
  }

  // Only a bare "beIN Sports N" label belongs to the Arabic pack. Any other
  // unknown suffix is left unresolved instead of guessing a channel.
  if (number !== null) {
    const residual = normalized
      .replace(/\bbein\b/g, ' ')
      .replace(new RegExp(`\\b${number}\\b`, 'g'), ' ')
      .replace(/\b(?:sports?|hd|fhd|mena)\b/g, ' ')
      .trim();
    if (residual) return undefined;
    return findExactPattern(new RegExp(`\\bbein sports ${number} arabic\\b`));
  }

  return findByName(normalized);
}

/**
 * Maps a broadcaster label from a live-match source to a channel that actually
 * exists in the shared catalog. Unknown or regional labels never fall back to
 * a different beIN pack, so a match is only linked to a channel the source
 * actually named.
 */
export function resolveBroadcaster(rawChannel: string | null | undefined): BroadcasterResolution {
  const trimmed = (rawChannel || '').replace(/<[^>]+>/g, '').trim();
  if (!trimmed) {
    return { channels: [], isBeinArabic: false, broadcasterLabel: '', network: 'unbroadcast' };
  }

  const normalized = stripNoise(normalize(trimmed));
  const channel = /bein|بي ان|بي إن/.test(normalized)
    ? resolveBein(normalized)
    : findByName(normalized);

  if (!channel) {
    return {
      channels: [],
      isBeinArabic: false,
      broadcasterLabel: trimmed,
      network: 'other'
    };
  }

  const channels = [toMatchChannel(channel)];
  return {
    channels,
    isBeinArabic: channel.category === 'ar',
    broadcasterLabel: channels.map(item => item.channel_name).join(' / '),
    network: channel.category === 'ar' ? 'bein_ar' : 'other'
  };
}
