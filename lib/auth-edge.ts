import { ensureAuthUrl } from "@/lib/app-url";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

ensureAuthUrl();

export const { auth } = NextAuth(authConfig);
