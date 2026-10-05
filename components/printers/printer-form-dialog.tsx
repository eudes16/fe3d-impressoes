"use client"

import { Input, SimpleGrid } from "@chakra-ui/react"

import { createPrinter, updatePrinter } from "@/actions/printers"
import { useEntityFormAction } from "@/lib/hooks/use-entity-form-action"
import { EntityFormDialog, FormField } from "@/components/chakra/entity-form-dialog"
import type { printers } from "@/db/schema"

type Printer = typeof printers.$inferSelect

export function PrinterFormDialog({ printer }: { printer?: Printer }) {
  const action = printer ? updatePrinter.bind(null, printer.id) : createPrinter
  const { open, setOpen, pending, handleSubmit } = useEntityFormAction(
    action,
    printer ? "Impressora atualizada." : "Impressora criada."
  )

  return (
    <EntityFormDialog
      editing={!!printer}
      createLabel="Nova impressora"
      title={printer ? "Editar impressora" : "Nova impressora"}
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      onSubmit={handleSubmit}
    >
      <FormField label="Nome" required>
        <Input name="name" defaultValue={printer?.name} />
      </FormField>
      <SimpleGrid columns={2} gap="4">
        <FormField label="Diâmetro do bico (mm)" required>
          <Input
            name="diameterMm"
            type="number"
            step="0.01"
            defaultValue={printer?.diameterMm ?? 1.75}
          />
        </FormField>
        <FormField label="Preço (R$)" required>
          <Input
            name="price"
            type="number"
            step="0.01"
            defaultValue={printer?.price ?? 0}
          />
        </FormField>
        <FormField label="Horas até depreciar" required>
          <Input
            name="depreciationHours"
            type="number"
            step="1"
            defaultValue={printer?.depreciationHours ?? 5000}
          />
        </FormField>
        <FormField label="Custo de manutenção (R$)" required>
          <Input
            name="serviceCost"
            type="number"
            step="0.01"
            defaultValue={printer?.serviceCost ?? 0}
          />
        </FormField>
        <FormField label="Consumo (kWh/h)" required>
          <Input
            name="energyKwh"
            type="number"
            step="0.01"
            defaultValue={printer?.energyKwh ?? 0.12}
          />
        </FormField>
      </SimpleGrid>
    </EntityFormDialog>
  )
}
