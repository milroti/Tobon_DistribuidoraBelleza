"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Customer,
  AuditAction,
  AuditLogInsert,
} from "@/lib/types/database";

// ─── Shared types ────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CustomerInput {
  first_name: string;
  last_name: string;
  cedula: string;
  phone: string;
  email?: string | null;
  consent_accepted: boolean;
}

// ─── Zod schemas ─────────────────────────────────────────────

const createCustomerSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre es demasiado largo"),
  last_name: z
    .string()
    .trim()
    .min(1, "El apellido es requerido")
    .max(100, "El apellido es demasiado largo"),
  cedula: z
    .string()
    .trim()
    .min(5, "La cédula debe tener al menos 5 caracteres")
    .max(20, "La cédula no puede superar 20 caracteres")
    .regex(/^[0-9.\-]+$/, "La cédula solo debe contener números"),
  phone: z
    .string()
    .trim()
    .min(7, "El teléfono debe tener al menos 7 dígitos")
    .max(20, "El teléfono es demasiado largo"),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (!v || v === "" ? null : v))
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "El correo electrónico no es válido"
    ),
  consent_accepted: z.literal(true, {
    message:
      "Debe aceptar la autorización de tratamiento de datos personales (Ley 1581 de 2012)",
  }),
});

const updateCustomerSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(100)
    .optional(),
  last_name: z
    .string()
    .trim()
    .min(1, "El apellido es requerido")
    .max(100)
    .optional(),
  cedula: z
    .string()
    .trim()
    .min(5, "La cédula debe tener al menos 5 caracteres")
    .max(20)
    .regex(/^[0-9.\-]+$/, "La cédula solo debe contener números")
    .optional(),
  phone: z
    .string()
    .trim()
    .min(7, "El teléfono debe tener al menos 7 dígitos")
    .max(20)
    .optional(),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (!v || v === "" ? null : v))
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "El correo electrónico no es válido"
    ),
});

// ─── Helpers ─────────────────────────────────────────────────

async function requireAuth(): Promise<
  { success: false; error: string } | { success: true; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  return { success: true, userId: user.id };
}

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

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null };

  if (!profile || profile.role !== "admin") {
    return {
      success: false,
      error: "Solo administradores pueden realizar esta acción",
    };
  }

  return { success: true, userId: user.id };
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
  log: Omit<AuditLogInsert, "ip_address"> & { ip_address?: string | null }
) {
  await admin.from("audit_logs").insert({
    ...log,
    ip_address: log.ip_address ?? null,
  } as AuditLogInsert as any);
}

function normalizeCedula(raw: string): string {
  return raw.replace(/[.\-\s]/g, "").trim();
}

function extractCustomerRaw(input: CustomerInput | FormData) {
  if (input instanceof FormData) {
    const consentVal = input.get("consent_accepted");
    return {
      first_name: String(input.get("first_name") ?? ""),
      last_name: String(input.get("last_name") ?? ""),
      cedula: String(input.get("cedula") ?? ""),
      phone: String(input.get("phone") ?? ""),
      email: input.get("email") ? String(input.get("email")) : null,
      consent_accepted:
        consentVal === "true" || consentVal === "on" || consentVal === "1",
    };
  }
  return input;
}

// ─── createCustomer ──────────────────────────────────────────

export async function createCustomer(
  input: CustomerInput | FormData
): Promise<ActionResult<Customer>> {
  // 1. Auth — any authenticated user (admin or vendor)
  const auth = await requireAuth();
  if (!auth.success) return auth;
  const { userId } = auth;

  // 2. Parse & validate
  const raw = extractCustomerRaw(input);
  const parsed = createCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const normalizedCedula = normalizeCedula(data.cedula);
  const admin = createAdminClient();

  // 3. Check cedula uniqueness
  const { data: existing } = (await admin
    .from("customers")
    .select("id, is_active")
    .eq("cedula", normalizedCedula)
    .maybeSingle()) as { data: { id: string; is_active: boolean } | null };

  if (existing) {
    return {
      success: false,
      error: `Ya existe un cliente registrado con la cédula ${normalizedCedula}`,
    };
  }

  // 4. Capture consent timestamp and IP (Ley 1581/2012)
  const consentAt = new Date().toISOString();
  const consentIp = await getRequestIp();

  // 5. Insert customer
  const { data: customer, error: insertError } = (await admin
    .from("customers")
    .insert({
      first_name: data.first_name,
      last_name: data.last_name,
      cedula: normalizedCedula,
      phone: data.phone,
      email: data.email ?? null,
      consent_at: consentAt,
      consent_ip: consentIp,
      is_active: true,
    } as any)
    .select()
    .single()) as { data: Customer | null; error: { message: string } | null };

  if (insertError || !customer) {
    console.error("createCustomer insert error:", insertError);
    return { success: false, error: "Error al registrar el cliente" };
  }

  // 6. Audit log
  await writeAuditLog(admin, {
    user_id: userId,
    action: "customer_created" as AuditAction,
    entity_type: "customer",
    entity_id: customer.id,
    old_data: null,
    new_data: {
      first_name: customer.first_name,
      last_name: customer.last_name,
      cedula: customer.cedula,
      phone: customer.phone,
      email: customer.email,
      consent_at: customer.consent_at,
      consent_ip: customer.consent_ip,
    },
    ip_address: consentIp,
  });

  return { success: true, data: customer };
}

// ─── updateCustomer ──────────────────────────────────────────

export async function updateCustomer(
  id: string,
  input: Partial<Omit<CustomerInput, "consent_accepted">> | FormData
): Promise<ActionResult<Customer>> {
  // 1. Auth — admin only (derecho de rectificación)
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { userId } = auth;

  if (!id) {
    return { success: false, error: "ID de cliente inválido" };
  }

  // 2. Parse & validate
  const raw =
    input instanceof FormData
      ? {
          first_name: input.get("first_name")
            ? String(input.get("first_name"))
            : undefined,
          last_name: input.get("last_name")
            ? String(input.get("last_name"))
            : undefined,
          cedula: input.get("cedula")
            ? String(input.get("cedula"))
            : undefined,
          phone: input.get("phone") ? String(input.get("phone")) : undefined,
          email: input.has("email")
            ? String(input.get("email") ?? "")
            : undefined,
        }
      : input;

  const parsed = updateCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const updates = parsed.data;

  const admin = createAdminClient();

  // 3. Fetch existing customer
  const { data: currentCustomer } = (await admin
    .from("customers")
    .select("*")
    .eq("id", id)
    .single()) as { data: Customer | null };

  if (!currentCustomer) {
    return { success: false, error: "Cliente no encontrado" };
  }

  // 4. Check cedula uniqueness if changing
  let normalizedCedula: string | undefined;
  if (updates.cedula !== undefined) {
    normalizedCedula = normalizeCedula(updates.cedula);
    if (normalizedCedula !== currentCustomer.cedula) {
      const { data: duplicate } = (await admin
        .from("customers")
        .select("id")
        .eq("cedula", normalizedCedula)
        .neq("id", id)
        .maybeSingle()) as { data: { id: string } | null };

      if (duplicate) {
        return {
          success: false,
          error: `Ya existe otro cliente con la cédula ${normalizedCedula}`,
        };
      }
    }
  }

  // 5. Update record
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.first_name !== undefined) payload.first_name = updates.first_name;
  if (updates.last_name !== undefined) payload.last_name = updates.last_name;
  if (normalizedCedula !== undefined) payload.cedula = normalizedCedula;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.email !== undefined) payload.email = updates.email;

  const { data: updatedCustomer, error: updateError } = (await (
    admin.from("customers") as any
  )
    .update(payload)
    .eq("id", id)
    .select()
    .single()) as { data: Customer | null; error: { message: string } | null };

  if (updateError || !updatedCustomer) {
    console.error("updateCustomer error:", updateError);
    return { success: false, error: "Error al actualizar el cliente" };
  }

  // 6. Audit log
  const ip = await getRequestIp();
  await writeAuditLog(admin, {
    user_id: userId,
    action: "customer_updated" as AuditAction,
    entity_type: "customer",
    entity_id: id,
    old_data: {
      first_name: currentCustomer.first_name,
      last_name: currentCustomer.last_name,
      cedula: currentCustomer.cedula,
      phone: currentCustomer.phone,
      email: currentCustomer.email,
    },
    new_data: {
      first_name: updatedCustomer.first_name,
      last_name: updatedCustomer.last_name,
      cedula: updatedCustomer.cedula,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email,
    },
    ip_address: ip,
  });

  return { success: true, data: updatedCustomer };
}

// ─── deleteCustomer (Soft Delete) ────────────────────────────

export async function deleteCustomer(id: string): Promise<ActionResult> {
  // 1. Auth — admin only (derecho de supresión)
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { userId } = auth;

  if (!id) {
    return { success: false, error: "ID de cliente inválido" };
  }

  const admin = createAdminClient();

  // 2. Verify customer exists
  const { data: currentCustomer } = (await admin
    .from("customers")
    .select("*")
    .eq("id", id)
    .single()) as { data: Customer | null };

  if (!currentCustomer) {
    return { success: false, error: "Cliente no encontrado" };
  }

  // 3. Soft delete (is_active = false)
  const { error: deleteError } = await (admin.from("customers") as any)
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (deleteError) {
    console.error("deleteCustomer error:", deleteError);
    return { success: false, error: "Error al eliminar el cliente" };
  }

  // 4. Audit log
  const ip = await getRequestIp();
  await writeAuditLog(admin, {
    user_id: userId,
    action: "customer_deleted" as AuditAction,
    entity_type: "customer",
    entity_id: id,
    old_data: {
      first_name: currentCustomer.first_name,
      last_name: currentCustomer.last_name,
      cedula: currentCustomer.cedula,
      is_active: currentCustomer.is_active,
    },
    new_data: { is_active: false },
    ip_address: ip,
  });

  return { success: true };
}

// ─── Query helpers (for pages) ───────────────────────────────

export async function getCustomers(opts?: {
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<ActionResult<{ customers: Customer[]; count: number }>> {
  const supabase = await createClient();
  const page = opts?.page ?? 1;
  const perPage = opts?.per_page ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts?.search?.trim()) {
    // Strip PostgREST filter metacharacters (comma, parens) to prevent OR-clause injection
    const q = opts.search.trim().replace(/[,()]/g, "");
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,cedula.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const { data, error, count } = (await query) as {
    data: Customer[] | null;
    error: { message: string } | null;
    count: number | null;
  };

  if (error) {
    console.error("getCustomers error:", error);
    return { success: false, error: "Error al cargar clientes" };
  }

  return {
    success: true,
    data: { customers: data ?? [], count: count ?? 0 },
  };
}

export async function getCustomerById(
  id: string
): Promise<ActionResult<Customer>> {
  const supabase = await createClient();

  const { data, error } = (await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single()) as { data: Customer | null; error: { message: string } | null };

  if (error || !data) {
    return { success: false, error: "Cliente no encontrado" };
  }

  return { success: true, data };
}
