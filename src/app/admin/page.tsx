import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { AdminPanel } from "./admin-panel";

export const metadata = { title: "Administração" };

// A página lê a sessão do usuário; com Cache Components ela não pode ser pré-renderizada.
export const instant = false;

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") {
    redirect("/sign-in");
  }

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
      <AdminPanel
        adminId={session.user.id}
        adminName={session.user.name}
      />
    </div>
  );
}
