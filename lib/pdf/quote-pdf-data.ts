import "server-only"

import { eq } from "drizzle-orm"
import { db } from "@/db"
import {
  quotes,
  quoteFilamentItems,
  quoteConsumableItems,
  clients,
  printers,
  filaments,
  consumables,
  profiles,
  settings,
} from "@/db/schema"
import { computeQuoteCost, type QuoteCostBreakdown } from "@/lib/quote-costs"
import { quoteStatusLabels } from "@/lib/validation/quote"

export type QuotePdfData = {
  quote: typeof quotes.$inferSelect
  client: typeof clients.$inferSelect | null
  printer: typeof printers.$inferSelect
  assignedUser: typeof profiles.$inferSelect | null
  filamentLines: { name: string; weightG: number }[]
  consumableLines: { name: string; quantity: number }[]
  cost: QuoteCostBreakdown
  statusLabel: string
  currency: string
}

export async function loadQuotePdfData(quoteId: string): Promise<QuotePdfData | null> {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1)
  if (!quote) return null

  const [printer] = await db
    .select()
    .from(printers)
    .where(eq(printers.id, quote.printerId))
    .limit(1)
  if (!printer) return null

  const [[settingsRow], client, assignedUserRows, filamentItemRows, consumableItemRows] =
    await Promise.all([
      db.select().from(settings).limit(1),
      quote.clientId
        ? db.select().from(clients).where(eq(clients.id, quote.clientId)).limit(1)
        : Promise.resolve([]),
      quote.assignedUserId
        ? db.select().from(profiles).where(eq(profiles.id, quote.assignedUserId)).limit(1)
        : Promise.resolve([]),
      db.select().from(quoteFilamentItems).where(eq(quoteFilamentItems.quoteId, quoteId)),
      db.select().from(quoteConsumableItems).where(eq(quoteConsumableItems.quoteId, quoteId)),
    ])

  const filamentIds = filamentItemRows.map((i) => i.filamentId)
  const consumableIds = consumableItemRows.map((i) => i.consumableId)

  const [filamentRows, consumableRows] = await Promise.all([
    filamentIds.length
      ? db.select().from(filaments)
      : Promise.resolve([] as (typeof filaments.$inferSelect)[]),
    consumableIds.length
      ? db.select().from(consumables)
      : Promise.resolve([] as (typeof consumables.$inferSelect)[]),
  ])

  const filamentById = new Map(filamentRows.map((f) => [f.id, f]))
  const consumableById = new Map(consumableRows.map((c) => [c.id, c]))

  const settingsRow_ = settingsRow ?? {
    energyCostPerKwh: 0.9,
    laborCostPerHour: 30,
    failureRatePercent: 15,
    currency: "R$",
  }

  const cost = computeQuoteCost(
    quote,
    { energyKwh: printer.energyKwh, depreciationRate: printer.depreciationRate ?? 0 },
    settingsRow_,
    filamentItemRows.map((i) => ({
      weightG: i.weightG,
      pricePerKg: filamentById.get(i.filamentId)?.pricePerKg ?? 0,
    })),
    consumableItemRows.map((i) => ({
      quantity: i.quantity,
      unitPrice: consumableById.get(i.consumableId)?.unitPrice ?? 0,
    }))
  )

  return {
    quote,
    client: client[0] ?? null,
    printer,
    assignedUser: assignedUserRows[0] ?? null,
    filamentLines: filamentItemRows.map((i) => ({
      name: filamentById.get(i.filamentId)?.name ?? "Filamento",
      weightG: i.weightG,
    })),
    consumableLines: consumableItemRows.map((i) => ({
      name: consumableById.get(i.consumableId)?.name ?? "Consumível",
      quantity: i.quantity,
    })),
    cost,
    statusLabel: quoteStatusLabels[quote.status],
    currency: settingsRow_.currency,
  }
}
