import { LogOut } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/actions/auth"
import { Button } from "@/components/ui/button"

export async function AppHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <span className="text-sm text-muted-foreground">
        {user?.email ?? ""}
      </span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="size-4" />
          Sair
        </Button>
      </form>
    </header>
  )
}
