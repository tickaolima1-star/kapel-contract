'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { ImageUploader } from '@/components/upscaler/ImageUploader';
import { BeforeAfterSlider } from '@/components/upscaler/BeforeAfterSlider';
import { UpscaleControls } from '@/components/upscaler/UpscaleControls';
import { calculateUpscaleDimensions, applyUnsharpMasking } from '@/lib/upscaler/filters';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export default function UpscalerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [upscaledSrc, setUpscaledSrc] = useState<string | null>(null);
  const [scale, setScale] = useState<2 | 4>(2);
  const [sharpen, setSharpen] = useState<number>(0.2);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ orig: string; upscaled: string } | null>(null);

  const handleImageSelected = (file: File) => {
    setErrorMsg(null);
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setOriginalSrc(url);
  };

  useEffect(() => {
    if (!originalSrc) return;

    let isMounted = true;
    setProcessing(true);
    setErrorMsg(null);

    const timer = setTimeout(() => {
      const img = new Image();
      
      // Do NOT set crossOrigin for blob/data URLs
      if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }

      img.onerror = () => {
        if (!isMounted) return;
        setProcessing(false);
        setErrorMsg('Erro ao carregar a imagem selecionada. Tente outro arquivo PNG ou JPG.');
      };

      img.onload = () => {
        if (!isMounted) return;

        try {
          const { newWidth, newHeight } = calculateUpscaleDimensions(img.width, img.height, scale);

          // Limit max dimension to 4096px for browser GPU safety
          const MAX_DIM = 4096;
          let targetW = newWidth;
          let targetH = newHeight;
          if (targetW > MAX_DIM || targetH > MAX_DIM) {
            const aspect = img.width / img.height;
            if (targetW > targetH) {
              targetW = MAX_DIM;
              targetH = Math.round(MAX_DIM / aspect);
            } else {
              targetH = MAX_DIM;
              targetW = Math.round(MAX_DIM * aspect);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetW, targetH);

            if (sharpen > 0 && targetW * targetH <= 2048 * 2048) {
              const imageData = ctx.getImageData(0, 0, targetW, targetH);
              const sharpenedData = applyUnsharpMasking(imageData, sharpen);
              ctx.putImageData(sharpenedData, 0, 0);
            }

            const dataUrl = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.92 : 0.95);
            setUpscaledSrc(dataUrl);
            setDimensions({
              orig: `${img.width}x${img.height}px`,
              upscaled: `${targetW}x${targetH}px`,
            });
          }
        } catch (err: any) {
          console.error(err);
          setErrorMsg('Erro durante o processamento da imagem: ' + (err.message || 'memória insuficiente.'));
        } finally {
          if (isMounted) setProcessing(false);
        }
      };

      img.src = originalSrc;
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
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
                setErrorMsg(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Nova Imagem</span>
            </button>
          )
        }
      />

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-sm text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!originalSrc ? (
        <div className="max-w-3xl mx-auto py-8">
          <ImageUploader onImageSelected={handleImageSelected} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {processing ? (
              <div className="h-[500px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-slate-300">Processando super-resolução em tempo real...</span>
                <span className="text-xs text-slate-500">Calculando interpolação e nitidez localmente na GPU</span>
              </div>
            ) : upscaledSrc ? (
              <BeforeAfterSlider
                beforeSrc={originalSrc}
                afterSrc={upscaledSrc}
                beforeLabel={`Original (${dimensions?.orig || ''})`}
                afterLabel={`Super-Resolução ${scale}x (${dimensions?.upscaled || ''})`}
              />
            ) : null}
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
