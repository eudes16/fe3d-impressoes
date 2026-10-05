"use client"

import { useRouter } from "next/navigation"
import { Button, HStack, Separator } from "@chakra-ui/react"
import { FileText } from "lucide-react"

import { deleteQuote } from "@/actions/quotes"
import { ConfirmDeleteButton } from "@/components/chakra/confirm-delete-button"
import { QuoteStatusButtons } from "@/components/quotes/quote-status-control"
import type { QuoteStatus } from "@/lib/quote-status"

export function QuoteActions({
  quoteId,
  status,
}: {
  quoteId: string
  status: QuoteStatus
}) {
  const router = useRouter()

  return (
    <HStack gap="2" wrap="wrap">
      <QuoteStatusButtons quoteId={quoteId} status={status} />
      <Separator orientation="vertical" h="6" mx="1" />
      <Button variant="outline" size="sm" asChild>
        <a
          href={`/api/quotes/${quoteId}/pdf?variant=client`}
          target="_blank"
          rel="noreferrer"
        >
          <FileText />
          PDF cliente
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href={`/api/quotes/${quoteId}/pdf?variant=production`}
          target="_blank"
          rel="noreferrer"
        >
          <FileText />
          PDF produção
        </a>
      </Button>
      <ConfirmDeleteButton
        itemLabel="orçamento"
        onDelete={async () => {
          await deleteQuote(quoteId)
          router.push("/quotes")
        }}
      />
    </HStack>
  )
}
