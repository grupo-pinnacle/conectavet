import { Request, Response } from 'express';
import {
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  ACCESS_COOKIE,
  REFRESH_COOKIE
} from '../shared/auth-cookies';

describe('auth-cookies', () => {
  const isProd = process.env.NODE_ENV === 'production';
  const baseCookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };

  describe('setAuthCookies', () => {
    it('should set access and refresh cookies with correct options', () => {
      const mockRes = {
        cookie: jest.fn()
      } as unknown as Response;

      const accessToken = 'access_token_123';
      const refreshToken = 'refresh_token_123';

      setAuthCookies(mockRes, accessToken, refreshToken);

      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(mockRes.cookie).toHaveBeenNthCalledWith(1, ACCESS_COOKIE, accessToken, {
        ...baseCookieOpts,
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
      });
      expect(mockRes.cookie).toHaveBeenNthCalledWith(2, REFRESH_COOKIE, refreshToken, {
        ...baseCookieOpts,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear access and refresh cookies with correct options', () => {
      const mockRes = {
        clearCookie: jest.fn()
      } as unknown as Response;

      clearAuthCookies(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockRes.clearCookie).toHaveBeenNthCalledWith(1, ACCESS_COOKIE, baseCookieOpts);
      expect(mockRes.clearCookie).toHaveBeenNthCalledWith(2, REFRESH_COOKIE, baseCookieOpts);
    });
  });

  describe('getAccessTokenFromCookie', () => {
    it('should return undefined when no cookie header is present', () => {
      const mockReq = {
        headers: {}
      } as unknown as Request;

      expect(getAccessTokenFromCookie(mockReq)).toBeUndefined();
    });

    it('should extract access token from cookie string', () => {
      const mockReq = {
        headers: {
          cookie: `${ACCESS_COOKIE}=access_token_123; other_cookie=other_value`
        }
      } as unknown as Request;

      expect(getAccessTokenFromCookie(mockReq)).toBe('access_token_123');
    });

    it('should handle URL encoded tokens', () => {
      const token = 'access%20token';
      const decodedToken = 'access token';
      const mockReq = {
        headers: {
          cookie: `${ACCESS_COOKIE}=${token}`
        }
      } as unknown as Request;

      expect(getAccessTokenFromCookie(mockReq)).toBe(decodedToken);
    });
  });

  describe('getRefreshTokenFromCookie', () => {
    it('should return undefined when no cookie header is present', () => {
      const mockReq = {
        headers: {}
      } as unknown as Request;

      expect(getRefreshTokenFromCookie(mockReq)).toBeUndefined();
    });

    it('should extract refresh token from cookie string', () => {
      const mockReq = {
        headers: {
          cookie: `other_cookie=other_value; ${REFRESH_COOKIE}=refresh_token_123`
        }
      } as unknown as Request;

      expect(getRefreshTokenFromCookie(mockReq)).toBe('refresh_token_123');
    });

    it('should handle URL encoded tokens', () => {
      const token = 'refresh%20token';
      const decodedToken = 'refresh token';
      const mockReq = {
        headers: {
          cookie: `${REFRESH_COOKIE}=${token}`
        }
      } as unknown as Request;

      expect(getRefreshTokenFromCookie(mockReq)).toBe(decodedToken);
    });
  });
});
