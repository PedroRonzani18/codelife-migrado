-- Preserve content and learning history unless callers remove dependents explicitly.
ALTER TABLE "Level" DROP CONSTRAINT "Level_islandId_fkey";
ALTER TABLE "Slide" DROP CONSTRAINT "Slide_levelId_fkey";
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_userId_fkey";
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_levelId_fkey";

ALTER TABLE "Level"
  ADD CONSTRAINT "Level_islandId_fkey"
  FOREIGN KEY ("islandId") REFERENCES "Island"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Slide"
  ADD CONSTRAINT "Slide_levelId_fkey"
  FOREIGN KEY ("levelId") REFERENCES "Level"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserProgress"
  ADD CONSTRAINT "UserProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserProgress"
  ADD CONSTRAINT "UserProgress_levelId_fkey"
  FOREIGN KEY ("levelId") REFERENCES "Level"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill updatedAt before enforcing NOT NULL so this migration remains safe for
-- databases that already contain the experimental fixture.
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3);
ALTER TABLE "Island"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
ALTER TABLE "Level"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
ALTER TABLE "Slide"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "User" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
UPDATE "Island" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
UPDATE "Level" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
UPDATE "Slide" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Island" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Level" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Slide" ALTER COLUMN "updatedAt" SET NOT NULL;
