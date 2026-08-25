'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  X,
  Tag,
  DollarSign,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { BILLING_TYPE_LABELS, formatCurrency } from '@/lib/utils';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    default_price: 0,
    billing_type: 'MONTHLY_ARREARS',
    active: true,
    order: 0,
  });

  const loadData = async () => {
    try {
      const [srvRes, catRes] = await Promise.all([
        fetch(`/api/services${selectedCategory ? `?category=${selectedCategory}` : ''}`),
        fetch('/api/categories'),
      ]);

      if (srvRes.ok && catRes.ok) {
        const srvData = await srvRes.json();
        const catData = await catRes.json();
        setServices(srvData);
        setCategories(catData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleOpenNew = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      description: '',
      default_price: 0,
      billing_type: 'MONTHLY_ARREARS',
      active: true,
      order: services.length + 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: any) => {
    setEditingService(srv);
    setFormData({
      name: srv.name,
      category_id: srv.category_id,
      description: srv.description || '',
      default_price: srv.default_price || 0,
      billing_type: srv.billing_type || 'MONTHLY_ARREARS',
      active: srv.active !== undefined ? srv.active : true,
      order: srv.order || 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setModalOpen(false);
          loadData();
        }
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setModalOpen(false);
          loadData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este serviço do catálogo?')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <Header
        title="Catálogo de Serviços"
        subtitle="Gerenciamento de soluções, precificação padrão e tipos de cobrança da KAPEL."
        actions={
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#1C2E24] hover:bg-[#263F31] text-black font-semibold text-sm shadow-lg shadow-[#1C2E24]/20 transition-all"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Adicionar Serviço</span>
          </button>
        }
      />

      {/* Category Pills Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded text-xs font-semibold transition-all ${
            selectedCategory === ''
              ? 'bg-[#1C2E24]/20 text-[#44755A] border border-emerald-500/40'
              : 'bg-[#121312] text-[#AEB4AE] border border-[rgba(242,242,237,0.1)] hover:bg-[#0A0A0A]'
          }`}
        >
          Todas as Categorias ({services.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#1C2E24]/20 text-[#44755A] border border-emerald-500/40'
                : 'bg-[#121312] text-[#AEB4AE] border border-[rgba(242,242,237,0.1)] hover:bg-[#0A0A0A]'
            }`}
          >
            {cat.name} ({cat.services?.length || 0})
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-[#AEB4AE]">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-12 text-center text-[#AEB4AE]">
          <Briefcase className="w-12 h-12 text-[#8E948E] mx-auto mb-3" />
          <p className="text-base font-semibold text-[#D7D8D0]">Nenhum serviço encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded p-6 shadow-xl flex flex-col justify-between hover:border-[rgba(242,242,237,0.1)] transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#44755A] bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                      {srv.category?.name || 'Geral'}
                    </span>
                    <h3 className="text-base font-bold text-[#F2F2ED] font-display mt-1.5">
                      {srv.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(srv)}
                      className="p-1.5 rounded text-[#AEB4AE] hover:text-white hover:bg-[#121312] transition-colors"
                      title="Editar Serviço"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(srv.id)}
                      className="p-1.5 rounded text-[#AEB4AE] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir Serviço"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#AEB4AE] mb-4 line-clamp-3 leading-relaxed">
                  {srv.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[rgba(242,242,237,0.1)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#AEB4AE]">Preço Padrão:</span>
                  <span className="text-base font-bold text-[#44755A] font-display">
                    {formatCurrency(srv.default_price)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#AEB4AE]">Modelo:</span>
                  <span className="text-[#D7D8D0] font-medium bg-[#0A0A0A] px-2 py-0.5 rounded border border-[rgba(242,242,237,0.1)]">
                    {BILLING_TYPE_LABELS[srv.billing_type] || srv.billing_type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo / Editar Serviço */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(242,242,237,0.1)] mb-5">
              <h2 className="text-lg font-bold text-white font-display">
                {editingService ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-[#AEB4AE] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#AEB4AE] mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Gestão de Tráfego Pago"
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[#AEB4AE] mb-1">Categoria *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-emerald-500/50"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#AEB4AE] mb-1">Preço Padrão (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.default_price}
                    onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[#AEB4AE] mb-1">Tipo de Cobrança *</label>
                  <select
                    value={formData.billing_type}
                    onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-emerald-500/50"
                  >
                    {Object.entries(BILLING_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#AEB4AE] mb-1">Descrição do Escopo</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhamento das atividades incluídas..."
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded text-white focus:border-emerald-500/50"
                />
              </div>

              <div className="pt-4 border-t border-[rgba(242,242,237,0.1)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded text-[#AEB4AE] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-[#1C2E24] hover:bg-[#263F31] text-black font-semibold shadow-lg shadow-[#1C2E24]/20"
                >
                  {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
