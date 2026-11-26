"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  changePasswordSchema,
  createUserSchema,
  fieldErrors,
} from "@/lib/validation/auth";

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

function CreateUserCard() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setErrors({});

    const parsed = createUserSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.admin.createUser({
        ...parsed.data,
        role: "user",
      });

      if (result.error) {
        setError(result.error.message ?? "Não foi possível criar a conta");
        return;
      }

      setSuccess(`Conta criada para ${parsed.data.email}.`);
      setName("");
      setEmail("");
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <UserPlus className="size-4" />
          </span>
          Criar conta
        </CardTitle>
        <CardDescription>
          Novas contas são criadas por administradores e já entram como usuário
          comum.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleCreate}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Nome completo"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name ? (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha inicial</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "password-error" : "password-hint"
              }
            />
            {errors.password ? (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            ) : (
              <p
                id="password-hint"
                className="text-xs text-muted-foreground"
              >
                A senha deve ter pelo menos 8 caracteres.
              </p>
            )}
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {success ? (
            <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
              {success}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function UserRow({
  user,
  isSelf,
}: {
  user: ManagedUser;
  isSelf: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fieldId = `password-${user.id}`;

  function closeForm() {
    setIsEditing(false);
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setFormError(null);
  }

  function toggleForm() {
    if (isEditing) {
      closeForm();
      return;
    }
    setSuccess(null);
    setIsEditing(true);
  }

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);
    setErrors({});

    const parsed = changePasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setIsSaving(true);
    try {
      const result = await authClient.admin.setUserPassword({
        userId: user.id,
        newPassword: parsed.data.newPassword,
      });

      if (result.error) {
        setFormError(
          result.error.message ?? "Não foi possível alterar a senha",
        );
        return;
      }

      setSuccess(`Senha de ${user.email} atualizada.`);
      closeForm();
    } catch {
      setFormError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <li className="border-b last:border-b-0">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
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

        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          <RoleBadge role={user.role} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleForm}
            aria-expanded={isEditing}
            aria-controls={isEditing ? fieldId : undefined}
          >
            <KeyRound data-icon="inline-start" />
            {isEditing ? "Fechar" : "Alterar senha"}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <form
          id={fieldId}
          onSubmit={handleChangePassword}
          noValidate
          className="border-t bg-muted/30 px-4 py-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${fieldId}-new`}>Nova senha</Label>
              <Input
                id={`${fieldId}-new`}
                type="password"
                autoComplete="new-password"
                autoFocus
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                aria-invalid={Boolean(errors.newPassword)}
                aria-describedby={
                  errors.newPassword ? `${fieldId}-new-error` : undefined
                }
              />
              {errors.newPassword ? (
                <p
                  id={`${fieldId}-new-error`}
                  className="text-sm text-destructive"
                >
                  {errors.newPassword}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${fieldId}-confirm`}>Confirmar senha</Label>
              <Input
                id={`${fieldId}-confirm`}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword
                    ? `${fieldId}-confirm-error`
                    : undefined
                }
              />
              {errors.confirmPassword ? (
                <p
                  id={`${fieldId}-confirm-error`}
                  className="text-sm text-destructive"
                >
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>

          {isSelf ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Você está alterando a sua própria senha. A sessão atual continua
              ativa.
            </p>
          ) : null}

          {formError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar nova senha"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={closeForm}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

export function AdminPanel({
  adminId,
  adminName,
}: {
  adminId: string;
  adminName: string;
}) {
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
    const roleDiff =
      Number(b.role === "admin") - Number(a.role === "admin");
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
              Gerenciamento de usuários
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Olá, {adminName}. Crie novas contas e redefina a senha de acesso
              dos usuários.
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
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <CreateUserCard />

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Users className="size-4" />
                </span>
                Usuários
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
                  Nenhuma conta cadastrada ainda. Crie a primeira ao lado.
                </p>
              ) : (
                <ul>
                  {sortedUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelf={user.id === adminId}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
