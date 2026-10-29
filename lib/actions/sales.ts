"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Sale,
  SaleItem,
  Customer,
  AuditAction,
  AuditLogInsert,
  PaymentMethod,
} from "@/lib/types/database";

// ─── Shared types ─────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SaleWithItems extends Sale {
  sale_items: SaleItem[];
  seller_name?: string;
  customer?: Customer | null;
}

// ─── Zod schemas ──────────────────────────────────────────────

const completeSaleSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid("ID de producto inválido"),
        quantity: z.coerce.number().int().min(1, "Cantidad mínima: 1"),
      })
    )
    .min(1, "El carrito no puede estar vacío"),
  customer_id: z.string().uuid().nullable().optional(),
  payment_method: z.enum(["cash", "transfer", "card"], {
    message: "Método de pago inválido",
  }),
});

const voidSaleSchema = z.object({
  sale_id: z.string().uuid("ID de venta inválido"),
  reason: z.string().min(1, "El motivo es requerido").max(500),
});

// ─── Auth helpers ─────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "No autenticado" };
  return { success: true as const, userId: user.id };
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (!profile || profile.role !== "admin") {
    return {
      success: false as const,
      error: "Solo administradores pueden realizar esta acción",
    };
  }
  return { success: true as const, userId: user.id };
}

async function getRequestIp(): Promise<string | null> {
  try {
    const hdrs = await headers();
    const forwardedFor = hdrs.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    return hdrs.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

async function writeAuditLog(
  admin: ReturnType<typeof createAdminClient>,
  log: Omit<AuditLogInsert, "ip_address">
) {
  const ip_address = await getRequestIp();
  await admin.from("audit_logs").insert({
    ...log,
    ip_address,
  } as AuditLogInsert as any);
}

// ─── completeSale ─────────────────────────────────────────────

export async function completeSale(input: {
  items: { product_id: string; quantity: number }[];
  customer_id?: string | null;
  payment_method: PaymentMethod;
}): Promise<ActionResult<SaleWithItems>> {
  // 1. Auth — any authenticated user (admin or vendor)
  const auth = await requireAuth();
  if (!auth.success) return auth;
  const { userId } = auth;

  // 2. Validate
  const parsed = completeSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { items, customer_id, payment_method } = parsed.data;

  const admin = createAdminClient();

  // 3. Get next receipt number from sequence (with fallback to max + 1)
  let receiptNumber: number | null = null;
  const { data: rpcReceiptNumber, error: receiptError } = await admin.rpc(
    "get_next_receipt_number"
  );
  if (!receiptError && typeof rpcReceiptNumber === "number") {
    receiptNumber = rpcReceiptNumber;
  } else {
    console.warn("RPC get_next_receipt_number fallback:", receiptError);
    const { data: lastSale } = (await admin
      .from("sales")
      .select("receipt_number")
      .order("receipt_number", { ascending: false })
      .limit(1)
      .maybeSingle()) as { data: { receipt_number: number } | null };
    receiptNumber = lastSale?.receipt_number ? lastSale.receipt_number + 1 : 1000;
  }

  // Consolidate duplicate product_ids if present
  const consolidatedMap = new Map<string, number>();
  for (const item of items) {
    consolidatedMap.set(
      item.product_id,
      (consolidatedMap.get(item.product_id) ?? 0) + item.quantity
    );
  }
  const normalizedItems = Array.from(consolidatedMap.entries()).map(
    ([product_id, quantity]) => ({ product_id, quantity })
  );

  // 4. Fetch products to verify stock and capture price snapshots
  const productIds = normalizedItems.map((i) => i.product_id);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, sale_price, stock, is_active")
    .in("id", productIds) as {
    data: { id: string; name: string; sale_price: number; stock: number; is_active: boolean }[] | null;
    error: { message: string } | null;
  };

  if (productsError || !products) {
    return { success: false, error: "Error al verificar productos" };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // 5. Verify stock for every item — fail fast
  for (const item of normalizedItems) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return { success: false, error: "Producto no encontrado" };
    }
    if (!product.is_active) {
      return {
        success: false,
        error: `El producto "${product.name}" no está disponible`,
      };
    }
    if (product.stock < item.quantity) {
      return {
        success: false,
        error: `Stock insuficiente para "${product.name}" (disponible: ${product.stock}, solicitado: ${item.quantity})`,
      };
    }
  }

  // 6. Calculate totals and build sale_items payload (with snapshots)
  let subtotal = 0;
  const saleItemsPayload = normalizedItems.map((item) => {
    const product = productMap.get(item.product_id)!;
    const line_total = product.sale_price * item.quantity;
    subtotal += line_total;
    return {
      product_id: item.product_id,
      product_name: product.name,   // snapshot
      quantity: item.quantity,
      unit_price: product.sale_price, // snapshot
      line_total,
    };
  });

  // 7. Decrement stock atomically per item with concurrency guard (stock >= quantity)
  // If any update returns 0 rows (concurrent sale depleted stock), rollback previous decrements
  const decrementedItems: { product_id: string; previousStock: number }[] = [];
  for (const item of normalizedItems) {
    const product = productMap.get(item.product_id)!;
    const { data: updatedProduct, error: stockError } = await (admin
      .from("products") as any)
      .update({
        stock: product.stock - item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.product_id)
      .gte("stock", item.quantity)
      .select("id, stock")
      .single();

    if (stockError || !updatedProduct) {
      // Rollback any already-decremented products
      for (const prev of decrementedItems) {
        await (admin.from("products") as any)
          .update({
            stock: prev.previousStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prev.product_id);
      }
      return {
        success: false,
        error: `Stock insuficiente para "${product.name}" por venta simultánea. Intenta de nuevo.`,
      };
    }

    decrementedItems.push({
      product_id: item.product_id,
      previousStock: product.stock,
    });
  }

  // 8. Insert sale
  const { data: sale, error: saleError } = await admin
    .from("sales")
    .insert({
      receipt_number: receiptNumber as number,
      seller_id: userId,
      customer_id: customer_id ?? null,
      payment_method,
      subtotal,
      total: subtotal, // v1: no IVA
      status: "completed",
    } as any)
    .select()
    .single() as { data: Sale | null; error: { message: string } | null };

  if (saleError || !sale) {
    // Rollback stock decrements
    for (const prev of decrementedItems) {
      await (admin.from("products") as any)
        .update({
          stock: prev.previousStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prev.product_id);
    }
    console.error("completeSale insert error:", saleError);
    return { success: false, error: "Error al registrar la venta" };
  }

  // 9. Insert sale_items
  const saleItemsWithId = saleItemsPayload.map((item) => ({
    ...item,
    sale_id: sale.id,
  }));

  const { data: insertedItems, error: itemsError } = await admin
    .from("sale_items")
    .insert(saleItemsWithId as any)
    .select() as { data: SaleItem[] | null; error: { message: string } | null };

  if (itemsError) {
    // Compensation: remove the orphaned sale and restore stock
    await admin.from("sales").delete().eq("id", sale.id);
    for (const prev of decrementedItems) {
      await (admin.from("products") as any)
        .update({
          stock: prev.previousStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prev.product_id);
    }
    console.error("completeSale items error:", itemsError);
    return { success: false, error: "Error al registrar los productos de la venta" };
  }

  // 10. Audit log
  await writeAuditLog(admin, {
    user_id: userId,
    action: "sale_completed" as AuditAction,
    entity_type: "sale",
    entity_id: sale.id,
    old_data: null,
    new_data: {
      receipt_number: receiptNumber,
      total: subtotal,
      items_count: normalizedItems.length,
      payment_method,
    },
  });

  revalidatePath("/");
  revalidatePath("/ventas");
  revalidatePath("/pos");
  revalidatePath("/inventario");
  revalidatePath("/analiticas");

  return {
    success: true,
    data: { ...sale, sale_items: insertedItems ?? [] } as SaleWithItems,
  };
}

// ─── voidSale (T-25) ──────────────────────────────────────────

export async function voidSale(
  saleId: string,
  reason: string
): Promise<ActionResult> {
  // 1. Auth — admin only
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { userId } = auth;

  // 2. Validate
  const parsed = voidSaleSchema.safeParse({ sale_id: saleId, reason });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const admin = createAdminClient();

  // 3. Get sale + items to restore stock
  const { data: sale, error: saleError } = await admin
    .from("sales")
    .select("id, status, receipt_number")
    .eq("id", saleId)
    .single() as { data: { id: string; status: string; receipt_number: number } | null; error: { message: string } | null };

  if (saleError || !sale) {
    return { success: false, error: "Venta no encontrada" };
  }
  if (sale.status === "voided") {
    return { success: false, error: "La venta ya fue anulada" };
  }

  const { data: saleItems, error: itemsError } = await admin
    .from("sale_items")
    .select("product_id, quantity")
    .eq("sale_id", saleId) as { data: { product_id: string; quantity: number }[] | null; error: { message: string } | null };

  if (itemsError || !saleItems) {
    return { success: false, error: "Error al obtener ítems de la venta" };
  }

  // 4. Mark sale as voided
  const { error: voidError } = await (admin
    .from("sales") as any)
    .update({
      status: "voided",
      voided_by: userId,
      voided_at: new Date().toISOString(),
      void_reason: reason,
    })
    .eq("id", saleId);

  if (voidError) {
    console.error("voidSale update error:", voidError);
    return { success: false, error: "Error al anular la venta" };
  }

  // 5. Restore stock for each item
  for (const item of saleItems) {
    const { data: product } = await admin
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .single() as { data: { stock: number } | null };

    if (product) {
      await (admin.from("products") as any)
        .update({
          stock: product.stock + item.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.product_id);
    }
  }

  // 6. Audit log
  await writeAuditLog(admin, {
    user_id: userId,
    action: "sale_voided" as AuditAction,
    entity_type: "sale",
    entity_id: saleId,
    old_data: { status: sale.status, receipt_number: sale.receipt_number },
    new_data: { status: "voided", void_reason: reason },
  });

  revalidatePath("/");
  revalidatePath("/ventas");
  revalidatePath(`/ventas/${saleId}`);
  revalidatePath("/pos");
  revalidatePath("/inventario");
  revalidatePath("/analiticas");

  return { success: true };
}

// ─── Query helpers (for pages) ────────────────────────────────

export async function getSaleById(
  id: string
): Promise<ActionResult<SaleWithItems>> {
  const supabase = await createClient();

  const { data: sale, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("id", id)
    .single() as { data: SaleWithItems | null; error: { message: string } | null };

  if (error || !sale) {
    return { success: false, error: "Venta no encontrada" };
  }

  const [sellerRes, customerRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", sale.seller_id)
      .single() as unknown as Promise<{
      data: { full_name: string } | null;
    }>,
    sale.customer_id
      ? (supabase
          .from("customers")
          .select("*")
          .eq("id", sale.customer_id)
          .single() as unknown as Promise<{ data: Customer | null }>)
      : Promise.resolve({ data: null }),
  ]);

  return {
    success: true,
    data: {
      ...sale,
      seller_name: sellerRes.data?.full_name ?? "Vendedor",
      customer: customerRes.data ?? null,
    },
  };
}

export async function getSales(opts?: {
  page?: number;
  per_page?: number;
  seller_id?: string;
}): Promise<ActionResult<{ sales: Sale[]; count: number }>> {
  const supabase = await createClient();
  const page = opts?.page ?? 1;
  const perPage = opts?.per_page ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("sales")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts?.seller_id) {
    query = query.eq("seller_id", opts.seller_id);
  }

  const { data, error, count } = await query as {
    data: Sale[] | null;
    error: { message: string } | null;
    count: number | null;
  };

  if (error) {
    return { success: false, error: "Error al cargar ventas" };
  }

  return { success: true, data: { sales: data ?? [], count: count ?? 0 } };
}

export async function searchCustomers(
  query?: string
): Promise<ActionResult<Customer[]>> {
  const supabase = await createClient();
  const trimmed = query?.trim() ?? "";

  let dbQuery = supabase
    .from("customers")
    .select("*")
    .eq("is_active", true)
    .order("first_name", { ascending: true })
    .limit(10);

  if (trimmed) {
    dbQuery = dbQuery.or(
      `first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%,cedula.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`
    );
  }

  const { data, error } = (await dbQuery) as {
    data: Customer[] | null;
    error: { message: string } | null;
  };

  if (error) {
    return { success: false, error: "Error al buscar clientes" };
  }

  return { success: true, data: data ?? [] };
}
