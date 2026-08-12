import { describe, it, expect } from 'vitest';
import { buildDeterministicContractClauses, interpolateVariables, ContractEvaluationContext } from '../src/lib/engine/clauses';

describe('Motor Determinístico de Cláusulas - KAPEL CONTRACT', () => {
  const baseContext: ContractEvaluationContext = {
    company: {
      legal_name: '67.726.428 PATRICK EDUARDO LIMA SILVA',
      trade_name: 'KAPEL',
      cnpj: '67.726.428/0001-97',
      address: 'Av. Paulista, 1000, Sala 501',
      neighborhood: 'Bela Vista',
      zip_code: '01310-100',
      city: 'São Paulo',
      state: 'SP',
      legal_representative: 'Patrick Eduardo Lima Silva',
      rep_cpf: '123.456.789-00',
      email: 'contato@kapel.digital',
      phone: '+55 (11) 98765-4321',
      jurisdiction_city: 'São Paulo',
      jurisdiction_state: 'SP',
    },
    client: {
      type: 'PJ',
      legal_name: 'WPL Empreendimentos Digitais Ltda',
      trade_name: 'WPL / Simone',
      document: '12.345.678/0001-90',
      address: 'Rua Oscar Freire',
      address_number: '580',
      city: 'São Paulo',
      state: 'SP',
      representative_name: 'Simone Cristina dos Santos',
      representative_cpf: '234.567.890-11',
      representative_role: 'Diretora Executiva',
      email: 'simone@wplempreendimentos.com.br',
    },
    config: {
      client_id: 'client-demo-wpl',
      template_type: 'PERFORMANCE',
      platforms: ['Meta Ads', 'Google Ads'],
      landing_page_included: false,
      creatives_included: false,
      dashboard_included: false,
      crm_client_responsibility: true,
      technical_operational_autonomy: true,
      portfolio_permission: 'ALLOW',
      meeting_frequency: '1 reunião mensal',
      support_channels: 'WhatsApp e e-mail',
      support_hours: '08:00 às 18:00 (dias úteis)',
      media_budget_payer: 'CLIENT',
      media_budget_notes: 'Paga diretamente pelo Contratante',
      billing_type: 'MONTHLY_ARREARS',
      due_day: 10,
      term_months: 3,
      notice_days: 15,
      early_termination_policy: 'NO_PENALTY',
      estimated_media_budget: 10000,
      items: [
        {
          name: 'Gestão de Tráfego Pago',
          billing_type: 'MONTHLY_ARREARS',
          unit_price: 3500,
          quantity: 1,
          discount: 0,
          total_price: 3500,
          is_addition: false,
        },
      ],
    },
    financials: {
      recurrent_mrr: 3500,
      initial_payment: 0,
      future_milestones: 0,
      total_one_time: 0,
      media_budget_informative: 10000,
    },
    contractNumber: '000001',
  };

  it('Deve substituir variáveis corretamente e incluir Razão Social exata da KAPEL (nunca KAPEL LTDA)', () => {
    const text = 'CONTRATADA: {{company.legal_name}}, inscrita no CNPJ {{company.cnpj}}, nome comercial {{company.trade_name}}.';
    const interpolated = interpolateVariables(text, baseContext);

    expect(interpolated).toContain('67.726.428 PATRICK EDUARDO LIMA SILVA');
    expect(interpolated).toContain('67.726.428/0001-97');
    expect(interpolated).not.toContain('KAPEL LTDA');
  });

  it('Deve selecionar cláusula de EXCLUSÃO de Landing Page quando landing_page_included = false', () => {
    const clauses = buildDeterministicContractClauses(baseContext);
    const lpClause = clauses.find(c => c.code.includes('LANDING_PAGE'));

    expect(lpClause).toBeDefined();
    expect(lpClause?.code).toBe('LANDING_PAGE_EXCLUDED');
    expect(lpClause?.content).toContain('NÃO estão inclusos neste contrato');
  });

  it('Deve selecionar cláusula de INCLUSÃO de Landing Page quando landing_page_included = true', () => {
    const modifiedContext = {
      ...baseContext,
      config: {
        ...baseContext.config,
        landing_page_included: true,
      },
    };

    const clauses = buildDeterministicContractClauses(modifiedContext);
    const lpClause = clauses.find(c => c.code.includes('LANDING_PAGE'));

    expect(lpClause).toBeDefined();
    expect(lpClause?.code).toBe('LANDING_PAGE_INCLUDED');
    expect(lpClause?.content).toContain('INCLUSO no escopo a criação e desenvolvimento de Landing Page');
  });

  it('Deve renderizar cláusula de Autonomia Operacional Técnica quando ativa', () => {
    const clauses = buildDeterministicContractClauses(baseContext);
    const autonomy = clauses.find(c => c.code === 'OPERATIONAL_AUTONOMY');

    expect(autonomy).toBeDefined();
    expect(autonomy?.content).toContain('plena autonomia operacional técnica');
    expect(autonomy?.content).toContain('pausar ou ativar campanhas');
  });

  it('Deve marcar cláusula como personalizada quando houver override', () => {
    const contextWithOverride = {
      ...baseContext,
      config: {
        ...baseContext.config,
        custom_clauses: {
          OPERATIONAL_AUTONOMY: {
            title: 'DA AUTONOMIA OPERACIONAL CUSTOMIZADA',
            content: 'Texto personalizado acordado entre Patrick e Simone.',
            is_custom: true,
          },
        },
      },
    };

    const clauses = buildDeterministicContractClauses(contextWithOverride);
    const customClause = clauses.find(c => c.code === 'OPERATIONAL_AUTONOMY');

    expect(customClause?.is_custom).toBe(true);
    expect(customClause?.title).toBe('DA AUTONOMIA OPERACIONAL CUSTOMIZADA');
    expect(customClause?.content).toBe('Texto personalizado acordado entre Patrick e Simone.');
  });
});
