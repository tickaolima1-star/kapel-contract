import { describe, it, expect } from 'vitest';
import { calculateContractFinancials } from '../src/lib/engine/financial';
import { ContractItemInput } from '../src/lib/types';

describe('Motor Financeiro Determinístico - KAPEL CONTRACT', () => {
  it('Cenário Crítico: Gestão R$ 3.500/mês + Landing Page R$ 2.500 (50/50)', () => {
    const items: ContractItemInput[] = [
      {
        name: 'Gestão de Tráfego Pago',
        billing_type: 'MONTHLY_ARREARS',
        unit_price: 3500,
        quantity: 1,
        discount: 0,
        total_price: 3500,
        is_addition: false,
      },
      {
        name: 'Landing Page de Alta Conversão',
        billing_type: 'PROJECT_50_50',
        unit_price: 2500,
        quantity: 1,
        discount: 0,
        total_price: 2500,
        is_addition: true,
      },
    ];

    const result = calculateContractFinancials(items, 10000);

    // Recorrência deve ser estritamente R$ 3.500/mês (NÃO R$ 6.000)
    expect(result.recurrent_mrr).toBe(3500.0);
    // Pagamento inicial deve ser 50% da LP = R$ 1.250
    expect(result.initial_payment).toBe(1250.0);
    // Pagamento futuro deve ser 50% da LP = R$ 1.250
    expect(result.future_milestones).toBe(1250.0);
    // Total de serviços únicos contratados
    expect(result.total_one_time).toBe(2500.0);
    // Verba de mídia é meramente informativa
    expect(result.media_budget_informative).toBe(10000.0);
  });

  it('Cenário de Mensalidade Antecipada: R$ 4.000/mês MONTHLY_ADVANCE', () => {
    const items: ContractItemInput[] = [
      {
        name: 'Gestão de Tráfego',
        billing_type: 'MONTHLY_ADVANCE',
        unit_price: 4000,
        quantity: 1,
        discount: 0,
        total_price: 4000,
        is_addition: false,
      },
    ];

    const result = calculateContractFinancials(items);

    expect(result.recurrent_mrr).toBe(4000.0);
    expect(result.initial_payment).toBe(4000.0); // 1ª mensalidade no ato
    expect(result.future_milestones).toBe(0.0);
  });

  it('Cenário com Pagamento Único à Vista: Setup R$ 1.200 ONE_TIME + Gestão R$ 3.000/mês', () => {
    const items: ContractItemInput[] = [
      {
        name: 'Setup Inicial',
        billing_type: 'ONE_TIME',
        unit_price: 1200,
        quantity: 1,
        discount: 0,
        total_price: 1200,
        is_addition: true,
      },
      {
        name: 'Gestão de Tráfego',
        billing_type: 'MONTHLY_ARREARS',
        unit_price: 3000,
        quantity: 1,
        discount: 0,
        total_price: 3000,
        is_addition: false,
      },
    ];

    const result = calculateContractFinancials(items);

    expect(result.recurrent_mrr).toBe(3000.0);
    expect(result.initial_payment).toBe(1200.0);
    expect(result.future_milestones).toBe(0.0);
    expect(result.total_one_time).toBe(1200.0);
  });
});
