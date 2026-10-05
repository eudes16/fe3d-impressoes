"use client"

import { useActionState } from "react"
import { Button, Card, Input, Stack, Text } from "@chakra-ui/react"

import { signIn } from "@/actions/auth"
import { FormField } from "@/components/chakra/entity-form-dialog"

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null)

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Entrar</Card.Title>
        <Card.Description>Acesse o painel da F&E 3D</Card.Description>
      </Card.Header>
      <form action={formAction}>
        <Card.Body>
          <Stack gap="4">
            <FormField label="E-mail" required>
              <Input name="email" type="email" />
            </FormField>
            <FormField label="Senha" required>
              <Input name="password" type="password" />
            </FormField>
            {state?.error ? (
              <Text textStyle="sm" color="fg.error">
                {state.error}
              </Text>
            ) : null}
          </Stack>
        </Card.Body>
        <Card.Footer>
          <Button
            type="submit"
            width="full"
            loading={pending}
            loadingText="Entrando..."
          >
            Entrar
          </Button>
        </Card.Footer>
      </form>
    </Card.Root>
  )
}
