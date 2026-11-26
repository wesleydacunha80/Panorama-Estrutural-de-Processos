import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const configuredOrigin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// No GitHub Codespace o browser acessa https://<name>-<porta>.<domínio>,
// não http://localhost:<porta>. O Better Auth precisa confiar nessa origem.
const codespaceName = process.env.CODESPACE_NAME;
const codespaceDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const port =
  process.env.PORT ??
  (() => {
    try {
      return new URL(configuredOrigin).port || "3000";
    } catch {
      return "3000";
    }
  })();
const codespaceOrigin =
  codespaceName && codespaceDomain
    ? `https://${codespaceName}-${port}.${codespaceDomain}`
    : null;

function isCodespaceOrigin(origin: string) {
  if (!codespaceName || !codespaceDomain) return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    const suffix = `.${codespaceDomain}`;
    if (!url.hostname.endsWith(suffix)) return false;
    const label = url.hostname.slice(0, -suffix.length);
    const prefix = `${codespaceName}-`;
    return label.startsWith(prefix) && /^\d+$/.test(label.slice(prefix.length));
  } catch {
    return false;
  }
}

const localOrigins = (() => {
  try {
    const url = new URL(configuredOrigin);
    const suffix = url.port ? `:${url.port}` : "";
    return [
      `http://localhost${suffix}`,
      `https://localhost${suffix}`,
      `http://127.0.0.1${suffix}`,
      `https://127.0.0.1${suffix}`,
    ];
  } catch {
    return [];
  }
})();

const devOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
        "https://127.0.0.1:3000",
        "http://localhost:3001",
        "https://localhost:3001",
        "http://127.0.0.1:3001",
        "https://127.0.0.1:3001",
      ];

export const auth = betterAuth({
  appName: "Panorama Estrutural de Processos",
  // Usa a URL pública do Codespace quando disponível (cookies Secure e redirects corretos).
  baseURL: codespaceOrigin ?? configuredOrigin,
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    // Cadastro público desabilitado: somente o admin cria contas.
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      // JWE: dados de sessão criptografados no cookie.
      strategy: "jwe",
    },
  },
  rateLimit: {
    enabled: true,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/admin/create-user": { window: 60, max: 10 },
    },
  },
  advanced: {
    disableCSRFCheck: false,
    useSecureCookies: process.env.NODE_ENV === "production",
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      ipv6Subnet: 64,
    },
  },
  trustedOrigins: async (request) => {
    const origins = Array.from(
      new Set([
        configuredOrigin,
        ...localOrigins,
        ...devOrigins,
        ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").filter(Boolean) ??
          []),
      ]),
    );
    const origin = request?.headers.get("origin");
    if (origin && isCodespaceOrigin(origin)) origins.push(origin);
    return origins;
  },
  plugins: [admin(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
