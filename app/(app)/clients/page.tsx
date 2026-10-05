import { asc, count, desc, ilike, or } from "drizzle-orm"
import { HStack, Stack, Table } from "@chakra-ui/react"
import { db } from "@/db"
import { clients } from "@/db/schema"
import { deleteClient } from "@/actions/clients"
import { ClientFormDialog } from "@/components/clients/client-form-dialog"
import { ConfirmDeleteButton } from "@/components/chakra/confirm-delete-button"
import { DataCard } from "@/components/chakra/data-card"
import { likePattern, parseList, type SearchParams } from "@/lib/list-params"
import { ListToolbar } from "@/components/list/list-toolbar"
import { ListPagination } from "@/components/list/list-pagination"
import { SortHeader, type ListContext } from "@/components/list/sort-header"
import { ensurePageInRange } from "@/components/list/ensure-page"

const SORTS = ["name", "createdAt"] as const
const DEFAULTS = { sort: "createdAt", dir: "desc" } as const
const SORT_COLUMNS = { name: clients.name, createdAt: clients.createdAt }

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const state = parseList(await searchParams, {
    sorts: SORTS,
    defaultSort: DEFAULTS.sort,
    defaultDir: DEFAULTS.dir,
  })
  const list: ListContext = { pathname: "/clients", state, defaults: DEFAULTS }

  const pattern = likePattern(state.q)
  const where = state.q
    ? or(
        ilike(clients.name, pattern),
        ilike(clients.email, pattern),
        ilike(clients.phone, pattern)
      )
    : undefined
  const column = SORT_COLUMNS[state.sort]

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(clients)
      .where(where)
      .orderBy(state.dir === "asc" ? asc(column) : desc(column), asc(clients.id))
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    db.select({ total: count() }).from(clients).where(where),
  ])
  ensurePageInRange(list, total)

  return (
    <DataCard
      title="Lista de clientes"
      description="Cadastro de clientes da empresa."
      actions={<ClientFormDialog />}
    >
      <Stack gap="4">
        <ListToolbar searchPlaceholder="Buscar por nome, e-mail ou telefone..." />

        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="transparent">
              <SortHeader list={list} sortKey="name">Nome</SortHeader>
              <Table.ColumnHeader>Contato</Table.ColumnHeader>
              <Table.ColumnHeader>Endereço</Table.ColumnHeader>
              <SortHeader list={list} sortKey="createdAt" firstDir="desc">
                Cadastro
              </SortHeader>
              <Table.ColumnHeader w="1" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.length === 0 ? (
              <Table.Row bg="transparent">
                <Table.Cell colSpan={5} textAlign="center" color="fg.muted">
                  {where ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
                </Table.Cell>
              </Table.Row>
            ) : (
              rows.map((client) => (
                <Table.Row key={client.id} bg="transparent">
                  <Table.Cell fontWeight="semibold">{client.name}</Table.Cell>
                  <Table.Cell color="fg.muted">
                    {[client.email, client.phone].filter(Boolean).join(" · ") || "—"}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">{client.address || "—"}</Table.Cell>
                  <Table.Cell color="fg.muted">
                    {client.createdAt.toLocaleDateString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap="1">
                      <ClientFormDialog client={client} />
                      <ConfirmDeleteButton
                        itemLabel={client.name}
                        onDelete={deleteClient.bind(null, client.id)}
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
