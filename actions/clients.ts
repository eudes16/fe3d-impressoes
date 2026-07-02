"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { clients } from "@/db/schema"
import { requireProfile } from "@/lib/current-user"

const clientSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email().optional().or(z.literal("")).nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

export type ClientActionState = { error?: string } | null

function parseClientForm(formData: FormData) {
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    address: formData.get("address") || null,
    notes: formData.get("notes") || null,
  })
  return { ...parsed, email: parsed.email || null }
}

// Nomeado createClientRecord (não createClient) para não colidir com o
// helper lib/supabase/server.ts createClient().
export async function createClientRecord(
  _prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const profile = await requireProfile()
  try {
    const data = parseClientForm(formData)
    await db.insert(clients).values({ ...data, createdBy: profile.id })
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/clients")
  return null
}

export async function updateClient(
  id: string,
  _prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  await requireProfile()
  try {
    const data = parseClientForm(formData)
    await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, id))
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/clients")
  return null
}

export async function deleteClient(id: string) {
  await requireProfile()
  await db.delete(clients).where(eq(clients.id, id))
  revalidatePath("/clients")
}
