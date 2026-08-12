'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import {
  Users,
  Briefcase,
  Sliders,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Eye,
  Save,
  Building2,
  Shield,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  ArrowRight,
  Vote,
  Bot,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { calculateContractFinancials } from '@/lib/engine/financial';
import { BILLING_TYPE_LABELS, formatCurrency, formatDocument } from '@/lib/utils';
import {
  ChatbotType,
  CommercialContractorType,
  ComplianceReviewStatus,
  ContractItemInput,
  EarlyTerminationPolicy,
  PortfolioPermission,
  TemplateType,
} from '@/lib/types';

function NewContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  const preselectedTemplate = (searchParams.get('template') as TemplateType) || 'PERFORMANCE';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Database Data
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Configurator Form State
  const [templateType, setTemplateType] = useState<TemplateType>(preselectedTemplate);
  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [platforms, setPlatforms] = useState<string[]>(['Meta Ads', 'Google Ads']);
  const [items, setItems] = useState<ContractItemInput[]>([]);

  // Dados Eleitorais (KAPEL Political)
  const [candidateName, setCandidateName] = useState('');
  const [candidateNumber, setCandidateNumber] = useState('');
  const [candidateRole, setCandidateRole] = useState('Prefeito');
  const [candidateState, setCandidateState] = useState('SP');
  const [party, setParty] = useState('');
  const [federationOrCoalition, setFederationOrCoalition] = useState('');
  const [campaignCnpj, setCampaignCnpj] = useState('');
  const [commercialContractorType, setCommercialContractorType] = useState<CommercialContractorType>('CAMPAIGN');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');
  const [approvalResponsible, setApprovalResponsible] = useState('');
  const [financialResponsible, setFinancialResponsible] = useState('');
  const [electoralLawyer, setElectoralLawyer] = useState('');
  const [accountingResponsible, setAccountingResponsible] = useState('');
  const [plannedMediaBudget, setPlannedMediaBudget] = useState(60000);
  const [mediaPaymentResponsible, setMediaPaymentResponsible] = useState('CAMPAIGN');

  // Chatbot
  const [hasChatbotService, setHasChatbotService] = useState(false);
  const [chatbotType, setChatbotType] = useState<ChatbotType>('KNOWLEDGE_BASE');
  const [chatbotCollectsData, setChatbotCollectsData] = useState(false);
  const [chatbotUsesAi, setChatbotUsesAi] = useState(false);
  const [chatbotPublicUrl, setChatbotPublicUrl] = useState('');
  const [chatbotScopeNotes, setChatbotScopeNotes] = useState('');

  // Compliance Eleitoral
  const [electoralLegalReview, setElectoralLegalReview] = useState<ComplianceReviewStatus>('PENDING');
  const [accountingReview, setAccountingReview] = useState<ComplianceReviewStatus>('PENDING');
  const [campaignContentApproval, setCampaignContentApproval] = useState<ComplianceReviewStatus>('PENDING');
  const [aiUsed, setAiUsed] = useState(false);
  const [personalDataProcessed, setPersonalDataProcessed] = useState(false);
  const [massMessaging, setMassMessaging] = useState(false);
  const [syntheticContentUsed, setSyntheticContentUsed] = useState(false);
  const [subcontractingPermitted, setSubcontractingPermitted] = useState(true);

  // Escopo Padrão (KAPEL Performance)
  const [landingPageIncluded, setLandingPageIncluded] = useState(false);
  const [creativesIncluded, setCreativesIncluded] = useState(false);
  const [dashboardIncluded, setDashboardIncluded] = useState(false);
  const [crmClientResponsibility, setCrmClientResponsibility] = useState(true);
  const [technicalOperationalAutonomy, setTechnicalOperationalAutonomy] = useState(true);
  const [portfolioPermission, setPortfolioPermission] = useState<PortfolioPermission>('ALLOW');
  const [portfolioCustomText, setPortfolioCustomText] = useState('');
  const [meetingFrequency, setMeetingFrequency] = useState('1 reunião mensal');
  const [supportChannels, setSupportChannels] = useState('WhatsApp, e-mail e canal direto');
  const [supportHours, setSupportHours] = useState('08:00 às 18:00 (dias úteis)');
  const [mediaBudgetNotes, setMediaBudgetNotes] = useState('Paga diretamente pelo Contratante às plataformas');
  const [estimatedMediaBudget, setEstimatedMediaBudget] = useState(10000);
  const [particularities, setParticularities] = useState('');

  // Prazos e Condições
  const [dueDay, setDueDay] = useState(10);
  const [termMonths, setTermMonths] = useState(3);
  const [noticeDays, setNoticeDays] = useState(15);
  const [earlyTerminationPolicy, setEarlyTerminationPolicy] = useState<EarlyTerminationPolicy>('NO_PENALTY');
  const [earlyTerminationDetails, setEarlyTerminationDetails] = useState('');

  // Carregamento inicial de clientes e serviços
  useEffect(() => {
    async function load() {
      try {
        const [cliRes, srvRes, catRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/services'),
          fetch('/api/categories'),
        ]);

        if (cliRes.ok && srvRes.ok && catRes.ok) {
          const cliData = await cliRes.json();
          const srvData = await srvRes.json();
          const catData = await catRes.json();

          setClients(cliData);
          setServices(srvData);
          setCategories(catData);

          if (!clientId && cliData.length > 0) {
            setClientId(cliData[0].id);
          }

          // Inicializa itens com base no template
          if (templateType === 'POLITICAL') {
            const trfPol = srvData.find((s: any) => s.slug === 'gestao-trafego-eleitoral');
            const chbPol = srvData.find((s: any) => s.slug === 'chatbot-informativo');
            const initialItems: ContractItemInput[] = [];

            if (trfPol) {
              initialItems.push({
                service_id: trfPol.id,
                name: trfPol.name,
                billing_type: 'PROJECT_50_50',
                unit_price: trfPol.default_price || 7500,
                quantity: 1,
                discount: 0,
                total_price: trfPol.default_price || 7500,
                duration_days: 45,
                milestone_description: 'Último dia do período contratado de campanha',
                is_addition: false,
              });
            }

            if (chbPol) {
              initialItems.push({
                service_id: chbPol.id,
                name: chbPol.name,
                billing_type: 'PROJECT_50_50',
                unit_price: chbPol.default_price || 1500,
                quantity: 1,
                discount: 0,
                total_price: chbPol.default_price || 1500,
                milestone_description: 'Entrega/conclusão do chatbot',
                is_addition: true,
              });
              setHasChatbotService(true);
            }

            setItems(initialItems);
          } else {
            const defaultService = srvData.find((s: any) => s.slug === 'gestao-trafego') || srvData[0];
            if (defaultService) {
              setItems([
                {
                  service_id: defaultService.id,
                  name: defaultService.name,
                  description: defaultService.description,
                  billing_type: defaultService.billing_type,
                  unit_price: defaultService.default_price,
                  quantity: 1,
                  discount: 0,
                  total_price: defaultService.default_price,
                  is_addition: false,
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [templateType]);

  // Cálculos financeiros em tempo real
  const financials = useMemo(() => {
    const mediaVal = templateType === 'POLITICAL' ? plannedMediaBudget : estimatedMediaBudget;
    return calculateContractFinancials(items, mediaVal);
  }, [items, templateType, plannedMediaBudget, estimatedMediaBudget]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const availablePlatforms = [
    'Meta Ads',
    'Google Ads',
    'TikTok Ads',
    'LinkedIn Ads',
    'Pinterest Ads',
    'YouTube Ads',
  ];

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter((x) => x !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const handleAddItemFromService = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return;
    const newItem: ContractItemInput = {
      service_id: srv.id,
      name: srv.name,
      description: srv.description,
      billing_type: srv.billing_type,
      unit_price: srv.default_price,
      quantity: 1,
      discount: 0,
      total_price: srv.default_price,
      milestone_description: srv.billing_type === 'PROJECT_50_50' ? 'Entrega/conclusão do serviço' : undefined,
      is_addition: true,
    };
    if (srv.slug.includes('chatbot')) setHasChatbotService(true);
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const next = [...items];
    const item = { ...next[index], [field]: value };
    item.total_price = Math.max(0, (item.unit_price * (item.quantity || 1)) - (item.discount || 0));
    next[index] = item;
    setItems(next);
  };

  const handleSaveContract = async (targetStatus: string = 'DRAFT') => {
    if (!clientId) {
      alert('Selecione um cliente para prosseguir.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client_id: clientId,
        template_type: templateType,
        status: targetStatus,
        platforms,
        landing_page_included: landingPageIncluded,
        creatives_included: creativesIncluded,
        dashboard_included: dashboardIncluded,
        crm_client_responsibility: crmClientResponsibility,
        technical_operational_autonomy: technicalOperationalAutonomy,
        portfolio_permission: portfolioPermission,
        portfolio_custom_text: portfolioCustomText,
        meeting_frequency: meetingFrequency,
        support_channels: supportChannels,
        support_hours: supportHours,
        media_budget_payer: 'CLIENT',
        media_budget_notes: mediaBudgetNotes,
        particularities,
        billing_type: items[0]?.billing_type || (templateType === 'POLITICAL' ? 'PROJECT_50_50' : 'MONTHLY_ARREARS'),
        due_day: Number(dueDay),
        term_months: Number(termMonths),
        notice_days: Number(noticeDays),
        early_termination_policy: earlyTerminationPolicy,
        early_termination_details: earlyTerminationDetails,
        estimated_media_budget: Number(estimatedMediaBudget),

        // Campos Eleitorais
        candidate_name: candidateName,
        candidate_number: candidateNumber,
        candidate_role: candidateRole,
        candidate_state: candidateState,
        party,
        federation_or_coalition: federationOrCoalition,
        campaign_cnpj: campaignCnpj,
        commercial_contractor_type: commercialContractorType,
        campaign_start_date: campaignStartDate,
        campaign_end_date: campaignEndDate,
        approval_responsible: approvalResponsible,
        financial_responsible: financialResponsible,
        electoral_lawyer: electoralLawyer,
        accounting_responsible: accountingResponsible,
        planned_media_budget: Number(plannedMediaBudget),
        media_payment_responsible: mediaPaymentResponsible,

        // Chatbot
        chatbot_type: chatbotType,
        chatbot_collects_personal_data: chatbotCollectsData,
        chatbot_uses_ai: chatbotUsesAi,
        chatbot_public_url: chatbotPublicUrl,
        chatbot_custom_scope: chatbotScopeNotes,

        // Compliance
        electoral_legal_review: electoralLegalReview,
        accounting_review: accountingReview,
        campaign_content_approval: campaignContentApproval,
        ai_used: aiUsed || chatbotUsesAi,
        personal_data_processed: personalDataProcessed || chatbotCollectsData,
        mass_messaging: massMessaging,
        synthetic_content_used: syntheticContentUsed,
        subcontracting_permitted: subcontractingPermitted,

        items,
      };

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/contracts/${created.id}/preview`);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar contrato.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de comunicação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Header
        title={templateType === 'POLITICAL' ? 'Novo Contrato: KAPEL Political' : 'Novo Contrato: KAPEL Performance'}
        subtitle="Configurador comercial determinístico com segregação estrita de honorários e mídia."
        breadcrumbs={[
          { label: 'Contratos', href: '/contracts' },
          { label: templateType === 'POLITICAL' ? 'KAPEL Political' : 'KAPEL Performance' },
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configurator Area (2 Colunas) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selector Pills */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Modelo de Contrato:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateType('PERFORMANCE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      templateType === 'PERFORMANCE'
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                        : 'bg-[#131c2e] text-slate-400 hover:text-white'
                    }`}
                  >
                    KAPEL Performance
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('POLITICAL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      templateType === 'POLITICAL'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20'
                        : 'bg-[#131c2e] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Vote className="w-3.5 h-3.5" />
                    <span>KAPEL Political</span>
                  </button>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                {templateType === 'POLITICAL' ? 'Regras Eleitorais / TSE' : 'Contrato Comercial Padrão'}
              </span>
            </div>

            {/* Step Wizard Nav */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-3 shadow-lg flex items-center justify-between text-xs overflow-x-auto">
              <button
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  step === 1
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1. {templateType === 'POLITICAL' ? 'Candidatura & Cliente' : 'Cliente'}</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

              <button
                onClick={() => setStep(2)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  step === 2
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>2. Serviços & Marcos</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

              <button
                onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  step === 3
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>3. {templateType === 'POLITICAL' ? 'Mídia & Compliance' : 'Escopo & Governança'}</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

              <button
                onClick={() => setStep(4)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  step === 4
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>4. Condições Finais</span>
              </button>
            </div>

            {/* ETAPA 1: CLIENTE E/OU DADOS ELEITORAIS */}
            {step === 1 && (
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
                  <div>
                    <h2 className="text-base font-bold text-white font-display">
                      {templateType === 'POLITICAL' ? 'Etapa 1: Contratante & Dados da Campanha' : 'Etapa 1: Seleção do Cliente'}
                    </h2>
                    <p className="text-xs text-slate-400">Qualificação completa para emissão do contrato</p>
                  </div>
                  <Link
                    href="/clients"
                    className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Cadastro</span>
                  </Link>
                </div>

                {/* Seleção do Cliente / Agência */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {templateType === 'POLITICAL' ? 'Agência ou Contratante Formal *' : 'Cliente Contratante *'}
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#131c2e] border border-[#1e293b] rounded-xl text-sm text-white focus:border-emerald-500/50"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.trade_name ? `${c.trade_name} (${c.legal_name})` : c.legal_name} - {c.type}: {c.document}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Se for Template Political, exibe bloco de dados de candidatura */}
                {templateType === 'POLITICAL' && (
                  <div className="p-4 rounded-xl bg-[#131c2e] border border-amber-500/30 space-y-4 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Vote className="w-4 h-4" />
                      <span>Dados Eleitorais da Candidatura</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Nome do(a) Candidato(a) *</label>
                        <input
                          type="text"
                          required
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="Ex: Ademir José da Silva"
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Número de Urna *</label>
                        <input
                          type="text"
                          value={candidateNumber}
                          onChange={(e) => setCandidateNumber(e.target.value)}
                          placeholder="Ex: 15"
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Cargo Concorrido *</label>
                        <input
                          type="text"
                          value={candidateRole}
                          onChange={(e) => setCandidateRole(e.target.value)}
                          placeholder="Ex: Prefeito, Vereador"
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Partido *</label>
                        <input
                          type="text"
                          value={party}
                          onChange={(e) => setParty(e.target.value)}
                          placeholder="Ex: MDB"
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Coligação ou Federação</label>
                        <input
                          type="text"
                          value={federationOrCoalition}
                          onChange={(e) => setFederationOrCoalition(e.target.value)}
                          placeholder="Ex: Coligação Pra Frente SP"
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">CNPJ de Campanha *</label>
                        <input
                          type="text"
                          value={campaignCnpj}
                          onChange={(e) => setCampaignCnpj(e.target.value)}
                          placeholder="00.000.000/0001-00"
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Data Início da Campanha</label>
                        <input
                          type="date"
                          value={campaignStartDate}
                          onChange={(e) => setCampaignStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Data Fim da Campanha</label>
                        <input
                          type="date"
                          value={campaignEndDate}
                          onChange={(e) => setCampaignEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1e293b]">
                      <div>
                        <label className="block text-slate-400 mb-1">Advogado(a) Eleitoral Responsável</label>
                        <input
                          type="text"
                          value={electoralLawyer}
                          onChange={(e) => setElectoralLawyer(e.target.value)}
                          placeholder="Nome e OAB"
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Contabilidade Eleitoral (Prestação de Contas)</label>
                        <input
                          type="text"
                          value={accountingResponsible}
                          onChange={(e) => setAccountingResponsible(e.target.value)}
                          placeholder="Escritório ou Contador"
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    <span>Avançar para Serviços</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: SERVIÇOS & MARCOS INDEPENDENTES */}
            {step === 2 && (
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="pb-4 border-b border-[#1e293b]">
                  <h2 className="text-base font-bold text-white font-display">Etapa 2: Serviços & Marcos Jurídicos Independentes</h2>
                  <p className="text-xs text-slate-400">Cada serviço possui seu próprio valor, tipo de cobrança e marco de entrega</p>
                </div>

                {/* Plataformas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Plataformas de Anúncios Homologadas
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availablePlatforms.map((p) => {
                      const isSelected = platforms.includes(p);
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => togglePlatform(p)}
                          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                              : 'bg-[#131c2e] border-[#1e293b] text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span>{p}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Serviços Contratados */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Serviços Contratados (Honorários KAPEL)
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddItemFromService(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-1.5 bg-[#131c2e] border border-[#1e293b] rounded-xl text-xs text-emerald-400 focus:border-emerald-500/50 cursor-pointer"
                    >
                      <option value="">+ Adicionar do Catálogo...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({BILLING_TYPE_LABELS[s.billing_type] || s.billing_type}) - {formatCurrency(s.default_price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#131c2e] border border-[#1e293b] space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                            className="font-semibold text-white bg-transparent border-b border-transparent hover:border-[#1e293b] focus:border-emerald-500 focus:outline-none w-full text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-400 mb-1">Modelo de Cobrança</label>
                            <select
                              value={item.billing_type}
                              onChange={(e) => handleUpdateItem(idx, 'billing_type', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded-lg text-white"
                            >
                              {Object.entries(BILLING_TYPE_LABELS).map(([k, label]) => (
                                <option key={k} value={k}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Valor do Serviço (R$)</label>
                            <input
                              type="number"
                              step="100"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded-lg text-white font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Duração / Prazo (Dias)</label>
                            <input
                              type="number"
                              min="1"
                              value={item.duration_days || ''}
                              onChange={(e) => handleUpdateItem(idx, 'duration_days', parseInt(e.target.value) || null)}
                              placeholder="Ex: 45 dias"
                              className="w-full px-2.5 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded-lg text-white"
                            />
                          </div>
                        </div>

                        {/* Marco do Segundo Pagamento para 50/50 */}
                        {item.billing_type === 'PROJECT_50_50' && (
                          <div className="p-3 rounded-lg bg-[#0f172a] border border-[#1e293b] space-y-2">
                            <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                              <span>Condição 50/50: 50% Entrada ({formatCurrency(item.total_price * 0.5)}) + 50% no Marco ({formatCurrency(item.total_price * 0.5)})</span>
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1 text-[11px]">
                                Marco Jurídico do Segundo Pagamento:
                              </label>
                              <input
                                type="text"
                                value={item.milestone_description || ''}
                                onChange={(e) => handleUpdateItem(idx, 'milestone_description', e.target.value)}
                                placeholder="Ex: Último dia do período contratado de campanha / Entrega do chatbot"
                                className="w-full px-2.5 py-1.5 bg-[#131c2e] border border-[#1e293b] rounded-lg text-white text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    <span>Avançar para Mídia & Compliance</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: MÍDIA INFORMATIVA, CHATBOT & COMPLIANCE */}
            {step === 3 && (
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="pb-4 border-b border-[#1e293b]">
                  <h2 className="text-base font-bold text-white font-display">
                    Etapa 3: Orçamento de Mídia, Chatbot & Compliance
                  </h2>
                  <p className="text-xs text-slate-400">Verba de anúncios, parametrização de chatbot e conformidade jurídica</p>
                </div>

                {/* Bloco de Mídia Eleitoral / Publicitária (SOMENTE INFORMATIVO) */}
                <div className="p-4 rounded-xl bg-[#131c2e] border border-cyan-500/30 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <Info className="w-4 h-4" />
                    <span>Orçamento de Mídia Planejado — SOMENTE INFORMATIVO</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Este valor é pago <strong>DIRETAMENTE</strong> pelo contratante/campanha às plataformas de anúncios (Meta Ads, Google Ads). <strong>NÃO integra os honorários, o faturamento ou o MRR da KAPEL.</strong>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Verba Estimada de Mídia (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={templateType === 'POLITICAL' ? plannedMediaBudget : estimatedMediaBudget}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (templateType === 'POLITICAL') setPlannedMediaBudget(val);
                          else setEstimatedMediaBudget(val);
                        }}
                        className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Responsável pelo Pagamento</label>
                      <select
                        value={mediaPaymentResponsible}
                        onChange={(e) => setMediaPaymentResponsible(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                      >
                        <option value="CAMPAIGN">Conta Bancária Oficial da Campanha (CNPJ)</option>
                        <option value="CANDIDATE">Candidato(a)</option>
                        <option value="PARTY">Partido / Diretório</option>
                        <option value="FEDERATION">Federação / Coligação</option>
                        <option value="AUTHORIZED_FINANCIAL_RESPONSIBLE">Responsável Financeiro Autorizado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bloco de Chatbot */}
                <div className="p-4 rounded-xl bg-[#131c2e] border border-[#1e293b] space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-200">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      <span>Configurações do Chatbot Informativo</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={hasChatbotService}
                        onChange={(e) => setHasChatbotService(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  {hasChatbotService && (
                    <div className="space-y-3 pt-2 border-t border-[#1e293b]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Tipo de Chatbot</label>
                          <select
                            value={chatbotType}
                            onChange={(e) => setChatbotType(e.target.value as ChatbotType)}
                            className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                          >
                            <option value="KNOWLEDGE_BASE">Base de Conhecimento Estruturada</option>
                            <option value="RULE_BASED">Baseado em Regras e Menus</option>
                            <option value="GENERATIVE_AI">IA Generativa (com Rotulagem TSE)</option>
                            <option value="CUSTOM">Personalizado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Link de Atendimento Público</label>
                          <input
                            type="text"
                            value={chatbotPublicUrl}
                            onChange={(e) => setChatbotPublicUrl(e.target.value)}
                            placeholder="https://wa.me/5511..."
                            className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={chatbotUsesAi}
                            onChange={(e) => {
                              setChatbotUsesAi(e.target.checked);
                              if (e.target.checked) setAiUsed(true);
                            }}
                            className="accent-emerald-500"
                          />
                          <span>Utiliza Inteligência Artificial</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={chatbotCollectsData}
                            onChange={(e) => {
                              setChatbotCollectsData(e.target.checked);
                              if (e.target.checked) setPersonalDataProcessed(true);
                            }}
                            className="accent-emerald-500"
                          />
                          <span>Coleta Dados Pessoais de Eleitores (LGPD)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seção Visual de Compliance Eleitoral */}
                <div className="p-4 rounded-xl bg-[#131c2e] border border-[#1e293b] space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Compliance e Alertas Regulatórios</span>
                  </div>

                  {/* Alertas Informativos Visuais */}
                  {aiUsed && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Alerta IA:</strong> Revisão eleitoral necessária para uso de IA e rotulagem transparente obrigatória perante o TSE.</span>
                    </div>
                  )}

                  {personalDataProcessed && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-2 text-blue-300">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Alerta LGPD:</strong> Definir responsabilidades de tratamento de dados e termos de consentimento voluntário.</span>
                    </div>
                  )}

                  {massMessaging && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Alerta de Disparo em Massa:</strong> Proibido envio massivo não consentido pela legislação eleitoral.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Revisão Jurídica Eleitoral</label>
                      <select
                        value={electoralLegalReview}
                        onChange={(e) => setElectoralLegalReview(e.target.value as ComplianceReviewStatus)}
                        className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded-lg text-white"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="APPROVED">Aprovada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Revisão Contábil de Campanha</label>
                      <select
                        value={accountingReview}
                        onChange={(e) => setAccountingReview(e.target.value as ComplianceReviewStatus)}
                        className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded-lg text-white"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="APPROVED">Aprovada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Aprovação de Conteúdo</label>
                      <select
                        value={campaignContentApproval}
                        onChange={(e) => setCampaignContentApproval(e.target.value as ComplianceReviewStatus)}
                        className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded-lg text-white"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="APPROVED">Aprovada</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subcontratação Autorizada */}
                <div className="p-4 rounded-xl bg-[#131c2e] border border-[#1e293b] flex items-start justify-between gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">Subcontratação e Equipe Técnica da KAPEL</p>
                    <p className="text-slate-400 mt-0.5 text-[11px]">
                      Permite que a KAPEL utilize equipe própria, colaboradores e especialistas sob sua coordenação sem necessidade de listá-los nominalmente no contrato.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={subcontractingPermitted}
                      onChange={(e) => setSubcontractingPermitted(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Particularidades */}
                <div>
                  <label className="block text-slate-400 mb-1 text-xs font-semibold">
                    Particularidades e Observações Específicas
                  </label>
                  <textarea
                    rows={3}
                    value={particularities}
                    onChange={(e) => setParticularities(e.target.value)}
                    placeholder="Condições comerciais complementares acordadas..."
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white text-xs focus:border-emerald-500/50"
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    <span>Avançar para Condições Finais</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 4: CONDIÇÕES FINAIS & RESUMO */}
            {step === 4 && (
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="pb-4 border-b border-[#1e293b]">
                  <h2 className="text-base font-bold text-white font-display">Etapa 4: Finalização & Salvar Contrato</h2>
                  <p className="text-xs text-slate-400">Verifique os valores consolidados antes de gerar o preview do documento</p>
                </div>

                <div className="p-4 rounded-xl bg-[#131c2e] border border-[#1e293b] space-y-3 text-xs">
                  <p className="font-bold text-slate-200">Resumo da Estrutura Comercial:</p>
                  <div className="space-y-1.5 text-slate-300">
                    <p>• <strong>Modelo:</strong> {templateType === 'POLITICAL' ? 'KAPEL Political (Campanha Eleitoral)' : 'KAPEL Performance'}</p>
                    <p>• <strong>Contratante:</strong> {selectedClient?.trade_name || selectedClient?.legal_name}</p>
                    {templateType === 'POLITICAL' && (
                      <p>• <strong>Candidatura:</strong> {candidateName} ({candidateRole} - nº {candidateNumber} / {party})</p>
                    )}
                    <p>• <strong>Honorários Totais KAPEL:</strong> {formatCurrency(financials.total_service_value || (financials.initial_payment + financials.future_milestones))}</p>
                    <p>• <strong>Entrada / Inicial:</strong> {formatCurrency(financials.initial_payment)}</p>
                    <p>• <strong>Pagamentos Futuros por Marcos:</strong> {formatCurrency(financials.future_milestones)}</p>
                    <p>• <strong>Orçamento de Mídia (Informativo):</strong> {formatCurrency(financials.media_budget_informative)}</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveContract('DRAFT')}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
                    >
                      Salvar como Rascunho
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveContract('FINALIZED')}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Visualizar Contrato A4</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Live Summary Sidebar (Fixo no Desktop) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white font-display text-sm">Honorários KAPEL</h3>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Tempo Real
                </span>
              </div>

              {/* Total dos Serviços KAPEL */}
              <div className="p-4 rounded-xl bg-[#131c2e] border border-[#1e293b]">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total dos Serviços KAPEL
                </span>
                <span className="text-2xl font-bold text-emerald-400 font-display block mt-1">
                  {formatCurrency(financials.total_service_value || (financials.initial_payment + financials.future_milestones))}
                </span>
              </div>

              {/* Grid: Inicial e Futuros */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#131c2e] border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 block font-medium">Pagamento Inicial</span>
                  <span className="text-sm font-bold text-white font-display block mt-1">
                    {formatCurrency(financials.initial_payment)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#131c2e] border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 block font-medium">Pagamentos Futuros</span>
                  <span className="text-sm font-bold text-cyan-400 font-display block mt-1">
                    {formatCurrency(financials.future_milestones)}
                  </span>
                </div>
              </div>

              {/* Discriminação dos Marcos Futuros */}
              {financials.future_milestone_items && financials.future_milestone_items.length > 0 && (
                <div className="p-3 rounded-xl bg-[#131c2e] border border-[#1e293b] text-[11px] space-y-2">
                  <span className="font-bold text-slate-300 block">Marcos Futuros Discriminados:</span>
                  {financials.future_milestone_items.map((m, i) => (
                    <div key={i} className="space-y-0.5 pb-1 border-b border-[#1e293b] last:border-0">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span className="truncate pr-2">{m.service_name}</span>
                        <span className="text-cyan-400">{formatCurrency(m.amount)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">Marco: {m.milestone_description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Orçamento de Mídia Informativo */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Orçamento de Mídia:</span>
                  <span className="font-bold text-cyan-300 font-display">
                    {formatCurrency(financials.media_budget_informative)}
                  </span>
                </div>
                <p className="text-[10px] text-cyan-400/80">
                  (Informativo — Não integra a remuneração da KAPEL)
                </p>
              </div>

              {/* MRR se houver */}
              {financials.recurrent_mrr > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Recorrência Mensal:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(financials.recurrent_mrr)}/mês</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleSaveContract('FINALIZED')}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Visualizar Contrato A4</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function NewContractPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Carregando configurador de contrato...</div>}>
      <NewContractForm />
    </Suspense>
  );
}
