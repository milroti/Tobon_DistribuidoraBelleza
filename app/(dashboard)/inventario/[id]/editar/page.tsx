import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById, getCategories } from "@/lib/actions/inventory";
import { ProductForm } from "@/components/inventory/ProductForm";
import { Icon } from "@/components/ui/Icon";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProductoPage({ params }: PageProps) {
  const { id } = await params;

  const [productResult, categoriesResult] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/inventario/${id}`}
          className="p-2 rounded-lg hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={20} className="text-foreground" />
        </Link>
        <h1 className="text-xl font-heading font-bold text-foreground">
          Editar producto
        </h1>
      </div>

      <ProductForm
        product={productResult.data}
        categories={categoriesResult.data ?? []}
      />
    </div>
  );
}
