"use client";

import { toast } from "sonner";

/**
 * Wrapper around fetch for authenticated API calls.
 *
 * If the session is no longer valid (e.g. the account was removed from the
 * database, leaving a stale JWT cookie), protected endpoints return 401. In
 * that case we surface a clear message and send the user back to the login
 * screen so they can re-authenticate instead of getting stuck on a generic
 * error.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);

  if (res.status === 401) {
    toast.error("Sua sessão expirou. Faça login novamente.");
    // Give the toast a beat before navigating away.
    setTimeout(() => {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?callbackUrl=${callbackUrl}`;
    }, 800);
  }

  return res;
}
