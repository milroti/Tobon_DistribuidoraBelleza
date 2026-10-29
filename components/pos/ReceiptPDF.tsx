"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { formatCOP } from "@/lib/utils/currency";
import type { SaleWithItems } from "@/lib/actions/sales";
import type { PaymentMethod } from "@/lib/types/database";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Nequi / Transferencia",
  card: "Tarjeta",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fcf9f8",
    padding: 28,
    fontFamily: "Helvetica",
    color: "#1b1c1c",
    fontSize: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddbfc6",
    overflow: "hidden",
  },
  accentBar: {
    height: 6,
    backgroundColor: "#951753",
    width: "100%",
  },
  accentBarVoided: {
    height: 6,
    backgroundColor: "#ba1a1a",
    width: "100%",
  },
  body: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffd9e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  logoText: {
    color: "#951753",
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
  },
  brandTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#1b1c1c",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#951753",
    marginTop: 2,
    letterSpacing: 1,
  },
  brandCaption: {
    fontSize: 8,
    color: "#897177",
    marginTop: 2,
  },
  metaBox: {
    backgroundColor: "#f6f3f2",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  metaRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#554b4e",
    textTransform: "uppercase",
  },
  receiptBadge: {
    backgroundColor: "#951753",
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  receiptBadgeVoided: {
    backgroundColor: "#ffdad6",
    color: "#93000a",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metaText: {
    fontSize: 8.5,
    color: "#564147",
  },
  metaStrong: {
    fontFamily: "Helvetica-Bold",
    color: "#1b1c1c",
  },
  statusBadge: {
    backgroundColor: "#ffdea6",
    color: "#271900",
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddbfc6",
    borderBottomStyle: "dashed",
    marginVertical: 10,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemsHeaderLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#897177",
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 7,
  },
  itemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#1b1c1c",
  },
  itemSub: {
    fontSize: 8,
    color: "#897177",
    marginTop: 1,
  },
  itemTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#1b1c1c",
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  subtotalLabel: {
    fontSize: 9,
    color: "#564147",
  },
  subtotalValue: {
    fontSize: 9,
    color: "#1b1c1c",
  },
  totalBox: {
    backgroundColor: "#f6f3f2",
    borderRadius: 6,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#554b4e",
    textTransform: "uppercase",
  },
  totalSub: {
    fontSize: 7.5,
    color: "#897177",
    marginTop: 2,
  },
  totalAmount: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: "#951753",
  },
  totalCurrency: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#554b4e",
    textAlign: "right",
    marginTop: 1,
  },
  infoBox: {
    backgroundColor: "#f6f3f2",
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  customerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#1b1c1c",
  },
  customerSub: {
    fontSize: 8,
    color: "#564147",
    marginTop: 2,
    marginBottom: 8,
  },
  paymentBox: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    padding: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#1b1c1c",
  },
  paymentValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#951753",
  },
  footer: {
    alignItems: "center",
    paddingTop: 4,
  },
  refCode: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#897177",
    letterSpacing: 1,
  },
  thankYou: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#564147",
    marginTop: 4,
    textAlign: "center",
  },
  disclaimer: {
    fontSize: 7.5,
    color: "#897177",
    marginTop: 2,
    textAlign: "center",
  },
});

export interface ReceiptPDFProps {
  sale: SaleWithItems;
}

export function ReceiptPDF({ sale }: ReceiptPDFProps) {
  const isVoided = sale.status === "voided";
  const receiptNum = String(sale.receipt_number).padStart(5, "0");
  const dateObj = new Date(sale.created_at);
  const formattedDate = `${dateObj.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} - ${dateObj.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
  const paymentLabel =
    PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method;
  const totalUnits = sale.sale_items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <Document
      title={`Recibo #${receiptNum} - Tobón Distribuidora de Belleza`}
      author="Tobón Distribuidora de Belleza"
    >
      <Page size="A5" style={styles.page}>
        <View style={styles.card}>
          <View
            style={isVoided ? styles.accentBarVoided : styles.accentBar}
          />
          <View style={styles.body}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>T</Text>
              </View>
              <Text style={styles.brandTitle}>TOBÓN DISTRIBUIDORA</Text>
              <Text style={styles.brandSubtitle}>
                DISTRIBUIDORA DE BELLEZA
              </Text>
              <Text style={styles.brandCaption}>
                Comprobante de Venta Interno
              </Text>
            </View>

            {/* Metadata */}
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Comprobante POS</Text>
                <Text
                  style={
                    isVoided ? styles.receiptBadgeVoided : styles.receiptBadge
                  }
                >
                  RECIBO #{receiptNum}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{formattedDate}</Text>
                <Text style={styles.metaText}>Caja 01</Text>
              </View>

              <View style={styles.metaRowLast}>
                <Text style={styles.metaText}>
                  Vendedor(a):{" "}
                  <Text style={styles.metaStrong}>
                    {sale.seller_name ?? "Vendedor"}
                  </Text>
                </Text>
                <Text style={styles.statusBadge}>
                  {isVoided ? "ANULADO" : "COMPLETADO"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Items */}
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsHeaderLabel}>
                Descripción / Unidades
              </Text>
              <Text style={styles.itemsHeaderLabel}>Total</Text>
            </View>

            {sale.sale_items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemSub}>
                    {item.quantity} {item.quantity === 1 ? "ud" : "uds"} x{" "}
                    {formatCOP(item.unit_price)} COP
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatCOP(item.line_total)}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            {/* Totals */}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>
                {formatCOP(sale.subtotal)} COP
              </Text>
            </View>

            <View style={styles.totalBox}>
              <View>
                <Text style={styles.totalLabel}>Total Pagado</Text>
                <Text style={styles.totalSub}>
                  {sale.sale_items.length}{" "}
                  {sale.sale_items.length === 1 ? "artículo" : "artículos"} •{" "}
                  {totalUnits} {totalUnits === 1 ? "ud" : "uds"}
                </Text>
              </View>
              <View>
                <Text style={styles.totalAmount}>
                  {formatCOP(sale.total)}
                </Text>
                <Text style={styles.totalCurrency}>COP</Text>
              </View>
            </View>

            {/* Customer & Payment */}
            <View style={styles.infoBox}>
              {sale.customer ? (
                <>
                  <Text style={styles.customerTitle}>
                    Cliente: {sale.customer.first_name}{" "}
                    {sale.customer.last_name}
                  </Text>
                  <Text style={styles.customerSub}>
                    CC {sale.customer.cedula} • Tel: {sale.customer.phone}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.customerTitle}>Cliente ocasional</Text>
                  <Text style={styles.customerSub}>
                    Venta de mostrador sin registro de cliente
                  </Text>
                </>
              )}

              <View style={styles.paymentBox}>
                <Text style={styles.paymentLabel}>
                  Método de pago: {paymentLabel}
                </Text>
                <Text style={styles.paymentValue}>
                  {formatCOP(sale.total)}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.refCode}>REF: TOBON-REC-{receiptNum}</Text>
              <Text style={styles.thankYou}>
                ¡Gracias por confiar en Tobón Distribuidora de Belleza!
              </Text>
              <Text style={styles.disclaimer}>
                Conserve este comprobante para cualquier consulta
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Genera el archivo PDF del recibo y dispara su descarga en el navegador.
 */
export async function downloadReceiptPDF(sale: SaleWithItems): Promise<void> {
  const receiptNum = String(sale.receipt_number).padStart(5, "0");
  const blob = await pdf(<ReceiptPDF sale={sale} />).toBlob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `Recibo-${receiptNum}-Tobon.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

