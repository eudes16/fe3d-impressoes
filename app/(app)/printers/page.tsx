import { desc } from "drizzle-orm"
import { db } from "@/db"
import { printers } from "@/db/schema"
import { deletePrinter } from "@/actions/printers"
import { PrinterFormDialog } from "@/components/printers/printer-form-dialog"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function PrintersPage() {
  const rows = await db
    .select()
    .from(printers)
    .orderBy(desc(printers.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Impressoras</h1>
          <p className="text-muted-foreground">
            Preço, depreciação, manutenção e consumo de energia.
          </p>
        </div>
        <PrinterFormDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Depreciação/h</TableHead>
            <TableHead>Energia (kWh/h)</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhuma impressora cadastrada.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((printer) => (
              <TableRow key={printer.id}>
                <TableCell className="font-medium">{printer.name}</TableCell>
                <TableCell>R$ {printer.price.toFixed(2)}</TableCell>
                <TableCell>
                  R$ {(printer.depreciationRate ?? 0).toFixed(4)}
                </TableCell>
                <TableCell>{printer.energyKwh}</TableCell>
                <TableCell className="flex items-center gap-1">
                  <PrinterFormDialog printer={printer} />
                  <ConfirmDeleteButton
                    itemLabel={printer.name}
                    onDelete={deletePrinter.bind(null, printer.id)}
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
