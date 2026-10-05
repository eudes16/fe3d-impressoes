import { quoteStatusLabels, quoteStatusValues } from "@/lib/validation/quote"

export type QuoteStatus = (typeof quoteStatusValues)[number]

// Fluxo principal, na ordem. "Rejeitado" fica fora: é uma saída lateral.
const FLOW: QuoteStatus[] = ["draft", "sent", "approved", "in_production", "completed"]

/**
 * Transições permitidas a partir de cada status. Regras:
 * - avança um passo no fluxo; volta um passo só antes da produção;
 * - "Em produção" só vai para "Concluído" (o estoque já foi baixado);
 * - "Concluído" e "Rejeitado" são finais;
 * - dá pra rejeitar enquanto não entrou em produção.
 */
export const STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent", "rejected"],
  sent: ["approved", "draft", "rejected"],
  approved: ["in_production", "sent", "rejected"],
  in_production: ["completed"],
  completed: [],
  rejected: [],
}

export function canTransition(from: QuoteStatus, to: QuoteStatus) {
  return STATUS_TRANSITIONS[from].includes(to)
}

export function isFinalStatus(status: QuoteStatus) {
  return STATUS_TRANSITIONS[status].length === 0
}

/** Próximo passo do fluxo, se a transição for permitida. */
export function nextStatus(status: QuoteStatus): QuoteStatus | null {
  const next = FLOW[FLOW.indexOf(status) + 1]
  return next && canTransition(status, next) ? next : null
}

/** Passo anterior do fluxo, se a transição for permitida. */
export function previousStatus(status: QuoteStatus): QuoteStatus | null {
  const i = FLOW.indexOf(status)
  const prev = i > 0 ? FLOW[i - 1] : undefined
  return prev && canTransition(status, prev) ? prev : null
}

/** Texto do botão/menu para cada transição. */
export function transitionLabel(from: QuoteStatus, to: QuoteStatus) {
  if (to === "rejected") return "Rejeitar"
  if (to === "in_production") return "Iniciar produção"
  if (to === previousStatus(from)) return `Voltar para ${quoteStatusLabels[to]}`
  return `Marcar como ${quoteStatusLabels[to]}`
}

export const REJECTION_REASON_MIN = 3
