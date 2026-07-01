import React from 'react';
import { User, ToolId } from '../types';
import MergePdfTool from './tools/MergePdfTool';
import SplitPdfTool from './tools/SplitPdfTool';
import CompressPdfTool from './tools/CompressPdfTool';
import PdfToImageTool from './tools/PdfToImageTool';
import ImageToPdfTool from './tools/ImageToPdfTool';
import PdfToWordTool from './tools/PdfToWordTool';
import WordToPdfTool from './tools/WordToPdfTool';
import ImageConvertTool from './tools/ImageConvertTool';
import { ChevronLeft, Merge, Scissors, Minimize2, Image, FileImage, FileText, FileUp, FileDown, ArrowLeftRight, HelpCircle } from 'lucide-react';

interface ToolWorkspaceProps {
  toolId: ToolId;
  onBack: () => void;
  user: User | null;
  onUsageRecorded: (updatedUser: User | null) => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
  onSelectTool: (id: ToolId) => void;
}

export default function ToolWorkspace({
  toolId,
  onBack,
  user,
  onUsageRecorded,
  onOpenPricing,
  onOpenAuth,
  onSelectTool,
}: ToolWorkspaceProps) {
  
  // Sidebar quick-navigation tools list
  const toolsList = [
    { id: 'merge-pdf' as ToolId, name: 'Merge PDF', icon: Merge, color: 'text-sky-500' },
    { id: 'split-pdf' as ToolId, name: 'Split PDF', icon: Scissors, color: 'text-emerald-500' },
    { id: 'compress-pdf' as ToolId, name: 'Compress PDF', icon: Minimize2, color: 'text-indigo-500' },
    { id: 'image-to-pdf' as ToolId, name: 'Image to PDF', icon: FileUp, color: 'text-orange-500' },
    { id: 'pdf-to-image' as ToolId, name: 'PDF to Image', icon: Image, color: 'text-rose-500' },
    { id: 'pdf-to-word' as ToolId, name: 'PDF to Word', icon: FileDown, color: 'text-blue-500' },
    { id: 'word-to-pdf' as ToolId, name: 'Word to PDF', icon: FileText, color: 'text-violet-500' },
    { id: 'image-convert' as ToolId, name: 'Convert Image', icon: ArrowLeftRight, color: 'text-cyan-500' },
  ];

  const renderActiveTool = () => {
    switch (toolId) {
      case 'merge-pdf':
        return (
          <MergePdfTool
            user={user}
            onUsageRecorded={onUsageRecorded}
            onOpenPricing={onOpenPricing}
            onOpenAuth={onOpenAuth}
          />
        );
      case 'split-pdf':
        return (
          <SplitPdfTool
            user={user}
            onUsageRecorded={onUsageRecorded}
            onOpenPricing={onOpenPricing}
            onOpenAuth={onOpenAuth}
          />
        );
      case 'compress-pdf':
        return (
          <CompressPdfTool
            user={user}
            onUsageRecorded={onUsageRecorded}
            onOpenPricing={onOpenPricing}
            onOpenAuth={onOpenAuth}
          />
        );
      case 'pdf-to-image':
        return (
          <PdfToImageTool
            user={user}
            onUsageRecorded={onUsageRecorded}
            onOpenPricing={onOpenPricing}
            onOpenAuth={onOpenAuth}
          />
        );
      case 'image-to-pdf':
        return (
          <ImageToPdfTool
            user={user}
            onUsageRecorded={onUsageRecorded}
            onOpenPricing={onOpenPricing}
            onOpenAuth={onOpenAuth}
          />
        );
      case 'pdf-to-word':
        return (
          <PdfToWordTool
            user={user}
            onUsageRecorded={onUsageRecorded}
            onOpenPricing={onOpenPricing}
            onOpenAuth={onOpenAuth}
          />
        );
      case 'word-to-pdf':
        return (
          <WordToPdfTool
            user={user}
            onUsageRecorded={onUsageRecorded}
            onOpenPricing={onOpenPricing}
            onOpenAuth={onOpenAuth}
          />
        );
      case 'image-convert':
        return (
          <ImageConvertTool
            user={user}
            onUsageRecorded={onUsageRecorded}
            onOpenPricing={onOpenPricing}
            onOpenAuth={onOpenAuth}
          />
        );
      default:
        return <div className="text-sm text-slate-500">Selected tool module is offline.</div>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left" id="workspace-container">
      {/* Back navigation header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          id="workspace-back-btn"
        >
          <ChevronLeft className="h-4.5 w-4.5" /> Back to all tools
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Quick Switcher */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sticky top-24">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 font-mono">
              Quick Swap Tool
            </h4>
            
            <div className="space-y-1">
              {toolsList.map((t) => {
                const Icon = t.icon;
                const isActive = t.id === toolId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTool(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    id={`switcher-${t.id}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${t.color}`} />
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Active Tool Stage */}
        <div className="lg:col-span-9 bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xs">
          {renderActiveTool()}
        </div>

      </div>
    </div>
  );
}
