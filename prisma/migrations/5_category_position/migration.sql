-- Let users choose the order of their categories.
ALTER TABLE "categories" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Keep the current order (creation order) for existing categories.
UPDATE "categories" AS c
SET "position" = ranked.position
FROM (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "created_at", "id") - 1 AS position
  FROM "categories"
) AS ranked
WHERE c."id" = ranked."id";

DROP INDEX "categories_user_id_idx";
CREATE INDEX "categories_user_id_position_idx" ON "categories"("user_id", "position");
