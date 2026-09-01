// @conectavet/api — public entry point
// Web y mobile consumen routers, schemas, services y tipos desde acá.

export * from "./auth/roles";
export * from "./schemas";
export * from "./trpc";

// Services
export { register, verifyCredentials, revokeSessions } from "./services/auth";
export { signMobileToken, verifyMobileToken } from "./services/mobileToken";
export { cloudinary } from "./services/cloudinary";
export { generateSignedUploadParams, getDeliveryUrl, getThumbnailUrl, deleteResource } from "./services/media";

// AppRouter (single source of truth)
export { appRouter } from "./router";
export type { AppRouter } from "./router";