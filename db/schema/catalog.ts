import { sql } from "drizzle-orm"
import { pgSchema, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core"

export const catalog = pgSchema("catalog")

export const printers = catalog.table("printers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  diameterMm: numeric("diameter_mm", { mode: "number" })
    .notNull()
    .default(1.75),
  price: numeric("price", { mode: "number" }).notNull().default(0),
  depreciationHours: numeric("depreciation_hours", { mode: "number" })
    .notNull()
    .default(5000),
  serviceCost: numeric("service_cost", { mode: "number" })
    .notNull()
    .default(0),
  energyKwh: numeric("energy_kwh", { mode: "number" })
    .notNull()
    .default(0.12),
  // (price + service_cost) / depreciation_hours — custo de depreciação por hora de impressão.
  depreciationRate: numeric("depreciation_rate", { mode: "number" }).generatedAlwaysAs(
    sql`(price + service_cost) / NULLIF(depreciation_hours, 0)`
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const filaments = catalog.table("filaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  vendor: text("vendor"),
  materialType: text("material_type"),
  // ex.: "Padrão", "Silk", "Dual Color", "Tri Color", "Quad Color", "Metalic",
  // "Glow" — livre, sem enum fechado (lista sugerida só na UI).
  category: text("category"),
  // Um filamento pode ter mais de uma cor (silk multicolor, dual/tri/quad
  // color etc.) — cada uma é comparada com o colorHex do .3mf/.gcode no matching.
  colors: text("colors").array().notNull().default([]),
  diameterMm: numeric("diameter_mm", { mode: "number" })
    .notNull()
    .default(1.75),
  price: numeric("price", { mode: "number" }).notNull().default(0),
  weightKg: numeric("weight_kg", { mode: "number" }).notNull().default(1),
  density: numeric("density", { mode: "number" }).notNull().default(1.24),
  nozzleTemp: numeric("nozzle_temp", { mode: "number" })
    .notNull()
    .default(210),
  bedTemp: numeric("bed_temp", { mode: "number" }).notNull().default(60),
  lengthM: numeric("length_m", { mode: "number" }).notNull().default(330),
  // Cada linha é uma bobina física; remaining_weight_g é o estoque atual dela.
  remainingWeightG: numeric("remaining_weight_g", { mode: "number" })
    .notNull()
    .default(0),
  pricePerKg: numeric("price_per_kg", { mode: "number" }).generatedAlwaysAs(
    sql`price / NULLIF(weight_kg, 0)`
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const consumables = catalog.table("consumables", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // ex.: "chaveiro", "luminaria" — livre, sem enum fechado.
  category: text("category"),
  unitPrice: numeric("unit_price", { mode: "number" }).notNull().default(0),
  quantity: numeric("quantity", { mode: "number" }).notNull().default(0),
  unit: text("unit").notNull().default("un"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
