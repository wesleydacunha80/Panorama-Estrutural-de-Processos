"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

type SessionResponse = {
  user: { name: string; email: string; role?: string | null };
} | null;

async function getSession(): Promise<SessionResponse> {
  const response = await fetch("/api/auth/get-session");
  if (!response.ok) throw new Error("Não foi possível carregar a sessão");
  return response.json();
}

export default function Home() {
  const queryClient = useQueryClient();
  const { data: session, isPending, error } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
  });

  async function handleSignOut() {
    try {
      await authClient.signOut();
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    } catch {
      // O botão permanece disponível para nova tentativa.
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Panorama Estrutural de Processos</CardTitle>
          <CardDescription>
            Next.js + shadcn/ui + TanStack Query + Better Auth + Prisma
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isPending ? (
            <p className="text-muted-foreground">Carregando sessão...</p>
          ) : error ? (
            <p className="text-destructive">Erro ao carregar a sessão.</p>
          ) : session ? (
            <>
              <p>
                Logado como <strong>{session.user.name}</strong> (
                {session.user.email})
              </p>
              <div className="flex flex-wrap gap-2">
                {session.user.role === "admin" ? (
                  <Link
                    href="/admin"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Admin
                  </Link>
                ) : null}
                <Button onClick={handleSignOut} variant="outline">
                  Sair
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Você não está logado. As contas são criadas pelo administrador.
              </p>
              <Link href="/sign-in" className={buttonVariants()}>
                Entrar
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
