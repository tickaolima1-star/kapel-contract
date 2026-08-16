'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Original',
  afterLabel = 'Super-Resolução (4x)',
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={() => (isDragging.current = true)}
      onMouseUp={() => (isDragging.current = false)}
      onMouseLeave={() => (isDragging.current = false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className="relative w-full h-[500px] rounded-2xl overflow-hidden select-none border border-slate-800 bg-slate-950 shadow-2xl cursor-ew-resize"
    >
      {/* After Image (Background) */}
      <img
        src={afterSrc}
        alt="After Upscale"
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Before Image (Clipped Foreground) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeSrc}
          alt="Before Upscale"
          className="absolute inset-0 w-full h-full object-contain max-w-none"
          style={{ width: containerRef.current?.clientWidth || '100%' }}
        />
      </div>

      {/* Vertical Split Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] cursor-ew-resize"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl">
          <ArrowLeftRight className="w-4 h-4" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-emerald-500/30 text-xs font-semibold text-emerald-400">
        {afterLabel}
      </div>
    </div>
  );
}
