import { getApiUrl } from '../context/AppContext';

interface CachedAuth {
  token: string;
  exp: number;
}

// In-memory token cache so we only request a new token once every ~90 minutes per channel
const tokenCache = new Map<string, CachedAuth>();

/**
 * Fetch or retrieve a cached signed stream token for a specific channel
 */
export async function getStreamAuth(channelId: string | number): Promise<CachedAuth | null> {
  const key = String(channelId);
  const now = Math.floor(Date.now() / 1000);
  const existing = tokenCache.get(key);

  // If token exists and has more than 10 minutes before expiration, reuse it!
  if (existing && existing.exp > now + 600) {
    return existing;
  }

  try {
    const authEndpoint = getApiUrl(`/api/stream-auth/${key}`);
    const res = await fetch(authEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token && data.exp) {
        const authData: CachedAuth = {
          token: String(data.token),
          exp: Number(data.exp)
        };
        tokenCache.set(key, authData);
        return authData;
      }
    }
  } catch (err) {
    console.warn('[StreamAuth] Failed to fetch stream token, fallback to resolve:', err);
  }

  // Fallback: try resolve-m3u8 if stream-auth returned an error
  try {
    const resolveEndpoint = getApiUrl(`/api/resolve-m3u8/${key}`);
    const res = await fetch(resolveEndpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.token && data.exp) {
        const authData: CachedAuth = {
          token: String(data.token),
          exp: Number(data.exp)
        };
        tokenCache.set(key, authData);
        return authData;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Generate an authorized stream URL protected with cryptographic HMAC signature and expiration
 */
export async function getAuthorizedStreamUrl(
  channelId: string | number,
  sourceMode: string = 'dembed',
  retryKey: string | number = 0
): Promise<string> {
  const key = String(channelId);
  const auth = await getStreamAuth(key);

  const baseEndpoint = `/api/proxy-stream/${key}/live.m3u8`;
  const params = new URLSearchParams();
  if (sourceMode) params.set('source', sourceMode);
  if (retryKey !== undefined && retryKey !== null && retryKey !== 0) {
    params.set('r', String(retryKey));
  }

  if (auth && auth.token && auth.exp) {
    params.set('token', auth.token);
    params.set('exp', String(auth.exp));
  }

  return getApiUrl(`${baseEndpoint}?${params.toString()}`);
}
