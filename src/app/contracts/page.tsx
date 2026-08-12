'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import {
  FileText,
  PlusCircle,
  Search,
  Eye,
  Copy,
  Trash2,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDateBR, formatDocument, CONTRACT_STATUS_LABELS } from '@/lib/utils';

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const loadContracts = async () => {
    try {
      const url = new URL('/api/contracts', window.location.origin);
      if (search) url.searchParams.set('q', search);
      if (statusFilter) url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [search, statusFilter]);

  const handleDuplicate = async (id: string) => {
    try {
      setDuplicatingId(id);
      const res = await fetch(`/api/contracts/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const duplicated = await res.json();
        router.push(`/contracts/${duplicated.id}/preview`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este contrato?')) return;
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadContracts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <Header
        title="Gestão de Contratos"
        subtitle="Gerador, histórico e versionamento de contratos comerciais da KAPEL."
        actions={
          <Link
            href="/contracts/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>Novo Contrato</span>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, documento ou número (#000001)..."
            className="w-full pl-10 pr-4 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === ''
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-[#131c2e]'
            }`}
          >
            Todos ({contracts.length})
          </button>
          <button
            onClick={() => setStatusFilter('FINALIZED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'FINALIZED'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-[#131c2e]'
            }`}
          >
            Finalizados
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'DRAFT'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:bg-[#131c2e]'
            }`}
          >
            Rascunhos
          </button>
          <button
            onClick={() => setStatusFilter('READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'READY'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-[#131c2e]'
            }`}
          >
            Prontos
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-400 shadow-xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-300">Nenhum contrato encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Configure seu primeiro contrato comercial utilizando o assistente guiado.
          </p>
          <Link
            href="/contracts/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Contrato</span>
          </Link>
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#131c2e]/70 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Nº Contrato</th>
                  <th className="py-3.5 px-4">Cliente / Contratante</th>
                  <th className="py-3.5 px-4">Recorrência (MRR)</th>
                  <th className="py-3.5 px-4">Entrada / Setup</th>
                  <th className="py-3.5 px-4">Vigência</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
                {contracts.map((c) => {
                  const statusConfig = CONTRACT_STATUS_LABELS[c.status] || CONTRACT_STATUS_LABELS.DRAFT;
                  return (
                    <tr key={c.id} className="hover:bg-[#131c2e]/50 transition-colors group">
                      <td className="py-4 px-4 font-mono font-bold text-white">
                        #{c.contract_number}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-100 text-sm">
                          {c.client?.trade_name || c.client?.legal_name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatDocument(c.client?.document)}
                        </p>
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-400 text-sm">
                        {formatCurrency(c.calculated_mrr)}
                        <span className="text-[10px] font-normal text-slate-500 block">/mês</span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-white">
                        {formatCurrency(c.calculated_initial_payment)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-200">{c.term_months} meses</span>
                        <span className="text-[10px] text-slate-500 block">Venc. dia {c.due_day}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {formatDateBR(c.created_at)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/contracts/${c.id}/preview`}
                            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                            title="Visualizar Contrato A4"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(c.id)}
                            disabled={duplicatingId === c.id}
                            className="p-2 rounded-xl bg-slate-800/60 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                            title="Duplicar Contrato"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Excluir Contrato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
