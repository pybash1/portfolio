import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { postgresConfig } from "./config";
import { EditorError, env } from "../inspo/http";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;
function createDatabase(pool: Pool): Database {
  return drizzle(pool, { schema });
}

// Reuse the pool across Astro's hot reloads as well as normal requests.
const connections = globalThis as typeof globalThis & {
  portfolioDatabase?: { url: string; pool: Pool; db: Database };
};
export function database(): Database {
  const url = env("DATABASE_URL");
  if (!url)
    throw new EditorError(
      "Collection storage hasn’t been configured yet.",
      503,
    );
  if (connections.portfolioDatabase?.url === url)
    return connections.portfolioDatabase.db;
  const previous = connections.portfolioDatabase;
  if (previous) void previous.pool.end().catch(() => {});
  const pool = new Pool(postgresConfig(url));
  // Handle idle socket errors without logging connection strings or credentials.
  pool.on("error", () =>
    console.error("[inspo] An idle database connection was lost."),
  );
  const db = createDatabase(pool);
  connections.portfolioDatabase = { url, pool, db };
  return db;
}
