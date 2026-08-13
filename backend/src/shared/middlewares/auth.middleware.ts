import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import { JwtPayload } from '../types';
import { getAccessTokenFromCookie } from '../auth-cookies';

export interface RequestWithUser extends Request {
  user?: JwtPayload;
}

export async function authenticate(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Web SPA: el JWT viaja en cookie HttpOnly (no accesible desde JS).
    token = getAccessTokenFromCookie(req);
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }


  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tokenVersion: true },
    });

    if (!user || (decoded.tokenVersion ?? 1) !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Sesión cerrada. Iniciá sesión de nuevo'
      });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tenés permiso para acceder a este recurso'
      });
    }

    next();
  };
}
