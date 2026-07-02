import "server-only"

import { eq } from "drizzle-orm"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"

// O proxy (middleware) já bloqueia acesso não autenticado às rotas do app,
// mas Server Actions podem ser chamadas diretamente — checamos de novo aqui.
export async function requireProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Não autenticado.")

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!profile) throw new Error("Perfil não encontrado.")

  return profile
}

export async function requireAdmin() {
  const profile = await requireProfile()
  if (profile.role !== "admin") {
    throw new Error("Apenas administradores podem executar esta ação.")
  }
  return profile
}
