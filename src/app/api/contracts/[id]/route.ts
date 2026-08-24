import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateContractFinancials } from '@/lib/engine/financial';
import { generateContractSnapshot } from '@/lib/engine/snapshot';
import { ContractConfigInput } from '@/lib/types';
import { withOrgContext } from '@/lib/api-auth';

export const GET = withOrgContext(async (
  req: NextRequest,
  { params }: { params: { id: string } },
  auth
) => {
  try {
    const [contract, companySettings] = await Promise.all([
      prisma.contract.findFirst({
        where: { id: params.id, organization_id: auth.organizationId },
        include: {
          client: true,
          template: true,
          items: true,
          snapshot: true,
          audit_logs: {
            orderBy: { created_at: 'desc' },
          },
        },
      }),
      prisma.companySettings.findUnique({ where: { id: 'default' } }),
    ]);


    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      contract,
      company: companySettings,
    });
  } catch (error: any) {
    console.error('Erro ao buscar contrato:', error);
    return NextResponse.json({ error: 'Erro ao buscar contrato.' }, { status: 500 });
  }
});


export const PUT = withOrgContext(async (
  req: NextRequest,
  { params }: { params: { id: string } },
  auth
) => {
  try {
    const body = await req.json();

    const existing = await prisma.contract.findFirst({
      where: { id: params.id, organization_id: auth.organizationId },
      include: { client: true, items: true, template: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    // 1. Tratamento de Itens e Motor Financeiro
    const hasNewItems = Array.isArray(body.items);
    let calculatedMRR = body.calculated_mrr !== undefined ? Number(body.calculated_mrr) : existing.calculated_mrr;
    let calculatedOneTime = body.calculated_total_one_time !== undefined ? Number(body.calculated_total_one_time) : existing.calculated_total_one_time;

    if (hasNewItems) {
      const items = body.items || [];
      const mediaBudgetVal = body.planned_media_budget || body.estimated_media_budget || 0;
      const financials = calculateContractFinancials(items, mediaBudgetVal);
      calculatedMRR = financials.recurrent_mrr;
      calculatedOneTime = financials.total_one_time;

      await prisma.contractItem.deleteMany({
        where: { contract_id: params.id },
      });

      if (items.length > 0) {
        await prisma.contractItem.createMany({
          data: items.map((item: any) => ({
            contract_id: params.id,
            service_id: item.service_id || null,
            name: item.name,
            description: item.description || null,
            billing_type: item.billing_type || 'MONTHLY_ARREARS',
            unit_price: item.unit_price || 0.0,
            quantity: item.quantity || 1,
            discount: item.discount || 0.0,
            total_price: item.total_price || 0.0,
            milestone_description: item.milestone_description || null,
            duration_days: item.duration_days || null,
            is_addition: Boolean(item.is_addition),
          })),
        });
      }
    } else if (body.calculated_mrr !== undefined) {
      // Atualiza o item de serviço existente ou cria caso não exista
      if (existing.items.length > 0) {
        await prisma.contractItem.update({
          where: { id: existing.items[0].id },
          data: {
            unit_price: calculatedMRR,
            total_price: calculatedMRR,
          },
        });
      } else if (calculatedMRR > 0) {
        await prisma.contractItem.create({
          data: {
            contract_id: params.id,
            name: body.title || existing.title || 'Gestão de Mídia & Performance Digital',
            billing_type: 'MONTHLY_ARREARS',
            unit_price: calculatedMRR,
            quantity: 1,
            total_price: calculatedMRR,
          },
        });
      }
    }

    const newStatus = body.status || existing.status;

    const platformsString = Array.isArray(body.platforms)
      ? JSON.stringify(body.platforms)
      : (typeof body.platforms === 'string' && body.platforms.startsWith('[') ? body.platforms : (typeof body.platforms === 'string' ? JSON.stringify([body.platforms]) : existing.platforms));

    const updated = await prisma.contract.update({
      where: { id: params.id },
      data: {
        organization_id: auth.organizationId,
        client_id: body.client_id || existing.client_id,
        status: newStatus,
        title: body.title || existing.title,
        platforms: platformsString,
        landing_page_included: body.landing_page_included !== undefined ? Boolean(body.landing_page_included) : existing.landing_page_included,
        creatives_included: body.creatives_included !== undefined ? Boolean(body.creatives_included) : existing.creatives_included,
        dashboard_included: body.dashboard_included !== undefined ? Boolean(body.dashboard_included) : existing.dashboard_included,
        crm_client_responsibility: body.crm_client_responsibility !== undefined ? body.crm_client_responsibility : existing.crm_client_responsibility,
        technical_operational_autonomy: body.technical_operational_autonomy !== undefined ? body.technical_operational_autonomy : existing.technical_operational_autonomy,
        portfolio_permission: body.portfolio_permission || existing.portfolio_permission,
        portfolio_custom_text: body.portfolio_custom_text || existing.portfolio_custom_text,
        meeting_frequency: body.meeting_frequency || existing.meeting_frequency,
        support_channels: body.support_channels || existing.support_channels,
        support_hours: body.support_hours || existing.support_hours,
        media_budget_payer: body.media_budget_payer || existing.media_budget_payer,
        media_budget_notes: body.media_budget_notes || existing.media_budget_notes,
        particularities: body.particularities !== undefined ? body.particularities : existing.particularities,
        billing_type: body.billing_type || existing.billing_type,
        due_day: body.due_day !== undefined ? Number(body.due_day) : existing.due_day,
        term_months: body.term_months !== undefined ? Number(body.term_months) : existing.term_months,
        notice_days: body.notice_days !== undefined ? Number(body.notice_days) : existing.notice_days,
        early_termination_policy: body.early_termination_policy || existing.early_termination_policy,
        early_termination_details: body.early_termination_details || existing.early_termination_details,

        // Campos Eleitorais
        candidate_name: body.candidate_name !== undefined ? body.candidate_name : existing.candidate_name,
        candidate_number: body.candidate_number !== undefined ? body.candidate_number : existing.candidate_number,
        candidate_role: body.candidate_role !== undefined ? body.candidate_role : existing.candidate_role,
        candidate_state: body.candidate_state !== undefined ? body.candidate_state : existing.candidate_state,
        party: body.party !== undefined ? body.party : existing.party,
        federation_or_coalition: body.federation_or_coalition !== undefined ? body.federation_or_coalition : existing.federation_or_coalition,
        campaign_cnpj: body.campaign_cnpj !== undefined ? body.campaign_cnpj : existing.campaign_cnpj,
        commercial_contractor_type: body.commercial_contractor_type || existing.commercial_contractor_type,
        campaign_start_date: body.campaign_start_date || existing.campaign_start_date,
        campaign_end_date: body.campaign_end_date || existing.campaign_end_date,
        approval_responsible: body.approval_responsible || existing.approval_responsible,
        financial_responsible: body.financial_responsible || existing.financial_responsible,
        electoral_lawyer: body.electoral_lawyer || existing.electoral_lawyer,
        accounting_responsible: body.accounting_responsible || existing.accounting_responsible,

        calculated_mrr: calculatedMRR,
        calculated_total_one_time: calculatedOneTime,
      },
      include: { client: true, items: true, template: true },
    });

    // Log de auditoria
    let action = 'CONTRACT_UPDATED';
    if (newStatus === 'FINALIZED' && existing.status !== 'FINALIZED') {
      action = 'CONTRACT_FINALIZED';
    }

    await prisma.auditLog.create({
      data: {
        contract_id: updated.id,
        user_name: 'Patrick (Admin)',
        action,
        details: `Projeto/Contrato #${updated.contract_number} atualizado. Status: ${newStatus}. MRR: R$ ${calculatedMRR}.`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar contrato:', error);
    return NextResponse.json({ error: 'Erro ao atualizar contrato.' }, { status: 500 });
  }
});

export const DELETE = withOrgContext(async (
  req: NextRequest,
  { params }: { params: { id: string } },
  auth
) => {
  try {
    const existing = await prisma.contract.findFirst({
      where: { id: params.id, organization_id: auth.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    await prisma.contract.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir contrato:', error);
    return NextResponse.json({ error: 'Não foi possível excluir o contrato.' }, { status: 500 });
  }
});

