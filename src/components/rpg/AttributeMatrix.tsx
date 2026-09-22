'use client';

import React from 'react';
import { Megaphone, Brain, Shield, Zap, Terminal, TrendingUp, Info } from 'lucide-react';
import { type AttributeKey, type CombatAttribute } from '@/lib/rpg-store';

interface AttributeMatrixProps {
  attributes: Record<AttributeKey, CombatAttribute>;
}

const ICON_MAP = {
  mkt: Megaphone,
  data: Brain,
  discipline: Shield,
  energy: Zap,
  code: Terminal,
};

export function AttributeMatrix({ attributes }: AttributeMatrixProps) {
  const items = Object.values(attributes);

  return (
    <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded-lg p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#F2F2ED] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#335943]" />
          Atributos de Combate & Criação
        </h2>
        <span className="text-[11px] font-mono text-[#8E948E] bg-[#121312] px-2 py-0.5 rounded border border-[rgba(242,242,237,0.05)]">
          Escala 1 a 100
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {items.map((attr) => {
          const Icon = ICON_MAP[attr.key] || Brain;
          const percentage = Math.min(100, Math.max(0, attr.value));

          return (
            <div
              key={attr.key}
              className="bg-[#121312] border border-[rgba(242,242,237,0.08)] hover:border-[#335943] transition-all rounded-md p-3.5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded bg-[#1C2E24] border border-[#335943] flex items-center justify-center text-[#F2F2ED] group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4 text-[#AEB4AE]" />
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-mono font-black text-[#F2F2ED]">
                      {attr.value}
                    </span>
                    <span className="text-[10px] font-mono text-[#8E948E]">/100</span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[#F2F2ED] tracking-wide mb-1">
                  {attr.label}
                </h3>
                <p className="text-[11px] text-[#8E948E] line-clamp-2 leading-relaxed mb-3">
                  {attr.description}
                </p>
              </div>

              <div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#050505] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-[#1C2E24] to-[#335943] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Buff Tag */}
                <div className="text-[10px] font-mono text-[#AEB4AE] bg-[#0A0A0A] px-2 py-1 rounded border border-[rgba(242,242,237,0.05)] truncate">
                  ⚡ {attr.buff}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
