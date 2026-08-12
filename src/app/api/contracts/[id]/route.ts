import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateContractFinancials } from '@/lib/engine/financial';
import { generateContractSnapshot } from '@/lib/engine/snapshot';
import { ContractConfigInput } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [contract, companySettings] = await Promise.all([
      prisma.contract.findUnique({
        where: { id: params.id },
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
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: ContractConfigInput & { status?: string } = await req.json();

    const existing = await prisma.contract.findUnique({
      where: { id: params.id },
      include: { client: true, items: true, template: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    // 1. Recalcular Motor Financeiro
    const items = body.items || [];
    const mediaBudgetVal = body.planned_media_budget || body.estimated_media_budget || 0;
    const financials = calculateContractFinancials(items, mediaBudgetVal);
    const newStatus = body.status || existing.status;

    const platformsString = Array.isArray(body.platforms)
      ? JSON.stringify(body.platforms)
      : (typeof body.platforms === 'string' && body.platforms.startsWith('[') ? body.platforms : (typeof body.platforms === 'string' ? JSON.stringify([body.platforms]) : existing.platforms));

    // 2. Apagar itens antigos e recriar novos
    await prisma.contractItem.deleteMany({
      where: { contract_id: params.id },
    });

    const updated = await prisma.contract.update({
      where: { id: params.id },
      data: {
        client_id: body.client_id || existing.client_id,
        status: newStatus,
        title: body.title || existing.title,
        platforms: platformsString,
        landing_page_included: Boolean(body.landing_page_included),
        creatives_included: Boolean(body.creatives_included),
        dashboard_included: Boolean(body.dashboard_included),
        crm_client_responsibility: body.crm_client_responsibility !== undefined ? body.crm_client_responsibility : true,
        technical_operational_autonomy: body.technical_operational_autonomy !== undefined ? body.technical_operational_autonomy : true,
        portfolio_permission: body.portfolio_permission || existing.portfolio_permission,
        portfolio_custom_text: body.portfolio_custom_text || null,
        meeting_frequency: body.meeting_frequency || existing.meeting_frequency,
        support_channels: body.support_channels || existing.support_channels,
        support_hours: body.support_hours || existing.support_hours,
        media_budget_payer: body.media_budget_payer || existing.media_budget_payer,
        media_budget_notes: body.media_budget_notes || existing.media_budget_notes,
        particularities: body.particularities || null,
        billing_type: body.billing_type || existing.billing_type,
        due_day: body.due_day || existing.due_day,
        term_months: body.term_months || existing.term_months,
        notice_days: body.notice_days || existing.notice_days,
        early_termination_policy: body.early_termination_policy || existing.early_termination_policy,
        early_termination_details: body.early_termination_details || null,

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

        planned_media_budget: financials.media_budget_informative,
        media_payment_responsible: body.media_payment_responsible || existing.media_payment_responsible,

        chatbot_type: body.chatbot_type || existing.chatbot_type,
        chatbot_collects_personal_data: body.chatbot_collects_personal_data !== undefined ? Boolean(body.chatbot_collects_personal_data) : existing.chatbot_collects_personal_data,
        chatbot_uses_ai: body.chatbot_uses_ai !== undefined ? Boolean(body.chatbot_uses_ai) : existing.chatbot_uses_ai,
        chatbot_public_url: body.chatbot_public_url || existing.chatbot_public_url,
        chatbot_content_approval_responsible: body.chatbot_content_approval_responsible || existing.chatbot_content_approval_responsible,
        chatbot_data_retention_notes: body.chatbot_data_retention_notes || existing.chatbot_data_retention_notes,
        chatbot_custom_scope: body.chatbot_custom_scope || existing.chatbot_custom_scope,

        electoral_legal_review: body.electoral_legal_review || existing.electoral_legal_review,
        accounting_review: body.accounting_review || existing.accounting_review,
        campaign_content_approval: body.campaign_content_approval || existing.campaign_content_approval,
        ai_used: body.ai_used !== undefined ? Boolean(body.ai_used) : existing.ai_used,
        personal_data_processed: body.personal_data_processed !== undefined ? Boolean(body.personal_data_processed) : existing.personal_data_processed,
        mass_messaging: body.mass_messaging !== undefined ? Boolean(body.mass_messaging) : existing.mass_messaging,
        synthetic_content_used: body.synthetic_content_used !== undefined ? Boolean(body.synthetic_content_used) : existing.synthetic_content_used,
        subcontracting_permitted: body.subcontracting_permitted !== undefined ? Boolean(body.subcontracting_permitted) : existing.subcontracting_permitted,
        subcontracting_clause_text: body.subcontracting_clause_text || existing.subcontracting_clause_text,

        calculated_mrr: financials.recurrent_mrr,
        calculated_initial_payment: financials.initial_payment,
        calculated_future_milestones: financials.future_milestones,
        calculated_total_one_time: financials.total_one_time,
        estimated_media_budget: financials.media_budget_informative,

        custom_clauses: JSON.stringify(body.custom_clauses || (existing.custom_clauses ? JSON.parse(existing.custom_clauses) : {})),
        items: {
          create: items.map((item) => ({
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
        },
      },
      include: { client: true, items: true, template: true },
    });

    // 3. Atualizar Snapshot
    const [companySettings, client] = await Promise.all([
      prisma.companySettings.findUnique({ where: { id: 'default' } }),
      prisma.client.findUnique({ where: { id: updated.client_id } }),
    ]);

    if (client) {
      const companyData = companySettings || {
        legal_name: '67.726.428 PATRICK EDUARDO LIMA SILVA',
        trade_name: 'KAPEL',
        cnpj: '67.726.428/0001-97',
        address: 'Av. Paulista, 1000, Sala 501',
        neighborhood: 'Bela Vista',
        zip_code: '01310-100',
        city: 'São Paulo',
        state: 'SP',
        legal_representative: 'Patrick Eduardo Lima Silva',
        rep_cpf: '000.000.000-00',
        email: 'contato@kapel.digital',
        phone: '+55 (11) 99999-9999',
        jurisdiction_city: 'São Paulo',
        jurisdiction_state: 'SP',
      };

      const snapshot = generateContractSnapshot(
        {
          company: companyData,
          client: {
            type: client.type,
            legal_name: client.legal_name,
            trade_name: client.trade_name,
            document: client.document,
            state_registration: client.state_registration,
            address: client.address,
            address_number: client.address_number,
            neighborhood: client.neighborhood,
            zip_code: client.zip_code,
            city: client.city,
            state: client.state,
            representative_name: client.representative_name,
            representative_cpf: client.representative_cpf,
            representative_role: client.representative_role,
            email: client.email,
            phone: client.phone,
            whatsapp: client.whatsapp,
          },
          config: {
            ...body,
            template_type: updated.template?.type as any || 'PERFORMANCE',
            platforms: platformsString,
          },
          financials,
          contractNumber: updated.contract_number,
        },
        updated.contract_number,
        newStatus
      );

      await prisma.contractSnapshot.upsert({
        where: { contract_id: updated.id },
        update: {
          snapshot_data: JSON.stringify(snapshot),
        },
        create: {
          contract_id: updated.id,
          version: '1.0',
          snapshot_data: JSON.stringify(snapshot),
        },
      });
    }

    // 4. Log de auditoria
    let action = 'CONTRACT_UPDATED';
    if (newStatus === 'FINALIZED' && existing.status !== 'FINALIZED') {
      action = 'CONTRACT_FINALIZED';
    } else if (body.custom_clauses && Object.keys(body.custom_clauses).length > 0) {
      action = 'CLAUSE_CUSTOMIZED';
    }

    await prisma.auditLog.create({
      data: {
        contract_id: updated.id,
        user_name: 'Patrick (Admin)',
        action,
        details: `Contrato #${updated.contract_number} atualizado. Status: ${newStatus}. Honorários: ${financials.total_service_value || financials.initial_payment + financials.future_milestones}.`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar contrato:', error);
    return NextResponse.json({ error: 'Erro ao atualizar contrato.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contract.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir contrato:', error);
    return NextResponse.json({ error: 'Não foi possível excluir o contrato.' }, { status: 500 });
  }
}
