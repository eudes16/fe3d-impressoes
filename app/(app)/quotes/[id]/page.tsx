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
import { Alert, Badge, Stack } from "@chakra-ui/react"
import { PageHeader } from "@/components/chakra/page-header"
import { QuoteForm } from "@/components/quotes/quote-form"
import { QuoteActions } from "@/components/quotes/quote-actions"
import { quoteStatusLabels, quoteStatusPalette } from "@/lib/validation/quote"
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
    <Stack gap="4">
      <PageHeader
        title={quote.description}
        badge={
          <Badge colorPalette={quoteStatusPalette[quote.status]} variant="subtle">
            {quoteStatusLabels[quote.status]}
          </Badge>
        }
      >
        <QuoteActions quoteId={quote.id} status={quote.status} />
      </PageHeader>

      {quote.status === "rejected" ? (
        <Alert.Root status="error" rounded="l3">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Orçamento rejeitado</Alert.Title>
            <Alert.Description>
              {quote.rejectionReason || "Motivo não informado."}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}

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
    </Stack>
  )
}
