import * as tls from "node:tls";
import type { PoolConfig } from "pg";

/** Handle libpq's system trust setting without treating "system" as a file. */
export function postgresConfig(value: string): PoolConfig {
  const url = new URL(value);
  if (!/^postgres(?:ql)?:$/.test(url.protocol))
    throw new Error("Use a PostgreSQL connection URL.");
  const mode = url.searchParams.get("sslmode") || "verify-full";
  const root = url.searchParams.get("sslrootcert");
  if (!["verify-full", "require"].includes(mode))
    throw new Error("Use sslmode=verify-full or sslmode=require.");
  if (root && root !== "system")
    throw new Error("Use sslrootcert=system, or omit it.");
  if (url.searchParams.has("sslcert") || url.searchParams.has("sslkey"))
    throw new Error(
      "Client certificate settings are not configured for this application.",
    );
  // pg's URL parser replaces explicit TLS options if these are left in the URL.
  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey", "ssl"])
    url.searchParams.delete(key);
  const systemRoots =
    typeof tls.getCACertificates === "function"
      ? tls.getCACertificates("system")
      : [];
  return {
    connectionString: url.href,
    ssl:
      mode === "require"
        ? { rejectUnauthorized: false }
        : {
            rejectUnauthorized: true,
            ...(systemRoots.length
              ? { ca: [...tls.rootCertificates, ...systemRoots] }
              : {}),
          },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    statement_timeout: 10_000,
    query_timeout: 12_000,
    application_name: "portfolio-inspo",
    allowExitOnIdle: true,
  };
}
