'use client';

import React, { useState } from 'react';
import { DollarSign, ShieldCheck, CheckCircle2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { type FinancialTarget, calculateAlforriaProjection } from '@/lib/rpg-store';

interface AlforriaTrackerProps {
  financial: FinancialTarget;
  onUpdateFinancial?: (newTarget: FinancialTarget) => void;
}

export function AlforriaTracker({ financial, onUpdateFinancial }: AlforriaTrackerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [debtCurrent, setDebtCurrent] = useState(financial.debtCurrent);
  const [monthlySurplus, setMonthlySurplus] = useState(financial.monthlySurplus);

  const projection = calculateAlforriaProjection(
    financial.debtTotal,
    monthlySurplus,
    debtCurrent
  );

  const handleSave = () => {
    if (onUpdateFinancial) {
      onUpdateFinancial({
        ...financial,
        debtCurrent: Number(debtCurrent) || 0,
        monthlySurplus: Number(monthlySurplus) || 0,
      });
    }
    setIsEditing(false);
  };

  const milestones = [
    { label: '25% Quitada', pct: 25, reached: projection.paidPercentage >= 25 },
    { label: '50% (Ponto de Inflexão)', pct: 50, reached: projection.paidPercentage >= 50 },
    { label: '75% (Reta Final)', pct: 75, reached: projection.paidPercentage >= 75 },
    { label: '100% Alforria Total', pct: 100, reached: projection.paidPercentage >= 100 },
  ];

  return (
    <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded-lg p-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F2F2ED] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Operação Alforria (Blindagem de Caixa)
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-[11px] font-mono text-[#AEB4AE] hover:text-[#F2F2ED] bg-[#121312] border border-[rgba(242,242,237,0.06)] px-2 py-0.5 rounded transition-colors"
          >
            {isEditing ? 'Fechar' : 'Ajustar'}
          </button>
        </div>

        <p className="text-xs text-[#8E948E] mb-4">
          Meta prioritária da Fase 1: Extinção do passivo no BB para estancar o dreno mental e blindar o patrimônio.
        </p>

        {isEditing && (
          <div className="bg-[#121312] border border-[#335943] rounded-md p-3.5 mb-4 space-y-3">
            <h3 className="text-xs font-bold text-[#F2F2ED] uppercase tracking-wider font-mono">
              Calibrar Parâmetros Financeiros
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-[#8E948E] block mb-1">
                  Saldo Devedor Atual (R$):
                </label>
                <input
                  type="number"
                  value={debtCurrent}
                  onChange={(e) => setDebtCurrent(Number(e.target.value))}
                  className="w-full bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded px-2.5 py-1.5 text-xs text-[#F2F2ED] font-mono focus:outline-none focus:border-[#335943]"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#8E948E] block mb-1">
                  Superávit Mensal (R$):
                </label>
                <input
                  type="number"
                  value={monthlySurplus}
                  onChange={(e) => setMonthlySurplus(Number(e.target.value))}
                  className="w-full bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded px-2.5 py-1.5 text-xs text-[#F2F2ED] font-mono focus:outline-none focus:border-[#335943]"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] text-[#F2F2ED] text-xs font-mono font-bold rounded"
              >
                Salvar Ajuste
              </button>
            </div>
          </div>
        )}

        {/* Big Numbers */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.06)] rounded-md p-3">
            <span className="text-[10px] font-mono text-[#8E948E] uppercase block mb-1">
              Saldo Devedor
            </span>
            <div className="text-lg md:text-xl font-mono font-black text-rose-300">
              R$ {debtCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono text-[#8E948E]">
              Original: R$ {financial.debtTotal.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="bg-[#121312] border border-[rgba(242,242,237,0.06)] rounded-md p-3">
            <span className="text-[10px] font-mono text-[#8E948E] uppercase block mb-1">
              Superávit Livre
            </span>
            <div className="text-lg md:text-xl font-mono font-black text-emerald-400">
              +R$ {monthlySurplus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-xs text-[#8E948E] font-normal">/mês</span>
            </div>
            <span className="text-[10px] font-mono text-[#8E948E]">
              (RL Growth + Simone)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
            <span className="text-[#AEB4AE]">PROGRESSO DA QUITAÇÃO</span>
            <span className="text-[#F2F2ED] font-bold">
              {projection.paidPercentage.toFixed(1)}% CONCLUÍDO
            </span>
          </div>
          <div className="w-full h-3 bg-[#050505] rounded-full overflow-hidden border border-[rgba(242,242,237,0.06)] relative">
            <div
              className="h-full bg-gradient-to-r from-rose-900 via-amber-800 to-emerald-600 rounded-full transition-all duration-700"
              style={{ width: `${projection.paidPercentage}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4">
          {milestones.map((m) => (
            <div
              key={m.label}
              className={`p-1.5 rounded border text-[10px] font-mono text-center transition-all ${
                m.reached
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300 font-bold'
                  : 'bg-[#121312] border-[rgba(242,242,237,0.05)] text-[#8E948E]'
              }`}
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Projection Footer */}
      <div className="pt-3 border-t border-[rgba(242,242,237,0.06)] flex items-center justify-between text-xs font-mono text-[#AEB4AE]">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#335943]" />
          Estimativa de Alforria:
        </span>
        <strong className="text-emerald-400">
          ~{projection.monthsRemaining} {projection.monthsRemaining === 1 ? 'mês' : 'meses'} (com aporte integral)
        </strong>
      </div>
    </div>
  );
}
