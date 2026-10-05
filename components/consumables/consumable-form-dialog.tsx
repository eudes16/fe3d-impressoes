"use client"

import { Input, SimpleGrid, Textarea } from "@chakra-ui/react"

import { createConsumable, updateConsumable } from "@/actions/consumables"
import { useEntityFormAction } from "@/lib/hooks/use-entity-form-action"
import { EntityFormDialog, FormField } from "@/components/chakra/entity-form-dialog"
import type { consumables } from "@/db/schema"

type Consumable = typeof consumables.$inferSelect

export function ConsumableFormDialog({
  consumable,
}: {
  consumable?: Consumable
}) {
  const action = consumable
    ? updateConsumable.bind(null, consumable.id)
    : createConsumable
  const { open, setOpen, pending, handleSubmit } = useEntityFormAction(
    action,
    consumable ? "Consumível atualizado." : "Consumível criado."
  )

  return (
    <EntityFormDialog
      editing={!!consumable}
      createLabel="Novo consumível"
      title={consumable ? "Editar consumível" : "Novo consumível"}
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      onSubmit={handleSubmit}
    >
      <FormField label="Nome" required>
        <Input
          name="name"
          placeholder="Ex.: Argola de chaveiro 25mm"
          defaultValue={consumable?.name}
        />
      </FormField>
      <SimpleGrid columns={2} gap="4">
        <FormField label="Categoria">
          <Input
            name="category"
            placeholder="chaveiro, luminária..."
            defaultValue={consumable?.category ?? ""}
          />
        </FormField>
        <FormField label="Unidade" required>
          <Input name="unit" defaultValue={consumable?.unit ?? "un"} />
        </FormField>
        <FormField label="Preço unitário (R$)" required>
          <Input
            name="unitPrice"
            type="number"
            step="0.01"
            defaultValue={consumable?.unitPrice ?? 0}
          />
        </FormField>
        <FormField label="Estoque" required>
          <Input
            name="quantity"
            type="number"
            step="0.01"
            defaultValue={consumable?.quantity ?? 0}
          />
        </FormField>
      </SimpleGrid>
      <FormField label="Descrição">
        <Textarea
          name="description"
          defaultValue={consumable?.description ?? ""}
        />
      </FormField>
    </EntityFormDialog>
  )
}
