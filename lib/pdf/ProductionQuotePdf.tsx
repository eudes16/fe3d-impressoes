import { Document, Page, Text, View, Image as PdfImage } from "@react-pdf/renderer"
import { pdfStyles as s } from "./styles"
import type { QuotePdfData } from "./quote-pdf-data"

const money = (currency: string, n: number) => `${currency} ${n.toFixed(2)}`

export function ProductionQuotePdf({ data }: { data: QuotePdfData }) {
  const {
    quote,
    client,
    printer,
    assignedUser,
    filamentLines,
    consumableLines,
    cost,
    statusLabel,
    currency,
  } = data

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <Text style={s.brand}>F&E 3D</Text>
          <View>
            <Text style={s.docLabel}>Ordem de produção</Text>
            <Text style={s.docLabel}>{quote.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        {quote.thumbnailUrl ? (
          <PdfImage src={quote.thumbnailUrl} style={s.thumbnail} />
        ) : null}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalhes</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Cliente</Text>
            <Text style={s.rowValue}>{client?.name ?? "—"}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Descrição</Text>
            <Text style={s.rowValue}>{quote.description}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Responsável</Text>
            <Text style={s.rowValue}>{assignedUser?.name ?? "—"}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Status</Text>
            <Text style={s.rowValue}>{statusLabel}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Impressão</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Impressora</Text>
            <Text style={s.rowValue}>{printer.name}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Tempo de impressão</Text>
            <Text style={s.rowValue}>{quote.printTimeH.toFixed(2)} h</Text>
          </View>
          {filamentLines.length > 0 ? (
            <View style={s.table}>
              {filamentLines.map((f, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={s.colName}>{f.name}</Text>
                  <Text style={s.colValue}>{f.weightG.toFixed(1)} g</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {consumableLines.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Consumíveis</Text>
            {consumableLines.map((c, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={s.colName}>{c.name}</Text>
                <Text style={s.colValue}>{c.quantity}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Custos detalhados</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Filamento</Text>
            <Text style={s.rowValue}>{money(currency, cost.filament)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Eletricidade</Text>
            <Text style={s.rowValue}>{money(currency, cost.electricity)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Depreciação</Text>
            <Text style={s.rowValue}>{money(currency, cost.depreciation)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Preparação</Text>
            <Text style={s.rowValue}>{money(currency, cost.prep)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Pós-processamento</Text>
            <Text style={s.rowValue}>{money(currency, cost.post)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Consumíveis (estoque)</Text>
            <Text style={s.rowValue}>{money(currency, cost.consumablesStock)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Consumíveis (avulso)</Text>
            <Text style={s.rowValue}>{money(currency, cost.consumablesMisc)}</Text>
          </View>
          <View style={s.strongRow}>
            <Text>Subtotal</Text>
            <Text>{money(currency, cost.subtotal)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Com margem de falhas</Text>
            <Text style={s.rowValue}>{money(currency, cost.costWithFailures)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Cotação</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Markup</Text>
            <Text style={s.rowValue}>{quote.markupPercent}%</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Preço sugerido (unit.)</Text>
            <Text style={s.rowValue}>{money(currency, cost.suggestedPriceUnit)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Preço real (unit.)</Text>
            <Text style={s.rowValue}>{money(currency, cost.realPriceUnit)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Quantidade</Text>
            <Text style={s.rowValue}>{quote.quantity}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Custo total</Text>
            <Text style={s.rowValue}>{money(currency, cost.totalCost)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Preço sugerido total</Text>
            <Text style={s.rowValue}>{money(currency, cost.totalSuggestedPrice)}</Text>
          </View>
          <View style={s.strongRow}>
            <Text>Preço real total</Text>
            <Text>{money(currency, cost.totalRealPrice)}</Text>
          </View>
          <View style={s.strongRow}>
            <Text>Lucro</Text>
            <Text>
              {money(currency, cost.profit)} ({cost.profitPercent.toFixed(1)}%)
            </Text>
          </View>
        </View>

        <Text style={s.footer}>Documento interno — não enviar ao cliente</Text>
      </Page>
    </Document>
  )
}
