"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { updateSettings } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    <form action={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="energyCostPerKwh">Custo de energia (R$/kWh)</Label>
        <Input
          id="energyCostPerKwh"
          name="energyCostPerKwh"
          type="number"
          step="0.01"
          defaultValue={settings.energyCostPerKwh}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="laborCostPerHour">Custo de mão de obra (R$/h)</Label>
        <Input
          id="laborCostPerHour"
          name="laborCostPerHour"
          type="number"
          step="0.01"
          defaultValue={settings.laborCostPerHour}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="failureRatePercent">Taxa de falhas (%)</Label>
        <Input
          id="failureRatePercent"
          name="failureRatePercent"
          type="number"
          step="0.1"
          defaultValue={settings.failureRatePercent}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="currency">Moeda</Label>
        <Input
          id="currency"
          name="currency"
          defaultValue={settings.currency}
          required
        />
      </div>
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </form>
  )
}
