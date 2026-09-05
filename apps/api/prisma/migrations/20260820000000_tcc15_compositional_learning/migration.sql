-- TCC-15 only supports upgrading the controlled TCC-14 foundation when no
-- historical progress exists. The check intentionally runs before any schema
-- change, so a blocked database remains untouched and can be handled manually.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "UserProgress") THEN
    RAISE EXCEPTION
      'TCC-15 migration blocked: legacy UserProgress contains records; historical progress is not migrated or deleted.';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Build replacement atomic tables while the direct TCC-14 hierarchy remains
-- readable. The controlled TCC-14 fixture is copied into the new composition;
-- the deterministic rows are then maintained by the non-destructive seed.
CREATE TABLE "User_tcc15" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_tcc15_pkey" PRIMARY KEY ("id")
);

INSERT INTO "User_tcc15" ("id", "key", "username", "displayName", "createdAt", "updatedAt")
SELECT
  CASE WHEN "key" = 'aluna-demo'
    THEN '00000000-0000-4000-8000-000000000001'::uuid
    ELSE gen_random_uuid()
  END,
  "key",
  "username",
  "displayName",
  "createdAt",
  "updatedAt"
FROM "User";

CREATE UNIQUE INDEX "User_tcc15_key_key" ON "User_tcc15"("key");
CREATE UNIQUE INDEX "User_tcc15_username_key" ON "User_tcc15"("username");

CREATE TABLE "Island_tcc15" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Island_tcc15_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Island_tcc15" ("id", "slug", "title", "createdAt", "updatedAt")
SELECT
  CASE WHEN "key" = 'island-3'
    THEN '00000000-0000-4000-8000-000000000301'::uuid
    ELSE gen_random_uuid()
  END,
  "key",
  "title",
  "createdAt",
  "updatedAt"
FROM "Island";

CREATE UNIQUE INDEX "Island_tcc15_slug_key" ON "Island_tcc15"("slug");

CREATE TABLE "Level_tcc15" (
  "id" UUID NOT NULL,
  "legacyKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Level_tcc15_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Level_tcc15_legacyKey_key" UNIQUE ("legacyKey")
);

INSERT INTO "Level_tcc15" ("id", "legacyKey", "title", "createdAt", "updatedAt")
SELECT
  CASE "key"
    WHEN 'island-3-l1' THEN '00000000-0000-4000-8000-000000000501'::uuid
    WHEN 'island-3-l2' THEN '00000000-0000-4000-8000-000000000502'::uuid
    WHEN 'island-3-l3' THEN '00000000-0000-4000-8000-000000000503'::uuid
    ELSE gen_random_uuid()
  END,
  "key",
  "title",
  "createdAt",
  "updatedAt"
FROM "Level";

CREATE TABLE "Slide_tcc15" (
  "id" UUID NOT NULL,
  "legacyKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "SlideType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Slide_tcc15_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Slide_tcc15_legacyKey_key" UNIQUE ("legacyKey")
);

INSERT INTO "Slide_tcc15" ("id", "legacyKey", "title", "type", "createdAt", "updatedAt")
SELECT
  CASE "key"
    WHEN 'island-3-l1-s1' THEN '00000000-0000-4000-8000-000000000701'::uuid
    WHEN 'island-3-l1-s2' THEN '00000000-0000-4000-8000-000000000702'::uuid
    WHEN 'island-3-l1-s3' THEN '00000000-0000-4000-8000-000000000703'::uuid
    WHEN 'island-3-l2-s1' THEN '00000000-0000-4000-8000-000000000704'::uuid
    WHEN 'island-3-l2-s2' THEN '00000000-0000-4000-8000-000000000705'::uuid
    WHEN 'island-3-l2-s3' THEN '00000000-0000-4000-8000-000000000706'::uuid
    WHEN 'island-3-l3-s1' THEN '00000000-0000-4000-8000-000000000707'::uuid
    WHEN 'island-3-l3-s2' THEN '00000000-0000-4000-8000-000000000708'::uuid
    WHEN 'island-3-l3-s3' THEN '00000000-0000-4000-8000-000000000709'::uuid
    ELSE gen_random_uuid()
  END,
  "key",
  "title",
  "type",
  "createdAt",
  "updatedAt"
FROM "Slide";

CREATE TABLE "Trail" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Trail_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Trail" ("id", "slug", "title")
VALUES ('00000000-0000-4000-8000-000000000201', 'codelife', 'CodeLife');

CREATE UNIQUE INDEX "Trail_slug_key" ON "Trail"("slug");

CREATE TABLE "MediaAsset" (
  "id" UUID NOT NULL,
  "objectKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "checksum" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MediaAsset" ("id", "objectKey", "mimeType") VALUES
  ('00000000-0000-4000-8000-000000000901', 'learning/island-3/variables.svg', 'image/svg+xml'),
  ('00000000-0000-4000-8000-000000000902', 'learning/island-3/events.svg', 'image/svg+xml'),
  ('00000000-0000-4000-8000-000000000903', 'learning/island-3/dom.svg', 'image/svg+xml');

-- Existing non-fixture TextImage records remain readable through a controlled
-- placeholder. The normal TCC-14 fixture and a fresh database do not create it.
INSERT INTO "MediaAsset" ("id", "objectKey", "mimeType")
SELECT '00000000-0000-4000-8000-000000000999'::uuid, 'learning/legacy/placeholder.svg', 'image/svg+xml'
WHERE EXISTS (
  SELECT 1
  FROM "Slide"
  WHERE "type" = 'TextImage'
    AND "key" NOT IN ('island-3-l1-s3', 'island-3-l2-s3', 'island-3-l3-s3')
);

CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

CREATE TABLE "TrailIsland" (
  "id" UUID NOT NULL,
  "trailId" UUID NOT NULL,
  "islandId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrailIsland_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TrailIsland_position_positive" CHECK ("position" > 0)
);

INSERT INTO "TrailIsland" ("id", "trailId", "islandId", "position", "createdAt", "updatedAt")
SELECT
  CASE i."key"
    WHEN 'island-3' THEN '00000000-0000-4000-8000-000000000401'::uuid
    ELSE gen_random_uuid()
  END,
  '00000000-0000-4000-8000-000000000201'::uuid,
  replacement."id",
  i."sortOrder" + 1,
  i."createdAt",
  i."updatedAt"
FROM "Island" i
JOIN "Island_tcc15" replacement ON replacement."slug" = i."key";

CREATE UNIQUE INDEX "TrailIsland_trailId_position_key" ON "TrailIsland"("trailId", "position");
CREATE INDEX "TrailIsland_islandId_idx" ON "TrailIsland"("islandId");

CREATE TABLE "IslandLevel" (
  "id" UUID NOT NULL,
  "islandId" UUID NOT NULL,
  "levelId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IslandLevel_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IslandLevel_position_positive" CHECK ("position" > 0)
);

INSERT INTO "IslandLevel" ("id", "islandId", "levelId", "position", "createdAt", "updatedAt")
SELECT
  CASE l."key"
    WHEN 'island-3-l1' THEN '00000000-0000-4000-8000-000000000601'::uuid
    WHEN 'island-3-l2' THEN '00000000-0000-4000-8000-000000000602'::uuid
    WHEN 'island-3-l3' THEN '00000000-0000-4000-8000-000000000603'::uuid
    ELSE gen_random_uuid()
  END,
  islandReplacement."id",
  levelReplacement."id",
  l."sortOrder" + 1,
  l."createdAt",
  l."updatedAt"
FROM "Level" l
JOIN "Island" i ON i."id" = l."islandId"
JOIN "Island_tcc15" islandReplacement ON islandReplacement."slug" = i."key"
JOIN "Level_tcc15" levelReplacement ON levelReplacement."legacyKey" = l."key";

CREATE UNIQUE INDEX "IslandLevel_islandId_position_key" ON "IslandLevel"("islandId", "position");
CREATE INDEX "IslandLevel_levelId_idx" ON "IslandLevel"("levelId");

CREATE TABLE "LevelSlide" (
  "id" UUID NOT NULL,
  "levelId" UUID NOT NULL,
  "slideId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LevelSlide_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LevelSlide_position_positive" CHECK ("position" > 0)
);

INSERT INTO "LevelSlide" ("id", "levelId", "slideId", "position", "createdAt", "updatedAt")
SELECT
  CASE s."key"
    WHEN 'island-3-l1-s1' THEN '00000000-0000-4000-8000-000000000801'::uuid
    WHEN 'island-3-l1-s2' THEN '00000000-0000-4000-8000-000000000802'::uuid
    WHEN 'island-3-l1-s3' THEN '00000000-0000-4000-8000-000000000803'::uuid
    WHEN 'island-3-l2-s1' THEN '00000000-0000-4000-8000-000000000804'::uuid
    WHEN 'island-3-l2-s2' THEN '00000000-0000-4000-8000-000000000805'::uuid
    WHEN 'island-3-l2-s3' THEN '00000000-0000-4000-8000-000000000806'::uuid
    WHEN 'island-3-l3-s1' THEN '00000000-0000-4000-8000-000000000807'::uuid
    WHEN 'island-3-l3-s2' THEN '00000000-0000-4000-8000-000000000808'::uuid
    WHEN 'island-3-l3-s3' THEN '00000000-0000-4000-8000-000000000809'::uuid
    ELSE gen_random_uuid()
  END,
  levelReplacement."id",
  slideReplacement."id",
  s."sortOrder" + 1,
  s."createdAt",
  s."updatedAt"
FROM "Slide" s
JOIN "Level" l ON l."id" = s."levelId"
JOIN "Level_tcc15" levelReplacement ON levelReplacement."legacyKey" = l."key"
JOIN "Slide_tcc15" slideReplacement ON slideReplacement."legacyKey" = s."key";

CREATE UNIQUE INDEX "LevelSlide_levelId_position_key" ON "LevelSlide"("levelId", "position");
CREATE INDEX "LevelSlide_slideId_idx" ON "LevelSlide"("slideId");

CREATE TABLE "TextTextSlide" (
  "slideId" UUID NOT NULL,
  "primaryText" TEXT NOT NULL,
  "secondaryText" TEXT,
  CONSTRAINT "TextTextSlide_pkey" PRIMARY KEY ("slideId")
);

INSERT INTO "TextTextSlide" ("slideId", "primaryText")
SELECT replacement."id", legacy."content"
FROM "Slide" legacy
JOIN "Slide_tcc15" replacement ON replacement."legacyKey" = legacy."key"
WHERE legacy."type" = 'TextText';

CREATE TABLE "TextImageSlide" (
  "slideId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "mediaAssetId" UUID NOT NULL,
  "altText" TEXT NOT NULL,
  CONSTRAINT "TextImageSlide_pkey" PRIMARY KEY ("slideId")
);

INSERT INTO "TextImageSlide" ("slideId", "text", "mediaAssetId", "altText")
SELECT
  replacement."id",
  legacy."content",
  CASE legacy."key"
    WHEN 'island-3-l1-s3' THEN '00000000-0000-4000-8000-000000000901'::uuid
    WHEN 'island-3-l2-s3' THEN '00000000-0000-4000-8000-000000000902'::uuid
    WHEN 'island-3-l3-s3' THEN '00000000-0000-4000-8000-000000000903'::uuid
    ELSE '00000000-0000-4000-8000-000000000999'::uuid
  END,
  legacy."title"
FROM "Slide" legacy
JOIN "Slide_tcc15" replacement ON replacement."legacyKey" = legacy."key"
WHERE legacy."type" = 'TextImage';

CREATE INDEX "TextImageSlide_mediaAssetId_idx" ON "TextImageSlide"("mediaAssetId");

CREATE TABLE "TextCodeSlide" (
  "slideId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  CONSTRAINT "TextCodeSlide_pkey" PRIMARY KEY ("slideId")
);

INSERT INTO "TextCodeSlide" ("slideId", "text", "code", "language")
SELECT replacement."id", legacy."title", legacy."content", 'javascript'
FROM "Slide" legacy
JOIN "Slide_tcc15" replacement ON replacement."legacyKey" = legacy."key"
WHERE legacy."type" = 'TextCode';

CREATE TABLE "UserTrailProgress" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "trailId" UUID NOT NULL,
  "currentTrailIslandId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserTrailProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserIslandProgress" (
  "id" UUID NOT NULL,
  "userTrailProgressId" UUID NOT NULL,
  "trailIslandId" UUID NOT NULL,
  "currentIslandLevelId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserIslandProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserLevelProgress" (
  "id" UUID NOT NULL,
  "userIslandProgressId" UUID NOT NULL,
  "islandLevelId" UUID NOT NULL,
  "currentLevelSlideId" UUID NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserLevelProgress_pkey" PRIMARY KEY ("id")
);

-- The old direct hierarchy is no longer the source of truth. It is removed
-- only after all controlled content has been copied into the new tables.
DROP TABLE "UserProgress";
DROP TABLE "Slide";
DROP TABLE "Level";
DROP TABLE "Island";
DROP TABLE "User";

ALTER TABLE "User_tcc15" RENAME TO "User";
ALTER TABLE "Island_tcc15" RENAME TO "Island";
ALTER TABLE "Level_tcc15" DROP COLUMN "legacyKey";
ALTER TABLE "Level_tcc15" RENAME TO "Level";
ALTER TABLE "Slide_tcc15" DROP COLUMN "legacyKey";
ALTER TABLE "Slide_tcc15" RENAME TO "Slide";

ALTER TABLE "TrailIsland"
  ADD CONSTRAINT "TrailIsland_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "TrailIsland_islandId_fkey" FOREIGN KEY ("islandId") REFERENCES "Island"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "IslandLevel"
  ADD CONSTRAINT "IslandLevel_islandId_fkey" FOREIGN KEY ("islandId") REFERENCES "Island"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "IslandLevel_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "LevelSlide"
  ADD CONSTRAINT "LevelSlide_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "LevelSlide_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "TextTextSlide"
  ADD CONSTRAINT "TextTextSlide_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "TextImageSlide"
  ADD CONSTRAINT "TextImageSlide_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "TextImageSlide_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "TextCodeSlide"
  ADD CONSTRAINT "TextCodeSlide_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "UserTrailProgress"
  ADD CONSTRAINT "UserTrailProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserTrailProgress_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserTrailProgress_currentTrailIslandId_fkey" FOREIGN KEY ("currentTrailIslandId") REFERENCES "TrailIsland"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "UserIslandProgress"
  ADD CONSTRAINT "UserIslandProgress_userTrailProgressId_fkey" FOREIGN KEY ("userTrailProgressId") REFERENCES "UserTrailProgress"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserIslandProgress_trailIslandId_fkey" FOREIGN KEY ("trailIslandId") REFERENCES "TrailIsland"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserIslandProgress_currentIslandLevelId_fkey" FOREIGN KEY ("currentIslandLevelId") REFERENCES "IslandLevel"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "UserLevelProgress"
  ADD CONSTRAINT "UserLevelProgress_userIslandProgressId_fkey" FOREIGN KEY ("userIslandProgressId") REFERENCES "UserIslandProgress"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserLevelProgress_islandLevelId_fkey" FOREIGN KEY ("islandLevelId") REFERENCES "IslandLevel"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "UserLevelProgress_currentLevelSlideId_fkey" FOREIGN KEY ("currentLevelSlideId") REFERENCES "LevelSlide"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE UNIQUE INDEX "UserTrailProgress_userId_trailId_key" ON "UserTrailProgress"("userId", "trailId");
CREATE INDEX "UserTrailProgress_currentTrailIslandId_idx" ON "UserTrailProgress"("currentTrailIslandId");
CREATE UNIQUE INDEX "UserIslandProgress_userTrailProgressId_trailIslandId_key" ON "UserIslandProgress"("userTrailProgressId", "trailIslandId");
CREATE INDEX "UserIslandProgress_currentIslandLevelId_idx" ON "UserIslandProgress"("currentIslandLevelId");
CREATE UNIQUE INDEX "UserLevelProgress_userIslandProgressId_islandLevelId_key" ON "UserLevelProgress"("userIslandProgressId", "islandLevelId");
CREATE INDEX "UserLevelProgress_currentLevelSlideId_idx" ON "UserLevelProgress"("currentLevelSlideId");
