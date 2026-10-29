import { getCategories } from "@/lib/actions/inventory";
import { ProductForm } from "@/components/inventory/ProductForm";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

export default async function NuevoProductoPage() {
  const result = await getCategories();
  const categories = result.data ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/inventario"
          className="p-2 rounded-lg hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={20} className="text-foreground" />
        </Link>
        <h1 className="text-xl font-heading font-bold text-foreground">
          Nuevo producto
        </h1>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
