import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    };
    /** Unix timestamp (seconds) the underlying JWT was issued at. */
    iat?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
