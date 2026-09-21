import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase com a service_role key — só para operações de admin (criar
 * usuário direto, sem passar pelo fluxo público de auto-cadastro). Ignora RLS
 * por completo, então NUNCA deve ser importado em código que roda no browser
 * nem reaproveitado fora de Server Actions/rotas que já checaram `requireAdmin()`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — adicione no .env.local " +
        "(Project Settings > API > service_role) para criar membros da equipe."
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
