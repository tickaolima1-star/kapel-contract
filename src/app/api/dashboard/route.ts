import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Cálculos de receita estritamente separados
    const totalMRR = activeContracts.reduce((sum, c) => sum + (c.calculated_mrr || 0), 0);
    const totalOneTime = activeContracts.reduce((sum, c) => sum + (c.calculated_total_one_time || 0), 0);

    // Formata os clientes com métricas agregadas
    const enrichedClients = clients.map((cli) => {
      const clientActiveContracts = cli.contracts.filter((c) => c.status === 'FINALIZED');
      const clientMRR = clientActiveContracts.reduce((sum, c) => sum + (c.calculated_mrr || 0), 0);
      const clientTotalOneTime = clientActiveContracts.reduce((sum, c) => sum + (c.calculated_total_one_time || 0), 0);

      return {
        ...cli,
        active_projects_count: clientActiveContracts.length,
        total_projects_count: cli.contracts.length,
        total_mrr: clientMRR,
        total_one_time: clientTotalOneTime,
      };
    });

    return NextResponse.json({
      metrics: {
        active_clients_count: clients.length,
        active_contracts_count: activeContracts.length,
        ready_contracts_count: readyContracts.length,
        draft_contracts_count: draftContracts.length,
        total_mrr: totalMRR,
        total_one_time: totalOneTime,
      },
      clients: enrichedClients,
      recent_contracts: contracts.slice(0, 10),
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
