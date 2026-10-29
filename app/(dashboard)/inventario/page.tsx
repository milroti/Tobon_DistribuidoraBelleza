import { Suspense } from "react";
import { getProducts, getCategories } from "@/lib/actions/inventory";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { InventoryContent } from "@/components/inventory/InventoryContent";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    page?: string;
  }>;
}

export default async function InventarioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.q ?? "";
  const categoryId = params.cat ?? "";
  const page = parseInt(params.page ?? "1", 10);

  const [productsResult, categoriesResult] = await Promise.all([
    getProducts({
      search: search || undefined,
      category_id: categoryId || undefined,
      page,
      per_page: 20,
    }),
    getCategories(),
  ]);

  const products = productsResult.data?.products ?? [];
  const totalCount = productsResult.data?.count ?? 0;
  const categories = categoriesResult.data ?? [];

  return (
    <InventoryContent
      products={products}
      categories={categories}
      totalCount={totalCount}
      currentSearch={search}
      currentCategory={categoryId}
      currentPage={page}
    />
  );
}
