-- CreateEnum
CREATE TYPE "IdentityProvider" AS ENUM ('GOOGLE');

-- AlterTable
ALTER TABLE "Island" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Island" RENAME CONSTRAINT "Island_tcc15_pkey" TO "Island_pkey";

-- AlterTable
ALTER TABLE "Level" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Level" RENAME CONSTRAINT "Level_tcc15_pkey" TO "Level_pkey";

-- AlterTable
ALTER TABLE "MediaAsset" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Slide" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Slide" RENAME CONSTRAINT "Slide_tcc15_pkey" TO "Slide_pkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "User" RENAME CONSTRAINT "User_tcc15_pkey" TO "User_pkey";

-- AlterTable
ALTER TABLE "UserIslandProgress" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserLevelProgress" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ExternalIdentity" (
    "id" UUID NOT NULL,
    "provider" "IdentityProvider" NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentity_provider_subject_key" ON "ExternalIdentity"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentity_userId_provider_key" ON "ExternalIdentity"("userId", "provider");

-- AddForeignKey
ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- RenameIndex
ALTER INDEX "Island_tcc15_slug_key" RENAME TO "Island_slug_key";

-- RenameIndex
ALTER INDEX "User_tcc15_key_key" RENAME TO "User_key_key";

-- RenameIndex
ALTER INDEX "User_tcc15_username_key" RENAME TO "User_username_key";
