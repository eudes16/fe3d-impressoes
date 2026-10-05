"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Box, Button, Flex, Input, InputGroup, Spinner } from "@chakra-ui/react"
import { Search, X } from "lucide-react"

import { SimpleSelect } from "@/components/chakra/simple-select"

export type ListFilter = {
  key: string
  label: string
  options: { value: string; label: string }[]
}

const ALL = "__all__"

/** Atualiza parâmetros da URL (e volta pra página 1). */
export function useListNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function update(changes: Record<string, string | null>, { resetPage = true } = {}) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key)
      else params.set(key, value)
    }
    if (resetPage) params.delete("page")
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  return { searchParams, update, pending }
}

export function ListToolbar({
  searchPlaceholder = "Buscar...",
  filters = [],
}: {
  searchPlaceholder?: string
  filters?: ListFilter[]
}) {
  const { searchParams, update, pending } = useListNavigation()
  const urlQuery = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(urlQuery)
  const lastSent = useRef(urlQuery)

  // Busca com debounce: só navega 300ms depois de parar de digitar.
  useEffect(() => {
    if (query === lastSent.current) return
    const t = setTimeout(() => {
      lastSent.current = query
      update({ q: query.trim() || null })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- update muda a cada render
  }, [query])

  const hasActive = !!urlQuery || filters.some((f) => searchParams.get(f.key))

  function clearAll() {
    lastSent.current = ""
    setQuery("")
    update(Object.fromEntries([["q", null], ...filters.map((f) => [f.key, null])]))
  }

  return (
    <Flex gap="3" wrap="wrap" align="center">
      <InputGroup
        flex="1"
        minW="56"
        maxW="sm"
        startElement={<Search size={16} />}
        endElement={pending ? <Spinner size="xs" /> : undefined}
      >
        <Input
          size="sm"
          rounded="full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </InputGroup>
      {filters.map((f) => (
        <Box key={f.key} w="48">
          <SimpleSelect
            items={[{ value: ALL, label: f.label }, ...f.options]}
            value={searchParams.get(f.key) ?? ALL}
            onValueChange={(v) => update({ [f.key]: v === ALL ? null : v })}
          />
        </Box>
      ))}
      {hasActive ? (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X />
          Limpar filtros
        </Button>
      ) : null}
    </Flex>
  )
}
