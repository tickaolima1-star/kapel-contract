'use me';
'use client';

import React from 'react';
import { Download, Sliders, Zap } from 'lucide-react';

interface UpscaleControlsProps {
  scale: 2 | 4;
  onScaleChange: (scale: 2 | 4) => void;
  sharpen: number;
  onSharpenChange: (val: number) => void;
  format: 'png' | 'jpeg' | 'webp';
  onFormatChange: (fmt: 'png' | 'jpeg' | 'webp') => void;
  onDownload: () => void;
  processing: boolean;
}

export function UpscaleControls({
  scale,
  onScaleChange,
  sharpen,
  onSharpenChange,
  format,
  onFormatChange,
  onDownload,
  processing,
}: UpscaleControlsProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Parâmetros de Super-Resolução
        </h3>
        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          100% Local (GPU)
        </span>
      </div>

      {/* Fator de Escala */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 block">Fator de Escala (Upscale)</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onScaleChange(2)}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              scale === 2
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            2x HD (Ampliar 200%)
          </button>
          <button
            type="button"
            onClick={() => onScaleChange(4)}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              scale === 4
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            4x Ultra HD (Ampliar 400%)
          </button>
        </div>
      </div>

      {/* Nitidez */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-300">
          <span>Nitidez Adaptativa (Sharpening)</span>
          <span className="text-emerald-400 font-mono">{Math.round(sharpen * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={sharpen}
          onChange={(e) => onSharpenChange(parseFloat(e.target.value))}
          className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2"
        />
      </div>

      {/* Formato de Exportação */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 block">Formato de Saída</label>
        <div className="grid grid-cols-3 gap-2">
          {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => onFormatChange(fmt)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase transition-all ${
                format === fmt
                  ? 'bg-slate-700 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Botão de Download */}
      <button
        type="button"
        disabled={processing}
        onClick={onDownload}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
      >
        <Download className="w-4 h-4 text-black" />
        <span>Baixar Imagem em Alta Resolução</span>
      </button>
    </div>
  );
}
