CREATE TABLE "inspo"."visitor_count" (
	"id" integer PRIMARY KEY NOT NULL,
	"count" bigint NOT NULL,
	CONSTRAINT "visitor_count_singleton" CHECK ("inspo"."visitor_count"."id" = 1),
	CONSTRAINT "visitor_count_nonnegative" CHECK ("inspo"."visitor_count"."count" >= 0)
);
