import { ContractItemInput, FinancialSummary, MilestonePaymentItem } from '../types';

/**
 * Motor Financeiro Determinístico da KAPEL
 * 
 * Regras estritas:
 * 1. NUNCA somar verbas de mídia publicitária/eleitoral aos honorários, entradas, MRR ou receita da KAPEL.
 * 2. NUNCA converter projetos por marcos (PROJECT_50_50) ou contratos com prazo determinado de campanha em MRR.
 * 3. Discriminar cada marco futuro de pagamento de forma independente sem consolidar prazos/eventos distintos.
 */
export function calculateContractFinancials(
  items: ContractItemInput[],
  estimatedOrPlannedMediaBudget: number = 0
): FinancialSummary {
  let recurrent_mrr = 0;
  let initial_payment = 0;
  let future_milestones = 0;
  let total_one_time = 0;
  let total_service_value = 0;
  const future_milestone_items: MilestonePaymentItem[] = [];

  for (const item of items) {
    const itemTotal = (item.unit_price * (item.quantity || 1)) - (item.discount || 0);
    const validTotal = Math.max(0, itemTotal);
    total_service_value += validTotal;

    switch (item.billing_type) {
      case 'MONTHLY_ARREARS':
        // Mensal vencido: Gera MRR recorrente, entrada R$ 0,00
        recurrent_mrr += validTotal;
        break;

      case 'MONTHLY_ADVANCE':
        // Mensal antecipado: Gera MRR recorrente + 1ª mensalidade no ato
        recurrent_mrr += validTotal;
        initial_payment += validTotal;
        break;

      case 'ONE_TIME':
        // Pagamento único à vista no ato
        total_one_time += validTotal;
        initial_payment += validTotal;
        break;

      case 'PROJECT_50_50': {
        // 50% na contratação / 50% no marco definido
        total_one_time += validTotal;
        const half = validTotal * 0.5;
        initial_payment += half;
        future_milestones += half;

        const defaultMilestone = item.milestone_description || 'Entrega e validação final do serviço';
        future_milestone_items.push({
          service_name: item.name,
          milestone_description: defaultMilestone,
          amount: Number(half.toFixed(2)),
        });
        break;
      }

      case 'SETUP_PLUS_MONTHLY':
        // Mensalidade recorrente
        recurrent_mrr += validTotal;
        break;

      case 'CUSTOM':
        total_one_time += validTotal;
        initial_payment += validTotal;
        break;

      default:
        recurrent_mrr += validTotal;
        break;
    }
  }

  return {
    total_service_value: Number(total_service_value.toFixed(2)),
    recurrent_mrr: Number(recurrent_mrr.toFixed(2)),
    initial_payment: Number(initial_payment.toFixed(2)),
    future_milestones: Number(future_milestones.toFixed(2)),
    future_milestone_items,
    total_one_time: Number(total_one_time.toFixed(2)),
    media_budget_informative: Number((estimatedOrPlannedMediaBudget || 0).toFixed(2)),
    currency: 'BRL',
  };
}
