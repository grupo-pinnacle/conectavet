import { z } from "zod";

// Espejo de los enums de Prisma para usar en el cliente (zod + tipos).
export const RoleSchema = z.enum(["CLIENT", "VET", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;

export const VetStatusSchema = z.enum(["PENDING", "APPROVED"]);
export type VetStatus = z.infer<typeof VetStatusSchema>;

export const ConsultationStatusSchema = z.enum([
  "WAITING",
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);
export type ConsultationStatus = z.infer<typeof ConsultationStatusSchema>;
