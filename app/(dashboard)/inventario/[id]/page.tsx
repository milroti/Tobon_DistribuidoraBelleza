import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProductById } from "@/lib/actions/inventory";
import { StockBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getProductById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const p = result.data;
  const margin = p.sale_price - p.cost_price;
  const marginPct =
    p.cost_price > 0 ? Math.round((margin / p.cost_price) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/inventario"
          className="p-2 rounded-lg hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={20} className="text-foreground" />
        </Link>
        <h1 className="text-xl font-heading font-bold text-foreground flex-1 truncate">
          {p.name}
        </h1>
        <Link href={`/inventario/${p.id}/editar`}>
          <Button variant="ghost" size="sm">
            <Icon name="edit" size={18} />
            Editar
          </Button>
        </Link>
      </div>

      {/* Photo */}
      <Card padding="none" className="overflow-hidden">
        <div className="relative aspect-video bg-surface-container">
          {p.photo_url ? (
            <Image
              src={p.photo_url}
              alt={p.name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 672px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="image" size={56} className="text-muted/30" />
            </div>
          )}
        </div>
      </Card>

      {/* Info */}
      <Card padding="md">
        <div className="flex items-start justify-between mb-4">
          <div>
            {p.brand && (
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                {p.brand}
              </p>
            )}
            <h2 className="text-lg font-heading font-bold text-foreground">
              {p.name}
            </h2>
            {p.description && (
              <p className="text-sm text-muted mt-1">{p.description}</p>
            )}
          </div>
          <StockBadge stock={p.stock} minStock={p.min_stock} />
        </div>

        {/* Barcode */}
        {p.barcode && (
          <div className="flex items-center gap-2 py-2 border-t border-surface-container">
            <Icon name="barcode_scanner" size={18} className="text-muted" />
            <span className="text-sm text-foreground font-mono">
              {p.barcode}
            </span>
          </div>
        )}
      </Card>

      {/* Pricing card */}
      <Card padding="md">
        <p className="text-xs text-muted uppercase tracking-wide mb-3">
          Precios
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted">Compra</p>
            <p className="text-base font-heading font-bold text-foreground">
              ${p.cost_price.toLocaleString("es-CO")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Venta</p>
            <p className="text-base font-heading font-bold text-primary">
              ${p.sale_price.toLocaleString("es-CO")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Margen</p>
            <p className="text-base font-heading font-bold text-success">
              {marginPct}%
            </p>
          </div>
        </div>
      </Card>

      {/* Stock card */}
      <Card padding="md">
        <p className="text-xs text-muted uppercase tracking-wide mb-3">
          Stock
        </p>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted">Actual</p>
            <p className="text-2xl font-heading font-bold text-foreground">
              {p.stock}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Mínimo</p>
            <p className="text-2xl font-heading font-bold text-muted">
              {p.min_stock}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
