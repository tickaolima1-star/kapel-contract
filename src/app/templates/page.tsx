'use client';

import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { Layers, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export default function TemplatesPage() {
  const templates = [
    {
      id: 'template-perf-v1',
      name: 'Contrato Padrão KAPEL Performance',
      type: 'PERFORMANCE',
      version: '1.0',
      status: 'ATIVO',
      description: 'Template determinístico para serviços de gestão de tráfego, aquisição de clientes, mídia paga e governança técnica.',
      clauses_count: 13,
    },
    {
      id: 'template-studio',
      name: 'Contrato KAPEL Studio',
      type: 'STUDIO',
      version: '1.0',
      status: 'PREPARADO',
      description: 'Template voltado para desenvolvimento de landing pages, identidade visual, criativos e produção de conteúdo.',
      clauses_count: 10,
    },
    {
      id: 'template-consulting',
      name: 'Contrato KAPEL Consulting',
      type: 'CONSULTING',
      version: '1.0',
      status: 'PREPARADO',
      description: 'Template para consultoria estratégica de negócios, diagnóstico de canais e inteligência comercial executiva.',
      clauses_count: 9,
    },
    {
      id: 'template-political',
      name: 'Contrato Eleitoral / Político',
      type: 'POLITICAL',
      version: '1.0',
      status: 'ISOLADO',
      description: 'Template específico com cláusulas eleitorais e regras de prestação de contas (não reutiliza regras comerciais padrão).',
      clauses_count: 14,
    },
  ];

  return (
    <AdminLayout>
      <Header
        title="Templates de Contratos"
        subtitle="Modelos jurídicos estruturados com regras determinísticas para cada vertente de negócio."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl flex flex-col justify-between hover:border-[rgba(242,242,237,0.1)] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#44755A] bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Tipo: {tpl.type}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    tpl.status === 'ATIVO'
                      ? 'bg-[#1C2E24]/20 text-[#44755A] border border-emerald-500/40'
                      : 'bg-[#121312] text-[#AEB4AE]'
                  }`}
                >
                  {tpl.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white font-display mt-1">{tpl.name}</h3>
              <p className="text-xs text-[#AEB4AE] mt-2 leading-relaxed">{tpl.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(242,242,237,0.1)] flex items-center justify-between text-xs text-[#8E948E]">
              <span>Versão: v{tpl.version}</span>
              <span>{tpl.clauses_count} blocos de cláusulas</span>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
