"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Chip, ChipGroup } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { CartItem } from "@/components/pos/CartItem";
import { PaymentSelector } from "@/components/pos/PaymentSelector";
import { CustomerPicker } from "@/components/pos/CustomerPicker";
import { useCart } from "@/lib/hooks/useCart";
import { completeSale, type SaleWithItems } from "@/lib/actions/sales";
import { getProductByBarcode } from "@/lib/actions/inventory";
import { formatCOP } from "@/lib/utils/currency";
import type {
  Product,
  Customer,
  PaymentMethod,
} from "@/lib/types/database";

interface POSContentProps {
  initialProducts: Product[];
  categories: { id: string; name: string; slug: string }[];
  initialCustomers: Customer[];
  sellerName: string;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Nequi / Transferencia",
  card: "Tarjeta",
};

export function POSContent({
  initialProducts,
  categories,
  initialCustomers,
  sellerName,
}: POSContentProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [completedSale, setCompletedSale] = useState<{
    sale: SaleWithItems;
    customer: Customer | null;
  } | null>(null);

  const {
    items,
    itemCount,
    uniqueItemCount,
    subtotal,
    total,
    isEmpty,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    toSaleItems,
  } = useCart();

  const showFeedback = useCallback(
    (type: "success" | "warning" | "error", message: string) => {
      setFeedback({ type, message });
    },
    []
  );

  // Filter products for manual search & category selection
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.is_active) return false;
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery, selectedCategory]);

  // Add a product to the cart with user feedback
  const handleAddProduct = useCallback(
    (product: Product) => {
      if (product.stock <= 0) {
        showFeedback("error", `"${product.name}" está agotado (stock: 0).`);
        return;
      }

      const added = addItem(product, 1);
      if (!added) {
        showFeedback(
          "warning",
          `Ya agregaste el máximo stock disponible (${product.stock}) de "${product.name}".`
        );
        return;
      }

      showFeedback("success", `Agregado: ${product.name}`);
    },
    [addItem, showFeedback]
  );

  // Handle barcode scan from camera or manual Enter
  const handleBarcodeLookup = useCallback(
    async (rawBarcode: string) => {
      const code = rawBarcode.trim();
      if (!code) return;

      setScannerOpen(false);

      // 1. Check local catalog first for instant response
      const localMatch = products.find(
        (p) =>
          p.is_active &&
          p.barcode &&
          p.barcode.toLowerCase() === code.toLowerCase()
      );

      if (localMatch) {
        handleAddProduct(localMatch);
        setSearchQuery("");
        return;
      }

      // 2. Query server if not in initial local list
      const res = await getProductByBarcode(code);
      if (res.success && res.data) {
        const fetchedProduct = res.data;
        setProducts((prev) =>
          prev.some((p) => p.id === fetchedProduct.id)
            ? prev
            : [fetchedProduct, ...prev]
        );
        handleAddProduct(fetchedProduct);
        setSearchQuery("");
      } else {
        showFeedback(
          "error",
          res.error ?? `No se encontró producto con código "${code}"`
        );
      }
    },
    [products, handleAddProduct, showFeedback]
  );

  const handleDiscardOrder = () => {
    clearCart();
    setSelectedCustomer(null);
    setPaymentMethod("cash");
    setCashReceived("");
    setFeedback(null);
  };

  const handleConfirmSale = async () => {
    if (isEmpty || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await completeSale({
        items: toSaleItems(),
        customer_id: selectedCustomer?.id ?? null,
        payment_method: paymentMethod,
      });

      if (!result.success || !result.data) {
        showFeedback(
          "error",
          result.error ?? "No se pudo completar la venta."
        );
        setSubmitting(false);
        return;
      }

      // Update local stock counts immediately
      const soldQuantities = new Map(
        items.map((i) => [i.product.id, i.quantity])
      );
      setProducts((prev) =>
        prev.map((p) => {
          const sold = soldQuantities.get(p.id);
          if (!sold) return p;
          return { ...p, stock: Math.max(0, p.stock - sold) };
        })
      );

      setCompletedSale({
        sale: result.data,
        customer: selectedCustomer,
      });

      clearCart();
      setSelectedCustomer(null);
      setPaymentMethod("cash");
      setCashReceived("");
    } catch {
      showFeedback("error", "Ocurrió un error inesperado al registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Top Action Bar / Session Context */}
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-3 rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          {!isEmpty && (
            <button
              type="button"
              onClick={handleDiscardOrder}
              aria-label="Cancelar venta actual"
              title="Limpiar venta actual"
              className="w-10 h-10 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-error flex items-center justify-center active:scale-95 transition-all shadow-xs"
            >
              <Icon name="close" size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="font-heading text-lg font-bold text-on-surface leading-tight">
              Nueva venta
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              <span className="font-heading text-[11px] font-semibold text-on-surface-variant">
                Caja Principal • Vendedor: {sellerName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg text-xs font-heading font-semibold text-on-surface shadow-xs">
            <Icon name="wifi" size={16} className="text-secondary" />
            En línea
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            feedback.type === "error"
              ? "bg-error-container text-on-error-container"
              : feedback.type === "warning"
                ? "bg-warning-light text-warning-text"
                : "bg-success-light text-success-text"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon
              name={
                feedback.type === "error"
                  ? "error"
                  : feedback.type === "warning"
                    ? "warning"
                    : "check_circle"
              }
              size={18}
            />
            <span className="truncate">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 shrink-0"
            aria-label="Cerrar aviso"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Main Responsive POS Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Prominent Scanner + Manual Search + Product Catalog */}
        <section className="xl:col-span-7 flex flex-col gap-4">
          {/* Quick Scan & SKU Input Bento Box */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-3">
            {/* High Priority Scanner Card */}
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl p-4 flex items-center gap-4 text-left shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-on-primary/15 flex items-center justify-center shrink-0">
                <Icon
                  name="barcode_scanner"
                  size={28}
                  className="text-on-primary"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-heading text-base text-on-primary font-bold tracking-tight">
                  Escanear producto
                </span>
                <span className="text-xs text-on-primary/80 truncate">
                  Cámara activa para código de barras (EAN, UPC, CODE-128)
                </span>
              </div>
              <Icon
                name="photo_camera"
                size={22}
                className="text-on-primary/90 shrink-0"
              />
            </button>

            {/* Manual SKU / Quick Search Pill */}
            <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 h-11 border border-transparent focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
              <Icon name="search" size={20} className="text-outline shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    e.preventDefault();
                    // If exact barcode match or single filtered product, add immediately
                    const q = searchQuery.trim();
                    const exactBarcode = products.find(
                      (p) =>
                        p.is_active &&
                        p.barcode &&
                        p.barcode.toLowerCase() === q.toLowerCase()
                    );
                    if (exactBarcode) {
                      handleAddProduct(exactBarcode);
                      setSearchQuery("");
                    } else if (filteredProducts.length === 1) {
                      handleAddProduct(filteredProducts[0]);
                      setSearchQuery("");
                    } else {
                      handleBarcodeLookup(q);
                    }
                  }
                }}
                placeholder="Buscar por nombre, marca o código de barras... [Enter]"
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpiar búsqueda"
                  className="text-outline hover:text-on-surface p-1"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-heading text-[11px] font-bold tracking-wider uppercase shrink-0">
                SKU
              </span>
            </div>

            {/* Category Selector Chips */}
            {categories.length > 0 && (
              <ChipGroup className="pt-0.5">
                <Chip
                  active={!selectedCategory}
                  onClick={() => setSelectedCategory("")}
                >
                  Todos ({products.filter((p) => p.is_active).length})
                </Chip>
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    active={selectedCategory === cat.id}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === cat.id ? "" : cat.id
                      )
                    }
                  >
                    {cat.name}
                  </Chip>
                ))}
              </ChipGroup>
            )}
          </div>

          {/* Product Catalog Grid */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-heading text-sm font-semibold text-on-surface-variant">
                Catálogo rápido ({filteredProducts.length})
              </span>
              {searchQuery && (
                <span className="text-xs text-outline">
                  Filtrando por &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] xl:max-h-[640px] overflow-y-auto pr-0.5">
                {filteredProducts.map((product) => {
                  const inCartQty = getItemQuantity(product.id);
                  const outOfStock = product.stock <= 0;
                  const maxReached = inCartQty >= product.stock;

                  return (
                    <div
                      key={product.id}
                      className="bg-surface-container-lowest rounded-xl p-3 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-start gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface-container-low shrink-0 flex items-center justify-center">
                            {product.photo_url ? (
                              <Image
                                src={product.photo_url}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : (
                              <Icon
                                name="inventory_2"
                                size={22}
                                className="text-on-surface-variant/40"
                              />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-heading text-[11px] font-semibold text-on-surface-variant truncate">
                                {product.brand ?? "Tobón"}
                              </span>
                              <span
                                className={`text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  outOfStock
                                    ? "bg-danger-light text-danger-text"
                                    : product.stock <= product.min_stock
                                      ? "bg-warning-light text-warning-text"
                                      : "bg-success-light text-success-text"
                                }`}
                              >
                                Stock: {product.stock}
                              </span>
                            </div>

                            <h3 className="font-heading text-sm font-bold text-on-surface line-clamp-2 mt-0.5 leading-snug">
                              {product.name}
                            </h3>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-baseline justify-between bg-surface-container-low px-2.5 py-1.5 rounded-lg">
                          <span className="text-[11px] text-on-surface-variant truncate">
                            {product.barcode
                              ? `Cód: ${product.barcode}`
                              : "Precio venta"}
                          </span>
                          <span className="font-heading text-sm font-bold text-primary shrink-0">
                            {formatCOP(product.sale_price)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={outOfStock || maxReached}
                          onClick={() => handleAddProduct(product)}
                          className="flex-1 h-9 bg-primary text-on-primary rounded-lg font-heading text-xs font-semibold flex items-center justify-center gap-1 hover:bg-primary-container transition-all active:scale-95 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Icon name="add_shopping_cart" size={16} />
                          <span>
                            {outOfStock
                              ? "Agotado"
                              : inCartQty > 0
                                ? `Agregar (${inCartQty} en orden)`
                                : "Agregar"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/30 flex flex-col items-center gap-2">
                <Icon
                  name="search_off"
                  size={28}
                  className="text-on-surface-variant/40"
                />
                <p className="text-sm text-on-surface-variant">
                  No se encontraron productos con ese filtro.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Cart + Customer + Payment + Total + Confirm Button */}
        <aside className="xl:col-span-5 flex flex-col gap-4">
          {/* Cart Section: Header and Item Cards */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-heading text-base font-bold text-on-surface">
                  Productos en orden
                </span>
                <span className="font-heading text-[11px] bg-primary-fixed text-on-primary-fixed px-2.5 py-0.5 rounded-full font-bold">
                  {uniqueItemCount} {uniqueItemCount === 1 ? "item" : "items"} •{" "}
                  {itemCount} uds
                </span>
              </div>
              {!isEmpty && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="font-heading text-xs text-primary-container hover:underline font-semibold cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {items.length > 0 ? (
              <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-0.5">
                {items.map((item) => (
                  <CartItem
                    key={item.product.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary">
                  <Icon name="shopping_bag" size={24} />
                </div>
                <p className="font-heading text-sm font-semibold text-on-surface">
                  El carrito está vacío
                </p>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Escanea un código de barras o selecciona productos del
                  catálogo para iniciar la venta.
                </p>
              </div>
            )}
          </div>

          {/* Optional Customer Assignment */}
          <CustomerPicker
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomer}
            initialCustomers={initialCustomers}
          />

          {/* Payment Method Selector */}
          <PaymentSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
            total={total}
            cashReceived={cashReceived}
            onCashReceivedChange={setCashReceived}
          />

          {/* Financial Breakdown Card */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm text-on-surface-variant">
              <span>
                Subtotal ({itemCount}{" "}
                {itemCount === 1 ? "producto" : "productos"})
              </span>
              <span className="font-medium text-on-surface">
                {formatCOP(subtotal)}
              </span>
            </div>

            <div className="h-px bg-surface-container-high my-1" />

            <div className="flex justify-between items-baseline pt-0.5">
              <span className="font-heading text-xs text-on-surface-variant tracking-wider uppercase font-bold">
                TOTAL A COBRAR
              </span>
              <span className="font-heading text-2xl md:text-3xl text-primary font-extrabold tracking-tight">
                {formatCOP(total)}
              </span>
            </div>
          </div>

          {/* Final High-Contrast Trigger Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={isEmpty || submitting}
              onClick={handleConfirmSale}
              className="w-full h-14 bg-primary text-on-primary rounded-xl font-heading text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Icon
                    name="progress_activity"
                    size={22}
                    className="animate-spin"
                  />
                  <span>Procesando venta...</span>
                </>
              ) : (
                <>
                  <Icon name="point_of_sale" size={24} />
                  <span>
                    Confirmar venta ({formatCOP(total)})
                  </span>
                </>
              )}
            </button>

            {!isEmpty && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleDiscardOrder}
                className="w-full py-2 text-center font-heading text-xs font-semibold text-outline hover:text-error transition-colors cursor-pointer"
              >
                Cancelar y descartar orden
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Barcode Scanner Modal */}
      <Modal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        size="md"
      >
        {scannerOpen && (
          <BarcodeScanner
            onScan={handleBarcodeLookup}
            onClose={() => setScannerOpen(false)}
          />
        )}
      </Modal>

      {/* Sale Completed / Receipt Summary Modal */}
      <Modal
        open={Boolean(completedSale)}
        onClose={() => setCompletedSale(null)}
        size="md"
      >
        {completedSale && (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-success-light flex items-center justify-center text-success">
              <Icon name="check_circle" size={34} fill />
            </div>

            <div>
              <h2 className="font-heading text-xl font-bold text-on-surface">
                ¡Venta completada!
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Recibo #{String(completedSale.sale.receipt_number).padStart(5, "0")} •{" "}
                {new Date(completedSale.sale.created_at).toLocaleString("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            {/* Receipt Details Card */}
            <div className="w-full bg-surface-container-low rounded-xl p-4 text-left flex flex-col gap-2.5 border border-outline-variant/40">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Vendedor:</span>
                <span className="font-semibold text-on-surface">
                  {sellerName}
                </span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Método de pago:</span>
                <span className="font-semibold text-on-surface">
                  {PAYMENT_LABELS[completedSale.sale.payment_method]}
                </span>
              </div>
              {completedSale.customer && (
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Cliente:</span>
                  <span className="font-semibold text-on-surface">
                    {completedSale.customer.first_name}{" "}
                    {completedSale.customer.last_name} (CC{" "}
                    {completedSale.customer.cedula})
                  </span>
                </div>
              )}

              <div className="border-t border-dashed border-outline-variant my-1" />

              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {completedSale.sale.sale_items.map((si) => (
                  <div
                    key={si.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-on-surface truncate pr-2">
                      {si.product_name} × {si.quantity}
                    </span>
                    <span className="font-heading font-semibold text-on-surface shrink-0">
                      {formatCOP(si.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-outline-variant my-1" />

              <div className="flex items-baseline justify-between">
                <span className="font-heading text-xs font-bold uppercase text-on-surface-variant">
                  Total pagado
                </span>
                <span className="font-heading text-lg font-extrabold text-primary">
                  {formatCOP(completedSale.sale.total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
              <Link
                href={`/ventas/${completedSale.sale.id}`}
                className="flex-1"
              >
                <Button variant="secondary" fullWidth icon="receipt_long">
                  Ver comprobante
                </Button>
              </Link>
              <Button
                variant="primary"
                fullWidth
                icon="add_shopping_cart"
                onClick={() => setCompletedSale(null)}
                className="flex-1"
              >
                Nueva venta
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

