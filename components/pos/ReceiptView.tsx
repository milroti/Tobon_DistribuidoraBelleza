"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCOP } from "@/lib/utils/currency";
import { voidSale, type SaleWithItems } from "@/lib/actions/sales";
import type { PaymentMethod, UserRole } from "@/lib/types/database";

interface ReceiptViewProps {
  sale: SaleWithItems;
  userRole: UserRole;
  onShareWhatsApp?: () => void;
  onDownloadPDF?: () => void;
}

const PAYMENT_CONFIG: Record<
  PaymentMethod,
  { label: string; icon: string }
> = {
  cash: { label: "Efectivo", icon: "payments" },
  transfer: { label: "Nequi / Transferencia", icon: "phone_android" },
  card: { label: "Tarjeta", icon: "credit_card" },
};

export function formatReceiptNumber(num: number): string {
  return String(num).padStart(5, "0");
}

export function formatReceiptDate(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} — ${timePart}`;
}

export function buildWhatsAppReceiptText(sale: SaleWithItems): string {
  const receiptNum = formatReceiptNumber(sale.receipt_number);
  const dateStr = formatReceiptDate(sale.created_at);
  const seller = sale.seller_name ?? "Vendedor";
  const payment = PAYMENT_CONFIG[sale.payment_method]?.label ?? sale.payment_method;

  const itemLines = sale.sale_items
    .map(
      (item) =>
        `${item.product_name} x${item.quantity} — ${formatCOP(item.line_total)}`
    )
    .join("\n");

  const lines = [
    "✅ *Tobón Distribuidora de Belleza*",
    `Recibo #${receiptNum}`,
    dateStr,
    `Vendedor(a): ${seller}`,
    "─────────────",
    itemLines,
    "─────────────",
    `*Total: ${formatCOP(sale.total)}*`,
    `Pago: ${payment}`,
  ];

  if (sale.customer) {
    lines.push(
      `Cliente: ${sale.customer.first_name} ${sale.customer.last_name} — CC ${sale.customer.cedula}`
    );
  }

  return lines.join("\n");
}

export function ReceiptView({
  sale,
  userRole,
  onShareWhatsApp,
  onDownloadPDF,
}: ReceiptViewProps) {
  const router = useRouter();
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [waShared, setWaShared] = useState(false);

  const isVoided = sale.status === "voided";
  const receiptNum = formatReceiptNumber(sale.receipt_number);
  const formattedDate = formatReceiptDate(sale.created_at);
  const paymentInfo =
    PAYMENT_CONFIG[sale.payment_method] ?? PAYMENT_CONFIG.cash;
  const totalUnits = sale.sale_items.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const handleWhatsAppClick = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp();
      return;
    }
    const text = buildWhatsAppReceiptText(sale);
    const encoded = encodeURIComponent(text);
    window.open(
      `https://wa.me/?text=${encoded}`,
      "_blank",
      "noopener,noreferrer"
    );
    setWaShared(true);
    setTimeout(() => setWaShared(false), 2200);
  };

  const handleDownloadPDFClick = async () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      return;
    }
    if (pdfGenerating) return;

    setPdfGenerating(true);
    setPdfSuccess(false);
    try {
      const { downloadReceiptPDF } = await import(
        "@/components/pos/ReceiptPDF"
      );
      await downloadReceiptPDF(sale);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
    } catch (err) {
      console.error("Error generating PDF receipt:", err);
      window.print();
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidReason.trim() || voidLoading) return;
    setVoidLoading(true);
    setVoidError(null);

    const res = await voidSale(sale.id, voidReason.trim());
    if (!res.success) {
      setVoidError(res.error ?? "No se pudo anular la venta");
      setVoidLoading(false);
      return;
    }

    setVoidLoading(false);
    setVoidModalOpen(false);
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto flex flex-col pb-10">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between mb-2">
        <Link
          href="/ventas"
          className="inline-flex items-center gap-1.5 text-sm font-heading font-semibold text-on-surface-variant hover:text-primary transition-colors py-1"
        >
          <Icon name="arrow_back" size={20} />
          <span>Volver a Punto de Venta</span>
        </Link>

        {userRole === "admin" && !isVoided && (
          <button
            type="button"
            onClick={() => setVoidModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-error hover:underline cursor-pointer"
          >
            <Icon name="block" size={16} />
            <span>Anular venta</span>
          </button>
        )}
      </div>

      {/* Success / Voided Celebration Banner */}
      <div className="flex flex-col items-center text-center pt-2 pb-5">
        <div className="relative flex items-center justify-center">
          {isVoided ? (
            <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center shadow-md">
              <Icon
                name="cancel"
                size={36}
                fill
                className="text-on-error-container"
              />
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center shadow-md">
                <Icon
                  name="check_circle"
                  size={38}
                  fill
                  className="text-success"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center shadow-sm">
                <Icon
                  name="verified"
                  size={14}
                  className="text-on-secondary-container"
                />
              </div>
            </>
          )}
        </div>

        <h1 className="font-heading text-xl font-bold text-on-surface mt-3">
          {isVoided ? "Venta anulada" : "¡Venta registrada!"}
        </h1>
        <p className="text-xs text-outline mt-0.5">
          {isVoided
            ? `Motivo: ${sale.void_reason ?? "Anulada por administrador"}`
            : "Transacción completada exitosamente"}
        </p>
      </div>

      {/* Central Digital Thermal Voucher Card */}
      <div className="relative bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(45,45,45,0.08)] border border-outline-variant/30 overflow-hidden">
        {/* Decorative Ticket Header Accent */}
        <div
          className={`h-2 w-full ${
            isVoided
              ? "bg-error"
              : "bg-gradient-to-r from-primary via-primary-container to-secondary-container"
          }`}
        />

        <div className="p-5 flex flex-col gap-4">
          {/* Business Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center mb-1.5 shadow-xs">
              <Icon name="spa" size={22} fill className="text-primary" />
            </div>
            <h2 className="font-heading text-lg font-bold text-on-surface tracking-tight">
              TOBÓN DISTRIBUIDORA
            </h2>
            <span className="font-heading text-[11px] text-primary uppercase font-bold tracking-wider">
              Distribuidora de Belleza
            </span>
            <span className="text-xs text-outline mt-0.5">
              Comprobante de Venta Interno
            </span>
          </div>

          {/* Receipt Voucher Badge & Metadata Bar */}
          <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[11px] font-bold text-tertiary uppercase tracking-wider">
                Comprobante POS
              </span>
              <span
                className={`font-heading text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wide ${
                  isVoided
                    ? "bg-error-container text-on-error-container"
                    : "bg-primary text-on-primary"
                }`}
              >
                RECIBO #{receiptNum}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-outline">
              <div className="flex items-center gap-1">
                <Icon name="calendar_today" size={14} />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="point_of_sale" size={14} />
                <span>Caja 01</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-on-surface-variant font-medium">
                Vendedor(a):{" "}
                <strong className="text-on-surface">
                  {sale.seller_name ?? "Vendedor"}
                </strong>
              </span>
              <span className="font-heading text-[10px] bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold uppercase">
                {isVoided ? "Anulado" : "Completado"}
              </span>
            </div>
          </div>

          {/* Scalloped / Notch Separation Indicator */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full border-t border-dashed border-outline-variant" />
            <div className="absolute -left-7 w-4 h-4 bg-background rounded-full border border-outline-variant/30" />
            <div className="absolute -right-7 w-4 h-4 bg-background rounded-full border border-outline-variant/30" />
          </div>

          {/* Item List Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between font-heading text-[11px] font-bold text-outline uppercase pb-1">
              <span>Descripción / Unidades</span>
              <span>Total</span>
            </div>

            {sale.sale_items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-heading text-xs font-semibold text-on-surface truncate">
                    {item.product_name}
                  </span>
                  <span className="text-xs text-outline">
                    {item.quantity} {item.quantity === 1 ? "ud" : "uds"} ×{" "}
                    {formatCOP(item.unit_price)} COP
                  </span>
                </div>
                <span className="font-heading text-xs font-bold text-on-surface shrink-0">
                  {formatCOP(item.line_total)}
                </span>
              </div>
            ))}
          </div>

          {/* Scalloped / Notch Separation Indicator */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full border-t border-dashed border-outline-variant" />
            <div className="absolute -left-7 w-4 h-4 bg-background rounded-full border border-outline-variant/30" />
            <div className="absolute -right-7 w-4 h-4 bg-background rounded-full border border-outline-variant/30" />
          </div>

          {/* Financial Breakdown */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs text-on-surface-variant">
              <span>Subtotal</span>
              <span>{formatCOP(sale.subtotal)} COP</span>
            </div>

            {/* Total Module Card */}
            <div className="mt-1 p-3 rounded-lg bg-surface-container-low flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-heading text-[11px] text-tertiary uppercase tracking-wider font-bold">
                  Total Pagado
                </span>
                <span className="text-xs text-outline">
                  {sale.sale_items.length}{" "}
                  {sale.sale_items.length === 1 ? "artículo" : "artículos"} •{" "}
                  {totalUnits} {totalUnits === 1 ? "ud" : "uds"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-heading text-xl text-primary font-extrabold tracking-tight">
                  {formatCOP(sale.total)}
                </span>
                <span className="font-heading text-[10px] font-bold text-tertiary">
                  COP
                </span>
              </div>
            </div>
          </div>

          {/* Separation Line */}
          <div className="w-full h-px bg-surface-container-highest" />

          {/* Payment & Customer Section */}
          <div className="flex flex-col gap-2.5 bg-surface-container-low p-3 rounded-lg">
            {/* Client Detail */}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <Icon name="badge" size={18} className="text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                {sale.customer ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading text-xs font-bold text-on-surface truncate">
                        {sale.customer.first_name} {sale.customer.last_name}
                      </span>
                      <span className="font-heading text-[10px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.5 rounded-full font-bold">
                        Cliente
                      </span>
                    </div>
                    <span className="text-xs text-outline truncate">
                      CC {sale.customer.cedula} • Tel: {sale.customer.phone}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-heading text-xs font-bold text-on-surface">
                      Cliente ocasional
                    </span>
                    <span className="text-xs text-outline">
                      Venta de mostrador sin registro de cliente
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Payment Mode */}
            <div className="flex items-center justify-between bg-surface-container-lowest p-2.5 rounded-md">
              <div className="flex items-center gap-2">
                <Icon
                  name={paymentInfo.icon}
                  size={18}
                  className="text-secondary"
                />
                <span className="font-heading text-xs font-semibold text-on-surface">
                  Método de pago: {paymentInfo.label}
                </span>
              </div>
              <span className="font-heading text-xs font-bold text-primary">
                {formatCOP(sale.total)}
              </span>
            </div>
          </div>

          {/* Stylized Barcode & Footer */}
          <div className="flex flex-col items-center text-center pt-1 gap-1">
            <div
              className="flex items-center justify-center gap-0.5 h-7 w-48 opacity-75"
              aria-hidden
            >
              <div className="w-1 h-full bg-on-surface" />
              <div className="w-0.5 h-full bg-on-surface" />
              <div className="w-1.5 h-full bg-on-surface" />
              <div className="w-0.5 h-full bg-on-surface" />
              <div className="w-2 h-full bg-on-surface" />
              <div className="w-0.5 h-full bg-on-surface" />
              <div className="w-1 h-full bg-on-surface" />
              <div className="w-0.5 h-full bg-on-surface" />
              <div className="w-2 h-full bg-on-surface" />
              <div className="w-1 h-full bg-on-surface" />
              <div className="w-0.5 h-full bg-on-surface" />
              <div className="w-1.5 h-full bg-on-surface" />
              <div className="w-0.5 h-full bg-on-surface" />
              <div className="w-1 h-full bg-on-surface" />
              <div className="w-2 h-full bg-on-surface" />
              <div className="w-0.5 h-full bg-on-surface" />
              <div className="w-1 h-full bg-on-surface" />
            </div>
            <span className="font-heading text-[10px] font-bold text-outline tracking-wider uppercase">
              REF: TOBON-REC-{receiptNum}
            </span>
            <span className="text-xs text-on-surface-variant font-medium mt-1">
              ¡Gracias por confiar en Tobón Distribuidora de Belleza!
            </span>
            <span className="font-heading text-[10px] text-outline">
              Conserve este comprobante para cualquier consulta
            </span>
          </div>
        </div>

        {/* Realistic Sawtooth Tear Pattern */}
        <div
          className="w-full flex overflow-hidden h-2 bg-surface-container-low"
          aria-hidden
        >
          <div className="w-full flex justify-between gap-1 px-1">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div key={idx} className="w-2 h-2 rounded-full bg-background" />
            ))}
          </div>
        </div>
      </div>

      {/* Primary Quick Dispatch Actions (WhatsApp + PDF) */}
      <div className="grid grid-cols-2 gap-3 mt-5 print:hidden">
        <button
          type="button"
          onClick={handleWhatsAppClick}
          className="flex items-center justify-center gap-2 bg-secondary-fixed text-on-secondary-fixed py-3 px-3 rounded-xl font-heading text-sm font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
        >
          <Icon name={waShared ? "done_all" : "chat"} size={20} fill />
          <span className="truncate">
            {waShared ? "¡Enviado!" : "Compartir por WhatsApp"}
          </span>
        </button>

        <button
          type="button"
          disabled={pdfGenerating}
          onClick={handleDownloadPDFClick}
          className="flex items-center justify-center gap-2 bg-surface-container-high text-on-surface py-3 px-3 rounded-xl font-heading text-sm font-bold shadow-xs hover:bg-surface-container-highest active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Icon
            name={
              pdfGenerating
                ? "progress_activity"
                : pdfSuccess
                  ? "check_circle"
                  : "picture_as_pdf"
            }
            size={20}
            className={pdfGenerating ? "animate-spin text-primary" : ""}
          />
          <span className="truncate">
            {pdfGenerating
              ? "Generando..."
              : pdfSuccess
                ? "PDF Descargado"
                : "Descargar PDF"}
          </span>
        </button>
      </div>

      {/* Thermal Print Quick Action */}
      <button
        type="button"
        onClick={() => window.print()}
        className="mt-2.5 w-full flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant/30 text-on-surface py-2.5 px-4 rounded-xl font-heading text-xs font-semibold shadow-xs hover:bg-surface-container-low active:scale-[0.99] transition-all print:hidden cursor-pointer"
      >
        <Icon name="print" size={18} className="text-tertiary" />
        <span>Imprimir ticket térmico ESC/POS (80mm)</span>
      </button>

      {/* Next Transaction Initiator */}
      <div className="mt-4 flex flex-col items-center gap-2 print:hidden">
        <Link
          href="/ventas"
          className="w-full bg-primary-container text-on-primary py-3.5 px-6 rounded-xl font-heading text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:bg-primary active:scale-[0.99] transition-all"
        >
          <Icon name="add_shopping_cart" size={20} />
          <span>Iniciar nueva venta</span>
        </Link>
      </div>

      {/* Admin Void Sale Modal */}
      <Modal
        open={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        title={`Anular Recibo #${receiptNum}`}
        size="sm"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-on-surface-variant">
            Al anular esta venta se restaurará automáticamente el stock de los
            productos vendidos y quedará registrado en el historial de
            auditoría.
          </p>

          {voidError && (
            <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs font-medium">
              {voidError}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="void-reason"
              className="font-heading text-xs font-semibold text-on-surface"
            >
              Motivo de la anulación *
            </label>
            <textarea
              id="void-reason"
              rows={3}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Ej: Devolución del cliente o error en método de pago"
              className="w-full rounded-lg bg-surface-container-low border border-outline-variant/50 p-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <ModalFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVoidModalOpen(false)}
              disabled={voidLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={voidLoading}
              disabled={!voidReason.trim()}
              onClick={handleConfirmVoid}
            >
              Confirmar anulación
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}

