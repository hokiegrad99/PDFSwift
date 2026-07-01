import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Shield, Lock, Check, ChevronRight, ChevronLeft, 
  X, FileText, Image, RefreshCw, Zap, Award, Info
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onOpenPricing, onOpenAuth }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('pdfswift_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4" id="onboarding-modal-overlay">
      <AnimatePresence mode="wait">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col md:flex-row md:min-h-[460px]"
          id="onboarding-modal-content"
        >
          {/* Decorative Left Panel - Premium/Branded Slate panel */}
          <div className="md:w-2/5 bg-slate-900 p-8 flex flex-col justify-between relative overflow-hidden text-white border-b md:border-b-0 md:border-r border-slate-800">
            {/* Background grid accents */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                  P
                </div>
                <span className="text-sm font-bold tracking-tight text-slate-200">PDFSwift Tour</span>
              </div>

              <div className="space-y-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                  <Shield className="h-3 w-3" /> 100% Client-Side
                </span>
                <h3 className="text-xl font-extrabold tracking-tight text-white leading-snug">
                  Uncompromised Privacy & Speed
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Join thousands who manage confidential PDFs and images securely without server uploads.
                </p>
              </div>
            </div>

            {/* Step navigation display */}
            <div className="relative z-10 mt-8 pt-6 border-t border-slate-800 hidden md:block">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>PROGRESS</span>
                <span className="font-mono font-bold text-indigo-400">{step} / {totalSteps}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300" 
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right Panel - Dynamic Content Panel */}
          <div className="md:w-3/5 p-8 flex flex-col justify-between bg-white text-slate-900">
            {/* Close Button */}
            <button 
              onClick={handleComplete}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition"
              id="close-onboarding-modal"
              aria-label="Skip onboarding"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Dynamic Step Content */}
            <div className="flex-grow flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                    id="onboarding-step-1"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 font-mono">STEP 1 OF 3</span>
                      <h4 className="text-xl font-extrabold text-slate-900 mt-1">Discover Powerful PDF & Image Tools</h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        PDFSwift bundles eight high-fidelity browser utilities directly inside your browser tab.
                      </p>
                    </div>

                    {/* Tool Categories list with icons */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Advanced PDF Editors</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Merge, slice/split, and optimize/compress PDFs seamlessly.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                          <Image className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Hi-Res Image Tools</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Bundle image sheets into clean PDFs, or render PDF pages to JPEG/PNG grids.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                        <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                          <RefreshCw className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Instant File Converters</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Extract printable text stream variables into Word files or convert extensions.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                    id="onboarding-step-2"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 font-mono">STEP 2 OF 3</span>
                      <h4 className="text-xl font-extrabold text-slate-900 mt-1">Free Daily Usage & Privacy</h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        Enjoy private browser operations. Our platform operates entirely without server-side dependencies.
                      </p>
                    </div>

                    {/* Usage Limits Card */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          3
                        </div>
                        <span className="text-xs font-bold text-indigo-950">Free Daily Actions for Guest & Sandbox users</span>
                      </div>

                      {/* Lights simulator */}
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100/50 justify-around text-center">
                        <div>
                          <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50 mx-auto" />
                          <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 block">ACTION 1</span>
                        </div>
                        <div className="h-5 w-[1px] bg-slate-100" />
                        <div>
                          <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50 mx-auto" />
                          <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 block">ACTION 2</span>
                        </div>
                        <div className="h-5 w-[1px] bg-slate-100" />
                        <div>
                          <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50 mx-auto" />
                          <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 block">ACTION 3</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed pt-1">
                        <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>Anonymous visitor caps reset every day at midnight local time. All operations are 100% GDPR, HIPAA and security-compliant.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                    id="onboarding-step-3"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 font-mono">STEP 3 OF 3</span>
                      <h4 className="text-xl font-extrabold text-slate-900 mt-1">Supercharge with Premium Plans</h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        Upgrade anytime to remove daily limitations and access professional tier capacities.
                      </p>
                    </div>

                    {/* Free vs Pro Comparison list */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-200/50 pb-1 mb-2">
                        <span>CAPABILITY</span>
                        <div className="flex gap-8">
                          <span>SANDBOX</span>
                          <span className="text-indigo-600 font-extrabold">PRO PLAN</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 font-medium">
                        <span className="text-slate-700">Daily Actions</span>
                        <div className="flex gap-8">
                          <span className="w-14 text-right text-slate-500">3 Limit</span>
                          <span className="w-14 text-right text-indigo-600 font-bold">Unlimited</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 font-medium">
                        <span className="text-slate-700">Max File Size</span>
                        <div className="flex gap-8">
                          <span className="w-14 text-right text-slate-500">10 MB</span>
                          <span className="w-14 text-right text-indigo-600 font-bold">500 MB</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 font-medium">
                        <span className="text-slate-700">Priority Engine</span>
                        <div className="flex gap-8">
                          <span className="w-14 text-right text-slate-500">Normal</span>
                          <span className="w-14 text-right text-indigo-600 font-bold">WASM Turbo</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        onClick={() => {
                          handleComplete();
                          onOpenPricing();
                        }}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs py-3 shadow-md flex items-center justify-center gap-1.5 transition"
                        id="onboarding-gopro-btn"
                      >
                        <Sparkles className="h-3.5 w-3.5 fill-white" /> View Premium Plans from $9
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step Indicators and Actions */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              {/* Dots */}
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStep(s)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step === s ? 'w-5 bg-indigo-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                    aria-label={`Go to step ${s}`}
                  />
                ))}
              </div>

              {/* Back / Next actions */}
              <div className="flex gap-2">
                {step > 1 && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1 px-3 rounded-lg hover:bg-slate-50"
                    id="onboarding-back-btn"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 rounded-xl bg-slate-900 text-white font-bold text-xs py-2 px-4 hover:bg-slate-800 transition"
                  id="onboarding-next-btn"
                >
                  {step === totalSteps ? 'Get Started' : 'Next'} <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
