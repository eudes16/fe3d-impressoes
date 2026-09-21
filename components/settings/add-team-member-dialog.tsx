"use client"

import { UserPlus } from "lucide-react"

import { createTeamMember } from "@/actions/profiles"
import { useEntityFormAction } from "@/lib/hooks/use-entity-form-action"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AddTeamMemberDialog() {
  const { open, setOpen, pending, handleSubmit } = useEntityFormAction(
    createTeamMember,
    "Membro criado — repasse o e-mail e a senha pra ele entrar."
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="size-4" />
            Adicionar membro
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar membro à equipe</DialogTitle>
          <DialogDescription>
            A conta já entra confirmada. Repasse o e-mail e a senha pra pessoa
            entrar — ela pode trocar a senha depois em &quot;Meu perfil&quot;.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha inicial</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Papel</Label>
            <Select name="role" defaultValue="operador">
              <SelectTrigger id="role" className="w-full">
                <SelectValue>
                  {(value: "admin" | "operador") =>
                    value === "admin" ? "Administrador" : "Operador"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando..." : "Criar acesso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
