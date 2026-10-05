"use client"

import { Button, CloseButton, Dialog, Field, Portal } from "@chakra-ui/react"
import { Plus } from "lucide-react"

/**
 * Diálogo de criar/editar usado pelos cadastros (clientes, impressoras...).
 * O trigger é "Editar" (ghost) quando `editing`, ou "+ {createLabel}" — ou
 * um `trigger` próprio.
 * Os campos vêm como children; o <form> envia para `onSubmit` (Server Action
 * via useEntityFormAction).
 */
export function EntityFormDialog({
  editing,
  createLabel,
  title,
  open,
  onOpenChange,
  pending,
  onSubmit,
  size = "md",
  trigger,
  description,
  submitLabel = "Salvar",
  pendingLabel = "Salvando...",
  children,
}: {
  editing: boolean
  createLabel: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onSubmit: (formData: FormData) => void
  size?: "sm" | "md" | "lg" | "xl"
  trigger?: React.ReactNode
  description?: React.ReactNode
  submitLabel?: string
  pendingLabel?: string
  children: React.ReactNode
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
      size={size}
      scrollBehavior="inside"
    >
      <Dialog.Trigger asChild>
        {trigger ?? (editing ? (
          <Button variant="ghost" size="sm">
            Editar
          </Button>
        ) : (
          <Button size="sm">
            <Plus />
            {createLabel}
          </Button>
        ))}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <form action={onSubmit} style={{ display: "contents" }}>
              <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description>{description}</Dialog.Description>
                ) : null}
              </Dialog.Header>
              <Dialog.Body display="flex" flexDirection="column" gap="4">
                {children}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Cancelar</Button>
                </Dialog.ActionTrigger>
                <Button type="submit" loading={pending} loadingText={pendingLabel}>
                  {submitLabel}
                </Button>
              </Dialog.Footer>
            </form>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

/** Label + controle + texto de ajuda/erro opcional. */
export function FormField({
  label,
  required,
  helperText,
  errorText,
  children,
  ...rest
}: {
  label: React.ReactNode
  required?: boolean
  helperText?: React.ReactNode
  errorText?: React.ReactNode
  children: React.ReactNode
} & Omit<Field.RootProps, "children" | "required">) {
  return (
    <Field.Root required={required} invalid={!!errorText} {...rest}>
      <Field.Label>
        {label}
        <Field.RequiredIndicator />
      </Field.Label>
      {children}
      {helperText ? <Field.HelperText>{helperText}</Field.HelperText> : null}
      {errorText ? <Field.ErrorText>{errorText}</Field.ErrorText> : null}
    </Field.Root>
  )
}
