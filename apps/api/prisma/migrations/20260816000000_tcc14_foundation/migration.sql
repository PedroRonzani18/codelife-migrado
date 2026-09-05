CREATE TYPE "SlideType" AS ENUM ('TextText', 'TextImage', 'TextCode');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Island" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "Island_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Level" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "islandId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Slide" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "type" "SlideType" NOT NULL,
  "content" TEXT NOT NULL,
  CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "UserProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_key_key" ON "User"("key");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Island_key_key" ON "Island"("key");
CREATE UNIQUE INDEX "Island_sortOrder_key" ON "Island"("sortOrder");
CREATE UNIQUE INDEX "Level_key_key" ON "Level"("key");
CREATE UNIQUE INDEX "Level_islandId_sortOrder_key" ON "Level"("islandId", "sortOrder");
CREATE UNIQUE INDEX "Slide_key_key" ON "Slide"("key");
CREATE UNIQUE INDEX "Slide_levelId_sortOrder_key" ON "Slide"("levelId", "sortOrder");
CREATE UNIQUE INDEX "UserProgress_userId_levelId_key" ON "UserProgress"("userId", "levelId");
ALTER TABLE "Level" ADD CONSTRAINT "Level_islandId_fkey" FOREIGN KEY ("islandId") REFERENCES "Island"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Slide" ADD CONSTRAINT "Slide_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
