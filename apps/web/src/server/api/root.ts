// Reexport del appRouter del package compartido @conectavet/api.
// El web expone los routers con nombres en plural para matchear las claves que usa el cliente
// (users, pets, consultations, notifications, media).
import { appRouter as apiRouter } from "@conectavet/api";

export const appRouter = apiRouter;
export type AppRouter = typeof appRouter;