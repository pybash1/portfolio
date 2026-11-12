import { createHash } from "node:crypto";
import { asc, eq, sql, DrizzleQueryError } from "drizzle-orm";
import type { Database } from "../db/client";
import { inspoItems } from "../db/schema";
import type { InspoItem } from "../../components/inspo/types";
import { itemUrlKey } from "../../lib/inspo";
import { EditorError } from "./http";
import type { ItemStore } from "./store";
import { deleteInspoAsset, inspoAssetKey, uploadInspoAsset } from "./s3Assets";

/** Every media URL an item points at. */
function mediaSources(item: InspoItem): string[] {
  return [
    "image" in item ? item.image?.src : undefined,
    item.kind === "font" ? item.font.src : undefined,
    "mediaSrc" in item ? item.mediaSrc : undefined,
  ].filter((src): src is string => !!src);
}

function itemSource(item: InspoItem) {
  const url = item.source?.url ?? (item.kind === "tweet" ? item.url : null);
  const key = url ? itemUrlKey(url) : null;
  return {
    key,
    hash: key ? createHash("sha256").update(key).digest("hex") : null,
  };
}

/** Unique hashes keep long URLs out of PostgreSQL's B-tree index size limit. */
export function createPostgresStore(db: Database): ItemStore {
  return {
    async read() {
      const rows = await db
        .select({ item: inspoItems.item })
        .from(inspoItems)
        .orderBy(asc(inspoItems.ordinal));
      return rows.map((row) => row.item);
    },
    async add(item) {
      const source = itemSource(item);
      try {
        const inserted = await db
          .insert(inspoItems)
          .values({
            id: item.id,
            sourceKey: source.key,
            sourceHash: source.hash,
            item,
          })
          .onConflictDoNothing({ target: inspoItems.id })
          .returning({ item: inspoItems.item });
        if (inserted[0]) return inserted[0].item;
        const existing = await db
          .select({ item: inspoItems.item })
          .from(inspoItems)
          .where(eq(inspoItems.id, item.id))
          .limit(1);
        if (existing[0]) return existing[0].item;
        throw new EditorError(
          "This item changed while saving. Please try again.",
          409,
        );
      } catch (error) {
        const cause = error instanceof DrizzleQueryError ? error.cause : error;
        if (
          typeof cause === "object" &&
          cause !== null &&
          "code" in cause &&
          cause.code === "23505" &&
          "constraint" in cause &&
          cause.constraint === "items_source_hash_key"
        ) {
          throw new EditorError("That URL is already on the board.", 409);
        }
        throw error;
      }
    },
    async remove(id) {
      const [found] = await db
        .select({ item: inspoItems.item })
        .from(inspoItems)
        .where(eq(inspoItems.id, id))
        .limit(1);
      if (!found) return;
      for (const src of mediaSources(found.item)) {
        const key = inspoAssetKey(src);
        if (!key) continue;
        // Leave files another item still points at.
        const [shared] = await db
          .select({ id: inspoItems.id })
          .from(inspoItems)
          .where(
            sql`${inspoItems.id} <> ${id} AND (${inspoItems.item}->'image'->>'src' = ${src} OR ${inspoItems.item}->'font'->>'src' = ${src} OR ${inspoItems.item}->>'mediaSrc' = ${src})`,
          )
          .limit(1);
        if (shared) continue;
        // Keep the row available for a retry if storage cannot delete its media.
        try {
          await deleteInspoAsset(key);
        } catch {
          throw new EditorError(
            "Media couldn’t be deleted right now. Please try again.",
            503,
          );
        }
      }
      await db.delete(inspoItems).where(eq(inspoItems.id, id));
    },
    async asset(bytes, extension, contentType) {
      return uploadInspoAsset(bytes, extension, contentType);
    },
    async discardAsset(src) {
      const key = inspoAssetKey(src);
      if (key) await deleteInspoAsset(key);
    },
  };
}
