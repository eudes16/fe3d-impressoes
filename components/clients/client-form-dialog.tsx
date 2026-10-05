"use client"

import { Input, SimpleGrid, Textarea } from "@chakra-ui/react"

import { createClientRecord, updateClient } from "@/actions/clients"
import { useEntityFormAction } from "@/lib/hooks/use-entity-form-action"
import { EntityFormDialog, FormField } from "@/components/chakra/entity-form-dialog"
import type { clients } from "@/db/schema"

type Client = typeof clients.$inferSelect

export function ClientFormDialog({ client }: { client?: Client }) {
  const action = client
    ? updateClient.bind(null, client.id)
    : createClientRecord
  const { open, setOpen, pending, handleSubmit } = useEntityFormAction(
    action,
    client ? "Cliente atualizado." : "Cliente criado."
  )

  return (
    <EntityFormDialog
      editing={!!client}
      createLabel="Novo cliente"
      title={client ? "Editar cliente" : "Novo cliente"}
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      onSubmit={handleSubmit}
    >
      <FormField label="Nome" required>
        <Input name="name" defaultValue={client?.name} />
      </FormField>
      <SimpleGrid columns={2} gap="4">
        <FormField label="E-mail">
          <Input name="email" type="email" defaultValue={client?.email ?? ""} />
        </FormField>
        <FormField label="Telefone">
          <Input name="phone" defaultValue={client?.phone ?? ""} />
        </FormField>
      </SimpleGrid>
      <FormField label="Endereço">
        <Input name="address" defaultValue={client?.address ?? ""} />
      </FormField>
      <FormField label="Notas">
        <Textarea name="notes" defaultValue={client?.notes ?? ""} />
      </FormField>
    </EntityFormDialog>
  )
}
