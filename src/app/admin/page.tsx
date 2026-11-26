import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Administração" };

// A página lê a sessão do usuário; com Cache Components ela não pode ser pré-renderizada.
export const instant = false;

export default async function AdminPage() {
  await requireAdmin();

  // Perfil admin: a lista de usuários é a tela inicial.
  redirect("/admin/usuarios");
}
