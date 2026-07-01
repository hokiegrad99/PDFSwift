import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { recordToolUsage, checkUsageLimit } from '../../utils/storage';
import { PDFDocument } from 'pdf-lib';
import { Upload, FileText, Download, CheckCircle, HelpCircle, Loader2, Scissors, Info } from 'lucide-react';

interface SplitPdfToolProps {
  user: User | null;
  onUsageRecorded: (updatedUser: User | null) => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
}

export default function SplitPdfTool({
  user,
  onUsageRecorded,
  onOpenPricing,
  onOpenAuth,
}: SplitPdfToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pagesCount, setPagesCount] = useState<number | null>(null);
  const [splitRange, setSplitRange] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitBlobUrl, setSplitBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usageLimit = checkUsageLimit(user);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await loadFile(e.target.files[0]);
    }
  };

  const loadFile = async (selectedFile: File) => {
    setError(null);
    setSplitBlobUrl(null);
    setPagesCount(null);

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Invalid file type. Only PDF documents can be processed here.');
      return;
    }

    setFile(selectedFile);

    try {
      // Parse file immediately to retrieve its actual page count
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const count = pdf.getPageCount();
      setPagesCount(count);
      // default range
      setSplitRange(`1-${Math.min(count, 2)}`);
    } catch (err) {
      console.error(err);
      setError('Could not read the PDF structure. Make sure it is not password protected.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await loadFile(e.dataTransfer.files[0]);
    }
  };

  const parseRangeString = (rangeStr: string, maxPages: number): number[] => {
    // Parses ranges like "1-2", "2", "1,3,4" into 0-indexed page indexes
    const indices: number[] = [];
    const parts = rangeStr.split(/[,;\s]+/);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= maxPages) {
              indices.push(i - 1);
            }
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
          indices.push(pageNum - 1);
        }
      }
    }

    // Deduplicate and sort indices
    return Array.from(new Set(indices)).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file || !pagesCount) return;

    // Verify limit first
    const freshLimit = checkUsageLimit(user);
    if (!freshLimit.allowed) {
      onOpenPricing();
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const pageIndices = parseRangeString(splitRange, pagesCount);
      if (pageIndices.length === 0) {
        setError('Please enter a valid page range or number based on the document page counts.');
        setIsProcessing(false);
        return;
      }

      // Load original document
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);

      // Create separate document
      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(originalPdf, pageIndices);
      copiedPages.forEach((page) => splitPdf.addPage(page));

      const bytes = await splitPdf.save();

      // Downloadable output URL
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setSplitBlobUrl(url);

      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);

      // Save usage metrics
      const updatedUser = recordToolUsage(
        user,
        'split-pdf',
        'Split PDF',
        `split_${file.name}`,
        `${sizeMb} MB`
      );
      onUsageRecorded(updatedUser);

    } catch (err: any) {
      console.error(err);
      setError('An error occurred during splitting. Double check your range input structure.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="split-pdf-tool">
      {/* Title */}
      <div>
        <h3 className="text-xl font-bold text-slate-900">Split PDF Document</h3>
        <p className="text-xs text-slate-500 mt-1">
          Extract specific pages or custom sections into a brand new PDF file in seconds.
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
          id="split-drop-zone"
        >
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/30 mx-auto mb-4">
            <Scissors className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Drag & drop single PDF, or <span className="text-indigo-600 hover:text-indigo-700">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Maximum A4/Letter/Bulk documents supported</p>
          
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-4 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 w-fit mx-auto">
            🛡️ Local client-side compiler guarantees absolute privacy
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* File summary and Range input */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 bg-slate-50/30 -mx-5 px-5 py-2 -mt-5 rounded-t-2xl">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800 text-xs truncate max-w-xs md:max-w-md">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPagesCount(null);
                  setSplitBlobUrl(null);
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Choose another
              </button>
            </div>

            <div className="space-y-4">
              {/* Loaded Page Stats */}
              <div className="flex items-center gap-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-3 text-xs text-indigo-800 font-medium">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>
                  This PDF contains <span className="font-bold text-slate-900">{pagesCount}</span> pages. Specify the pages you want to extract below.
                </span>
              </div>

              {/* Range settings input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Page Range Extraction settings
                </label>
                <input
                  type="text"
                  value={splitRange}
                  onChange={(e) => {
                    setSplitRange(e.target.value);
                    setSplitBlobUrl(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="e.g. 1-2 or 1,3,5"
                  id="split-range-input"
                />
                <span className="block text-[10px] text-slate-400 leading-normal font-sans">
                  Examples: <span className="font-semibold text-slate-500">1-3</span> (pages 1 to 3), <span className="font-semibold text-slate-500">1,4,5</span> (pages 1, 4, and 5), or <span className="font-semibold text-slate-500">1-2, 4</span>
                </span>
              </div>
            </div>
          </div>

          {/* Settings Sidebar Column */}
          <div className="md:col-span-4 space-y-4">
            
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3">Split PDF settings</h4>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Source Pages</span>
                  <span className="font-semibold text-slate-900 font-mono">{pagesCount} pages</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Total File Size</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Free daily limit</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {usageLimit.remaining} remaining
                  </span>
                </div>
              </div>

              {!splitBlobUrl ? (
                <button
                  onClick={handleSplit}
                  disabled={isProcessing || !splitRange}
                  className="w-full mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 py-3 text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-1.5"
                  id="split-action-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      Extracting pages...
                    </>
                  ) : (
                    <>
                      Extract Specific Pages
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-5 space-y-2">
                  <div className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 flex items-start gap-2 text-xs">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Subset Extracted!</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Successfully compiled completely on your machine.</span>
                    </div>
                  </div>

                  <a
                    href={splitBlobUrl}
                    download={`extracted_${file.name}`}
                    className="w-full rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:opacity-90 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1.5"
                    id="split-download-btn"
                  >
                    <Download className="h-4 w-4" /> Download Extracted PDF
                  </a>

                  <button
                    onClick={() => {
                      setSplitBlobUrl(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 text-xs font-semibold transition"
                  >
                    Split other pages
                  </button>
                </div>
              )}
            </div>

            {/* Privacy Box */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
              <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Secure Document Slicing</span>
                Because splitting is done entirely in memory inside the browser sandbox, your corporate, legal, or government documents never transmit anywhere.
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
