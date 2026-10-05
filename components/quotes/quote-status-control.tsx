"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Badge,
  Button,
  CloseButton,
  Dialog,
  HStack,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react"
import { ArrowLeft, ArrowRight, Ban, EllipsisVertical } from "lucide-react"

import { changeQuoteStatus } from "@/actions/quotes"
import { toast } from "@/components/chakra/toaster"
import { FormField } from "@/components/chakra/entity-form-dialog"
import {
  REJECTION_REASON_MIN,
  STATUS_TRANSITIONS,
  nextStatus,
  previousStatus,
  transitionLabel,
  type QuoteStatus,
} from "@/lib/quote-status"
import { quoteStatusLabels, quoteStatusPalette } from "@/lib/validation/quote"

function transitionDescription(from: QuoteStatus, to: QuoteStatus) {
  switch (to) {
    case "in_production":
      return "O estoque de filamentos e consumíveis deste orçamento será baixado. Depois disso ele só poderá ir para Concluído."
    case "completed":
      return "Concluído é um status final — não será possível alterar depois."
    case "rejected":
      return "Rejeitado é um status final — não será possível alterar depois."
    default:
      return `O orçamento passará de "${quoteStatusLabels[from]}" para "${quoteStatusLabels[to]}".`
  }
}

/** Confirmação de mudança de status (com motivo obrigatório ao rejeitar). */
function StatusChangeDialog({
  quoteId,
  from,
  to,
  onClose,
}: {
  quoteId: string
  from: QuoteStatus
  to: QuoteStatus | null
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [reason, setReason] = useState("")
  const [reasonError, setReasonError] = useState<string | null>(null)

  const rejecting = to === "rejected"

  function close() {
    setReason("")
    setReasonError(null)
    onClose()
  }

  function confirm() {
    if (!to) return
    if (rejecting && reason.trim().length < REJECTION_REASON_MIN) {
      setReasonError("Informe o motivo da rejeição.")
      return
    }
    startTransition(async () => {
      const result = await changeQuoteStatus(quoteId, to, rejecting ? reason : undefined)
      if (result.error) {
        toast.error(result.error)
        return
      }
      result.warnings?.forEach((w) => toast.warning(w))
      toast.success(`Status alterado para "${quoteStatusLabels[to]}".`)
      close()
      router.refresh()
    })
  }

  return (
    <Dialog.Root
      role="alertdialog"
      open={to !== null}
      onOpenChange={(e) => {
        if (!e.open && !pending) close()
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {to ? (
              <>
                <Dialog.Header>
                  <Dialog.Title>{transitionLabel(from, to)}?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap="4">
                    <HStack gap="2" textStyle="sm">
                      <Badge colorPalette={quoteStatusPalette[from]} variant="subtle">
                        {quoteStatusLabels[from]}
                      </Badge>
                      <ArrowRight size={14} />
                      <Badge colorPalette={quoteStatusPalette[to]} variant="subtle">
                        {quoteStatusLabels[to]}
                      </Badge>
                    </HStack>
                    <Text color="fg.muted" textStyle="sm">
                      {transitionDescription(from, to)}
                    </Text>
                    {rejecting ? (
                      <FormField label="Motivo da rejeição" required errorText={reasonError}>
                        <Textarea
                          value={reason}
                          onChange={(e) => {
                            setReason(e.target.value)
                            if (reasonError) setReasonError(null)
                          }}
                          placeholder="Ex.: cliente achou o valor alto"
                          autoFocus
                        />
                      </FormField>
                    ) : null}
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={close} disabled={pending}>
                    Cancelar
                  </Button>
                  <Button
                    colorPalette={rejecting ? "red" : undefined}
                    loading={pending}
                    onClick={confirm}
                  >
                    {rejecting ? "Rejeitar orçamento" : "Confirmar"}
                  </Button>
                </Dialog.Footer>
              </>
            ) : null}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" disabled={pending} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

/** Botões Voltar / Rejeitar / Avançar — tela de detalhes do orçamento. */
export function QuoteStatusButtons({
  quoteId,
  status,
}: {
  quoteId: string
  status: QuoteStatus
}) {
  const [target, setTarget] = useState<QuoteStatus | null>(null)
  const prev = previousStatus(status)
  const next = nextStatus(status)
  const canReject = STATUS_TRANSITIONS[status].includes("rejected")

  if (!prev && !next && !canReject) return null

  return (
    <>
      {prev ? (
        <Button variant="outline" size="sm" onClick={() => setTarget(prev)}>
          <ArrowLeft />
          {transitionLabel(status, prev)}
        </Button>
      ) : null}
      {canReject ? (
        <Button
          variant="outline"
          size="sm"
          colorPalette="red"
          onClick={() => setTarget("rejected")}
        >
          <Ban />
          Rejeitar
        </Button>
      ) : null}
      {next ? (
        <Button size="sm" onClick={() => setTarget(next)}>
          {transitionLabel(status, next)}
          <ArrowRight />
        </Button>
      ) : null}
      <StatusChangeDialog
        quoteId={quoteId}
        from={status}
        to={target}
        onClose={() => setTarget(null)}
      />
    </>
  )
}

/** Menu "⋮" com as transições permitidas — linha da listagem. */
export function QuoteStatusMenu({
  quoteId,
  status,
}: {
  quoteId: string
  status: QuoteStatus
}) {
  const [target, setTarget] = useState<QuoteStatus | null>(null)
  const next = nextStatus(status)
  const prev = previousStatus(status)
  const canReject = STATUS_TRANSITIONS[status].includes("rejected")
  const options = [next, prev].filter((s): s is QuoteStatus => s !== null)

  if (options.length === 0 && !canReject) return null

  return (
    <>
      <Menu.Root positioning={{ placement: "bottom-end" }}>
        <Menu.Trigger asChild>
          <IconButton variant="ghost" size="sm" aria-label="Mudar status">
            <EllipsisVertical />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="52">
              {options.map((to) => (
                <Menu.Item key={to} value={to} onSelect={() => setTarget(to)}>
                  {to === prev ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  {transitionLabel(status, to)}
                </Menu.Item>
              ))}
              {canReject ? (
                <>
                  {options.length > 0 ? <Menu.Separator /> : null}
                  <Menu.Item
                    value="rejected"
                    color="fg.error"
                    onSelect={() => setTarget("rejected")}
                  >
                    <Ban size={14} />
                    Rejeitar
                  </Menu.Item>
                </>
              ) : null}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <StatusChangeDialog
        quoteId={quoteId}
        from={status}
        to={target}
        onClose={() => setTarget(null)}
      />
    </>
  )
}
