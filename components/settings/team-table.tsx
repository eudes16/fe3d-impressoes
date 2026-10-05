"use client"

import { useTransition } from "react"
import { NativeSelect, Table, Text } from "@chakra-ui/react"
import { toast } from "@/components/chakra/toaster"

import { updateProfileRole } from "@/actions/profiles"
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
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row bg="transparent">
          <Table.ColumnHeader>Nome</Table.ColumnHeader>
          <Table.ColumnHeader>E-mail</Table.ColumnHeader>
          <Table.ColumnHeader>Papel</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {members.map((member) => (
          <Table.Row key={member.id} bg="transparent">
            <Table.Cell fontWeight="semibold">
              {member.name || "—"}
              {member.id === currentUserId ? (
                <Text as="span" color="fg.muted" fontWeight="normal">
                  {" "}
                  (você)
                </Text>
              ) : null}
            </Table.Cell>
            <Table.Cell color="fg.muted">{member.email}</Table.Cell>
            <Table.Cell>
              <NativeSelect.Root size="sm" width="40" disabled={pending}>
                <NativeSelect.Field
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.id, e.currentTarget.value)
                  }
                >
                  <option value="admin">Administrador</option>
                  <option value="operador">Operador</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
