"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Upload } from "lucide-react"
import { toast } from "@/components/chakra/toaster"
import Image from "next/image"

import { saveQuote } from "@/actions/quotes"
import { parseGcode3mf, matchFilament } from "@/lib/parser3mf"
import { parseGcode } from "@/lib/parserGcode"
import { filamentSelectItem, consumableLabel } from "@/lib/filament-label"
import {
  quoteFormSchema,
  type QuoteFormValues,
} from "@/lib/validation/quote"
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  IconButton,
  Input,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
} from "@chakra-ui/react"
import { FormField } from "@/components/chakra/entity-form-dialog"
import { SimpleSelect } from "@/components/chakra/simple-select"
import { QuoteCostPreview } from "@/components/quotes/quote-cost-preview"
import {
  Import3mfDialog,
  type PendingImport,
} from "@/components/quotes/import-3mf-dialog"
import type { printers, filaments, consumables, settings } from "@/db/schema"

type PrinterOption = typeof printers.$inferSelect
type FilamentOption = typeof filaments.$inferSelect
type ConsumableOption = typeof consumables.$inferSelect
type SettingsRow = typeof settings.$inferSelect
type SimpleOption = { id: string; name: string }

const NONE = "__none__"
const round2 = (n: number) => Math.round(n * 100) / 100

function matchPrinter(printerModel: string, options: PrinterOption[]) {
  const modelLower = printerModel.toLowerCase()
  let best: PrinterOption | null = null
  for (const p of options) {
    const nameLower = p.name.toLowerCase()
    if (nameLower.includes(modelLower) || modelLower.includes(nameLower)) {
      if (!best || p.name.length > best.name.length) best = p
    }
  }
  return best
}

function SectionHeader({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <Card.Header>
      <Flex align="center" justify="space-between" gap="4">
        <Heading as="h3" textStyle="md" fontWeight="bold">
          {title}
        </Heading>
        {children}
      </Flex>
    </Card.Header>
  )
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="outline" onClick={onClick}>
      <Plus />
      Adicionar
    </Button>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      type="button"
      variant="ghost"
      size="sm"
      colorPalette="red"
      aria-label="Remover"
      onClick={onClick}
    >
      <Trash2 />
    </IconButton>
  )
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <Text textStyle="sm" color="fg.muted">
      {children}
    </Text>
  )
}

export function QuoteForm({
  quoteId,
  defaultValues,
  clients,
  printerOptions,
  filamentOptions,
  consumableOptions,
  teamOptions,
  settingsRow,
}: {
  quoteId?: string
  defaultValues: QuoteFormValues
  clients: SimpleOption[]
  printerOptions: PrinterOption[]
  filamentOptions: FilamentOption[]
  consumableOptions: ConsumableOption[]
  teamOptions: SimpleOption[]
  settingsRow: SettingsRow
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues,
  })

  const filamentFields = useFieldArray({ control: form.control, name: "filamentItems" })
  const consumableFields = useFieldArray({ control: form.control, name: "consumableItems" })
  const plateFields = useFieldArray({ control: form.control, name: "plateItems" })

  const values = useWatch({ control: form.control })
  const selectedPrinter =
    printerOptions.find((p) => p.id === values.printerId) ?? null
  const filamentById = new Map(filamentOptions.map((f) => [f.id, f]))
  const consumableById = new Map(consumableOptions.map((c) => [c.id, c]))

  // O perfil de filamento no fatiador é por marca+tipo, não por cor — então
  // o matching automático (UUID exato > cor+tipo > tipo) só serve de
  // sugestão inicial. O usuário sempre confirma/troca o vínculo de cada
  // filamento detectado no Import3mfDialog antes de qualquer coisa ser
  // aplicada ao formulário.
  async function handleImportFile(file: File) {
    const buffer = await file.arrayBuffer()
    const isGcode = file.name.toLowerCase().endsWith(".gcode")
    const data = isGcode ? parseGcode(buffer, file.name) : await parseGcode3mf(buffer)
    if (!data) {
      toast.error("Arquivo inválido ou sem metadados de fatiamento.")
      return
    }
    const matchable = filamentOptions.map((f) => ({
      id: f.id,
      name: f.name,
      colors: f.colors,
    }))
    const mapping = data.filaments.map((sf) => matchFilament(sf, matchable)?.id ?? null)
    setPendingImport({
      data,
      filename: file.name,
      mapping,
      buffer,
      source: isGcode ? "gcode" : "3mf",
    })
  }

  function updateImportMapping(index: number, filamentId: string | null) {
    setPendingImport((prev) => {
      if (!prev) return prev
      const mapping = [...prev.mapping]
      mapping[index] = filamentId
      return { ...prev, mapping }
    })
  }

  function confirmImport() {
    if (!pendingImport) return
    const { data, filename, mapping } = pendingImport

    const currentH = form.getValues("printTimeH") || 0
    form.setValue("printTimeH", round2(currentH + data.printTimeH))

    if (!form.getValues("description") && data.modelName) {
      form.setValue("description", data.modelName)
    }

    if (!form.getValues("printerId")) {
      const matched = matchPrinter(data.printerModel, printerOptions)
      if (matched) form.setValue("printerId", matched.id)
    }

    const working = [...form.getValues("filamentItems")]
    let linked = 0
    data.filaments.forEach((sf, i) => {
      const filamentId = mapping[i]
      if (!filamentId) return
      linked++
      const idx = working.findIndex((item) => item.filamentId === filamentId)
      if (idx >= 0) {
        working[idx] = { ...working[idx], weightG: round2(working[idx].weightG + sf.weightG) }
      } else {
        working.push({ filamentId, weightG: round2(sf.weightG) })
      }
    })
    filamentFields.replace(working)

    const plateLabel = data.modelName || `Plate ${plateFields.fields.length + 1}`
    const plateWeight =
      data.totalWeightG > 0
        ? data.totalWeightG
        : data.filaments.reduce((s, f) => s + f.weightG, 0)
    plateFields.append({
      label: plateLabel,
      printTimeH: round2(data.printTimeH),
      weightG: round2(plateWeight),
    })

    if (!form.getValues("thumbnailUrl") && data.thumbnailBase64) {
      form.setValue("thumbnailUrl", `data:image/png;base64,${data.thumbnailBase64}`)
    }
    if (!form.getValues("modelName") && data.modelName) {
      form.setValue("modelName", data.modelName)
    }
    form.setValue("source3mfFilename", filename)

    const totalSec = Math.round(data.printTimeH * 3600)
    const hh = Math.floor(totalSec / 3600)
    const mm = Math.floor((totalSec % 3600) / 60)
    const unmatched = data.filaments.length - linked
    let msg = `Prato "${plateLabel}" adicionado: ${hh}h${String(mm).padStart(2, "0")}min · ${linked} filamento(s) vinculado(s)`
    if (unmatched > 0) msg += ` · ${unmatched} não vinculado(s)`
    toast.info(msg)

    setPendingImport(null)
  }

  function onSubmit(data: QuoteFormValues) {
    startTransition(async () => {
      const result = await saveQuote(quoteId ?? null, data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Orçamento salvo.")
      router.push(`/quotes/${result.id}`)
      router.refresh()
    })
  }

  const thumbnailUrl = values.thumbnailUrl
  const errors = form.formState.errors

  const printerItems = useMemo(
    () => printerOptions.map((p) => ({ value: p.id, label: p.name })),
    [printerOptions]
  )
  const clientItems = useMemo(
    () => [
      { value: NONE, label: "Nenhum" },
      ...clients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clients]
  )
  const teamItems = useMemo(
    () => [
      { value: NONE, label: "Nenhum" },
      ...teamOptions.map((t) => ({ value: t.id, label: t.name })),
    ],
    [teamOptions]
  )
  const filamentItems = useMemo(
    () => filamentOptions.map(filamentSelectItem),
    [filamentOptions]
  )
  const consumableItems = useMemo(
    () => consumableOptions.map((c) => ({ value: c.id, label: consumableLabel(c) })),
    [consumableOptions]
  )

  return (
    <>
      <Grid
        as="form"
        onSubmit={form.handleSubmit(onSubmit)}
        gap="6"
        templateColumns={{ base: "1fr", lg: "1fr 320px" }}
        alignItems="start"
      >
        <Stack gap="6">
          <Card.Root>
            <SectionHeader title="Detalhes">
              <input
                ref={fileInputRef}
                type="file"
                accept=".3mf,.gcode"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleImportFile(file)
                  e.target.value = ""
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload />
                Importar .3mf / .gcode
              </Button>
            </SectionHeader>
            <Card.Body gap="4">
              {thumbnailUrl ? (
                <Box
                  alignSelf="start"
                  rounded="l2"
                  borderWidth="1px"
                  overflow="hidden"
                >
                  <Image
                    src={thumbnailUrl}
                    alt="Prévia do modelo"
                    width={120}
                    height={120}
                    unoptimized
                    style={{ objectFit: "cover" }}
                  />
                </Box>
              ) : null}

              <FormField label="Descrição" errorText={errors.description?.message}>
                <Textarea
                  {...form.register("description")}
                  placeholder="Ex.: Porta joias Olivia"
                />
              </FormField>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
                <FormField label="Impressora" errorText={errors.printerId?.message}>
                  <Controller
                    control={form.control}
                    name="printerId"
                    render={({ field }) => (
                      <SimpleSelect
                        items={printerItems}
                        value={field.value}
                        onValueChange={field.onChange}
                        invalid={!!errors.printerId}
                      />
                    )}
                  />
                </FormField>

                <FormField label="Cliente">
                  <Controller
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <SimpleSelect
                        items={clientItems}
                        value={field.value ?? NONE}
                        onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      />
                    )}
                  />
                </FormField>

                <FormField label="Responsável">
                  <Controller
                    control={form.control}
                    name="assignedUserId"
                    render={({ field }) => (
                      <SimpleSelect
                        items={teamItems}
                        value={field.value ?? NONE}
                        onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      />
                    )}
                  />
                </FormField>
              </SimpleGrid>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <SectionHeader title="Filamentos">
              <AddButton
                onClick={() => filamentFields.append({ filamentId: "", weightG: 0 })}
              />
            </SectionHeader>
            <Card.Body gap="2">
              {filamentFields.fields.length === 0 ? (
                <EmptyText>Nenhum filamento adicionado.</EmptyText>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="transparent">
                      <Table.ColumnHeader>Filamento</Table.ColumnHeader>
                      <Table.ColumnHeader w="32">Peso (g)</Table.ColumnHeader>
                      <Table.ColumnHeader w="1" />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filamentFields.fields.map((field, index) => (
                      <Table.Row key={field.id} bg="transparent">
                        <Table.Cell>
                          <Controller
                            control={form.control}
                            name={`filamentItems.${index}.filamentId`}
                            render={({ field: f }) => (
                              <SimpleSelect
                                items={filamentItems}
                                value={f.value}
                                onValueChange={f.onChange}
                              />
                            )}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Input
                            size="sm"
                            type="number"
                            step="0.01"
                            {...form.register(`filamentItems.${index}.weightG`, {
                              valueAsNumber: true,
                            })}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <RemoveButton onClick={() => filamentFields.remove(index)} />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
              {errors.filamentItems?.message ? (
                <Text textStyle="sm" color="fg.error">
                  {errors.filamentItems.message}
                </Text>
              ) : null}
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <SectionHeader title="Consumíveis">
              <AddButton
                onClick={() => consumableFields.append({ consumableId: "", quantity: 1 })}
              />
            </SectionHeader>
            <Card.Body>
              {consumableFields.fields.length === 0 ? (
                <EmptyText>Nenhum consumível adicionado.</EmptyText>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="transparent">
                      <Table.ColumnHeader>Consumível</Table.ColumnHeader>
                      <Table.ColumnHeader w="32">Qtd.</Table.ColumnHeader>
                      <Table.ColumnHeader w="1" />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {consumableFields.fields.map((field, index) => (
                      <Table.Row key={field.id} bg="transparent">
                        <Table.Cell>
                          <Controller
                            control={form.control}
                            name={`consumableItems.${index}.consumableId`}
                            render={({ field: f }) => (
                              <SimpleSelect
                                items={consumableItems}
                                value={f.value}
                                onValueChange={f.onChange}
                              />
                            )}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Input
                            size="sm"
                            type="number"
                            step="0.01"
                            {...form.register(`consumableItems.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <RemoveButton onClick={() => consumableFields.remove(index)} />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Card.Body>
          </Card.Root>

          {plateFields.fields.length > 0 ? (
            <Card.Root>
              <SectionHeader title="Pratos (importados)" />
              <Card.Body>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="transparent">
                      <Table.ColumnHeader>Prato</Table.ColumnHeader>
                      <Table.ColumnHeader>Tempo (h)</Table.ColumnHeader>
                      <Table.ColumnHeader>Peso (g)</Table.ColumnHeader>
                      <Table.ColumnHeader w="1" />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {plateFields.fields.map((field, index) => (
                      <Table.Row key={field.id} bg="transparent">
                        <Table.Cell>{field.label}</Table.Cell>
                        <Table.Cell>{field.printTimeH.toFixed(2)}</Table.Cell>
                        <Table.Cell>{field.weightG.toFixed(0)}</Table.Cell>
                        <Table.Cell>
                          <RemoveButton onClick={() => plateFields.remove(index)} />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>
          ) : null}

          <Card.Root>
            <SectionHeader title="Tempos" />
            <Card.Body>
              <SimpleGrid columns={{ base: 2, sm: 4 }} gap="4">
                {(
                  [
                    ["printTimeH", "Impressão (h)"],
                    ["prepTimeMin", "Preparação (min)"],
                    ["slicingTimeMin", "Fatiamento (min)"],
                    ["materialChangeMin", "Troca de material (min)"],
                    ["transferStartMin", "Transferência & start (min)"],
                    ["removalMin", "Retirada (min)"],
                    ["supportRemovalMin", "Retirada de suportes (min)"],
                    ["additionalWorkMin", "Trabalhos adicionais (min)"],
                  ] as const
                ).map(([name, label]) => (
                  <FormField key={name} label={label}>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(name, { valueAsNumber: true })}
                    />
                  </FormField>
                ))}
              </SimpleGrid>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <SectionHeader title="Precificação" />
            <Card.Body>
              <SimpleGrid columns={{ base: 2, sm: 4 }} gap="4">
                <FormField label="Consumíveis avulso (R$)">
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("consumablesMiscCost", { valueAsNumber: true })}
                  />
                </FormField>
                <FormField label="Markup (%)">
                  <Input
                    type="number"
                    step="1"
                    {...form.register("markupPercent", { valueAsNumber: true })}
                  />
                </FormField>
                <FormField label="Preço cotado unit. (R$)">
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("realPrice", { valueAsNumber: true })}
                  />
                </FormField>
                <FormField label="Quantidade">
                  <Input
                    type="number"
                    step="1"
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                </FormField>
              </SimpleGrid>
            </Card.Body>
          </Card.Root>

          <Button
            type="submit"
            alignSelf="start"
            loading={pending}
            loadingText="Salvando..."
          >
            Salvar orçamento
          </Button>
        </Stack>

        <Stack gap="4" position={{ lg: "sticky" }} top={{ lg: "20" }}>
          <QuoteCostPreview
            input={{
              printTimeH: values.printTimeH ?? 0,
              prepTimeMin: values.prepTimeMin ?? 0,
              slicingTimeMin: values.slicingTimeMin ?? 0,
              materialChangeMin: values.materialChangeMin ?? 0,
              transferStartMin: values.transferStartMin ?? 0,
              removalMin: values.removalMin ?? 0,
              supportRemovalMin: values.supportRemovalMin ?? 0,
              additionalWorkMin: values.additionalWorkMin ?? 0,
              consumablesMiscCost: values.consumablesMiscCost ?? 0,
              markupPercent: values.markupPercent ?? 0,
              realPrice: values.realPrice ?? 0,
              quantity: values.quantity ?? 1,
            }}
            printer={
              selectedPrinter
                ? {
                    energyKwh: selectedPrinter.energyKwh,
                    depreciationRate: selectedPrinter.depreciationRate ?? 0,
                  }
                : null
            }
            settings={{
              energyCostPerKwh: settingsRow.energyCostPerKwh,
              laborCostPerHour: settingsRow.laborCostPerHour,
              failureRatePercent: settingsRow.failureRatePercent,
            }}
            filamentItems={(values.filamentItems ?? [])
              .filter((i): i is { filamentId: string; weightG: number } => Boolean(i?.filamentId))
              .map((i) => ({
                weightG: i.weightG ?? 0,
                pricePerKg: filamentById.get(i.filamentId)?.pricePerKg ?? 0,
              }))}
            consumableItems={(values.consumableItems ?? [])
              .filter((i): i is { consumableId: string; quantity: number } => Boolean(i?.consumableId))
              .map((i) => ({
                quantity: i.quantity ?? 0,
                unitPrice: consumableById.get(i.consumableId)?.unitPrice ?? 0,
              }))}
          />
        </Stack>
      </Grid>

      <Import3mfDialog
        pending={pendingImport}
        filamentOptions={filamentOptions}
        onMappingChange={updateImportMapping}
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </>
  )
}
