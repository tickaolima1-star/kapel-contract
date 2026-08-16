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
      className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-10 text-center transition-colors bg-slate-900/50 backdrop-blur-sm shadow-xl"
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
