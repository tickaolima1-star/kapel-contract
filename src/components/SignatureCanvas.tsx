'use me';
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Type, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  signerName?: string;
}

export function SignatureCanvas({ onSignatureChange, signerName = '' }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(signerName);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (mode === 'type' && typedName.trim()) {
      renderTypedSignature();
    }
  }, [typedName, mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b82f6'; // Tailwind Blue 500
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();

    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      emitSignature();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setTypedName('');
    onSignatureChange(null);
  };

  const renderTypedSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!typedName.trim()) {
      setHasSignature(false);
      onSignatureChange(null);
      return;
    }

    ctx.font = 'italic bold 28px "Dancing Script", "Georgia", cursive, serif';
    ctx.fillStyle = '#3b82f6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    setHasSignature(true);
    emitSignature();
  };

  const emitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Visto / Assinatura Digital
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('draw');
              clearCanvas();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'draw'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Desenhar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('type');
              clearCanvas();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'type'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Digitar
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 transition-all"
            title="Limpar assinatura"
          >
            <Eraser className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      </div>

      {mode === 'type' && (
        <div className="mb-3">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Digite seu nome completo para assinar..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="relative w-full h-40 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />

        {!hasSignature && mode === 'draw' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-600">
            <PenTool className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-xs">Desenhe sua assinatura aqui usando mouse ou touch</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>Assinatura Eletrônica Simples / Avançada (Lei 14.063/2020)</span>
        {hasSignature ? (
          <span className="text-emerald-400 font-medium flex items-center gap-1">✓ Visto Capturado</span>
        ) : (
          <span className="text-amber-500">Aguardando Visto</span>
        )}
      </div>
    </div>
  );
}
