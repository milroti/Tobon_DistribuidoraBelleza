"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserRole } from "@/lib/types/database";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserWithEmail extends Profile {
  email: string;
  last_sign_in_at: string | null;
}

const createUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  email: z.string().trim().email("Correo electrónico inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(72, "La contraseña es demasiado larga"),
  role: z.enum(["admin", "vendor"], {
    message: "Rol inválido",
  }),
});

const updateUserSchema = z.object({
  id: z.string().uuid("ID de usuario inválido"),
  full_name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  email: z.string().trim().email("Correo electrónico inválido").optional(),
  password: z
    .string()
    .optional()
    .transform((v) => (!v || v.trim() === "" ? undefined : v))
    .refine(
      (v) => v === undefined || (v.length >= 6 && v.length <= 72),
      "La nueva contraseña debe tener entre 6 y 72 caracteres"
    ),
  role: z.enum(["admin", "vendor"], {
    message: "Rol inválido",
  }),
  is_active: z.boolean(),
});

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
    .select("role, is_active")
    .eq("id", user.id)
    .single()) as { data: { role: string; is_active: boolean } | null };

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return {
      success: false,
      error: "Acceso denegado: solo administradores pueden gestionar usuarios",
    };
  }

  return { success: true, userId: user.id };
}

export async function getUsers(): Promise<
  ActionResult<{ users: UserWithEmail[]; currentUserId: string }>
> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const admin = createAdminClient();

  const [profilesRes, authUsersRes] = await Promise.all([
    admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }) as unknown as Promise<{
      data: Profile[] | null;
      error: { message: string } | null;
    }>,
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (profilesRes.error || !profilesRes.data) {
    return {
      success: false,
      error: "Error al cargar los perfiles de usuario",
    };
  }

  const authMap = new Map<
    string,
    { email: string; last_sign_in_at: string | null }
  >();
  if (authUsersRes.data?.users) {
    for (const u of authUsersRes.data.users) {
      authMap.set(u.id, {
        email: u.email ?? "",
        last_sign_in_at: u.last_sign_in_at ?? null,
      });
    }
  }

  const users: UserWithEmail[] = profilesRes.data.map((profile) => {
    const authInfo = authMap.get(profile.id);
    return {
      ...profile,
      email: authInfo?.email ?? "Sin correo",
      last_sign_in_at: authInfo?.last_sign_in_at ?? null,
    };
  });

  return {
    success: true,
    data: {
      users,
      currentUserId: auth.userId,
    },
  };
}

export async function createUser(input: {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<ActionResult<UserWithEmail>> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { full_name, email, password, role } = parsed.data;
  const admin = createAdminClient();

  const { data: createdAuth, error: createAuthError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
      },
    });

  if (createAuthError || !createdAuth.user) {
    const msg = createAuthError?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return {
        success: false,
        error: "Ya existe un usuario registrado con ese correo electrónico",
      };
    }
    return {
      success: false,
      error: createAuthError?.message ?? "Error al crear el usuario en Auth",
    };
  }

  const newUserId = createdAuth.user.id;
  const nowIso = new Date().toISOString();

  // Upsert profile in case trigger already inserted or to ensure exact values
  const { data: profile, error: profileError } = (await (
    admin.from("profiles") as any
  )
    .upsert({
      id: newUserId,
      full_name,
      role,
      is_active: true,
      updated_at: nowIso,
    })
    .select("*")
    .single()) as {
    data: Profile | null;
    error: { message: string } | null;
  };

  if (profileError || !profile) {
    return {
      success: false,
      error: "El usuario fue creado pero ocurrió un error al guardar su perfil",
    };
  }

  revalidatePath("/usuarios");
  revalidatePath("/analiticas");

  return {
    success: true,
    data: {
      ...profile,
      email: createdAuth.user.email ?? email,
      last_sign_in_at: null,
    },
  };
}

export async function updateUser(input: {
  id: string;
  full_name: string;
  email?: string;
  password?: string;
  role: UserRole;
  is_active: boolean;
}): Promise<ActionResult<UserWithEmail>> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, full_name, email, password, role, is_active } = parsed.data;

  // Prevent admin from locking themselves out
  if (id === auth.userId) {
    if (!is_active) {
      return {
        success: false,
        error: "No puedes desactivar tu propia cuenta de administrador",
      };
    }
    if (role !== "admin") {
      return {
        success: false,
        error: "No puedes quitarte el rol de administrador a ti mismo",
      };
    }
  }

  const admin = createAdminClient();

  // Update Auth user metadata, email, password, and ban status
  const authUpdatePayload: {
    email?: string;
    password?: string;
    email_confirm?: boolean;
    ban_duration?: string;
    user_metadata: { full_name: string; role: UserRole };
  } = {
    user_metadata: { full_name, role },
    ban_duration: is_active ? "none" : "876000h",
  };

  if (email) {
    authUpdatePayload.email = email;
    authUpdatePayload.email_confirm = true;
  }
  if (password) {
    authUpdatePayload.password = password;
  }

  const { data: updatedAuth, error: updateAuthError } =
    await admin.auth.admin.updateUserById(id, authUpdatePayload);

  if (updateAuthError) {
    const msg = updateAuthError.message.toLowerCase();
    if (msg.includes("already") || msg.includes("exists")) {
      return {
        success: false,
        error: "Ese correo electrónico ya está en uso por otro usuario",
      };
    }
    return {
      success: false,
      error: `Error al actualizar credenciales: ${updateAuthError.message}`,
    };
  }

  const { data: updatedProfile, error: profileError } = (await (
    admin.from("profiles") as any
  )
    .update({
      full_name,
      role,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()) as {
    data: Profile | null;
    error: { message: string } | null;
  };

  if (profileError || !updatedProfile) {
    return {
      success: false,
      error: "Error al actualizar el perfil del usuario",
    };
  }

  revalidatePath("/usuarios");
  revalidatePath("/analiticas");
  revalidatePath("/");

  return {
    success: true,
    data: {
      ...updatedProfile,
      email: updatedAuth.user?.email ?? email ?? "",
      last_sign_in_at: updatedAuth.user?.last_sign_in_at ?? null,
    },
  };
}

