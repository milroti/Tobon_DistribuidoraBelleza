"use client";

import { useState, useCallback, useMemo } from "react";
import type { Product } from "@/lib/types/database";

// ─── Types ───────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface UseCartReturn {
  /** Lista de ítems actualmente en el carrito */
  items: CartItem[];
  /** Cantidad total de unidades en el carrito (suma de quantities) */
  itemCount: number;
  /** Cantidad de referencias distintas en el carrito */
  uniqueItemCount: number;
  /** Subtotal en pesos colombianos (COP, entero) */
  subtotal: number;
  /** Total a pagar en pesos colombianos (v1: igual a subtotal, sin IVA) */
  total: number;
  /** Indica si el carrito está vacío */
  isEmpty: boolean;
  /** Agrega un producto al carrito o incrementa su cantidad (respetando el stock disponible) */
  addItem: (product: Product, quantity?: number) => boolean;
  /** Elimina un producto del carrito por su ID */
  removeItem: (productId: string) => void;
  /** Actualiza la cantidad de un producto (si quantity <= 0 lo elimina; limita al stock disponible) */
  updateQuantity: (productId: string, quantity: number) => void;
  /** Vacía completamente el carrito */
  clearCart: () => void;
  /** Obtiene la cantidad actual de un producto en el carrito */
  getItemQuantity: (productId: string) => number;
  /** Convierte los ítems del carrito al formato requerido por completeSale() */
  toSaleItems: () => { product_id: string; quantity: number }[];
}

// ─── Hook ────────────────────────────────────────────────────

export function useCart(initialItems: CartItem[] = []): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const addItem = useCallback(
    (product: Product, quantity: number = 1): boolean => {
      const qtyToAdd = Math.floor(quantity);
      if (qtyToAdd <= 0 || product.stock <= 0 || !product.is_active) {
        return false;
      }

      const existing = items.find((item) => item.product.id === product.id);
      if (existing && existing.quantity >= product.stock) {
        return false;
      }

      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.product.id === product.id
        );

        if (existingIndex > -1) {
          const current = prev[existingIndex];
          const nextQty = Math.min(current.quantity + qtyToAdd, product.stock);

          if (nextQty === current.quantity) {
            return prev;
          }

          const updated = [...prev];
          updated[existingIndex] = {
            product,
            quantity: nextQty,
            lineTotal: product.sale_price * nextQty,
          };
          return updated;
        }

        const initialQty = Math.min(qtyToAdd, product.stock);
        return [
          ...prev,
          {
            product,
            quantity: initialQty,
            lineTotal: product.sale_price * initialQty,
          },
        ];
      });

      return true;
    },
    [items]
  );

  const removeItem = useCallback((productId: string): void => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number): void => {
    const targetQty = Math.floor(quantity);

    if (targetQty <= 0) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;

        const clampedQty = Math.min(targetQty, item.product.stock);
        return {
          ...item,
          quantity: clampedQty,
          lineTotal: item.product.sale_price * clampedQty,
        };
      })
    );
  }, []);

  const clearCart = useCallback((): void => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (productId: string): number => {
      const found = items.find((item) => item.product.id === productId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const toSaleItems = useCallback(
    () =>
      items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    [items]
  );

  const { itemCount, subtotal, total } = useMemo(() => {
    let count = 0;
    let sum = 0;

    for (const item of items) {
      count += item.quantity;
      sum += item.product.sale_price * item.quantity;
    }

    return {
      itemCount: count,
      subtotal: sum,
      total: sum, // v1: sin IVA (ADR-007)
    };
  }, [items]);

  return {
    items,
    itemCount,
    uniqueItemCount: items.length,
    subtotal,
    total,
    isEmpty: items.length === 0,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    toSaleItems,
  };
}
