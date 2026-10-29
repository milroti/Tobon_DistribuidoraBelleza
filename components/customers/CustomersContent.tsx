"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Customer } from "@/lib/types/database";

interface CustomersContentProps {
  customers: Customer[];
  totalCount: number;
  currentSearch: string;
  currentPage: number;
}

export function CustomersContent({
  customers,
  totalCount,
  currentSearch,
  currentPage,
}: CustomersContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams();
      const merged = {
        q: currentSearch,
        page: String(currentPage),
        ...updates,
      };

      for (const [key, value] of Object.entries(merged)) {
        if (value && value !== "1" && key === "page") params.set(key, value);
        else if (value && key !== "page") params.set(key, value);
      }

      if ("q" in updates) {
        params.delete("page");
      }

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/clientes?${qs}` : "/clientes");
      });
    },
    [router, currentSearch, currentPage]
  );

  useEffect(() => {
    if (searchValue === currentSearch) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: searchValue });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, currentSearch, updateParams]);

  const perPage = 20;
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="flex flex-col gap-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-on-surface">
            Clientes
          </h1>
          <p className="text-sm text-on-surface-variant">
            {totalCount} cliente{totalCount !== 1 ? "s" : ""} registrado
            {totalCount !== 1 ? "s" : ""}
          </p>
        </div>

        <Link href="/clientes/nuevo">
          <Button variant="primary" size="sm" icon="person_add">
            Nuevo cliente
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Input
        icon="search"
        placeholder="Buscar por nombre, apellido, cédula o teléfono..."
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

      {/* Customer List */}
      <div className="relative min-h-[200px]">
        {isPending && (
          <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center rounded-xl">
            <Icon
              name="progress_activity"
              size={32}
              className="text-primary animate-spin"
            />
          </div>
        )}

        {customers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {customers.map((customer) => {
              const initials = `${customer.first_name.charAt(0)}${customer.last_name.charAt(0)}`.toUpperCase();
              const consentDate = new Date(
                customer.consent_at
              ).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <Link
                  key={customer.id}
                  href={`/clientes/${customer.id}`}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:shadow-md hover:border-primary/40 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-secondary-fixed text-on-secondary-fixed font-heading font-bold text-sm flex items-center justify-center shrink-0">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col min-w-0">
                      <span className="font-heading text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                        {customer.first_name} {customer.last_name}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5">
                        <Icon name="badge" size={14} className="text-outline" />
                        <span>CC {customer.cedula}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5">
                        <Icon name="call" size={14} className="text-secondary" />
                        <span>{customer.phone}</span>
                      </div>

                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs text-outline mt-0.5 truncate">
                          <Icon name="mail" size={13} />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}

                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-heading font-semibold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full w-fit">
                        <Icon name="verified_user" size={12} />
                        <span>Habeas Data: {consentDate}</span>
                      </div>
                    </div>
                  </div>

                  <Icon
                    name="chevron_right"
                    size={20}
                    className="text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-3">
              <Icon name="people" size={32} className="text-outline/50" />
            </div>
            <p className="font-heading text-sm font-semibold text-on-surface">
              {currentSearch
                ? "No se encontraron clientes con esa búsqueda"
                : "Aún no hay clientes registrados"}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              {currentSearch
                ? "Intenta buscar con otro nombre o número de cédula."
                : "Registra tu primer cliente con autorización de tratamiento de datos (Ley 1581)."}
            </p>
            {!currentSearch && (
              <Link href="/clientes/nuevo" className="mt-4">
                <Button variant="primary" size="sm" icon="person_add">
                  Registrar cliente
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
            onClick={() => updateParams({ page: String(currentPage - 1) })}
          >
            <Icon name="chevron_left" size={18} />
          </Button>
          <span className="text-sm text-on-surface-variant px-3">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => updateParams({ page: String(currentPage + 1) })}
          >
            <Icon name="chevron_right" size={18} />
          </Button>
        </div>
      )}

      {/* Mobile FAB — Add new customer */}
      <Link
        href="/clientes/nuevo"
        aria-label="Nuevo cliente"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-primary text-on-primary shadow-lg hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center md:hidden"
      >
        <Icon name="person_add" size={26} />
      </Link>
    </div>
  );
}

