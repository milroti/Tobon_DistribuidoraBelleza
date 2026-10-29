"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function ConsentCheckbox({
  checked,
  onChange,
  error,
}: ConsentCheckboxProps) {
  return (
    <div className="bg-primary-fixed/25 rounded-xl p-4 flex flex-col gap-3 shadow-xs border border-outline-variant/40">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
            <Icon name="shield" size={18} />
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-on-surface leading-tight">
              Protección de Datos
            </p>
            <p className="font-heading text-[11px] text-primary font-bold">
              Habeas Data • Ley 1581 de 2012
            </p>
          </div>
        </div>
        <Icon name="lock" size={20} className="text-primary shrink-0" />
      </div>

      {/* Checkbox + Authorization Label */}
      <div className="flex items-start gap-3 pt-1">
        <label
          htmlFor="habeas-data-consent"
          className="relative flex items-center cursor-pointer select-none pt-0.5 shrink-0"
        >
          <input
            id="habeas-data-consent"
            name="consent_accepted"
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-5 h-5 rounded bg-surface-container-lowest border border-outline-variant peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-colors shadow-xs">
            <Icon
              name="check"
              size={16}
              className={`text-on-primary transition-opacity ${
                checked ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </label>

        <label
          htmlFor="habeas-data-consent"
          className="text-xs text-on-surface leading-relaxed cursor-pointer select-none"
        >
          Autorizo a{" "}
          <strong className="font-semibold">
            Tobón Distribuidora de Belleza
          </strong>{" "}
          para el tratamiento de mis datos personales conforme a la Ley 1581 de
          2012.
        </label>
      </div>

      {/* Link to Full Policy */}
      <div className="flex items-center justify-between pl-8">
        <Link
          href="/politica-datos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:text-on-primary-fixed-variant transition-colors group"
        >
          <span className="font-heading text-xs font-semibold underline underline-offset-2">
            Ver política completa
          </span>
          <Icon
            name="arrow_forward"
            size={15}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>

      {error && (
        <p className="text-xs text-error font-medium pl-8">{error}</p>
      )}

      {/* Info Footer */}
      <div className="bg-surface-container-lowest/80 rounded-lg p-2.5 flex items-center gap-2 mt-0.5">
        <Icon
          name="info"
          size={16}
          className="text-on-surface-variant shrink-0"
        />
        <p className="text-xs text-on-surface-variant leading-snug">
          Tus datos están protegidos y solo se usarán para registro de compras,
          recibos y comunicación sobre productos y servicios.
        </p>
      </div>
    </div>
  );
}

