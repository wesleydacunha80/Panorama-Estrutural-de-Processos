"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { createUserSchema, fieldErrors } from "@/lib/validation/auth";

/**
 * Tela de registro de usuário (somente admin).
 * A conta é criada pelo plugin `admin()` do Better Auth (`createUser`) com role "user".
 */
export function CreateUserForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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

      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      router.push("/admin/usuarios");
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/usuarios"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "w-fit",
            })}
          >
            <ArrowLeft data-icon="inline-start" />
            Voltar para usuários
          </Link>
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Administração
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Registrar usuário
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Crie uma nova conta. O usuário entra como perfil comum e pode
              entrar com e-mail e senha.
            </p>
          </div>
        </div>

        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <UserPlus className="size-4" />
              </span>
              Nova conta
            </CardTitle>
            <CardDescription>
              Informe os dados do usuário e defina a senha inicial de acesso.
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

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Registrar usuário"}
                </Button>
                <Link
                  href="/admin/usuarios"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
