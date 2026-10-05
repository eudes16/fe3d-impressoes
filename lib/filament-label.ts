import { formatBRL } from "@/lib/format"

type FilamentLike = {
  id: string
  vendor: string | null
  category: string | null
  colors: string[]
  name: string
  pricePerKg: number | null
}

// "NOME - MARCA - CATEGORIA". A cor não entra no texto — nos selects ela
// aparece como círculos (ver filamentSelectItem).
export function filamentLabel(f: Pick<FilamentLike, "name" | "vendor" | "category">) {
  return [f.name, f.vendor, f.category].filter(Boolean).join(" - ")
}

/** Item de SimpleSelect: rótulo + círculos de cor + preço por kg. */
export function filamentSelectItem(f: FilamentLike) {
  return {
    value: f.id,
    label: filamentLabel(f),
    colors: f.colors,
    hint: f.pricePerKg != null ? `${formatBRL(f.pricePerKg)}/kg` : undefined,
  }
}

export function consumableLabel(c: { category: string | null; name: string }) {
  return c.category ? `${c.category} - ${c.name}` : c.name
}
