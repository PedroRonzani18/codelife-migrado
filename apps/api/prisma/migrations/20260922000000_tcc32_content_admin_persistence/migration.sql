-- TCC-32 / TCC-33: Content administration and catalog persistence
-- Adds sequential position and publishedAt to Island, and publishedAt to Level.
-- Deterministically positions existing islands and marks current content as published.

ALTER TABLE "Island" ADD COLUMN "position" INTEGER;
ALTER TABLE "Island" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "Level" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Assign deterministic positions to existing islands and mark them as published
WITH numbered_islands AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS "pos"
  FROM "Island"
)
UPDATE "Island" i
SET "position" = n."pos",
    "publishedAt" = COALESCE(i."publishedAt", CURRENT_TIMESTAMP)
FROM numbered_islands n
WHERE i."id" = n."id";

-- Mark existing levels as published to preserve the current experimental learning flow
UPDATE "Level"
SET "publishedAt" = CURRENT_TIMESTAMP
WHERE "publishedAt" IS NULL;

-- Enforce positive and unique positions on Island
ALTER TABLE "Island"
  ALTER COLUMN "position" SET NOT NULL,
  ADD CONSTRAINT "Island_position_positive" CHECK ("position" > 0);

CREATE UNIQUE INDEX "Island_position_key" ON "Island"("position");
