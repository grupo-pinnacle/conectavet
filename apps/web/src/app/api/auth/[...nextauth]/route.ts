// NextAuth v4 catch-all route handler
// En NextAuth 4 se exporta un único `handler` que actúa como GET/POST.
import NextAuth from "next-auth";
import { authOptions } from "~/server/auth/authOptions";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };