"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import { saveQuote } from "@/actions/quotes"
import { parseGcode3mf, matchFilament } from "@/lib/parser3mf"
import { filamentLabel, consumableLabel } from "@/lib/filament-label"
import {
  quoteFormSchema,
  quoteStatusLabels,
  quoteStatusValues,
  type QuoteFormValues,
} from "@/lib/validation/quote"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
    const data = await parseGcode3mf(buffer)
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
    setPendingImport({ data, filename: file.name, mapping, buffer })
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

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Detalhes</CardTitle>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".3mf"
                  className="hidden"
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
                  <Upload className="size-4" />
                  Importar .3mf
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt="Prévia do modelo"
                  width={120}
                  height={120}
                  unoptimized
                  className="rounded-md border object-cover"
                />
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Ex.: Porta joias Olivia"
                />
                {form.formState.errors.description ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Impressora</Label>
                  <Controller
                    control={form.control}
                    name="printerId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: string) =>
                              printerOptions.find((p) => p.id === value)?.name ??
                              "Selecione"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {printerOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.printerId ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.printerId.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: keyof typeof quoteStatusLabels) =>
                              quoteStatusLabels[value] ?? value
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {quoteStatusValues.map((s) => (
                            <SelectItem key={s} value={s}>
                              {quoteStatusLabels[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Controller
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? NONE}
                        onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: string) =>
                              value === NONE || !value
                                ? "Nenhum"
                                : (clients.find((c) => c.id === value)?.name ?? "Nenhum")
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Nenhum</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Responsável</Label>
                  <Controller
                    control={form.control}
                    name="assignedUserId"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? NONE}
                        onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: string) =>
                              value === NONE || !value
                                ? "Nenhum"
                                : (teamOptions.find((t) => t.id === value)?.name ?? "Nenhum")
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Nenhum</SelectItem>
                          {teamOptions.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Filamentos</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  filamentFields.append({ filamentId: "", weightG: 0 })
                }
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              {filamentFields.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum filamento adicionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filamento</TableHead>
                      <TableHead className="w-32">Peso (g)</TableHead>
                      <TableHead className="w-1" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filamentFields.fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            control={form.control}
                            name={`filamentItems.${index}.filamentId`}
                            render={({ field: f }) => (
                              <Select value={f.value} onValueChange={f.onChange}>
                                <SelectTrigger className="w-full">
                                  <SelectValue>
                                    {(value: string) => {
                                      const opt = filamentOptions.find((o) => o.id === value)
                                      return opt ? filamentLabel(opt) : "Selecione"
                                    }}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {filamentOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                      {filamentLabel(opt)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`filamentItems.${index}.weightG`, {
                              valueAsNumber: true,
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => filamentFields.remove(index)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {form.formState.errors.filamentItems?.message ? (
                <p className="mt-2 text-sm text-destructive">
                  {form.formState.errors.filamentItems.message}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Consumíveis</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  consumableFields.append({ consumableId: "", quantity: 1 })
                }
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              {consumableFields.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum consumível adicionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consumível</TableHead>
                      <TableHead className="w-32">Qtd.</TableHead>
                      <TableHead className="w-1" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumableFields.fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            control={form.control}
                            name={`consumableItems.${index}.consumableId`}
                            render={({ field: f }) => (
                              <Select value={f.value} onValueChange={f.onChange}>
                                <SelectTrigger className="w-full">
                                  <SelectValue>
                                    {(value: string) => {
                                      const opt = consumableOptions.find((o) => o.id === value)
                                      return opt ? consumableLabel(opt) : "Selecione"
                                    }}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {consumableOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                      {consumableLabel(opt)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`consumableItems.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => consumableFields.remove(index)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {plateFields.fields.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pratos (do .3mf)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prato</TableHead>
                      <TableHead>Tempo (h)</TableHead>
                      <TableHead>Peso (g)</TableHead>
                      <TableHead className="w-1" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plateFields.fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>{field.printTimeH.toFixed(2)}</TableCell>
                        <TableCell>{field.weightG.toFixed(0)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => plateFields.remove(index)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tempos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                <div key={name} className="grid gap-2">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    type="number"
                    step="0.01"
                    {...form.register(name, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Precificação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="consumablesMiscCost">Consumíveis avulso (R$)</Label>
                <Input
                  id="consumablesMiscCost"
                  type="number"
                  step="0.01"
                  {...form.register("consumablesMiscCost", { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="markupPercent">Markup (%)</Label>
                <Input
                  id="markupPercent"
                  type="number"
                  step="1"
                  {...form.register("markupPercent", { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="realPrice">Preço cotado unit. (R$)</Label>
                <Input
                  id="realPrice"
                  type="number"
                  step="0.01"
                  {...form.register("realPrice", { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="1"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar orçamento"}
          </Button>
        </div>

        <div className="space-y-4">
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
        </div>
      </form>

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
