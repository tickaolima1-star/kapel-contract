'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { Building2, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { formatDocument } from '@/lib/utils';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    legal_name: '67.726.428 PATRICK EDUARDO LIMA SILVA',
    trade_name: 'KAPEL',
    cnpj: '67.726.428/0001-97',
    address: 'Av. Paulista, 1000, Sala 501',
    neighborhood: 'Bela Vista',
    zip_code: '01310-100',
    city: 'São Paulo',
    state: 'SP',
    legal_representative: 'Patrick Eduardo Lima Silva',
    rep_cpf: '123.456.789-00',
    email: 'contato@kapel.digital',
    phone: '+55 (11) 98765-4321',
    jurisdiction_city: 'São Paulo',
    jurisdiction_state: 'SP',
  });

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Header
        title="Configurações da KAPEL"
        subtitle="Qualificação jurídica da CONTRATADA para geração automática nos contratos."
      />

      <div className="max-w-3xl space-y-6">
        {/* Banner de Conformidade Jurídica */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-200">Atenção à Qualificação Jurídica da KAPEL</p>
            <p className="text-amber-300/80">
              A empresa opera como empresário individual sob o nome empresarial <strong>67.726.428 PATRICK EDUARDO LIMA SILVA</strong> (CNPJ: 67.726.428/0001-97). Não utilize &quot;KAPEL LTDA.&quot; nos contratos pois esta pessoa jurídica não existe atualmente.
            </p>
          </div>
        </div>

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Dados da KAPEL atualizados com sucesso. Novos contratos utilizarão esta qualificação.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-5 text-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-[#1e293b]">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-display">Dados Cadastrais da Contratada</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Razão Social / Nome Empresarial *</label>
              <input
                type="text"
                required
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Nome de Apresentação / Marca</label>
              <input
                type="text"
                required
                value={formData.trade_name}
                onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">CNPJ *</label>
              <input
                type="text"
                required
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Representante Legal *</label>
              <input
                type="text"
                required
                value={formData.legal_representative}
                onChange={(e) => setFormData({ ...formData, legal_representative: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">CPF do Representante</label>
              <input
                type="text"
                value={formData.rep_cpf}
                onChange={(e) => setFormData({ ...formData, rep_cpf: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">E-mail Corporativo</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Endereço Comercial</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Bairro</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">CEP</label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Cidade do Foro de Eleição *</label>
              <input
                type="text"
                required
                value={formData.jurisdiction_city}
                onChange={(e) => setFormData({ ...formData, jurisdiction_city: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">UF do Foro *</label>
              <input
                type="text"
                required
                maxLength={2}
                value={formData.jurisdiction_state}
                onChange={(e) => setFormData({ ...formData, jurisdiction_state: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white uppercase focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-[#1e293b] flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
