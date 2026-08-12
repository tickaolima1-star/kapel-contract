'use me';
'use client';

import React, { useState } from 'react';
import { SignatureCanvas } from './SignatureCanvas';
import { X, CheckCircle, ShieldCheck, Copy, ExternalLink, Loader2 } from 'lucide-react';

interface KapelSignModalProps {
  contractId: string;
  contractNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  defaultRepName?: string;
  defaultCnpj?: string;
}

export function KapelSignModal({
  contractId,
  contractNumber,
  isOpen,
  onClose,
  onSuccess,
  defaultRepName = 'Patrick Eduardo Lima Silva',
  defaultCnpj = '67.726.428/0001-97',
}: KapelSignModalProps) {
  const [signerName, setSignerName] = useState(defaultRepName);
  const [docPrefix4, setDocPrefix4] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!docPrefix4 || docPrefix4.replace(/\D/g, '').length < 4) {
      setError('Informe os 4 primeiros dígitos do CNPJ da KAPEL (ex: 6772).');
      return;
    }

    if (!signatureData) {
      setError('Por favor, desenhe ou digite o visto/assinatura.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/contracts/${contractId}/sign-kapel`, {
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
        throw new Error(data.error || 'Erro ao processar assinatura.');
      }

      setGeneratedToken(data.signature_token);
      onSuccess(data.signature_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clientSignUrl = generatedToken ? `${window.location.origin}/sign/${generatedToken}` : '';

  const copyToClipboard = () => {
    if (!clientSignUrl) return;
    navigator.clipboard.writeText(clientSignUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Assinatura KAPEL - Contrato #{contractNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {generatedToken ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-100">Assinatura KAPEL Registrada!</h4>
              <p className="text-sm text-slate-400">
                O visto do representante foi gravado com sucesso. Envie o link abaixo para o cliente assinar:
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-left">
                <input
                  type="text"
                  readOnly
                  value={clientSignUrl}
                  className="bg-transparent w-full text-xs text-blue-400 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <a
                  href={clientSignUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Página do Cliente
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSign} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Representante KAPEL
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirmação de Segurança (4 Primeiros Dígitos do CNPJ KAPEL)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={docPrefix4}
                  onChange={(e) => setDocPrefix4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Ex: 6772"
                  className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-blue-400 font-mono tracking-widest text-center focus:outline-none focus:border-blue-500"
                  required
                />
                <span className="ml-2 text-[11px] text-slate-500">CNPJ Registrado: {defaultCnpj}</span>
              </div>

              <div>
                <SignatureCanvas
                  signerName={signerName}
                  onSignatureChange={(sig) => setSignatureData(sig)}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assinar & Gerar Link do Cliente
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
