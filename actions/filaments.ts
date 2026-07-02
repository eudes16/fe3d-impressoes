"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { filaments } from "@/db/schema"
import { requireProfile } from "@/lib/current-user"

const filamentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  vendor: z.string().trim().optional().nullable(),
  materialType: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  colors: z.array(z.string().trim().min(1)).default([]),
  diameterMm: z.coerce.number().positive(),
  price: z.coerce.number().min(0),
  weightKg: z.coerce.number().positive(),
  density: z.coerce.number().positive(),
  nozzleTemp: z.coerce.number().positive(),
  bedTemp: z.coerce.number().min(0),
  lengthM: z.coerce.number().positive(),
  remainingWeightG: z.coerce.number().min(0),
})

export type FilamentActionState = { error?: string } | null

function parseFilamentForm(formData: FormData) {
  const colorsRaw = String(formData.get("colors") ?? "")
  const colors = colorsRaw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)

  return filamentSchema.parse({
    name: formData.get("name"),
    vendor: formData.get("vendor") || null,
    materialType: formData.get("materialType") || null,
    category: formData.get("category") || null,
    colors,
    diameterMm: formData.get("diameterMm"),
    price: formData.get("price"),
    weightKg: formData.get("weightKg"),
    density: formData.get("density"),
    nozzleTemp: formData.get("nozzleTemp"),
    bedTemp: formData.get("bedTemp"),
    lengthM: formData.get("lengthM"),
    remainingWeightG: formData.get("remainingWeightG"),
  })
}

export async function createFilament(
  _prevState: FilamentActionState,
  formData: FormData
): Promise<FilamentActionState> {
  await requireProfile()
  try {
    const data = parseFilamentForm(formData)
    await db.insert(filaments).values(data)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/filaments")
  return null
}

export async function updateFilament(
  id: string,
  _prevState: FilamentActionState,
  formData: FormData
): Promise<FilamentActionState> {
  await requireProfile()
  try {
    const data = parseFilamentForm(formData)
    await db
      .update(filaments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(filaments.id, id))
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/filaments")
  return null
}

export async function deleteFilament(id: string) {
  await requireProfile()
  await db.delete(filaments).where(eq(filaments.id, id))
  revalidatePath("/filaments")
}
