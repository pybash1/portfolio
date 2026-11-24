import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { postgresConfig } from "./src/server/db/config";

config({ path: [".env.migrations.local", ".env.local", ".env"], quiet: true });
const url = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
const connection = url ? postgresConfig(url) : undefined;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["inspo"],
  migrations: { schema: "drizzle", table: "__drizzle_migrations" },
  ...(connection
    ? {
        dbCredentials: {
          url: connection.connectionString!,
          ssl: connection.ssl ?? true,
        },
      }
    : {}),
  strict: true,
  verbose: false,
});
