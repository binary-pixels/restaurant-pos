import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: string;
    storeId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
      storeId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    storeId?: string;
  }
}
