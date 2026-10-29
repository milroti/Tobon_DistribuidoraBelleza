import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { UserRole } from "@/lib/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener perfil con rol
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single() as { data: { full_name: string; role: string } | null };

  const userRole: UserRole = (profile?.role as UserRole) ?? "vendor";
  const userName = profile?.full_name ?? user.email ?? "Usuario";

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Sidebar — oculta en mobile, visible en md+ */}
      <Sidebar userRole={userRole} userName={userName} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userName={userName} userRole={userRole} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
