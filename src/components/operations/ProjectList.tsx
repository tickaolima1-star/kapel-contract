import React from 'react';
import { QuickUpdateForm } from './QuickUpdateForm';
export function ProjectList({ projects, memberships, onChanged }: { projects: any[]; memberships: Array<{ id: string; name: string }>; onChanged: () => void }) {
  if (!projects.length) return <div className="card-custom p-8 text-center text-[#AEB4AE] font-mono">Nenhum projeto operacional. Cadastre o primeiro acima com sua próxima ação.</div>;
  return <div className="space-y-4">{projects.map(project => <article key={project.id} className="card-custom p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-mono text-xs text-[#44755A]">{project.health}</p><h2 className="font-display font-bold text-lg">{project.name}</h2><p className="text-sm text-[#AEB4AE]">{project.objective}</p></div><span className="font-mono text-xs text-[#AEB4AE]">{project.status}</span></div><QuickUpdateForm projectId={project.id} memberships={memberships} onSaved={onChanged} /></article>)}</div>;
}
