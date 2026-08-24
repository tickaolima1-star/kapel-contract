-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER');

-- CreateTable Organization
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable Membership
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'OPERATOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- AddOrganizationId Columns
ALTER TABLE "Client" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "Contract" ADD COLUMN "organization_id" TEXT;

-- CreateDefaultOrganization
INSERT INTO "Organization" ("id", "name", "slug", "active", "created_at", "updated_at")
VALUES ('org_kapel', 'KAPEL', 'kapel', true, NOW(), NOW());

-- BackfillLegacyRecords
UPDATE "Client" SET "organization_id" = 'org_kapel';
UPDATE "Contract" SET "organization_id" = 'org_kapel';

-- MakeOrganizationIdNotNull
ALTER TABLE "Client" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "Contract" ALTER COLUMN "organization_id" SET NOT NULL;

-- CreateIndexes
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Membership_user_id_idx" ON "Membership"("user_id");
CREATE UNIQUE INDEX "Membership_organization_id_user_id_key" ON "Membership"("organization_id", "user_id");

-- AddForeignKeys
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
