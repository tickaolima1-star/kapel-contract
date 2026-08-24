import React from 'react';
export function CommandErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div role="alert" className="card-custom p-8 text-center"><p className="text-red-400">{message}</p><button className="btn-custom mt-4" onClick={onRetry}>Tentar novamente</button></div>; }
