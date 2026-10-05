import { asc, count, desc, ilike } from "drizzle-orm"
import { HStack, Stack, Table } from "@chakra-ui/react"
import { db } from "@/db"
import { printers } from "@/db/schema"
import { deletePrinter } from "@/actions/printers"
import { PrinterFormDialog } from "@/components/printers/printer-form-dialog"
import { ConfirmDeleteButton } from "@/components/chakra/confirm-delete-button"
import { DataCard } from "@/components/chakra/data-card"
import { formatBRL } from "@/lib/format"
import { likePattern, parseList, type SearchParams } from "@/lib/list-params"
import { ListToolbar } from "@/components/list/list-toolbar"
import { ListPagination } from "@/components/list/list-pagination"
import { SortHeader, type ListContext } from "@/components/list/sort-header"
import { ensurePageInRange } from "@/components/list/ensure-page"

const SORTS = ["name", "price", "depreciation", "energy"] as const
const DEFAULTS = { sort: "name", dir: "asc" } as const
const SORT_COLUMNS = {
  name: printers.name,
  price: printers.price,
  depreciation: printers.depreciationRate,
  energy: printers.energyKwh,
}

export default async function PrintersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const state = parseList(await searchParams, {
    sorts: SORTS,
    defaultSort: DEFAULTS.sort,
    defaultDir: DEFAULTS.dir,
  })
  const list: ListContext = { pathname: "/printers", state, defaults: DEFAULTS }

  const where = state.q ? ilike(printers.name, likePattern(state.q)) : undefined
  const column = SORT_COLUMNS[state.sort]

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(printers)
      .where(where)
      .orderBy(state.dir === "asc" ? asc(column) : desc(column), asc(printers.id))
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    db.select({ total: count() }).from(printers).where(where),
  ])
  ensurePageInRange(list, total)

  return (
    <DataCard
      title="Impressoras cadastradas"
      description="Preço, depreciação, manutenção e consumo de energia."
      actions={<PrinterFormDialog />}
    >
      <Stack gap="4">
        <ListToolbar searchPlaceholder="Buscar por nome..." />

        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="transparent">
              <SortHeader list={list} sortKey="name">Nome</SortHeader>
              <SortHeader list={list} sortKey="price" firstDir="desc">Preço</SortHeader>
              <SortHeader list={list} sortKey="depreciation" firstDir="desc">
                Depreciação/h
              </SortHeader>
              <SortHeader list={list} sortKey="energy" firstDir="desc">
                Energia (kWh/h)
              </SortHeader>
              <Table.ColumnHeader w="1" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.length === 0 ? (
              <Table.Row bg="transparent">
                <Table.Cell colSpan={5} textAlign="center" color="fg.muted">
                  {where ? "Nenhuma impressora encontrada." : "Nenhuma impressora cadastrada."}
                </Table.Cell>
              </Table.Row>
            ) : (
              rows.map((printer) => (
                <Table.Row key={printer.id} bg="transparent">
                  <Table.Cell fontWeight="semibold">{printer.name}</Table.Cell>
                  <Table.Cell>{formatBRL(printer.price)}</Table.Cell>
                  <Table.Cell>R$ {(printer.depreciationRate ?? 0).toFixed(4)}</Table.Cell>
                  <Table.Cell>{printer.energyKwh}</Table.Cell>
                  <Table.Cell>
                    <HStack gap="1">
                      <PrinterFormDialog printer={printer} />
                      <ConfirmDeleteButton
                        itemLabel={printer.name}
                        onDelete={deletePrinter.bind(null, printer.id)}
                      />
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>

        <ListPagination list={list} total={total} />
      </Stack>
    </DataCard>
  )
}
