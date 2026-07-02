import { desc } from "drizzle-orm"
import { AlertTriangle } from "lucide-react"
import { db } from "@/db"
import { consumables } from "@/db/schema"
import { deleteConsumable } from "@/actions/consumables"
import { ConsumableFormDialog } from "@/components/consumables/consumable-form-dialog"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function ConsumablesPage() {
  const rows = await db
    .select()
    .from(consumables)
    .orderBy(desc(consumables.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Consumíveis</h1>
          <p className="text-muted-foreground">
            Chaveiros, luminárias e outros itens usados em orçamentos.
          </p>
        </div>
        <ConsumableFormDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Preço unit.</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum consumível cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.category || "—"}
                </TableCell>
                <TableCell>R$ {c.unitPrice.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {c.quantity} {c.unit}
                    {c.quantity <= 0 ? (
                      <Badge variant="secondary" className="gap-1 text-amber-700">
                        <AlertTriangle className="size-3" />
                        esgotado
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="flex items-center gap-1">
                  <ConsumableFormDialog consumable={c} />
                  <ConfirmDeleteButton
                    itemLabel={c.name}
                    onDelete={deleteConsumable.bind(null, c.id)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
