import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCustomerById } from "@/lib/actions/customers";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Icon } from "@/components/ui/Icon";
import type { UserRole } from "@/lib/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClienteDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    customerResult,
  ] = await Promise.all([supabase.auth.getUser(), getCustomerById(id)]);

  if (!customerResult.success || !customerResult.data) {
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

  const customer = customerResult.data;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/clientes"
          aria-label="Volver a clientes"
          className="p-2 -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={22} />
        </Link>
        <h1 className="font-heading text-xl font-bold text-on-surface truncate">
          {customer.first_name} {customer.last_name}
        </h1>
      </div>

      <CustomerForm customer={customer} userRole={userRole} />
    </div>
  );
}

