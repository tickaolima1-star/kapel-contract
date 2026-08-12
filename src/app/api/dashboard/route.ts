import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalClients, contracts, recentAuditLogs] = await Promise.all([
      prisma.client.count({ where: { active: true } }),
      prisma.contract.findMany({
        include: {
          client: true,
          items: true,
        },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { contract: true },
      }),
    ]);

    const activeContracts = contracts.filter((c) => c.status === 'FINALIZED');
    const draftContracts = contracts.filter((c) => c.status === 'DRAFT' || c.status === 'READY');

    // Cálculos de receita estritamente separados
    const totalMRR = activeContracts.reduce((sum, c) => sum + (c.calculated_mrr || 0), 0);
    const totalOneTime = activeContracts.reduce((sum, c) => sum + (c.calculated_total_one_time || 0), 0);

    return NextResponse.json({
      metrics: {
        active_contracts_count: activeContracts.length,
        draft_contracts_count: draftContracts.length,
        total_clients_count: totalClients,
        total_mrr: totalMRR,
        total_one_time: totalOneTime,
      },
      recent_contracts: contracts.slice(0, 8),
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
