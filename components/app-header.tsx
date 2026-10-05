import { eq } from "drizzle-orm"

import { db } from "@/db"
import { profiles } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"
import { AppHeaderBar } from "@/components/app-header-bar"

export async function AppHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [profile] = user
    ? await db
        .select({ name: profiles.name })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1)
    : []

  return <AppHeaderBar name={profile?.name ?? ""} email={user?.email ?? ""} />
}
