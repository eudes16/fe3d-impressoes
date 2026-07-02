"use client"

import { Plus } from "lucide-react"

import { createPrinter, updatePrinter } from "@/actions/printers"
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
import type { printers } from "@/db/schema"

type Printer = typeof printers.$inferSelect

export function PrinterFormDialog({ printer }: { printer?: Printer }) {
  const action = printer ? updatePrinter.bind(null, printer.id) : createPrinter
  const { open, setOpen, pending, handleSubmit } = useEntityFormAction(
    action,
    printer ? "Impressora atualizada." : "Impressora criada."
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          printer ? (
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="size-4" />
              Nova impressora
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {printer ? "Editar impressora" : "Nova impressora"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={printer?.name}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="diameterMm">Diâmetro do bico (mm)</Label>
              <Input
                id="diameterMm"
                name="diameterMm"
                type="number"
                step="0.01"
                defaultValue={printer?.diameterMm ?? 1.75}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={printer?.price ?? 0}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="depreciationHours">Horas até depreciar</Label>
              <Input
                id="depreciationHours"
                name="depreciationHours"
                type="number"
                step="1"
                defaultValue={printer?.depreciationHours ?? 5000}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serviceCost">Custo de manutenção (R$)</Label>
              <Input
                id="serviceCost"
                name="serviceCost"
                type="number"
                step="0.01"
                defaultValue={printer?.serviceCost ?? 0}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="energyKwh">Consumo (kWh/h)</Label>
              <Input
                id="energyKwh"
                name="energyKwh"
                type="number"
                step="0.01"
                defaultValue={printer?.energyKwh ?? 0.12}
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
