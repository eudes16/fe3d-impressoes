import NextLink from "next/link"
import { HStack, Table } from "@chakra-ui/react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { listHref, type ListState, type SortDir } from "@/lib/list-params"

/** Contexto que a página passa pros cabeçalhos ordenáveis e pra paginação. */
export type ListContext = {
  pathname: string
  state: ListState
  defaults: { sort: string; dir: SortDir }
}

/**
 * Cabeçalho de coluna que ordena pela coluna ao clicar; clicar de novo
 * inverte a direção. `firstDir` é a direção do primeiro clique (ex.: "desc"
 * para valores/datas, onde o maior primeiro é o mais útil).
 */
export function SortHeader({
  list,
  sortKey,
  firstDir = "asc",
  children,
  ...props
}: {
  list: ListContext
  sortKey: string
  firstDir?: SortDir
  children: React.ReactNode
} & Omit<Table.ColumnHeaderProps, "children">) {
  const active = list.state.sort === sortKey
  const nextDir: SortDir = active ? (list.state.dir === "asc" ? "desc" : "asc") : firstDir
  const href = listHref(list.pathname, list.state, list.defaults, {
    sort: sortKey,
    dir: nextDir,
    page: 1,
  })
  const Icon = !active ? ArrowUpDown : list.state.dir === "asc" ? ArrowUp : ArrowDown

  return (
    <Table.ColumnHeader
      {...props}
      aria-sort={active ? (list.state.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <NextLink href={href} scroll={false}>
        <HStack
          as="span"
          gap="1"
          display="inline-flex"
          color={active ? "fg" : undefined}
          _hover={{ color: "fg" }}
        >
          {children}
          <Icon size={12} opacity={active ? 1 : 0.5} />
        </HStack>
      </NextLink>
    </Table.ColumnHeader>
  )
}
