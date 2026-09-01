// Firmar y verificar JWT para mobile (Authorization: Bearer <token>).
// Usa jsonwebtoken con un secret distinto al de NextAuth para evitar
// acoplamiento. El web valida el token en el tRPC context.

import jwt from "jsonwebtoken";
import type { Role } from "../auth/roles";

const SECRET = process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || "mobile-dev-secret-change-in-prod";
const EXPIRES_IN = "30d";

export type MobileTokenPayload = {
  id: string;
  role: Role;
  vetStatus: "PENDING" | "APPROVED";
  tokenVersion: number;
};

export function signMobileToken(payload: MobileTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as MobileTokenPayload & { exp: number };
    return {
      id: decoded.id,
      role: decoded.role,
      vetStatus: decoded.vetStatus,
      tokenVersion: decoded.tokenVersion,
    };
  } catch {
    return null;
  }
}