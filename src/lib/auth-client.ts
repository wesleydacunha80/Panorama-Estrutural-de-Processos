import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

// Sem baseURL explícita: o Better Auth usa a origem atual da página.
// Isso evita CORS "Failed to fetch" quando o app roda em outro host/porta.
export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
