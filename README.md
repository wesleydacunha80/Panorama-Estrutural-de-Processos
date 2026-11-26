# Panorama-Estrutural-de-Processos

Stack instalada com **Bun**:

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4)
- **shadcn/ui** (componentes em `src/components/ui`)
- **TanStack Query 5** (provider em `src/app/providers.tsx`)
- **Better Auth 1.7** (e-mail/senha) com Prisma
- **Prisma 7** + SQLite (adapter libSQL, ideal para Bun)

## Como executar

```bash
bun install
bun run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente (`.env`)

```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="gere-com-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@panorama.local"
ADMIN_PASSWORD="senha-forte-gerada"
ADMIN_NAME="Administrador"
```

O `.env` é ignorado pelo Git. Em produção, troque o secret e defina as URLs corretas.

## Banco de dados e autenticação

```bash
bun run db:migrate      # aplica migrations (cria prisma/dev.db na primeira vez)
bun run db:generate     # gera o Prisma Client em src/generated/prisma
bun run db:studio       # explorar o banco
bun run db:seed         # cria/promove o usuário admin (idempotente)
bun run auth:generate   # gera/atualiza os modelos do Better Auth no schema
bun run auth:check      # valida o schema contra o Prisma Client
```

### Admin e criação de contas

O cadastro público está desabilitado (`emailAndPassword.disableSignUp`). O seed
`prisma/seed.ts` cria o primeiro usuário com `role: "admin"` usando as variáveis
`ADMIN_*` e `auth.api.createUser`. Executá-lo novamente garante/promove esse
e-mail a admin **e** sincroniza a senha com `ADMIN_PASSWORD` (a senha fica na
tabela `account`, não em `user`). A senha inicial está no `.env`.

Somente um admin autenticado pode criar contas:

- Página `/admin` (protegida no servidor pelo role `admin`) — formulário e lista de usuários.
- API `POST /api/auth/admin/create-user` — exige sessão com permissão `user:create`.

Rotas de autenticação: `/api/auth/[...all]` (ex.: `GET /api/auth/ok`).
Páginas: `/sign-in` e `/admin`. A home usa TanStack Query para consultar
`/api/auth/get-session`.

## Outros comandos

```bash
bun run build
bun run lint
bun run test      # testes de integração (seed, admin, sign-in, sessão, CSRF)
```

O cliente Better Auth usa a origem atual da página (`createAuthClient()` sem
`baseURL` fixo), evitando falhas de CORS/`Failed to fetch` quando o app é
aberto em outro host ou porta.

### GitHub Codespaces

Nenhuma configuração extra é necessária: o servidor detecta automaticamente
`CODESPACE_NAME` e `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN` e confia na URL
encaminhada `https://<codespace>-<porta>.<domínio>` (por exemplo
`https://meu-codespace-3000.app.github.dev`). O `baseURL` do Better Auth passa
a ser essa URL pública, por isso os cookies são emitidos com `Secure`.
`localhost`/`127.0.0.1` continuam funcionando para acesso local, tanto em
`http://` quanto em `https://` (ex.: `https://localhost:3000`, usado pelo
port-forward do Codespace).
