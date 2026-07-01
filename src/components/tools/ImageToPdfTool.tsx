import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { recordToolUsage, checkUsageLimit } from '../../utils/storage';
import { PDFDocument } from 'pdf-lib';
import { Upload, FileImage, Download, CheckCircle, HelpCircle, Loader2, ArrowUp, ArrowDown, Trash2, Sparkles } from 'lucide-react';

interface ImageToPdfToolProps {
  user: User | null;
  onUsageRecorded: (updatedUser: User | null) => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
}

export default function ImageToPdfTool({
  user,
  onUsageRecorded,
  onOpenPricing,
  onOpenAuth,
}: ImageToPdfToolProps) {
  const [files, setFiles] = useState<{ id: string; file: File; name: string; size: string; preview: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usageLimit = checkUsageLimit(user);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setError(null);
    setPdfBlobUrl(null);
    const validImages = newFiles.filter(f => f.type.startsWith('image/jpeg') || f.type.startsWith('image/png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg') || f.name.endsWith('.png'));

    if (validImages.length < newFiles.length) {
      setError('Some files were ignored. Only JPG, JPEG, and PNG images are supported.');
    }

    const added = validImages.map(f => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: f,
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      preview: URL.createObjectURL(f),
    }));

    setFiles(prev => [...prev, ...added]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (id: string, prevUrl: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    URL.revokeObjectURL(prevUrl);
    setPdfBlobUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
    setPdfBlobUrl(null);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
    setPdfBlobUrl(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    // Verify limit first
    const freshLimit = checkUsageLimit(user);
    if (!freshLimit.allowed) {
      onOpenPricing();
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create a brand new PDF document
      const pdfDoc = await PDFDocument.create();

      // 2. Load and embed each image page by page
      for (const item of files) {
        const imageBytes = await item.file.arrayBuffer();
        let embeddedImage;

        if (item.file.type === 'image/png' || item.name.endsWith('.png')) {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          // Standard Jpeg/Jpg
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        // Add page matching exact image resolution
        const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
        
        // Draw image fully onto the new page
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: embeddedImage.width,
          height: embeddedImage.height,
        });
      }

      // 3. Save bytes
      const bytes = await pdfDoc.save();

      // 4. Create blob URL for download
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);

      // 5. Save usage analytics
      const updatedUser = recordToolUsage(
        user,
        'image-to-pdf',
        'Image to PDF',
        'converted_images.pdf',
        `${sizeMb} MB`
      );
      onUsageRecorded(updatedUser);

    } catch (err: any) {
      console.error(err);
      setError('An error occurred during conversion. Verify none of your images are corrupt.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="image-to-pdf-tool">
      {/* Title */}
      <div>
        <h3 className="text-xl font-bold text-slate-900">Image to PDF</h3>
        <p className="text-xs text-slate-500 mt-1">
          Convert and bundle JPEG, JPG, and PNG image sheets into a single, high-fidelity PDF instantly.
        </p>
      </div>

      {/* Alert Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Upload Box */}
      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500/80 rounded-2xl bg-white p-10 text-center cursor-pointer transition hover:bg-indigo-50/10"
          id="image-to-pdf-drop-zone"
        >
          <input
            type="file"
            multiple
            accept="image/png, image/jpeg, image/jpg"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/30 mx-auto mb-4">
            <Upload className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Drag & drop images here, or <span className="text-indigo-600 hover:text-indigo-700">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG, and JPEG files are supported</p>
          
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-4 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 w-fit mx-auto">
            🛡️ Local client-side compiler guarantees absolute privacy
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main layout organizer */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Organize images ({files.length})
              </span>
              <button
                onClick={() => {
                  files.forEach(f => URL.revokeObjectURL(f.preview));
                  setFiles([]);
                  setPdfBlobUrl(null);
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Clear All
              </button>
            </div>

            {/* Thumbnail items list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-150 p-2.5 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition text-center relative group flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={item.preview}
                      alt={item.name}
                      className="w-full h-24 object-contain rounded-lg border border-slate-200 bg-white"
                    />
                    <span className="block text-xs font-semibold text-slate-800 truncate mt-2 max-w-[140px] mx-auto">
                      {item.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.size} • Page {idx + 1}
                    </span>
                  </div>

                  {/* Move & Delete controls */}
                  <div className="flex items-center justify-between border-t border-slate-150 pt-2 mt-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded-md bg-white hover:bg-slate-200 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === files.length - 1}
                        className="p-1 rounded-md bg-white hover:bg-slate-200 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFile(item.id, item.preview)}
                      className="p-1 rounded-md bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-500 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick append additional */}
            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                <Upload className="h-3.5 w-3.5" /> Upload More Images
              </button>
            </div>
          </div>

          {/* Action sidebar column */}
          <div className="md:col-span-4 space-y-4">
            
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3">PDF Settings</h4>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Total Images</span>
                  <span className="font-semibold text-slate-900">{files.length} sheets</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Page Dimension</span>
                  <span className="font-semibold text-slate-900 font-mono">Auto (Matches Image)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Free daily actions</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {usageLimit.remaining} remaining
                  </span>
                </div>
              </div>

              {!pdfBlobUrl ? (
                <button
                  onClick={handleConvert}
                  disabled={isProcessing || files.length === 0}
                  className="w-full mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 py-3 text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-1.5"
                  id="img-to-pdf-action-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      Compiling PDF...
                    </>
                  ) : (
                    <>
                      Convert to PDF
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-5 space-y-2">
                  <div className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 flex items-start gap-2 text-xs">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">PDF Compiled!</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Successfully written directly inside your browser.</span>
                    </div>
                  </div>

                  <a
                    href={pdfBlobUrl}
                    download="compiled_images.pdf"
                    className="w-full rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:opacity-90 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1.5"
                    id="img-to-pdf-download-btn"
                  >
                    <Download className="h-4 w-4" /> Download PDF File
                  </a>

                  <button
                    onClick={() => {
                      setPdfBlobUrl(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 text-xs font-semibold transition"
                  >
                    Convert other images
                  </button>
                </div>
              )}
            </div>

            {/* Privacy note */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
              <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Vector Integration Guard</span>
                No image data gets cached, saved, or uploaded. Your graphics are drawn securely to a virtual canvas and compiled as a compressed PDF document locally.
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
