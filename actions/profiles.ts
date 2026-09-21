"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { profiles, profileRoleEnum } from "@/db/schema"
import { requireAdmin, requireProfile } from "@/lib/current-user"
import { createAdminClient } from "@/lib/supabase/admin"

const teamMemberSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido."),
  password: z
    .string()
    .min(6, "A senha precisa ter pelo menos 6 caracteres."),
  role: z.enum(profileRoleEnum.enumValues),
})

export type TeamMemberActionState = { error?: string } | null

// Cadastro deixou de ser uma rota pública (era /register, acessível a
// qualquer um a partir da tela de login) — agora só um admin logado cria
// acesso pra um novo membro, direto em Configurações > Equipe.
export async function createTeamMember(
  _prevState: TeamMemberActionState,
  formData: FormData
): Promise<TeamMemberActionState> {
  await requireAdmin()

  let data: z.infer<typeof teamMemberSchema>
  try {
    data = teamMemberSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Dados inválidos." }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro de configuração." }
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { name: data.name },
  })

  if (error || !created.user) {
    return { error: error?.message ?? "Erro ao criar usuário." }
  }

  // O trigger core.handle_new_user() já cria a linha em profiles (como
  // "operador") a partir do INSERT em auth.users — só ajustamos se o admin
  // escolheu "admin" para o novo membro.
  if (data.role === "admin") {
    await db
      .update(profiles)
      .set({ role: "admin" })
      .where(eq(profiles.id, created.user.id))
  }

  revalidatePath("/settings")
  return null
}

export async function updateProfileRole(
  profileId: string,
  role: (typeof profileRoleEnum.enumValues)[number]
) {
  const admin = await requireAdmin()
  if (profileId === admin.id && role !== "admin") {
    throw new Error("Você não pode remover seu próprio acesso de administrador.")
  }
  await db.update(profiles).set({ role }).where(eq(profiles.id, profileId))
  revalidatePath("/settings")
}

export async function updateOwnProfile(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const profile = await requireProfile()
  const name = String(formData.get("name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  if (!name) return { error: "Informe o nome." }
  await db.update(profiles).set({ name, phone }).where(eq(profiles.id, profile.id))
  revalidatePath("/settings")
  return null
}
