import { z } from "zod";

export const RoleSchema = z.enum(["CLIENT", "VET", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;

export const VetStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]);
export type VetStatus = z.infer<typeof VetStatusSchema>;