import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do KAPEL CONTRACT (Performance + Political)...');

  const organization = await prisma.organization.upsert({
    where: { slug: 'kapel' },
    update: { name: 'KAPEL', active: true },
    create: { id: 'org_kapel', name: 'KAPEL', slug: 'kapel', active: true },
  });

  // 1. Configurações da Empresa (KAPEL)
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {
      legal_name: '67.726.428 PATRICK EDUARDO LIMA SILVA',
      trade_name: 'KAPEL',
      cnpj: '67.726.428/0001-97',
      address: 'Av. Paulista, 1000, Sala 501',
      neighborhood: 'Bela Vista',
      zip_code: '01310-100',
      city: 'São Paulo',
      state: 'SP',
      legal_representative: 'Patrick Eduardo Lima Silva',
      rep_cpf: '123.456.789-00',
      email: 'contato@kapel.digital',
      phone: '+55 (11) 98765-4321',
      jurisdiction_city: 'São Paulo',
      jurisdiction_state: 'SP',
    },
    create: {
      id: 'default',
      legal_name: '67.726.428 PATRICK EDUARDO LIMA SILVA',
      trade_name: 'KAPEL',
      cnpj: '67.726.428/0001-97',
      address: 'Av. Paulista, 1000, Sala 501',
      neighborhood: 'Bela Vista',
      zip_code: '01310-100',
      city: 'São Paulo',
      state: 'SP',
      legal_representative: 'Patrick Eduardo Lima Silva',
      rep_cpf: '123.456.789-00',
      email: 'contato@kapel.digital',
      phone: '+55 (11) 98765-4321',
      jurisdiction_city: 'São Paulo',
      jurisdiction_state: 'SP',
    },
  });

  // 2. Administrador Patrick (Com hash de senha Bcrypt seguro)
  const initialPasswordHash = await bcrypt.hash('admin123', 10);

  const patrick = await prisma.user.upsert({
    where: { email: 'patrick@kapel.digital' },
    update: {
      name: 'Patrick Eduardo Lima Silva',
      role: 'ADMIN',
      password: initialPasswordHash,
    },
    create: {
      email: 'patrick@kapel.digital',
      name: 'Patrick Eduardo Lima Silva',
      password: initialPasswordHash,
      role: 'ADMIN',
    },
  });

  await prisma.membership.upsert({
    where: {
      organization_id_user_id: {
        organization_id: organization.id,
        user_id: patrick.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      id: 'membership_patrick',
      organization_id: organization.id,
      user_id: patrick.id,
      role: 'OWNER',
    },
  });

  // 3. Categorias de Serviço
  const catPerformance = await prisma.serviceCategory.upsert({
    where: { slug: 'kapel-performance' },
    update: { name: 'KAPEL Performance', order: 1 },
    create: { name: 'KAPEL Performance', slug: 'kapel-performance', order: 1, description: 'Soluções em tráfego pago, aquisição e escala de vendas' },
  });

  const catPolitical = await prisma.serviceCategory.upsert({
    where: { slug: 'kapel-political' },
    update: { name: 'KAPEL Political', order: 2 },
    create: { name: 'KAPEL Political', slug: 'kapel-political', order: 2, description: 'Estratégia digital eleitoral, tráfego de campanha e chatbots informativos' },
  });

  const catStudio = await prisma.serviceCategory.upsert({
    where: { slug: 'kapel-studio' },
    update: { name: 'KAPEL Studio', order: 3 },
    create: { name: 'KAPEL Studio', slug: 'kapel-studio', order: 3, description: 'Design de conversão, landing pages e criativos de performance' },
  });

  const catSystem = await prisma.serviceCategory.upsert({
    where: { slug: 'kapel-system' },
    update: { name: 'KAPEL System', order: 4 },
    create: { name: 'KAPEL System', slug: 'kapel-system', order: 4, description: 'Dashboards em tempo real, inteligência de dados e integrações' },
  });

  // 4. Serviços Padrão e Eleitorais
  const srvTrafego = await prisma.service.upsert({
    where: { slug: 'gestao-trafego' },
    update: {
      name: 'Gestão de Tráfego Pago',
      category_id: catPerformance.id,
      default_price: 3500.0,
      billing_type: 'MONTHLY_ARREARS',
      description: 'Planejamento estratégico, execução técnica e otimização contínua de campanhas de mídia de performance (Meta Ads, Google Ads).',
    },
    create: {
      name: 'Gestão de Tráfego Pago',
      slug: 'gestao-trafego',
      category_id: catPerformance.id,
      default_price: 3500.0,
      billing_type: 'MONTHLY_ARREARS',
      description: 'Planejamento estratégico, execução técnica e otimização contínua de campanhas de mídia de performance (Meta Ads, Google Ads).',
      order: 1,
    },
  });

  const srvTrafegoEleitoral = await prisma.service.upsert({
    where: { slug: 'gestao-trafego-eleitoral' },
    update: {
      name: 'Gestão de Tráfego / Mídia Eleitoral',
      category_id: catPolitical.id,
      default_price: 7500.0,
      billing_type: 'PROJECT_50_50',
      description: 'Planejamento de mídia de campanha, segmentação por zonas eleitorais, impulsionamento e conformidade técnica com o TSE (45 dias).',
    },
    create: {
      name: 'Gestão de Tráfego / Mídia Eleitoral',
      slug: 'gestao-trafego-eleitoral',
      category_id: catPolitical.id,
      default_price: 7500.0,
      billing_type: 'PROJECT_50_50',
      description: 'Planejamento de mídia de campanha, segmentação por zonas eleitorais, impulsionamento e conformidade técnica com o TSE (45 dias).',
      order: 2,
    },
  });

  const srvChatbot = await prisma.service.upsert({
    where: { slug: 'chatbot-informativo' },
    update: {
      name: 'Desenvolvimento e Implantação de Chatbot Informativo',
      category_id: catPolitical.id,
      default_price: 1500.0,
      billing_type: 'PROJECT_50_50',
      description: 'Desenvolvimento de assistente conversacional para divulgação de propostas, biografia e agenda de campanha.',
    },
    create: {
      name: 'Desenvolvimento e Implantação de Chatbot Informativo',
      slug: 'chatbot-informativo',
      category_id: catPolitical.id,
      default_price: 1500.0,
      billing_type: 'PROJECT_50_50',
      description: 'Desenvolvimento de assistente conversacional para divulgação de propostas, biografia e agenda de campanha.',
      order: 3,
    },
  });

  await prisma.service.upsert({
    where: { slug: 'landing-page' },
    update: {
      name: 'Landing Page de Alta Conversão',
      category_id: catStudio.id,
      default_price: 2500.0,
      billing_type: 'PROJECT_50_50',
      description: 'Criação, copywriting e desenvolvimento de landing page orientada à conversão.',
    },
    create: {
      name: 'Landing Page de Alta Conversão',
      slug: 'landing-page',
      category_id: catStudio.id,
      default_price: 2500.0,
      billing_type: 'PROJECT_50_50',
      description: 'Criação, copywriting e desenvolvimento de landing page orientada à conversão.',
      order: 4,
    },
  });

  // 5. Templates de Contrato
  const templatePerf = await prisma.contractTemplate.upsert({
    where: { id: 'template-perf-v1' },
    update: {
      name: 'Contrato Padrão KAPEL Performance',
      type: 'PERFORMANCE',
      version: '1.0',
      clause_order: JSON.stringify([
        'OBJECT_AND_SCOPE',
        'LANDING_PAGE',
        'CREATIVES',
        'CRM_RESPONSIBILITY',
        'OPERATIONAL_AUTONOMY',
        'MEDIA_BUDGET',
        'PAYMENT_CONDITIONS',
        'NO_RESULT_GUARANTEE',
        'COMMUNICATION_AND_SUPPORT',
        'PORTFOLIO',
        'TERM_AND_TERMINATION',
        'LGPD_CONFIDENTIALITY',
        'SIGNATURE_AND_JURISDICTION',
      ]),
    },
    create: {
      id: 'template-perf-v1',
      name: 'Contrato Padrão KAPEL Performance',
      type: 'PERFORMANCE',
      version: '1.0',
      clause_order: JSON.stringify([
        'OBJECT_AND_SCOPE',
        'LANDING_PAGE',
        'CREATIVES',
        'CRM_RESPONSIBILITY',
        'OPERATIONAL_AUTONOMY',
        'MEDIA_BUDGET',
        'PAYMENT_CONDITIONS',
        'NO_RESULT_GUARANTEE',
        'COMMUNICATION_AND_SUPPORT',
        'PORTFOLIO',
        'TERM_AND_TERMINATION',
        'LGPD_CONFIDENTIALITY',
        'SIGNATURE_AND_JURISDICTION',
      ]),
    },
  });

  const templatePol = await prisma.contractTemplate.upsert({
    where: { id: 'template-political-v1' },
    update: {
      name: 'Contrato KAPEL Political',
      type: 'POLITICAL',
      version: '1.0',
      clause_order: JSON.stringify([
        'POLITICAL_SCOPE',
        'CAMPAIGN_PERIOD',
        'MEDIA_BUDGET_INFORMATIONAL',
        'MEDIA_DIRECT_PAYMENT',
        'ELECTORAL_COMPLIANCE',
        'CONTENT_APPROVAL',
        'CAMPAIGN_RESPONSIBILITY',
        'PLATFORM_RULES',
        'NO_ELECTORAL_RESULT_GUARANTEE',
        'NO_VOTE_GUARANTEE',
        'CHATBOT_SCOPE',
        'CHATBOT_CONTENT_RESPONSIBILITY',
        'CHATBOT_AI',
        'CHATBOT_DATA',
        'LGPD_ELECTORAL',
        'SUBCONTRACTING',
        'CONFIDENTIALITY',
        'INTELLECTUAL_PROPERTY',
        'PAYMENT_PROJECT',
        'OFFBOARDING',
        'SIGNATURE_AND_JURISDICTION',
      ]),
    },
    create: {
      id: 'template-political-v1',
      name: 'Contrato KAPEL Political',
      type: 'POLITICAL',
      version: '1.0',
      clause_order: JSON.stringify([
        'POLITICAL_SCOPE',
        'CAMPAIGN_PERIOD',
        'MEDIA_BUDGET_INFORMATIONAL',
        'MEDIA_DIRECT_PAYMENT',
        'ELECTORAL_COMPLIANCE',
        'CONTENT_APPROVAL',
        'CAMPAIGN_RESPONSIBILITY',
        'PLATFORM_RULES',
        'NO_ELECTORAL_RESULT_GUARANTEE',
        'NO_VOTE_GUARANTEE',
        'CHATBOT_SCOPE',
        'CHATBOT_CONTENT_RESPONSIBILITY',
        'CHATBOT_AI',
        'CHATBOT_DATA',
        'LGPD_ELECTORAL',
        'SUBCONTRACTING',
        'CONFIDENTIALITY',
        'INTELLECTUAL_PROPERTY',
        'PAYMENT_PROJECT',
        'OFFBOARDING',
        'SIGNATURE_AND_JURISDICTION',
      ]),
    },
  });

  // 6. Cliente Demo 1: WPL / Simone
  const clientSimone = await prisma.client.upsert({
    where: { id: 'client-demo-wpl' },
    update: {
      organization_id: organization.id,
      legal_name: 'WPL Empreendimentos Digitais Ltda',
      trade_name: 'WPL / Simone',
      type: 'PJ',
      document: '12.345.678/0001-90',
      address: 'Rua Oscar Freire, 580',
      city: 'São Paulo',
      state: 'SP',
      representative_name: 'Simone Cristina dos Santos',
      representative_cpf: '234.567.890-11',
      representative_role: 'Diretora Executiva',
      email: 'simone@wplempreendimentos.com.br',
    },
    create: {
      organization_id: organization.id,
      id: 'client-demo-wpl',
      legal_name: 'WPL Empreendimentos Digitais Ltda',
      trade_name: 'WPL / Simone',
      type: 'PJ',
      document: '12.345.678/0001-90',
      address: 'Rua Oscar Freire, 580',
      city: 'São Paulo',
      state: 'SP',
      representative_name: 'Simone Cristina dos Santos',
      representative_cpf: '234.567.890-11',
      representative_role: 'Diretora Executiva',
      email: 'simone@wplempreendimentos.com.br',
    },
  });

  // 7. Cliente Demo 2: Agência 89 (Caso Campanha Ademir)
  const clientAgencia89 = await prisma.client.upsert({
    where: { id: 'client-demo-agencia89' },
    update: {
      organization_id: organization.id,
      legal_name: 'Agência 89 Comunicação Estratégica Ltda',
      trade_name: 'Agência 89 / Campanha Ademir',
      type: 'PJ',
      document: '89.123.456/0001-89',
      state_registration: 'Isento',
      address: 'Av. Brigadeiro Faria Lima, 2000',
      neighborhood: 'Itaim Bibi',
      zip_code: '01451-000',
      city: 'São Paulo',
      state: 'SP',
      representative_name: 'Roberto Mendes',
      representative_cpf: '345.678.901-22',
      representative_role: 'Diretor de Atendimento',
      email: 'roberto@agencia89.com.br',
      phone: '+55 (11) 3040-5060',
      whatsapp: '+55 (11) 98877-6655',
      notes: 'Agência de publicidade contratante para a campanha majoritária de Ademir José da Silva.',
    },
    create: {
      organization_id: organization.id,
      id: 'client-demo-agencia89',
      legal_name: 'Agência 89 Comunicação Estratégica Ltda',
      trade_name: 'Agência 89 / Campanha Ademir',
      type: 'PJ',
      document: '89.123.456/0001-89',
      state_registration: 'Isento',
      address: 'Av. Brigadeiro Faria Lima, 2000',
      neighborhood: 'Itaim Bibi',
      zip_code: '01451-000',
      city: 'São Paulo',
      state: 'SP',
      representative_name: 'Roberto Mendes',
      representative_cpf: '345.678.901-22',
      representative_role: 'Diretor de Atendimento',
      email: 'roberto@agencia89.com.br',
      phone: '+55 (11) 3040-5060',
      whatsapp: '+55 (11) 98877-6655',
      notes: 'Agência de publicidade contratante para a campanha majoritária de Ademir José da Silva.',
    },
  });

  // 8. Caso Real: DRAFT do Contrato Political "Campanha Ademir / Agência 89" (#000002)
  const existingPolitical = await prisma.contract.findUnique({
    where: { contract_number: '000002' },
  });

  if (!existingPolitical) {
    const contractPol = await prisma.contract.create({
      data: {
        organization_id: organization.id,
        contract_number: '000002',
        client_id: clientAgencia89.id,
        template_id: templatePol.id,
        status: 'DRAFT', // Rascunho demonstrativo conforme especificação
        title: 'Contrato Eleitoral - Campanha Ademir / Agência 89',
        platforms: JSON.stringify(['Meta Ads', 'Google Ads', 'YouTube Ads']),
        
        // Dados Eleitorais
        candidate_name: 'Ademir José da Silva',
        candidate_number: '15',
        candidate_role: 'Prefeito',
        candidate_state: 'SP',
        party: 'MDB',
        federation_or_coalition: 'Coligação Pra Frente São Paulo',
        campaign_cnpj: '65.432.100/0001-15',
        commercial_contractor_type: 'AGENCY',
        campaign_start_date: '2026-08-16',
        campaign_end_date: '2026-10-06',
        
        approval_responsible: 'Coordenação de Comunicação / Agência 89',
        financial_responsible: 'Comitê Financeiro da Campanha Ademir',
        electoral_lawyer: 'Dr. Marcos Oliveira (OAB/SP 123.456)',
        accounting_responsible: 'Valores & Contas Contabilidade Eleitoral',

        // Orçamento de Mídia Informativo (NÃO ENTRA NA RECEITA DA KAPEL)
        planned_media_budget: 60000.0,
        media_payment_responsible: 'CAMPAIGN',
        media_budget_notes: 'Paga diretamente pela conta bancária oficial de campanha às plataformas.',

        // Chatbot
        chatbot_type: 'KNOWLEDGE_BASE',
        chatbot_collects_personal_data: true,
        chatbot_uses_ai: true,
        chatbot_public_url: 'https://wa.me/5511999998888',
        chatbot_content_approval_responsible: 'Agência 89 / Coordenação da Campanha',
        chatbot_custom_scope: 'Chatbot informativo de propostas, biografia e locais de votação.',

        // Compliance
        electoral_legal_review: 'APPROVED',
        accounting_review: 'APPROVED',
        campaign_content_approval: 'APPROVED',
        ai_used: true,
        personal_data_processed: true,
        mass_messaging: false,
        synthetic_content_used: true,
        subcontracting_permitted: true,

        // Valores Calculados (Honorários KAPEL = R$ 9.000, Entrada = R$ 4.500, MRR = R$ 0)
        calculated_mrr: 0.0,
        calculated_initial_payment: 4500.0,
        calculated_future_milestones: 4500.0,
        calculated_total_one_time: 9000.0,
        estimated_media_budget: 60000.0,

        items: {
          create: [
            {
              service_id: srvTrafegoEleitoral.id,
              name: 'Gestão de Tráfego / Mídia Eleitoral',
              billing_type: 'PROJECT_50_50',
              unit_price: 7500.0,
              quantity: 1,
              discount: 0.0,
              total_price: 7500.0,
              duration_days: 45,
              milestone_description: 'Último dia do período contratado de campanha',
              is_addition: false,
            },
            {
              service_id: srvChatbot.id,
              name: 'Desenvolvimento e Implantação de Chatbot Informativo',
              billing_type: 'PROJECT_50_50',
              unit_price: 1500.0,
              quantity: 1,
              discount: 0.0,
              total_price: 1500.0,
              milestone_description: 'Entrega/conclusão do chatbot',
              is_addition: true,
            },
          ],
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        contract_id: contractPol.id,
        user_name: 'Patrick (Admin)',
        action: 'CONTRACT_CREATED',
        details: 'Rascunho de demonstração criado para Campanha Ademir / Agência 89 (Honorários: R$ 9.000 | Mídia Informativa: R$ 60.000).',
      },
    });
  }

  console.log('✅ Seed do KAPEL CONTRACT concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
