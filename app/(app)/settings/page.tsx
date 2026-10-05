import { desc } from "drizzle-orm"
import { Box, Card, Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react"
import { db } from "@/db"
import { settings, profiles } from "@/db/schema"
import { requireProfile } from "@/lib/current-user"
import { SettingsForm } from "@/components/settings/settings-form"
import { ProfileForm } from "@/components/settings/profile-form"
import { TeamTable } from "@/components/settings/team-table"
import { AddTeamMemberDialog } from "@/components/settings/add-team-member-dialog"

export default async function SettingsPage() {
  const profile = await requireProfile()
  const [companySettings] = await db.select().from(settings).limit(1)

  const team =
    profile.role === "admin"
      ? await db.select().from(profiles).orderBy(desc(profiles.createdAt))
      : null

  return (
    <Stack gap="5">
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="5">
        <Card.Root>
          <Card.Header>
            <Card.Title>Meu perfil</Card.Title>
          </Card.Header>
          <Card.Body>
            <ProfileForm profile={profile} />
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Custos da empresa</Card.Title>
            <Card.Description>
              Usados para calcular eletricidade, mão de obra e margem de segurança
              de todos os orçamentos.
            </Card.Description>
          </Card.Header>
          <Card.Body>
            {companySettings ? (
              <SettingsForm settings={companySettings} />
            ) : (
              <Text color="fg.muted">
                Configurações não encontradas — rode as migrations do banco.
              </Text>
            )}
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {team ? (
        <Card.Root>
          <Card.Header>
            <Flex align="center" justify="space-between" gap="4">
              <Box>
                <Card.Title>Equipe</Card.Title>
                <Card.Description>
                  Só administradores podem criar acessos e alterar papéis de
                  outros usuários.
                </Card.Description>
              </Box>
              <AddTeamMemberDialog />
            </Flex>
          </Card.Header>
          <Card.Body>
            <TeamTable members={team} currentUserId={profile.id} />
          </Card.Body>
        </Card.Root>
      ) : null}
    </Stack>
  )
}
