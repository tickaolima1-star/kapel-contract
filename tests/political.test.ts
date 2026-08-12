import { describe, it, expect } from 'vitest';
import { calculateContractFinancials } from '../src/lib/engine/financial';
import { buildDeterministicContractClauses, interpolateVariables, ContractEvaluationContext } from '../src/lib/engine/clauses';
import { ContractItemInput } from '../src/lib/types';
import { formatCurrency } from '../src/lib/utils';

describe('Motor KAPEL Political - Caso de Teste Real (Agência 89 / Campanha Ademir)', () => {
  const items: ContractItemInput[] = [
    {
      name: 'Gestão de tráfego/mídia eleitoral',
      billing_type: 'PROJECT_50_50',
      unit_price: 7500,
      quantity: 1,
      discount: 0,
      total_price: 7500,
      duration_days: 45,
      milestone_description: 'Último dia do período contratado de campanha',
      is_addition: false,
    },
    {
      name: 'Desenvolvimento e implantação de chatbot informativo',
      billing_type: 'PROJECT_50_50',
      unit_price: 1500,
      quantity: 1,
      discount: 0,
      total_price: 1500,
      milestone_description: 'Entrega/conclusão do chatbot',
      is_addition: true,
    },
  ];

  const plannedMediaBudget = 60000;

  it('1. Validação Financeira Estrita: Total R$ 9.000, Inicial R$ 4.500, MRR = 0, Futuros R$ 3.750 + R$ 750, Mídia R$ 60.000 isolada', () => {
    const result = calculateContractFinancials(items, plannedMediaBudget);

    // Honorários totais da KAPEL = R$ 9.000
    expect(result.total_service_value).toBe(9000.0);

    // Pagamento inicial = 50% de R$ 7.500 (3750) + 50% de R$ 1.500 (750) = R$ 4.500
    expect(result.initial_payment).toBe(4500.0);

    // Projeto eleitoral com prazo determinado NÃO É MRR
    expect(result.recurrent_mrr).toBe(0.0);

    // Total de pagamentos futuros por marcos = R$ 4.500
    expect(result.future_milestones).toBe(4500.0);

    // Discriminação dos marcos independentes
    expect(result.future_milestone_items).toHaveLength(2);
    expect(result.future_milestone_items[0].amount).toBe(3750.0);
    expect(result.future_milestone_items[0].milestone_description).toBe('Último dia do período contratado de campanha');
    expect(result.future_milestone_items[1].amount).toBe(750.0);
    expect(result.future_milestone_items[1].milestone_description).toBe('Entrega/conclusão do chatbot');

    // Orçamento de mídia é estritamente R$ 60.000 e NÃO integra receita
    expect(result.media_budget_informative).toBe(60000.0);
    expect(result.total_service_value).not.toBe(69000.0);
  });

  it('2. Validação das Cláusulas do Template KAPEL Political', () => {
    const context: ContractEvaluationContext = {
      company: {
        legal_name: '67.726.428 PATRICK EDUARDO LIMA SILVA',
        trade_name: 'KAPEL',
        cnpj: '67.726.428/0001-97',
        address: 'Av. Paulista, 1000',
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
        legal_name: 'Agência 89 Comunicação Estratégica Ltda',
        trade_name: 'Agência 89 / Campanha Ademir',
        document: '89.123.456/0001-89',
        address: 'Av. Faria Lima, 2000',
        city: 'São Paulo',
        state: 'SP',
        representative_name: 'Roberto Mendes',
        representative_cpf: '345.678.901-22',
        representative_role: 'Diretor de Atendimento',
      },
      config: {
        client_id: 'client-demo-agencia89',
        template_type: 'POLITICAL',
        platforms: ['Meta Ads', 'Google Ads', 'YouTube Ads'],
        billing_type: 'PROJECT_50_50',
        candidate_name: 'Ademir José da Silva',
        candidate_number: '15',
        candidate_role: 'Prefeito',
        candidate_state: 'SP',
        party: 'MDB',
        campaign_cnpj: '65.432.100/0001-15',
        commercial_contractor_type: 'AGENCY',
        planned_media_budget: 60000,
        media_payment_responsible: 'CAMPAIGN',
        chatbot_type: 'KNOWLEDGE_BASE',
        chatbot_uses_ai: true,
        chatbot_collects_personal_data: true,
        subcontracting_permitted: true,
        items,
      },
      financials: {
        total_service_value: 9000,
        recurrent_mrr: 0,
        initial_payment: 4500,
        future_milestones: 4500,
        future_milestone_items: [
          { service_name: 'Gestão de tráfego/mídia eleitoral', milestone_description: 'Último dia do período contratado de campanha', amount: 3750 },
          { service_name: 'Desenvolvimento e implantação de chatbot informativo', milestone_description: 'Entrega/conclusão do chatbot', amount: 750 },
        ],
        total_one_time: 9000,
        media_budget_informative: 60000,
      },
      contractNumber: '000002',
    };

    const clauses = buildDeterministicContractClauses(context);

    // Verifica que gerou as cláusulas do Political e não do Performance
    const scopeClause = clauses.find(c => c.code === 'POLITICAL_SCOPE');
    expect(scopeClause).toBeDefined();
    expect(scopeClause?.content).toContain('Ademir José da Silva');
    expect(scopeClause?.content).toContain('Prefeito');
    expect(scopeClause?.content).toContain('65.432.100/0001-15');

    // Verifica cláusula de mídia informativa
    const mediaClause = clauses.find(c => c.code === 'MEDIA_BUDGET_INFORMATIONAL');
    expect(mediaClause).toBeDefined();
    expect(mediaClause?.content).toContain(formatCurrency(60000));
    expect(mediaClause?.content).toContain('NÃO INTEGRA A REMUNERAÇÃO');

    // Verifica cláusula de subcontratação sem listar terceiros nominalmente
    const subClause = clauses.find(c => c.code === 'SUBCONTRACTING');
    expect(subClause).toBeDefined();
    expect(subClause?.content).toContain('equipe própria, colaboradores, especialistas técnicos e prestadores');

    // Verifica cláusula de ausência de garantia de votos
    const voteClause = clauses.find(c => c.code === 'NO_VOTE_GUARANTEE');
    expect(voteClause).toBeDefined();
  });
});
