import { NextResponse, type NextRequest } from "next/server"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { createElement, type ReactElement } from "react"
import { loadQuotePdfData } from "@/lib/pdf/quote-pdf-data"
import { ClientQuotePdf } from "@/lib/pdf/ClientQuotePdf"
import { ProductionQuotePdf } from "@/lib/pdf/ProductionQuotePdf"
import { requireProfile } from "@/lib/current-user"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireProfile()

  const { id } = await params
  const variant = request.nextUrl.searchParams.get("variant") === "production"
    ? "production"
    : "client"

  const data = await loadQuotePdfData(id)
  if (!data) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 })
  }

  // ClientQuotePdf/ProductionQuotePdf are thin wrappers that render a
  // <Document>; renderToBuffer's typings want a ReactElement<DocumentProps>
  // directly, so we assert through that shape.
  const doc = (
    variant === "production"
      ? createElement(ProductionQuotePdf, { data })
      : createElement(ClientQuotePdf, { data })
  ) as unknown as ReactElement<DocumentProps>

  const buffer = await renderToBuffer(doc)
  const filename = `orcamento-${id.slice(0, 8)}-${variant}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  })
}
