"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { profiles, profileRoleEnum } from "@/db/schema"
import { requireAdmin, requireProfile } from "@/lib/current-user"

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
