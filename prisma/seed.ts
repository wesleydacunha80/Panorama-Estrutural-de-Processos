import "dotenv/config";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const email = (process.env.ADMIN_EMAIL ?? "admin@panorama.local").toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Administrador";

async function main() {
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD não está definido no .env. Defina uma senha forte antes de rodar o seed.",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "admin") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "admin" },
      });
      process.stdout.write(`Usuário ${email} promovido a admin.\n`);
    }

    // A senha fica na tabela account (provider "credential"), não em user.
    // Garante que o login com ADMIN_PASSWORD continue funcionando.
    const credential = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });

    if (!credential) {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: await hashPassword(password),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      process.stdout.write(`Conta de credenciais do admin ${email} restaurada.\n`);
    } else if (
      !credential.password ||
      !(await verifyPassword({ hash: credential.password, password }))
    ) {
      await prisma.account.update({
        where: { id: credential.id },
        data: {
          password: await hashPassword(password),
          updatedAt: new Date(),
        },
      });
      process.stdout.write(`Senha do admin ${email} sincronizada com ADMIN_PASSWORD.\n`);
    } else {
      process.stdout.write(`Admin ${email} já existe e a senha está válida.\n`);
    }
    return;
  }

  // Chamada server-side: não exige sessão (é o bootstrap do primeiro admin).
  const result = await auth.api.createUser({
    body: {
      name,
      email,
      password,
      role: "admin",
      data: { emailVerified: true },
    },
  });

  process.stdout.write(
    `Admin criado: ${result.user.email} (role: ${result.user.role ?? "admin"})\n`,
  );
}

main()
  .catch((error) => {
    // Nunca imprime a senha, mesmo em mensagens de erro.
    const message = error instanceof Error ? error.message : "erro desconhecido";
    process.stderr.write(
      `Falha no seed: ${message.replaceAll(password ?? "", "[REDACTED]")}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
