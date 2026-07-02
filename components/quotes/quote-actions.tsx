"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Factory } from "lucide-react"

import { confirmProduction, deleteQuote } from "@/actions/quotes"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"

export function QuoteActions({
  quoteId,
  status,
}: {
  quoteId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const canConfirmProduction = status !== "in_production" && status !== "completed"

  return (
    <div className="flex items-center gap-2">
      {canConfirmProduction ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                const { warnings } = await confirmProduction(quoteId)
                warnings.forEach((w) => toast.warning(w))
                toast.success("Estoque baixado e orçamento em produção.")
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erro.")
              }
            })
          }
        >
          <Factory className="size-4" />
          Confirmar produção
        </Button>
      ) : null}
      <ConfirmDeleteButton
        itemLabel="orçamento"
        onDelete={async () => {
          await deleteQuote(quoteId)
          router.push("/quotes")
        }}
      />
    </div>
  )
}
