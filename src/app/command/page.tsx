'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { Play, Check, AlertCircle, AlertTriangle, UserCheck, Calendar, DollarSign, Clock, Users, ArrowRight, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateBR } from '@/lib/utils';

export default function CommandDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchModel = async () => {
    try {
      const res = await fetch('/api/command');
      if (!res.ok) throw new Error('Falha ao carregar modelo do Command.');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModel();
  }, []);

  const handleAction = async (workItemId: string, action: string) => {
    setActionLoading(workItemId);
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workItemId, action }),
      });
      if (!res.ok) throw new Error('Falha ao executar ação.');
      await fetchModel();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-[#AEB4AE]">
          <Loader2 className="w-8 h-8 border-2 border-[#335943] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 bg-red-950/40 border border-red-800/40 text-red-200 rounded">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Header
        title="Command Room"
        subtitle="Central de Tomada de Decisão do Fundador. Foco absoluto no que gera tração."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left column (Top 3 Decisions & Secondary list) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#44755A]" />
              <span>Top 3 Decisões Diárias</span>
            </h2>

            {data?.decisions?.length === 0 ? (
              <p className="text-xs text-[#8E948E] italic font-mono">Fila de decisões diárias vazia.</p>
            ) : (
              <div className="space-y-4">
                {data?.decisions?.map((item: any) => (
                  <div key={item.id} className="p-4 rounded bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#44755A] font-mono">SCORE: {item.score}</span>
                        <span className="text-xs text-white font-mono uppercase truncate max-w-xs">{item.project_name}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#F2F2ED] mt-1">{item.title}</h3>
                      <div className="flex items-center gap-4 text-[10px] text-[#8E948E] font-mono mt-2">
                        {item.due_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateBR(item.due_at)}</span>}
                        {item.estimated_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.estimated_minutes} min</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(item.id, 'START')}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 rounded bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] text-xs font-mono font-bold uppercase tracking-wider text-[#F2F2ED] transition-all disabled:opacity-50"
                      >
                        Começar
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'COMPLETE')}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 rounded bg-[#44755A] hover:bg-[#528769] text-xs font-mono font-bold uppercase tracking-wider text-[#F2F2ED] transition-all disabled:opacity-50"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Not Now Queue */}
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4">
              Fila Secundária (Not Now)
            </h2>
            {data?.notNow?.length === 0 ? (
              <p className="text-xs text-[#8E948E] italic font-mono">Nenhum item na fila secundária.</p>
            ) : (
              <div className="space-y-2">
                {data?.notNow?.map((item: any) => (
                  <div key={item.id} className="p-3 rounded bg-[#0A0A0A] border border-[rgba(242,242,237,0.05)] flex items-center justify-between text-xs">
                    <span className="text-[#AEB4AE] truncate max-w-md">{item.title} ({item.project_name})</span>
                    <span className="text-[10px] text-[#8E948E] font-mono">Score {item.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (Metrics & Blockers & Delegations) */}
        <div className="space-y-6">
          {/* Revenue at risk */}
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>Receita em Risco</span>
            </h2>
            {data?.revenueAtRisk?.length === 0 ? (
              <p className="text-xs text-[#8E948E] italic font-mono">Nenhum faturamento sob risco.</p>
            ) : (
              <div className="space-y-3">
                {data?.revenueAtRisk?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded bg-red-950/20 border border-red-900/30 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{item.projectName}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                    <p className="text-[10px] text-red-300 mt-1">{item.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blockers */}
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>Impedimentos Ativos</span>
            </h2>
            {data?.externalBlockers?.length === 0 ? (
              <p className="text-xs text-[#8E948E] italic font-mono">Sem impedimentos ativos de terceiros.</p>
            ) : (
              <div className="space-y-3">
                {data?.externalBlockers?.map((item: any) => (
                  <div key={item.id} className="p-3 rounded bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] text-xs">
                    <p className="font-bold text-white">{item.projectName}</p>
                    <p className="text-[#AEB4AE] mt-1">{item.description}</p>
                    <p className="text-[9px] text-[#8E948E] font-mono mt-1 uppercase">Responsabilidade: {item.responsibleParty}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delegations */}
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#44755A]" />
              <span>Delegações Ativas</span>
            </h2>
            {data?.delegations?.length === 0 ? (
              <p className="text-xs text-[#8E948E] italic font-mono">Nenhuma delegação ativa.</p>
            ) : (
              <div className="space-y-2">
                {data?.delegations?.map((item: any) => (
                  <div key={item.id} className="p-3 rounded bg-[#0A0A0A] border border-[rgba(242,242,237,0.05)] text-xs">
                    <p className="text-white truncate">{item.title}</p>
                    <p className="text-[9px] text-[#8E948E] font-mono mt-1">{item.projectName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
