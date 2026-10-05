"use client"

import { useState, useTransition } from "react"
import { toast } from "@/components/chakra/toaster"

type ActionState = { error?: string } | null

/**
 * Wires a create/update Server Action (signature `(prevState, formData)`) to a
 * dialog's open state: shows a toast and closes on success, or shows the
 * error and keeps the dialog open. Avoids setState-in-effect by running the
 * action inside a transition instead of through useActionState.
 */
export function useEntityFormAction(
  action: (prevState: null, formData: FormData) => Promise<ActionState>,
  successMessage: string
) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await action(null, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(successMessage)
        setOpen(false)
      }
    })
  }

  return { open, setOpen, pending, handleSubmit }
}
