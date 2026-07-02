CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "crm";
--> statement-breakpoint
CREATE SCHEMA "catalog";
--> statement-breakpoint
CREATE SCHEMA "sales";
--> statement-breakpoint
CREATE TYPE "core"."profile_role" AS ENUM('admin', 'operador');--> statement-breakpoint
CREATE TYPE "sales"."quote_status" AS ENUM('draft', 'sent', 'approved', 'in_production', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "sales"."stock_item_type" AS ENUM('filament', 'consumable');--> statement-breakpoint
CREATE TABLE "core"."profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"role" "core"."profile_role" DEFAULT 'operador' NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"energy_cost_per_kwh" numeric DEFAULT 0.9 NOT NULL,
	"labor_cost_per_hour" numeric DEFAULT 30 NOT NULL,
	"failure_rate_percent" numeric DEFAULT 15 NOT NULL,
	"currency" text DEFAULT 'R$' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."consumables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"unit_price" numeric DEFAULT 0 NOT NULL,
	"quantity" numeric DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'un' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."filaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"vendor" text,
	"material_type" text,
	"color_hex" text,
	"diameter_mm" numeric DEFAULT 1.75 NOT NULL,
	"price" numeric DEFAULT 0 NOT NULL,
	"weight_kg" numeric DEFAULT 1 NOT NULL,
	"density" numeric DEFAULT 1.24 NOT NULL,
	"nozzle_temp" numeric DEFAULT 210 NOT NULL,
	"bed_temp" numeric DEFAULT 60 NOT NULL,
	"length_m" numeric DEFAULT 330 NOT NULL,
	"remaining_weight_g" numeric DEFAULT 0 NOT NULL,
	"price_per_kg" numeric GENERATED ALWAYS AS (price / NULLIF(weight_kg, 0)) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."printers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"diameter_mm" numeric DEFAULT 1.75 NOT NULL,
	"price" numeric DEFAULT 0 NOT NULL,
	"depreciation_hours" numeric DEFAULT 5000 NOT NULL,
	"service_cost" numeric DEFAULT 0 NOT NULL,
	"energy_kwh" numeric DEFAULT 0.12 NOT NULL,
	"depreciation_rate" numeric GENERATED ALWAYS AS ((price + service_cost) / NULLIF(depreciation_hours, 0)) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."quote_consumable_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"consumable_id" uuid NOT NULL,
	"quantity" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."quote_filament_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"filament_id" uuid NOT NULL,
	"weight_g" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."quote_plate_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"label" text NOT NULL,
	"print_time_h" numeric DEFAULT 0 NOT NULL,
	"weight_g" numeric DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"printer_id" uuid NOT NULL,
	"description" text NOT NULL,
	"print_time_h" numeric DEFAULT 0 NOT NULL,
	"prep_time_min" numeric DEFAULT 0 NOT NULL,
	"slicing_time_min" numeric DEFAULT 0 NOT NULL,
	"material_change_min" numeric DEFAULT 0 NOT NULL,
	"transfer_start_min" numeric DEFAULT 0 NOT NULL,
	"removal_min" numeric DEFAULT 0 NOT NULL,
	"support_removal_min" numeric DEFAULT 0 NOT NULL,
	"additional_work_min" numeric DEFAULT 0 NOT NULL,
	"consumables_misc_cost" numeric DEFAULT 0 NOT NULL,
	"markup_percent" numeric DEFAULT 100 NOT NULL,
	"real_price" numeric DEFAULT 0 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" "sales"."quote_status" DEFAULT 'draft' NOT NULL,
	"thumbnail_url" text,
	"model_name" text,
	"source_3mf_filename" text,
	"assigned_user_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales"."stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_type" "sales"."stock_item_type" NOT NULL,
	"filament_id" uuid,
	"consumable_id" uuid,
	"quote_id" uuid,
	"delta_qty" numeric NOT NULL,
	"reason" text DEFAULT 'quote_production' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm"."clients" ADD CONSTRAINT "clients_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quote_consumable_items" ADD CONSTRAINT "quote_consumable_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "sales"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quote_consumable_items" ADD CONSTRAINT "quote_consumable_items_consumable_id_consumables_id_fk" FOREIGN KEY ("consumable_id") REFERENCES "catalog"."consumables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quote_filament_items" ADD CONSTRAINT "quote_filament_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "sales"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quote_filament_items" ADD CONSTRAINT "quote_filament_items_filament_id_filaments_id_fk" FOREIGN KEY ("filament_id") REFERENCES "catalog"."filaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quote_plate_items" ADD CONSTRAINT "quote_plate_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "sales"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "crm"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quotes" ADD CONSTRAINT "quotes_printer_id_printers_id_fk" FOREIGN KEY ("printer_id") REFERENCES "catalog"."printers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quotes" ADD CONSTRAINT "quotes_assigned_user_id_profiles_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."quotes" ADD CONSTRAINT "quotes_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."stock_movements" ADD CONSTRAINT "stock_movements_filament_id_filaments_id_fk" FOREIGN KEY ("filament_id") REFERENCES "catalog"."filaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."stock_movements" ADD CONSTRAINT "stock_movements_consumable_id_consumables_id_fk" FOREIGN KEY ("consumable_id") REFERENCES "catalog"."consumables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."stock_movements" ADD CONSTRAINT "stock_movements_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "sales"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales"."stock_movements" ADD CONSTRAINT "stock_movements_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;