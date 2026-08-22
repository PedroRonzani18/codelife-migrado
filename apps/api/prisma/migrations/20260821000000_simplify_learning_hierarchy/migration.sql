-- Replace the compositional learning graph with the direct hierarchy used by
-- the experimental scope: Island -> Level -> Slide. Existing learning content
-- is preserved when every level and slide has exactly one parent position.
-- Compositional progress is intentionally not guessed or silently discarded.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "UserTrailProgress")
    OR EXISTS (SELECT 1 FROM "UserIslandProgress")
    OR EXISTS (SELECT 1 FROM "UserLevelProgress") THEN
    RAISE EXCEPTION
      'TCC-15 hierarchy simplification blocked: compositional progress contains records; progress must be handled explicitly.';
  END IF;

  IF EXISTS (
    SELECT level."id"
    FROM "Level" level
    LEFT JOIN "IslandLevel" positioned ON positioned."levelId" = level."id"
    GROUP BY level."id"
    HAVING count(positioned."id") <> 1
  ) THEN
    RAISE EXCEPTION
      'TCC-15 hierarchy simplification blocked: every Level must have exactly one IslandLevel position.';
  END IF;

  IF EXISTS (
    SELECT slide."id"
    FROM "Slide" slide
    LEFT JOIN "LevelSlide" positioned ON positioned."slideId" = slide."id"
    GROUP BY slide."id"
    HAVING count(positioned."id") <> 1
  ) THEN
    RAISE EXCEPTION
      'TCC-15 hierarchy simplification blocked: every Slide must have exactly one LevelSlide position.';
  END IF;
END $$;

ALTER TABLE "Level" ADD COLUMN "islandId" UUID;
ALTER TABLE "Level" ADD COLUMN "position" INTEGER;

UPDATE "Level" level
SET "islandId" = positioned."islandId",
    "position" = positioned."position"
FROM "IslandLevel" positioned
WHERE positioned."levelId" = level."id";

ALTER TABLE "Slide" ADD COLUMN "levelId" UUID;
ALTER TABLE "Slide" ADD COLUMN "position" INTEGER;

UPDATE "Slide" slide
SET "levelId" = positioned."levelId",
    "position" = positioned."position"
FROM "LevelSlide" positioned
WHERE positioned."slideId" = slide."id";

DROP TABLE "UserLevelProgress";
DROP TABLE "UserIslandProgress";
DROP TABLE "UserTrailProgress";
DROP TABLE "LevelSlide";
DROP TABLE "IslandLevel";
DROP TABLE "TrailIsland";
DROP TABLE "Trail";

ALTER TABLE "Level"
  ALTER COLUMN "islandId" SET NOT NULL,
  ALTER COLUMN "position" SET NOT NULL,
  ADD CONSTRAINT "Level_position_positive" CHECK ("position" > 0),
  ADD CONSTRAINT "Level_islandId_fkey" FOREIGN KEY ("islandId") REFERENCES "Island"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE UNIQUE INDEX "Level_islandId_position_key" ON "Level"("islandId", "position");

ALTER TABLE "Slide"
  ALTER COLUMN "levelId" SET NOT NULL,
  ALTER COLUMN "position" SET NOT NULL,
  ADD CONSTRAINT "Slide_position_positive" CHECK ("position" > 0),
  ADD CONSTRAINT "Slide_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE UNIQUE INDEX "Slide_levelId_position_key" ON "Slide"("levelId", "position");

CREATE TABLE "UserIslandProgress" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "islandId" UUID NOT NULL,
  "currentLevelId" UUID NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserIslandProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserLevelProgress" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userIslandProgressId" UUID NOT NULL,
  "levelId" UUID NOT NULL,
  "currentSlideId" UUID NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserLevelProgress_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserIslandProgress"
  ADD CONSTRAINT "UserIslandProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserIslandProgress_islandId_fkey" FOREIGN KEY ("islandId") REFERENCES "Island"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserIslandProgress_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "UserLevelProgress"
  ADD CONSTRAINT "UserLevelProgress_userIslandProgressId_fkey" FOREIGN KEY ("userIslandProgressId") REFERENCES "UserIslandProgress"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserLevelProgress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserLevelProgress_currentSlideId_fkey" FOREIGN KEY ("currentSlideId") REFERENCES "Slide"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE UNIQUE INDEX "UserIslandProgress_userId_islandId_key" ON "UserIslandProgress"("userId", "islandId");
CREATE INDEX "UserIslandProgress_currentLevelId_idx" ON "UserIslandProgress"("currentLevelId");
CREATE UNIQUE INDEX "UserLevelProgress_userIslandProgressId_levelId_key" ON "UserLevelProgress"("userIslandProgressId", "levelId");
CREATE INDEX "UserLevelProgress_currentSlideId_idx" ON "UserLevelProgress"("currentSlideId");
