import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSaleById } from "@/lib/actions/sales";
import { ReceiptView } from "@/components/pos/ReceiptView";
import type { UserRole } from "@/lib/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleReceiptPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    saleResult,
  ] = await Promise.all([supabase.auth.getUser(), getSaleById(id)]);

  if (!saleResult.success || !saleResult.data) {
    notFound();
  }

  let userRole: UserRole = "vendor";
  if (user) {
    const { data: profile } = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()) as { data: { role: string } | null };

    if (profile?.role === "admin") {
      userRole = "admin";
    }
  }

  return <ReceiptView sale={saleResult.data} userRole={userRole} />;
}

