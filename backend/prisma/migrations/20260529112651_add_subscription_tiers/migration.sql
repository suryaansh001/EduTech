-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "featuresEnabled" JSONB,
ADD COLUMN     "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "tierUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "feature_access" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "featureName" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feature_overrides" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feature_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_access_tier_idx" ON "feature_access"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "feature_access_tier_featureName_key" ON "feature_access"("tier", "featureName");

-- CreateIndex
CREATE INDEX "user_feature_overrides_userId_idx" ON "user_feature_overrides"("userId");

-- CreateIndex
CREATE INDEX "user_feature_overrides_expiresAt_idx" ON "user_feature_overrides"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_feature_overrides_userId_featureName_key" ON "user_feature_overrides"("userId", "featureName");

-- CreateIndex
CREATE INDEX "users_subscriptionTier_idx" ON "users"("subscriptionTier");

-- AddForeignKey
ALTER TABLE "user_feature_overrides" ADD CONSTRAINT "user_feature_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
