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
            className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#1C2E24] hover:bg-[#263F31] text-[#F2F2ED] border border-[#335943] font-bold text-[11px] font-mono tracking-wider uppercase transition-all shadow-lg shadow-[#1C2E24]/20"
          >
            <Plus className="w-4 h-4 text-[#F2F2ED]" />
            <span>Cadastrar Cliente</span>
          </button>
        }
      />

      {/* Filter bar */}
      <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded p-3 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8E948E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por razão social, CNPJ, e-mail ou contato..."
            className="w-full pl-9 pr-4 py-2 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded text-xs text-white placeholder-[#8E948E] focus:outline-none focus:border-[#335943] focus:bg-[#1C2E24]/20 transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold font-mono tracking-wider uppercase transition-all ${
              typeFilter === ''
                ? 'bg-[#1C2E24] text-[#44755A] border border-[#335943]/40'
                : 'text-[#AEB4AE] hover:text-[#F2F2ED] bg-transparent border border-transparent'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setTypeFilter('PJ')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold font-mono tracking-wider uppercase transition-all ${
              typeFilter === 'PJ'
                ? 'bg-[#1C2E24] text-[#44755A] border border-[#335943]/40'
                : 'text-[#AEB4AE] hover:text-[#F2F2ED] bg-transparent border border-transparent'
            }`}
          >
            Pessoa Jurídica (PJ)
          </button>
          <button
            onClick={() => setTypeFilter('PF')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold font-mono tracking-wider uppercase transition-all ${
              typeFilter === 'PF'
                ? 'bg-[#1C2E24] text-[#44755A] border border-[#335943]/40'
                : 'text-[#AEB4AE] hover:text-[#F2F2ED] bg-transparent border border-transparent'
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
        <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-12 text-center text-[#AEB4AE] shadow-xl">
          <Users className="w-12 h-12 text-[#8E948E] mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">Nenhum cliente encontrado</p>
          <p className="text-xs text-[#8E948E] mt-1 font-mono">
            Cadastre seu primeiro cliente para iniciar a configuração de contratos.
          </p>
          <button
            onClick={handleOpenNew}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded bg-[#1C2E24] hover:bg-[#263F31] text-[#F2F2ED] border border-[#335943] font-bold text-xs font-mono uppercase tracking-wider transition-all"
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
              className="card-custom bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-5 relative overflow-hidden transition-all group hover:border-[#335943]/45 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded bg-[#121312] border border-[rgba(242,242,237,0.1)] flex items-center justify-center text-[#44755A]">
                      {c.type === 'PJ' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 border border-[rgba(242,242,237,0.1)] bg-[#121312] text-[#AEB4AE]">
                        {c.type}
                      </span>
                      <h3 className="font-semibold text-[#F2F2ED] text-sm mt-0.5 leading-tight">
                        {c.trade_name || c.legal_name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded text-[#AEB4AE] hover:text-[#F2F2ED] hover:bg-[#1B1D1B] transition-colors border border-transparent hover:border-[rgba(242,242,237,0.1)]"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded text-[#AEB4AE] hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-transparent"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {c.trade_name && (
                  <p className="text-xs text-[#AEB4AE] mb-2 truncate">Razão: {c.legal_name}</p>
                )}

                <div className="space-y-1.5 text-xs text-[#AEB4AE] pt-2 border-t border-[rgba(242,242,237,0.1)]">
                  <p className="font-mono text-[#F2F2ED]">
                    <span className="text-[#8E948E]">{c.type === 'PJ' ? 'CNPJ: ' : 'CPF: '}</span>
                    {formatDocument(c.document)}
                  </p>

                  {c.representative_name && (
                    <p className="truncate">
                      <span className="text-[#8E948E]">Rep: </span>
                      {c.representative_name} {c.representative_role ? `(${c.representative_role})` : ''}
                    </p>
                  )}

                  {c.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#8E948E]" />
                      <span className="font-mono">{c.email}</span>
                    </p>
                  )}

                  {(c.whatsapp || c.phone) && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#8E948E]" />
                      <span className="font-mono">{formatPhone(c.whatsapp || c.phone)}</span>
                    </p>
                  )}

                  {c.city && (
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-[#8E948E]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {c.city}/{c.state}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[rgba(242,242,237,0.1)] flex items-center justify-between">
                <span className="text-[11px] text-[#8E948E] font-mono">
                  {c._count?.contracts || 0} contrato(s)
                </span>

                <Link
                  href={`/contracts/new?clientId=${c.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#44755A] hover:text-[#335943] transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(242,242,237,0.1)] mb-5">
              <h2 className="text-lg font-black text-[#F2F2ED] font-display uppercase tracking-tight">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-[#AEB4AE] hover:text-[#F2F2ED] hover:bg-[#121312] border border-transparent hover:border-[rgba(242,242,237,0.1)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Tipo */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-[#AEB4AE] hover:text-[#F2F2ED] transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value="PJ"
                    checked={formData.type === 'PJ'}
                    onChange={() => setFormData({ ...formData, type: 'PJ' })}
                    className="accent-[#335943]"
                  />
                  <span className="font-mono uppercase tracking-wider text-[11px] font-bold">Pessoa Jurídica (PJ)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#AEB4AE] hover:text-[#F2F2ED] transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value="PF"
                    checked={formData.type === 'PF'}
                    onChange={() => setFormData({ ...formData, type: 'PF' })}
                    className="accent-[#335943]"
                  />
                  <span className="font-mono uppercase tracking-wider text-[11px] font-bold">Pessoa Física (PF)</span>
                </label>
              </div>

              {/* Linha 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[10px]">
                    {formData.type === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
                {formData.type === 'PJ' && (
                  <div>
                    <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[10px]">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Linha 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[10px]">
                    {formData.type === 'PJ' ? 'CNPJ *' : 'CPF *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder={formData.type === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
                {formData.type === 'PJ' && (
                  <div>
                    <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[10px]">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={formData.state_registration}
                      onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                      placeholder="Ex: Isento ou 000.000.000.000"
                      className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Representante Legal (se PJ) */}
              {formData.type === 'PJ' && (
                <div className="p-4 bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded space-y-3">
                  <p className="font-bold text-[#F2F2ED] font-mono uppercase tracking-wider text-[10px]">Representante Legal (Qualificação Contratual)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Nome do Representante</label>
                      <input
                        type="text"
                        value={formData.representative_name}
                        onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">CPF do Representante</label>
                      <input
                        type="text"
                        value={formData.representative_cpf}
                        onChange={(e) => setFormData({ ...formData, representative_cpf: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Cargo</label>
                      <input
                        type="text"
                        value={formData.representative_role}
                        onChange={(e) => setFormData({ ...formData, representative_role: e.target.value })}
                        placeholder="Ex: Sócio-Administrador"
                        className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Endereço (Rua/Av.)</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Número</label>
                  <input
                    type="text"
                    value={formData.address_number}
                    onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Bairro</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">CEP</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="00000-000"
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Estado (UF)</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] uppercase focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Telefone Fixo</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#AEB4AE] mb-1 font-mono uppercase tracking-wider text-[9px]">Observações Internas</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais para acompanhamento comercial..."
                  className="w-full px-4 py-2.5 bg-[rgba(242,242,237,0.04)] border border-[rgba(242,242,237,0.12)] rounded text-[#F2F2ED] focus:outline-none focus:border-[#335943] focus:bg-[rgba(28,46,36,0.2)] transition-all font-mono text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[rgba(242,242,237,0.1)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded text-[#AEB4AE] hover:text-[#F2F2ED] font-mono text-xs uppercase font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-[#1C2E24] hover:bg-[#263F31] text-[#F2F2ED] border border-[#335943] font-bold text-xs font-mono uppercase tracking-wider transition-all"
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
