import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StockBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { Product } from "@/lib/types/database";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const margin = product.sale_price - product.cost_price;
  const marginPct =
    product.cost_price > 0
      ? Math.round((margin / product.cost_price) * 100)
      : 0;

  return (
    <Link href={`/inventario/${product.id}`}>
      <Card hoverable padding="none" className="overflow-hidden">
        {/* Photo */}
        <div className="relative aspect-square bg-surface-container">
          {product.photo_url ? (
            <Image
              src={product.photo_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon
                name="image"
                size={40}
                className="text-muted/40"
              />
            </div>
          )}

          {/* Stock badge overlay */}
          <div className="absolute top-2 right-2">
            <StockBadge stock={product.stock} minStock={product.min_stock} />
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5 truncate">
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h3 className="text-sm font-medium text-foreground truncate">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-base font-heading font-bold text-foreground">
              ${product.sale_price.toLocaleString("es-CO")}
            </span>
            <span className="text-xs text-muted">
              +{marginPct}%
            </span>
          </div>

          {/* Stock count */}
          <p className="text-xs text-muted mt-1">
            {product.stock} en stock
          </p>
        </div>
      </Card>
    </Link>
  );
}
