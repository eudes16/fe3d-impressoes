import Link from "next/link"
import { desc, sql } from "drizzle-orm"
import { AlertTriangle } from "lucide-react"
import { db } from "@/db"
import { filaments, consumables, quotes } from "@/db/schema"
import { quoteStatusLabels, quoteStatusValues } from "@/lib/validation/quote"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const LOW_STOCK_RATIO = 0.15

const STATUS_ACCENT: Record<string, string> = {
  draft: "var(--chart-5)",
  sent: "var(--chart-2)",
  approved: "var(--chart-1)",
  in_production: "var(--chart-1)",
  completed: "var(--chart-3)",
  rejected: "var(--destructive)",
}

export default async function DashboardPage() {
  const [allFilaments, allConsumables, statusCounts, recentQuotes] = await Promise.all([
    db.select().from(filaments),
    db.select().from(consumables),
    db
      .select({ status: quotes.status, count: sql<number>`count(*)`.mapWith(Number) })
      .from(quotes)
      .groupBy(quotes.status),
    db.select().from(quotes).orderBy(desc(quotes.createdAt)).limit(5),
  ])

  const lowStockFilaments = allFilaments.filter(
    (f) => f.remainingWeightG < f.weightKg * 1000 * LOW_STOCK_RATIO
  )
  const outOfStockConsumables = allConsumables.filter((c) => c.quantity <= 0)

  const countByStatus = new Map(statusCounts.map((s) => [s.status, s.count]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="text-muted-foreground">Resumo de estoque e orçamentos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {quoteStatusValues.map((status) => (
          <Card
            key={status}
            className="border-t-2"
            style={{ borderTopColor: STATUS_ACCENT[status] }}
          >
            <CardHeader className="pb-2">
              <CardDescription>{quoteStatusLabels[status]}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {countByStatus.get(status) ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estoque baixo — filamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockFilaments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta.</p>
            ) : (
              lowStockFilaments.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-600" />
                    {f.name}
                  </span>
                  <span className="text-muted-foreground">
                    {f.remainingWeightG.toFixed(0)} g
                  </span>
                </div>
              ))
            )}
            <Link href="/filaments" className="text-sm text-primary underline">
              Ver filamentos
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consumíveis esgotados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outOfStockConsumables.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta.</p>
            ) : (
              outOfStockConsumables.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-600" />
                    {c.name}
                  </span>
                  <span className="text-muted-foreground">{c.quantity} {c.unit}</span>
                </div>
              ))
            )}
            <Link href="/consumables" className="text-sm text-primary underline">
              Ver consumíveis
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orçamentos recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum orçamento ainda.</p>
          ) : (
            recentQuotes.map((q) => (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="flex items-center justify-between text-sm hover:underline"
              >
                <span>{q.description}</span>
                <Badge variant="secondary">{quoteStatusLabels[q.status]}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
