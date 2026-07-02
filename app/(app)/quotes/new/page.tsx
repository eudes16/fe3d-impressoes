import { asc } from "drizzle-orm"
import { db } from "@/db"
import { clients, printers, filaments, consumables, profiles, settings } from "@/db/schema"
import { QuoteForm } from "@/components/quotes/quote-form"
import type { QuoteFormValues } from "@/lib/validation/quote"

export default async function NewQuotePage() {
  const [clientRows, printerRows, filamentRows, consumableRows, teamRows, settingsRows] =
    await Promise.all([
      db.select().from(clients).orderBy(asc(clients.name)),
      db.select().from(printers).orderBy(asc(printers.name)),
      db.select().from(filaments).orderBy(asc(filaments.name)),
      db.select().from(consumables).orderBy(asc(consumables.name)),
      db.select().from(profiles).orderBy(asc(profiles.name)),
      db.select().from(settings).limit(1),
    ])

  const defaultValues: QuoteFormValues = {
    clientId: null,
    printerId: "",
    assignedUserId: null,
    description: "",
    status: "draft",
    printTimeH: 0,
    prepTimeMin: 0,
    slicingTimeMin: 0,
    materialChangeMin: 0,
    transferStartMin: 0,
    removalMin: 0,
    supportRemovalMin: 0,
    additionalWorkMin: 0,
    consumablesMiscCost: 0,
    markupPercent: 100,
    realPrice: 0,
    quantity: 1,
    thumbnailUrl: null,
    modelName: null,
    source3mfFilename: null,
    filamentItems: [],
    consumableItems: [],
    plateItems: [],
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Novo orçamento</h1>
      <QuoteForm
        defaultValues={defaultValues}
        clients={clientRows}
        printerOptions={printerRows}
        filamentOptions={filamentRows}
        consumableOptions={consumableRows}
        teamOptions={teamRows}
        settingsRow={settingsRows[0] ?? (await ensureSettings())}
      />
    </div>
  )
}

async function ensureSettings() {
  const [row] = await db.insert(settings).values({}).returning()
  return row
}
