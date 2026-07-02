import { desc } from "drizzle-orm"
import { db } from "@/db"
import { clients } from "@/db/schema"
import { deleteClient } from "@/actions/clients"
import { ClientFormDialog } from "@/components/clients/client-form-dialog"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function ClientsPage() {
  const rows = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-muted-foreground">Cadastro de clientes da empresa.</p>
        </div>
        <ClientFormDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Nenhum cliente cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {[client.email, client.phone].filter(Boolean).join(" · ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.address || "—"}
                </TableCell>
                <TableCell className="flex items-center gap-1">
                  <ClientFormDialog client={client} />
                  <ConfirmDeleteButton
                    itemLabel={client.name}
                    onDelete={deleteClient.bind(null, client.id)}
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
