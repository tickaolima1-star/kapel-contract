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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all shadow-md"
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
