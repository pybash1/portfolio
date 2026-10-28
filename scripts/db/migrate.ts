import { config } from "dotenv";
import { Client } from "pg";
import { postgresConfig } from "../../src/server/db/config";
import {
  grantCollectionPrivileges,
  migrateDatabase,
} from "../../src/server/db/migrate";

config({ path: [".env.migrations.local", ".env.local", ".env"], quiet: true });

const url = process.env.DATABASE_MIGRATION_URL;
if (!url) {
  console.error(
    "Set DATABASE_MIGRATION_URL in .env.migrations.local to run migrations.",
  );
  process.exit(1);
}

const client = new Client(postgresConfig(url));
try {
  await client.connect();
  await migrateDatabase(client);
  await grantCollectionPrivileges(client, "portfolio_app");
  console.log("Drizzle migrations are up to date.");
} catch (error) {
  // Driver errors can contain connection details or SQL parameters.
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "MIGRATION_FAILED";
  console.error(`Database migration failed (${code}).`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
