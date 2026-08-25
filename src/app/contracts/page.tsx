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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] hover:text-[#F2F2ED] font-bold text-[11px] font-mono tracking-wider uppercase transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar Contrato PDF / DOCX</span>
            </button>
            <Link
              href="/contracts/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#1C2E24] hover:bg-[#263F31] text-[#F2F2ED] border border-[#335943] font-bold text-[11px] font-mono tracking-wider uppercase transition-all shadow-lg shadow-[#1C2E24]/20"
            >
              <PlusCircle className="w-4 h-4 text-[#F2F2ED]" />
              <span>Novo Contrato</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded p-3 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8E948E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, documento ou número (#000001)..."
            className="w-full pl-9 pr-4 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-xs text-white placeholder-[#8E948E] focus:outline-none focus:border-[#335943] focus:bg-[#1C2E24]/20 transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 font-mono">
          {['ALL', 'DRAFT', 'READY', 'FINALIZED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase transition-all ${
                statusFilter === st
                  ? 'bg-[#1C2E24] text-[#44755A] border border-[#335943]/40'
                  : 'text-[#AEB4AE] hover:text-[#F2F2ED] bg-[#121312] border border-[rgba(242,242,237,0.1)]'
              }`}
            >
              {st === 'ALL' ? 'Todos os Status' : CONTRACT_STATUS_LABELS[st]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table */}
      {loading ? (
        <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-12 text-center text-[#AEB4AE]">
          <div className="w-8 h-8 border-2 border-[#335943] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-mono">Carregando contratos da KAPEL...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-12 text-center text-[#AEB4AE] shadow-xl">
          <FileText className="w-12 h-12 text-[#8E948E] mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">Nenhum contrato encontrado</p>
          <p className="text-xs text-[#8E948E] mt-1 max-w-sm mx-auto font-mono">
            Você pode criar um novo contrato comercial ou subir um contrato já assinado em PDF/DOCX.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#D7D8D0] hover:text-[#F2F2ED] font-mono text-xs uppercase font-bold"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar PDF / DOCX</span>
            </button>
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#1C2E24] hover:bg-[#263F31] text-[#F2F2ED] border border-[#335943] font-bold text-xs font-mono uppercase tracking-wider transition-all"
            >
              <PlusCircle className="w-4 h-4 text-[#F2F2ED]" />
              <span>Criar Novo Contrato</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[rgba(242,242,237,0.1)] bg-[#0A0A0A] text-[#AEB4AE] font-bold uppercase tracking-wider font-mono">
                  <th className="py-4 px-6">Contrato</th>
                  <th className="py-4 px-6">Cliente (Contratante)</th>
                  <th className="py-4 px-6">Tipo / Modelo</th>
                  <th className="py-4 px-6">Honorários KAPEL</th>
                  <th className="py-4 px-6">Status / Assinatura</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(242,242,237,0.1)] text-[#AEB4AE]">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1B1D1B]/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#44755A]">
                      #{c.contract_number}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#F2F2ED]">{c.client?.legal_name}</div>
                      <div className="text-[11px] text-[#8E948E] font-mono">
                        {formatDocument(c.client?.document || '')}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 border ${
                        c.template?.type === 'POLITICAL'
                          ? 'border-purple-500/20 bg-purple-500/10 text-purple-400'
                          : 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                      }`}>
                        {c.template?.type === 'POLITICAL' ? 'POLITICAL' : 'PERFORMANCE'}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-medium">
                      {c.calculated_mrr > 0 ? (
                        <div>
                          <span className="text-[#44755A] font-bold font-mono">{formatCurrency(c.calculated_mrr)}</span>
                          <span className="text-[10px] text-[#8E948E] block font-mono">/mês recorrente</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[#F2F2ED] font-bold font-mono">{formatCurrency(c.calculated_total_one_time || 0)}</span>
                          <span className="text-[10px] text-[#8E948E] block font-mono">Projeto (50/50)</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold w-fit border ${
                          c.status === 'FINALIZED'
                            ? 'bg-[#1C2E24] text-[#44755A] border-[#335943]/40'
                            : c.status === 'READY'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-[#121312] text-[#8E948E] border-[rgba(242,242,237,0.1)]'
                        }`}>
                          {c.status === 'FINALIZED' && <CheckCircle className="w-3 h-3" />}
                          {c.status === 'READY' && <Clock className="w-3 h-3" />}
                          {CONTRACT_STATUS_LABELS[c.status]?.label || c.status}
                        </span>

                        {c.signed_at && (
                          <span className="text-[10px] text-[#8E948E] font-mono">
                            Assinado em {formatDateBR(c.signed_at)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-[#8E948E] font-mono">
                      {formatDateBR(c.created_at)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.signature_token && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(c.signature_token, c.id)}
                            title="Copiar Link de Assinatura Pública para WhatsApp"
                            className={`p-2 border transition-all ${
                              copiedId === c.id
                                ? 'bg-[#1C2E24] text-[#44755A] border-[#335943]/40'
                                : 'bg-[#121312] hover:bg-[#1B1D1B] text-[#AEB4AE] hover:text-[#F2F2ED] border-[rgba(242,242,237,0.1)]'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <Link
                          href={`/contracts/${c.id}/preview`}
                          title="Visualizar Contrato / Assinatura"
                          className="p-2 bg-[#121312] hover:bg-[#1B1D1B] text-[#AEB4AE] hover:text-[#F2F2ED] border border-[rgba(242,242,237,0.1)] rounded transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          title="Excluir Contrato"
                          className="p-2 bg-[#121312] hover:bg-red-500/20 text-[#AEB4AE] hover:text-red-400 border border-[rgba(242,242,237,0.1)] rounded transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200 no-print">
          <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(242,242,237,0.1)] bg-[#050505]/50">
              <div className="flex items-center gap-2 text-[#F2F2ED] font-black uppercase font-display text-xs tracking-tight">
                <UploadCloud className="w-5 h-5 text-[#44755A]" />
                Importar Contrato Existente
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportError(null);
                }}
                className="text-[#AEB4AE] hover:text-[#F2F2ED] p-1 rounded hover:bg-[#121312] border border-transparent hover:border-[rgba(242,242,237,0.1)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#AEB4AE] font-mono leading-relaxed">
                Selecione o arquivo do contrato (<strong className="text-[#F2F2ED]">.PDF</strong> ou <strong className="text-[#F2F2ED]">.DOCX</strong>). O sistema reconhecerá automaticamente os dados cadastrais e financeiros!
              </p>

              {importError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-[rgba(242,242,237,0.1)] hover:border-[#335943]/50 rounded p-6 text-center transition-colors bg-[#121312]">
                <input
                  type="file"
                  id="contractFile"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="contractFile" className="cursor-pointer flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-[#1C2E24]/10 border border-[#335943]/30 rounded flex items-center justify-center text-[#44755A]">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#F2F2ED] block font-mono">
                      {importFile ? importFile.name : 'Clique para selecionar o PDF ou DOCX'}
                    </span>
                    <span className="text-xs text-[#8E948E] font-mono">Formatos suportados: .PDF, .DOCX</span>
                  </div>
                </label>
              </div>

              {/* Opção de Contrato Já Assinado */}
              <label className="flex items-start gap-3 p-3 bg-[#121312] rounded border border-[rgba(242,242,237,0.1)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alreadySigned}
                  onChange={(e) => setAlreadySigned(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#335943] rounded"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#F2F2ED] block uppercase font-mono text-[10px] tracking-wider">Este contrato já foi assinado pelo cliente</span>
                  <span className="text-[#AEB4AE] text-[11px]">
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
                  className="px-4 py-2.5 bg-transparent hover:bg-[#121312] text-[#AEB4AE] hover:text-[#F2F2ED] rounded font-mono text-xs uppercase font-bold transition-colors"
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1C2E24] hover:bg-[#263F31] text-[#F2F2ED] border border-[#335943] rounded font-mono text-xs uppercase font-bold tracking-wider transition-all disabled:opacity-50"
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin text-[#44755A]" />}
                  <span>Processar & Cadastrar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
