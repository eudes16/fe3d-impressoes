"use client"

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react"

export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
})

// Mesma API que o `toast` do sonner usava (toast.success("...") etc.), pra
// migração só trocar o import nas chamadas.
export const toast = {
  success: (title: string) => toaster.create({ type: "success", title }),
  error: (title: string) => toaster.create({ type: "error", title }),
  info: (title: string) => toaster.create({ type: "info", title }),
  warning: (title: string) => toaster.create({ type: "warning", title }),
}

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }}>
            {toast.type === "loading" ? (
              <Spinner size="sm" color="brand.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
