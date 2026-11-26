import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

  return <AdminPanel adminName={session.user.name} />;
}
