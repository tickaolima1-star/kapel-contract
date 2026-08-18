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
  PlusCircle,
  Building2,
  ExternalLink,
  Eye,
  ShieldCheck,
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
        title="Painel Operacional"
        subtitle="Gestão centralizada de clientes ativos, projetos vinculados e controle de faturamento (MRR)."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSheetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] hover:text-[#F2F2ED] font-bold text-[11px] font-mono tracking-wider uppercase transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar Planilha</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDocModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] hover:text-[#F2F2ED] font-bold text-[11px] font-mono tracking-wider uppercase transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar Contrato PDF</span>
            </button>
            <Link
              href="/contracts/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#1C2E24] hover:bg-[#263F31] text-[#F2F2ED] border border-[#335943] font-bold text-[11px] font-mono tracking-wider uppercase transition-all shadow-lg shadow-[#1C2E24]/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Contrato</span>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-[#AEB4AE]">
          <div className="w-8 h-8 border-2 border-[#335943] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* KPI Cards Grid using the signature design system specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MRR Contratado */}
            <div className="card-custom scanline bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-5 relative overflow-hidden transition-all group hover:border-[#335943]/45">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-12 h-12 text-[#44755A]" />
              </div>
              <p className="text-[10px] font-bold text-[#8E948E] uppercase tracking-widest font-mono">MRR Ativo Consolidado</p>
              <h3 className="text-2xl font-black text-[#F2F2ED] font-mono mt-2 tracking-tight">
                {formatCurrency(data.metrics.total_mrr)}
              </h3>
              <p className="text-[11px] text-[#8E948E] font-mono mt-1">Soma de contratos em andamento</p>
            </div>

            {/* Clientes Cadastrados */}
            <div className="card-custom bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-5 relative overflow-hidden transition-all group hover:border-[#335943]/45">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-12 h-12 text-[#44755A]" />
              </div>
              <p className="text-[10px] font-bold text-[#8E948E] uppercase tracking-widest font-mono">Clientes Cadastrados</p>
              <h3 className="text-2xl font-black text-[#F2F2ED] font-mono mt-2 tracking-tight">
                {data.metrics.active_clients_count}
              </h3>
              <p className="text-[11px] text-[#8E948E] font-mono mt-1">Marcas e parceiros ativos</p>
            </div>

            {/* Projetos em Execução */}
            <div className="card-custom bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-5 relative overflow-hidden transition-all group hover:border-[#335943]/45">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Briefcase className="w-12 h-12 text-[#44755A]" />
              </div>
              <p className="text-[10px] font-bold text-[#8E948E] uppercase tracking-widest font-mono">Projetos em Andamento</p>
              <h3 className="text-2xl font-black text-[#F2F2ED] font-mono mt-2 tracking-tight">
                {data.metrics.active_contracts_count}
              </h3>
              <p className="text-[11px] text-[#8E948E] font-mono mt-1">Contratos vigentes ativos</p>
            </div>

            {/* Aguardando Assinatura */}
            <div className="card-custom bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-5 relative overflow-hidden transition-all group hover:border-[#335943]/45">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileEdit className="w-12 h-12 text-amber-500" />
              </div>
              <p className="text-[10px] font-bold text-[#8E948E] uppercase tracking-widest font-mono">Aguardando Assinatura</p>
              <h3 className="text-2xl font-black text-amber-500 font-mono mt-2 tracking-tight">
                {data.metrics.ready_contracts_count}
              </h3>
              <p className="text-[11px] text-[#8E948E] font-mono mt-1">Minutas prontas ou pendentes</p>
            </div>
          </div>

          {/* Navigation Tabs & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded p-3 shadow-lg">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('CLIENTS')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded text-[11px] font-bold font-mono tracking-wider uppercase transition-all ${
                  activeTab === 'CLIENTS'
                    ? 'bg-[#1C2E24] text-[#44755A] border border-[#335943]/40'
                    : 'text-[#AEB4AE] hover:text-[#F2F2ED] bg-transparent border border-transparent'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Clientes & Projetos ({filteredClients.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('RECENT_CONTRACTS')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded text-[11px] font-bold font-mono tracking-wider uppercase transition-all ${
                  activeTab === 'RECENT_CONTRACTS'
                    ? 'bg-[#1C2E24] text-[#44755A] border border-[#335943]/40'
                    : 'text-[#AEB4AE] hover:text-[#F2F2ED] bg-transparent border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Visão Geral de Contratos ({data.recent_contracts.length})</span>
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#8E948E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por cliente, CNPJ ou projeto..."
                className="w-full pl-9 pr-4 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-xs text-white placeholder-[#8E948E] focus:outline-none focus:border-[#335943] focus:bg-[#1C2E24]/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Tab 1: Clientes & Projetos Vinculados */}
          {activeTab === 'CLIENTS' && (
            <div className="space-y-4">
              {filteredClients.length === 0 ? (
                <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-12 text-center text-[#AEB4AE] shadow-xl">
                  <Building2 className="w-12 h-12 text-[#8E948E] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white">Nenhum registro encontrado</p>
                  <p className="text-xs text-[#8E948E] mt-1 max-w-sm mx-auto font-mono">
                    Suba sua planilha ou importe contratos para visualizar as informações consolidadas.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsSheetModalOpen(true)}
                      className="px-4 py-2 bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] rounded font-mono text-xs uppercase font-bold"
                    >
                      Planilha Excel
                    </button>
                    <button
                      onClick={() => setIsDocModalOpen(true)}
                      className="px-4 py-2 bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] rounded font-mono text-xs uppercase font-bold"
                    >
                      Importar PDF
                    </button>
                  </div>
                </div>
              ) : (
                filteredClients.map((cli) => (
                  <div
                    key={cli.id}
                    className="card-custom bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-5 shadow-xl transition-all space-y-4 hover:border-[#335943]/20"
                  >
                    {/* Header do Cliente */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[rgba(242,242,237,0.1)]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-[#1C2E24]/20 border border-[#335943]/30 flex items-center justify-center text-[#44755A] shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-[#F2F2ED] uppercase tracking-wide">{cli.legal_name}</h3>
                            {cli.trade_name && cli.trade_name !== cli.legal_name && (
                              <span className="text-xs text-[#AEB4AE] font-semibold">({cli.trade_name})</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E948E] font-mono mt-1">
                            <span>{formatDocument(cli.document)}</span>
                            <span>•</span>
                            <span>{cli.city}/{cli.state}</span>
                            {cli.representative_name && (
                              <>
                                <span>•</span>
                                <span>REP: <strong className="text-[#AEB4AE]">{cli.representative_name}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Métricas e Ação Rápida */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-4 bg-[#0A0A0A] px-4 py-2 rounded border border-[rgba(242,242,237,0.1)]">
                          <div>
                            <span className="text-[9px] text-[#8E948E] font-mono uppercase tracking-widest block">MRR Contratado</span>
                            <span className="text-sm font-bold text-[#44755A] font-mono">
                              {formatCurrency(cli.total_mrr)}/mês
                            </span>
                          </div>
                          <div className="h-6 w-px bg-[rgba(242,242,237,0.1)]" />
                          <div>
                            <span className="text-[9px] text-[#8E948E] font-mono uppercase tracking-widest block">Projetos</span>
                            <span className="text-sm font-bold text-[#F2F2ED] font-mono">
                              {cli.contracts?.length || 0}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setNewProjectClientId(cli.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#1C2E24]/20 hover:bg-[#1C2E24]/40 text-[#44755A] border border-[#335943]/30 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Novo Projeto</span>
                        </button>
                      </div>
                    </div>

                    {/* Projetos / Contratos Vinculados */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#AEB4AE] uppercase tracking-widest font-mono">
                        <FolderGit2 className="w-4 h-4 text-[#44755A]" />
                        <span>Projetos & Contratos Vinculados:</span>
                      </div>

                      {cli.contracts?.length === 0 ? (
                        <p className="text-xs text-[#8E948E] italic pl-6 font-mono">Nenhum projeto vinculado a este cliente.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {cli.contracts.map((contract: any) => {
                            let statusColor = 'bg-slate-900/60 text-slate-400 border-slate-700/40';
                            if (contract.status === 'FINALIZED') {
                              statusColor = 'bg-[#1C2E24]/40 text-[#44755A] border-[#335943]/40';
                            } else if (contract.status === 'READY') {
                              statusColor = 'bg-amber-950/40 text-amber-400 border-amber-800/40';
                            } else if (contract.status === 'CANCELLED') {
                              statusColor = 'bg-red-950/40 text-red-400 border-red-800/40';
                            }

                            return (
                              <div
                                key={contract.id}
                                className="p-4 rounded bg-[#121312] border border-[rgba(242,242,237,0.1)] hover:border-[#335943]/30 transition-all space-y-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-bold text-[#44755A]">
                                        #{contract.contract_number}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${statusColor}`}>
                                        {contract.status === 'FINALIZED' ? 'ATIVO' : CONTRACT_STATUS_LABELS[contract.status]?.label || contract.status}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white mt-1 line-clamp-1 uppercase font-mono tracking-wide">
                                      {contract.title || 'Prestação de Serviços'}
                                    </h4>
                                  </div>

                                  <span className="text-xs font-bold text-[#F2F2ED] font-mono shrink-0">
                                    {contract.calculated_mrr > 0
                                      ? `${formatCurrency(contract.calculated_mrr)}/mês`
                                      : formatCurrency(contract.calculated_total_one_time || 0)}
                                  </span>
                                </div>

                                {/* Itens de Serviço do Projeto */}
                                {contract.items && contract.items.length > 0 && (
                                  <div className="text-[11px] text-[#AEB4AE] space-y-0.5 font-mono">
                                    {contract.items.map((it: any) => (
                                      <div key={it.id} className="flex items-center gap-1.5 text-[#D7D8D0]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#44755A]" />
                                        <span className="truncate">{it.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Observações / Status Operacional */}
                                {contract.particularities && (
                                  <div className="p-2 rounded bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] text-[11px] text-[#AEB4AE] font-mono">
                                    <strong className="text-white">NOTAS: </strong>
                                    {contract.particularities}
                                  </div>
                                )}

                                {/* Ações do Projeto */}
                                <div className="pt-2 border-t border-[rgba(242,242,237,0.1)] flex items-center justify-between gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(contract)}
                                    className="text-[11px] font-bold text-[#44755A] hover:text-[#528769] font-mono tracking-wider uppercase flex items-center gap-1"
                                  >
                                    <FileEdit className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>

                                  <div className="flex items-center gap-2">
                                    {contract.signature_token && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyLink(contract.signature_token, contract.id)}
                                        title="Copiar Link de Assinatura"
                                        className={`p-1.5 rounded border transition-all ${
                                          copiedId === contract.id
                                            ? 'bg-[#1C2E24]/40 text-[#44755A] border-[#335943]/30'
                                            : 'bg-[#0A0A0A] text-[#AEB4AE] hover:text-[#F2F2ED] border-[rgba(242,242,237,0.1)]'
                                        }`}
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <Link
                                      href={`/contracts/${contract.id}/preview`}
                                      title="Visualizar Contrato A4"
                                      className="p-1.5 rounded bg-[#0A0A0A] text-[#AEB4AE] hover:text-[#F2F2ED] border border-[rgba(242,242,237,0.1)] transition-colors"
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
              <div className="lg:col-span-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">Contratos Recentes</h2>
                    <p className="text-xs text-[#8E948E] font-mono mt-0.5">Últimos documentos configurados na plataforma</p>
                  </div>
                  <Link
                    href="/contracts"
                    className="text-xs font-bold text-[#44755A] hover:text-[#528769] font-mono uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>Ver todos</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[rgba(242,242,237,0.1)] text-[#AEB4AE] font-bold uppercase tracking-widest text-[10px]">
                        <th className="pb-3">Nº</th>
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">Honorários</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(242,242,237,0.06)]">
                      {data.recent_contracts.map((c) => {
                        let statusColor = 'bg-slate-900/60 text-slate-400 border-slate-700/40';
                        if (c.status === 'FINALIZED') {
                          statusColor = 'bg-[#1C2E24]/40 text-[#44755A] border-[#335943]/40';
                        } else if (c.status === 'READY') {
                          statusColor = 'bg-amber-950/40 text-amber-400 border-amber-800/40';
                        }

                        return (
                          <tr key={c.id} className="hover:bg-[#121312]/70 transition-colors">
                            <td className="py-3 font-bold text-[#44755A]">
                              #{c.contract_number}
                            </td>
                            <td className="py-3">
                              <p className="font-bold text-[#F2F2ED] uppercase text-[11px] tracking-wide">{c.client?.legal_name}</p>
                              <p className="text-[10px] text-[#8E948E] mt-0.5">{c.client?.document}</p>
                            </td>
                            <td className="py-3 font-bold text-[#44755A]">
                              {c.calculated_mrr > 0 ? `${formatCurrency(c.calculated_mrr)}/mês` : formatCurrency(c.calculated_total_one_time || 0)}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}>
                                {c.status === 'FINALIZED' ? 'ATIVO' : CONTRACT_STATUS_LABELS[c.status]?.label || c.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(c)}
                                  className="p-1.5 rounded text-[#AEB4AE] hover:text-[#F2F2ED]"
                                  title="Editar"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                </button>
                                <Link
                                  href={`/contracts/${c.id}/preview`}
                                  className="p-1.5 rounded text-[#AEB4AE] hover:text-[#F2F2ED]"
                                  title="Visualizar"
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
              <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="w-5 h-5 text-[#44755A]" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">Histórico & Auditoria</h2>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-96">
                  {data.recent_audit_logs.map((log) => (
                    <div key={log.id} className="p-3 rounded bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] space-y-1 text-xs font-mono">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#44755A]">{log.action}</span>
                        <span className="text-[#8E948E]">{formatDateBR(log.created_at)}</span>
                      </div>
                      <p className="text-[#D7D8D0] text-[10px] leading-relaxed">{log.details}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(242,242,237,0.1)] bg-[#050505]">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase font-mono tracking-wider">
                <FileEdit className="w-5 h-5 text-[#44755A]" />
                <span>Projeto #{selectedContract.contract_number}</span>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-[#AEB4AE] hover:text-[#F2F2ED] p-1 rounded hover:bg-[#121312]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContractDetails} className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Título do Projeto *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white font-medium focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Atribuição de Cliente</label>
                  <select
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white font-medium focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                  >
                    {data?.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.legal_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Status Operacional</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white font-medium focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                  >
                    <option value="FINALIZED">Finalizado / Execução (Ativo)</option>
                    <option value="READY">Pronto para Assinatura</option>
                    <option value="DRAFT">Rascunho (Elaboração)</option>
                    <option value="CANCELLED">Cancelado / Pausado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">MRR Recorrente (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editMRR}
                    onChange={(e) => setEditMRR(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Setup / Valor Único (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOneTime}
                    onChange={(e) => setEditOneTime(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Notas & Observações</label>
                <textarea
                  rows={3}
                  value={editParticularities}
                  onChange={(e) => setEditParticularities(e.target.value)}
                  placeholder="Particularidades do projeto..."
                  className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                />
              </div>

              {contractSaveSuccess && (
                <div className="p-3 bg-[#1C2E24]/30 border border-[#335943]/40 rounded text-xs text-[#44755A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configuração de projeto atualizada.</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDeleteContract}
                  disabled={savingContract}
                  className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 rounded text-xs font-bold uppercase tracking-wider"
                >
                  Excluir Projeto
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedContract(null)}
                    className="px-4 py-2 bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] rounded text-xs font-bold uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingContract}
                    className="flex items-center gap-2 px-5 py-2 bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] text-white font-bold rounded text-xs uppercase tracking-wider"
                  >
                    {savingContract ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Salvar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Novo Projeto Rápido */}
      {newProjectClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(242,242,237,0.1)] bg-[#050505]">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase font-mono tracking-wider">
                <PlusCircle className="w-5 h-5 text-[#44755A]" />
                <span>Adicionar Novo Projeto</span>
              </div>
              <button
                onClick={() => setNewProjectClientId(null)}
                className="text-[#AEB4AE] hover:text-[#F2F2ED] p-1 rounded hover:bg-[#121312]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickProject} className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Título do Projeto *</label>
                <input
                  type="text"
                  required
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white font-medium focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Honorários MRR (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProjectMRR}
                    onChange={(e) => setNewProjectMRR(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Status Inicial</label>
                  <select
                    value={newProjectStatus}
                    onChange={(e) => setNewProjectStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                  >
                    <option value="FINALIZED">Finalizado / Execução (Ativo)</option>
                    <option value="READY">Pronto para Assinatura</option>
                    <option value="DRAFT">Rascunho</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#AEB4AE] mb-1 uppercase tracking-widest text-[9px] font-bold">Observações</label>
                <textarea
                  rows={3}
                  value={newProjectNotes}
                  onChange={(e) => setNewProjectNotes(e.target.value)}
                  placeholder="Escopo inicial do projeto..."
                  className="w-full px-3 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-[#335943] focus:bg-[#1C2E24]/20 outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewProjectClientId(null)}
                  className="px-4 py-2 bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] rounded text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="flex items-center gap-2 px-5 py-2 bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] text-white font-bold rounded text-xs uppercase tracking-wider"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(242,242,237,0.1)] bg-[#050505]">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase font-mono tracking-wider">
                <FileSpreadsheet className="w-5 h-5 text-[#44755A]" />
                <span>Importar Planilha</span>
              </div>
              <button
                onClick={() => {
                  setIsSheetModalOpen(false);
                  setSheetFile(null);
                  setSheetSuccessMsg(null);
                  setSheetErrorMsg(null);
                }}
                className="text-[#AEB4AE] hover:text-[#F2F2ED] p-1 rounded hover:bg-[#121312]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSheet} className="p-6 space-y-4 text-xs font-mono">
              <p className="text-[#AEB4AE] leading-relaxed">
                Selecione o arquivo da planilha (<strong className="text-white">.xlsx, .xls ou .csv</strong>). O sistema analisará os cabeçalhos para cadastrar clientes e projetos automaticamente.
              </p>

              {sheetSuccessMsg && (
                <div className="p-3 bg-[#1C2E24]/30 border border-[#335943]/40 rounded text-xs text-[#44755A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{sheetSuccessMsg}</span>
                </div>
              )}

              {sheetErrorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-900/40 rounded text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sheetErrorMsg}</span>
                </div>
              )}

              <div className="border border-dashed border-[rgba(242,242,237,0.2)] hover:border-[#335943] rounded p-6 text-center transition-colors bg-[#121312]">
                <input
                  type="file"
                  id="sheetFile"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setSheetFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="sheetFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-[#1C2E24]/20 border border-[#335943]/30 rounded flex items-center justify-center text-[#44755A]">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {sheetFile ? sheetFile.name : 'SELECIONAR PLANILHA EXCEL / CSV'}
                    </span>
                    <span className="text-[10px] text-[#8E948E] mt-1 block">Formatos: .xlsx, .xls, .csv</span>
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
                  className="px-4 py-2 bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] rounded text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!sheetFile || importingSheet}
                  className="flex items-center gap-2 px-5 py-2 bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] text-white font-bold rounded text-xs uppercase tracking-wider"
                >
                  {importingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  <span>Importar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Importação de Contrato PDF ou DOCX */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(242,242,237,0.1)] bg-[#050505]">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase font-mono tracking-wider">
                <UploadCloud className="w-5 h-5 text-[#44755A]" />
                <span>Importar Contrato Existente</span>
              </div>
              <button
                onClick={() => {
                  setIsDocModalOpen(false);
                  setDocFile(null);
                  setDocError(null);
                }}
                className="text-[#AEB4AE] hover:text-[#F2F2ED] p-1 rounded hover:bg-[#121312]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <p className="text-[#AEB4AE] leading-relaxed">
                Carregue o arquivo do contrato (<strong className="text-white">.PDF</strong> ou <strong className="text-white">.DOCX</strong>). O leitor semântico registrará o cliente e o projeto.
              </p>

              {docError && (
                <div className="p-3 bg-red-950/40 border border-red-900/40 rounded text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{docError}</span>
                </div>
              )}

              <div className="border border-dashed border-[rgba(242,242,237,0.2)] hover:border-[#335943] rounded p-6 text-center transition-colors bg-[#121312]">
                <input
                  type="file"
                  id="dashContractFile"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="dashContractFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-[#1C2E24]/20 border border-[#335943]/30 rounded flex items-center justify-center text-[#44755A]">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {docFile ? docFile.name : 'SELECIONAR ARQUIVO PDF / DOCX'}
                    </span>
                    <span className="text-[10px] text-[#8E948E] mt-1 block">Formatos: .pdf, .docx</span>
                  </div>
                </label>
              </div>

              {/* Opção de Contrato Já Assinado */}
              <label className="flex items-start gap-3 p-3 bg-[#121312] rounded border border-[rgba(242,242,237,0.1)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alreadySigned}
                  onChange={(e) => setAlreadySigned(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#44755A] rounded bg-[#0A0A0A] border-[rgba(242,242,237,0.2)]"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block uppercase tracking-wide">Contrato já assinado</span>
                  <span className="text-[#8E948E] text-[10px] mt-0.5 block leading-relaxed">
                    Registra o cliente e marca o projeto como vigência ativa (Assinado).
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
                  className="px-4 py-2.5 bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] rounded text-xs font-bold uppercase tracking-wider"
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] text-white rounded text-xs font-bold uppercase tracking-wider"
                >
                  {importingDoc && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Processar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
