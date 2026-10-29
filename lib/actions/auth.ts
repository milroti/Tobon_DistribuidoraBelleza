"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.error("[auth] login error:", error.message, error.status, error);

    // Distinguish between credential errors and server errors
    if (error.status === 400) {
      return { error: "Credenciales incorrectas. Intenta de nuevo." };
    }
    return {
      error:
        process.env.NODE_ENV === "development"
          ? `Error del servidor (${error.status}): ${error.message}`
          : "Error del servidor. Intenta más tarde.",
    };
  }

  redirect("/pos");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
