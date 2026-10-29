"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Chip, ChipGroup } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "@/components/inventory/ProductCard";
import type { Product } from "@/lib/types/database";

interface InventoryContentProps {
  products: Product[];
  categories: { id: string; name: string; slug: string }[];
  totalCount: number;
  currentSearch: string;
  currentCategory: string;
  currentPage: number;
}

export function InventoryContent({
  products,
  categories,
  totalCount,
  currentSearch,
  currentCategory,
  currentPage,
}: InventoryContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams();
      const merged = {
        q: currentSearch,
        cat: currentCategory,
        page: String(currentPage),
        ...updates,
      };

      for (const [key, value] of Object.entries(merged)) {
        if (value && value !== "1" && key === "page") params.set(key, value);
        else if (value && key !== "page") params.set(key, value);
      }

      // Reset page when search/category changes
      if ("q" in updates || "cat" in updates) {
        params.delete("page");
      }

      startTransition(() => {
        router.push(`/inventario?${params.toString()}`);
      });
    },
    [router, currentSearch, currentCategory, currentPage]
  );

  // Debounced real-time search — fires 400ms after last keystroke
  useEffect(() => {
    if (searchValue === currentSearch) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: searchValue });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, currentSearch, updateParams]);

  const handleCategoryChange = (catId: string) => {
    updateParams({ cat: catId === currentCategory ? "" : catId });
  };

  const perPage = 20;
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">
            Inventario
          </h1>
          <p className="text-sm text-muted">
            {totalCount} producto{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <Input
        icon="search"
        placeholder="Buscar por nombre, marca o código..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (debounceRef.current) clearTimeout(debounceRef.current);
            updateParams({ q: searchValue });
          }
        }}
      />

      {/* Category chips */}
      {categories.length > 0 && (
        <ChipGroup>
          <Chip
            active={!currentCategory}
            onClick={() => updateParams({ cat: "" })}
          >
            Todos
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              active={currentCategory === cat.id}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.name}
            </Chip>
          ))}
        </ChipGroup>
      )}

      {/* Product grid */}
      <div className="relative min-h-[200px]">
        {isPending && (
          <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center rounded-lg">
            <Icon
              name="progress_activity"
              size={32}
              className="text-primary animate-spin"
            />
          </div>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
              <Icon name="inventory_2" size={32} className="text-muted/40" />
            </div>
            <p className="text-sm text-muted">
              {currentSearch || currentCategory
                ? "No se encontraron productos con esos filtros"
                : "Aún no hay productos. ¡Agrega el primero!"}
            </p>
            {!currentSearch && !currentCategory && (
              <Link href="/inventario/nuevo" className="mt-4">
                <Button variant="primary" size="sm">
                  <Icon name="add" size={18} />
                  Agregar producto
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() =>
              updateParams({ page: String(currentPage - 1) })
            }
          >
            <Icon name="chevron_left" size={18} />
          </Button>
          <span className="text-sm text-muted px-3">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() =>
              updateParams({ page: String(currentPage + 1) })
            }
          >
            <Icon name="chevron_right" size={18} />
          </Button>
        </div>
      )}

      {/* FAB — Add new product */}
      <Link
        href="/inventario/nuevo"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-primary text-on-primary shadow-lg hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center md:bottom-8 md:right-8"
      >
        <Icon name="add" size={28} />
      </Link>
    </div>
  );
}
