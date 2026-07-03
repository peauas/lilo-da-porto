/**
 * Resolve a URL pública da aplicação.
 * Em produção na Vercel, ignora AUTH_URL se ainda apontar para localhost.
 */
export function getAppUrl(): string {
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) {
    return `https://${vercelProduction}`;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  const authUrl = process.env.AUTH_URL;
  if (authUrl && !authUrl.includes("localhost")) {
    return authUrl.replace(/\/$/, "");
  }

  return authUrl?.replace(/\/$/, "") ?? "http://localhost:3000";
}

/** Garante AUTH_URL correto antes do Auth.js inicializar (Vercel). */
export function ensureAuthUrl(): void {
  if (process.env.VERCEL) {
    process.env.AUTH_URL = getAppUrl();
  }
}
