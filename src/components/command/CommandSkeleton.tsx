import React from 'react';
export function CommandSkeleton() { return <div role="status" aria-label="Carregando Command" className="grid gap-4 md:grid-cols-3">{[1,2,3].map(x => <div key={x} className="card-custom h-56 animate-pulse bg-[#121312]" />)}</div>; }
