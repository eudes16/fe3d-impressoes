import { Card, Flex, Heading, Separator, Text } from "@chakra-ui/react"

import {
  computeQuoteCost,
  type QuoteCostInput,
  type QuoteCostPrinter,
  type QuoteCostSettings,
  type QuoteCostFilamentItem,
  type QuoteCostConsumableItem,
} from "@/lib/quote-costs"

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
    <Flex
      justify="space-between"
      textStyle="sm"
      fontWeight={strong ? "semibold" : undefined}
      color={strong ? "fg" : "fg.muted"}
    >
      <span>{label}</span>
      <span>{value}</span>
    </Flex>
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
      <Card.Root>
        <Card.Header>
          <Heading as="h3" textStyle="md" fontWeight="bold">
            Custos
          </Heading>
        </Card.Header>
        <Card.Body>
          <Text textStyle="sm" color="fg.muted">
            Selecione uma impressora para ver o cálculo de custo.
          </Text>
        </Card.Body>
      </Card.Root>
    )
  }

  const cost = computeQuoteCost(input, printer, settings, filamentItems, consumableItems)

  return (
    <Card.Root>
      <Card.Header>
        <Heading as="h3" textStyle="md" fontWeight="bold">
          Custos
        </Heading>
      </Card.Header>
      <Card.Body gap="1">
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
        <Separator my="2" />
        <Row label={`Custo total (×${cost.quantity})`} value={currency(cost.totalCost)} />
        <Row label="Preço sugerido total" value={currency(cost.totalSuggestedPrice)} />
        <Row label="Preço real total" value={currency(cost.totalRealPrice)} strong />
        <Row
          label="Lucro"
          value={`${currency(cost.profit)} (${cost.profitPercent.toFixed(1)}%)`}
          strong
        />
      </Card.Body>
    </Card.Root>
  )
}
