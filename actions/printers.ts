"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { printers } from "@/db/schema"
import { requireProfile } from "@/lib/current-user"

const printerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  diameterMm: z.coerce.number().positive(),
  price: z.coerce.number().min(0),
  depreciationHours: z.coerce.number().positive(),
  serviceCost: z.coerce.number().min(0),
  energyKwh: z.coerce.number().min(0),
})

export type PrinterActionState = { error?: string } | null

function parsePrinterForm(formData: FormData) {
  return printerSchema.parse({
    name: formData.get("name"),
    diameterMm: formData.get("diameterMm"),
    price: formData.get("price"),
    depreciationHours: formData.get("depreciationHours"),
    serviceCost: formData.get("serviceCost"),
    energyKwh: formData.get("energyKwh"),
  })
}

export async function createPrinter(
  _prevState: PrinterActionState,
  formData: FormData
): Promise<PrinterActionState> {
  await requireProfile()
  try {
    const data = parsePrinterForm(formData)
    await db.insert(printers).values(data)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/printers")
  return null
}

export async function updatePrinter(
  id: string,
  _prevState: PrinterActionState,
  formData: FormData
): Promise<PrinterActionState> {
  await requireProfile()
  try {
    const data = parsePrinterForm(formData)
    await db
      .update(printers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(printers.id, id))
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
  revalidatePath("/printers")
  return null
}

export async function deletePrinter(id: string) {
  await requireProfile()
  await db.delete(printers).where(eq(printers.id, id))
  revalidatePath("/printers")
}
