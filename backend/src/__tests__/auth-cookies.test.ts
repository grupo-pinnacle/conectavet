import { Request, Response } from 'express';
import {
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from '../shared/auth-cookies';

describe('Auth Cookies Utilities', () => {
  describe('setAuthCookies', () => {
    test('sets access and refresh cookies on the response object with expected parameters', () => {
      const mockRes = {
        cookie: jest.fn(),
      } as unknown as Response;

      setAuthCookies(mockRes, 'access_token_val', 'refresh_token_val');

      expect(mockRes.cookie).toHaveBeenCalledTimes(2);

      expect(mockRes.cookie).toHaveBeenNthCalledWith(
        1,
        ACCESS_COOKIE,
        'access_token_val',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 2 * 60 * 60 * 1000,
        })
      );

      expect(mockRes.cookie).toHaveBeenNthCalledWith(
        2,
        REFRESH_COOKIE,
        'refresh_token_val',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
      );
    });
  });

  describe('clearAuthCookies', () => {
    test('clears access and refresh cookies from the response object with expected parameters', () => {
      const mockRes = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      clearAuthCookies(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);

      expect(mockRes.clearCookie).toHaveBeenNthCalledWith(
        1,
        ACCESS_COOKIE,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      );

      expect(mockRes.clearCookie).toHaveBeenNthCalledWith(
        2,
        REFRESH_COOKIE,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      );
    });
  });

  describe('getAccessTokenFromCookie', () => {
    test('returns access token from req.headers.cookie when present', () => {
      const req = {
        headers: {
          cookie: `${ACCESS_COOKIE}=my_access_token; ${REFRESH_COOKIE}=my_refresh_token`,
        },
      } as unknown as Request;

      expect(getAccessTokenFromCookie(req)).toBe('my_access_token');
    });

    test('returns undefined when cookie header is missing', () => {
      const req = {
        headers: {},
      } as unknown as Request;

      expect(getAccessTokenFromCookie(req)).toBeUndefined();
    });

    test('returns undefined when cookie header is empty string', () => {
      const req = {
        headers: {
          cookie: '',
        },
      } as unknown as Request;

      expect(getAccessTokenFromCookie(req)).toBeUndefined();
    });

    test('returns undefined when access_token is not present in cookie header', () => {
      const req = {
        headers: {
          cookie: 'other_cookie=value123',
        },
      } as unknown as Request;

      expect(getAccessTokenFromCookie(req)).toBeUndefined();
    });

    test('decodes URI-encoded cookie values', () => {
      const req = {
        headers: {
          cookie: `${ACCESS_COOKIE}=token%20with%20spaces`,
        },
      } as unknown as Request;

      expect(getAccessTokenFromCookie(req)).toBe('token with spaces');
    });

    test('ignores malformed cookie pairs without equal signs', () => {
      const req = {
        headers: {
          cookie: `malformed_cookie; ${ACCESS_COOKIE}=valid_token`,
        },
      } as unknown as Request;

      expect(getAccessTokenFromCookie(req)).toBe('valid_token');
    });
  });

  describe('getRefreshTokenFromCookie', () => {
    test('returns refresh token from req.headers.cookie when present', () => {
      const req = {
        headers: {
          cookie: `${ACCESS_COOKIE}=my_access_token; ${REFRESH_COOKIE}=my_refresh_token`,
        },
      } as unknown as Request;

      expect(getRefreshTokenFromCookie(req)).toBe('my_refresh_token');
    });

    test('returns undefined when cookie header is missing', () => {
      const req = {
        headers: {},
      } as unknown as Request;

      expect(getRefreshTokenFromCookie(req)).toBeUndefined();
    });

    test('returns undefined when refresh_token is not present', () => {
      const req = {
        headers: {
          cookie: `${ACCESS_COOKIE}=my_access_token`,
        },
      } as unknown as Request;

      expect(getRefreshTokenFromCookie(req)).toBeUndefined();
    });
  });
});
