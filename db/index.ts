import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

declare global {
  var __dbClient: ReturnType<typeof postgres> | undefined
}

const connectionString = process.env.DATABASE_URL ?? ""

// Em dev, o Next.js reavalia este módulo a cada HMR — sem cache em
// globalThis, cada reload abria uma conexão nova com o pooler (sessão,
// limite de conexões baixo) sem fechar as antigas, até estourar o limite e
// as queries passarem a falhar ("Failed query"). A conexão em si é
// preguiçosa (postgres.js só conecta na primeira query).
const client = globalThis.__dbClient ?? postgres(connectionString, { prepare: false })

if (process.env.NODE_ENV !== "production") {
  globalThis.__dbClient = client
}

export const db = drizzle(client, { schema })
