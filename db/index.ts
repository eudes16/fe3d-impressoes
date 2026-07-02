import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

// A conexão é preguiçosa (postgres.js só conecta na primeira query), então é
// seguro instanciar mesmo antes do DATABASE_URL estar configurado em build time.
const client = postgres(connectionString ?? "", { prepare: false })

export const db = drizzle(client, { schema })
