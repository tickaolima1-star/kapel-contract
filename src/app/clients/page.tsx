'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { formatDocument, formatPhone, formatCEP } from '@/lib/utils';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'PJ',
    legal_name: '',
    trade_name: '',
    document: '',
    state_registration: '',
    address: '',
    address_number: '',
    neighborhood: '',
    zip_code: '',
    city: '',
    state: '',
    representative_name: '',
    representative_cpf: '',
    representative_role: '',
    email: '',
    phone: '',
    whatsapp: '',
    notes: '',
    active: true,
  });

  const loadClients = async () => {
    try {
      const url = new URL('/api/clients', window.location.origin);
      if (search) url.searchParams.set('q', search);
      if (typeFilter) url.searchParams.set('type', typeFilter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search, typeFilter]);

  const handleOpenNew = () => {
    setEditingClient(null);
    setFormData({
      type: 'PJ',
      legal_name: '',
      trade_name: '',
      document: '',
      state_registration: '',
      address: '',
      address_number: '',
      neighborhood: '',
      zip_code: '',
      city: '',
      state: '',
      representative_name: '',
      representative_cpf: '',
      representative_role: '',
      email: '',
      phone: '',
      whatsapp: '',
      notes: '',
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingClient(c);
    setFormData({
      type: c.type || 'PJ',
      legal_name: c.legal_name || '',
      trade_name: c.trade_name || '',
      document: c.document || '',
      state_registration: c.state_registration || '',
      address: c.address || '',
      address_number: c.address_number || '',
      neighborhood: c.neighborhood || '',
      zip_code: c.zip_code || '',
      city: c.city || '',
      state: c.state || '',
      representative_name: c.representative_name || '',
      representative_cpf: c.representative_cpf || '',
      representative_role: c.representative_role || '',
      email: c.email || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      notes: c.notes || '',
      active: c.active !== undefined ? c.active : true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setModalOpen(false);
          loadClients();
        }
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setModalOpen(false);
          loadClients();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <Header
        title="Gestão de Clientes"
        subtitle="Cadastro e qualificação de Pessoas Jurídicas (PJ) e Físicas (PF) da KAPEL."
        actions={
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Cadastrar Cliente</span>
          </button>
        }
      />

      {/* Filter bar */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por razão social, CNPJ, e-mail ou contato..."
            className="w-full pl-10 pr-4 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === ''
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-[#131c2e]'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setTypeFilter('PJ')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === 'PJ'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-[#131c2e]'
            }`}
          >
            Pessoa Jurídica (PJ)
          </button>
          <button
            onClick={() => setTypeFilter('PF')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === 'PF'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-[#131c2e]'
            }`}
          >
            Pessoa Física (PF)
          </button>
        </div>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-400">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-300">Nenhum cliente encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre seu primeiro cliente para iniciar a configuração de contratos.
          </p>
          <button
            onClick={handleOpenNew}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Agora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((c) => (
            <div
              key={c.id}
              className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#131c2e] border border-[#1e293b] flex items-center justify-center text-emerald-400">
                      {c.type === 'PJ' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                        {c.type}
                      </span>
                      <h3 className="font-semibold text-slate-200 text-sm mt-0.5 leading-tight">
                        {c.trade_name || c.legal_name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {c.trade_name && (
                  <p className="text-xs text-slate-400 mb-2 truncate">Razão: {c.legal_name}</p>
                )}

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
                  <p className="font-mono text-slate-300">
                    <span className="text-slate-500">{c.type === 'PJ' ? 'CNPJ: ' : 'CPF: '}</span>
                    {formatDocument(c.document)}
                  </p>

                  {c.representative_name && (
                    <p className="truncate">
                      <span className="text-slate-500">Rep: </span>
                      {c.representative_name} {c.representative_role ? `(${c.representative_role})` : ''}
                    </p>
                  )}

                  {c.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.email}</span>
                    </p>
                  )}

                  {(c.whatsapp || c.phone) && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatPhone(c.whatsapp || c.phone)}</span>
                    </p>
                  )}

                  {c.city && (
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {c.city}/{c.state}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1e293b] flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {c._count?.contracts || 0} contrato(s)
                </span>

                <Link
                  href={`/contracts/new?clientId=${c.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Gerar Contrato</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo / Editar Cliente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e293b] mb-5">
              <h2 className="text-lg font-bold text-white font-display">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Tipo */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="type"
                    value="PJ"
                    checked={formData.type === 'PJ'}
                    onChange={() => setFormData({ ...formData, type: 'PJ' })}
                    className="accent-emerald-500"
                  />
                  <span>Pessoa Jurídica (PJ)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="type"
                    value="PF"
                    checked={formData.type === 'PF'}
                    onChange={() => setFormData({ ...formData, type: 'PF' })}
                    className="accent-emerald-500"
                  />
                  <span>Pessoa Física (PF)</span>
                </label>
              </div>

              {/* Linha 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">
                    {formData.type === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                  />
                </div>
                {formData.type === 'PJ' && (
                  <div>
                    <label className="block text-slate-400 mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Linha 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">
                    {formData.type === 'PJ' ? 'CNPJ *' : 'CPF *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder={formData.type === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                  />
                </div>
                {formData.type === 'PJ' && (
                  <div>
                    <label className="block text-slate-400 mb-1">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={formData.state_registration}
                      onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                      placeholder="Ex: Isento ou 000.000.000.000"
                      className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Representante Legal (se PJ) */}
              {formData.type === 'PJ' && (
                <div className="p-3 bg-[#131c2e] rounded-xl border border-[#1e293b] space-y-3">
                  <p className="font-semibold text-slate-300">Representante Legal (para qualificação contratual)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Nome do Representante</label>
                      <input
                        type="text"
                        value={formData.representative_name}
                        onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">CPF do Representante</label>
                      <input
                        type="text"
                        value={formData.representative_cpf}
                        onChange={(e) => setFormData({ ...formData, representative_cpf: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Cargo</label>
                      <input
                        type="text"
                        value={formData.representative_role}
                        onChange={(e) => setFormData({ ...formData, representative_role: e.target.value })}
                        placeholder="Ex: Sócio-Administrador"
                        className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Endereço (Rua/Av.)</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Número</label>
                  <input
                    type="text"
                    value={formData.address_number}
                    onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">CEP</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white uppercase focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Telefone Fixo</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais para acompanhamento comercial..."
                  className="w-full px-3 py-2 bg-[#131c2e] border border-[#1e293b] rounded-xl text-white focus:border-emerald-500/50"
                />
              </div>

              <div className="pt-4 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/20"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
