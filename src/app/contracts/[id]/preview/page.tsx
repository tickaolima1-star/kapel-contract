'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import {
  FileText,
  Printer,
  Edit,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  Save,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  Vote,
} from 'lucide-react';
import { buildDeterministicContractClauses, interpolateVariables } from '@/lib/engine/clauses';
import { calculateContractFinancials } from '@/lib/engine/financial';
import { formatCurrency, formatDateBR, formatDocument, CONTRACT_STATUS_LABELS } from '@/lib/utils';
import { ResolvedClause } from '@/lib/types';
import { KapelSignModal } from '@/components/KapelSignModal';

export default function ContractPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const [data, setData] = useState<{ contract: any; company: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [editingClause, setEditingClause] = useState<ResolvedClause | null>(null);
  const [clauseText, setClauseText] = useState('');
  const [clauseTitle, setClauseTitle] = useState('');

  const loadContract = async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, [contractId]);

  // Montagem determinística das cláusulas
  const resolvedClauses = useMemo<ResolvedClause[]>(() => {
    if (!data?.contract || !data?.company) return [];

    const { contract, company } = data;
    const customClauses = contract.custom_clauses ? JSON.parse(contract.custom_clauses) : {};

    const items = contract.items?.map((item: any) => ({
      name: item.name,
      description: item.description,
      billing_type: item.billing_type,
      unit_price: item.unit_price,
      quantity: item.quantity,
      discount: item.discount,
      total_price: item.total_price,
      milestone_description: item.milestone_description,
      duration_days: item.duration_days,
      is_addition: item.is_addition,
    })) || [];

    const mediaVal = contract.planned_media_budget || contract.estimated_media_budget || 0;
    const financials = calculateContractFinancials(items, mediaVal);

    return buildDeterministicContractClauses({
      company,
      client: contract.client,
      config: {
        client_id: contract.client_id,
        template_type: contract.template?.type || 'PERFORMANCE',
        platforms: contract.platforms,
        landing_page_included: contract.landing_page_included,
        creatives_included: contract.creatives_included,
        dashboard_included: contract.dashboard_included,
        crm_client_responsibility: contract.crm_client_responsibility,
        technical_operational_autonomy: contract.technical_operational_autonomy,
        portfolio_permission: contract.portfolio_permission,
        portfolio_custom_text: contract.portfolio_custom_text,
        meeting_frequency: contract.meeting_frequency,
        support_channels: contract.support_channels,
        support_hours: contract.support_hours,
        media_budget_payer: contract.media_budget_payer,
        media_budget_notes: contract.media_budget_notes,
        particularities: contract.particularities,
        billing_type: contract.billing_type,
        due_day: contract.due_day,
        term_months: contract.term_months,
        notice_days: contract.notice_days,
        early_termination_policy: contract.early_termination_policy,
        early_termination_details: contract.early_termination_details,
        estimated_media_budget: contract.estimated_media_budget,

        // Campos Eleitorais
        candidate_name: contract.candidate_name,
        candidate_number: contract.candidate_number,
        candidate_role: contract.candidate_role,
        candidate_state: contract.candidate_state,
        party: contract.party,
        federation_or_coalition: contract.federation_or_coalition,
        campaign_cnpj: contract.campaign_cnpj,
        commercial_contractor_type: contract.commercial_contractor_type,
        campaign_start_date: contract.campaign_start_date,
        campaign_end_date: contract.campaign_end_date,
        approval_responsible: contract.approval_responsible,
        financial_responsible: contract.financial_responsible,
        electoral_lawyer: contract.electoral_lawyer,
        accounting_responsible: contract.accounting_responsible,
        planned_media_budget: contract.planned_media_budget,
        media_payment_responsible: contract.media_payment_responsible,
        chatbot_type: contract.chatbot_type,
        chatbot_collects_personal_data: contract.chatbot_collects_personal_data,
        chatbot_uses_ai: contract.chatbot_uses_ai,
        chatbot_public_url: contract.chatbot_public_url,
        chatbot_custom_scope: contract.chatbot_custom_scope,
        electoral_legal_review: contract.electoral_legal_review,
        accounting_review: contract.accounting_review,
        campaign_content_approval: contract.campaign_content_approval,
        ai_used: contract.ai_used,
        personal_data_processed: contract.personal_data_processed,
        mass_messaging: contract.mass_messaging,
        synthetic_content_used: contract.synthetic_content_used,
        subcontracting_permitted: contract.subcontracting_permitted,
        subcontracting_clause_text: contract.subcontracting_clause_text,

        items,
        custom_clauses: customClauses,
      },
      financials,
      contractNumber: contract.contract_number,
    });
  }, [data]);

  const handlePrint = () => {
    window.print();
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const duplicated = await res.json();
        router.push(`/contracts/${duplicated.id}/preview`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data?.contract,
          status: newStatus,
          items: data?.contract.items,
        }),
      });
      if (res.ok) {
        await loadContract();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveCustomClause = async () => {
    if (!editingClause || !data?.contract) return;

    try {
      const existingCustom = data.contract.custom_clauses
        ? JSON.parse(data.contract.custom_clauses)
        : {};

      existingCustom[editingClause.code] = {
        title: clauseTitle,
        content: clauseText,
        is_custom: true,
      };

      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data.contract,
          custom_clauses: existingCustom,
          items: data.contract.items,
        }),
      });

      if (res.ok) {
        setEditingClause(null);
        await loadContract();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-[#AEB4AE]">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const { contract, company } = data;
  const isPolitical = contract.template?.type === 'POLITICAL';

  return (
    <AdminLayout>
      {/* Top Action Bar */}
      <div className="no-print mb-8">
        <Header
          title={`Contrato #${contract.contract_number} ${isPolitical ? '(KAPEL Political)' : ''}`}
          subtitle={`Cliente: ${contract.client?.trade_name || contract.client?.legal_name}`}
          breadcrumbs={[
            { label: 'Contratos', href: '/contracts' },
            { label: `#${contract.contract_number}` },
          ]}
          actions={
            <div className="flex items-center gap-3">
              {/* Status Badge & Selector */}
              <select
                value={contract.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={savingStatus}
                className="px-3 py-2 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded text-xs font-semibold text-white focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="DRAFT">Rascunho</option>
                <option value="READY">Pronto</option>
                <option value="FINALIZED">Finalizado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>

              {/* Botão de Assinatura Eletrônica Nativa */}
              {contract.signature_status === 'SIGNED' ? (
                <a
                  href={`/verify/${contract.audit_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1C2E24]/20 hover:bg-[#1C2E24]/30 text-[#44755A] border border-emerald-500/40 font-semibold text-xs transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>KAPEL VERIFIED</span>
                </a>
              ) : contract.signature_status === 'PENDING_CLIENT' ? (
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1C2E24]/20 hover:bg-[#1C2E24]/30 text-[#AEB4AE] border border-[#335943]/40 font-semibold text-xs transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Link do Cliente</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1C2E24] hover:bg-[#263F31] text-white font-semibold text-xs shadow-lg shadow-[#1C2E24]/20 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Assinar como KAPEL</span>
                </button>
              )}

              {/* Botão Duplicar */}
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#0A0A0A] hover:bg-[rgba(242,242,237,0.1)] text-[#D7D8D0] border border-[rgba(242,242,237,0.1)] font-medium text-xs transition-colors"
                title="Duplicar este contrato"
              >
                <Copy className="w-4 h-4 text-[#AEB4AE]" />
                <span>Duplicar</span>
              </button>

              {/* Botão Imprimir / Salvar PDF */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2 rounded bg-[#1C2E24] hover:bg-[#263F31] text-black font-semibold text-xs shadow-lg shadow-[#1C2E24]/20 transition-all"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>Exportar PDF / Imprimir</span>
              </button>
            </div>
          }
        />

        {/* Modal de Assinatura KAPEL */}
        <KapelSignModal
          contractId={contractId}
          contractNumber={contract.contract_number}
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onSuccess={async () => {
            await loadContract();
          }}
          defaultRepName={company?.legal_representative}
          defaultCnpj={company?.cnpj}
        />
      </div>

      {/* A4 Document Paper Container (Mobile Scrollable) */}
      <div className="w-full overflow-x-auto pb-16 flex justify-start lg:justify-center px-2">
        <div className="a4-document border border-slate-300 rounded-sm shrink-0">
          {/* Document Header Timbrado */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <h1 className="text-base font-bold uppercase tracking-wide text-slate-950 font-serif">
              {isPolitical
                ? 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ESTRATÉGIA DIGITAL E TRÁFEGO ELEITORAL'
                : 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTELIGÊNCIA COMERCIAL E PERFORMANCE DIGITAL'}
            </h1>
            <p className="text-[10pt] text-[#8E948E] mt-1 font-serif">
              Instrumento Particular de Prestação de Serviços nº {contract.contract_number}
            </p>
          </div>

          {/* Qualificação das Partes */}
          <div className="mb-6 space-y-3 text-[10.5pt] leading-relaxed text-justify font-serif">
            <p>
              Pelo presente instrumento particular, de um lado:
            </p>

            <p>
              <strong>CONTRATADA: {company.legal_name}</strong> (nome comercial <strong>{company.trade_name}</strong>), inscrita no CNPJ sob o nº <strong>{company.cnpj}</strong>, com sede em {company.address}, {company.neighborhood}, CEP {company.zip_code}, {company.city}/{company.state}, neste ato representada por seu titular, <strong>{company.legal_representative}</strong>, inscrito no CPF sob o nº {company.rep_cpf}; e, de outro lado,
            </p>

            <p>
              <strong>CONTRATANTE: {contract.client.legal_name}</strong>{contract.client.trade_name ? ` (${contract.client.trade_name})` : ''}, inscrita no {contract.client.type === 'PJ' ? 'CNPJ' : 'CPF'} sob o nº <strong>{formatDocument(contract.client.document)}</strong>{contract.client.state_registration ? `, Inscrição Estadual nº ${contract.client.state_registration}` : ''}, com sede/domicílio em {contract.client.address ? `${contract.client.address}${contract.client.address_number ? `, nº ${contract.client.address_number}` : ''}${contract.client.neighborhood ? `, ${contract.client.neighborhood}` : ''}, CEP ${contract.client.zip_code || ''}, ${contract.client.city || ''}/${contract.client.state || ''}` : 'endereço constante no cadastro'}, {contract.client.representative_name ? `neste ato representada por seu ${contract.client.representative_role || 'Representante Legal'}, ${contract.client.representative_name}, inscrito no CPF sob o nº ${formatDocument(contract.client.representative_cpf)}` : 'representada na forma de seus atos constitutivos'}{isPolitical && contract.candidate_name ? `, atuando em benefício da campanha eleitoral do(a) candidato(a) ${contract.candidate_name}, cargo de ${contract.candidate_role || 'Prefeito'} (nº ${contract.candidate_number || '00'}), ${contract.party ? `filiado ao ${contract.party}` : ''}${contract.federation_or_coalition ? `, ${contract.federation_or_coalition}` : ''}, sob o CNPJ de Campanha nº ${contract.campaign_cnpj || '00.000.000/0001-00'}` : ''};
            </p>

            <p>
              Têm entre si, justo e acordado, o presente Contrato de Prestação de Serviços, que se regerá mediante as seguintes cláusulas e condições:
            </p>
          </div>

          {/* Cláusulas Contratuais ou Conteúdo Exato Importado (.docx) */}
          {contract.is_imported && contract.imported_body ? (
            <div
              className="imported-docx-content space-y-4 text-[10.5pt] leading-relaxed text-justify font-serif text-slate-900 border-t border-b border-slate-200 py-6 my-6"
              dangerouslySetInnerHTML={{ __html: contract.imported_body }}
            />
          ) : (
            <div className="space-y-5 text-[10.5pt] leading-relaxed text-justify font-serif">
              {resolvedClauses.map((clause) => (
                <div key={clause.code} className="group relative">
                  {/* Visual badge para cláusula personalizada (oculta no PDF) */}
                  {clause.is_custom && (
                    <span className="no-print inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-sans font-bold bg-amber-100 text-amber-800 border border-amber-300 mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      Cláusula personalizada
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-900 uppercase tracking-wide text-[10.5pt]">
                      CLÁUSULA {clause.number}ª – {clause.title}
                    </h2>

                    <button
                      onClick={() => {
                        setEditingClause(clause);
                        setClauseTitle(clause.title);
                        setClauseText(clause.content);
                      }}
                      className="no-print opacity-0 group-hover:opacity-100 p-1 text-[#8E948E] hover:text-emerald-600 transition-opacity"
                      title="Personalizar esta cláusula"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="whitespace-pre-line text-slate-800 mt-1">
                    {clause.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fechamento e Assinaturas */}
          <div className="mt-10 pt-6 text-[10.5pt] leading-relaxed font-serif">
            <p className="text-justify mb-8">
              E, por estarem assim justas e contratadas, as partes assinam o presente instrumento por meio de plataforma eletrônica ou física, em conformidade com a legislação vigente.
            </p>

            <p className="text-right mb-12">
              {company.jurisdiction_city} - {company.jurisdiction_state}, {formatDateBR(contract.created_at)}.
            </p>

            {/* Linhas de Assinatura */}
            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="text-center">
                <div className="border-t border-slate-900 pt-2 font-serif text-[10pt]">
                  <p className="font-bold">{company.legal_name}</p>
                  <p className="text-[9pt] text-[#8E948E]">Representante: {company.legal_representative}</p>
                  <p className="text-[9pt] text-[#8E948E]">CONTRATADA (KAPEL)</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t border-slate-900 pt-2 font-serif text-[10pt]">
                  <p className="font-bold">{contract.client.legal_name}</p>
                  <p className="text-[9pt] text-[#8E948E]">
                    {contract.client.representative_name || 'Representante Legal'}
                  </p>
                  <p className="text-[9pt] text-[#8E948E]">CONTRATANTE</p>
                </div>
              </div>
            </div>

            {/* Testemunhas */}
            <div className="grid grid-cols-2 gap-12 pt-10 text-[9pt] text-[#8E948E]">
              <div>
                <div className="border-t border-slate-400 pt-1">
                  <p>Testemunha 1: _______________________________</p>
                  <p>CPF:</p>
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1">
                  <p>Testemunha 2: _______________________________</p>
                  <p>CPF:</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição Controlada de Cláusula */}
      {editingClause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm no-print">
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded w-full max-w-2xl shadow-2xl p-6 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(242,242,237,0.1)] mb-4">
              <div>
                <h3 className="text-base font-bold text-white font-display">Personalizar Cláusula</h3>
                <p className="text-[#AEB4AE]">Esta alteração afetará apenas este contrato e será registrada em auditoria.</p>
              </div>
              <button
                onClick={() => setEditingClause(null)}
                className="p-1 rounded text-[#AEB4AE] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[#AEB4AE] mb-1">Título da Cláusula</label>
                <input
                  type="text"
                  value={clauseTitle}
                  onChange={(e) => setClauseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#AEB4AE] mb-1">Texto Jurídico da Cláusula</label>
                <textarea
                  rows={8}
                  value={clauseText}
                  onChange={(e) => setClauseText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded text-white font-mono leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-[rgba(242,242,237,0.1)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingClause(null)}
                  className="px-4 py-2 rounded text-[#AEB4AE] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomClause}
                  className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#1C2E24] hover:bg-[#263F31] text-black font-semibold shadow-lg shadow-[#1C2E24]/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Personalização</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
