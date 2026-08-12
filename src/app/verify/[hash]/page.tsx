'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, Calendar, CheckCircle2, AlertCircle, FileText, Loader2, ArrowLeft } from 'lucide-react';

interface VerifyPageProps {
  params: { hash: string };
}

export default function VerifyPage({ params }: VerifyPageProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, [params.hash]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contracts/public/verify/${params.hash}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Não foi possível verificar a autenticidade deste contrato.');
      }

      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-medium">Validando certificado de auditoria criptográfica...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-100">Certificado Inválido ou Não Encontrado</h2>
          <p className="text-sm text-slate-400">{error || 'O hash de auditoria fornecido não corresponde a nenhum registro válido.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Verified Shield Card */}
        <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Award className="w-48 h-48 text-emerald-400" />
          </div>

          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Autenticidade Confirmada
          </span>

          <h1 className="text-xl font-extrabold text-slate-100">{data.badge}</h1>
          <p className="text-xs text-slate-400 mt-2">
            Certificado de Auditoria de Assinatura Eletrônica em conformidade com a MP 2.200-2/2001 e a Lei nº 14.063/2020.
          </p>
        </div>

        {/* Contract Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Dados do Documento Assinado
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Número do Contrato:</span>
              <strong className="text-slate-200 text-sm">#{data.contract_number}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Título do Contrato:</span>
              <strong className="text-slate-200 text-sm">{data.contract_title}</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] break-all">
            <span className="text-slate-500 block mb-1">Hash SHA-256 de Auditoria (Imutável):</span>
            <span className="text-emerald-400 font-bold">{data.audit_hash}</span>
          </div>
        </div>

        {/* Signers Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KAPEL Signer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-blue-400">Primeiro Assinante (KAPEL)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs space-y-1.5">
              <div>
                <span className="text-slate-500 block">Razão Social:</span>
                <strong className="text-slate-200">{data.kapel.company}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Assinante:</span>
                <span className="text-slate-300">{data.kapel.signer_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">CNPJ:</span>
                <span className="text-slate-300">{data.kapel.cnpj}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Data/Hora UTC:</span>
                <span className="text-slate-300">{data.kapel.signed_at ? new Date(data.kapel.signed_at).toLocaleString('pt-BR') : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Endereço IP:</span>
                <span className="text-slate-400 font-mono">{data.kapel.ip}</span>
              </div>
            </div>

            {data.kapel.signature_data && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-1">Visto Registrado:</span>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-center">
                  <img src={data.kapel.signature_data} alt="Visto KAPEL" className="max-h-12 object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* Client Signer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-blue-400">Segundo Assinante (CLIENTE)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs space-y-1.5">
              <div>
                <span className="text-slate-500 block">Razão Social / Nome:</span>
                <strong className="text-slate-200">{data.client.legal_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Assinante:</span>
                <span className="text-slate-300">{data.client.signer_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">CPF / CNPJ:</span>
                <span className="text-slate-300">{data.client.document}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Data/Hora UTC:</span>
                <span className="text-slate-300">{data.client.signed_at ? new Date(data.client.signed_at).toLocaleString('pt-BR') : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Endereço IP:</span>
                <span className="text-slate-400 font-mono">{data.client.ip}</span>
              </div>
            </div>

            {data.client.signature_data && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-1">Visto Registrado:</span>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-center">
                  <img src={data.client.signature_data} alt="Visto Cliente" className="max-h-12 object-contain" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Disclaimer Footer */}
        <div className="text-center text-[11px] text-slate-500 pt-4">
          <span>KAPEL Contract System — Plataforma Oficial de Emissão e Auditoria de Contratos Digitais</span>
        </div>
      </div>
    </div>
  );
}
