"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { ChangePasswordDialog } from "./change-password-dialog";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
};

async function listUsers(): Promise<ManagedUser[]> {
  const result = await authClient.admin.listUsers({ query: { limit: 100 } });
  if (result.error) throw new Error(result.error.message);
  return result.data?.users ?? [];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function RoleBadge({ role }: { role?: string | null }) {
  const isAdmin = role === "admin";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        isAdmin
          ? "bg-primary text-primary-foreground ring-primary/20"
          : "bg-muted text-muted-foreground ring-foreground/10",
      )}
    >
      {isAdmin ? <ShieldCheck className="size-3" /> : null}
      {isAdmin ? "Admin" : "Usuário"}
    </span>
  );
}

function UserRow({ user, isSelf }: { user: ManagedUser; isSelf: boolean }) {
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
              <span className="truncate">{user.name}</span>
              {isSelf ? (
                <span className="text-xs font-normal text-muted-foreground">
                  (você)
                </span>
              ) : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            {success ? (
              <p
                role="status"
                className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
              >
                {success}
              </p>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge role={user.role} />
      </TableCell>
      <TableCell className="text-right">
        <ChangePasswordDialog
          user={user}
          isSelf={isSelf}
          onSuccess={setSuccess}
        />
      </TableCell>
    </TableRow>
  );
}

export function UsersScreen({ adminId }: { adminId: string }) {
  const {
    data: users = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: listUsers,
  });

  const sortedUsers = [...users].sort((a, b) => {
    const roleDiff = Number(b.role === "admin") - Number(a.role === "admin");
    return roleDiff || a.name.localeCompare(b.name, "pt-BR");
  });
  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Administração
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Usuários
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Liste as contas cadastradas, registre novos usuários e redefina a
              senha de acesso.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10">
              <Users className="size-3.5" />
              {users.length} {users.length === 1 ? "conta" : "contas"}
              <span aria-hidden="true">·</span>
              {adminCount} {adminCount === 1 ? "admin" : "admins"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                data-icon="inline-start"
                className={cn(isFetching && "animate-spin")}
              />
              Atualizar
            </Button>
            <Link
              href="/admin/novo-usuario"
              className={buttonVariants({ size: "sm" })}
            >
              <UserPlus data-icon="inline-start" />
              Registrar usuário
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Users className="size-4" />
              </span>
              Usuários cadastrados
            </CardTitle>
            <CardDescription>
              Selecione um usuário para definir uma nova senha de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isPending ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                Carregando usuários...
              </p>
            ) : isError ? (
              <div className="flex flex-col items-start gap-3 px-4 py-8">
                <p className="text-sm text-destructive">
                  Não foi possível carregar os usuários.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : sortedUsers.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                Nenhuma conta cadastrada ainda. Registre a primeira.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="text-right">Senha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelf={user.id === adminId}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
