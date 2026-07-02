import {
  pgSchema,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
} from "drizzle-orm/pg-core"
import { profiles } from "./core"
import { clients } from "./crm"
import { printers, filaments, consumables } from "./catalog"

export const sales = pgSchema("sales")

export const quoteStatusEnum = sales.enum("quote_status", [
  "draft",
  "sent",
  "approved",
  "in_production",
  "completed",
  "rejected",
])

export const stockItemTypeEnum = sales.enum("stock_item_type", [
  "filament",
  "consumable",
])

export const quotes = sales.table("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  printerId: uuid("printer_id")
    .notNull()
    .references(() => printers.id),
  description: text("description").notNull(),

  printTimeH: numeric("print_time_h", { mode: "number" })
    .notNull()
    .default(0),
  prepTimeMin: numeric("prep_time_min", { mode: "number" })
    .notNull()
    .default(0),
  slicingTimeMin: numeric("slicing_time_min", { mode: "number" })
    .notNull()
    .default(0),
  materialChangeMin: numeric("material_change_min", { mode: "number" })
    .notNull()
    .default(0),
  transferStartMin: numeric("transfer_start_min", { mode: "number" })
    .notNull()
    .default(0),
  removalMin: numeric("removal_min", { mode: "number" }).notNull().default(0),
  supportRemovalMin: numeric("support_removal_min", { mode: "number" })
    .notNull()
    .default(0),
  additionalWorkMin: numeric("additional_work_min", { mode: "number" })
    .notNull()
    .default(0),

  consumablesMiscCost: numeric("consumables_misc_cost", { mode: "number" })
    .notNull()
    .default(0),
  markupPercent: numeric("markup_percent", { mode: "number" })
    .notNull()
    .default(100),
  realPrice: numeric("real_price", { mode: "number" }).notNull().default(0),
  quantity: integer("quantity").notNull().default(1),
  status: quoteStatusEnum("status").notNull().default("draft"),

  thumbnailUrl: text("thumbnail_url"),
  modelName: text("model_name"),
  source3mfFilename: text("source_3mf_filename"),

  assignedUserId: uuid("assigned_user_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const quoteFilamentItems = sales.table("quote_filament_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  filamentId: uuid("filament_id")
    .notNull()
    .references(() => filaments.id),
  weightG: numeric("weight_g", { mode: "number" }).notNull(),
})

export const quoteConsumableItems = sales.table("quote_consumable_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  consumableId: uuid("consumable_id")
    .notNull()
    .references(() => consumables.id),
  quantity: numeric("quantity", { mode: "number" }).notNull(),
})

export const quotePlateItems = sales.table("quote_plate_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  printTimeH: numeric("print_time_h", { mode: "number" }).notNull().default(0),
  weightG: numeric("weight_g", { mode: "number" }).notNull().default(0),
})

// Ledger de toda baixa/ajuste de estoque (filamento ou consumível).
export const stockMovements = sales.table("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemType: stockItemTypeEnum("item_type").notNull(),
  filamentId: uuid("filament_id").references(() => filaments.id, {
    onDelete: "cascade",
  }),
  consumableId: uuid("consumable_id").references(() => consumables.id, {
    onDelete: "cascade",
  }),
  quoteId: uuid("quote_id").references(() => quotes.id, {
    onDelete: "set null",
  }),
  // negativo = baixa, positivo = reposição
  deltaQty: numeric("delta_qty", { mode: "number" }).notNull(),
  reason: text("reason").notNull().default("quote_production"),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
