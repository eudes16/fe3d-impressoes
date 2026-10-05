/**
 * Estado das listagens (busca, filtros, ordenação, paginação) vive na URL:
 * ?q=...&sort=name&dir=asc&page=2&size=20&<filtro>=... — a página (server
 * component) lê daqui e o banco devolve só a página atual.
 */
export type SearchParams = Record<string, string | string[] | undefined>

export type SortDir = "asc" | "desc"

export const PAGE_SIZES = [10, 20, 50] as const
export const DEFAULT_PAGE_SIZE = 20

export type ListState<S extends string = string, F extends string = string> = {
  q: string
  page: number
  pageSize: number
  sort: S
  dir: SortDir
  filters: Partial<Record<F, string>>
}

export type ListConfig<S extends string, F extends string> = {
  sorts: readonly S[]
  defaultSort: S
  defaultDir: SortDir
  filters?: readonly F[]
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function parseList<S extends string, F extends string = never>(
  sp: SearchParams,
  config: ListConfig<S, F>
): ListState<S, F> {
  const sortParam = first(sp.sort)
  const sort = config.sorts.includes(sortParam as S) ? (sortParam as S) : config.defaultSort
  const dirParam = first(sp.dir)
  const dir: SortDir = dirParam === "asc" || dirParam === "desc" ? dirParam : config.defaultDir

  const sizeParam = Number(first(sp.size))
  const pageSize = (PAGE_SIZES as readonly number[]).includes(sizeParam)
    ? sizeParam
    : DEFAULT_PAGE_SIZE
  const pageParam = Math.floor(Number(first(sp.page)))
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const filters: Partial<Record<F, string>> = {}
  for (const key of config.filters ?? []) {
    const value = first(sp[key])?.trim()
    if (value) filters[key] = value
  }

  return { q: first(sp.q)?.trim() ?? "", page, pageSize, sort, dir, filters }
}

/**
 * URL da listagem com o estado atual + alterações. Só grava o que difere do
 * padrão, pra URL ficar curta. Valores vazios removem o parâmetro.
 */
export function listHref(
  pathname: string,
  state: ListState,
  defaults: { sort: string; dir: SortDir },
  changes: Partial<Record<string, string | number | null>> = {}
) {
  const merged: Record<string, string | number | null | undefined> = {
    q: state.q,
    sort: state.sort,
    dir: state.dir,
    page: state.page,
    size: state.pageSize,
    ...state.filters,
    ...changes,
  }
  const params = new URLSearchParams()
  for (const [key, raw] of Object.entries(merged)) {
    if (raw === null || raw === undefined || raw === "") continue
    const value = String(raw)
    if (key === "page" && value === "1") continue
    if (key === "size" && value === String(DEFAULT_PAGE_SIZE)) continue
    if (key === "sort" && value === defaults.sort) continue
    if (key === "dir" && value === defaults.dir && merged.sort === defaults.sort) continue
    params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

/** Escapa % e _ para usar o termo de busca dentro de um ILIKE. */
export function likePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Filtros por id vêm da URL — valida antes de comparar com coluna uuid. */
export function isUuid(value: string | undefined): value is string {
  return !!value && UUID_RE.test(value)
}
