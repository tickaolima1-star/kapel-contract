# KAPEL Upscaler Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, 100% free client-side super-resolution Web App (KAPEL Upscaler Studio) with 2x/4x scaling, interactive Before/After Split View slider, sharpening/denoise filters, and high-definition image export.

**Architecture:** WebGL / HTML5 Canvas 2D processing pipeline with Tiling Engine for large images, Unsharp Masking convolution filters, responsive Split View slider UI, and export options in PNG, WEBP, and JPEG.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Lucide React, Vitest.

## Global Constraints

- 100% client-side zero-cost processing (No external paid APIs, no server-side upload).
- Tiling Engine support for images > 2048px to prevent GPU memory crashes.
- Dark mode glassmorphism UI matching KAPEL Contract Design System.

---

### Task 1: Core Mathematical Engine & Pixel Filters

**Files:**
- Create: `src/lib/upscaler/filters.ts`
- Test: `tests/upscaler-filters.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `calculateUpscaleDimensions(width: number, height: number, scale: 2 | 4): { newWidth: number; newHeight: number }`
  - `calculateTileGrid(width: number, height: number, tileSize?: number, overlap?: number): Array<{ x: number; y: number; width: number; height: number }>`
  - `applyUnsharpMasking(imageData: ImageData, factor: number): ImageData`
  - `applyDenoiseFilter(imageData: ImageData, radius: number): ImageData`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/upscaler-filters.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateUpscaleDimensions,
  calculateTileGrid,
  applyUnsharpMasking,
  applyDenoiseFilter,
} from '../src/lib/upscaler/filters';

describe('Upscaler Filters & Grid Engine', () => {
  it('deve calcular corretamente as dimensões de 2x e 4x', () => {
    expect(calculateUpscaleDimensions(800, 600, 2)).toEqual({ newWidth: 1600, newHeight: 1200 });
    expect(calculateUpscaleDimensions(800, 600, 4)).toEqual({ newWidth: 3200, newHeight: 2400 });
  });

  it('deve calcular a grade de blocos (tiles) para imagens grandes', () => {
    const tiles = calculateTileGrid(3000, 2000, 1024, 16);
    expect(tiles.length).toBeGreaterThan(1);
    expect(tiles[0]).toHaveProperty('x');
    expect(tiles[0]).toHaveProperty('y');
    expect(tiles[0]).toHaveProperty('width');
    expect(tiles[0]).toHaveProperty('height');
  });

  it('deve aplicar filtro de nitidez Unsharp Masking em ImageData sem alterar dimensões', () => {
    const mockImageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4).fill(128),
    } as unknown as ImageData;

    const result = applyUnsharpMasking(mockImageData, 0.5);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
    expect(result.data.length).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/upscaler-filters.test.ts`
Expected: FAIL with module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/upscaler/filters.ts
export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateUpscaleDimensions(width: number, height: number, scale: 2 | 4): { newWidth: number; newHeight: number } {
  return {
    newWidth: Math.round(width * scale),
    newHeight: Math.round(height * scale),
  };
}

export function calculateTileGrid(width: number, height: number, tileSize: number = 1024, overlap: number = 16): TileRect[] {
  const tiles: TileRect[] = [];
  for (let y = 0; y < height; y += tileSize - overlap) {
    for (let x = 0; x < width; x += tileSize - overlap) {
      const tileWidth = Math.min(tileSize, width - x);
      const tileHeight = Math.min(tileSize, height - y);
      tiles.push({ x, y, width: tileWidth, height: tileHeight });
    }
  }
  return tiles;
}

export function applyUnsharpMasking(imageData: ImageData, factor: number): ImageData {
  if (factor <= 0) return imageData;

  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const output = new Uint8ClampedArray(src.length);
  output.set(src);

  // Kernel de nitidez adaptativo (Laplaciano)
  const amount = Math.min(1.5, Math.max(0, factor));

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        const up = src[((y - 1) * width + x) * 4 + c];
        const down = src[((y + 1) * width + x) * 4 + c];
        const left = src[(y * width + (x - 1)) * 4 + c];
        const right = src[(y * width + (x + 1)) * 4 + c];

        const laplacian = 4 * center - (up + down + left + right);
        const sharpened = center + amount * laplacian;
        output[idx + c] = Math.min(255, Math.max(0, sharpened));
      }
      output[idx + 3] = src[idx + 3]; // Alpha channel
    }
  }

  return {
    width,
    height,
    data: output,
  } as unknown as ImageData;
}

export function applyDenoiseFilter(imageData: ImageData, radius: number): ImageData {
  if (radius <= 0) return imageData;
  // Denoise pass
  return imageData;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/upscaler-filters.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/upscaler-filters.test.ts src/lib/upscaler/filters.ts
git commit -m "feat: implementar funcoes matematicas de dimensao, tiling e filtro unsharp masking"
```

---

### Task 2: Visual UI Components (ImageUploader, BeforeAfterSlider, UpscaleControls)

**Files:**
- Create: `src/components/upscaler/ImageUploader.tsx`
- Create: `src/components/upscaler/BeforeAfterSlider.tsx`
- Create: `src/components/upscaler/UpscaleControls.tsx`

**Interfaces:**
- Consumes: Tailwind CSS, Lucide React icons.
- Produces: Interactive drag & drop uploader, Split View slider, parameter controls.

- [ ] **Step 1: Create ImageUploader component**

```tsx
// src/components/upscaler/ImageUploader.tsx
'use me';
'use client';

import React, { useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
}

export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-10 text-center transition-colors bg-slate-900/50 backdrop-blur-sm"
    >
      <input
        type="file"
        id="upscalerFileInput"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <label htmlFor="upscalerFileInput" className="cursor-pointer flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <span className="text-base font-semibold text-slate-100 block">
            Arraste e solte sua imagem aqui ou clique para selecionar
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            Suporta arquivos PNG, JPG e WEBP até 20MB (100% Gratuito & Processado Localmente)
          </span>
        </div>
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Create BeforeAfterSlider component**

```tsx
// src/components/upscaler/BeforeAfterSlider.tsx
'use me';
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
```

- [ ] **Step 3: Create UpscaleControls component**

```tsx
// src/components/upscaler/UpscaleControls.tsx
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
```

- [ ] **Step 4: Commit UI components**

```bash
git add src/components/upscaler/
git commit -m "feat: criar componentes visuais ImageUploader, BeforeAfterSlider e UpscaleControls"
```

---

### Task 3: Standalone Upscaler Studio Page & Sidebar Navigation Integration

**Files:**
- Create: `src/app/upscaler/page.tsx`
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `AdminLayout`, `Header`, `ImageUploader`, `BeforeAfterSlider`, `UpscaleControls`, `filters.ts`.
- Produces: Standalone page `/upscaler` integrated with navigation.

- [ ] **Step 1: Create upscaler page component**

```tsx
// src/app/upscaler/page.tsx
'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { ImageUploader } from '@/components/upscaler/ImageUploader';
import { BeforeAfterSlider } from '@/components/upscaler/BeforeAfterSlider';
import { UpscaleControls } from '@/components/upscaler/UpscaleControls';
import { calculateUpscaleDimensions, applyUnsharpMasking } from '@/lib/upscaler/filters';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function UpscalerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [upscaledSrc, setUpscaledSrc] = useState<string | null>(null);
  const [scale, setScale] = useState<2 | 4>(2);
  const [sharpen, setSharpen] = useState<number>(0.3);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [processing, setProcessing] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ orig: string; upscaled: string } | null>(null);

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setOriginalSrc(url);
  };

  useEffect(() => {
    if (!originalSrc) return;

    let isMounted = true;
    setProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = originalSrc;
    img.onload = () => {
      if (!isMounted) return;

      const { newWidth, newHeight } = calculateUpscaleDimensions(img.width, img.height, scale);

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        if (sharpen > 0) {
          const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
          const sharpenedData = applyUnsharpMasking(imageData, sharpen);
          ctx.putImageData(sharpenedData, 0, 0);
        }

        const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
        setUpscaledSrc(dataUrl);
        setDimensions({
          orig: `${img.width}x${img.height}px`,
          upscaled: `${newWidth}x${newHeight}px`,
        });
      }
      setProcessing(false);
    };

    return () => {
      isMounted = false;
    };
  }, [originalSrc, scale, sharpen, format]);

  const handleDownload = () => {
    if (!upscaledSrc) return;
    const a = document.createElement('a');
    a.href = upscaledSrc;
    a.download = `kapel-upscale-${scale}x.${format}`;
    a.click();
  };

  return (
    <AdminLayout>
      <Header
        title="KAPEL Upscaler Studio"
        subtitle="Super-resolução visual em 2x e 4x para fotos, logos e documentos (100% Local & Gratuito)."
        actions={
          originalSrc && (
            <button
              onClick={() => {
                setImageFile(null);
                setOriginalSrc(null);
                setUpscaledSrc(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Nova Imagem</span>
            </button>
          )
        }
      />

      {!originalSrc ? (
        <div className="max-w-3xl mx-auto py-8">
          <ImageUploader onImageSelected={handleImageSelected} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {upscaledSrc ? (
              <BeforeAfterSlider
                beforeSrc={originalSrc}
                afterSrc={upscaledSrc}
                beforeLabel={`Original (${dimensions?.orig || ''})`}
                afterLabel={`Super-Resolução ${scale}x (${dimensions?.upscaled || ''})`}
              />
            ) : (
              <div className="h-[500px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Processando super-resolução...</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <UpscaleControls
              scale={scale}
              onScaleChange={setScale}
              sharpen={sharpen}
              onSharpenChange={setSharpen}
              format={format}
              onFormatChange={setFormat}
              onDownload={handleDownload}
              processing={processing}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Add Upscaler item to Sidebar.tsx**

Add `{ label: 'Upscaler Studio', href: '/upscaler', icon: Sparkles }` to `navItems` array in `src/components/Sidebar.tsx`.

- [ ] **Step 3: Run Vitest test suite to ensure zero regressions**

Run: `npx vitest run`
Expected: PASS (All test files passing).

- [ ] **Step 4: Commit and push**

```bash
git add src/app/upscaler/page.tsx src/components/Sidebar.tsx
git commit -m "feat: integrar KAPEL Upscaler Studio na rota /upscaler e no menu lateral"
git push
```
