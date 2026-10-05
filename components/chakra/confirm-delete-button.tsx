"use client"

import { useState, useTransition } from "react"
import { Button, CloseButton, Dialog, IconButton, Portal } from "@chakra-ui/react"
import { Trash2 } from "lucide-react"
import { toast } from "@/components/chakra/toaster"

// Versão Chakra de components/confirm-delete-button.tsx (piloto da migração).
export function ConfirmDeleteButton({
  onDelete,
  itemLabel,
}: {
  onDelete: () => Promise<void>
  itemLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await onDelete()
        toast.success(`${itemLabel} excluído.`)
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao excluir.")
      }
    })
  }

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="center"
    >
      <Dialog.Trigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          colorPalette="red"
          aria-label={`Excluir ${itemLabel}`}
        >
          <Trash2 />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Excluir {itemLabel}?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body color="fg.muted">
              Esta ação não pode ser desfeita.
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="red"
                loading={pending}
                onClick={handleDelete}
              >
                Excluir
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
