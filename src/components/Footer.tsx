import React from 'react';
import { Shield, Lock, Cpu, FileText } from 'lucide-react';

interface FooterProps {
  onOpenPricing: () => void;
  setActiveTab: (tab: 'tools' | 'dashboard' | 'pricing' | 'admin') => void;
  onOpenAdminLogin: () => void;
}

export default function Footer({ onOpenPricing, setActiveTab, onOpenAdminLogin }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800" id="footer-container">
      {/* Privacy highlights */}
      <div className="border-b border-slate-800 bg-slate-950/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5" id="highlight-security">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">100% Client-Side Processing</h4>
                <p className="text-xs text-slate-400 mt-1">Your files never touch our servers. All compression, merging, and rendering happen right in your browser tab.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5" id="highlight-privacy">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">Strict Zero-Data Retention</h4>
                <p className="text-xs text-slate-400 mt-1">Maximum privacy for your financials, contracts, and confidential scans. We do not store, view, or parse any document text.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5" id="highlight-speed">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">Instant Execution</h4>
                <p className="text-xs text-slate-400 mt-1">Zero upload waiting times, zero queue lag. Powered by modern WASM compiles and client-side HTML5 canvas algorithms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand block */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
                P
              </div>
              <span>PDFSwift</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              The ultra-fast, safe, and modern SaaS workspace for document and file manipulations. Fully hostable on GitHub Pages with zero external backend prerequisites.
            </p>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
              v1.0.0 Stable
            </span>
          </div>

          {/* Quick links: PDF Tools */}
          <div>
            <h5 className="font-semibold text-slate-100 text-sm mb-4">PDF Tools</h5>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Merge PDF</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Split PDF</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Compress PDF</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Word to PDF</button></li>
            </ul>
          </div>

          {/* Quick links: Image Tools */}
          <div>
            <h5 className="font-semibold text-slate-100 text-sm mb-4">Image Tools</h5>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Image to PDF</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">PDF to Image</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Convert Image Format</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">PDF to Word</button></li>
            </ul>
          </div>

          {/* Quick links: Subscription */}
          <div>
            <h5 className="font-semibold text-slate-100 text-sm mb-4">Platform</h5>
            <ul className="space-y-2 text-xs">
              <li><button onClick={onOpenPricing} className="hover:text-white transition">Pricing Plans</button></li>
              <li><button onClick={() => setActiveTab('dashboard')} className="hover:text-white transition">Member Dashboard</button></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition">Privacy Policy</a></li>
              <li><button onClick={onOpenAdminLogin} className="hover:text-rose-400 text-slate-500 transition font-medium flex items-center gap-1" id="footer-admin-link">🛡️ Admin Portal</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 PDFSwift. All rights reserved. Built for private, serverless operation.</p>
          <p className="text-slate-500">
            Hosted securely on GitHub Pages • Zero Server Cost Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}
