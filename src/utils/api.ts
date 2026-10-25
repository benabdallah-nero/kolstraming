/**
 * Resolves the API base URL.
 * If VITE_API_BASE_URL or VITE_API_URL is configured (e.g. user's working Vercel deployment
 * when hosting frontend on Cloudflare Pages), prepends that base URL.
 * Otherwise uses the relative path.
 */
export const getApiUrl = (endpoint: string): string => {
  const envBase =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.VITE_API_URL ||
    '';
  if (envBase) {
    const cleanBase = String(envBase).replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
  }
  return endpoint;
};
