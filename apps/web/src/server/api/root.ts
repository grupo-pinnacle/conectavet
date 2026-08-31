import { createTRPCRouter } from "../trpc";
import { authRouter } from "./routers/auth";
import { userRouter } from "./routers/user";
import { petRouter } from "./routers/pet";
import { consultationRouter } from "./routers/consultation";
import { notificationRouter } from "./routers/notification";
import { mediaRouter } from "./routers/media";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: userRouter,
  pets: petRouter,
  consultations: consultationRouter,
  notifications: notificationRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
