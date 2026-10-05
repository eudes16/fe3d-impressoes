"use client"

import { useTransition } from "react"
import { Box, Button, GridItem, Input, SimpleGrid } from "@chakra-ui/react"
import { toast } from "@/components/chakra/toaster"

import { updateOwnProfile } from "@/actions/profiles"
import { FormField } from "@/components/chakra/entity-form-dialog"
import type { profiles } from "@/db/schema"

type Profile = typeof profiles.$inferSelect

export function ProfileForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateOwnProfile(null, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Perfil atualizado.")
      }
    })
  }

  return (
    <Box asChild>
      <form action={handleSubmit}>
        <SimpleGrid columns={2} gap="4">
          <FormField label="Nome" required>
            <Input name="name" defaultValue={profile.name} />
          </FormField>
          <FormField label="Telefone">
            <Input name="phone" defaultValue={profile.phone ?? ""} />
          </FormField>
          <FormField label="E-mail" disabled>
            <Input value={profile.email} readOnly />
          </FormField>
          <FormField label="Papel" disabled>
            <Input
              value={profile.role === "admin" ? "Administrador" : "Operador"}
              readOnly
            />
          </FormField>
          <GridItem colSpan={2}>
            <Button type="submit" loading={pending} loadingText="Salvando...">
              Salvar perfil
            </Button>
          </GridItem>
        </SimpleGrid>
      </form>
    </Box>
  )
}
