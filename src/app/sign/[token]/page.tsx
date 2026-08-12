'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, Lock, Calendar, Loader2, Award } from 'lucide-react';

interface ClientSignPageProps {
  params: { token: string };
}

export default function ClientSignPage({ params }: ClientSignPageProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [docPrefix4, setDocPrefix4] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signedResult, setSignedResult] = useState<any>(null);

  useEffect(() => {
    fetchContract();
  }, [params.token]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contracts/public/sign/${params.token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível carregar o contrato.');
      }

      setContractData(data);
      setSignerName(data.client_name || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!docPrefix4 || docPrefix4.replace(/\D/g, '').length < 4) {
      setError('Por favor, informe os 4 primeiros dígitos do seu CPF ou CNPJ.');
      return;
    }

    if (!signatureData) {
      setError('Por favor, desenhe ou digite sua assinatura/visto.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/contracts/public/sign/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_name: signerName,
          doc_prefix_4: docPrefix4,
          signature_data: signatureData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar assinatura.');
      }

      setSignedResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm font-medium">Carregando dados de assinatura do contrato...</p>
      </div>
    );
  }

  if (error && !contractData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">Acesso Inválido</h2>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <span className="text-xs text-slate-500">Se você acredita ser um erro, solicite um novo link à KAPEL.</span>
        </div>
      </div>
    );
  }

  if (signedResult || contractData?.signature_status === 'SIGNED') {
    const auditHash = signedResult?.audit_hash || contractData?.audit_hash;
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-100">Contrato Assinado com Sucesso!</h2>
            <p className="text-sm text-slate-400 mt-2">
              As assinaturas da <strong className="text-slate-200">KAPEL</strong> e do <strong className="text-slate-200">{contractData?.client_name}</strong> foram registradas com validade jurídica.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Selo de Verificação:</span>
              <span className="text-emerald-400 font-semibold">KAPEL VERIFIED</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Contrato Nº:</span>
              <span className="text-slate-200">#{contractData?.contract_number}</span>
            </div>
            <div className="break-all text-[11px] text-slate-500 pt-2 border-t border-slate-900">
              <span className="text-slate-400 block mb-1">Hash Criptográfico SHA-256 de Auditoria:</span>
              <span className="text-blue-400">{auditHash}</span>
            </div>
          </div>

          {auditHash && (
            <a
              href={`/verify/${auditHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
            >
              <Award className="w-4 h-4" />
              Ver Certificado de Validação Pública
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Branding Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 font-bold text-lg">
              K
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">Assinatura Eletrônica - KAPEL</h1>
              <p className="text-xs text-slate-400">Contrato nº #{contractData?.contract_number} — {contractData?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
            <ShieldCheck className="w-4 h-4" />
            Visto KAPEL Registrado
          </div>
        </div>

        {/* Contract Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Resumo do Contrato & Valores
            </h3>
            <span className="text-xs text-slate-400">{contractData?.kapel_company}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Contratante (Cliente)</span>
              <strong className="text-slate-200 text-sm block">{contractData?.client_name}</strong>
              <span className="text-slate-400">Documento: {contractData?.client_doc}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Contratada (Emitente)</span>
              <strong className="text-slate-200 text-sm block">{contractData?.kapel_company}</strong>
              <span className="text-slate-400">CNPJ: {contractData?.kapel_cnpj}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Item / Serviço</th>
                  <th className="py-2.5 px-4 text-right">Valor Consolidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {contractData?.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4">{item.name}</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-2 text-xs text-slate-400">
            <span>Recorrência Mensal (MRR): <strong className="text-blue-400 font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contractData?.calculated_mrr || 0)}</strong></span>
            <span>Total Pontual: <strong className="text-emerald-400 font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contractData?.calculated_total_one_time || 0)}</strong></span>
          </div>
        </div>

        {/* Signature Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <Lock className="w-4 h-4 text-blue-400" />
            Etapa de Assinatura do Cliente
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleClientSign} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome Completo do Assinante / Representante Legal
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirmação de Segurança (4 Primeiros Dígitos do seu CPF ou CNPJ)
              </label>
              <input
                type="text"
                maxLength={4}
                value={docPrefix4}
                onChange={(e) => setDocPrefix4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Ex: 1234"
                className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-blue-400 font-mono tracking-widest text-center focus:outline-none focus:border-blue-500"
                required
              />
              <span className="ml-2 text-[11px] text-slate-500">Documento do Contrato: {contractData?.client_doc}</span>
            </div>

            <div>
              <SignatureCanvas
                signerName={signerName}
                onSignatureChange={(sig) => setSignatureData(sig)}
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>Ao clicar em <strong>"Concluir Assinatura Eletrônica"</strong>, você declara a inteira aceitação dos termos contidos neste contrato. O sistema gravará seu endereço IP, data/hora UTC e criará um certificado imutável com hash criptográfico SHA-256 (MP 2.200-2/2001 e Lei 14.063/2020).</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Concluir Assinatura Eletrônica
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
