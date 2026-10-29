"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { formatCOP } from "@/lib/utils/currency";
import type { CartItem as CartItemType } from "@/lib/hooks/useCart";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const { product, quantity, lineTotal } = item;
  const atMaxStock = quantity >= product.stock;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2">
      <div className="flex items-start gap-3">
        {/* Product thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0 flex items-center justify-center relative">
          {product.photo_url ? (
            <Image
              src={product.photo_url}
              alt={product.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <Icon
              name="inventory_2"
              size={24}
              className="text-on-surface-variant/40"
            />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <span className="font-heading text-sm font-bold text-on-surface truncate">
              {product.name}
            </span>
            <button
              type="button"
              onClick={() => onRemove(product.id)}
              aria-label={`Eliminar ${product.name}`}
              className="text-outline hover:text-error transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-error-container/30"
            >
              <Icon name="delete" size={18} />
            </button>
          </div>

          {product.brand && (
            <span className="text-xs text-on-surface-variant truncate">
              {product.brand}
            </span>
          )}

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-outline">
              {formatCOP(product.sale_price)} c/u
            </span>
            <span className="font-heading text-sm font-bold text-primary">
              {formatCOP(lineTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: stock badge + touch quantity stepper */}
      <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/60">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
            atMaxStock
              ? "bg-warning-light text-warning-text"
              : "bg-secondary-fixed/50 text-secondary"
          }`}
        >
          {atMaxStock
            ? `Stock máx. alcanzado (${product.stock})`
            : `Disponible: ${product.stock} uds`}
        </span>

        {/* Touch Stepper */}
        <div className="flex items-center bg-surface-container-low rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onUpdateQuantity(product.id, quantity - 1)}
            aria-label="Reducir cantidad"
            className="w-8 h-8 rounded-md bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-xs hover:bg-surface-container active:scale-95 transition-all"
          >
            <Icon name="remove" size={16} />
          </button>
          <span className="w-9 text-center font-heading text-xs font-bold text-on-surface select-none">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
            disabled={atMaxStock}
            aria-label="Aumentar cantidad"
            className="w-8 h-8 rounded-md bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-xs hover:bg-surface-container active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="add" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

