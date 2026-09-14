import { Request, Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware.js';
import { setAuthCookies, clearAuthCookies, getRefreshTokenFromCookie, getCsrfTokenFromCookie, generateCsrfToken, CSRF_COOKIE } from '../../shared/auth-cookies.js';
import { register, login, logout, refreshAccessToken, verifyEmail, requestPasswordReset, resetPassword } from './auth.service.js';
import { asyncHandler } from "../../shared/middlewares/async.middleware.js";
export const registerController = asyncHandler(async (req: Request, res: Response) => {
const user = await register(req.body);
setAuthCookies(res, user.accessToken, user.refreshToken);
return res.status(201).json({ success: true, data: user });
});

export const logoutController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
await logout(req.user.userId);
clearAuthCookies(res);
return res.status(200).json({ success: true, message: 'Sesión cerrada' });
});
export const refreshController = asyncHandler(async (req: Request, res: Response) => {
const bodyToken = req.body && req.body.refreshToken;
const refreshToken = bodyToken || getRefreshTokenFromCookie(req);
if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'refreshToken es requerido' });
    }
const result = await refreshAccessToken(refreshToken);
setAuthCookies(res, result.accessToken, result.refreshToken);
return res.status(200).json({ success: true, data: result });
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
const result = await login(req.body);
setAuthCookies(res, result.accessToken, result.refreshToken);
return res.status(200).json({ success: true, data: result });
});
export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
await requestPasswordReset(req.body.email);
return res.status(200).json({
      success: true,
      message: 'Si el correo está registrado, te enviamos las instrucciones.',
    });
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
await resetPassword(req.body.token, req.body.password);
return res.status(200).json({ success: true, message: 'Contraseña actualizada. Iniciá sesión.' });
});

export const verifyEmailController = asyncHandler(async (req: Request, res: Response) => {
const token = typeof req.query.token === 'string' ? req.query.token : '';
if (!token) {
      return res.status(400).json({ success: false, message: 'Token requerido' });
    }
await verifyEmail(token);
return res.status(200).json({ success: true, message: 'Email verificado. Ya podés iniciar sesión.' });
});

export const csrfController = asyncHandler(async (req: Request, res: Response) => {
  let token = getCsrfTokenFromCookie(req);
  if (!token) {
    token = generateCsrfToken();
  }
  const isProd = process.env.NODE_ENV === 'production';
  const csrfCookieOpts = {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie(CSRF_COOKIE, token, csrfCookieOpts);
  res.cookie('XSRF-TOKEN', token, csrfCookieOpts);
  return res.status(200).json({ success: true, csrfToken: token });
});
