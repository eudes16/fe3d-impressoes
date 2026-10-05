import { z } from "zod"

export const quoteStatusValues = [
  "draft",
  "sent",
  "approved",
  "in_production",
  "completed",
  "rejected",
] as const

// Números não usam z.coerce: os inputs do formulário já convertem para
// number via `valueAsNumber`/round2, então o tipo de entrada e saída do
// resolver ficam idênticos (evita o atrito de tipos coerce+react-hook-form).
export const quoteFilamentItemSchema = z.object({
  filamentId: z.string().uuid("Selecione um filamento."),
  weightG: z.number().min(0.01, "Informe o peso."),
})

export const quoteConsumableItemSchema = z.object({
  consumableId: z.string().uuid("Selecione um consumível."),
  quantity: z.number().min(0.01, "Informe a quantidade."),
})

export const quotePlateItemSchema = z.object({
  label: z.string().trim().min(1, "Informe um nome para o prato."),
  printTimeH: z.number().min(0),
  weightG: z.number().min(0),
})

export const quoteFormSchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  printerId: z.string().uuid("Selecione uma impressora."),
  assignedUserId: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, "Informe a descrição."),

  printTimeH: z.number().min(0),
  prepTimeMin: z.number().min(0),
  slicingTimeMin: z.number().min(0),
  materialChangeMin: z.number().min(0),
  transferStartMin: z.number().min(0),
  removalMin: z.number().min(0),
  supportRemovalMin: z.number().min(0),
  additionalWorkMin: z.number().min(0),

  consumablesMiscCost: z.number().min(0),
  markupPercent: z.number().min(0),
  realPrice: z.number().min(0),
  quantity: z.number().int().min(1),

  thumbnailUrl: z.string().nullable().optional(),
  modelName: z.string().nullable().optional(),
  source3mfFilename: z.string().nullable().optional(),

  filamentItems: z
    .array(quoteFilamentItemSchema)
    .min(1, "Adicione ao menos um filamento."),
  consumableItems: z.array(quoteConsumableItemSchema),
  plateItems: z.array(quotePlateItemSchema),
})

export type QuoteFormValues = z.infer<typeof quoteFormSchema>

export const quoteStatusLabels: Record<(typeof quoteStatusValues)[number], string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  in_production: "Em produção",
  completed: "Concluído",
  rejected: "Rejeitado",
}

// colorPalette do Chakra usado no Badge de cada status.
export const quoteStatusPalette: Record<(typeof quoteStatusValues)[number], string> = {
  draft: "gray",
  sent: "gray",
  approved: "brand",
  in_production: "brand",
  completed: "green",
  rejected: "red",
}
