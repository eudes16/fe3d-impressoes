"use client"

import { Button, Input, NativeSelect } from "@chakra-ui/react"
import { UserPlus } from "lucide-react"

import { createTeamMember } from "@/actions/profiles"
import { useEntityFormAction } from "@/lib/hooks/use-entity-form-action"
import { EntityFormDialog, FormField } from "@/components/chakra/entity-form-dialog"

export function AddTeamMemberDialog() {
  const { open, setOpen, pending, handleSubmit } = useEntityFormAction(
    createTeamMember,
    "Membro criado — repasse o e-mail e a senha pra ele entrar."
  )

  return (
    <EntityFormDialog
      editing={false}
      createLabel="Adicionar membro"
      title="Adicionar membro à equipe"
      description={
        <>
          A conta já entra confirmada. Repasse o e-mail e a senha pra pessoa
          entrar — ela pode trocar a senha depois em &quot;Meu perfil&quot;.
        </>
      }
      trigger={
        <Button size="sm">
          <UserPlus />
          Adicionar membro
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      onSubmit={handleSubmit}
      submitLabel="Criar acesso"
      pendingLabel="Criando..."
    >
      <FormField label="Nome" required>
        <Input name="name" />
      </FormField>
      <FormField label="E-mail" required>
        <Input name="email" type="email" />
      </FormField>
      <FormField label="Senha inicial" required>
        <Input name="password" type="password" minLength={6} />
      </FormField>
      <FormField label="Papel">
        <NativeSelect.Root>
          <NativeSelect.Field name="role" defaultValue="operador">
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </FormField>
    </EntityFormDialog>
  )
}
