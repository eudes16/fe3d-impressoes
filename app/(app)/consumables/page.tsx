import { and, asc, count, eq, gt, ilike, isNotNull, lte, sql, type SQL } from "drizzle-orm"
import { AlertTriangle } from "lucide-react"
import { Badge, HStack, Stack, Table } from "@chakra-ui/react"
import { db } from "@/db"
import { consumables } from "@/db/schema"
import { deleteConsumable } from "@/actions/consumables"
import { ConsumableFormDialog } from "@/components/consumables/consumable-form-dialog"
import { ConfirmDeleteButton } from "@/components/chakra/confirm-delete-button"
import { DataCard } from "@/components/chakra/data-card"
import { formatBRL } from "@/lib/format"
import { likePattern, parseList, type SearchParams } from "@/lib/list-params"
import { ListToolbar } from "@/components/list/list-toolbar"
import { ListPagination } from "@/components/list/list-pagination"
import { SortHeader, type ListContext } from "@/components/list/sort-header"
import { ensurePageInRange } from "@/components/list/ensure-page"

const SORTS = ["name", "category", "unitPrice", "stock"] as const
const DEFAULTS = { sort: "name", dir: "asc" } as const
const SORT_COLUMNS = {
  name: consumables.name,
  category: consumables.category,
  unitPrice: consumables.unitPrice,
  stock: consumables.quantity,
}

export default async function ConsumablesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const state = parseList(await searchParams, {
    sorts: SORTS,
    defaultSort: DEFAULTS.sort,
    defaultDir: DEFAULTS.dir,
    filters: ["category", "stock"],
  })
  const list: ListContext = { pathname: "/consumables", state, defaults: DEFAULTS }

  const conditions: SQL[] = []
  if (state.q) conditions.push(ilike(consumables.name, likePattern(state.q)))
  if (state.filters.category) conditions.push(eq(consumables.category, state.filters.category))
  if (state.filters.stock === "empty") conditions.push(lte(consumables.quantity, 0))
  if (state.filters.stock === "available") conditions.push(gt(consumables.quantity, 0))
  const where = conditions.length ? and(...conditions) : undefined
  const column = SORT_COLUMNS[state.sort]

  const [rows, [{ total }], categories] = await Promise.all([
    db
      .select()
      .from(consumables)
      .where(where)
      .orderBy(
        state.dir === "asc" ? sql`${column} asc nulls last` : sql`${column} desc nulls last`,
        asc(consumables.name),
        asc(consumables.id)
      )
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    db.select({ total: count() }).from(consumables).where(where),
    db
      .selectDistinct({ value: consumables.category })
      .from(consumables)
      .where(isNotNull(consumables.category))
      .orderBy(asc(consumables.category)),
  ])
  ensurePageInRange(list, total)

  return (
    <DataCard
      title="Itens consumíveis"
      description="Chaveiros, luminárias e outros itens usados em orçamentos."
      actions={<ConsumableFormDialog />}
    >
      <Stack gap="4">
        <ListToolbar
          searchPlaceholder="Buscar por nome..."
          filters={[
            {
              key: "category",
              label: "Todas as categorias",
              options: categories
                .filter((c) => c.value)
                .map((c) => ({ value: c.value!, label: c.value! })),
            },
            {
              key: "stock",
              label: "Qualquer estoque",
              options: [
                { value: "available", label: "Disponível" },
                { value: "empty", label: "Esgotado" },
              ],
            },
          ]}
        />

        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="transparent">
              <SortHeader list={list} sortKey="name">Nome</SortHeader>
              <SortHeader list={list} sortKey="category">Categoria</SortHeader>
              <SortHeader list={list} sortKey="unitPrice" firstDir="desc">Preço unit.</SortHeader>
              <SortHeader list={list} sortKey="stock">Estoque</SortHeader>
              <Table.ColumnHeader w="1" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.length === 0 ? (
              <Table.Row bg="transparent">
                <Table.Cell colSpan={5} textAlign="center" color="fg.muted">
                  {where ? "Nenhum consumível encontrado com esses filtros." : "Nenhum consumível cadastrado."}
                </Table.Cell>
              </Table.Row>
            ) : (
              rows.map((c) => (
                <Table.Row key={c.id} bg="transparent">
                  <Table.Cell fontWeight="semibold">{c.name}</Table.Cell>
                  <Table.Cell color="fg.muted">{c.category || "—"}</Table.Cell>
                  <Table.Cell>{formatBRL(c.unitPrice)}</Table.Cell>
                  <Table.Cell>
                    <HStack gap="1.5">
                      {c.quantity} {c.unit}
                      {c.quantity <= 0 ? (
                        <Badge colorPalette="orange" variant="subtle">
                          <AlertTriangle size={12} />
                          esgotado
                        </Badge>
                      ) : null}
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap="1">
                      <ConsumableFormDialog consumable={c} />
                      <ConfirmDeleteButton
                        itemLabel={c.name}
                        onDelete={deleteConsumable.bind(null, c.id)}
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
