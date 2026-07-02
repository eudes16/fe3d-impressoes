"use client"

import { Plus } from "lucide-react"

import { createConsumable, updateConsumable } from "@/actions/consumables"
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
import { Textarea } from "@/components/ui/textarea"
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          consumable ? (
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="size-4" />
              Novo consumível
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {consumable ? "Editar consumível" : "Novo consumível"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex.: Argola de chaveiro 25mm"
              defaultValue={consumable?.name}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                name="category"
                placeholder="chaveiro, luminária..."
                defaultValue={consumable?.category ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input
                id="unit"
                name="unit"
                defaultValue={consumable?.unit ?? "un"}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitPrice">Preço unitário (R$)</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                defaultValue={consumable?.unitPrice ?? 0}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Estoque</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                defaultValue={consumable?.quantity ?? 0}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={consumable?.description ?? ""}
            />
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
