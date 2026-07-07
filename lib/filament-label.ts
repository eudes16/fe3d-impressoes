// "MARCA - CATEGORIA - COR" (o formato que o usuário pediu), caindo pro
// nome cadastrado quando os campos estruturados não estiverem preenchidos.
export function filamentLabel(f: {
  vendor: string | null
  category: string | null
  colors: string[]
  name: string
}) {
  const parts = [f.name, f.vendor, f.category, f.colors[0]].filter(Boolean)
  return parts.length > 0 ? parts.join(" - ") : f.name
}

export function consumableLabel(c: { category: string | null; name: string }) {
  return c.category ? `${c.category} - ${c.name}` : c.name
}
