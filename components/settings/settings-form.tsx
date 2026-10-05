"use client"

import { useTransition } from "react"
import { Box, Button, GridItem, Input, SimpleGrid } from "@chakra-ui/react"
import { toast } from "@/components/chakra/toaster"

import { updateSettings } from "@/actions/settings"
import { FormField } from "@/components/chakra/entity-form-dialog"
import type { settings } from "@/db/schema"

type Settings = typeof settings.$inferSelect

export function SettingsForm({ settings }: { settings: Settings }) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateSettings(settings.id, null, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Configurações salvas.")
      }
    })
  }

  return (
    <Box asChild>
      <form action={handleSubmit}>
        <SimpleGrid columns={2} gap="4">
          <FormField label="Custo de energia (R$/kWh)" required>
            <Input
              name="energyCostPerKwh"
              type="number"
              step="0.01"
              defaultValue={settings.energyCostPerKwh}
            />
          </FormField>
          <FormField label="Custo de mão de obra (R$/h)" required>
            <Input
              name="laborCostPerHour"
              type="number"
              step="0.01"
              defaultValue={settings.laborCostPerHour}
            />
          </FormField>
          <FormField label="Taxa de falhas (%)" required>
            <Input
              name="failureRatePercent"
              type="number"
              step="0.1"
              defaultValue={settings.failureRatePercent}
            />
          </FormField>
          <FormField label="Moeda" required>
            <Input name="currency" defaultValue={settings.currency} />
          </FormField>
          <GridItem colSpan={2}>
            <Button type="submit" loading={pending} loadingText="Salvando...">
              Salvar configurações
            </Button>
          </GridItem>
        </SimpleGrid>
      </form>
    </Box>
  )
}
