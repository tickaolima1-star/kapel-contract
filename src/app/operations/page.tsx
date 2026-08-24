'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { ProjectForm } from '@/components/operations/ProjectForm';
import { ProjectList } from '@/components/operations/ProjectList';

export default function OperationsPage() {
  const [projects, setProjects] = useState<any[]>([]); const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]); const [memberships, setMemberships] = useState<Array<{ id: string; name: string }>>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); const [p, c, command] = await Promise.all([fetch('/api/projects'), fetch('/api/clients'), fetch('/api/command')]); if (p.ok) setProjects(await p.json()); if (c.ok) setClients((await c.json()).map((x: any) => ({ id: x.id, name: x.trade_name || x.legal_name }))); if (command.ok) setMemberships((await command.json()).memberships || []); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  return <AdminLayout><Header title="Operations" subtitle="Capture projeto, objetivo e próxima ação sem atrito" /><div className="space-y-6"><ProjectForm clients={clients} memberships={memberships} onCreated={load} />{loading ? <div className="card-custom p-8 text-[#AEB4AE]">Carregando operações…</div> : <ProjectList projects={projects} memberships={memberships} onChanged={load} />}</div></AdminLayout>;
}
