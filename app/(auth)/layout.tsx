import type { ReactNode } from "react";
import { AuthShowcase } from "@/components/auth/auth-showcase";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted p-0 lg:p-6">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 overflow-hidden bg-card shadow-xl lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:rounded-3xl">
        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <AuthShowcase />
      </div>
    </div>
  );
}
