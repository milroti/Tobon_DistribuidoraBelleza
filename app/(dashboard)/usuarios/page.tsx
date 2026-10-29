import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/users";
import { UsersContent } from "@/components/users/UsersContent";

export default async function UsuariosPage() {
  const res = await getUsers();

  if (!res.success || !res.data) {
    redirect("/");
  }

  return (
    <UsersContent
      initialUsers={res.data.users}
      currentUserId={res.data.currentUserId}
    />
  );
}

