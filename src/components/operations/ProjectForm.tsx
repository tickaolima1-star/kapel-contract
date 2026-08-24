'use client';
import React, { useState } from 'react';

type Option = { id: string; name: string };
export function ProjectForm({ clients, memberships, onCreated }: { clients: Option[]; memberships: Option[]; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', objective: '', contractingClientId: '', ownerMembershipId: '', initialActionTitle: '', initialActionDueAt: '', initialActionMinutes: '30' });
  const [error, setError] = useState('');
  const change = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(current => ({ ...current, [key]: event.target.value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    const response = await fetch('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      contractingClientId: form.contractingClientId, ownerMembershipId: form.ownerMembershipId, name: form.name, objective: form.objective,
      status: 'ACTIVE', health: 'HEALTHY', source: 'MANUAL', weeklyHoursEstimate: 0, monthlyValueAtRisk: 0, strategicValue: 3, mentalLoad: 3,
      initialWorkItem: { title: form.initialActionTitle, assigneeMembershipId: form.ownerMembershipId, dueAt: form.initialActionDueAt ? new Date(form.initialActionDueAt).toISOString() : undefined, estimatedMinutes: Number(form.initialActionMinutes) },
    }) });
    if (!response.ok) { const data = await response.json(); setError(data.error || 'Não foi possível criar o projeto.'); return; }
    setForm(current => ({ ...current, name: '', objective: '', initialActionTitle: '', initialActionDueAt: '' })); onCreated();
  };
  const input = 'w-full rounded border border-[rgba(242,242,237,0.1)] bg-[#050505] px-3 py-2 text-sm text-[#F2F2ED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#44755A]';
  return <form onSubmit={submit} className="card-custom p-5 space-y-4" aria-label="Criar projeto operacional">
    <h2 className="font-display text-lg font-bold uppercase">Novo projeto + primeira ação</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-xs font-mono text-[#AEB4AE]">Contratante<select required value={form.contractingClientId} onChange={change('contractingClientId')} className={input}><option value="">Selecione</option>{clients.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label className="text-xs font-mono text-[#AEB4AE]">Responsável<select required value={form.ownerMembershipId} onChange={change('ownerMembershipId')} className={input}><option value="">Selecione</option>{memberships.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label className="text-xs font-mono text-[#AEB4AE]">Projeto<input required value={form.name} onChange={change('name')} className={input} /></label>
      <label className="text-xs font-mono text-[#AEB4AE]">Objetivo<input required value={form.objective} onChange={change('objective')} className={input} /></label>
      <label className="text-xs font-mono text-[#AEB4AE]">Próxima ação<input required value={form.initialActionTitle} onChange={change('initialActionTitle')} className={input} /></label>
      <label className="text-xs font-mono text-[#AEB4AE]">Prazo<input required type="datetime-local" value={form.initialActionDueAt} onChange={change('initialActionDueAt')} className={input} /></label>
      <label className="text-xs font-mono text-[#AEB4AE]">Minutos estimados<input required min="1" type="number" value={form.initialActionMinutes} onChange={change('initialActionMinutes')} className={input} /></label>
    </div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <button className="btn-custom btn-custom-primary" type="submit">Criar projeto e ação</button>
  </form>;
}
