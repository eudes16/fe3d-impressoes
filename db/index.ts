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
//
// Os defaults do postgres.js (max: 10, idle_timeout: 0) mantêm até 10
// conexões abertas por processo para sempre — somando dev server, build
// workers e instâncias serverless, isso estoura o limite de clientes do
// pooler do Supabase. Por isso fechamos conexões ociosas e reciclamos as
// longas.
//
// max_pipeline: 0 — quando todas as conexões estão ocupadas, o postgres.js
// por padrão enfileira (pipelining) novas queries numa conexão já em uso. O
// Supavisor em transaction mode não suporta isso: devolve só a primeira
// resposta do lote e as demais queries esperam para sempre (backend parado em
// "active / ClientRead"), até todas as conexões ficarem presas e o app parar
// de responder. Sem pipelining, a query espera uma conexão livre.
// Ref.: https://github.com/porsager/postgres/issues/970
// `max_pipeline` existe no postgres.js (src/index.js) mas não nos tipos.
const options: postgres.Options<Record<string, postgres.PostgresType>> & {
  max_pipeline: number
} = {
  prepare: false, // obrigatório no pooler em transaction mode (porta 6543)
  max_pipeline: 0,
  idle_timeout: 20, // segundos — fecha conexões ociosas
  max_lifetime: 60 * 30, // segundos — recicla conexões longas
  connect_timeout: 10,
}

const client = globalThis.__dbClient ?? postgres(connectionString, options)

globalThis.__dbClient = client

export const db = drizzle(client, { schema })
