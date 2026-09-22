'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle2, Target, Clock } from 'lucide-react';
import { type ForgeSession } from '@/lib/rpg-store';

interface ForgeTimerProps {
  onCompleteSession: (durationMinutes: number, objective: string) => void;
  recentSessions: ForgeSession[];
}

export function ForgeTimer({ onCompleteSession, recentSessions }: ForgeTimerProps) {
  const [selectedDuration, setSelectedDuration] = useState(60); // minutes
  const [timeLeft, setTimeLeft] = useState(selectedDuration * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [objective, setObjective] = useState('Engenharia de Software & Forja de Ativos');
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setSessionCompleted(true);
            onCompleteSession(selectedDuration, objective);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedDuration, objective, onCompleteSession]);

  const handleStart = () => {
    setSessionCompleted(false);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSessionCompleted(false);
    setTimeLeft(selectedDuration * 60);
  };

  const handleChangeDuration = (mins: number) => {
    if (isRunning) return;
    setSelectedDuration(mins);
    setTimeLeft(mins * 60);
    setSessionCompleted(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  return (
    <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded-lg p-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F2F2ED] flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            Forja Diária (Deep Work Engine)
          </h2>
          <span className="text-[11px] font-mono text-emerald-400 bg-[#1C2E24] border border-[#335943] px-2 py-0.5 rounded">
            +100 XP / Bloco
          </span>
        </div>

        <p className="text-xs text-[#8E948E] mb-4">
          Bloco inegociável de 60 min de foco absoluto na construção de ativos e engenharia.
        </p>

        {/* Preset Selector */}
        <div className="flex gap-2 mb-4">
          {[25, 60, 90].map((mins) => (
            <button
              key={mins}
              onClick={() => handleChangeDuration(mins)}
              disabled={isRunning}
              className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold border transition-all ${
                selectedDuration === mins
                  ? 'bg-[#1C2E24] text-[#F2F2ED] border-[#335943]'
                  : 'bg-[#121312] text-[#8E948E] border-[rgba(242,242,237,0.06)] hover:text-[#F2F2ED]'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Objective Input */}
        <div className="mb-5">
          <label className="text-[11px] font-mono text-[#AEB4AE] block mb-1 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#335943]" />
            Objetivo do Bloco:
          </label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            disabled={isRunning}
            placeholder="Ex: Arquitetura do SaaS / Algoritmos"
            className="w-full bg-[#121312] border border-[rgba(242,242,237,0.1)] rounded px-3 py-1.5 text-xs text-[#F2F2ED] focus:outline-none focus:border-[#335943] font-mono"
          />
        </div>

        {/* Timer Display */}
        <div className="relative bg-[#121312] border border-[rgba(242,242,237,0.08)] rounded-lg p-6 text-center overflow-hidden mb-5">
          {/* Progress bar underlay */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#1C2E24] to-[#44755A] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />

          <div className="text-4xl md:text-5xl font-mono font-black tracking-widest text-[#F2F2ED] mb-2 drop-shadow">
            {formattedTime}
          </div>

          <div className="text-[11px] font-mono text-[#AEB4AE] flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#335943]" />
            {isRunning ? 'FORJA EM ANDAMENTO • FOCO TOTAL' : 'PRONTO PARA INICIAR'}
          </div>
        </div>

        {sessionCompleted && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs p-3 rounded mb-4 flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Forja concluída com honra!</strong> +100 XP somados ao seu perfil e atributos.
            </span>
          </div>
        )}
      </div>

      <div>
        {/* Controls */}
        <div className="flex gap-2.5">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] text-[#F2F2ED] font-mono font-bold py-2.5 rounded flex items-center justify-center gap-2 text-xs transition-all shadow-lg active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              INICIAR FORJA
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 font-mono font-bold py-2.5 rounded flex items-center justify-center gap-2 text-xs transition-all active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" />
              PAUSAR
            </button>
          )}

          <button
            onClick={handleReset}
            className="px-3 bg-[#121312] hover:bg-[#1B1D1B] border border-[rgba(242,242,237,0.1)] text-[#AEB4AE] hover:text-[#F2F2ED] rounded flex items-center justify-center transition-all"
            title="Resetar Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* History snippet */}
        {recentSessions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[rgba(242,242,237,0.06)] text-[10px] font-mono text-[#8E948E] flex justify-between items-center">
            <span>Última Forja: {new Date(recentSessions[0].timestamp).toLocaleDateString('pt-BR')}</span>
            <span className="text-[#AEB4AE]">Total: {recentSessions.length} blocos</span>
          </div>
        )}
      </div>
    </div>
  );
}
