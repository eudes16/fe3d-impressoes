"use client"

import { Plus } from "lucide-react"

import { createFilament, updateFilament } from "@/actions/filaments"
import { useEntityFormAction } from "@/lib/hooks/use-entity-form-action"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { filaments } from "@/db/schema"

type Filament = typeof filaments.$inferSelect

export function FilamentFormDialog({ filament }: { filament?: Filament }) {
  const action = filament
    ? updateFilament.bind(null, filament.id)
    : createFilament
  const { open, setOpen, pending, handleSubmit } = useEntityFormAction(
    action,
    filament ? "Filamento atualizado." : "Filamento criado."
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          filament ? (
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="size-4" />
              Novo filamento
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {filament ? "Editar filamento" : "Novo filamento (bobina)"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={filament?.name}
              placeholder="Ex.: Voolt3D PLA Velvet"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vendor">Fabricante</Label>
              <Input id="vendor" name="vendor" defaultValue={filament?.vendor ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="materialType">Tipo (PLA, PETG...)</Label>
              <Input
                id="materialType"
                name="materialType"
                defaultValue={filament?.materialType ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="colorHex">Cor (para casar com o .3mf)</Label>
              <Input
                id="colorHex"
                name="colorHex"
                placeholder="#RRGGBB"
                defaultValue={filament?.colorHex ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="diameterMm">Diâmetro (mm)</Label>
              <Input
                id="diameterMm"
                name="diameterMm"
                type="number"
                step="0.01"
                defaultValue={filament?.diameterMm ?? 1.75}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço da bobina (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={filament?.price ?? 0}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weightKg">Peso total (kg)</Label>
              <Input
                id="weightKg"
                name="weightKg"
                type="number"
                step="0.01"
                defaultValue={filament?.weightKg ?? 1}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remainingWeightG">Estoque atual (g)</Label>
              <Input
                id="remainingWeightG"
                name="remainingWeightG"
                type="number"
                step="0.01"
                defaultValue={filament?.remainingWeightG ?? 0}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="density">Densidade (g/cm³)</Label>
              <Input
                id="density"
                name="density"
                type="number"
                step="0.01"
                defaultValue={filament?.density ?? 1.24}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nozzleTemp">Temp. bico (°C)</Label>
              <Input
                id="nozzleTemp"
                name="nozzleTemp"
                type="number"
                defaultValue={filament?.nozzleTemp ?? 210}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bedTemp">Temp. mesa (°C)</Label>
              <Input
                id="bedTemp"
                name="bedTemp"
                type="number"
                defaultValue={filament?.bedTemp ?? 60}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lengthM">Comprimento (m)</Label>
              <Input
                id="lengthM"
                name="lengthM"
                type="number"
                step="0.01"
                defaultValue={filament?.lengthM ?? 330}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
