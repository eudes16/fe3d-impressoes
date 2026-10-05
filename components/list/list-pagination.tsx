import NextLink from "next/link"
import { Button, Flex, HStack, IconButton, Text } from "@chakra-ui/react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { listHref, pageCount } from "@/lib/list-params"
import type { ListContext } from "@/components/list/sort-header"
import { PageSizeSelect } from "@/components/list/page-size-select"

/** Páginas visíveis: primeira, última e vizinhas da atual, com "…" no meio. */
function visiblePages(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | "gap")[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap")
    out.push(p)
  })
  return out
}

export function ListPagination({ list, total }: { list: ListContext; total: number }) {
  const { page, pageSize } = list.state
  const pages = pageCount(total, pageSize)
  const current = Math.min(page, pages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)
  const href = (p: number) => listHref(list.pathname, list.state, list.defaults, { page: p })

  return (
    <Flex align="center" justify="space-between" gap="4" wrap="wrap" pt="4">
      <HStack gap="3">
        <Text textStyle="sm" color="fg.muted">
          {total === 0 ? "Nenhum resultado" : `Mostrando ${from}–${to} de ${total}`}
        </Text>
        <PageSizeSelect value={pageSize} />
      </HStack>

      {pages > 1 ? (
        <HStack gap="1" as="nav" aria-label="Paginação">
          <IconButton
            asChild={current > 1}
            variant="ghost"
            size="sm"
            aria-label="Página anterior"
            disabled={current <= 1}
          >
            {current > 1 ? (
              <NextLink href={href(current - 1)} scroll={false}>
                <ChevronLeft />
              </NextLink>
            ) : (
              <ChevronLeft />
            )}
          </IconButton>
          {visiblePages(current, pages).map((p, i) =>
            p === "gap" ? (
              <Text key={`gap-${i}`} px="1" color="fg.muted">
                …
              </Text>
            ) : (
              <Button
                key={p}
                asChild
                size="sm"
                minW="9"
                variant={p === current ? "solid" : "ghost"}
                aria-current={p === current ? "page" : undefined}
              >
                <NextLink href={href(p)} scroll={false}>
                  {p}
                </NextLink>
              </Button>
            )
          )}
          <IconButton
            asChild={current < pages}
            variant="ghost"
            size="sm"
            aria-label="Próxima página"
            disabled={current >= pages}
          >
            {current < pages ? (
              <NextLink href={href(current + 1)} scroll={false}>
                <ChevronRight />
              </NextLink>
            ) : (
              <ChevronRight />
            )}
          </IconButton>
        </HStack>
      ) : null}
    </Flex>
  )
}
