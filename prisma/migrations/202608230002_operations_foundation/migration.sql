CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'BLOCKED', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProjectHealth" AS ENUM ('HEALTHY', 'ATTENTION', 'CRITICAL');
CREATE TYPE "ProjectSource" AS ENUM ('MANUAL', 'SPREADSHEET', 'CLICKUP', 'OTHER');
CREATE TYPE "UpdateConfidence" AS ENUM ('CONFIRMED', 'ESTIMATED');
CREATE TYPE "WorkItemType" AS ENUM ('ACTION', 'FOLLOW_UP', 'REVIEW', 'DECISION');
CREATE TYPE "WorkItemStatus" AS ENUM ('OPEN', 'DOING', 'DONE', 'BLOCKED', 'CANCELLED');
CREATE TYPE "BlockerParty" AS ENUM ('KAPEL', 'CLIENT', 'PARTNER', 'THIRD_PARTY');
CREATE TYPE "BlockerStatus" AS ENUM ('OPEN', 'RESOLVED', 'WAIVED');
CREATE TYPE "CommandActionType" AS ENUM ('START', 'COMPLETE', 'DEFER', 'DELEGATE');

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "contracting_client_id" TEXT NOT NULL,
  "contract_id" TEXT,
  "name" TEXT NOT NULL,
  "end_client_name" TEXT,
  "objective" TEXT NOT NULL,
  "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
  "health" "ProjectHealth" NOT NULL DEFAULT 'HEALTHY',
  "owner_membership_id" TEXT NOT NULL,
  "deadline" TIMESTAMP(3),
  "weekly_hours_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monthly_value_at_risk" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "strategic_value" INTEGER NOT NULL DEFAULT 3,
  "mental_load" INTEGER NOT NULL DEFAULT 3,
  "source" "ProjectSource" NOT NULL DEFAULT 'MANUAL',
  "external_id" TEXT,
  "external_url" TEXT,
  "last_update_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_strategic_value_check" CHECK ("strategic_value" BETWEEN 1 AND 5),
  CONSTRAINT "Project_mental_load_check" CHECK ("mental_load" BETWEEN 1 AND 5),
  CONSTRAINT "Project_weekly_hours_check" CHECK ("weekly_hours_estimate" >= 0),
  CONSTRAINT "Project_monthly_risk_check" CHECK ("monthly_value_at_risk" >= 0)
);

CREATE TABLE "ProjectUpdate" (
  "id" TEXT NOT NULL, "organization_id" TEXT NOT NULL, "project_id" TEXT NOT NULL,
  "author_membership_id" TEXT NOT NULL, "summary" TEXT NOT NULL, "next_action" TEXT NOT NULL,
  "blocker" TEXT, "metric_label" TEXT, "metric_value" TEXT,
  "confidence" "UpdateConfidence" NOT NULL DEFAULT 'CONFIRMED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkItem" (
  "id" TEXT NOT NULL, "organization_id" TEXT NOT NULL, "project_id" TEXT NOT NULL,
  "assignee_membership_id" TEXT, "title" TEXT NOT NULL,
  "type" "WorkItemType" NOT NULL DEFAULT 'ACTION', "status" "WorkItemStatus" NOT NULL DEFAULT 'OPEN',
  "due_at" TIMESTAMP(3), "estimated_minutes" INTEGER, "external_source" TEXT, "external_id" TEXT,
  "completed_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkItem_estimated_minutes_check" CHECK ("estimated_minutes" IS NULL OR "estimated_minutes" > 0)
);

CREATE TABLE "OperationalBlocker" (
  "id" TEXT NOT NULL, "organization_id" TEXT NOT NULL, "project_id" TEXT NOT NULL,
  "description" TEXT NOT NULL, "responsible_party" "BlockerParty" NOT NULL,
  "blocks_delivery" BOOLEAN NOT NULL DEFAULT true, "status" "BlockerStatus" NOT NULL DEFAULT 'OPEN',
  "follow_up_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3), CONSTRAINT "OperationalBlocker_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommandAction" (
  "id" TEXT NOT NULL, "organization_id" TEXT NOT NULL, "work_item_id" TEXT NOT NULL,
  "actor_membership_id" TEXT NOT NULL, "action" "CommandActionType" NOT NULL,
  "previous_status" "WorkItemStatus" NOT NULL, "resulting_status" "WorkItemStatus" NOT NULL,
  "reason" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommandAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Project_organization_id_status_health_idx" ON "Project"("organization_id", "status", "health");
CREATE INDEX "Project_organization_id_deadline_idx" ON "Project"("organization_id", "deadline");
CREATE UNIQUE INDEX "Project_organization_id_source_external_id_key" ON "Project"("organization_id", "source", "external_id");
CREATE INDEX "ProjectUpdate_organization_id_project_id_created_at_idx" ON "ProjectUpdate"("organization_id", "project_id", "created_at");
CREATE INDEX "WorkItem_organization_id_status_due_at_idx" ON "WorkItem"("organization_id", "status", "due_at");
CREATE UNIQUE INDEX "WorkItem_organization_id_external_source_external_id_key" ON "WorkItem"("organization_id", "external_source", "external_id");
CREATE INDEX "OperationalBlocker_organization_id_status_follow_up_at_idx" ON "OperationalBlocker"("organization_id", "status", "follow_up_at");
CREATE INDEX "OperationalBlocker_organization_id_project_id_idx" ON "OperationalBlocker"("organization_id", "project_id");
CREATE INDEX "CommandAction_organization_id_created_at_idx" ON "CommandAction"("organization_id", "created_at");

ALTER TABLE "Project" ADD CONSTRAINT "Project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_contracting_client_id_fkey" FOREIGN KEY ("contracting_client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_owner_membership_id_fkey" FOREIGN KEY ("owner_membership_id") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_author_membership_id_fkey" FOREIGN KEY ("author_membership_id") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_assignee_membership_id_fkey" FOREIGN KEY ("assignee_membership_id") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperationalBlocker" ADD CONSTRAINT "OperationalBlocker_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalBlocker" ADD CONSTRAINT "OperationalBlocker_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommandAction" ADD CONSTRAINT "CommandAction_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommandAction" ADD CONSTRAINT "CommandAction_work_item_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommandAction" ADD CONSTRAINT "CommandAction_actor_membership_id_fkey" FOREIGN KEY ("actor_membership_id") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
