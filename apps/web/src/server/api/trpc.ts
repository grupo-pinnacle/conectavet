import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { appRouter } from "./root";
import { createTRPCContext } from "../trpc";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";

const handler = async (req: NextRequest) => {
  const session = (await getServerSession(authOptions)) as
    | import("../trpc").SessionUser
    | undefined;

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers, session }),
  });
};

export { handler as GET, handler as POST };
