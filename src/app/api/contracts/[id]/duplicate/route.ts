import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';

type RouteContext = { params: { id: string } };

async function duplicateContract(
  req: NextRequest,
  { params }: RouteContext,
  auth: OrgRequestContext,
) {
  try {
    const original = await prisma.contract.findFirst({
      where: { id: params.id, organization_id: auth.organizationId },
      include: { items: true, client: true },
    });

    if (!original) {
      return NextResponse.json({ error: 'Contrato original não encontrado.' }, { status: 404 });
    }

    // Gerar próximo número sequencial sem colisão
    const lastContract = await prisma.contract.findFirst({
      where: { organization_id: auth.organizationId },
      orderBy: { created_at: 'desc' },
      select: { contract_number: true },
    });

    let nextNum = 1;
    if (lastContract && lastContract.contract_number) {
      const parsed = parseInt(lastContract.contract_number, 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }

    let newContractNumber = String(nextNum).padStart(6, '0');
    while (await prisma.contract.findFirst({ where: { contract_number: newContractNumber, organization_id: auth.organizationId } })) {
      nextNum++;
      newContractNumber = String(nextNum).padStart(6, '0');
    }

    const duplicated = await prisma.contract.create({
      data: {
        organization_id: auth.organizationId,
        contract_number: newContractNumber,
        client_id: original.client_id,
        template_id: original.template_id,
        status: 'DRAFT', // Sempre inicia como Rascunho
        title: `${original.title} (Cópia #${newContractNumber})`,
        platforms: original.platforms,
        landing_page_included: original.landing_page_included,
        creatives_included: original.creatives_included,
        dashboard_included: original.dashboard_included,
        crm_client_responsibility: original.crm_client_responsibility,
        technical_operational_autonomy: original.technical_operational_autonomy,
        portfolio_permission: original.portfolio_permission,
        portfolio_custom_text: original.portfolio_custom_text,
        meeting_frequency: original.meeting_frequency,
        support_channels: original.support_channels,
        support_hours: original.support_hours,
        media_budget_payer: original.media_budget_payer,
        media_budget_notes: original.media_budget_notes,
        particularities: original.particularities,
        billing_type: original.billing_type,
        due_day: original.due_day,
        term_months: original.term_months,
        notice_days: original.notice_days,
        early_termination_policy: original.early_termination_policy,
        early_termination_details: original.early_termination_details,
        calculated_mrr: original.calculated_mrr,
        calculated_initial_payment: original.calculated_initial_payment,
        calculated_future_milestones: original.calculated_future_milestones,
        calculated_total_one_time: original.calculated_total_one_time,
        estimated_media_budget: original.estimated_media_budget,
        custom_clauses: original.custom_clauses,
        items: {
          create: original.items.map((item) => ({
            service_id: item.service_id,
            name: item.name,
            description: item.description,
            billing_type: item.billing_type,
            unit_price: item.unit_price,
            quantity: item.quantity,
            discount: item.discount,
            total_price: item.total_price,
            milestone_description: item.milestone_description,
            is_addition: item.is_addition,
          })),
        },
      },
      include: { client: true, items: true },
    });

    // Registrar log de auditoria no contrato duplicado
    await prisma.auditLog.create({
      data: {
        contract_id: duplicated.id,
        user_name: 'Patrick (Admin)',
        action: 'CONTRACT_DUPLICATED',
        details: `Contrato criado por duplicação a partir do contrato #${original.contract_number}.`,
      },
    });

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao duplicar contrato:', error);
    return NextResponse.json({ error: 'Erro ao duplicar contrato.' }, { status: 500 });
  }
}

export const POST = withOrgContext<RouteContext>(duplicateContract, ['OWNER', 'ADMIN', 'OPERATOR']);
