"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { updateOwnProfile } from "@/actions/profiles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    <form action={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={profile.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label>E-mail</Label>
        <Input value={profile.email} disabled />
      </div>
      <div className="grid gap-2">
        <Label>Papel</Label>
        <Input value={profile.role === "admin" ? "Administrador" : "Operador"} disabled />
      </div>
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </form>
  )
}
