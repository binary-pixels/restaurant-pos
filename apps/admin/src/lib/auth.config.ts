import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname !== "/login";

      // Redirect to login if not authenticated
      if (!isLoggedIn && isOnDashboard) {
        return false;
      }

      // Redirect to dashboard if already logged in
      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        if (user.storeId) token.storeId = user.storeId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        if (token.storeId) session.user.storeId = token.storeId;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
