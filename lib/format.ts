const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
})

/** R$ 1.234,56 */
export const formatBRL = (n: number) => brl.format(n)

/** R$ 1,2 mil — para eixos e números de destaque. */
export const formatBRLCompact = (n: number) => brlCompact.format(n)
