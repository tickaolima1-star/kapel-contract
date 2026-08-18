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
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Send,
  MoreVertical,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  UploadCloud,
  FileCheck,
  X,
  Loader2,
  CheckSquare,
} from 'lucide-react';
import { formatCurrency, formatDateBR, formatDocument, CONTRACT_STATUS_LABELS } from '@/lib/utils';

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados do Modal de Importação PDF/DOCX
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const loadContracts = async () => {
    try {
      const res = await fetch('/api/contracts');
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
  }, []);

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.client?.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.trade_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.document?.includes(search);

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
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
          {['ALL', 'DRAFT', 'READY', 'FINALIZED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-[#131c2e] border border-[#1e293b]'
              }`}
            >
              {st === 'ALL' ? 'Todos os Status' : CONTRACT_STATUS_LABELS[st]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table */}
      {loading ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando contratos da KAPEL...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-500 shadow-xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Nenhum contrato encontrado</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Você pode criar um novo contrato comercial ou subir um contrato já assinado em PDF/DOCX.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar PDF / DOCX</span>
            </button>
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>Criar Novo Contrato</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#131c2e]/50 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Contrato</th>
                  <th className="py-4 px-6">Cliente (Contratante)</th>
                  <th className="py-4 px-6">Tipo / Modelo</th>
                  <th className="py-4 px-6">Honorários KAPEL</th>
                  <th className="py-4 px-6">Status / Assinatura</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-slate-300">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#131c2e]/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                      #{c.contract_number}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-100">{c.client?.legal_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatDocument(c.client?.document || '')}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.template?.type === 'POLITICAL'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {c.template?.type === 'POLITICAL' ? 'POLITICAL' : 'PERFORMANCE'}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-medium">
                      {c.calculated_mrr > 0 ? (
                        <div>
                          <span className="text-emerald-400 font-bold">{formatCurrency(c.calculated_mrr)}</span>
                          <span className="text-[10px] text-slate-500 block">/mês recorrente</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-100 font-bold">{formatCurrency(c.calculated_total_one_time || 0)}</span>
                          <span className="text-[10px] text-slate-500 block">Projeto (50/50)</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit ${
                          c.status === 'FINALIZED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : c.status === 'READY'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status === 'FINALIZED' && <CheckCircle className="w-3 h-3" />}
                          {c.status === 'READY' && <Clock className="w-3 h-3" />}
                          {CONTRACT_STATUS_LABELS[c.status]?.label || c.status}
                        </span>

                        {c.signed_at && (
                          <span className="text-[10px] text-slate-500">
                            Assinado em {formatDateBR(c.signed_at)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-400">
                      {formatDateBR(c.created_at)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.signature_token && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(c.signature_token, c.id)}
                            title="Copiar Link de Assinatura Pública para WhatsApp"
                            className={`p-2 rounded-xl border transition-all ${
                              copiedId === c.id
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-[#131c2e] hover:bg-[#1e293b] text-slate-400 hover:text-slate-200 border-[#1e293b]'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <Link
                          href={`/contracts/${c.id}/preview`}
                          title="Visualizar Contrato / Assinatura"
                          className="p-2 bg-[#131c2e] hover:bg-[#1e293b] text-slate-400 hover:text-slate-200 border border-[#1e293b] rounded-xl transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          title="Excluir Contrato"
                          className="p-2 bg-[#131c2e] hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-[#1e293b] rounded-xl transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  id="contractFile"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="contractFile" className="cursor-pointer flex flex-col items-center space-y-2">
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

                      // Redireciona diretamente para a pré-visualização do contrato criado
                      router.push(data.previewUrl);
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
