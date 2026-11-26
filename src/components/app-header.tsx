"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Layers, LayoutDashboard, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Panorama", icon: Network },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plano-de-acao", label: "Plano de Ação", icon: ClipboardList },
];

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-navy text-primary shadow-md">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Layers className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide uppercase">
              Panorama Estrutural
            </span>
            <span className="block text-[11px] text-primary/60">
              Processos · Status · Plano de ação
            </span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 sm:justify-end">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-navy shadow"
                    : "text-primary/75 hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
