"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { consumables } from "@/db/schema"
import { requireProfile } from "@/lib/current-user"

const consumableSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  category: z.string().trim().optional().nullable(),
  unitPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0),
  unit: z.string().trim().min(1).default("un"),
  description: z.string().trim().optional().nullable(),
})

export type ConsumableActionState = { error?: string } | null

function parseConsumableForm(formData: FormData) {
  return consumableSchema.parse({
    name: formData.get("name"),
    category: formData.get("category") || null,
    unitPrice: formData.get("unitPrice"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit") || "un",
    description: formData.get("description") || null,
  })
}

export async function createConsumable(
  _prevState: ConsumableActionState,
  formData: FormData
): Promise<ConsumableActionState> {
  await requireProfile()
  try {
    const data = parseConsumableForm(formData)
    await db.insert(consumables).values(data)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/consumables")
  return null
}

export async function updateConsumable(
  id: string,
  _prevState: ConsumableActionState,
  formData: FormData
): Promise<ConsumableActionState> {
  await requireProfile()
  try {
    const data = parseConsumableForm(formData)
    await db
      .update(consumables)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(consumables.id, id))
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/consumables")
  return null
}

export async function deleteConsumable(id: string) {
  await requireProfile()
  await db.delete(consumables).where(eq(consumables.id, id))
  revalidatePath("/consumables")
}
