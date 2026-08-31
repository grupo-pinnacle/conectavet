import type { Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const baseCookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...baseCookieOpts, maxAge: 2 * 60 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseCookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, baseCookieOpts);
  res.clearCookie(REFRESH_COOKIE, baseCookieOpts);
}

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export function getAccessTokenFromCookie(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[ACCESS_COOKIE];
}

export function getRefreshTokenFromCookie(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[REFRESH_COOKIE];
}
