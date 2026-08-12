'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import {
  TrendingUp,
  FileText,
  FileEdit,
  Users,
  DollarSign,
  PlusCircle,
  Eye,
  Copy,
  ExternalLink,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDateBR, CONTRACT_STATUS_LABELS } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<{
    metrics: {
      active_contracts_count: number;
      draft_contracts_count: number;
      total_clients_count: number;
      total_mrr: number;
      total_one_time: number;
    };
    recent_contracts: any[];
    recent_audit_logs: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/dashboard');
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
    loadData();
  }, []);

  const handleDuplicate = async (contractId: string) => {
    try {
      setDuplicatingId(contractId);
      const res = await fetch(`/api/contracts/${contractId}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <AdminLayout>
      <Header
        title="Painel Executivo"
        subtitle="Visão geral de contratos, receita recorrente (MRR) e inteligência comercial da KAPEL."
        actions={
          <Link
            href="/contracts/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>Novo Contrato</span>
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* MRR Contratado */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-12 h-12 text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MRR Contratado</p>
              <h3 className="text-2xl font-bold text-emerald-400 font-display mt-2">
                {formatCurrency(data.metrics.total_mrr)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Recorrência mensal ativa</p>
            </div>

            {/* Receita Única */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-cyan-500/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-12 h-12 text-cyan-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receita Única</p>
              <h3 className="text-2xl font-bold text-cyan-400 font-display mt-2">
                {formatCurrency(data.metrics.total_one_time)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Setups e projetos pontuais</p>
            </div>

            {/* Contratos Ativos */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-slate-600 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contratos Ativos</p>
              <h3 className="text-2xl font-bold text-white font-display mt-2">
                {data.metrics.active_contracts_count}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Documentos finalizados</p>
            </div>

            {/* Rascunhos */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-amber-500/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileEdit className="w-12 h-12 text-amber-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rascunhos</p>
              <h3 className="text-2xl font-bold text-amber-400 font-display mt-2">
                {data.metrics.draft_contracts_count}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Em negociação / edição</p>
            </div>

            {/* Total Clientes */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-indigo-500/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="w-12 h-12 text-indigo-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clientes</p>
              <h3 className="text-2xl font-bold text-indigo-300 font-display mt-2">
                {data.metrics.total_clients_count}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Base ativa cadastrada</p>
            </div>
          </div>

          {/* Main Grid: Recent Contracts & Audit Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contratos Recentes (2 colunas) */}
            <div className="lg:col-span-2 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white font-display">Contratos Recentes</h2>
                  <p className="text-xs text-slate-400">Últimos documentos configurados na plataforma</p>
                </div>
                <Link
                  href="/contracts"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Ver todos</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recent_contracts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#1e293b] rounded-xl text-slate-500 text-sm">
                  Nenhum contrato cadastrado ainda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#1e293b] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3">Nº</th>
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">MRR</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]/60">
                      {data.recent_contracts.map((c) => {
                        const statusConfig = CONTRACT_STATUS_LABELS[c.status] || CONTRACT_STATUS_LABELS.DRAFT;
                        return (
                          <tr key={c.id} className="hover:bg-[#131c2e]/50 transition-colors group">
                            <td className="py-3.5 font-mono text-xs text-slate-400 font-semibold">
                              #{c.contract_number}
                            </td>
                            <td className="py-3.5">
                              <p className="font-medium text-slate-200">{c.client?.trade_name || c.client?.legal_name}</p>
                              <p className="text-[11px] text-slate-400">{c.client?.document}</p>
                            </td>
                            <td className="py-3.5 font-semibold text-emerald-400">
                              {formatCurrency(c.calculated_mrr)}/mês
                            </td>
                            <td className="py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/contracts/${c.id}/preview`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                  title="Visualizar Contrato A4"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleDuplicate(c.id)}
                                  disabled={duplicatingId === c.id}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                                  title="Duplicar Contrato"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Feed de Auditoria (1 coluna) */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white font-display">Histórico & Auditoria</h2>
              </div>

              {data.recent_audit_logs.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum registro de auditoria.</p>
              ) : (
                <div className="space-y-4 flex-1">
                  {data.recent_audit_logs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-xl bg-[#131c2e] border border-[#1e293b] space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-emerald-400">{log.action}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDateBR(log.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{log.details}</p>
                      <p className="text-[10px] text-slate-500">Por: {log.user_name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Qualificação da Empresa Card */}
              <div className="mt-6 pt-4 border-t border-[#1e293b] text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Empresa Operadora:</p>
                <p className="text-[11px]">67.726.428 PATRICK EDUARDO LIMA SILVA</p>
                <p className="text-[11px] text-slate-500">CNPJ: 67.726.428/0001-97</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
