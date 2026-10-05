import NextLink from "next/link"
import { and, asc, count, desc, eq, ilike, sql, type SQL } from "drizzle-orm"
import { Plus } from "lucide-react"
import { Badge, Button, Link, Stack, Table } from "@chakra-ui/react"
import { db } from "@/db"
import { quotes, clients } from "@/db/schema"
import {
  quoteStatusLabels,
  quoteStatusPalette,
  quoteStatusValues,
} from "@/lib/validation/quote"
import { DataCard } from "@/components/chakra/data-card"
import { formatBRL } from "@/lib/format"
import { isUuid, likePattern, parseList, type SearchParams } from "@/lib/list-params"
import { QuoteStatusMenu } from "@/components/quotes/quote-status-control"
import { ListToolbar } from "@/components/list/list-toolbar"
import { ListPagination } from "@/components/list/list-pagination"
import { SortHeader, type ListContext } from "@/components/list/sort-header"
import { ensurePageInRange } from "@/components/list/ensure-page"

const SORTS = ["description", "client", "status", "total", "createdAt"] as const
const DEFAULTS = { sort: "createdAt", dir: "desc" } as const

const total = sql`${quotes.realPrice} * ${quotes.quantity}`
const SORT_COLUMNS = {
  description: quotes.description,
  client: clients.name,
  status: quotes.status,
  total,
  createdAt: quotes.createdAt,
} satisfies Record<(typeof SORTS)[number], unknown>

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const state = parseList(await searchParams, {
    sorts: SORTS,
    defaultSort: DEFAULTS.sort,
    defaultDir: DEFAULTS.dir,
    filters: ["status", "client"],
  })
  const list: ListContext = { pathname: "/quotes", state, defaults: DEFAULTS }

  const conditions: SQL[] = []
  if (state.q) conditions.push(ilike(quotes.description, likePattern(state.q)))
  const status = state.filters.status
  if (status && (quoteStatusValues as readonly string[]).includes(status)) {
    conditions.push(eq(quotes.status, status as (typeof quoteStatusValues)[number]))
  }
  if (isUuid(state.filters.client)) conditions.push(eq(quotes.clientId, state.filters.client))
  const where = conditions.length ? and(...conditions) : undefined

  const column = SORT_COLUMNS[state.sort]
  const order = state.dir === "asc" ? asc(column) : desc(column)

  const [rows, [{ total: totalRows }], clientOptions] = await Promise.all([
    db
      .select({
        id: quotes.id,
        description: quotes.description,
        status: quotes.status,
        rejectionReason: quotes.rejectionReason,
        realPrice: quotes.realPrice,
        quantity: quotes.quantity,
        createdAt: quotes.createdAt,
        clientName: clients.name,
      })
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .where(where)
      // Desempate estável: sem ele, itens com o mesmo valor trocam de
      // página entre requisições.
      .orderBy(order, desc(quotes.createdAt), asc(quotes.id))
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    db.select({ total: count() }).from(quotes).where(where),
    db.select({ id: clients.id, name: clients.name }).from(clients).orderBy(asc(clients.name)),
  ])
  ensurePageInRange(list, totalRows)

  return (
    <DataCard
      title="Todos os orçamentos"
      description="Importe o .3mf ou .gcode do fatiador para preencher automaticamente."
      actions={
        <Button size="sm" asChild>
          <NextLink href="/quotes/new">
            <Plus />
            Novo orçamento
          </NextLink>
        </Button>
      }
    >
      <Stack gap="4">
        <ListToolbar
          searchPlaceholder="Buscar por descrição..."
          filters={[
            {
              key: "status",
              label: "Todos os status",
              options: quoteStatusValues.map((s) => ({ value: s, label: quoteStatusLabels[s] })),
            },
            {
              key: "client",
              label: "Todos os clientes",
              options: clientOptions.map((c) => ({ value: c.id, label: c.name })),
            },
          ]}
        />

        <Table.Root size="md" interactive>
          <Table.Header>
            <Table.Row bg="transparent">
              <SortHeader list={list} sortKey="description">Descrição</SortHeader>
              <SortHeader list={list} sortKey="client">Cliente</SortHeader>
              <SortHeader list={list} sortKey="status">Status</SortHeader>
              <SortHeader list={list} sortKey="total" firstDir="desc">Preço total</SortHeader>
              <SortHeader list={list} sortKey="createdAt" firstDir="desc">Data</SortHeader>
              <Table.ColumnHeader w="1" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.length === 0 ? (
              <Table.Row bg="transparent">
                <Table.Cell colSpan={6} textAlign="center" color="fg.muted">
                  {where ? "Nenhum orçamento encontrado com esses filtros." : "Nenhum orçamento cadastrado."}
                </Table.Cell>
              </Table.Row>
            ) : (
              rows.map((q) => (
                <Table.Row key={q.id} bg="transparent">
                  <Table.Cell fontWeight="semibold">
                    <Link asChild display="block" color="fg" textDecoration="none">
                      <NextLink href={`/quotes/${q.id}`}>{q.description}</NextLink>
                    </Link>
                  </Table.Cell>
                  <Table.Cell color="fg.muted">{q.clientName ?? "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette={quoteStatusPalette[q.status]}
                      variant="subtle"
                      title={q.rejectionReason ? `Motivo: ${q.rejectionReason}` : undefined}
                    >
                      {quoteStatusLabels[q.status]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell fontWeight="semibold">{formatBRL(q.realPrice * q.quantity)}</Table.Cell>
                  <Table.Cell color="fg.muted">
                    {q.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </Table.Cell>
                  <Table.Cell>
                    <QuoteStatusMenu quoteId={q.id} status={q.status} />
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>

        <ListPagination list={list} total={totalRows} />
      </Stack>
    </DataCard>
  )
}
