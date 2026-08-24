import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateContractFinancials } from '@/lib/engine/financial';
import { generateContractSnapshot } from '@/lib/engine/snapshot';
import { ContractConfigInput } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.template = { type };
    }
    if (query) {
      where.OR = [
        { contract_number: { contains: query } },
        { title: { contains: query } },
        { candidate_name: { contains: query } },
        { client: { legal_name: { contains: query } } },
        { client: { trade_name: { contains: query } } },
        { client: { document: { contains: query } } },
      ];
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        client: true,
        template: true,
        items: true,
      },
    });

    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error('Erro ao buscar contratos:', error);
    return NextResponse.json({ error: 'Erro ao buscar contratos.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ContractConfigInput & { status?: string } = await req.json();

    if (!body.client_id) {
      return NextResponse.json({ error: 'O cliente é obrigatório.' }, { status: 400 });
    }

    const templateType = body.template_type || 'PERFORMANCE';

    // 1. Obter template
    let template = await prisma.contractTemplate.findFirst({
      where: { type: templateType },
    });

    if (!template) {
      template = await prisma.contractTemplate.create({
        data: {
          name: templateType === 'POLITICAL' ? 'Contrato KAPEL Political' : 'Contrato Padrão KAPEL Performance',
          type: templateType,
          clause_order: '[]',
        },
      });
    }

    // 2. Gerar próximo número sequencial de contrato sem colisão (ex: 000001)
    const lastContract = await prisma.contract.findFirst({
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

    let contractNumber = String(nextNum).padStart(6, '0');
    while (await prisma.contract.findUnique({ where: { contract_number: contractNumber } })) {
      nextNum++;
      contractNumber = String(nextNum).padStart(6, '0');
    }

    // 3. Buscar dados da empresa e do cliente
    const [companySettings, client] = await Promise.all([
      prisma.companySettings.findUnique({ where: { id: 'default' } }),
      prisma.client.findUnique({ where: { id: body.client_id } }),
    ]);

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    // 4. Executar Motor Financeiro
    const items = body.items || [];
    const mediaBudgetVal = body.planned_media_budget || body.estimated_media_budget || 0;
    const financials = calculateContractFinancials(items, mediaBudgetVal);

    const status = body.status || 'DRAFT';
    const title = body.title || (templateType === 'POLITICAL'
      ? `Contrato Eleitoral - ${body.candidate_name || client.trade_name || client.legal_name}`
      : `Contrato de Performance - ${client.trade_name || client.legal_name}`);

    const platformsString = Array.isArray(body.platforms)
      ? JSON.stringify(body.platforms)
      : (typeof body.platforms === 'string' && body.platforms.startsWith('[') ? body.platforms : JSON.stringify(['Meta Ads', 'Google Ads']));

    // 5. Criar Contrato no Banco
    const contract = await prisma.contract.create({
      data: {
        contract_number: contractNumber,
        client_id: body.client_id,
        template_id: template.id,
        status,
        title,
        platforms: platformsString,
        landing_page_included: Boolean(body.landing_page_included),
        creatives_included: Boolean(body.creatives_included),
        dashboard_included: Boolean(body.dashboard_included),
        crm_client_responsibility: body.crm_client_responsibility !== undefined ? body.crm_client_responsibility : true,
        technical_operational_autonomy: body.technical_operational_autonomy !== undefined ? body.technical_operational_autonomy : true,
        portfolio_permission: body.portfolio_permission || 'ALLOW',
        portfolio_custom_text: body.portfolio_custom_text || null,
        meeting_frequency: body.meeting_frequency || '1 reunião mensal',
        support_channels: body.support_channels || 'WhatsApp, e-mail e grupo exclusivo',
        support_hours: body.support_hours || '08:00 às 18:00 (dias úteis)',
        media_budget_payer: body.media_budget_payer || 'CLIENT',
        media_budget_notes: body.media_budget_notes || 'Paga diretamente pelo Contratante às plataformas',
        particularities: body.particularities || null,
        billing_type: body.billing_type || (templateType === 'POLITICAL' ? 'PROJECT_50_50' : 'MONTHLY_ARREARS'),
        due_day: body.due_day || 10,
        term_months: body.term_months || 3,
        notice_days: body.notice_days || 15,
        early_termination_policy: body.early_termination_policy || 'NO_PENALTY',
        early_termination_details: body.early_termination_details || null,

        // Campos Eleitorais
        candidate_name: body.candidate_name || null,
        candidate_number: body.candidate_number || null,
        candidate_role: body.candidate_role || null,
        candidate_state: body.candidate_state || null,
        party: body.party || null,
        federation_or_coalition: body.federation_or_coalition || null,
        campaign_cnpj: body.campaign_cnpj || null,
        commercial_contractor_type: body.commercial_contractor_type || 'CAMPAIGN',
        campaign_start_date: body.campaign_start_date || null,
        campaign_end_date: body.campaign_end_date || null,
        approval_responsible: body.approval_responsible || null,
        financial_responsible: body.financial_responsible || null,
        electoral_lawyer: body.electoral_lawyer || null,
        accounting_responsible: body.accounting_responsible || null,

        // Mídia Informativa
        planned_media_budget: financials.media_budget_informative,
        media_payment_responsible: body.media_payment_responsible || 'CAMPAIGN',

        // Chatbot
        chatbot_type: body.chatbot_type || 'RULE_BASED',
        chatbot_collects_personal_data: Boolean(body.chatbot_collects_personal_data),
        chatbot_uses_ai: Boolean(body.chatbot_uses_ai),
        chatbot_public_url: body.chatbot_public_url || null,
        chatbot_content_approval_responsible: body.chatbot_content_approval_responsible || null,
        chatbot_data_retention_notes: body.chatbot_data_retention_notes || null,
        chatbot_custom_scope: body.chatbot_custom_scope || null,

        // Compliance
        electoral_legal_review: body.electoral_legal_review || 'PENDING',
        accounting_review: body.accounting_review || 'PENDING',
        campaign_content_approval: body.campaign_content_approval || 'PENDING',
        ai_used: Boolean(body.ai_used),
        personal_data_processed: Boolean(body.personal_data_processed),
        mass_messaging: Boolean(body.mass_messaging),
        synthetic_content_used: Boolean(body.synthetic_content_used),
        subcontracting_permitted: body.subcontracting_permitted !== undefined ? Boolean(body.subcontracting_permitted) : true,
        subcontracting_clause_text: body.subcontracting_clause_text || null,

        calculated_mrr: financials.recurrent_mrr,
        calculated_initial_payment: financials.initial_payment,
        calculated_future_milestones: financials.future_milestones,
        calculated_total_one_time: financials.total_one_time,
        estimated_media_budget: financials.media_budget_informative,

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

    // 6. Criar Snapshot do Contrato
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
        config: body,
        financials,
        contractNumber,
      },
      contractNumber,
      status
    );

    await prisma.contractSnapshot.create({
      data: {
        contract_id: contract.id,
        version: '1.0',
        snapshot_data: JSON.stringify(snapshot),
      },
    });

    // 7. Registro em Auditoria
    await prisma.auditLog.create({
      data: {
        contract_id: contract.id,
        user_name: 'Patrick (Admin)',
        action: 'CONTRACT_CREATED',
        details: `Contrato #${contractNumber} (${templateType}) criado para ${client.trade_name || client.legal_name}. Honorários: ${financials.total_service_value || financials.initial_payment + financials.future_milestones}.`,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar contrato:', error);
    return NextResponse.json({ error: 'Erro ao criar contrato.' }, { status: 500 });
  }
}
