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
  Search,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Send,
  Save,
  X,
  Loader2,
  FileCheck,
  FolderGit2,
  FileSpreadsheet,
  Plus,
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

  // Modal de Gestão / Edição de Projeto
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editStatus, setEditStatus] = useState('FINALIZED');
  const [editMRR, setEditMRR] = useState(0);
  const [editOneTime, setEditOneTime] = useState(0);
  const [editParticularities, setEditParticularities] = useState('');
  const [savingContract, setSavingContract] = useState(false);
  const [contractSaveSuccess, setContractSaveSuccess] = useState(false);

  // Modal de Novo Projeto Rápido
  const [newProjectClientId, setNewProjectClientId] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('Gestão de Mídia & Performance Digital');
  const [newProjectMRR, setNewProjectMRR] = useState(5000);
  const [newProjectStatus, setNewProjectStatus] = useState('FINALIZED');
  const [newProjectNotes, setNewProjectNotes] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Modal de Importação Planilha (Excel / CSV)
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [importingSheet, setImportingSheet] = useState(false);
  const [sheetSuccessMsg, setSheetSuccessMsg] = useState<string | null>(null);
  const [sheetErrorMsg, setSheetErrorMsg] = useState<string | null>(null);

  // Modal de Importação PDF/DOCX
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(true);
  const [importingDoc, setImportingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

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
    setEditTitle(contract.title || '');
    setEditClientId(contract.client_id || '');
    setEditStatus(contract.status || 'FINALIZED');
    setEditMRR(contract.calculated_mrr || 0);
    setEditOneTime(contract.calculated_total_one_time || 0);
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
          title: editTitle,
          client_id: editClientId,
          status: editStatus,
          calculated_mrr: Number(editMRR),
          calculated_total_one_time: Number(editOneTime),
          particularities: editParticularities,
        }),
      });

      if (res.ok) {
        const updatedContract = await res.json();
        setContractSaveSuccess(true);
        
        setData((prev) => {
          if (!prev) return prev;

          // 1. Atualizar clientes
          const updatedClients = prev.clients.map((cli) => {
            let contracts = cli.contracts || [];
            const hasContract = contracts.some((c: any) => c.id === updatedContract.id);
            const isAssignedToThisClient = cli.id === updatedContract.client_id;

            if (hasContract && !isAssignedToThisClient) {
              contracts = contracts.filter((c: any) => c.id !== updatedContract.id);
            } else if (!hasContract && isAssignedToThisClient) {
              contracts = [updatedContract, ...contracts];
            } else if (hasContract && isAssignedToThisClient) {
              contracts = contracts.map((c: any) => c.id === updatedContract.id ? updatedContract : c);
            }

            const activeContractsList = contracts.filter((c: any) => c.status !== 'CANCELLED');
            const clientMRR = activeContractsList.reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
            const clientOneTime = activeContractsList.reduce((sum: number, c: any) => sum + (c.calculated_total_one_time || 0), 0);

            return {
              ...cli,
              contracts,
              active_projects_count: contracts.filter((c: any) => c.status === 'FINALIZED').length,
              total_mrr: clientMRR,
              total_one_time: clientOneTime,
            };
          });

          // 2. Atualizar contratos recentes
          const updatedRecent = prev.recent_contracts.map((c: any) =>
            c.id === updatedContract.id ? updatedContract : c
          );

          // 3. Atualizar métricas globais
          const allContracts = updatedClients.flatMap((cli) => cli.contracts || []);
          const finalActive = allContracts.filter((c: any) => c.status === 'FINALIZED');
          const finalReady = allContracts.filter((c: any) => c.status === 'READY');
          const finalDraft = allContracts.filter((c: any) => c.status === 'DRAFT');

          const totalMRR = allContracts
            .filter((c: any) => c.status !== 'CANCELLED')
            .reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
          const activeMRR = finalActive.reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
          const totalOneTime = allContracts
            .filter((c: any) => c.status !== 'CANCELLED')
            .reduce((sum: number, c: any) => sum + (c.calculated_total_one_time || 0), 0);

          return {
            ...prev,
            clients: updatedClients,
            recent_contracts: updatedRecent,
            metrics: {
              ...prev.metrics,
              total_mrr: totalMRR,
              active_mrr: activeMRR,
              total_one_time: totalOneTime,
              active_contracts_count: finalActive.length,
              ready_contracts_count: finalReady.length,
              draft_contracts_count: finalDraft.length,
            },
          };
        });

        setTimeout(() => {
          setSelectedContract(null);
        }, 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingContract(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o Projeto #${selectedContract.contract_number}?`)) {
      return;
    }

    setSavingContract(true);
    try {
      const res = await fetch(`/api/contracts/${selectedContract.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;

          // 1. Remover dos clientes
          const updatedClients = prev.clients.map((cli) => {
            const contracts = (cli.contracts || []).filter((c: any) => c.id !== selectedContract.id);
            const activeContractsList = contracts.filter((c: any) => c.status !== 'CANCELLED');
            const clientMRR = activeContractsList.reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
            const clientOneTime = activeContractsList.reduce((sum: number, c: any) => sum + (c.calculated_total_one_time || 0), 0);

            return {
              ...cli,
              contracts,
              active_projects_count: contracts.filter((c: any) => c.status === 'FINALIZED').length,
              total_mrr: clientMRR,
              total_one_time: clientOneTime,
            };
          });

          // 2. Remover dos contratos recentes
          const updatedRecent = prev.recent_contracts.filter((c: any) => c.id !== selectedContract.id);

          // 3. Atualizar métricas globais
          const allContracts = updatedClients.flatMap((cli) => cli.contracts || []);
          const finalActive = allContracts.filter((c: any) => c.status === 'FINALIZED');
          const finalReady = allContracts.filter((c: any) => c.status === 'READY');
          const finalDraft = allContracts.filter((c: any) => c.status === 'DRAFT');

          const totalMRR = allContracts
            .filter((c: any) => c.status !== 'CANCELLED')
            .reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
          const activeMRR = finalActive.reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
          const totalOneTime = allContracts
            .filter((c: any) => c.status !== 'CANCELLED')
            .reduce((sum: number, c: any) => sum + (c.calculated_total_one_time || 0), 0);

          return {
            ...prev,
            clients: updatedClients,
            recent_contracts: updatedRecent,
            metrics: {
              ...prev.metrics,
              total_mrr: totalMRR,
              active_mrr: activeMRR,
              total_one_time: totalOneTime,
              active_contracts_count: finalActive.length,
              ready_contracts_count: finalReady.length,
              draft_contracts_count: finalDraft.length,
            },
          };
        });

        setSelectedContract(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingContract(false);
    }
  };

  const handleCreateQuickProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectClientId) return;

    setCreatingProject(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: newProjectClientId,
          template_type: 'PERFORMANCE',
          status: newProjectStatus,
          title: newProjectTitle,
          particularities: newProjectNotes,
          items: [
            {
              name: newProjectTitle,
              billing_type: 'MONTHLY_ARREARS',
              unit_price: Number(newProjectMRR),
              quantity: 1,
              total_price: Number(newProjectMRR),
            },
          ],
        }),
      });

      if (res.ok) {
        const createdContract = await res.json();
        setNewProjectClientId(null);
        setNewProjectNotes('');

        setData((prev) => {
          if (!prev) return prev;

          // 1. Adicionar ao cliente
          const updatedClients = prev.clients.map((cli) => {
            if (cli.id !== createdContract.client_id) return cli;

            const contracts = [createdContract, ...(cli.contracts || [])];
            const activeContractsList = contracts.filter((c: any) => c.status !== 'CANCELLED');
            const clientMRR = activeContractsList.reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
            const clientOneTime = activeContractsList.reduce((sum: number, c: any) => sum + (c.calculated_total_one_time || 0), 0);

            return {
              ...cli,
              contracts,
              active_projects_count: contracts.filter((c: any) => c.status === 'FINALIZED').length,
              total_mrr: clientMRR,
              total_one_time: clientOneTime,
            };
          });

          // 2. Adicionar aos recentes
          const updatedRecent = [createdContract, ...prev.recent_contracts].slice(0, 10);

          // 3. Atualizar métricas globais
          const allContracts = updatedClients.flatMap((cli) => cli.contracts || []);
          const finalActive = allContracts.filter((c: any) => c.status === 'FINALIZED');
          const finalReady = allContracts.filter((c: any) => c.status === 'READY');
          const finalDraft = allContracts.filter((c: any) => c.status === 'DRAFT');

          const totalMRR = allContracts
            .filter((c: any) => c.status !== 'CANCELLED')
            .reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
          const activeMRR = finalActive.reduce((sum: number, c: any) => sum + (c.calculated_mrr || 0), 0);
          const totalOneTime = allContracts
            .filter((c: any) => c.status !== 'CANCELLED')
            .reduce((sum: number, c: any) => sum + (c.calculated_total_one_time || 0), 0);

          return {
            ...prev,
            clients: updatedClients,
            recent_contracts: updatedRecent,
            metrics: {
              ...prev.metrics,
              total_mrr: totalMRR,
              active_mrr: activeMRR,
              total_one_time: totalOneTime,
              active_contracts_count: finalActive.length,
              ready_contracts_count: finalReady.length,
              draft_contracts_count: finalDraft.length,
            },
          };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleImportSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetFile) return;

    setImportingSheet(true);
    setSheetSuccessMsg(null);
    setSheetErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', sheetFile);

      const res = await fetch('/api/projects/import-sheet', {
        method: 'POST',
        body: formData,
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Erro ao importar planilha.');
      }

      setSheetSuccessMsg(resData.message || 'Planilha importada com sucesso!');
      await loadData();
      setTimeout(() => {
        setIsSheetModalOpen(false);
        setSheetFile(null);
        setSheetSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setSheetErrorMsg(err.message);
    } finally {
      setImportingSheet(false);
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSheetModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Puxar Planilha (Excel / CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDocModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar Contrato (PDF / DOCX)</span>
            </button>
            <Link
              href="/contracts/new"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-semibold text-xs shadow-lg shadow-emerald-400/20 transition-all"
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
                    Você pode subir sua planilha do Excel/CSV ou importar contratos para alimentar o painel!
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsSheetModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Puxar da Minha Planilha</span>
                    </button>
                    <button
                      onClick={() => setIsDocModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Importar Contrato PDF</span>
                    </button>
                  </div>
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

                      {/* Métricas e Ação Rápida */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-4 bg-[#131c2e] px-4 py-2 rounded-xl border border-[#1e293b]">
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

                        <button
                          type="button"
                          onClick={() => setNewProjectClientId(cli.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Projeto</span>
                        </button>
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
                                    <strong className="text-slate-300">Notas: </strong>
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
                                    <span>Editar Valores / Status / Atribuição</span>
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
                                  title="Editar Status e Valores"
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

      {/* Modal 1: Gestão Completa de Projeto (Valores, Status, Atribuição) */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                <FileEdit className="w-5 h-5 text-emerald-400" />
                <span>Gerenciar Projeto #{selectedContract.contract_number}</span>
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
                <label className="block text-slate-400 mb-1">Título do Projeto / Serviço *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-medium focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Cliente Vinculado (Atribuição)</label>
                  <select
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-medium focus:border-emerald-500/50"
                  >
                    {data?.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.legal_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Status do Projeto</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-medium focus:border-emerald-500/50"
                  >
                    <option value="FINALIZED">Finalizado / Em Execução (Ativo)</option>
                    <option value="READY">Pronto para Assinatura (Aguardando)</option>
                    <option value="DRAFT">Rascunho (Em Elaboração)</option>
                    <option value="CANCELLED">Cancelado / Pausado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Honorários Mensais (MRR R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editMRR}
                    onChange={(e) => setEditMRR(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-mono focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Valor Único / Setup (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOneTime}
                    onChange={(e) => setEditOneTime(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-mono focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observações & Particularidades</label>
                <textarea
                  rows={3}
                  value={editParticularities}
                  onChange={(e) => setEditParticularities(e.target.value)}
                  placeholder="Ex: Escopo em andamento, reunião quinzenal agendada, campanha ativa..."
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50"
                />
              </div>

              {contractSaveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Projeto e valores atualizados com sucesso!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDeleteContract}
                  disabled={savingContract}
                  className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-900/30 text-red-400 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  Excluir Projeto
                </button>

                <div className="flex items-center gap-3">
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Novo Projeto Rápido */}
      {newProjectClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Adicionar Novo Projeto</span>
              </div>
              <button
                onClick={() => setNewProjectClientId(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickProject} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Título do Projeto / Serviço *</label>
                <input
                  type="text"
                  required
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-medium focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Honorários (MRR R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProjectMRR}
                    onChange={(e) => setNewProjectMRR(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-mono focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={newProjectStatus}
                    onChange={(e) => setNewProjectStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white font-medium focus:border-emerald-500/50"
                  >
                    <option value="FINALIZED">Finalizado / Em Execução (Ativo)</option>
                    <option value="READY">Pronto para Assinatura</option>
                    <option value="DRAFT">Rascunho</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observações do Projeto</label>
                <textarea
                  rows={3}
                  value={newProjectNotes}
                  onChange={(e) => setNewProjectNotes(e.target.value)}
                  placeholder="Escopo do projeto, prazos..."
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewProjectClientId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {creatingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Criar Projeto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Importação de Planilha Excel / CSV */}
      {isSheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Importar Planilha de Projetos (Excel / CSV)
              </div>
              <button
                onClick={() => {
                  setIsSheetModalOpen(false);
                  setSheetFile(null);
                  setSheetSuccessMsg(null);
                  setSheetErrorMsg(null);
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSheet} className="p-6 space-y-4 text-xs">
              <p className="text-slate-400">
                Selecione o arquivo da sua planilha (<strong className="text-slate-200">.xlsx, .xls ou .csv</strong>). O sistema identificará automaticamente as colunas de <strong>Cliente, CNPJ, Projeto, Valor e Status</strong> e criará os registros no seu painel!
              </p>

              {sheetSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{sheetSuccessMsg}</span>
                </div>
              )}

              {sheetErrorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sheetErrorMsg}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-950/50">
                <input
                  type="file"
                  id="sheetFile"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setSheetFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="sheetFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">
                      {sheetFile ? sheetFile.name : 'Clique para selecionar a Planilha Excel ou CSV'}
                    </span>
                    <span className="text-xs text-slate-500">Formatos aceitos: .XLSX, .XLS, .CSV</span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSheetModalOpen(false);
                    setSheetFile(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!sheetFile || importingSheet}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {importingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  <span>Processar & Importar Planilha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Importação de Contrato PDF ou DOCX */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                <UploadCloud className="w-5 h-5 text-blue-400" />
                Importar Contrato Existente (PDF ou DOCX)
              </div>
              <button
                onClick={() => {
                  setIsDocModalOpen(false);
                  setDocFile(null);
                  setDocError(null);
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

              {docError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{docError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-950/50">
                <input
                  type="file"
                  id="dashContractFile"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="dashContractFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">
                      {docFile ? docFile.name : 'Clique para selecionar o PDF ou DOCX'}
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
                    setIsDocModalOpen(false);
                    setDocFile(null);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!docFile || importingDoc}
                  onClick={async () => {
                    if (!docFile) return;
                    setImportingDoc(true);
                    setDocError(null);

                    try {
                      const formData = new FormData();
                      formData.append('file', docFile);
                      formData.append('alreadySigned', alreadySigned ? 'true' : 'false');

                      const res = await fetch('/api/contracts/import', {
                        method: 'POST',
                        body: formData,
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        throw new Error(data.error || 'Erro ao processar importação.');
                      }

                      setIsDocModalOpen(false);
                      await loadData();
                    } catch (err: any) {
                      setDocError(err.message);
                    } finally {
                      setImportingDoc(false);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  {importingDoc && <Loader2 className="w-4 h-4 animate-spin" />}
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
