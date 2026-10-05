import { redirect } from "next/navigation"

import { listHref, pageCount } from "@/lib/list-params"
import type { ListContext } from "@/components/list/sort-header"

/**
 * Página além da última (ex.: ?page=999, ou a lista encolheu depois de um
 * filtro/exclusão) — redireciona pra última página em vez de mostrar vazio.
 */
export function ensurePageInRange(list: ListContext, total: number) {
  const last = pageCount(total, list.state.pageSize)
  if (list.state.page > last) {
    redirect(listHref(list.pathname, list.state, list.defaults, { page: last }))
  }
}
