import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getContractMRR(c: any): number {
  if (c.calculated_mrr && c.calculated_mrr > 0) return c.calculated_mrr;
  if (c.items && Array.isArray(c.items) && c.items.length > 0) {
    const monthlyItems = c.items.filter((i: any) =>
      !i.billing_type ||
      i.billing_type === 'MONTHLY_ARREARS' ||
      i.billing_type === 'MONTHLY_ADVANCE' ||
      i.billing_type === 'SETUP_PLUS_MONTHLY'
    );
    if (monthlyItems.length > 0) {
      return monthlyItems.reduce(
        (sum: number, it: any) => sum + (it.total_price || (it.unit_price * (it.quantity || 1)) || 0),
        0
      );
    }
    // Se for projeto único com valor
    return c.items.reduce(
      (sum: number, it: any) => sum + (it.total_price || (it.unit_price * (it.quantity || 1)) || 0),
      0
    );
  }
  return 0;
}

export async function GET() {
  try {
    const [clients, contracts, recentAuditLogs] = await Promise.all([
      prisma.client.findMany({
        where: { active: true },
        include: {
          contracts: {
            include: {
              items: true,
              template: true,
            },
            orderBy: { created_at: 'desc' },
          },
        },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.contract.findMany({
        include: {
          client: true,
          items: true,
          template: true,
        },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: { contract: true },
      }),
    ]);

    const activeContracts = contracts.filter((c) => c.status === 'FINALIZED');
    const readyContracts = contracts.filter((c) => c.status === 'READY');
    const draftContracts = contracts.filter((c) => c.status === 'DRAFT');

    // Cálculos de receita garantindo que nenhum projeto ativo/pronto fique zerado
    const totalMRR = contracts
      .filter((c) => c.status !== 'CANCELLED')
      .reduce((sum, c) => sum + getContractMRR(c), 0);

    const activeMRR = activeContracts.reduce((sum, c) => sum + getContractMRR(c), 0);
    const totalOneTime = contracts
      .filter((c) => c.status !== 'CANCELLED')
      .reduce((sum, c) => sum + (c.calculated_total_one_time || 0), 0);

    // Formata os clientes com métricas agregadas
    const enrichedClients = clients.map((cli) => {
      const clientActiveContracts = cli.contracts.filter((c) => c.status !== 'CANCELLED');
      const clientMRR = clientActiveContracts.reduce((sum, c) => sum + getContractMRR(c), 0);
      const clientTotalOneTime = clientActiveContracts.reduce((sum, c) => sum + (c.calculated_total_one_time || 0), 0);

      return {
        ...cli,
        active_projects_count: cli.contracts.filter((c) => c.status === 'FINALIZED').length,
        total_projects_count: cli.contracts.length,
        total_mrr: clientMRR,
        total_one_time: clientTotalOneTime,
        contracts: cli.contracts.map((c) => ({
          ...c,
          calculated_mrr: getContractMRR(c),
        })),
      };
    });

    return NextResponse.json({
      metrics: {
        active_clients_count: clients.length,
        active_contracts_count: activeContracts.length,
        ready_contracts_count: readyContracts.length,
        draft_contracts_count: draftContracts.length,
        total_mrr: totalMRR || activeMRR,
        active_mrr: activeMRR,
        total_one_time: totalOneTime,
      },
      clients: enrichedClients,
      recent_contracts: contracts.slice(0, 10).map((c) => ({
        ...c,
        calculated_mrr: getContractMRR(c),
      })),
      recent_audit_logs: recentAuditLogs,
    });
  } catch (error: any) {
    console.error('Erro ao carregar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados do dashboard.' },
      { status: 500 }
    );
  }
}
