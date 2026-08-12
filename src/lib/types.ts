export type ClientType = 'PJ' | 'PF';

export type TemplateType = 'PERFORMANCE' | 'POLITICAL' | 'STUDIO' | 'CONSULTING' | 'PARTNER';

export type BillingType =
  | 'MONTHLY_ARREARS'
  | 'MONTHLY_ADVANCE'
  | 'ONE_TIME'
  | 'PROJECT_50_50'
  | 'SETUP_PLUS_MONTHLY'
  | 'CUSTOM';

export type ContractStatus = 'DRAFT' | 'READY' | 'FINALIZED' | 'CANCELLED';

export type PortfolioPermission = 'ALLOW' | 'DENY' | 'CUSTOM';

export type EarlyTerminationPolicy =
  | 'NO_PENALTY'
  | 'FIXED_FINE'
  | 'PERCENTAGE'
  | 'REMAINING_MONTHS'
  | 'CUSTOM';

export type CommercialContractorType =
  | 'AGENCY'
  | 'CAMPAIGN'
  | 'PARTY'
  | 'FEDERATION'
  | 'OTHER';

export type ChatbotType =
  | 'RULE_BASED'
  | 'KNOWLEDGE_BASE'
  | 'GENERATIVE_AI'
  | 'CUSTOM';

export type ComplianceReviewStatus = 'PENDING' | 'APPROVED';

export interface MilestonePaymentItem {
  service_name: string;
  milestone_description: string;
  amount: number;
}

export interface FinancialSummary {
  total_service_value: number; // Valor total dos serviços/honorários da KAPEL
  recurrent_mrr: number; // R$/mês (0 para projetos de tiro curto como campanhas)
  initial_payment: number; // R$ no ato / início
  future_milestones: number; // R$ total de marcos futuros
  future_milestone_items: MilestonePaymentItem[]; // Discriminação individual de cada marco
  total_one_time: number; // R$ total de pagamentos únicos/projetos
  media_budget_informative: number; // R$ verba de mídia informativa (NÃO INTEGRA A RECEITA DA KAPEL)
  currency: string;
}

export interface ContractItemInput {
  id?: string;
  service_id?: string;
  name: string;
  description?: string;
  billing_type: BillingType;
  unit_price: number;
  quantity: number;
  discount: number;
  total_price: number;
  milestone_description?: string; // Marco (ex: "Último dia da campanha", "Entrega do chatbot")
  duration_days?: number; // Duração (ex: 45 dias)
  is_addition: boolean;
}

export interface ClauseDefinition {
  code: string;
  title: string;
  content: string;
  category: string;
  order?: number;
  is_custom?: boolean;
}

export interface ResolvedClause {
  number: number;
  code: string;
  title: string;
  content: string;
  is_custom: boolean;
  category: string;
}

export interface ContractConfigInput {
  client_id: string;
  template_type: TemplateType;
  title?: string;
  platforms: string[] | string;
  landing_page_included?: boolean;
  creatives_included?: boolean;
  dashboard_included?: boolean;
  crm_client_responsibility?: boolean;
  technical_operational_autonomy?: boolean;
  portfolio_permission?: PortfolioPermission;
  portfolio_custom_text?: string;
  meeting_frequency?: string;
  support_channels?: string;
  support_hours?: string;
  media_budget_payer?: string;
  media_budget_notes?: string;
  particularities?: string;
  billing_type: BillingType;
  due_day?: number;
  term_months?: number;
  notice_days?: number;
  early_termination_policy?: EarlyTerminationPolicy;
  early_termination_details?: string;
  estimated_media_budget?: number;

  // Campos Eleitorais (KAPEL Political)
  candidate_name?: string;
  candidate_number?: string;
  candidate_role?: string;
  candidate_state?: string;
  party?: string;
  federation_or_coalition?: string;
  campaign_cnpj?: string;
  commercial_contractor_type?: CommercialContractorType;
  campaign_start_date?: string;
  campaign_end_date?: string;

  approval_responsible?: string;
  financial_responsible?: string;
  electoral_lawyer?: string;
  accounting_responsible?: string;

  planned_media_budget?: number;
  media_payment_responsible?: string;

  // Chatbot
  chatbot_type?: ChatbotType;
  chatbot_collects_personal_data?: boolean;
  chatbot_uses_ai?: boolean;
  chatbot_public_url?: string;
  chatbot_content_approval_responsible?: string;
  chatbot_data_retention_notes?: string;
  chatbot_custom_scope?: string;

  // Compliance
  electoral_legal_review?: ComplianceReviewStatus;
  accounting_review?: ComplianceReviewStatus;
  campaign_content_approval?: ComplianceReviewStatus;
  ai_used?: boolean;
  personal_data_processed?: boolean;
  mass_messaging?: boolean;
  synthetic_content_used?: boolean;

  // Subcontratação
  subcontracting_permitted?: boolean;
  subcontracting_clause_text?: string;

  items: ContractItemInput[];
  custom_clauses?: Record<string, { title?: string; content?: string; is_custom?: boolean }>;
}
