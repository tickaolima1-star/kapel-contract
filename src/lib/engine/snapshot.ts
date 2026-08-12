import { ContractEvaluationContext, buildDeterministicContractClauses } from './clauses';
import { calculateContractFinancials } from './financial';
import { ResolvedClause } from '../types';

export interface ContractSnapshotData {
  version: string;
  generated_at: string;
  contract_number: string;
  status: string;
  company: ContractEvaluationContext['company'];
  client: ContractEvaluationContext['client'];
  config: ContractEvaluationContext['config'];
  financials: ReturnType<typeof calculateContractFinancials>;
  clauses: ResolvedClause[];
}

/**
 * Cria um snapshot imutável do contrato.
 * Esse objeto é serializado em JSON e gravado na tabela `ContractSnapshot`.
 * Qualquer alteração futura no catálogo de serviços, template ou configurações da empresa
 * NUNCA afetará um contrato já finalizado/salvo.
 */
export function generateContractSnapshot(
  context: ContractEvaluationContext,
  contractNumber: string,
  status: string = 'FINALIZED'
): ContractSnapshotData {
  const financials = calculateContractFinancials(
    context.config.items,
    context.config.estimated_media_budget
  );

  const enrichedContext: ContractEvaluationContext = {
    ...context,
    financials,
    contractNumber,
  };

  const resolvedClauses = buildDeterministicContractClauses(enrichedContext);

  return {
    version: '1.0',
    generated_at: new Date().toISOString(),
    contract_number: contractNumber,
    status,
    company: context.company,
    client: context.client,
    config: context.config,
    financials,
    clauses: resolvedClauses,
  };
}
