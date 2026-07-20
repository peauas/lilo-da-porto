"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Wrench,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mobileNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Funcionários", icon: Users },
  { href: "/services", label: "Serviços", icon: Wrench },
  { href: "/sheets", label: "Folhas", icon: FileSpreadsheet },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Header({ userName }: { userName?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur lg:hidden">
      <img src="/logo-lockup.png" alt="Lilo da Porto" className="h-8 w-auto object-contain" />

      <Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-card shadow-2xl animate-fade-in">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <img
                src="/logo-lockup.png"
                alt="Lilo da Porto"
                className="h-8 w-auto object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {mobileNav.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border p-3">
              {userName && (
                <p className="px-3 pb-2 text-sm font-medium text-foreground">{userName}</p>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
