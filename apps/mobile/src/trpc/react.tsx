import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@conectavet/api";

export const trpc = createTRPCReact<AppRouter>();