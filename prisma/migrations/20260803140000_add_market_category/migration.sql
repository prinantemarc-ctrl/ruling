-- CreateEnum
CREATE TYPE "MarketCategory" AS ENUM (
  'POLITICS',
  'ELECTIONS',
  'GEOPOLITICS',
  'CONFLICTS',
  'ECONOMY',
  'CRYPTO',
  'TECH',
  'SCIENCE',
  'SPORTS',
  'ESPORTS',
  'CULTURE',
  'OTHER'
);

-- AlterTable
ALTER TABLE "Market" ADD COLUMN "category" "MarketCategory" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "Market_category_idx" ON "Market"("category");
