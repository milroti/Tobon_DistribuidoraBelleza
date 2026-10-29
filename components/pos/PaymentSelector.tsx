"use client";

import { Icon } from "@/components/ui/Icon";
import { formatCOP } from "@/lib/utils/currency";
import type { PaymentMethod } from "@/lib/types/database";

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  icon: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: "cash", label: "Efectivo", icon: "payments" },
  { value: "transfer", label: "Nequi / Transf.", icon: "phone_android" },
  { value: "card", label: "Tarjeta", icon: "credit_card" },
];

interface PaymentSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  total: number;
  cashReceived: string;
  onCashReceivedChange: (value: string) => void;
}

export function PaymentSelector({
  value,
  onChange,
  total,
  cashReceived,
  onCashReceivedChange,
}: PaymentSelectorProps) {
  const numericCash = parseInt(cashReceived.replace(/\D/g, ""), 10) || 0;
  const change = numericCash > total ? numericCash - total : 0;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-heading text-base font-semibold text-on-surface">
          Método de pago
        </span>
        <span className="text-[11px] font-heading font-semibold text-outline uppercase tracking-wider">
          Punto de venta físico
        </span>
      </div>

      {/* Interactive Payment Chips */}
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl gap-1 transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-primary text-on-primary shadow-sm font-bold"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high font-semibold"
              }`}
            >
              <Icon name={opt.icon} size={20} />
              <span className="font-heading text-[11px] truncate max-w-full">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cash Change Calculation Assist Card */}
      {value === "cash" && total > 0 && (
        <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 mt-0.5">
          <div className="flex items-center justify-between gap-2 text-sm text-on-surface-variant">
            <label htmlFor="pos-cash-received" className="shrink-0">
              Efectivo recibido:
            </label>
            <div className="relative w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-outline">
                $
              </span>
              <input
                id="pos-cash-received"
                type="text"
                inputMode="numeric"
                placeholder={total.toLocaleString("es-CO")}
                value={
                  numericCash > 0 ? numericCash.toLocaleString("es-CO") : ""
                }
                onChange={(e) =>
                  onCashReceivedChange(e.target.value.replace(/\D/g, ""))
                }
                className="w-full h-8 pl-6 pr-2.5 rounded-md bg-surface-container-lowest border border-outline-variant/50 text-right font-heading text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30">
            <span className="font-heading text-xs font-bold text-primary">
              Cambio a entregar:
            </span>
            <span className="font-heading text-base font-bold text-primary">
              {formatCOP(change)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

