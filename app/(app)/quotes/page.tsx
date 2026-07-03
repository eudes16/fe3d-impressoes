import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { Plus } from "lucide-react"
import { db } from "@/db"
import { quotes, clients } from "@/db/schema"
import { quoteStatusLabels } from "@/lib/validation/quote"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive"> = {
  draft: "secondary",
  sent: "secondary",
  approved: "default",
  in_production: "default",
  completed: "default",
  rejected: "destructive",
}

export default async function QuotesPage() {
  const rows = await db
    .select({
      id: quotes.id,
      description: quotes.description,
      status: quotes.status,
      realPrice: quotes.realPrice,
      quantity: quotes.quantity,
      createdAt: quotes.createdAt,
      clientName: clients.name,
    })
    .from(quotes)
    .leftJoin(clients, eq(quotes.clientId, clients.id))
    .orderBy(desc(quotes.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orçamentos</h1>
          <p className="text-muted-foreground">
            Importe o .3mf do fatiador para preencher automaticamente.
          </p>
        </div>
        <Button size="sm" nativeButton={false} render={<Link href="/quotes/new" />}>
          <Plus className="size-4" />
          Novo orçamento
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Preço total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Nenhum orçamento cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((q) => (
              <TableRow key={q.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/quotes/${q.id}`} className="block">
                    {q.description}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {q.clientName ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[q.status] ?? "secondary"}>
                    {quoteStatusLabels[q.status]}
                  </Badge>
                </TableCell>
                <TableCell>R$ {(q.realPrice * q.quantity).toFixed(2)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
