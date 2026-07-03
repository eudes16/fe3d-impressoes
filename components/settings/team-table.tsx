"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { updateProfileRole } from "@/actions/profiles"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { profiles } from "@/db/schema"

type Profile = typeof profiles.$inferSelect

export function TeamTable({
  members,
  currentUserId,
}: {
  members: Profile[]
  currentUserId: string
}) {
  const [pending, startTransition] = useTransition()

  function handleRoleChange(profileId: string, role: string) {
    startTransition(async () => {
      try {
        await updateProfileRole(profileId, role as "admin" | "operador")
        toast.success("Papel atualizado.")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao atualizar.")
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Papel</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">
              {member.name || "—"}
              {member.id === currentUserId ? (
                <span className="text-muted-foreground"> (você)</span>
              ) : null}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {member.email}
            </TableCell>
            <TableCell>
              <Select
                value={member.role}
                onValueChange={(value) =>
                  handleRoleChange(member.id, value as string)
                }
                disabled={pending}
              >
                <SelectTrigger size="sm">
                  <SelectValue>
                    {(value: "admin" | "operador") =>
                      value === "admin" ? "Administrador" : "Operador"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
