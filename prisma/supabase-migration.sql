-- ==========================================================
-- KAPEL CONTRACT - MIGRATION DDL PARA SUPABASE POSTGRESQL
-- ==========================================================

-- 1. Tabela de Configurações da Empresa (KAPEL)
CREATE TABLE IF NOT EXISTS "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "legal_name" TEXT NOT NULL DEFAULT '67.726.428 PATRICK EDUARDO LIMA SILVA',
    "trade_name" TEXT NOT NULL DEFAULT 'KAPEL',
    "cnpj" TEXT NOT NULL DEFAULT '67.726.428/0001-97',
    "address" TEXT NOT NULL DEFAULT 'Av. Paulista, 1000, Sala 501',
    "neighborhood" TEXT NOT NULL DEFAULT 'Bela Vista',
    "zip_code" TEXT NOT NULL DEFAULT '01310-100',
    "city" TEXT NOT NULL DEFAULT 'São Paulo',
    "state" TEXT NOT NULL DEFAULT 'SP',
    "legal_representative" TEXT NOT NULL DEFAULT 'Patrick Eduardo Lima Silva',
    "rep_cpf" TEXT NOT NULL DEFAULT '000.000.000-00',
    "email" TEXT NOT NULL DEFAULT 'contato@kapel.digital',
    "phone" TEXT NOT NULL DEFAULT '+55 (11) 99999-9999',
    "jurisdiction_city" TEXT NOT NULL DEFAULT 'São Paulo',
    "jurisdiction_state" TEXT NOT NULL DEFAULT 'SP',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Usuários
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Clientes
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'PJ',
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "document" TEXT NOT NULL,
    "state_registration" TEXT,
    "address" TEXT,
    "address_number" TEXT,
    "neighborhood" TEXT,
    "zip_code" TEXT,
    "city" TEXT,
    "state" TEXT,
    "representative_name" TEXT,
    "representative_cpf" TEXT,
    "representative_role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Categorias e Serviços
CREATE TABLE IF NOT EXISTS "ServiceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "default_price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "billing_type" TEXT NOT NULL DEFAULT 'MONTHLY_ARREARS',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "default_clauses" TEXT,
    "settings" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cláusulas e Templates
CREATE TABLE IF NOT EXISTS "Clause" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GERAL',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContractTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'PERFORMANCE',
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "introduction" TEXT,
    "clause_order" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Contratos e Itens
CREATE TABLE IF NOT EXISTS "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_number" TEXT NOT NULL UNIQUE,
    "client_id" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE RESTRICT,
    "template_id" TEXT NOT NULL REFERENCES "ContractTemplate"("id") ON DELETE RESTRICT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "platforms" TEXT NOT NULL DEFAULT '[]',
    "landing_page_included" BOOLEAN NOT NULL DEFAULT false,
    "creatives_included" BOOLEAN NOT NULL DEFAULT false,
    "dashboard_included" BOOLEAN NOT NULL DEFAULT false,
    "crm_client_responsibility" BOOLEAN NOT NULL DEFAULT true,
    "technical_operational_autonomy" BOOLEAN NOT NULL DEFAULT true,
    "portfolio_permission" TEXT NOT NULL DEFAULT 'ALLOW',
    "portfolio_custom_text" TEXT,
    "meeting_frequency" TEXT NOT NULL DEFAULT '1 reunião mensal',
    "support_channels" TEXT NOT NULL DEFAULT 'WhatsApp, e-mail e grupo exclusivo',
    "support_hours" TEXT NOT NULL DEFAULT '08:00 às 18:00 (dias úteis)',
    "media_budget_payer" TEXT NOT NULL DEFAULT 'CLIENT',
    "media_budget_notes" TEXT NOT NULL DEFAULT 'Paga diretamente pelo Contratante às plataformas',
    "particularities" TEXT,
    "billing_type" TEXT NOT NULL DEFAULT 'MONTHLY_ARREARS',
    "due_day" INTEGER NOT NULL DEFAULT 10,
    "term_months" INTEGER NOT NULL DEFAULT 3,
    "notice_days" INTEGER NOT NULL DEFAULT 15,
    "early_termination_policy" TEXT NOT NULL DEFAULT 'NO_PENALTY',
    "early_termination_details" TEXT,
    "calculated_mrr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "calculated_initial_payment" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "calculated_future_milestones" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "calculated_total_one_time" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estimated_media_budget" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "candidate_name" TEXT,
    "candidate_number" TEXT,
    "candidate_role" TEXT,
    "candidate_state" TEXT,
    "party" TEXT,
    "federation_or_coalition" TEXT,
    "campaign_cnpj" TEXT,
    "commercial_contractor_type" TEXT DEFAULT 'CAMPAIGN',
    "campaign_start_date" TEXT,
    "campaign_end_date" TEXT,
    "approval_responsible" TEXT,
    "financial_responsible" TEXT,
    "electoral_lawyer" TEXT,
    "accounting_responsible" TEXT,
    "planned_media_budget" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "media_payment_responsible" TEXT NOT NULL DEFAULT 'CAMPAIGN',
    "chatbot_type" TEXT DEFAULT 'RULE_BASED',
    "chatbot_collects_personal_data" BOOLEAN NOT NULL DEFAULT false,
    "chatbot_uses_ai" BOOLEAN NOT NULL DEFAULT false,
    "chatbot_public_url" TEXT,
    "chatbot_content_approval_responsible" TEXT,
    "chatbot_data_retention_notes" TEXT,
    "chatbot_custom_scope" TEXT,
    "electoral_legal_review" TEXT NOT NULL DEFAULT 'PENDING',
    "accounting_review" TEXT NOT NULL DEFAULT 'PENDING',
    "campaign_content_approval" TEXT NOT NULL DEFAULT 'PENDING',
    "ai_used" BOOLEAN NOT NULL DEFAULT false,
    "personal_data_processed" BOOLEAN NOT NULL DEFAULT false,
    "mass_messaging" BOOLEAN NOT NULL DEFAULT false,
    "synthetic_content_used" BOOLEAN NOT NULL DEFAULT false,
    "subcontracting_permitted" BOOLEAN NOT NULL DEFAULT true,
    "subcontracting_clause_text" TEXT,
    "custom_clauses" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContractItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT NOT NULL REFERENCES "Contract"("id") ON DELETE CASCADE,
    "service_id" TEXT REFERENCES "Service"("id") ON DELETE SET NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "billing_type" TEXT NOT NULL DEFAULT 'MONTHLY_ARREARS',
    "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "milestone_description" TEXT,
    "duration_days" INTEGER,
    "is_addition" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "ContractSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT NOT NULL UNIQUE REFERENCES "Contract"("id") ON DELETE CASCADE,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "snapshot_data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT REFERENCES "Contract"("id") ON DELETE SET NULL,
    "user_name" TEXT NOT NULL DEFAULT 'Patrick (Admin)',
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Habilita Row Level Security (RLS)
ALTER TABLE "CompanySettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContractItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContractSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para acesso autenticado
CREATE POLICY "Permitir acesso autenticado em CompanySettings" ON "CompanySettings" FOR ALL USING (true);
CREATE POLICY "Permitir acesso autenticado em User" ON "User" FOR ALL USING (true);
CREATE POLICY "Permitir acesso autenticado em Client" ON "Client" FOR ALL USING (true);
CREATE POLICY "Permitir acesso autenticado em Contract" ON "Contract" FOR ALL USING (true);
CREATE POLICY "Permitir acesso autenticado em ContractItem" ON "ContractItem" FOR ALL USING (true);
CREATE POLICY "Permitir acesso autenticado em ContractSnapshot" ON "ContractSnapshot" FOR ALL USING (true);
CREATE POLICY "Permitir acesso autenticado em AuditLog" ON "AuditLog" FOR ALL USING (true);
