"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { createProduct, updateProduct } from "@/lib/actions/inventory";
import type { Product } from "@/lib/types/database";

interface ProductFormProps {
  product?: Product;
  categories: { id: string; name: string; slug: string }[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    product?.photo_url ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isEditing = !!product;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleBarcodeScan = (code: string) => {
    setBarcode(code);
    setShowScanner(false);
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Ensure barcode from state is in formData
      formData.set("barcode", barcode);

      if (isEditing) {
        formData.set("id", product.id);
        const result = await updateProduct(formData);
        if (!result.success) {
          setError(result.error ?? "Error al actualizar");
          return;
        }
        router.push(`/inventario/${product.id}`);
      } else {
        const result = await createProduct(formData);
        if (!result.success) {
          setError(result.error ?? "Error al crear");
          return;
        }
        router.push("/inventario");
      }
      router.refresh();
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-6">
        {/* Error banner */}
        {error && (
          <div className="p-3 rounded-lg bg-danger-light text-danger-text text-sm flex items-center gap-2">
            <Icon name="error" size={18} />
            {error}
          </div>
        )}

        {/* Photo section */}
        <Card padding="md">
          <p className="text-sm font-medium text-foreground mb-3">
            Foto del producto
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-xl bg-surface-container border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors shrink-0"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="add_a_photo" size={28} className="text-muted" />
              )}
            </button>
            <div className="text-xs text-muted">
              <p>Toca para agregar una foto.</p>
              <p>JPG, PNG. Máx 5 MB.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </Card>

        {/* Barcode section */}
        <Card padding="md">
          <p className="text-sm font-medium text-foreground mb-3">
            Código de barras
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                icon="barcode_scanner"
                placeholder="EAN-13, UPC-A, etc."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                name="barcode_display"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowScanner(true)}
            >
              <Icon name="qr_code_scanner" size={20} />
            </Button>
          </div>
          {/* Hidden input for form submission */}
          <input type="hidden" name="barcode" value={barcode} />
        </Card>

        {/* Basic info */}
        <Card padding="md">
          <p className="text-sm font-medium text-foreground mb-3">
            Información básica
          </p>
          <div className="flex flex-col gap-4">
            <Input
              label="Nombre del producto"
              name="name"
              placeholder="Ej: Tinte Igora Royal 7-0"
              defaultValue={product?.name}
              required
            />

            <Input
              label="Marca"
              name="brand"
              placeholder="Ej: Schwarzkopf"
              defaultValue={product?.brand ?? ""}
            />

            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Categoría
              </label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={product?.category_id ?? ""}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              >
                <option value="" disabled>
                  Selecciona una categoría
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-on-surface mb-1.5"
              >
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Descripción breve (opcional)"
                defaultValue={product?.description ?? ""}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card padding="md">
          <p className="text-sm font-medium text-foreground mb-3">Precios</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio compra (COP)"
              name="cost_price"
              type="number"
              icon="attach_money"
              placeholder="0"
              defaultValue={product?.cost_price ?? ""}
              required
            />
            <Input
              label="Precio venta (COP)"
              name="sale_price"
              type="number"
              icon="attach_money"
              placeholder="0"
              defaultValue={product?.sale_price ?? ""}
              required
            />
          </div>
        </Card>

        {/* Stock */}
        <Card padding="md">
          <p className="text-sm font-medium text-foreground mb-3">Stock</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock actual"
              name="stock"
              type="number"
              placeholder="0"
              defaultValue={product?.stock ?? 0}
              required
            />
            <Input
              label="Stock mínimo"
              name="min_stock"
              type="number"
              placeholder="5"
              defaultValue={product?.min_stock ?? 5}
            />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="flex-1"
          >
            {isEditing ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>
      </form>

      {/* Barcode scanner modal */}
      <Modal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        title="Escanear código"
        size="md"
      >
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      </Modal>
    </>
  );
}
