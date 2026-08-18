'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { Building2, Save, CheckCircle2, AlertCircle, ShieldAlert, KeyRound, Lock } from 'lucide-react';
import { formatDocument } from '@/lib/utils';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estados da alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'A confirmação de senha não confere com a nova senha.',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordStatus({
        type: 'error',
        message: 'A nova senha deve ter no mínimo 8 caracteres.',
      });
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordStatus({
          type: 'success',
          message: 'Sua senha foi alterada com sucesso! Utilize a nova senha no próximo acesso.',
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordStatus({
          type: 'error',
          message: data.error || 'Erro ao alterar a senha.',
        });
      }
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: 'Erro de conexão ao alterar a senha.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Header
        title="Configurações da KAPEL"
        subtitle="Qualificação jurídica da CONTRATADA e gestão de segurança do acesso."
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
            <h2 className="font-bold text-slate-100 text-sm">Dados da Pessoa Jurídica CONTRATADA</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Razão Social (Nome Empresarial) *</label>
              <input
                type="text"
                required
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Nome Fantasia (Marca)</label>
              <input
                type="text"
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
                onChange={(e) => setFormData({ ...formData, cnpj: formatDocument(e.target.value) })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50 font-mono"
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
              <label className="block text-slate-400 mb-1">CPF do Representante *</label>
              <input
                type="text"
                required
                value={formData.rep_cpf}
                onChange={(e) => setFormData({ ...formData, rep_cpf: formatDocument(e.target.value) })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">E-mail Comercial *</label>
              <input
                type="email"
                required
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

        {/* Card de Alteração de Senha & Segurança */}
        <form onSubmit={handlePasswordSubmit} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-5 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-slate-100 text-sm">Segurança & Alteração de Senha</h2>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Hash Bcrypt + JWT 256
            </span>
          </div>

          {passwordStatus && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs border ${
                passwordStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {passwordStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{passwordStatus.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1">Senha Atual *</label>
              <input
                type="password"
                required
                placeholder="Informe sua senha atual"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Nova Senha (Mínimo 8 caracteres) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Nova senha forte"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Confirmar Nova Senha *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Repita a nova senha"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-[#1e293b] flex items-center justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {passwordSaving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Atualizar Senha de Acesso</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
