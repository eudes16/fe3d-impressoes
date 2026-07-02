import {
  computeQuoteCost,
  type QuoteCostInput,
  type QuoteCostPrinter,
  type QuoteCostSettings,
  type QuoteCostFilamentItem,
  type QuoteCostConsumableItem,
} from "@/lib/quote-costs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex justify-between text-sm ${strong ? "font-semibold" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className={strong ? "text-foreground" : ""}>{value}</span>
    </div>
  )
}

const currency = (n: number) => `R$ ${n.toFixed(2)}`

export function QuoteCostPreview({
  input,
  printer,
  settings,
  filamentItems,
  consumableItems,
}: {
  input: QuoteCostInput
  printer: QuoteCostPrinter | null
  settings: QuoteCostSettings
  filamentItems: QuoteCostFilamentItem[]
  consumableItems: QuoteCostConsumableItem[]
}) {
  if (!printer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecione uma impressora para ver o cálculo de custo.
          </p>
        </CardContent>
      </Card>
    )
  }

  const cost = computeQuoteCost(input, printer, settings, filamentItems, consumableItems)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Custos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Row label="Filamento" value={currency(cost.filament)} />
        <Row label="Eletricidade" value={currency(cost.electricity)} />
        <Row label="Depreciação" value={currency(cost.depreciation)} />
        <Row label="Preparação" value={currency(cost.prep)} />
        <Row label="Pós-processamento" value={currency(cost.post)} />
        <Row label="Consumíveis (estoque)" value={currency(cost.consumablesStock)} />
        <Row label="Consumíveis (avulso)" value={currency(cost.consumablesMisc)} />
        <Row label="Subtotal" value={currency(cost.subtotal)} strong />
        <Row
          label={`Com falhas (${settings.failureRatePercent}%)`}
          value={currency(cost.costWithFailures)}
        />
        <Row label="Preço sugerido (unit.)" value={currency(cost.suggestedPriceUnit)} />
        <Row label="Preço real (unit.)" value={currency(cost.realPriceUnit)} />
        <div className="my-2 border-t" />
        <Row label={`Custo total (×${cost.quantity})`} value={currency(cost.totalCost)} />
        <Row label="Preço sugerido total" value={currency(cost.totalSuggestedPrice)} />
        <Row label="Preço real total" value={currency(cost.totalRealPrice)} strong />
        <Row
          label="Lucro"
          value={`${currency(cost.profit)} (${cost.profitPercent.toFixed(1)}%)`}
          strong
        />
      </CardContent>
    </Card>
  )
}
