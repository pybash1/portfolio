import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  jsonb,
  pgSchema,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { InspoItem } from "../../components/inspo/types";

export const inspo = pgSchema("inspo");

/** Mixed-media payloads share typed metadata and database-enforced identities. */
export const inspoItems = inspo.table(
  "items",
  {
    id: text("id").primaryKey(),
    ordinal: bigint("ordinal", { mode: "number" })
      .generatedAlwaysAsIdentity({ name: "items_ordinal_seq" })
      .unique("items_ordinal_key"),
    sourceKey: text("source_key"),
    sourceHash: text("source_hash").unique("items_source_hash_key"),
    item: jsonb("item").$type<InspoItem>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "item_identity",
      sql`jsonb_typeof(${table.item}) = 'object' AND ${table.item} ? 'id' AND ${table.item} ->> 'id' = ${table.id}`,
    ),
    check(
      "source_identity",
      sql`(${table.sourceKey} IS NULL AND ${table.sourceHash} IS NULL) OR (${table.sourceKey} IS NOT NULL AND ${table.sourceHash} IS NOT NULL AND length(${table.sourceHash}) = 64)`,
    ),
  ],
);
