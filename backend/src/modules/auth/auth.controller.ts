import { Request, Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { setAuthCookies, clearAuthCookies, getRefreshTokenFromCookie } from '../../shared/auth-cookies';
import { register, login, logout, refreshAccessToken, verifyEmail, requestPasswordReset, resetPassword, AuthError } from './auth.service';
import { ConflictError, handleError } from '../../shared/errors';
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
const refreshToken = req.body.refreshToken || getRefreshTokenFromCookie(req);
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
