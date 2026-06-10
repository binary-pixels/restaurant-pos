import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["zh-CN", "en"],
  defaultLocale: "zh-CN",
  localePrefix: "always",
});

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
