import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    // Evita que o Next.js use C:\Users\Usuario como root por causa de um lockfile extra.
    root: projectRoot,
  },
};

export default nextConfig;
