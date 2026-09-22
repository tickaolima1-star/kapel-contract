'use client';

import React, { useState } from 'react';
import { Compass, ChevronDown, ChevronUp, Sun, DollarSign, Laptop, Heart } from 'lucide-react';

export function TelosCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded-lg p-4 shadow-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#1C2E24] border border-[#335943] flex items-center justify-center text-[#F2F2ED]">
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F2F2ED] group-hover:text-emerald-400 transition-colors flex items-center gap-2">
              TELOS: A Visão da Liberdade Soberana (3 Anos)
            </h2>
            <p className="text-[11px] text-[#8E948E] font-mono">
              "Acordar sem pressa, café com a esposa, sistemas em USD rodando, vida à beira-mar."
            </p>
          </div>
        </div>

        <div className="text-[#AEB4AE] group-hover:text-[#F2F2ED] transition-colors p-1">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[rgba(242,242,237,0.06)] grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
          <div className="bg-[#121312] border border-[rgba(242,242,237,0.05)] rounded p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F2F2ED] mb-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              1. A Terça-feira Perfeita
            </div>
            <p className="text-[11px] text-[#AEB4AE] leading-relaxed">
              Manhãs leves com a esposa, sol, mergulho no mar, treino físico pesado no pôr do sol e mente em paz absoluta.
            </p>
          </div>

          <div className="bg-[#121312] border border-[rgba(242,242,237,0.05)] rounded p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F2F2ED] mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              2. Ativos em Moeda Forte
            </div>
            <p className="text-[11px] text-[#AEB4AE] leading-relaxed">
              Sistemas de software proprietários (SaaS), esteiras de tráfego e infoprodutos gerando receita recorrente em Dólar e Euro.
            </p>
          </div>

          <div className="bg-[#121312] border border-[rgba(242,242,237,0.05)] rounded p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F2F2ED] mb-1">
              <Laptop className="w-3.5 h-3.5 text-sky-400" />
              3. Engenharia de Alto Impacto
            </div>
            <p className="text-[11px] text-[#AEB4AE] leading-relaxed">
              2 a 3 horas de foco cirúrgico por dia em arquitetura e produtos escaláveis, sem dependência diária de venda de horas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
