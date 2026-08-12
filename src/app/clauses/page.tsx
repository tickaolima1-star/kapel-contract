'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { FileCode2, Shield, Lock, CheckCircle2, Layers } from 'lucide-react';

export default function ClausesPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const baseClauses = [
    {
      code: 'OBJECT_AND_SCOPE',
      title: 'Do Objeto e do Escopo dos Serviços',
      category: 'ESCOPO',
      description: 'Define as obrigações principais de inteligência comercial, gestão de tráfego pago e canais de veiculação.',
    },
    {
      code: 'LANDING_PAGE_EXCLUDED',
      title: 'Da Exclusão de Desenvolvimento de Landing Pages',
      category: 'ESCOPO',
      description: 'Regra condicional quando landing_page_included = false. Fixa responsabilidade das páginas no cliente.',
    },
    {
      code: 'LANDING_PAGE_INCLUDED',
      title: 'Do Desenvolvimento de Landing Page',
      category: 'ESCOPO',
      description: 'Regra condicional quando landing_page_included = true. Regula entrega e validação de páginas.',
    },
    {
      code: 'CREATIVES_EXCLUDED',
      title: 'Do Fornecimento de Criativos e Materiais Visuais',
      category: 'ESCOPO',
      description: 'Regra condicional quando creatives_included = false. Determina fornecimento de fotos/vídeos pelo Contratante.',
    },
    {
      code: 'OPERATIONAL_AUTONOMY',
      title: 'Da Autonomia Operacional e Otimização Técnica',
      category: 'GOVERNANCA',
      description: 'Garante agilidade para a KAPEL otimizar lances, públicos e pausar anúncios sem violar o orçamento aprovado.',
    },
    {
      code: 'MEDIA_BUDGET',
      title: 'Do Investimento em Mídia Publicitária',
      category: 'FINANCEIRO',
      description: 'Isola expressamente os pagamentos de anúncios do faturamento da KAPEL (pago diretamente às plataformas).',
    },
    {
      code: 'PAYMENT_CONDITIONS',
      title: 'Da Remuneração e Forma de Pagamento',
      category: 'FINANCEIRO',
      description: 'Interpola Fee Recorrente, Pagamento Inicial, 50/50, Vencimento, Multa de 2% e juros moratórios.',
    },
    {
      code: 'NO_RESULT_GUARANTEE',
      title: 'Da Natureza da Obrigação e Ausência de Garantia de Resultados',
      category: 'JURIDICO',
      description: 'Classifica a obrigação como de meio e técnica diligente e não de resultado financeiro fixo.',
    },
    {
      code: 'COMMUNICATION_AND_SUPPORT',
      title: 'Da Comunicação, Reuniões e Horários de Atendimento',
      category: 'GOVERNANCA',
      description: 'Regula reuniões mensais, canais e horário de expediente (08h às 18h) sem SLA instantâneo.',
    },
    {
      code: 'PORTFOLIO_ALLOW',
      title: 'Da Divulgação de Portfólio e Cases de Sucesso',
      category: 'JURIDICO',
      description: 'Autoriza menção à marca em cases comerciais preservando segredos industriais e dados confidenciais.',
    },
    {
      code: 'TERM_AND_TERMINATION',
      title: 'Da Vigência, Aviso Prévio e Rescisão',
      category: 'JURIDICO',
      description: 'Determina período de vigência mínima, renovação automática e política de rescisão antecipada.',
    },
    {
      code: 'LGPD_CONFIDENTIALITY',
      title: 'Da Confidencialidade e Proteção de Dados (LGPD)',
      category: 'JURIDICO',
      description: 'Regras de compliance com a Lei 13.709/2018 e dever de sigilo de informações estratégicas.',
    },
    {
      code: 'SIGNATURE_AND_JURISDICTION',
      title: 'Da Assinatura Eletrônica e Foro de Eleição',
      category: 'JURIDICO',
      description: 'Validade jurídica conforme MP 2.200-2/2001 e eleição da Comarca da sede da KAPEL.',
    },
  ];

  const filtered = selectedCategory === 'ALL'
    ? baseClauses
    : baseClauses.filter((c) => c.category === selectedCategory);

  return (
    <AdminLayout>
      <Header
        title="Motor de Cláusulas Jurídicas"
        subtitle="Blocos modulares determinísticos utilizados para composição automatizada dos contratos."
      />

      <div className="flex gap-2 mb-6">
        {['ALL', 'ESCOPO', 'FINANCEIRO', 'GOVERNANCA', 'JURIDICO'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#0f172a] text-slate-400 border border-[#1e293b] hover:bg-[#131c2e]'
            }`}
          >
            {cat === 'ALL' ? 'Todas as Cláusulas' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((clause) => (
          <div
            key={clause.code}
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  {clause.code}
                </span>
                <h3 className="font-bold text-slate-100 text-sm mt-2">{clause.title}</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase bg-[#131c2e] px-2 py-1 rounded border border-[#1e293b]">
                {clause.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{clause.description}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
