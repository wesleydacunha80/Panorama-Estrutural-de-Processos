import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const port = 3107;
const origin = `http://127.0.0.1:${port}`;
const codespaceName = "codespace-teste";
const codespaceDomain = "app.github.dev";
const codespaceOrigin = `https://${codespaceName}-${port}.${codespaceDomain}`;
const adminEmail = `admin-${crypto.randomUUID()}@example.com`;
const adminPassword = "senha-admin-123";
const testDb = join(process.cwd(), "test.db");

let server: ReturnType<typeof Bun.spawn>;
let requestIp = 1;
let adminCookie = "";
let userCookie = "";
let createdUserId = "";
const userEmail = `usuario-${crypto.randomUUID()}@example.com`;

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch(`${origin}/api/auth/ok`);
      if (response.ok) return;
    } catch {
      // servidor ainda subindo
    }
    await Bun.sleep(250);
  }
  throw new Error("O servidor de testes não iniciou a tempo");
}

async function browserPost(
  path: string,
  body: object,
  headers: Record<string, string> = {},
) {
  return fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      // IP distinto por requisição evita o rate limit entre os testes.
      "X-Forwarded-For": `10.0.0.${requestIp++}`,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      ...headers,
    },
    body: JSON.stringify(body),
    redirect: "manual",
  });
}

beforeAll(async () => {
  await writeFile(testDb, await readFile(join(process.cwd(), "dev.db")));

  // Seed cria o primeiro admin usando auth.api.createUser (sem sessão).
  const seed = Bun.spawn([process.execPath, "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: "file:./test.db",
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      ADMIN_NAME: "Admin de Teste",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    seed.exited,
    new Response(seed.stdout).text(),
    new Response(seed.stderr).text(),
  ]);
  if (exitCode !== 0) throw new Error(`Seed falhou: ${stdout} ${stderr}`);
  expect(stdout).toContain("Admin criado");

  server = Bun.spawn(
    [
      process.execPath,
      "node_modules/next/dist/bin/next",
      "start",
      "--port",
      String(port),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        // Better Auth desativa a checagem de origem com NODE_ENV=test.
        NODE_ENV: "production",
        BETTER_AUTH_URL: `http://localhost:${port}`,
        CODESPACE_NAME: codespaceName,
        GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: codespaceDomain,
        DATABASE_URL: "file:./test.db",
      },
      stdout: "ignore",
      stderr: "ignore",
    },
  );

  await waitForServer();
}, 30_000);

afterAll(async () => {
  server?.kill();
  await Promise.allSettled([
    rm(testDb, { force: true }),
    rm(`${testDb}-shm`, { force: true }),
    rm(`${testDb}-wal`, { force: true }),
  ]);
}, 10_000);

describe("seed + admin (integração como browser)", () => {
  test("health check responde", async () => {
    const response = await fetch(`${origin}/api/auth/ok`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("cliente usa origem atual e tem o plugin admin", async () => {
    const source = await readFile(
      join(process.cwd(), "src/lib/auth-client.ts"),
      "utf8",
    );
    expect(source).toContain("createAuthClient");
    expect(source).not.toMatch(/baseURL\s*:/);
    expect(source).toContain("adminClient()");
  });

  test("cadastro público está desabilitado", async () => {
    const response = await browserPost("/api/auth/sign-up/email", {
      name: "Qualquer pessoa",
      email: `publico-${crypto.randomUUID()}@example.com`,
      password: "senha123456",
    });
    expect(response.status).toBe(400);
  });

  test("admin não autenticado não pode criar usuários", async () => {
    const response = await browserPost("/api/auth/admin/create-user", {
      name: "Usuário",
      email: `sem-sessao-${crypto.randomUUID()}@example.com`,
      password: "senha123456",
    });
    expect(response.status).toBe(401);
  });

  test("admin faz sign-in a partir da URL do Codespace", async () => {
    const response = await browserPost(
      "/api/auth/sign-in/email",
      { email: adminEmail, password: adminPassword },
      { Origin: codespaceOrigin },
    );
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie")?.split(";")[0];
    expect(cookie).toBeTruthy();
    expect(response.headers.get("set-cookie")).toContain("Secure");
    adminCookie = cookie!;
  });

  test("admin cria conta de usuário com role user", async () => {
    const response = await browserPost(
      "/api/auth/admin/create-user",
      {
        name: "Usuário comum",
        email: userEmail,
        password: "senha123456",
        role: "user",
      },
      { Cookie: adminCookie },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.email).toBe(userEmail);
    expect(data.user.role).toBe("user");
    createdUserId = data.user.id;
  });

  test("usuário comum não pode criar contas", async () => {
    const signIn = await browserPost("/api/auth/sign-in/email", {
      email: userEmail,
      password: "senha123456",
    });
    expect(signIn.status).toBe(200);
    userCookie = signIn.headers.get("set-cookie")!.split(";")[0];

    const response = await browserPost(
      "/api/auth/admin/create-user",
      {
        name: "Outro",
        email: `negado-${crypto.randomUUID()}@example.com`,
        password: "senha123456",
      },
      { Cookie: userCookie },
    );
    expect(response.status).toBe(403);
  });

  test("sessão do usuário criado é válida", async () => {
    const response = await fetch(`${origin}/api/auth/get-session`, {
      headers: { Cookie: userCookie },
    });
    expect(response.status).toBe(200);
    expect((await response.json()).user.email).toBe(userEmail);
  });

  test("admin redefine a senha de um usuário", async () => {
    const response = await browserPost(
      "/api/auth/admin/set-user-password",
      { userId: createdUserId, newPassword: "nova-senha-123" },
      { Cookie: adminCookie },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: true });

    const oldPassword = await browserPost("/api/auth/sign-in/email", {
      email: userEmail,
      password: "senha123456",
    });
    expect(oldPassword.status).toBe(401);

    const newPassword = await browserPost("/api/auth/sign-in/email", {
      email: userEmail,
      password: "nova-senha-123",
    });
    expect(newPassword.status).toBe(200);
  });

  test("usuário comum não pode alterar a senha de outro usuário", async () => {
    const response = await browserPost(
      "/api/auth/admin/set-user-password",
      { userId: createdUserId, newPassword: "senha-invadida-123" },
      { Cookie: userCookie },
    );
    expect(response.status).toBe(403);
  });

  test("origem https://localhost funciona (port-forward)", async () => {
    const response = await browserPost(
      "/api/auth/sign-in/email",
      { email: adminEmail, password: adminPassword },
      { Origin: `https://localhost:${port}` },
    );
    expect(response.status).toBe(200);
  });

  test("origem não confiável é rejeitada (CSRF)", async () => {
    const response = await browserPost(
      "/api/auth/sign-in/email",
      { email: adminEmail, password: adminPassword },
      {
        Origin: "https://evil.example",
        "Sec-Fetch-Site": "cross-site",
      },
    );
    expect(response.status).toBe(403);
    expect((await response.json()).message).toBe("Invalid origin");
  });

  test("seed é idempotente", async () => {
    const seed = Bun.spawn([process.execPath, "prisma/seed.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: "file:./test.db",
        ADMIN_EMAIL: adminEmail,
        ADMIN_PASSWORD: adminPassword,
        ADMIN_NAME: "Admin de Teste",
      },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [exitCode, stdout] = await Promise.all([
      seed.exited,
      new Response(seed.stdout).text(),
    ]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("já existe");
  });

  test("sign-out invalida a sessão do admin", async () => {
    const signOut = await browserPost("/api/auth/sign-out", {}, {
      Cookie: adminCookie,
    });
    expect(signOut.status).toBe(200);

    const session = await fetch(`${origin}/api/auth/get-session`, {
      headers: { Cookie: adminCookie },
    });
    expect(await session.json()).toBeNull();
  });

  test("página /admin exige login e /sign-up não existe", async () => {
    const admin = await fetch(`${origin}/admin`, {
      redirect: "manual",
      headers: { Accept: "text/html" },
    });
    // redirect() em rota bloqueante é transmitido via payload RSC (status 200).
    const html = await admin.text();
    expect(html).toContain("/sign-in");
    expect(html).toContain("NEXT_REDIRECT");

    const signUp = await fetch(`${origin}/sign-up`, { redirect: "manual" });
    expect(signUp.status).toBe(404);
  });
});
