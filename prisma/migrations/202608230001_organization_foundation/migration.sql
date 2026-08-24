CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER');

CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

INSERT INTO "Organization" ("id", "name", "slug", "active", "created_at", "updated_at")
VALUES ('org_kapel', 'KAPEL', 'kapel', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "MembershipRole" NOT NULL DEFAULT 'OPERATOR',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Client" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "Contract" ADD COLUMN "organization_id" TEXT;

UPDATE "Client" SET "organization_id" = 'org_kapel' WHERE "organization_id" IS NULL;
UPDATE "Contract" SET "organization_id" = 'org_kapel' WHERE "organization_id" IS NULL;

ALTER TABLE "Client" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "Contract" ALTER COLUMN "organization_id" SET NOT NULL;

CREATE UNIQUE INDEX "Membership_organization_id_user_id_key" ON "Membership"("organization_id", "user_id");
CREATE INDEX "Membership_user_id_idx" ON "Membership"("user_id");
CREATE INDEX "Client_organization_id_idx" ON "Client"("organization_id");
CREATE INDEX "Contract_organization_id_idx" ON "Contract"("organization_id");

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
