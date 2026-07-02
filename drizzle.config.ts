import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  schemaFilter: ["core", "crm", "catalog", "sales"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
