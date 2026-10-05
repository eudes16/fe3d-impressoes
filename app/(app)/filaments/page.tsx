import { and, asc, count, eq, gte, ilike, isNotNull, lt, or, sql, type SQL } from "drizzle-orm"
import { AlertTriangle } from "lucide-react"
import { Badge, HStack, Stack, Table } from "@chakra-ui/react"
import { db } from "@/db"
import { filaments } from "@/db/schema"
import { deleteFilament } from "@/actions/filaments"
import { FilamentFormDialog } from "@/components/filaments/filament-form-dialog"
import { ConfirmDeleteButton } from "@/components/chakra/confirm-delete-button"
import { DataCard } from "@/components/chakra/data-card"
import { ColorDots } from "@/components/chakra/color-dots"
import { formatBRL } from "@/lib/format"
import { likePattern, parseList, type SearchParams } from "@/lib/list-params"
import { ListToolbar } from "@/components/list/list-toolbar"
import { ListPagination } from "@/components/list/list-pagination"
import { SortHeader, type ListContext } from "@/components/list/sort-header"
import { ensurePageInRange } from "@/components/list/ensure-page"

const LOW_STOCK_RATIO = 0.15
// Mesma regra do alerta da tabela, em SQL, para o filtro de estoque.
const lowStockSql = sql`${filaments.remainingWeightG} < ${filaments.weightKg} * 1000 * ${LOW_STOCK_RATIO}`

const SORTS = ["name", "vendor", "pricePerKg", "stock"] as const
const DEFAULTS = { sort: "name", dir: "asc" } as const
const SORT_COLUMNS = {
  name: filaments.name,
  vendor: filaments.vendor,
  pricePerKg: filaments.pricePerKg,
  stock: filaments.remainingWeightG,
}

export default async function FilamentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const state = parseList(await searchParams, {
    sorts: SORTS,
    defaultSort: DEFAULTS.sort,
    defaultDir: DEFAULTS.dir,
    filters: ["type", "category", "stock"],
  })
  const list: ListContext = { pathname: "/filaments", state, defaults: DEFAULTS }

  const conditions: SQL[] = []
  if (state.q) {
    const pattern = likePattern(state.q)
    conditions.push(
      or(
        ilike(filaments.name, pattern),
        ilike(filaments.vendor, pattern),
        ilike(filaments.materialType, pattern)
      )!
    )
  }
  if (state.filters.type) conditions.push(eq(filaments.materialType, state.filters.type))
  if (state.filters.category) conditions.push(eq(filaments.category, state.filters.category))
  if (state.filters.stock === "low") conditions.push(lowStockSql)
  if (state.filters.stock === "ok") {
    conditions.push(gte(filaments.remainingWeightG, sql`${filaments.weightKg} * 1000 * ${LOW_STOCK_RATIO}`))
  }
  if (state.filters.stock === "empty") conditions.push(lt(filaments.remainingWeightG, 1))
  const where = conditions.length ? and(...conditions) : undefined
  const column = SORT_COLUMNS[state.sort]

  const [rows, [{ total }], types, categories] = await Promise.all([
    db
      .select()
      .from(filaments)
      .where(where)
      .orderBy(
        state.dir === "asc" ? sql`${column} asc nulls last` : sql`${column} desc nulls last`,
        asc(filaments.name),
        asc(filaments.id)
      )
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    db.select({ total: count() }).from(filaments).where(where),
    db
      .selectDistinct({ value: filaments.materialType })
      .from(filaments)
      .where(isNotNull(filaments.materialType))
      .orderBy(asc(filaments.materialType)),
    db
      .selectDistinct({ value: filaments.category })
      .from(filaments)
      .where(isNotNull(filaments.category))
      .orderBy(asc(filaments.category)),
  ])
  ensurePageInRange(list, total)

  const toOptions = (values: { value: string | null }[]) =>
    values.filter((v) => v.value).map((v) => ({ value: v.value!, label: v.value! }))

  return (
    <DataCard
      title="Bobinas de filamento"
      description="Cada linha é uma bobina física — cole o UUID (id) nas notas do filamento no fatiador para vincular ao importar o .3mf/.gcode."
      actions={<FilamentFormDialog />}
    >
      <Stack gap="4">
        <ListToolbar
          searchPlaceholder="Buscar por nome, fabricante ou tipo..."
          filters={[
            { key: "type", label: "Todos os tipos", options: toOptions(types) },
            { key: "category", label: "Todas as categorias", options: toOptions(categories) },
            {
              key: "stock",
              label: "Qualquer estoque",
              options: [
                { value: "low", label: "Estoque baixo" },
                { value: "empty", label: "Sem estoque" },
                { value: "ok", label: "Estoque ok" },
              ],
            },
          ]}
        />

        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="transparent">
              <SortHeader list={list} sortKey="name">Nome</SortHeader>
              <SortHeader list={list} sortKey="vendor">Fabricante / Tipo</SortHeader>
              <Table.ColumnHeader>Categoria / Cores</Table.ColumnHeader>
              <SortHeader list={list} sortKey="pricePerKg" firstDir="desc">R$/kg</SortHeader>
              <SortHeader list={list} sortKey="stock">Estoque</SortHeader>
              <Table.ColumnHeader w="1" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.length === 0 ? (
              <Table.Row bg="transparent">
                <Table.Cell colSpan={6} textAlign="center" color="fg.muted">
                  {where ? "Nenhum filamento encontrado com esses filtros." : "Nenhum filamento cadastrado."}
                </Table.Cell>
              </Table.Row>
            ) : (
              rows.map((filament) => {
                const lowStock =
                  filament.remainingWeightG < filament.weightKg * 1000 * LOW_STOCK_RATIO
                return (
                  <Table.Row key={filament.id} bg="transparent">
                    <Table.Cell fontWeight="semibold">{filament.name}</Table.Cell>
                    <Table.Cell color="fg.muted">
                      {[filament.vendor, filament.materialType].filter(Boolean).join(" · ") || "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap="2">
                        {filament.category ? (
                          <Badge variant="outline" colorPalette="gray">
                            {filament.category}
                          </Badge>
                        ) : null}
                        <ColorDots colors={filament.colors} />
                      </HStack>
                    </Table.Cell>
                    <Table.Cell>{formatBRL(filament.pricePerKg ?? 0)}</Table.Cell>
                    <Table.Cell>
                      <HStack gap="1.5">
                        {filament.remainingWeightG.toFixed(0)} g
                        {lowStock ? (
                          <Badge colorPalette="orange" variant="subtle">
                            <AlertTriangle size={12} />
                            baixo
                          </Badge>
                        ) : null}
                      </HStack>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap="1">
                        <FilamentFormDialog filament={filament} />
                        <ConfirmDeleteButton
                          itemLabel={filament.name}
                          onDelete={deleteFilament.bind(null, filament.id)}
                        />
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            )}
          </Table.Body>
        </Table.Root>

        <ListPagination list={list} total={total} />
      </Stack>
    </DataCard>
  )
}
