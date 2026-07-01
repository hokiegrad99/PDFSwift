import React, { useState, useEffect } from 'react';
import { User, ToolId, ToolDefinition, LimitCheckResult } from './types';
import { getCurrentUser, checkUsageLimit, initializeStorage, saveCurrentUser, updateUserInList } from './utils/storage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import PricingModal from './components/PricingModal';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import ToolWorkspace from './components/ToolWorkspace';
import OnboardingModal from './components/OnboardingModal';
import AdminLoginModal from './components/AdminLoginModal';
import { 
  Merge, Scissors, Minimize2, Image as ImageIcon, 
  FileUp, FileDown, FileText, ArrowLeftRight, 
  Shield, Lock, Sparkles, Check, ArrowRight, Star
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tools' | 'dashboard' | 'pricing' | 'admin'>('tools');
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Active category filter on landing page
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pdf' | 'image' | 'convert'>('all');

  // Trigger initial database setups
  useEffect(() => {
    initializeStorage();
    setCurrentUser(getCurrentUser());
    
    // Auto trigger onboarding for first-time visitors
    const onboardingDone = localStorage.getItem('pdfswift_onboarding_completed');
    if (onboardingDone !== 'true') {
      setIsOnboardingOpen(true);
    }
  }, []);

  // Sync usage limits
  const usageLimit = checkUsageLimit(currentUser);

  const handleLogout = () => {
    saveCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('tools');
    setActiveTool(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Auto sync state
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handlePlanActivated = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setActiveTab('dashboard');
  };

  const handleUsageRecorded = (updatedUser: User | null) => {
    setCurrentUser(updatedUser);
  };

  // 8 Primary SaaS tool definitions
  const tools: ToolDefinition[] = [
    {
      id: 'merge-pdf',
      name: 'Merge PDF',
      description: 'Join multiple PDF documents in any desired sequence.',
      category: 'pdf',
      popular: true,
    },
    {
      id: 'split-pdf',
      name: 'Split PDF',
      description: 'Extract specific pages or sliced ranges into separate files.',
      category: 'pdf',
      popular: false,
    },
    {
      id: 'compress-pdf',
      name: 'Compress PDF',
      description: 'Optimize file footprints without losing vector text crispness.',
      category: 'pdf',
      popular: true,
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF',
      description: 'Bundle PNG or JPG graphics into a unified printable PDF.',
      category: 'pdf',
      popular: false,
    },
    {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      description: 'Render document pages into standalone JPEG/PNG layouts.',
      category: 'image',
      popular: false,
    },
    {
      id: 'pdf-to-word',
      name: 'PDF to Word',
      description: 'Extract textual streams into Microsoft Word RTF layouts.',
      category: 'convert',
      popular: true,
    },
    {
      id: 'word-to-pdf',
      name: 'Word to PDF',
      description: 'Compile TXT drafts or word paragraphs into standard PDFs.',
      category: 'convert',
      popular: false,
    },
    {
      id: 'image-convert',
      name: 'Convert Image',
      description: 'Swap image extensions (PNG, JPG, WEBP) instantly.',
      category: 'image',
      popular: false,
    },
  ];

  const getToolIcon = (id: ToolId) => {
    switch (id) {
      case 'merge-pdf': return Merge;
      case 'split-pdf': return Scissors;
      case 'compress-pdf': return Minimize2;
      case 'pdf-to-image': return ImageIcon;
      case 'image-to-pdf': return FileUp;
      case 'pdf-to-word': return FileDown;
      case 'word-to-pdf': return FileText;
      case 'image-convert': return ArrowLeftRight;
    }
  };

  const getToolColor = (id: ToolId) => {
    switch (id) {
      case 'merge-pdf': return 'from-sky-500 to-sky-600 text-sky-500 bg-sky-50';
      case 'split-pdf': return 'from-emerald-500 to-emerald-600 text-emerald-500 bg-emerald-50';
      case 'compress-pdf': return 'from-indigo-500 to-indigo-600 text-indigo-500 bg-indigo-50';
      case 'pdf-to-image': return 'from-rose-500 to-rose-600 text-rose-500 bg-rose-50';
      case 'image-to-pdf': return 'from-orange-500 to-orange-600 text-orange-500 bg-orange-50';
      case 'pdf-to-word': return 'from-blue-500 to-blue-600 text-blue-500 bg-blue-50';
      case 'word-to-pdf': return 'from-violet-500 to-violet-600 text-violet-500 bg-violet-50';
      case 'image-convert': return 'from-cyan-500 to-cyan-600 text-cyan-500 bg-cyan-50';
    }
  };

  const filteredTools = tools.filter(t => categoryFilter === 'all' || t.category === categoryFilter);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="app-root">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveTool(null);
        }}
        user={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        usageLimit={usageLimit}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* Active Tool Workspace overrides */}
        {activeTool ? (
          <ToolWorkspace
            toolId={activeTool}
            onBack={() => setActiveTool(null)}
            user={currentUser}
            onUsageRecorded={handleUsageRecorded}
            onOpenPricing={() => setIsPricingOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSelectTool={(id) => setActiveTool(id)}
          />
        ) : (
          <>
            {activeTab === 'tools' && (
              <div id="tools-catalog-view">
                
                {/* Hero section */}
                <div className="relative overflow-hidden bg-white border-b border-slate-100 py-20 px-4">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                  
                  <div className="relative mx-auto max-w-4xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-xs mb-6">
                      <Lock className="h-3.5 w-3.5 text-indigo-500" /> 100% Secure Client-Side PDF Tools
                    </span>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
                      Fast document tools. <br />
                      <span className="bg-gradient-to-r from-indigo-600 to-indigo-900 bg-clip-text text-transparent">
                        Absolute privacy.
                      </span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-base md:text-lg text-slate-500 leading-relaxed mb-10">
                      Merge, split, compress, and convert PDF or image formats instantly in your browser tab. Files are processed locally on your machine, keeping maintenance costs at zero and compliance secure.
                    </p>

                    {/* Trust banner */}
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-500" /> Zero Server Uploads</span>
                      <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> GDPR & HIPAA Safe</span>
                      <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Free Sandbox Access</span>
                    </div>
                  </div>
                </div>

                {/* Categories & Catalog list container */}
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                    {[
                      { id: 'all', name: 'All Tools' },
                      { id: 'pdf', name: 'PDF Editors' },
                      { id: 'image', name: 'Image Tools' },
                      { id: 'convert', name: 'Converters' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id as any)}
                        className={`rounded-xl px-4.5 py-2 text-xs font-bold transition-all shadow-xs ${
                          categoryFilter === cat.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        id={`filter-${cat.id}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Tools Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredTools.map((t) => {
                      const Icon = getToolIcon(t.id);
                      const colorClass = getToolColor(t.id);

                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveTool(t.id)}
                          className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition text-left flex flex-col justify-between min-h-[190px]"
                          id={`tool-card-${t.id}`}
                        >
                          {t.popular && (
                            <span className="absolute top-4 right-4 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[9px] font-extrabold text-indigo-700 tracking-wider">
                              POPULAR
                            </span>
                          )}

                          <div>
                            {/* Icon block */}
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass.split(' ').slice(2).join(' ')} border border-slate-100/60 shadow-xs mb-5 transition-transform group-hover:scale-105`}>
                              <Icon className="h-5.5 w-5.5" />
                            </div>

                            {/* Label */}
                            <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{t.description}</p>
                          </div>

                          {/* Interactive indicator */}
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 group-hover:text-indigo-700 mt-6 pt-3 border-t border-slate-100 w-full">
                            Launch Tool <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'dashboard' && currentUser && (
              <UserDashboard
                user={currentUser}
                onOpenPricing={() => setIsPricingOpen(true)}
                onUpdateUser={setCurrentUser}
              />
            )}

            {activeTab === 'admin' && currentUser && currentUser.role === 'admin' && (
              <AdminPanel
                user={currentUser}
                onRefreshUserData={() => setCurrentUser(getCurrentUser())}
              />
            )}

            {activeTab === 'pricing' && (
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <PricingModal
                  isOpen={true}
                  onClose={() => setActiveTab('tools')}
                  user={currentUser}
                  onPlanActivated={handlePlanActivated}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <Footer
        onOpenPricing={() => setIsPricingOpen(true)}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveTool(null);
        }}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Auth Modal overlay */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Pricing and Payment simulations Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        user={currentUser}
        onPlanActivated={handlePlanActivated}
        onOpenAuth={() => {
          setIsPricingOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* User onboarding tour flow */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Secure Admin Portal login Gate */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
