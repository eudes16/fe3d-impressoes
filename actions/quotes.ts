"use server"

import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import {
  quotes,
  quoteFilamentItems,
  quoteConsumableItems,
  quotePlateItems,
  stockMovements,
  filaments,
  consumables,
} from "@/db/schema"
import { requireProfile } from "@/lib/current-user"
import { quoteFormSchema, type QuoteFormValues } from "@/lib/validation/quote"

export type QuoteActionResult = { error?: string; id?: string }

function quoteColumns(data: QuoteFormValues) {
  return {
    clientId: data.clientId || null,
    printerId: data.printerId,
    assignedUserId: data.assignedUserId || null,
    description: data.description,
    status: data.status,
    printTimeH: data.printTimeH,
    prepTimeMin: data.prepTimeMin,
    slicingTimeMin: data.slicingTimeMin,
    materialChangeMin: data.materialChangeMin,
    transferStartMin: data.transferStartMin,
    removalMin: data.removalMin,
    supportRemovalMin: data.supportRemovalMin,
    additionalWorkMin: data.additionalWorkMin,
    consumablesMiscCost: data.consumablesMiscCost,
    markupPercent: data.markupPercent,
    realPrice: data.realPrice,
    quantity: data.quantity,
    thumbnailUrl: data.thumbnailUrl || null,
    modelName: data.modelName || null,
    source3mfFilename: data.source3mfFilename || null,
  }
}

export async function saveQuote(
  quoteId: string | null,
  values: QuoteFormValues
): Promise<QuoteActionResult> {
  const profile = await requireProfile()

  const parsed = quoteFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  const data = parsed.data

  const id = await db.transaction(async (tx) => {
    let currentId = quoteId

    if (currentId) {
      await tx
        .update(quotes)
        .set({ ...quoteColumns(data), updatedAt: new Date() })
        .where(eq(quotes.id, currentId))

      await tx
        .delete(quoteFilamentItems)
        .where(eq(quoteFilamentItems.quoteId, currentId))
      await tx
        .delete(quoteConsumableItems)
        .where(eq(quoteConsumableItems.quoteId, currentId))
      await tx
        .delete(quotePlateItems)
        .where(eq(quotePlateItems.quoteId, currentId))
    } else {
      const [inserted] = await tx
        .insert(quotes)
        .values({ ...quoteColumns(data), createdBy: profile.id })
        .returning({ id: quotes.id })
      currentId = inserted.id
    }

    if (data.filamentItems.length > 0) {
      await tx.insert(quoteFilamentItems).values(
        data.filamentItems.map((item) => ({ ...item, quoteId: currentId! }))
      )
    }
    if (data.consumableItems.length > 0) {
      await tx.insert(quoteConsumableItems).values(
        data.consumableItems.map((item) => ({ ...item, quoteId: currentId! }))
      )
    }
    if (data.plateItems.length > 0) {
      await tx.insert(quotePlateItems).values(
        data.plateItems.map((item) => ({ ...item, quoteId: currentId! }))
      )
    }

    return currentId!
  })

  revalidatePath("/quotes")
  revalidatePath(`/quotes/${id}`)
  return { id }
}

export async function deleteQuote(id: string) {
  await requireProfile()
  await db.delete(quotes).where(eq(quotes.id, id))
  revalidatePath("/quotes")
}

// Baixa o estoque de filamento/consumível usado no orçamento e marca como
// "em produção". Não bloqueia em caso de saldo insuficiente — apenas avisa,
// já que a baixa em si (e o registro no ledger) deve acontecer de qualquer
// forma para refletir o que foi de fato consumido.
export async function confirmProduction(
  quoteId: string
): Promise<{ warnings: string[] }> {
  const profile = await requireProfile()

  return db.transaction(async (tx) => {
    const [quote] = await tx
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)
    if (!quote) throw new Error("Orçamento não encontrado.")
    if (quote.status === "in_production" || quote.status === "completed") {
      throw new Error("O estoque deste orçamento já foi baixado.")
    }

    const [filamentItems, consumableItems] = await Promise.all([
      tx
        .select()
        .from(quoteFilamentItems)
        .where(eq(quoteFilamentItems.quoteId, quoteId)),
      tx
        .select()
        .from(quoteConsumableItems)
        .where(eq(quoteConsumableItems.quoteId, quoteId)),
    ])

    const warnings: string[] = []

    for (const item of filamentItems) {
      const totalG = item.weightG * quote.quantity
      const [filament] = await tx
        .select()
        .from(filaments)
        .where(eq(filaments.id, item.filamentId))
        .limit(1)
      if (filament && filament.remainingWeightG - totalG < 0) {
        warnings.push(
          `Estoque insuficiente de "${filament.name}" (faltam ${(
            totalG - filament.remainingWeightG
          ).toFixed(0)}g).`
        )
      }
      await tx
        .update(filaments)
        .set({ remainingWeightG: sql`${filaments.remainingWeightG} - ${totalG}` })
        .where(eq(filaments.id, item.filamentId))
      await tx.insert(stockMovements).values({
        itemType: "filament",
        filamentId: item.filamentId,
        quoteId,
        deltaQty: -totalG,
        reason: "quote_production",
        createdBy: profile.id,
      })
    }

    for (const item of consumableItems) {
      const totalQty = item.quantity * quote.quantity
      const [consumable] = await tx
        .select()
        .from(consumables)
        .where(eq(consumables.id, item.consumableId))
        .limit(1)
      if (consumable && consumable.quantity - totalQty < 0) {
        warnings.push(
          `Estoque insuficiente de "${consumable.name}" (faltam ${(
            totalQty - consumable.quantity
          ).toFixed(0)}).`
        )
      }
      await tx
        .update(consumables)
        .set({ quantity: sql`${consumables.quantity} - ${totalQty}` })
        .where(eq(consumables.id, item.consumableId))
      await tx.insert(stockMovements).values({
        itemType: "consumable",
        consumableId: item.consumableId,
        quoteId,
        deltaQty: -totalQty,
        reason: "quote_production",
        createdBy: profile.id,
      })
    }

    await tx
      .update(quotes)
      .set({ status: "in_production", updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    revalidatePath("/quotes")
    revalidatePath(`/quotes/${quoteId}`)
    revalidatePath("/filaments")
    revalidatePath("/consumables")

    return { warnings }
  })
}
