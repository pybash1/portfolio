-- Baseline: this table was provisioned before Drizzle. Keep its existing rows.
CREATE SCHEMA IF NOT EXISTS "inspo";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inspo"."items" (
	"id" text PRIMARY KEY NOT NULL,
	"ordinal" bigint GENERATED ALWAYS AS IDENTITY (sequence name "inspo"."items_ordinal_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"source_key" text,
	"source_hash" text,
	"item" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_ordinal_key" UNIQUE("ordinal"),
	CONSTRAINT "items_source_hash_key" UNIQUE("source_hash"),
	CONSTRAINT "item_identity" CHECK (jsonb_typeof("inspo"."items"."item") = 'object' AND "inspo"."items"."item" ? 'id' AND "inspo"."items"."item" ->> 'id' = "inspo"."items"."id"),
	CONSTRAINT "source_identity" CHECK (("inspo"."items"."source_key" IS NULL AND "inspo"."items"."source_hash" IS NULL) OR ("inspo"."items"."source_key" IS NOT NULL AND "inspo"."items"."source_hash" IS NOT NULL AND length("inspo"."items"."source_hash") = 64))
);
