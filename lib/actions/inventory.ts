"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Product,
  AuditAction,
  AuditLogInsert,
  InventoryAdjustmentInsert,
} from "@/lib/types/database";

// ─── Shared types ────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Zod schemas ─────────────────────────────────────────────

const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  description: z.string().max(1000).optional(),
  barcode: z
    .string()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  category_id: z.string().uuid("Categoría inválida"),
  brand: z
    .string()
    .max(100)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  cost_price: z.coerce
    .number()
    .int("El precio debe ser un entero")
    .min(0, "El precio no puede ser negativo"),
  sale_price: z.coerce
    .number()
    .int("El precio debe ser un entero")
    .min(1, "El precio de venta debe ser mayor a 0"),
  stock: z.coerce
    .number()
    .int()
    .min(0, "El stock no puede ser negativo")
    .default(0),
  min_stock: z.coerce
    .number()
    .int()
    .min(0)
    .default(5),
});

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});

const adjustStockSchema = z.object({
  product_id: z.string().uuid(),
  new_stock: z.coerce
    .number()
    .int()
    .min(0, "El stock no puede ser negativo"),
  reason: z.string().min(1, "El motivo es requerido").max(500),
});

// ─── Helpers ─────────────────────────────────────────────────

async function requireAdmin(): Promise<
  { success: false; error: string } | { success: true; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Solo administradores pueden realizar esta acción" };
  }

  return { success: true, userId: user.id };
}

async function writeAuditLog(
  admin: ReturnType<typeof createAdminClient>,
  log: Omit<AuditLogInsert, "ip_address">
) {
  await admin.from("audit_logs").insert({
    ...log,
    ip_address: null,
  } as AuditLogInsert as any);
}

// ─── createProduct ───────────────────────────────────────────

export async function createProduct(
  formData: FormData
): Promise<ActionResult<Product>> {
  // 1. Authorize
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { userId } = auth;

  // 2. Parse & validate
  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    barcode: formData.get("barcode"),
    category_id: formData.get("category_id"),
    brand: formData.get("brand"),
    cost_price: formData.get("cost_price"),
    sale_price: formData.get("sale_price"),
    stock: formData.get("stock"),
    min_stock: formData.get("min_stock"),
  };

  const parsed = createProductSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue.message };
  }
  const input = parsed.data;

  const admin = createAdminClient();

  // 3. Check barcode uniqueness
  if (input.barcode) {
    const { data: existing } = await admin
      .from("products")
      .select("id")
      .eq("barcode", input.barcode)
      .eq("is_active", true)
      .maybeSingle() as { data: { id: string } | null };

    if (existing) {
      return {
        success: false,
        error: `Ya existe un producto con el código de barras ${input.barcode}`,
      };
    }
  }

  // 4. Insert product
  const { data: product, error: insertError } = await admin
    .from("products")
    .insert({
      name: input.name,
      description: input.description ?? null,
      barcode: input.barcode ?? null,
      category_id: input.category_id,
      brand: input.brand ?? null,
      cost_price: input.cost_price,
      sale_price: input.sale_price,
      stock: input.stock,
      min_stock: input.min_stock,
      is_active: true,
      photo_url: null,
    } as any)
    .select()
    .single() as { data: Product | null; error: { message: string } | null };

  if (insertError || !product) {
    console.error("createProduct insert error:", insertError);
    return { success: false, error: "Error al crear el producto" };
  }

  // 5. Upload photo (if provided)
  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const filePath = `${product.id}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("product-photos")
      .upload(filePath, photo, {
        contentType: photo.type,
        upsert: true,
      });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = admin.storage.from("product-photos").getPublicUrl(filePath);

      await (admin
        .from("products") as any)
        .update({ photo_url: publicUrl })
        .eq("id", product.id);

      (product as Product).photo_url = publicUrl;
    } else {
      console.error("Photo upload error:", uploadError);
      // Product created, photo failed — non-fatal
    }
  }

  // 6. Audit log
  await writeAuditLog(admin, {
    user_id: userId,
    action: "product_created" as AuditAction,
    entity_type: "product",
    entity_id: product.id,
    old_data: null,
    new_data: {
      name: product.name,
      barcode: product.barcode,
      sale_price: product.sale_price,
      cost_price: product.cost_price,
      stock: product.stock,
    },
  });

  return { success: true, data: product };
}

// ─── updateProduct ───────────────────────────────────────────

export async function updateProduct(
  formData: FormData
): Promise<ActionResult<Product>> {
  // 1. Authorize
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { userId } = auth;

  // 2. Parse & validate
  const id = formData.get("id") as string;
  const raw: Record<string, unknown> = { id };

  // Only include fields that were sent
  const fieldNames = [
    "name",
    "description",
    "barcode",
    "category_id",
    "brand",
    "cost_price",
    "sale_price",
    "stock",
    "min_stock",
  ] as const;

  for (const field of fieldNames) {
    const value = formData.get(field);
    if (value !== null) raw[field] = value;
  }

  const parsed = updateProductSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue.message };
  }
  const { id: productId, ...updates } = parsed.data;

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "No hay campos para actualizar" };
  }

  const admin = createAdminClient();

  // 3. Get current product (for price change audit)
  const { data: current, error: fetchError } = await admin
    .from("products")
    .select()
    .eq("id", productId)
    .single() as { data: Product | null; error: { message: string } | null };

  if (fetchError || !current) {
    return { success: false, error: "Producto no encontrado" };
  }

  // 4. Check barcode uniqueness (if changing)
  if (updates.barcode && updates.barcode !== current.barcode) {
    const { data: existing } = await admin
      .from("products")
      .select("id")
      .eq("barcode", updates.barcode)
      .eq("is_active", true)
      .neq("id", productId)
      .maybeSingle() as { data: { id: string } | null };

    if (existing) {
      return {
        success: false,
        error: `Ya existe un producto con el código de barras ${updates.barcode}`,
      };
    }
  }

  // 5. Upload new photo (if provided)
  const photo = formData.get("photo") as File | null;
  let photoUrl = current.photo_url;

  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const filePath = `${productId}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("product-photos")
      .upload(filePath, photo, {
        contentType: photo.type,
        upsert: true,
      });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = admin.storage.from("product-photos").getPublicUrl(filePath);
      photoUrl = publicUrl;
    }
  }

  // 6. Update product
  const updatePayload: Record<string, unknown> = {
    ...updates,
    photo_url: photoUrl,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await (admin
    .from("products") as any)
    .update(updatePayload)
    .eq("id", productId)
    .select()
    .single() as { data: Product | null; error: { message: string } | null };

  if (updateError || !updated) {
    console.error("updateProduct error:", updateError);
    return { success: false, error: "Error al actualizar el producto" };
  }

  // 7. Audit log — price_changed if applicable
  const priceChanged =
    (updates.sale_price !== undefined &&
      updates.sale_price !== current.sale_price) ||
    (updates.cost_price !== undefined &&
      updates.cost_price !== current.cost_price);

  if (priceChanged) {
    await writeAuditLog(admin, {
      user_id: userId,
      action: "price_changed" as AuditAction,
      entity_type: "product",
      entity_id: productId,
      old_data: {
        sale_price: current.sale_price,
        cost_price: current.cost_price,
      },
      new_data: {
        sale_price: updated.sale_price,
        cost_price: updated.cost_price,
      },
    });
  }

  // General product_updated log
  await writeAuditLog(admin, {
    user_id: userId,
    action: "product_updated" as AuditAction,
    entity_type: "product",
    entity_id: productId,
    old_data: null,
    new_data: updates,
  });

  return { success: true, data: updated };
}

// ─── deactivateProduct ───────────────────────────────────────

export async function deactivateProduct(
  productId: string
): Promise<ActionResult> {
  // 1. Authorize
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { userId } = auth;

  const admin = createAdminClient();

  // 2. Verify product exists
  const { data: product } = await admin
    .from("products")
    .select("id, name, is_active")
    .eq("id", productId)
    .single() as { data: { id: string; name: string; is_active: boolean } | null };

  if (!product) {
    return { success: false, error: "Producto no encontrado" };
  }

  if (!product.is_active) {
    return { success: false, error: "El producto ya está desactivado" };
  }

  // 3. Soft delete
  const { error } = await (admin
    .from("products") as any)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) {
    console.error("deactivateProduct error:", error);
    return { success: false, error: "Error al desactivar el producto" };
  }

  // 4. Audit log
  await writeAuditLog(admin, {
    user_id: userId,
    action: "product_deactivated" as AuditAction,
    entity_type: "product",
    entity_id: productId,
    old_data: { name: product.name },
    new_data: null,
  });

  return { success: true };
}

// ─── adjustStock ─────────────────────────────────────────────

export async function adjustStock(
  formData: FormData
): Promise<ActionResult> {
  // 1. Authorize
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { userId } = auth;

  // 2. Parse & validate
  const raw = {
    product_id: formData.get("product_id"),
    new_stock: formData.get("new_stock"),
    reason: formData.get("reason"),
  };

  const parsed = adjustStockSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue.message };
  }
  const { product_id, new_stock, reason } = parsed.data;

  const admin = createAdminClient();

  // 3. Get current stock
  const { data: product } = await admin
    .from("products")
    .select("id, name, stock")
    .eq("id", product_id)
    .single() as { data: { id: string; name: string; stock: number } | null };

  if (!product) {
    return { success: false, error: "Producto no encontrado" };
  }

  // 4. Insert adjustment record
  const { error: adjError } = await admin
    .from("inventory_adjustments")
    .insert({
      product_id,
      adjusted_by: userId,
      previous_stock: product.stock,
      new_stock,
      reason,
    } as any);

  if (adjError) {
    console.error("adjustStock adjustment insert error:", adjError);
    return { success: false, error: "Error al registrar el ajuste" };
  }

  // 5. Update product stock
  const { error: updateError } = await (admin
    .from("products") as any)
    .update({ stock: new_stock, updated_at: new Date().toISOString() })
    .eq("id", product_id);

  if (updateError) {
    console.error("adjustStock update error:", updateError);
    return { success: false, error: "Error al actualizar el stock" };
  }

  // 6. Audit log
  await writeAuditLog(admin, {
    user_id: userId,
    action: "stock_adjusted" as AuditAction,
    entity_type: "product",
    entity_id: product_id,
    old_data: { stock: product.stock },
    new_data: { stock: new_stock, reason },
  });

  return { success: true };
}

// ─── Query helpers (for pages) ───────────────────────────────

export async function getProducts(opts?: {
  search?: string;
  category_id?: string;
  page?: number;
  per_page?: number;
}): Promise<ActionResult<{ products: Product[]; count: number }>> {
  const supabase = await createClient();
  const page = opts?.page ?? 1;
  const perPage = opts?.per_page ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("name", { ascending: true })
    .range(from, to);

  if (opts?.category_id) {
    query = query.eq("category_id", opts.category_id);
  }

  if (opts?.search) {
    // Strip PostgREST filter metacharacters (comma, parens) to prevent OR-clause injection
    const safe = opts.search.replace(/[,()]/g, "");
    query = query.or(
      `name.ilike.%${safe}%,brand.ilike.%${safe}%,barcode.eq.${safe}`
    );
  }

  const { data, error, count } = await query as {
    data: Product[] | null;
    error: { message: string } | null;
    count: number | null;
  };

  if (error) {
    console.error("getProducts error:", error);
    return { success: false, error: "Error al cargar productos" };
  }

  return { success: true, data: { products: data ?? [], count: count ?? 0 } };
}

export async function getProductById(
  id: string
): Promise<ActionResult<Product>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single() as { data: Product | null; error: { message: string } | null };

  if (error || !data) {
    return { success: false, error: "Producto no encontrado" };
  }

  return { success: true, data };
}

export async function getProductByBarcode(
  barcode: string
): Promise<ActionResult<Product>> {
  const supabase = await createClient();
  const trimmed = barcode.trim();

  if (!trimmed) {
    return { success: false, error: "Código de barras vacío" };
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", trimmed)
    .eq("is_active", true)
    .single() as { data: Product | null; error: { message: string } | null };

  if (error || !data) {
    return {
      success: false,
      error: `No se encontró producto con código "${trimmed}"`,
    };
  }

  return { success: true, data };
}

export async function getCategories(): Promise<
  ActionResult<{ id: string; name: string; slug: string }[]>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name") as { data: { id: string; name: string; slug: string }[] | null; error: { message: string } | null };

  if (error) {
    return { success: false, error: "Error al cargar categorías" };
  }

  return { success: true, data: data ?? [] };
}
