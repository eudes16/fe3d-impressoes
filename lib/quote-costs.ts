// Porta fiel das fórmulas de custo do Quote.dart do app Flutter legado.
// Mantém os mesmos nomes de conceito para facilitar comparação com a fonte.

export type QuoteCostInput = {
  printTimeH: number
  prepTimeMin: number
  slicingTimeMin: number
  materialChangeMin: number
  transferStartMin: number
  removalMin: number
  supportRemovalMin: number
  additionalWorkMin: number
  consumablesMiscCost: number
  markupPercent: number
  realPrice: number
  quantity: number
}

export type QuoteCostFilamentItem = { weightG: number; pricePerKg: number }
export type QuoteCostConsumableItem = { quantity: number; unitPrice: number }

export type QuoteCostPrinter = {
  energyKwh: number
  depreciationRate: number
}

export type QuoteCostSettings = {
  energyCostPerKwh: number
  laborCostPerHour: number
  failureRatePercent: number
}

export function filamentCost(items: QuoteCostFilamentItem[]): number {
  return items.reduce((sum, item) => sum + (item.weightG / 1000) * item.pricePerKg, 0)
}

export function electricityCost(
  printTimeH: number,
  printer: QuoteCostPrinter,
  settings: QuoteCostSettings
): number {
  return printTimeH * printer.energyKwh * settings.energyCostPerKwh
}

export function depreciationCost(
  printTimeH: number,
  printer: QuoteCostPrinter
): number {
  return printTimeH * printer.depreciationRate
}

export function totalPrepTimeH(input: QuoteCostInput): number {
  return (
    (input.prepTimeMin +
      input.slicingTimeMin +
      input.materialChangeMin +
      input.transferStartMin) /
    60
  )
}

export function totalPostTimeH(input: QuoteCostInput): number {
  return (
    (input.removalMin + input.supportRemovalMin + input.additionalWorkMin) / 60
  )
}

export function prepCost(input: QuoteCostInput, settings: QuoteCostSettings): number {
  return totalPrepTimeH(input) * settings.laborCostPerHour
}

export function postCost(input: QuoteCostInput, settings: QuoteCostSettings): number {
  return totalPostTimeH(input) * settings.laborCostPerHour
}

export function consumablesStockCost(items: QuoteCostConsumableItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export type QuoteCostBreakdown = {
  filament: number
  electricity: number
  depreciation: number
  prep: number
  post: number
  consumablesStock: number
  consumablesMisc: number
  subtotal: number
  costWithFailures: number
  suggestedPriceUnit: number
  realPriceUnit: number
  quantity: number
  totalCost: number
  totalSuggestedPrice: number
  totalRealPrice: number
  profit: number
  profitPercent: number
}

export function computeQuoteCost(
  input: QuoteCostInput,
  printer: QuoteCostPrinter,
  settings: QuoteCostSettings,
  filaments: QuoteCostFilamentItem[],
  consumables: QuoteCostConsumableItem[]
): QuoteCostBreakdown {
  const filament = filamentCost(filaments)
  const electricity = electricityCost(input.printTimeH, printer, settings)
  const depreciation = depreciationCost(input.printTimeH, printer)
  const prep = prepCost(input, settings)
  const post = postCost(input, settings)
  const consumablesStock = consumablesStockCost(consumables)
  const consumablesMisc = input.consumablesMiscCost

  const subtotal =
    filament +
    electricity +
    depreciation +
    prep +
    post +
    consumablesStock +
    consumablesMisc

  const costWithFailures = subtotal * (1 + settings.failureRatePercent / 100)
  const suggestedPriceUnit = costWithFailures * (input.markupPercent / 100)
  const realPriceUnit = input.realPrice

  const totalCost = costWithFailures * input.quantity
  const totalSuggestedPrice = suggestedPriceUnit * input.quantity
  const totalRealPrice = realPriceUnit * input.quantity

  const profit = totalRealPrice - totalCost
  const profitPercent = totalRealPrice > 0 ? (profit / totalRealPrice) * 100 : 0

  return {
    filament,
    electricity,
    depreciation,
    prep,
    post,
    consumablesStock,
    consumablesMisc,
    subtotal,
    costWithFailures,
    suggestedPriceUnit,
    realPriceUnit,
    quantity: input.quantity,
    totalCost,
    totalSuggestedPrice,
    totalRealPrice,
    profit,
    profitPercent,
  }
}
