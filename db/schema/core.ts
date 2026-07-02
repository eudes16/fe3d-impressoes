import { pgSchema, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core"

export const core = pgSchema("core")

export const profileRoleEnum = core.enum("profile_role", [
  "admin",
  "operador",
])

// id references auth.users(id) — the FK constraint + auto-create trigger are
// added in a custom SQL migration (Drizzle doesn't manage the auth schema).
export const profiles = core.table("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull().default(""),
  role: profileRoleEnum("role").notNull().default("operador"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Linha única com as configurações de custo da empresa.
export const settings = core.table("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  energyCostPerKwh: numeric("energy_cost_per_kwh", { mode: "number" })
    .notNull()
    .default(0.9),
  laborCostPerHour: numeric("labor_cost_per_hour", { mode: "number" })
    .notNull()
    .default(30),
  failureRatePercent: numeric("failure_rate_percent", { mode: "number" })
    .notNull()
    .default(15),
  currency: text("currency").notNull().default("R$"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
