import { desc } from "drizzle-orm"
import { db } from "@/db"
import { settings, profiles } from "@/db/schema"
import { requireProfile } from "@/lib/current-user"
import { SettingsForm } from "@/components/settings/settings-form"
import { ProfileForm } from "@/components/settings/profile-form"
import { TeamTable } from "@/components/settings/team-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function SettingsPage() {
  const profile = await requireProfile()
  const [companySettings] = await db.select().from(settings).limit(1)

  const team =
    profile.role === "admin"
      ? await db.select().from(profiles).orderBy(desc(profiles.createdAt))
      : null

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">
          Custos usados no cálculo dos orçamentos e gestão da equipe.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meu perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custos da empresa</CardTitle>
          <CardDescription>
            Usados para calcular eletricidade, mão de obra e margem de segurança
            de todos os orçamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companySettings ? (
            <SettingsForm settings={companySettings} />
          ) : (
            <p className="text-muted-foreground">
              Configurações não encontradas — rode as migrations do banco.
            </p>
          )}
        </CardContent>
      </Card>

      {team ? (
        <Card>
          <CardHeader>
            <CardTitle>Equipe</CardTitle>
            <CardDescription>
              Só administradores podem alterar papéis de outros usuários.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamTable members={team} currentUserId={profile.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
