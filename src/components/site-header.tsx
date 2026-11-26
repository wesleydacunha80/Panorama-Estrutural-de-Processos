"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home,
  LogOut,
  PanelsTopLeft,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type HeaderUser = {
  name: string;
  email: string;
  role?: string | null;
};

export function SiteHeader({
  user,
  current = "admin",
}: {
  user: HeaderUser;
  current?: "home" | "admin";
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/sign-in");
      router.refresh();
    } catch {
      // Mantém o botão disponível para uma nova tentativa.
      setIsSigningOut(false);
    }
  }

  const isAdmin = user.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <PanelsTopLeft className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold tracking-tight">
              Panorama Estrutural
            </span>
            <span className="hidden truncate text-[11px] text-muted-foreground sm:block">
              Gestão de processos
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="ml-4 hidden items-center gap-1 sm:flex"
        >
          <Link
            href="/"
            aria-current={current === "home" ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              current === "home" && "bg-muted text-foreground",
            )}
          >
            <Home data-icon="inline-start" />
            Início
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              aria-current={current === "admin" ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                current === "admin" && "bg-muted text-foreground",
              )}
            >
              <Users data-icon="inline-start" />
              Usuários
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight md:block">
            <p className="max-w-48 truncate text-sm font-medium">{user.name}</p>
            <p className="max-w-48 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground ring-1 ring-foreground/10">
            <ShieldCheck className="size-3" />
            {isAdmin ? "Admin" : "Usuário"}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label={isSigningOut ? "Saindo..." : "Sair"}
          >
            <LogOut data-icon="inline-start" />
            <span className="hidden sm:inline">
              {isSigningOut ? "Saindo..." : "Sair"}
            </span>
          </Button>
        </div>
      </div>

      <div className="border-t sm:hidden">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex w-full max-w-6xl items-center gap-1 px-4 py-2"
        >
          <Link
            href="/"
            aria-current={current === "home" ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              current === "home" && "bg-muted text-foreground",
            )}
          >
            <Home data-icon="inline-start" />
            Início
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              aria-current={current === "admin" ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                current === "admin" && "bg-muted text-foreground",
              )}
            >
              <Users data-icon="inline-start" />
              Gerenciar usuários
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
