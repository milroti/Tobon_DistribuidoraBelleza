"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { searchCustomers } from "@/lib/actions/sales";
import type { Customer } from "@/lib/types/database";

interface CustomerPickerProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  initialCustomers?: Customer[];
}

export function CustomerPicker({
  selectedCustomer,
  onSelect,
  initialCustomers = [],
}: CustomerPickerProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>(initialCustomers);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSearching) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchCustomers(query);
      if (res.success && res.data) {
        setResults(res.data);
      }
      setLoading(false);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isSearching]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setIsSearching(false);
    setQuery("");
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-base font-semibold text-on-surface">
            Cliente asignado
          </span>
          <span className="text-[11px] font-heading font-semibold text-outline bg-surface-container px-2 py-0.5 rounded">
            Opcional
          </span>
        </div>

        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-primary hover:underline"
        >
          <Icon name="person_add" size={16} />
          <span>Nuevo cliente</span>
        </Link>
      </div>

      {/* Selected customer view */}
      {selectedCustomer && !isSearching ? (
        <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-heading font-bold text-xs shrink-0">
              {selectedCustomer.first_name.charAt(0).toUpperCase()}
              {selectedCustomer.last_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading text-sm font-semibold text-on-surface truncate">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </span>
              <span className="text-xs text-on-surface-variant truncate">
                CC {selectedCustomer.cedula} • {selectedCustomer.phone}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsSearching(true)}
              aria-label="Cambiar cliente"
              title="Cambiar cliente"
              className="w-8 h-8 rounded-lg bg-surface-container-lowest text-primary-container flex items-center justify-center shadow-xs hover:bg-surface-container transition-colors"
            >
              <Icon name="swap_horiz" size={18} />
            </button>
            <button
              type="button"
              onClick={() => onSelect(null)}
              aria-label="Quitar cliente"
              title="Quitar cliente"
              className="w-8 h-8 rounded-lg bg-surface-container-lowest text-outline hover:text-error flex items-center justify-center shadow-xs hover:bg-surface-container transition-colors"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
      ) : !isSearching ? (
        <button
          type="button"
          onClick={() => setIsSearching(true)}
          className="flex items-center justify-between p-2.5 bg-surface-container-low hover:bg-surface-container rounded-lg transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
              <Icon name="person_search" size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading text-sm font-medium text-on-surface">
                Cliente ocasional (sin registro)
              </span>
              <span className="text-xs text-outline truncate">
                Toca para buscar por nombre o cédula
              </span>
            </div>
          </div>
          <span className="text-xs font-heading font-semibold text-primary shrink-0 px-2">
            Buscar
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 h-10 border border-outline-variant/50 focus-within:border-primary">
            <Icon name="search" size={18} className="text-outline shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, apellido o cédula..."
              autoFocus
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
            />
            {loading && (
              <Icon
                name="progress_activity"
                size={16}
                className="text-primary animate-spin shrink-0"
              />
            )}
            <button
              type="button"
              onClick={() => {
                setIsSearching(false);
                setQuery("");
              }}
              className="text-outline hover:text-on-surface p-0.5"
              aria-label="Cerrar búsqueda de cliente"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <div className="max-h-44 overflow-y-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest divide-y divide-outline-variant/20">
            {results.length > 0 ? (
              results.map((cust) => (
                <button
                  key={cust.id}
                  type="button"
                  onClick={() => handleSelect(cust)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-xs font-semibold text-on-surface truncate">
                      {cust.first_name} {cust.last_name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      CC {cust.cedula} • {cust.phone}
                    </span>
                  </div>
                  <Icon
                    name="check_circle"
                    size={18}
                    className="text-primary shrink-0 ml-2"
                  />
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-outline">
                {loading
                  ? "Buscando clientes..."
                  : "No se encontraron clientes con ese criterio"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

