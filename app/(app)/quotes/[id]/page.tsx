import { asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "@/db"
import {
  clients,
  printers,
  filaments,
  consumables,
  profiles,
  settings,
  quotes,
  quoteFilamentItems,
  quoteConsumableItems,
  quotePlateItems,
} from "@/db/schema"
import { QuoteForm } from "@/components/quotes/quote-form"
import { QuoteActions } from "@/components/quotes/quote-actions"
import { quoteStatusLabels } from "@/lib/validation/quote"
import type { QuoteFormValues } from "@/lib/validation/quote"

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [
    [quote],
    filamentItemRows,
    consumableItemRows,
    plateItemRows,
    clientRows,
    printerRows,
    filamentRows,
    consumableRows,
    teamRows,
    settingsRows,
  ] = await Promise.all([
    db.select().from(quotes).where(eq(quotes.id, id)).limit(1),
    db
      .select()
      .from(quoteFilamentItems)
      .where(eq(quoteFilamentItems.quoteId, id)),
    db
      .select()
      .from(quoteConsumableItems)
      .where(eq(quoteConsumableItems.quoteId, id)),
    db.select().from(quotePlateItems).where(eq(quotePlateItems.quoteId, id)),
    db.select().from(clients).orderBy(asc(clients.name)),
    db.select().from(printers).orderBy(asc(printers.name)),
    db.select().from(filaments).orderBy(asc(filaments.name)),
    db.select().from(consumables).orderBy(asc(consumables.name)),
    db.select().from(profiles).orderBy(asc(profiles.name)),
    db.select().from(settings).limit(1),
  ])

  if (!quote) notFound()

  const defaultValues: QuoteFormValues = {
    clientId: quote.clientId,
    printerId: quote.printerId,
    assignedUserId: quote.assignedUserId,
    description: quote.description,
    status: quote.status,
    printTimeH: quote.printTimeH,
    prepTimeMin: quote.prepTimeMin,
    slicingTimeMin: quote.slicingTimeMin,
    materialChangeMin: quote.materialChangeMin,
    transferStartMin: quote.transferStartMin,
    removalMin: quote.removalMin,
    supportRemovalMin: quote.supportRemovalMin,
    additionalWorkMin: quote.additionalWorkMin,
    consumablesMiscCost: quote.consumablesMiscCost,
    markupPercent: quote.markupPercent,
    realPrice: quote.realPrice,
    quantity: quote.quantity,
    thumbnailUrl: quote.thumbnailUrl,
    modelName: quote.modelName,
    source3mfFilename: quote.source3mfFilename,
    filamentItems: filamentItemRows.map((i) => ({
      filamentId: i.filamentId,
      weightG: i.weightG,
    })),
    consumableItems: consumableItemRows.map((i) => ({
      consumableId: i.consumableId,
      quantity: i.quantity,
    })),
    plateItems: plateItemRows.map((i) => ({
      label: i.label,
      printTimeH: i.printTimeH,
      weightG: i.weightG,
    })),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{quote.description}</h1>
          <p className="text-muted-foreground">
            {quoteStatusLabels[quote.status]}
          </p>
        </div>
        <QuoteActions quoteId={quote.id} status={quote.status} />
      </div>

      <QuoteForm
        quoteId={quote.id}
        defaultValues={defaultValues}
        clients={clientRows}
        printerOptions={printerRows}
        filamentOptions={filamentRows}
        consumableOptions={consumableRows}
        teamOptions={teamRows}
        settingsRow={
          settingsRows[0] ?? {
            id: "",
            energyCostPerKwh: 0.9,
            laborCostPerHour: 30,
            failureRatePercent: 15,
            currency: "R$",
            updatedAt: new Date(),
          }
        }
      />
    </div>
  )
}
