import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { recordToolUsage, checkUsageLimit } from '../../utils/storage';
import { Upload, FileImage, Download, CheckCircle, HelpCircle, Loader2, Sparkles } from 'lucide-react';

interface ImageConvertToolProps {
  user: User | null;
  onUsageRecorded: (updatedUser: User | null) => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
}

// Helper to dynamically load heic2any from CDN and convert HEIC to standard JPEG
const convertHeic = async (file: File): Promise<Blob> => {
  const heic2any = await new Promise<any>((resolve, reject) => {
    if ((window as any).heic2any) {
      resolve((window as any).heic2any);
      return;
    }
    const existingScript = document.querySelector('script[src*="heic2any"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        resolve((window as any).heic2any);
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load HEIC converter from CDN.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js';
    script.onload = () => resolve((window as any).heic2any);
    script.onerror = () => reject(new Error('Failed to load HEIC converter from CDN. Please check your network connection.'));
    document.head.appendChild(script);
  });

  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.8
  });

  if (Array.isArray(converted)) {
    return converted[0];
  }
  return converted;
};

export default function ImageConvertTool({
  user,
  onUsageRecorded,
  onOpenPricing,
  onOpenAuth,
}: ImageConvertToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertedBlobUrl, setConvertedBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usageLimit = checkUsageLimit(user);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  };

  const loadFile = async (selectedFile: File) => {
    setError(null);
    setConvertedBlobUrl(null);

    const isHeic = /\.heic?f$/i.test(selectedFile.name) || selectedFile.type === 'image/heic' || selectedFile.type === 'image/heif';
    const isImage = isHeic || selectedFile.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(selectedFile.name);
    
    if (!isImage) {
      setError('Invalid file type. Please select an image file.');
      return;
    }

    setFile(selectedFile);
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (isHeic) {
      setIsProcessing(true);
      try {
        const jpegBlob = await convertHeic(selectedFile);
        setPreviewUrl(URL.createObjectURL(jpegBlob));
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Could not parse HEIC image. The file might be corrupted.');
        setFile(null);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  const handleConvert = () => {
    if (!file || !previewUrl) return;

    // Verify limit first
    const freshLimit = checkUsageLimit(user);
    if (!freshLimit.allowed) {
      onOpenPricing();
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Create a real HTML5 Image to load previewUrl, draw on Canvas, and export!
    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // If JPEG, fill white background to support transparent PNG conversions cleanly
          if (targetType === 'jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);

          // Render canvas to data URL format
          const mimeType = `image/${targetType}`;
          const qualityValue = quality / 100;
          const dataUrl = canvas.toDataURL(mimeType, qualityValue);

          setConvertedBlobUrl(dataUrl);

          // Get estimated size
          const strLength = dataUrl.split(',')[1].length;
          const sizeInBytes = Math.round(strLength * (3 / 4));
          const sizeKb = (sizeInBytes / 1024).toFixed(0);

          // Record usage metrics
          const updatedUser = recordToolUsage(
            user,
            'image-convert',
            'Convert Image',
            `converted_${file.name.split('.')[0]}.${targetType}`,
            `${sizeKb} KB`
          );
          onUsageRecorded(updatedUser);
        } else {
          setError('Could not initialize canvas context.');
        }
      } catch (err) {
        console.error(err);
        setError('Canvas export blocked by client environment security controls.');
      } finally {
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      setError('Could not decode image elements.');
      setIsProcessing(false);
    };
  };

  return (
    <div className="space-y-6 text-left" id="image-convert-tool">
      {/* Title */}
      <div>
        <h3 className="text-xl font-bold text-slate-900">Image Format Converter</h3>
        <p className="text-xs text-slate-500 mt-1">
          Convert HEICs, JPEGs, PNGs, WEBPs, and GIFs into other image extensions instantly.
        </p>
      </div>

      {/* Alert Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Upload Zone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500/80 rounded-2xl bg-white p-10 text-center cursor-pointer transition hover:bg-indigo-50/10"
          id="img-convert-drop-zone"
        >
          <input
            type="file"
            accept="image/*, .heic, .heif"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/30 mx-auto mb-4">
            <FileImage className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Drag & drop image, or <span className="text-indigo-600 hover:text-indigo-700">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">HEIC, HEIF, PNG, JPG, JPEG, GIF, and WEBP supported</p>
          
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-4 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 w-fit mx-auto">
            🛡️ Strict privacy guard keeps files local
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main layout display */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 bg-slate-50/30 -mx-5 px-5 py-2 -mt-5 rounded-t-2xl">
              <div className="flex items-center gap-2 truncate">
                <FileImage className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800 text-xs truncate max-w-xs md:max-w-md">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setConvertedBlobUrl(null);
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Choose another
              </button>
            </div>

            {previewUrl && (
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-150 rounded-xl bg-slate-50/20 max-h-72 overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Source Image Preview"
                  className="max-h-60 max-w-full rounded-lg object-contain bg-white shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Action sidebar column */}
          <div className="md:col-span-4 space-y-4">
            
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3">Conversion Options</h4>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Target Format</label>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value as 'png' | 'jpeg' | 'webp');
                      setConvertedBlobUrl(null);
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 bg-white"
                  >
                    <option value="png">PNG Extension</option>
                    <option value="jpeg">JPEG Standard</option>
                    <option value="webp">WEBP Next-gen Format</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-500">Output Quality</span>
                    <span className="text-indigo-600 font-mono">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => {
                      setQuality(Number(e.target.value));
                      setConvertedBlobUrl(null);
                    }}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="border-t border-slate-150 my-2 pt-2 space-y-3">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Source Size</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Free daily actions</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {usageLimit.remaining} remaining
                    </span>
                  </div>
                </div>
              </div>

              {!convertedBlobUrl ? (
                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 py-3 text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-1.5"
                  id="img-convert-action-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      Re-rendering canvas...
                    </>
                  ) : (
                    <>
                      Convert Image
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-5 space-y-2">
                  <div className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 flex items-start gap-2 text-xs">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Image Converted!</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Rendered successfully inside your browser window.</span>
                    </div>
                  </div>

                  <a
                    href={convertedBlobUrl}
                    download={`converted_${file.name.split('.')[0]}.${targetType}`}
                    className="w-full rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:opacity-90 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1.5"
                    id="img-convert-download-btn"
                  >
                    <Download className="h-4 w-4" /> Download Converted Image
                  </a>

                  <button
                    onClick={() => {
                      setConvertedBlobUrl(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 text-xs font-semibold transition"
                  >
                    Convert another image
                  </button>
                </div>
              )}
            </div>

            {/* Privacy note */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
              <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Secure Image rendering</span>
                Pixel channels are copied inside sandboxed drawing context, ensuring zero exposure to servers or remote cloud databases.
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
