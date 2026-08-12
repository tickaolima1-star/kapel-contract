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
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Tipo: {tpl.type}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    tpl.status === 'ATIVO'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tpl.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white font-display mt-1">{tpl.name}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{tpl.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-500">
              <span>Versão: v{tpl.version}</span>
              <span>{tpl.clauses_count} blocos de cláusulas</span>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
