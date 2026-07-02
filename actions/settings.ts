"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { settings } from "@/db/schema"
import { requireProfile } from "@/lib/current-user"

const settingsSchema = z.object({
  energyCostPerKwh: z.coerce.number().min(0),
  laborCostPerHour: z.coerce.number().min(0),
  failureRatePercent: z.coerce.number().min(0),
  currency: z.string().trim().min(1),
})

export type SettingsActionState = { error?: string } | null

export async function updateSettings(
  id: string,
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireProfile()
  try {
    const data = settingsSchema.parse({
      energyCostPerKwh: formData.get("energyCostPerKwh"),
      laborCostPerHour: formData.get("laborCostPerHour"),
      failureRatePercent: formData.get("failureRatePercent"),
      currency: formData.get("currency"),
    })
    await db
      .update(settings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(settings.id, id))
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/settings")
  return null
}
