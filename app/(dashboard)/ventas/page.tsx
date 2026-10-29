import { createClient } from "@/lib/supabase/server";
import { getProducts, getCategories } from "@/lib/actions/inventory";
import { searchCustomers } from "@/lib/actions/sales";
import { POSContent } from "@/components/pos/POSContent";

export default async function VentasPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    productsResult,
    categoriesResult,
    customersResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getProducts({ page: 1, per_page: 200 }),
    getCategories(),
    searchCustomers(""),
  ]);

  let sellerName = user?.email ?? "Vendedor";
  if (user) {
    const { data: profile } = (await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()) as { data: { full_name: string } | null };

    if (profile?.full_name) {
      sellerName = profile.full_name;
    }
  }

  return (
    <POSContent
      initialProducts={productsResult.data?.products ?? []}
      categories={categoriesResult.data ?? []}
      initialCustomers={customersResult.data ?? []}
      sellerName={sellerName}
    />
  );
}

