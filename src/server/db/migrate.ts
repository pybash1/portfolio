import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { escapeIdentifier, type Client } from "pg";

/** Migrations run explicitly using a privileged connection, never in requests. */
export async function migrateDatabase(client: Client): Promise<void> {
  const db = drizzle(client);
  // Serialize deploy/setup processes before reading Drizzle's migration journal.
  await db.execute(sql`SELECT pg_advisory_lock(190706, 1)`);
  try {
    await migrate(db, {
      migrationsFolder: fileURLToPath(
        new URL("../../../drizzle", import.meta.url),
      ),
      migrationsSchema: "drizzle",
      migrationsTable: "__drizzle_migrations",
    });
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(190706, 1)`);
  }
}

/** Keep runtime DML grants current while retaining DDL with the migration role. */
export async function grantCollectionPrivileges(
  client: Client,
  role: string,
): Promise<void> {
  const name = escapeIdentifier(role);
  await client.query(`GRANT USAGE ON SCHEMA inspo TO ${name}`);
  await client.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA inspo TO ${name}`,
  );
  await client.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA inspo TO ${name}`,
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA inspo GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${name}`,
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA inspo GRANT USAGE, SELECT ON SEQUENCES TO ${name}`,
  );
}
