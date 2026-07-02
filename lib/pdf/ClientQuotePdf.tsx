import { Document, Page, Text, View, Image as PdfImage } from "@react-pdf/renderer"
import { pdfStyles as s } from "./styles"
import type { QuotePdfData } from "./quote-pdf-data"

const money = (currency: string, n: number) => `${currency} ${n.toFixed(2)}`

export function ClientQuotePdf({ data }: { data: QuotePdfData }) {
  const { quote, client, printer, filamentLines, consumableLines, cost, currency } = data

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <Text style={s.brand}>F&E 3D</Text>
          <View>
            <Text style={s.docLabel}>Orçamento</Text>
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
            <Text style={s.rowLabel}>Data</Text>
            <Text style={s.rowValue}>
              {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
            </Text>
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
          <Text style={s.sectionTitle}>Valores</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Quantidade</Text>
            <Text style={s.rowValue}>{quote.quantity}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Preço unitário</Text>
            <Text style={s.rowValue}>{money(currency, cost.realPriceUnit)}</Text>
          </View>
          <View style={s.strongRow}>
            <Text>Total</Text>
            <Text>{money(currency, cost.totalRealPrice)}</Text>
          </View>
        </View>

        <Text style={s.footer}>Orçamento gerado por F&E 3D</Text>
      </Page>
    </Document>
  )
}
