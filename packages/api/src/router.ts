// AppRouter — single source of truth para tipos compartidos web/mobile.
// Los routers se importan del package @conectavet/api (this package), donde están
// definidos con el context genérico { session?: SessionUser }.

import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { userRouter } from "./routers/user";
import { petRouter } from "./routers/pet";
import { consultationRouter } from "./routers/consultation";
import { notificationRouter } from "./routers/notification";
import { mediaRouter } from "./routers/media";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: userRouter,        // plural para matchear la convención del cliente
  pets: petRouter,          // plural
  consultations: consultationRouter,
  notifications: notificationRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;