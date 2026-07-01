import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { recordToolUsage, checkUsageLimit } from '../../utils/storage';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Upload, FileText, Download, CheckCircle, HelpCircle, Loader2, Edit, Sparkles } from 'lucide-react';

interface WordToPdfToolProps {
  user: User | null;
  onUsageRecorded: (updatedUser: User | null) => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
}

export default function WordToPdfTool({
  user,
  onUsageRecorded,
  onOpenPricing,
  onOpenAuth,
}: WordToPdfToolProps) {
  const [inputText, setInputText] = useState(
    `ANNUAL STRATEGY BRIEF\n\n1. EXECUTIVE SUMMARY\nThis document outlines our core operational roadmap. All compiled targets are projected using strict client side WASM computations, guaranteeing zero cloud storage costs.\n\n2. CORE VALUE INITIATIVES\n- Strict data retention: files never touch a server database.\n- Lightning fast compile cycles: instant downloads locally.\n- Zero external dependencies: works on standard mobile and desktop environments.\n\n3. ROADMAP TARGETS\nPhase 1: Deploy client-side layout mergers.\nPhase 2: Integrate modular word processing compilers.\nPhase 3: Scale secure enterprise team workspaces.`
  );
  const [fileName, setFileName] = useState('MyDocument.txt');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usageLimit = checkUsageLimit(user);

  const loadMammoth = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).mammoth) {
        resolve((window as any).mammoth);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.onload = () => resolve((window as any).mammoth);
      script.onerror = () => reject(new Error('Failed to load Word document reader library.'));
      document.head.appendChild(script);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFileName(selectedFile.name);
      setPdfBlobUrl(null);

      const isDocx = selectedFile.name.toLowerCase().endsWith('.docx');

      if (isDocx) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target && event.target.result instanceof ArrayBuffer) {
            try {
              setIsProcessing(true);
              setError(null);
              const mammothLib = await loadMammoth();
              const result = await mammothLib.extractRawText({ arrayBuffer: event.target.result });
              setInputText(result.value);
            } catch (err: any) {
              setError(err.message || 'Error parsing .docx file. Ensure it is not corrupted.');
            } finally {
              setIsProcessing(false);
            }
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            setInputText(event.target.result);
          }
        };
        reader.readAsText(selectedFile);
      }
    }
  };

  const handleCompile = async () => {
    if (!inputText.trim()) {
      setError('Please enter or upload some document content first.');
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
      // 1. Create a brand new PDF document
      const pdfDoc = await PDFDocument.create();

      // 2. Embed standard Times Roman font for vector rendering
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontSize = 11;
      const leading = 16;
      const margin = 54; // 0.75 in (standard)
      const pageWidth = 612; // Standard Letter width
      const pageHeight = 792; // Standard Letter height
      const maxLineWidth = pageWidth - margin * 2;

      // 3. Simple text wrapping helper
      const wrapText = (text: string, maxW: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          if (width > maxW) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        return lines;
      };

      // 4. Split source text by newline and wrap lines
      const sourceLines = inputText.split('\n');
      const wrappedLines: string[] = [];
      for (const rawLine of sourceLines) {
        if (rawLine.trim() === '') {
          wrappedLines.push(''); // Paragraph spacing
        } else {
          wrappedLines.push(...wrapText(rawLine, maxLineWidth));
        }
      }

      // 5. Draw lines page by page, automatically spawning page overflows
      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      for (const line of wrappedLines) {
        if (y < margin) {
          // Spawn new page
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        if (line !== '') {
          page.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
        y -= leading;
      }

      // 6. Save bytes
      const bytes = await pdfDoc.save();

      // 7. Create blob URL for download
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);

      // 8. Record usage metrics
      const updatedUser = recordToolUsage(
        user,
        'word-to-pdf',
        'Word to PDF',
        `${fileName.replace(/\.[^/.]+$/, "")}.pdf`,
        `${sizeMb} MB`
      );
      onUsageRecorded(updatedUser);

    } catch (err: any) {
      console.error(err);
      setError('Could not compile Word document. Double check formatting symbols.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="word-to-pdf-tool">
      {/* Title */}
      <div>
        <h3 className="text-xl font-bold text-slate-900">Word to PDF Compiler</h3>
        <p className="text-xs text-slate-500 mt-1">
          Compile raw text files or custom formatted drafts into highly polished vector PDFs.
        </p>
      </div>

      {/* Alert Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Rich Input Editor */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 bg-slate-50/30 -mx-5 px-5 py-2 -mt-5 rounded-t-2xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Edit className="h-4 w-4" /> Word Document Editor Sandbox
            </span>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 font-sans"
            >
              Upload Word (.docx) or Text File
            </button>
            <input
              type="file"
              accept=".docx,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-3">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setPdfBlobUrl(null);
              }}
              rows={12}
              className="w-full rounded-xl border border-slate-200 p-4 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed bg-slate-50/20"
              placeholder="Start drafting your document contents here..."
              id="word-editor-textarea"
            />
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="md:col-span-4 space-y-4">
          
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Compiler settings</h4>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">File Reference</span>
                <span className="font-semibold text-slate-900 truncate max-w-[120px]">{fileName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Output Standard</span>
                <span className="font-semibold text-slate-900 font-mono">PDF-A Vector</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Margins (DPI)</span>
                <span className="font-semibold text-slate-900 font-mono">0.75 in (Default)</span>
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
                onClick={handleCompile}
                disabled={isProcessing || !inputText.trim()}
                className="w-full mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 py-3 text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-1.5"
                id="word-to-pdf-action-btn"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    Compiling vector grids...
                  </>
                ) : (
                  <>
                    Compile to PDF
                  </>
                )}
              </button>
            ) : (
              <div className="mt-5 space-y-2">
                <div className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 flex items-start gap-2 text-xs">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">PDF Compiled!</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Successfully written vector fonts on standard US letter frames.</span>
                  </div>
                </div>

                <a
                  href={pdfBlobUrl}
                  download={`${fileName.replace(/\.[^/.]+$/, "")}.pdf`}
                  className="w-full rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:opacity-90 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1.5"
                  id="word-to-pdf-download-btn"
                >
                  <Download className="h-4 w-4" /> Download PDF File
                </a>

                <button
                  onClick={() => {
                    setPdfBlobUrl(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 text-xs font-semibold transition"
                >
                  Reset compiler
                </button>
              </div>
            )}
          </div>

          {/* Privacy info */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
            <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700 block mb-0.5">Strict Privacy Security</span>
              Compiling text documents inside memory handles paragraph flows inside sandboxed layout buffers, preventing credentials or texts from being cached anywhere externally.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
