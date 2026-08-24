import React from 'react';
export function CommandSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="card-custom p-5"><h2 className="font-display text-base font-bold uppercase mb-4">{title}</h2>{children}</section>; }
