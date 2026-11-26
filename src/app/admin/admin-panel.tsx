"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

type CreatedUser = { id: string; name: string; email: string; role?: string | null };

async function listUsers(): Promise<CreatedUser[]> {
  const result = await authClient.admin.listUsers({ query: { limit: 100 } });
  if (result.error) throw new Error(result.error.message);
  return result.data?.users ?? [];
}

export function AdminPanel({ adminName }: { adminName: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: users = [], isPending } = useQuery({
    queryKey: ["admin-users"],
    queryFn: listUsers,
  });

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await authClient.admin.createUser({
        name,
        email,
        password,
        role: "user",
      });

      if (result.error) {
        setError(result.error.message ?? "Não foi possível criar a conta");
        return;
      }

      setSuccess(`Conta criada para ${email}`);
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
    <main className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 p-6 dark:bg-black">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Olá, {adminName}. Novas contas só podem ser criadas por um
            administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar conta"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Contas existentes no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {users.map((user) => (
                <li key={user.id} className="flex justify-between text-sm">
                  <span>
                    {user.name} &lt;{user.email}&gt;
                  </span>
                  <span className="text-muted-foreground">
                    {user.role ?? "user"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
