'use client';
import React, { useState } from 'react';

export function QuickUpdateForm({ projectId, memberships, onSaved }: { projectId: string; memberships: Array<{ id: string; name: string }>; onSaved: () => void }) {
  const [open, setOpen] = useState(false); const [error, setError] = useState('');
  const [data, setData] = useState({ summary: '', nextAction: '', assignee: '', dueAt: '', blocker: '', metricLabel: '', metricValue: '' });
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); const response = await fetch(`/api/projects/${projectId}/updates`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ summary: data.summary, nextAction: data.nextAction, nextActionAssigneeMembershipId: data.assignee || undefined, nextActionDueAt: data.dueAt ? new Date(data.dueAt).toISOString() : undefined, blocker: data.blocker, blockerResponsibleParty: data.blocker ? 'CLIENT' : undefined, metricLabel: data.metricLabel, metricValue: data.metricValue }) }); if (!response.ok) { const body = await response.json(); setError(body.error || 'Não foi possível salvar.'); return; } setData({ summary: '', nextAction: '', assignee: '', dueAt: '', blocker: '', metricLabel: '', metricValue: '' }); setOpen(false); onSaved(); };
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn-custom">Adicionar check-in</button>;
  return <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-mono">Resumo<input required className="w-full bg-[#050505] border border-white/10 p-2" value={data.summary} onChange={e => setData({ ...data, summary: e.target.value })} /></label>
    <label className="text-xs font-mono">Próxima ação<input required className="w-full bg-[#050505] border border-white/10 p-2" value={data.nextAction} onChange={e => setData({ ...data, nextAction: e.target.value })} /></label>
    <label className="text-xs font-mono">Responsável<select required className="w-full bg-[#050505] border border-white/10 p-2" value={data.assignee} onChange={e => setData({ ...data, assignee: e.target.value })}><option value="">Selecione</option>{memberships.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label className="text-xs font-mono">Prazo<input required type="datetime-local" className="w-full bg-[#050505] border border-white/10 p-2" value={data.dueAt} onChange={e => setData({ ...data, dueAt: e.target.value })} /></label>
    <label className="text-xs font-mono">Bloqueio opcional<input className="w-full bg-[#050505] border border-white/10 p-2" value={data.blocker} onChange={e => setData({ ...data, blocker: e.target.value })} /></label>
    <label className="text-xs font-mono">Métrica principal<input className="w-full bg-[#050505] border border-white/10 p-2" value={data.metricValue} onChange={e => setData({ ...data, metricValue: e.target.value })} /></label>
    {error && <p role="alert" className="text-red-400 sm:col-span-2">{error}</p>}<button className="btn-custom btn-custom-primary" type="submit">Salvar check-in</button><button className="btn-custom" type="button" onClick={() => setOpen(false)}>Cancelar</button>
  </form>;
}
