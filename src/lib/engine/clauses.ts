import {
  BillingType,
  ContractConfigInput,
  EarlyTerminationPolicy,
  PortfolioPermission,
  ResolvedClause,
  TemplateType,
} from '../types';
import { BILLING_TYPE_LABELS, formatCurrency, formatDateBR, formatDocument } from '../utils';

export type { ResolvedClause };

export interface CompanyData {
  legal_name: string;
  trade_name: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  zip_code: string;
  city: string;
  state: string;
  legal_representative: string;
  rep_cpf: string;
  email: string;
  phone: string;
  jurisdiction_city: string;
  jurisdiction_state: string;
}

export interface ClientData {
  type: string;
  legal_name: string;
  trade_name?: string | null;
  document: string;
  state_registration?: string | null;
  address?: string | null;
  address_number?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  city?: string | null;
  state?: string | null;
  representative_name?: string | null;
  representative_cpf?: string | null;
  representative_role?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

export interface ContractEvaluationContext {
  company: CompanyData;
  client: ClientData;
  config: ContractConfigInput;
  financials: {
    total_service_value?: number;
    recurrent_mrr: number;
    initial_payment: number;
    future_milestones: number;
    future_milestone_items?: Array<{ service_name: string; milestone_description: string; amount: number }>;
    total_one_time: number;
    media_budget_informative: number;
  };
  contractNumber?: string;
}

/**
 * Função segura para formatar plataformas (aceita string, JSON ou array)
 */
function parsePlatforms(platforms: any): string {
  if (!platforms) return 'Meta Ads e Google Ads';
  if (Array.isArray(platforms)) return platforms.length > 0 ? platforms.join(', ') : 'Meta Ads e Google Ads';
  if (typeof platforms === 'string') {
    try {
      if (platforms.startsWith('[')) {
        const parsed = JSON.parse(platforms);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(', ');
      }
      return platforms;
    } catch {
      return platforms;
    }
  }
  return 'Meta Ads e Google Ads';
}

/**
 * Substitui placeholders como {{client.legal_name}} de forma determinística
 */
export function interpolateVariables(templateText: string, context: ContractEvaluationContext): string {
  const { company, client, config, financials, contractNumber } = context;

  const earlyTerminationLabels: Record<EarlyTerminationPolicy, string> = {
    NO_PENALTY: 'Livre rescisão mediante aviso prévio estipulado, sem aplicação de multa rescisória.',
    FIXED_FINE: config.early_termination_details || 'Multa compensatória de 1 (uma) mensalidade vigente.',
    PERCENTAGE: config.early_termination_details || 'Multa compensatória de 30% sobre o saldo remanescente do contrato.',
    REMAINING_MONTHS: 'Pagamento integral de 50% dos meses restantes do período de vigência mínima.',
    CUSTOM: config.early_termination_details || 'Condição especial de rescisão acordada entre as partes.',
  };

  const platformsFormatted = parsePlatforms(config.platforms);

  const servicesListFormatted = config.items && config.items.length > 0
    ? config.items.map(item => {
        const durationText = item.duration_days ? ` [Duração: ${item.duration_days} dias]` : '';
        const milestoneText = item.milestone_description ? ` (Marco: ${item.milestone_description})` : '';
        return `• ${item.name} (${BILLING_TYPE_LABELS[item.billing_type] || item.billing_type}) - ${formatCurrency(item.total_price)}${durationText}${milestoneText}`;
      }).join('\n')
    : '• Gestão Estratégica de Performance Digital';

  const milestonesListFormatted = financials.future_milestone_items && financials.future_milestone_items.length > 0
    ? financials.future_milestone_items.map(m => `• ${m.service_name}: ${formatCurrency(m.amount)} - Marco: ${m.milestone_description}`).join('\n')
    : `• Pagamento futuro na entrega: ${formatCurrency(financials.future_milestones)}`;

  const totalFee = financials.total_service_value || (financials.initial_payment + financials.future_milestones + financials.recurrent_mrr);

  const replacements: Record<string, string> = {
    '{{company.legal_name}}': company.legal_name,
    '{{company.trade_name}}': company.trade_name,
    '{{company.cnpj}}': company.cnpj,
    '{{company.address}}': `${company.address}, ${company.neighborhood}, CEP ${company.zip_code}, ${company.city}/${company.state}`,
    '{{company.representative}}': company.legal_representative,
    '{{company.rep_cpf}}': company.rep_cpf,
    '{{company.email}}': company.email,
    '{{company.jurisdiction_city}}': company.jurisdiction_city || 'São Paulo',
    '{{company.jurisdiction_state}}': company.jurisdiction_state || 'SP',

    '{{client.legal_name}}': client.legal_name || 'CONTRATANTE',
    '{{client.trade_name}}': client.trade_name ? ` (${client.trade_name})` : '',
    '{{client.document}}': client.document || '00.000.000/0000-00',
    '{{client.doc_type}}': client.type === 'PJ' ? 'CNPJ' : 'CPF',
    '{{client.address}}': client.address ? `${client.address}${client.address_number ? `, nº ${client.address_number}` : ''}${client.neighborhood ? `, ${client.neighborhood}` : ''}, CEP ${client.zip_code || ''}, ${client.city || ''}/${client.state || ''}` : 'Endereço cadastrado',
    '{{client.representative_qualification}}': client.representative_name ? `representada por seu ${client.representative_role || 'Representante Legal'}, ${client.representative_name}, inscrito no CPF sob nº ${formatDocument(client.representative_cpf)}` : 'representada na forma de seus atos constitutivos',
    '{{client.email}}': client.email || 'contato@cliente.com',

    '{{contract.number}}': contractNumber || '000001',
    '{{contract.total_service_value}}': formatCurrency(totalFee),
    '{{contract.monthly_fee}}': formatCurrency(financials.recurrent_mrr),
    '{{contract.initial_payment}}': formatCurrency(financials.initial_payment),
    '{{contract.future_milestones}}': formatCurrency(financials.future_milestones),
    '{{contract.milestones_list}}': milestonesListFormatted,
    '{{contract.total_one_time}}': formatCurrency(financials.total_one_time),
    '{{contract.billing_type_label}}': BILLING_TYPE_LABELS[config.billing_type] || config.billing_type,
    '{{contract.due_day}}': String(config.due_day || 10),
    '{{contract.term_months}}': String(config.term_months || 3),
    '{{contract.notice_days}}': String(config.notice_days || 15),
    '{{contract.early_termination_policy_text}}': earlyTerminationLabels[config.early_termination_policy || 'NO_PENALTY'],
    '{{contract.platforms}}': platformsFormatted,
    '{{contract.services_list}}': servicesListFormatted,
    '{{contract.meeting_frequency}}': config.meeting_frequency || '1 reunião mensal',
    '{{contract.support_channels}}': config.support_channels || 'WhatsApp, e-mail e canal de comunicação direto',
    '{{contract.support_hours}}': config.support_hours || '08:00 às 18:00 em dias úteis',
    '{{contract.media_budget_notes}}': config.media_budget_notes || 'Paga diretamente pelo Contratante às plataformas',
    '{{contract.media_budget_informative}}': formatCurrency(financials.media_budget_informative || config.planned_media_budget || 0),
    '{{contract.particularities}}': config.particularities ? `\n\nParticularidades e Observações Específicas:\n${config.particularities}` : '',

    // Placeholders Eleitorais
    '{{candidate.name}}': config.candidate_name || 'Candidato(a)',
    '{{candidate.number}}': config.candidate_number || '00',
    '{{candidate.role}}': config.candidate_role || 'Cargo Eletivo',
    '{{candidate.state}}': config.candidate_state || 'SP',
    '{{candidate.party}}': config.party || 'Partido',
    '{{candidate.coalition}}': config.federation_or_coalition ? ` (Coligação/Federação: ${config.federation_or_coalition})` : '',
    '{{campaign.cnpj}}': config.campaign_cnpj || '00.000.000/0001-00',
    '{{campaign.start_date}}': config.campaign_start_date ? formatDateBR(config.campaign_start_date) : 'Início do período eleitoral',
    '{{campaign.end_date}}': config.campaign_end_date ? formatDateBR(config.campaign_end_date) : 'Término do período eleitoral',
    '{{campaign.electoral_lawyer}}': config.electoral_lawyer || 'Assessoria Jurídica da Campanha',
    '{{campaign.accounting}}': config.accounting_responsible || 'Assessoria Contábil da Campanha',
    '{{campaign.media_payer}}': config.media_payment_responsible || 'Campanha Eleitoral / Conta Bancária de Campanha',
    '{{chatbot.type}}': config.chatbot_type || 'Informativo',
  };

  let result = templateText;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

/**
 * Constrói as cláusulas do Template KAPEL Performance
 */
function buildPerformanceClauses(context: ContractEvaluationContext): Array<{ code: string; title: string; defaultContent: string; category: string }> {
  const { config, financials } = context;
  const clauses: Array<{ code: string; title: string; defaultContent: string; category: string }> = [];

  // 1. OBJETO E ESCOPO
  clauses.push({
    code: 'OBJECT_AND_SCOPE',
    title: 'DO OBJETO E DO ESCOPO DOS SERVIÇOS',
    category: 'ESCOPO',
    defaultContent: `1.1. O presente instrumento tem por objeto a prestação de serviços especializados de inteligência comercial, gestão estratégica de tráfego pago e mídia de performance pela CONTRATADA em favor da CONTRATANTE.
1.2. O escopo compreende o planejamento, estruturação, operacionalização técnica e monitoramento contínuo de campanhas publicitárias digitais nas seguintes plataformas homologadas: {{contract.platforms}}.
1.3. Os serviços contratados e seus respectivos modelos comerciais contemplam:
{{contract.services_list}}{{contract.particularities}}`,
  });

  // 2. DELIMITAÇÃO DE ESCOPO: LANDING PAGE
  if (config.landing_page_included) {
    clauses.push({
      code: 'LANDING_PAGE_INCLUDED',
      title: 'DO DESENVOLVIMENTO DE LANDING PAGE',
      category: 'ESCOPO',
      defaultContent: `2.1. Está expressamente INCLUSO no escopo a criação e desenvolvimento de Landing Page orientada a conversão pela CONTRATADA, observando o briefing, diretrizes de marca e validação prévia de conteúdo pela CONTRATANTE antes da veiculação oficial.`,
    });
  } else {
    clauses.push({
      code: 'LANDING_PAGE_EXCLUDED',
      title: 'DA EXCLUSÃO DE DESENVOLVIMENTO DE LANDING PAGES',
      category: 'ESCOPO',
      defaultContent: `2.1. Fica expressamente ajustado que o desenvolvimento, programação, hospedagem e manutenção de páginas web, landing pages ou websites institucionais NÃO estão inclusos neste contrato, sendo de inteira responsabilidade da CONTRATANTE fornecer páginas e ambientes digitais aptos e funcionais para receber o tráfego gerado pelas campanhas.`,
    });
  }

  // 3. DELIMITAÇÃO DE ESCOPO: CRIATIVOS E PRODUÇÃO AUDIOVISUAL
  if (config.creatives_included) {
    clauses.push({
      code: 'CREATIVES_INCLUDED',
      title: 'DA PRODUÇÃO DE CRIATIVOS DE PERFORMANCE',
      category: 'ESCOPO',
      defaultContent: `3.1. A CONTRATADA fornecerá suporte na concepção e edição de peças estáticas e formatos dinâmicos para anúncios de performance, respeitados os limites e cronogramas operacionais acordados entre as partes.`,
    });
  } else {
    clauses.push({
      code: 'CREATIVES_EXCLUDED',
      title: 'DO FORNECIMENTO DE CRIATIVOS E MATERIAIS VISUAIS',
      category: 'ESCOPO',
      defaultContent: `3.1. A criação e o fornecimento de materiais brutos, gravações em vídeo, imagens institucionais, logotipos e criativos finais para veiculação são de integral responsabilidade da CONTRATANTE. A CONTRATADA atuará com orientações de melhores práticas e direcionamento estratégico de briefing.`,
    });
  }

  // 4. INFRAESTRUTURA DE DADOS E CRM
  if (config.crm_client_responsibility) {
    clauses.push({
      code: 'CRM_RESPONSIBILITY',
      title: 'DO SISTEMA DE CRM E QUALIFICAÇÃO DE LEADS',
      category: 'ESCOPO',
      defaultContent: `4.1. A contratação, parametrização interna, atendimento comercial aos leads e manutenção de ferramenta de CRM (Customer Relationship Management) constituem obrigação exclusiva da CONTRATANTE, competindo à sua equipe comercial o devido retorno, tratamento e fechamento das oportunidades de negócios geradas.`,
    });
  }

  // 5. AUTONOMIA OPERACIONAL TÉCNICA
  if (config.technical_operational_autonomy) {
    clauses.push({
      code: 'OPERATIONAL_AUTONOMY',
      title: 'DA AUTONOMIA OPERACIONAL E OTIMIZAÇÃO TÉCNICA',
      category: 'GOVERNANCA',
      defaultContent: `5.1. Para garantir a máxima eficiência e agilidade na resposta aos algoritmos de mídia, a CONTRATADA possui plena autonomia operacional técnica para realizar ajustes dinâmicos, tais como: (a) pausar ou ativar campanhas e conjuntos de anúncios; (b) redistribuir verbas entre canais e conjuntos previamente aprovados; (c) ajustar segmentações de público; (d) executar testes A/B de criativos; e (e) alterar estratégias de lances e otimização.
5.2. A autonomia técnica descrita em nenhuma hipótese autoriza o aumento do teto orçamentário total de mídia deliberado e aprovado pela CONTRATANTE sem sua prévia e expressa autorização.`,
    });
  }

  // 6. INVESTIMENTO EM MÍDIA (ESTRITAMENTE SEPARADO)
  clauses.push({
    code: 'MEDIA_BUDGET',
    title: 'DO INVESTIMENTO EM MÍDIA PUBLICITÁRIA',
    category: 'FINANCEIRO',
    defaultContent: `6.1. Todos os valores despendidos na veiculação de anúncios pagos nas plataformas digitais (tais como Meta Ads, Google Ads, TikTok Ads, entre outras) serão pagos DIRETAMENTE pela CONTRATANTE aos respectivos veículos de mídia, via cartão de crédito corporativo ou faturamento direto em seu nome/CNPJ.
6.2. Em nenhuma hipótese as verbas destinadas ao pagamento de mídia compõem ou integram o faturamento, receita ou remuneração da CONTRATADA, inexistindo solidariedade tributária ou financeira sobre tais desembolsos.`,
  });

  // 7. REMUNERAÇÃO E CONDIÇÕES DE PAGAMENTO
  clauses.push({
    code: 'PAYMENT_CONDITIONS',
    title: 'DA REMUNERAÇÃO E FORMA DE PAGAMENTO',
    category: 'FINANCEIRO',
    defaultContent: `7.1. Pelos serviços contratados, a CONTRATANTE pagará à CONTRATADA o valor total de {{contract.total_service_value}}, estruturado da seguinte forma:
${financials.recurrent_mrr > 0 ? `a) Remuneração Recorrente (Fee Mensal): {{contract.monthly_fee}} por mês, sob a modalidade {{contract.billing_type_label}}, com vencimento todo dia {{contract.due_day}} de cada mês subsequente ao ciclo;\n` : ''}${financials.initial_payment > 0 ? `b) Pagamento Inicial / Entrada: {{contract.initial_payment}} a ser liquidado na data de assinatura deste instrumento;\n` : ''}${financials.future_milestones > 0 ? `c) Pagamentos Futuros por Marcos:\n{{contract.milestones_list}}\n` : ''}7.2. O não pagamento de quaisquer valores nas datas estipuladas sujeitará a CONTRATANTE à incidência de multa moratória de 2% (dois por cento) sobre o valor inadimplido, acrescida de juros de mora de 1% (um por cento) ao mês e correção monetária pelo IPCA/IBGE pro rata die.
7.3. O atraso superior a 10 (dez) dias autorizará a CONTRATADA a suspender a prestação dos serviços até a integral regularização financeira.`,
  });

  // 8. AUSÊNCIA DE GARANTIA DE RESULTADOS
  clauses.push({
    code: 'NO_RESULT_GUARANTEE',
    title: 'DA NATUREZA DA OBRIGAÇÃO E AUSÊNCIA DE PROMESSA DE RESULTADOS',
    category: 'JURIDICO',
    defaultContent: `8.1. A prestação de serviços objeto deste contrato constitui obrigação de meio e técnica diligente, e não de fim ou de resultado financeiro garantido.
8.2. A CONTRATADA compromete-se a aplicar as melhores práticas de mercado e rigor metodológico, todavia, fatores externos como oscilações macroeconômicas, sazonalidade, política de preços da CONTRATANTE, competitividade do produto e estabilidade de plataformas de terceiros não são controláveis pela CONTRATADA, não havendo garantia de volume exato de faturamento, leads convertidos ou lucro final.`,
  });

  // 9. REUNIÕES, ATENDIMENTO E CANAIS
  clauses.push({
    code: 'COMMUNICATION_AND_SUPPORT',
    title: 'DA COMUNICAÇÃO, REUNIÕES E HORÁRIOS DE ATENDIMENTO',
    category: 'GOVERNANCA',
    defaultContent: `9.1. O alinhamento operacional e acompanhamento de indicadores dar-se-á mediante:
a) Reuniões de Alinhamento: {{contract.meeting_frequency}};
b) Canais de Comunicação Homologados: {{contract.support_channels}};
c) Horário de Atendimento: {{contract.support_hours}}.
9.2. O estabelecimento de horário de atendimento comercial delimita o período de expediente da equipe e não se confunde com obrigação de resposta em tempo real instantânea, observando-se a ordem de prioridade e complexidade das demandas técnicas.`,
  });

  // 10. PORTFÓLIO E DIVULGAÇÃO DE CASE
  if (config.portfolio_permission === 'ALLOW') {
    clauses.push({
      code: 'PORTFOLIO_ALLOW',
      title: 'DA DIVULGAÇÃO DE PORTFÓLIO E CASES DE SUCESSO',
      category: 'JURIDICO',
      defaultContent: `10.1. A CONTRATANTE autoriza expressamente a CONTRATADA a mencionar sua marca e logotipo e divulgar métricas agregadas de crescimento e performance técnica em seu portfólio comercial, apresentações institucionais e redes sociais, respeitado o sigilo de segredos industriais e dados confidenciais.`,
    });
  } else if (config.portfolio_permission === 'DENY') {
    clauses.push({
      code: 'PORTFOLIO_DENY',
      title: 'DO SIGILO E VEDAÇÃO DE USO DA MARCA EM PORTFÓLIO',
      category: 'JURIDICO',
      defaultContent: `10.1. A CONTRATADA compromete-se a não utilizar a marca, logotipo, nome comercial ou quaisquer dados da CONTRATANTE em portfólios públicos, estudos de caso ou materiais de marketing institucional sem consentimento prévio e por escrito.`,
    });
  } else {
    clauses.push({
      code: 'PORTFOLIO_CUSTOM',
      title: 'DA DIVULGAÇÃO CONDICIONADA DE PORTFÓLIO',
      category: 'JURIDICO',
      defaultContent: `10.1. ${config.portfolio_custom_text || 'A divulgação de materiais da CONTRATANTE em portfólio da CONTRATADA ocorrerá mediante prévia aprovação pontual de cada conteúdo compartilhado.'}`,
    });
  }

  // 11. VIGÊNCIA E RESCISÃO
  clauses.push({
    code: 'TERM_AND_TERMINATION',
    title: 'DA VIGÊNCIA, AVISO PRÉVIO E RESCISÃO',
    category: 'JURIDICO',
    defaultContent: `11.1. O presente contrato vigorará pelo prazo determinado inicial de {{contract.term_months}} meses a contar da data de sua assinatura, renovando-se automaticamente por períodos iguais e sucessivos caso não haja manifestação formal em contrário por qualquer das partes com antecedência mínima de {{contract.notice_days}} dias.
11.2. Política de rescisão antecipada durante o período inicial de vigência: {{contract.early_termination_policy_text}}`,
  });

  // 12. PROTEÇÃO DE DADOS, LGPD E CONFIDENCIALIDADE
  clauses.push({
    code: 'LGPD_CONFIDENTIALITY',
    title: 'DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS (LGPD)',
    category: 'JURIDICO',
    defaultContent: `12.1. As partes obrigam-se a manter em estrito sigilo todas as informações confidenciais, estratégias de negócios, dados técnicos e comerciais a que tiverem acesso em razão deste contrato.
12.2. No tratamento de dados pessoais vinculados às campanhas, ambas as partes comprometem-se a cumprir integralmente a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD), implementando medidas técnicas e administrativas aptas a proteger os dados contra acessos não autorizados.`,
  });

  // 13. ASSINATURA ELETRÔNICA E FORO
  clauses.push({
    code: 'SIGNATURE_AND_JURISDICTION',
    title: 'DA ASSINATURA ELETRÔNICA E DO FORO DE ELEIÇÃO',
    category: 'JURIDICO',
    defaultContent: `13.1. As partes reconhecem a plena validade jurídica, integridade e eficácia executiva do presente instrumento firmado por meio de assinaturas eletrônicas ou digitais, nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.
13.2. Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem expressamente o Foro da Comarca de {{company.jurisdiction_city}} - {{company.jurisdiction_state}}, com renúncia a qualquer outro, por mais privilegiado que seja.`,
  });

  return clauses;
}

/**
 * Constrói as 19 cláusulas específicas do Template KAPEL Political
 */
function buildPoliticalClauses(context: ContractEvaluationContext): Array<{ code: string; title: string; defaultContent: string; category: string }> {
  const { config, financials } = context;
  const clauses: Array<{ code: string; title: string; defaultContent: string; category: string }> = [];

  // 1. OBJETO ELEITORAL ESPECÍFICO
  clauses.push({
    code: 'POLITICAL_SCOPE',
    title: 'DO OBJETO E DO ESCOPO DE MARKETING E TRÁFEGO ELEITORAL',
    category: 'ELEITORAL',
    defaultContent: `1.1. O presente instrumento tem por objeto a prestação de serviços especializados de estratégia digital, inteligência de tráfego pago eleitoral e soluções tecnológicas pela CONTRATADA em favor do CONTRATANTE, visando à campanha eleitoral do(a) candidato(a) {{candidate.name}}, concorrente ao cargo de {{candidate.role}} (nº {{candidate.number}}), filiado(a) ao {{candidate.party}}{{candidate.coalition}}, no estado de {{candidate.state}}, sob o CNPJ de Campanha nº {{campaign.cnpj}}.
1.2. O escopo compreende a execução técnica dos seguintes serviços contratados:
{{contract.services_list}}{{contract.particularities}}`,
  });

  // 2. PERÍODO DE VIGÊNCIA ELEITORAL
  clauses.push({
    code: 'CAMPAIGN_PERIOD',
    title: 'DO PERÍODO DE VIGÊNCIA E CRONOGRAMA DE CAMPANHA',
    category: 'ELEITORAL',
    defaultContent: `2.1. O presente contrato vigorará durante o período oficial de campanha eleitoral, iniciando-se em {{campaign.start_date}} e encerrando-se impreterivelmente em {{campaign.end_date}}, data na qual cessarão todas as atividades operacionais de veiculação e suporte direto da CONTRATADA.
2.2. Por se tratar de contrato com prazo determinado e finalidade vinculada ao calendário eleitoral oficial, as obrigações estipuladas não se prorrogam automaticamente pós-pleito, salvo termo aditivo expresso.`,
  });

  // 3. ORÇAMENTO DE MÍDIA ELEITORAL (INFORMATIVO)
  clauses.push({
    code: 'MEDIA_BUDGET_INFORMATIONAL',
    title: 'DO ORÇAMENTO ESTIMADO DE MÍDIA ELEITORAL (INFORMATIVO)',
    category: 'FINANCEIRO',
    defaultContent: `3.1. Fica expressamente consignado que o orçamento de mídia planejado para veiculação de anúncios (impulsionamento) nas plataformas digitais (Meta Ads, Google Ads e correlatas) é estimado em {{contract.media_budget_informative}}.
3.2. ESTE VALOR É MERAMENTE INFORMATIVO E NÃO INTEGRA A REMUNERAÇÃO, OS HONORÁRIOS OU O FATURAMENTO DA CONTRATADA.
3.3. A CONTRATADA não recebe, não custodia e não realiza o repasse de verbas destinadas a anúncios eleitorais.`,
  });

  // 4. PAGAMENTO DIRETO DE MÍDIA PELA CAMPANHA
  clauses.push({
    code: 'MEDIA_DIRECT_PAYMENT',
    title: 'DO PAGAMENTO DIRETO DOS IMPULSIONAMENTOS PELA CONTA DE CAMPANHA',
    category: 'FINANCEIRO',
    defaultContent: `4.1. Todos os pagamentos relativos a impulsionamento de conteúdos eleitorais serão realizados DIRETAMENTE pelo CONTRATANTE ({{campaign.media_payer}}) às empresas veiculadoras (Meta Plataformas do Brasil Ltda., Google Brasil Internet Ltda., etc.), utilizando exclusivamente cartão de crédito corporativo emitido em nome do CNPJ de Campanha nº {{campaign.cnpj}} ou boleto bancário de campanha.
4.2. O CONTRATANTE declara ciência de que o descumprimento das regras de pagamento de impulsionamento diretamente pela conta bancária eleitoral oficial constitui infração às normas do Tribunal Superior Eleitoral (TSE), respondendo exclusiva e diretamente por quaisquer sanções eleitorais.`,
  });

  // 5. COMPLIANCE E LEGISLAÇÃO ELEITORAL
  clauses.push({
    code: 'ELECTORAL_COMPLIANCE',
    title: 'DO COMPLIANCE E CONFORMIDADE COM AS NORMAS DO TSE',
    category: 'ELEITORAL',
    defaultContent: `5.1. As partes obrigam-se a observar com rigor a Lei das Eleições (Lei nº 9.504/1997), as Resoluções específicas do Tribunal Superior Eleitoral (TSE) para o pleito em vigor e as diretrizes do Ministério Público Eleitoral.
5.2. As orientações jurídicas eleitorais emanadas pelo(a) advogado(a) eleitoral da campanha ({{campaign.electoral_lawyer}}) prevalecerão sobre quaisquer decisões técnicas de veiculação em caso de divergência regulatória.`,
  });

  // 6. APROVAÇÃO PRÉVIA DE CONTEÚDOS
  clauses.push({
    code: 'CONTENT_APPROVAL',
    title: 'DA APROVAÇÃO PRÉVIA E RESPONSABILIDADE SOBRE O CONTEÚDO',
    category: 'ELEITORAL',
    defaultContent: `6.1. Todos os textos, vídeos, propostas de campanha, artes e criativos submetidos ao impulsionamento digital deverão ser previamente validados e aprovados pelo responsável designado pelo CONTRATANTE antes da ativação pública.
6.2. A CONTRATADA atua estritamente na operacionalização técnica e distribuição de mídia, não sendo autora ideológica das manifestações políticas veiculadas.`,
  });

  // 7. RESPONSABILIDADE EXCLUSIVA DA CAMPANHA
  clauses.push({
    code: 'CAMPAIGN_RESPONSIBILITY',
    title: 'DA RESPONSABILIDADE DA CAMPANHA E AUSÊNCIA DE SOLIDARIEDADE',
    category: 'ELEITORAL',
    defaultContent: `7.1. O CONTRATANTE assume integral e exclusiva responsabilidade cível, eleitoral, criminal e administrativa por eventuais representações eleitorais, pedidos de direito de resposta, multas por propaganda antecipada ou irregular e sanções pecuniárias aplicadas pela Justiça Eleitoral decorrentes do teor das mensagens e estratégias determinadas pela campanha.
7.2. Fica expressamente afastada qualquer solidariedade jurídica da CONTRATADA por infrações eleitorais decorrentes de atos praticados em estrita consonância com as instruções do CONTRATANTE.`,
  });

  // 8. REGRAS DAS PLATAFORMAS E AUTORIZAÇÃO ELEITORAL
  clauses.push({
    code: 'PLATFORM_RULES',
    title: 'DAS POLÍTICAS DE ANÚNCIOS POLÍTICOS DAS PLATAFORMAS',
    category: 'ELEITORAL',
    defaultContent: `8.1. O CONTRATANTE é responsável por fornecer as documentações e validações necessárias para a obtenção do selo de &quot;Anúncios sobre Temas Sociais, Eleições ou Política&quot; junto à Meta e certificação eleitoral do Google.
8.2. A CONTRATADA não responde por eventuais atrasos, bloqueios de contas ou indeferimentos decorrentes de instabilidades burocráticas ou regras internas unilaterais das plataformas digitais terceiras.`,
  });

  // 9. AUSÊNCIA DE GARANTIA DE RESULTADO ELEITORAL
  clauses.push({
    code: 'NO_ELECTORAL_RESULT_GUARANTEE',
    title: 'DA OBRIGAÇÃO DE MEIO E AUSÊNCIA DE GARANTIA DE ELEIÇÃO',
    category: 'JURIDICO',
    defaultContent: `9.1. A contratação dos serviços descritos neste instrumento configura obrigação de meio e técnica profissional diligente, pautada em dados e boas práticas de marketing eleitoral.
9.2. A CONTRATADA não garante, não promete e não se responsabiliza pelo resultado das urnas, eleição do candidato, quociente eleitoral partidário ou índices em pesquisas de intenção de voto.`,
  });

  // 10. AUSÊNCIA DE GARANTIA DE VOTOS
  clauses.push({
    code: 'NO_VOTE_GUARANTEE',
    title: 'DA VEDAÇÃO DE PROMESSA DE CONVERSÃO EM VOTOS',
    category: 'JURIDICO',
    defaultContent: `10.1. Fica expressamente pactuado que métricas digitais (tais como alcance, visualizações, engajamento e cliques) constituem indicadores de desempenho publicitário e de distribuição de mensagem, inexistindo qualquer correlação garantida ou compromisso de conversão direta em votos no dia da votação.`,
  });

  // 11. ESCOPO DE CHATBOT ELEITORAL
  const hasChatbot = config.items?.some(i => i.name.toLowerCase().includes('chatbot')) || config.chatbot_type;
  if (hasChatbot) {
    clauses.push({
      code: 'CHATBOT_SCOPE',
      title: 'DO ESCOPO DO CHATBOT INFORMATIVO DE CAMPANHA',
      category: 'CHATBOT',
      defaultContent: `11.1. O serviço de Chatbot contempla a estruturação e disponibilização de assistente conversacional do tipo {{chatbot.type}}, com o objetivo estrito de prestar informações públicas sobre biografia, propostas de governo, locais de votação e agenda oficial do(a) candidato(a).
11.2. O canal oficial e links de acesso serão definidos em conjunto com a coordenação de campanha.`,
    });

    clauses.push({
      code: 'CHATBOT_CONTENT_RESPONSIBILITY',
      title: 'DA BASE DE CONHECIMENTO E RESPONSABILIDADE PELO CHATBOT',
      category: 'CHATBOT',
      defaultContent: `11.3. Toda a base de conhecimento, perguntas e respostas e diretrizes programadas no Chatbot serão fornecidas ou validadas previamente pelo CONTRATANTE.
11.4. É expressamente vedada a programação do Chatbot para emissão de ofensas, ataques a adversários políticos, disseminação de desinformação ou disparo de mensagens não solicitadas em massa.`,
    });

    if (config.chatbot_uses_ai || config.ai_used) {
      clauses.push({
        code: 'CHATBOT_AI',
        title: 'DO USO DE INTELIGÊNCIA ARTIFICIAL E ROTULAGEM OBRIGATÓRIA',
        category: 'CHATBOT',
        defaultContent: `11.5. Em cumprimento às resoluções do Tribunal Superior Eleitoral relativas ao uso de Inteligência Artificial nas eleições, o Chatbot conterá aviso explícito e transparente aos usuários informando tratar-se de ferramenta automatizada com tecnologia de IA.
11.6. O CONTRATANTE declara ciência de que o uso de IA em campanha eleitoral exige revisão jurídica prévia contínua.`,
      });
    }

    if (config.chatbot_collects_personal_data || config.personal_data_processed) {
      clauses.push({
        code: 'CHATBOT_DATA',
        title: 'DA PROTEÇÃO DE DADOS COLETADOS NO CHATBOT',
        category: 'CHATBOT',
        defaultContent: `11.7. Caso o Chatbot colete dados de contato (nome, WhatsApp, bairro) de eleitores para recebimento voluntário de informativos, o CONTRATANTE declara que possui base legal de consentimento inequívoco nos termos da LGPD, assumindo o papel de Controlador dos Dados Pessoais perante a ANPD e Justiça Eleitoral.`,
      });
    }
  }

  // 12. LGPD NO CONTEXTO ELEITORAL
  clauses.push({
    code: 'LGPD_ELECTORAL',
    title: 'DA PROTEÇÃO DE DADOS PESSOAIS E LGPD ELEITORAL',
    category: 'ELEITORAL',
    defaultContent: `12.1. Ambas as partes comprometem-se a observar rigorosamente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) aplicada ao contexto eleitoral.
12.2. É estritamente proibida a utilização de cadastros de terceiros, bases de dados compradas ou mecanismos de envio massivo não consentidos pela legislação.`,
  });

  // 13. SUBCONTRATAÇÃO E EQUIPE TÉCNICA
  clauses.push({
    code: 'SUBCONTRACTING',
    title: 'DA EQUIPE TÉCNICA E SUBCONTRATAÇÃO AUTORIZADA',
    category: 'GOVERNANCA',
    defaultContent: `13.1. Para a fiel execução das atividades técnicas de inteligência, tráfego, design e desenvolvimento, a CONTRATADA fica expressamente autorizada a empregar equipe própria, colaboradores, especialistas técnicos e prestadores de serviços sob sua exclusiva gestão, coordenação e responsabilidade.
13.2. A atuação dos profissionais e parceiros da CONTRATADA não gera vínculo empregatício, solidariedade ou relação contratual direta entre estes e o CONTRATANTE, cabendo à CONTRATADA o cumprimento de todos os seus encargos.`,
  });

  // 14. CONFIDENCIALIDADE ELEITORAL
  clauses.push({
    code: 'CONFIDENTIALITY',
    title: 'DO SIGILO E CONFIDENCIALIDADE ESTRATÉGICA',
    category: 'JURIDICO',
    defaultContent: `14.1. As partes obrigam-se a manter absoluto sigilo sobre pesquisas eleitorais internas, métricas de tracking, estratégias de discursos e informações confidenciais a que tiverem acesso durante a vigência deste contrato.`,
  });

  // 15. PROPRIEDADE INTELECTUAL
  clauses.push({
    code: 'INTELLECTUAL_PROPERTY',
    title: 'DA PROPRIEDADE INTELECTUAL E DADOS DA CAMPANHA',
    category: 'JURIDICO',
    defaultContent: `15.1. Os dados de públicos e relatórios gerados pertencem à campanha eleitoral contratante.
15.2. As metodologias de automação, frameworks proprietários e códigos analíticos desenvolvidos previamente pela CONTRATADA constituem propriedade intelectual exclusiva desta.`,
  });

  // 16. REMUNERAÇÃO POR PROJETO E MARCOS
  clauses.push({
    code: 'PAYMENT_PROJECT',
    title: 'DOS HONORÁRIOS E FORMA DE PAGAMENTO POR MARCOS',
    category: 'FINANCEIRO',
    defaultContent: `16.1. Pelos serviços contratados, o CONTRATANTE pagará à CONTRATADA o valor total de {{contract.total_service_value}}, estipulado da seguinte forma:
a) Pagamento Inicial na Contratação: {{contract.initial_payment}} a ser quitado na assinatura deste contrato;
b) Pagamentos Futuros Vinculados a Marcos:
{{contract.milestones_list}}
16.2. Os honorários da CONTRATADA deverão ser quitados por meio de transferência bancária originada da conta bancária de campanha do CONTRATANTE (ou da agência contratante autorizada), com a devida emissão de Nota Fiscal de prestação de serviços para fins de prestação de contas eleitorais ({{campaign.accounting}}).`,
  });

  // 17. ENCERRAMENTO E OFFBOARDING
  clauses.push({
    code: 'OFFBOARDING',
    title: 'DO ENCERRAMENTO E PRESTAÇÃO DE CONTAS FINAL',
    category: 'ELEITORAL',
    defaultContent: `17.1. Ao término do período de campanha em {{campaign.end_date}}, a CONTRATADA entregará relatório consolidado das métricas de entrega e declaração de quitação técnica, auxiliando o CONTRATANTE com os dados necessários à instrução da sua prestação de contas final perante o Tribunal Superior Eleitoral.`,
  });

  // 18. ASSINATURA ELETRÔNICA E FORO
  clauses.push({
    code: 'SIGNATURE_AND_JURISDICTION',
    title: 'DA ASSINATURA ELETRÔNICA E DO FORO DE ELEIÇÃO',
    category: 'JURIDICO',
    defaultContent: `18.1. As partes reconhecem a plena validade executiva do presente instrumento firmado eletronicamente.
18.2. As partes elegem o Foro da Comarca de {{company.jurisdiction_city}} - {{company.jurisdiction_state}} para dirimir quaisquer litígios civis decorrentes deste contrato, sem prejuízo da competência material indelegável da Justiça Eleitoral para matérias tipicamente eleitorais.`,
  });

  return clauses;
}

/**
 * Motor Determinístico de Montagem de Cláusulas Contratuais
 * Seleciona a biblioteca correta conforme template_type (PERFORMANCE ou POLITICAL)
 */
export function buildDeterministicContractClauses(context: ContractEvaluationContext): ResolvedClause[] {
  const { config } = context;
  const customOverrides = config.custom_clauses || {};
  const templateType = config.template_type || 'PERFORMANCE';

  let rawClauses: Array<{ code: string; title: string; defaultContent: string; category: string }> = [];

  if (templateType === 'POLITICAL') {
    rawClauses = buildPoliticalClauses(context);
  } else {
    rawClauses = buildPerformanceClauses(context);
  }

  // Resolução com interpolação e verificação de customização
  return rawClauses.map((clause, index) => {
    const custom = customOverrides[clause.code];
    const isCustom = Boolean(custom && custom.is_custom);
    const title = (custom && custom.title) ? custom.title : clause.title;
    const rawContent = (custom && custom.content) ? custom.content : clause.defaultContent;
    const interpolatedContent = interpolateVariables(rawContent, context);

    return {
      number: index + 1,
      code: clause.code,
      title,
      content: interpolatedContent,
      is_custom: isCustom,
      category: clause.category,
    };
  });
}
