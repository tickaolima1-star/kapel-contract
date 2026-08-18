'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Send,
  Sparkles,
  Save,
  X,
  Loader2,
  FileCheck,
  FolderGit2,
} from 'lucide-react';
import { formatCurrency, formatDateBR, formatDocument, CONTRACT_STATUS_LABELS } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    metrics: {
      active_clients_count: number;
      active_contracts_count: number;
      ready_contracts_count: number;
      draft_contracts_count: number;
      total_mrr: number;
      total_one_time: number;
    };
    clients: any[];
    recent_contracts: any[];
    recent_audit_logs: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'CLIENTS' | 'RECENT_CONTRACTS'>('CLIENTS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de Gestão Rápida de Projeto
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<string>('READY');
  const [editParticularities, setEditParticularities] = useState<string>('');
  const [savingContract, setSavingContract] = useState(false);
  const [contractSaveSuccess, setContractSaveSuccess] = useState(false);

  // Modal de Importação PDF/DOCX
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

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

  const handleCopyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleOpenEditModal = (contract: any) => {
    setSelectedContract(contract);
    setEditStatus(contract.status || 'READY');
    setEditParticularities(contract.particularities || '');
    setContractSaveSuccess(false);
  };

  const handleSaveContractDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    setSavingContract(true);
    setContractSaveSuccess(false);

    try {
      const res = await fetch(`/api/contracts/${selectedContract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          particularities: editParticularities,
        }),
      });

      if (res.ok) {
        setContractSaveSuccess(true);
        await loadData();
        setTimeout(() => {
          setSelectedContract(null);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingContract(false);
    }
  };

  const filteredClients = (data?.clients || []).filter((cli) => {
    const q = searchQuery.toLowerCase();
    const matchesClient =
      cli.legal_name?.toLowerCase().includes(q) ||
      cli.trade_name?.toLowerCase().includes(q) ||
      cli.document?.includes(q) ||
      cli.city?.toLowerCase().includes(q);

    const matchesContract = cli.contracts?.some(
      (c: any) =>
        c.title?.toLowerCase().includes(q) ||
        c.contract_number?.includes(q) ||
        c.particularities?.toLowerCase().includes(q)
    );

    return matchesClient || matchesContract;
  });

  return (
    <AdminLayout>
      <Header
        title="Painel Operacional KAPEL"
        subtitle="Gestão centralizada de clientes ativos, projetos vinculados e receita recorrente (MRR)."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar Contrato (PDF / DOCX)</span>
            </button>
            <Link
              href="/contracts/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>Novo Contrato</span>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MRR Contratado */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-12 h-12 text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MRR Ativo (Recorrência)</p>
              <h3 className="text-2xl font-bold text-emerald-400 font-display mt-2">
                {formatCurrency(data.metrics.total_mrr)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Faturamento mensal contratado</p>
            </div>

            {/* Clientes Ativos */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-blue-500/40 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-12 h-12 text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clientes Cadastrados</p>
              <h3 className="text-2xl font-bold text-blue-300 font-display mt-2">
                {data.metrics.active_clients_count}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Empresas e marcas na carteira</p>
            </div>

            {/* Projetos / Contratos Ativos */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-purple-500/40 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Briefcase className="w-12 h-12 text-purple-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projetos em Execução</p>
              <h3 className="text-2xl font-bold text-purple-300 font-display mt-2">
                {data.metrics.active_contracts_count}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Contratos ativos e assinados</p>
            </div>

            {/* Aguardando Assinatura */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-amber-500/40 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileEdit className="w-12 h-12 text-amber-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendentes / Prontos</p>
              <h3 className="text-2xl font-bold text-amber-400 font-display mt-2">
                {data.metrics.ready_contracts_count}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Prontos para assinatura ou envio</p>
            </div>
          </div>

          {/* Navigation Tabs & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-3 shadow-lg">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('CLIENTS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'CLIENTS'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-[#131c2e] border border-[#1e293b]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Clientes & Projetos Vinculados ({filteredClients.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('RECENT_CONTRACTS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'RECENT_CONTRACTS'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-[#131c2e] border border-[#1e293b]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Visão Geral de Contratos ({data.recent_contracts.length})</span>
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por cliente, CNPJ ou projeto..."
                className="w-full pl-9 pr-4 py-1.5 bg-[#131c2e] border border-[#1e293b] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Tab 1: Clientes & Projetos Vinculados */}
          {activeTab === 'CLIENTS' && (
            <div className="space-y-4">
              {filteredClients.length === 0 ? (
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-500 shadow-xl">
                  <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-300">Nenhum cliente encontrado</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Suba um contrato existente em PDF/DOCX ou cadastre um cliente para visualizar seus projetos.
                  </p>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Importar Primeiro Contrato</span>
                  </button>
                </div>
              ) : (
                filteredClients.map((cli) => (
                  <div
                    key={cli.id}
                    className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all space-y-4"
                  >
                    {/* Header do Cliente */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#1e293b]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{cli.legal_name}</h3>
                            {cli.trade_name && cli.trade_name !== cli.legal_name && (
                              <span className="text-xs text-slate-400 font-medium">({cli.trade_name})</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="font-mono">{formatDocument(cli.document)}</span>
                            <span>•</span>
                            <span>{cli.city}/{cli.state}</span>
                            {cli.representative_name && (
                              <>
                                <span>•</span>
                                <span>Rep: <strong className="text-slate-300">{cli.representative_name}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Métricas do Cliente */}
                      <div className="flex items-center gap-4 bg-[#131c2e] px-4 py-2 rounded-xl border border-[#1e293b] w-fit">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">MRR Contratado</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {formatCurrency(cli.total_mrr)}/mês
                          </span>
                        </div>
                        <div className="h-6 w-px bg-[#1e293b]" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Projetos</span>
                          <span className="text-sm font-bold text-slate-200 font-mono">
                            {cli.contracts?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Projetos / Contratos Vinculados */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <FolderGit2 className="w-4 h-4 text-emerald-400" />
                        <span>Projetos & Contratos Vinculados:</span>
                      </div>

                      {cli.contracts?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic pl-6">Nenhum projeto vinculado a este cliente.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {cli.contracts.map((contract: any) => {
                            const statusInfo = CONTRACT_STATUS_LABELS[contract.status] || {
                              label: contract.status,
                              color: 'bg-slate-800 text-slate-400 border-slate-700',
                            };

                            return (
                              <div
                                key={contract.id}
                                className="p-4 rounded-xl bg-[#131c2e]/70 border border-[#1e293b] hover:border-emerald-500/30 transition-all space-y-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-bold text-emerald-400">
                                        #{contract.contract_number}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                                        {statusInfo.label}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-slate-100 mt-1 line-clamp-1">
                                      {contract.title || 'Prestação de Serviços'}
                                    </h4>
                                  </div>

                                  <span className="text-xs font-bold text-slate-200 font-mono shrink-0">
                                    {contract.calculated_mrr > 0
                                      ? `${formatCurrency(contract.calculated_mrr)}/mês`
                                      : formatCurrency(contract.calculated_total_one_time || 0)}
                                  </span>
                                </div>

                                {/* Itens de Serviço do Projeto */}
                                {contract.items && contract.items.length > 0 && (
                                  <div className="text-[11px] text-slate-400 space-y-0.5">
                                    {contract.items.map((it: any) => (
                                      <div key={it.id} className="flex items-center gap-1.5 text-slate-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="truncate">{it.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Observações / Status Operacional */}
                                {contract.particularities && (
                                  <div className="p-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-[11px] text-slate-400">
                                    <strong className="text-slate-300">Observações: </strong>
                                    {contract.particularities}
                                  </div>
                                )}

                                {/* Ações do Projeto */}
                                <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(contract)}
                                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                  >
                                    <FileEdit className="w-3.5 h-3.5" />
                                    <span>Atualizar Status / Notas</span>
                                  </button>

                                  <div className="flex items-center gap-2">
                                    {contract.signature_token && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyLink(contract.signature_token, contract.id)}
                                        title="Copiar Link de Assinatura Pública"
                                        className={`p-1.5 rounded-lg border transition-all ${
                                          copiedId === contract.id
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                            : 'bg-[#0f172a] text-slate-400 hover:text-white border-[#1e293b]'
                                        }`}
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <Link
                                      href={`/contracts/${contract.id}/preview`}
                                      title="Visualizar Contrato A4"
                                      className="p-1.5 rounded-lg bg-[#0f172a] text-slate-400 hover:text-white border border-[#1e293b] transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Visão Geral de Contratos Recentes & Histórico */}
          {activeTab === 'RECENT_CONTRACTS' && (
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

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1e293b] text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-3">Nº</th>
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">Honorários</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]/60">
                      {data.recent_contracts.map((c) => {
                        const statusConfig = CONTRACT_STATUS_LABELS[c.status] || {
                          label: c.status,
                          color: 'bg-slate-800 text-slate-400 border-slate-700',
                        };
                        return (
                          <tr key={c.id} className="hover:bg-[#131c2e]/50 transition-colors">
                            <td className="py-3 font-mono font-bold text-emerald-400">
                              #{c.contract_number}
                            </td>
                            <td className="py-3">
                              <p className="font-semibold text-slate-100">{c.client?.legal_name}</p>
                              <p className="text-[11px] text-slate-500">{c.client?.document}</p>
                            </td>
                            <td className="py-3 font-medium text-emerald-400">
                              {c.calculated_mrr > 0 ? `${formatCurrency(c.calculated_mrr)}/mês` : formatCurrency(c.calculated_total_one_time || 0)}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(c)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                  title="Editar Status"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                </button>
                                <Link
                                  href={`/contracts/${c.id}/preview`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                  title="Visualizar Contrato"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Feed de Auditoria (1 coluna) */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white font-display">Histórico & Auditoria</h2>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-96">
                  {data.recent_audit_logs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-[#131c2e] border border-[#1e293b] space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-400">{log.action}</span>
                        <span className="text-slate-500">{formatDateBR(log.created_at)}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal de Gestão Rápida de Status e Notas do Projeto */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                <FileEdit className="w-5 h-5 text-emerald-400" />
                <span>Atualizar Projeto #{selectedContract.contract_number}</span>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContractDetails} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Cliente</label>
                <input
                  type="text"
                  disabled
                  value={selectedContract.client?.legal_name || ''}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status Operacional do Contrato</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-medium focus:border-emerald-500/50"
                >
                  <option value="FINALIZED">Finalizado / Em Execução (Ativo)</option>
                  <option value="READY">Pronto para Assinatura (Aguardando)</option>
                  <option value="DRAFT">Rascunho (Em Elaboração)</option>
                  <option value="CANCELLED">Cancelado / Encerrado</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observações & Particularidades do Projeto</label>
                <textarea
                  rows={4}
                  value={editParticularities}
                  onChange={(e) => setEditParticularities(e.target.value)}
                  placeholder="Ex: Escopo em andamento, reunião quinzenal agendada, campanha ativa..."
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50"
                />
              </div>

              {contractSaveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Projeto atualizado com sucesso!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingContract}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {savingContract ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação de Contrato PDF ou DOCX */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                <UploadCloud className="w-5 h-5 text-blue-400" />
                Importar Contrato Existente (PDF ou DOCX)
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                Selecione o arquivo do contrato (<strong className="text-slate-200">.PDF</strong> ou <strong className="text-slate-200">.DOCX</strong>). O sistema reconhecerá automaticamente a <strong>Razão Social, CNPJ/CPF, Representante, Endereço e Valores</strong>, cadastrando o Cliente e registrando o contrato no seu painel!
              </p>

              {importError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-950/50">
                <input
                  type="file"
                  id="dashContractFile"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="dashContractFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">
                      {importFile ? importFile.name : 'Clique para selecionar o PDF ou DOCX'}
                    </span>
                    <span className="text-xs text-slate-500">Formatos suportados: .PDF, .DOCX</span>
                  </div>
                </label>
              </div>

              {/* Opção de Contrato Já Assinado */}
              <label className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alreadySigned}
                  onChange={(e) => setAlreadySigned(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-500 rounded bg-slate-900 border-slate-700"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Este contrato já foi assinado pelo cliente</span>
                  <span className="text-slate-400 text-[11px]">
                    Cadastrará o cliente e marcará o contrato como <strong>Finalizado / Ativo</strong> no seu histórico.
                  </span>
                </div>
              </label>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportFile(null);
                    setImportError(null);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!importFile || importing}
                  onClick={async () => {
                    if (!importFile) return;
                    setImporting(true);
                    setImportError(null);

                    try {
                      const formData = new FormData();
                      formData.append('file', importFile);
                      formData.append('alreadySigned', alreadySigned ? 'true' : 'false');

                      const res = await fetch('/api/contracts/import', {
                        method: 'POST',
                        body: formData,
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        throw new Error(data.error || 'Erro ao processar importação.');
                      }

                      // Recarrega o painel e fecha o modal
                      setIsImportModalOpen(false);
                      await loadData();
                    } catch (err: any) {
                      setImportError(err.message);
                    } finally {
                      setImporting(false);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Processar & Cadastrar Cliente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
