import { desc } from "drizzle-orm"
import { AlertTriangle } from "lucide-react"
import { db } from "@/db"
import { filaments } from "@/db/schema"
import { deleteFilament } from "@/actions/filaments"
import { FilamentFormDialog } from "@/components/filaments/filament-form-dialog"
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

const LOW_STOCK_RATIO = 0.15

export default async function FilamentsPage() {
  const rows = await db
    .select()
    .from(filaments)
    .orderBy(desc(filaments.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Filamentos</h1>
          <p className="text-muted-foreground">
            Cada linha é uma bobina física — cole o UUID (id) nas notas do
            filamento no fatiador para vincular ao importar o .3mf/.gcode.
          </p>
        </div>
        <FilamentFormDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Fabricante / Tipo</TableHead>
            <TableHead>Categoria / Cores</TableHead>
            <TableHead>R$/kg</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhum filamento cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((filament) => {
              const lowStock =
                filament.remainingWeightG <
                filament.weightKg * 1000 * LOW_STOCK_RATIO
              return (
                <TableRow key={filament.id}>
                  <TableCell className="font-medium">{filament.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[filament.vendor, filament.materialType]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {filament.category ? (
                        <Badge variant="outline">{filament.category}</Badge>
                      ) : null}
                      {filament.colors.length > 0 ? (
                        <div className="flex items-center gap-0.5">
                          {filament.colors.map((c, i) => (
                            <span
                              key={i}
                              className="size-3.5 rounded-full border"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    R$ {(filament.pricePerKg ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {filament.remainingWeightG.toFixed(0)} g
                      {lowStock ? (
                        <Badge variant="secondary" className="gap-1 text-amber-700">
                          <AlertTriangle className="size-3" />
                          baixo
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <FilamentFormDialog filament={filament} />
                    <ConfirmDeleteButton
                      itemLabel={filament.name}
                      onDelete={deleteFilament.bind(null, filament.id)}
                    />
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
