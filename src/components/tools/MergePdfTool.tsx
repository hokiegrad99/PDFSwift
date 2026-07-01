import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { recordToolUsage, checkUsageLimit } from '../../utils/storage';
import { PDFDocument } from 'pdf-lib';
import { Upload, FileText, ArrowUp, ArrowDown, Trash2, HelpCircle, Loader2, Download, CheckCircle, Sparkles } from 'lucide-react';

interface MergePdfToolProps {
  user: User | null;
  onUsageRecorded: (updatedUser: User | null) => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
}

export default function MergePdfTool({
  user,
  onUsageRecorded,
  onOpenPricing,
  onOpenAuth,
}: MergePdfToolProps) {
  const [files, setFiles] = useState<{ id: string; file: File; name: string; size: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
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
    setMergedBlobUrl(null);
    const pdfsOnly = newFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    
    if (pdfsOnly.length < newFiles.length) {
      setError('Some files were ignored. Only PDF files are supported in this tool.');
    }

    const added = pdfsOnly.map(f => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: f,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
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

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedBlobUrl(null);
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
    setMergedBlobUrl(null);
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
    setMergedBlobUrl(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    // Verify limit first
    const freshLimit = checkUsageLimit(user);
    if (!freshLimit.allowed) {
      onOpenPricing();
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create a brand new PDF document using pdf-lib
      const mergedPdf = await PDFDocument.create();

      // 2. Iterate and copy pages
      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      // 3. Serialize to Uint8Array
      const mergedPdfBytes = await mergedPdf.save();

      // 4. Create local blob URL for downloading
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedBlobUrl(url);

      // Calculate sizes for metrics
      const totalSizeMb = (blob.size / (1024 * 1024)).toFixed(2);

      // 5. Register tool execution (charges action)
      const updatedUser = recordToolUsage(
        user,
        'merge-pdf',
        'Merge PDF',
        'merged_document.pdf',
        `${totalSizeMb} MB`
      );
      onUsageRecorded(updatedUser);

    } catch (err: any) {
      console.error(err);
      setError('An error occurred during merging. Make sure none of your PDFs are password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="merge-pdf-tool">
      {/* Title */}
      <div>
        <h3 className="text-xl font-bold text-slate-900">Merge PDF Files</h3>
        <p className="text-xs text-slate-500 mt-1">
          Combine multiple PDF files into a single document in your desired order instantly.
        </p>
      </div>

      {/* Alert Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Main Drag-Drop Upload Box */}
      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500/80 rounded-2xl bg-white p-10 text-center cursor-pointer transition hover:bg-indigo-50/10"
          id="merge-drop-zone"
        >
          <input
            type="file"
            multiple
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 mx-auto mb-4">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Drag & drop files here, or <span className="text-indigo-600 hover:text-indigo-700">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Only PDF documents are supported</p>
          
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-4 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 w-fit mx-auto">
            🛡️ 100% Safe client-side secure compilation
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* File Organizer list */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Order of Documents ({files.length})
              </span>
              <button
                onClick={() => setFiles([])}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50/30 text-xs font-sans hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 text-[10px]">
                      {idx + 1}
                    </span>
                    <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate max-w-xs md:max-w-md">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.size}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === files.length - 1}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1 rounded-md hover:bg-rose-50 text-rose-500 transition ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Upload More */}
            <div className="mt-4 border-t border-slate-100 pt-4 text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                <Upload className="h-3.5 w-3.5" /> Upload More PDFs
              </button>
            </div>
          </div>

          {/* Action trigger block */}
          <div className="md:col-span-4 space-y-4">
            
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3">Merge Settings</h4>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Total Documents</span>
                  <span className="font-semibold text-slate-900">{files.length}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Est. Pages Output</span>
                  <span className="font-semibold text-slate-900 font-mono">Dynamic Compile</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Free daily limit</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {usageLimit.remaining} remaining
                  </span>
                </div>
              </div>

              {!mergedBlobUrl ? (
                <button
                  onClick={handleMerge}
                  disabled={isProcessing || files.length < 2}
                  className="w-full mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed py-3 text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-1.5"
                  id="merge-action-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      Merging locally...
                    </>
                  ) : (
                    <>
                      Merge documents
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-5 space-y-2">
                  <div className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 flex items-start gap-2 text-xs">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Documents Merged!</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Successfully compiled completely on your machine.</span>
                    </div>
                  </div>
                  
                  <a
                    href={mergedBlobUrl}
                    download="merged_document.pdf"
                    className="w-full rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:opacity-90 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1.5"
                    id="merge-download-btn"
                  >
                    <Download className="h-4 w-4" /> Download Merged PDF
                  </a>

                  <button
                    onClick={() => {
                      setFiles([]);
                      setMergedBlobUrl(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 text-xs font-semibold transition"
                  >
                    Merge another set
                  </button>
                </div>
              )}
            </div>

            {/* Hint Box */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
              <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Privacy First Sandbox</span>
                PDFSwift compiles PDFs inside a virtual environment using compiled JavaScript binaries. Files are never transmitted or parsed on any external server.
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
