import { SiteHeader } from "@/components/site-header";
import { requireAdmin } from "@/lib/admin";
import { CreateUserForm } from "./create-user-form";

export const metadata = { title: "Registrar usuário" };

// A página lê a sessão do usuário; com Cache Components ela não pode ser pré-renderizada.
export const instant = false;

export default async function AdminCreateUserPage() {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
        current="admin"
      />
      <CreateUserForm />
    </div>
  );
}
