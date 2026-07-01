import React from 'react';
import { User, LimitCheckResult } from '../types';
import { Sparkles, BarChart2, Shield, User as UserIcon, LogOut, FileText, ChevronDown } from 'lucide-react';

interface NavbarProps {
  activeTab: 'tools' | 'dashboard' | 'pricing' | 'admin';
  setActiveTab: (tab: 'tools' | 'dashboard' | 'pricing' | 'admin') => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
  usageLimit: LimitCheckResult;
  onOpenOnboarding: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenAuth,
  onOpenPricing,
  usageLimit,
  onOpenOnboarding,
}: NavbarProps) {
  const isPremium = user && (user.subscriptionTier === 'pro' || user.subscriptionTier === 'team');
  const isAdmin = user && user.role === 'admin';

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md" id="nav-container">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('tools')}
              className="flex items-center gap-2 font-sans text-xl font-bold tracking-tight text-slate-900 transition hover:opacity-90"
              id="logo-button"
            >
              <div className="flex h-8 w-8 items-center justify-center bg-indigo-600 rounded-lg text-white font-bold text-sm">
                P
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">
                PDFSwift
              </span>
            </button>

            {/* Main Nav Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
              <button
                onClick={() => setActiveTab('tools')}
                className={`transition-colors ${
                  activeTab === 'tools'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-800'
                }`}
                id="nav-tools"
              >
                All Tools
              </button>

              <button
                onClick={onOpenOnboarding}
                className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition"
                id="nav-onboarding-tour"
              >
                <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                Quick Tour
              </button>
              
              {user && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1.5 transition-colors ${
                    activeTab === 'dashboard'
                      ? 'text-indigo-600 font-semibold'
                      : 'hover:text-slate-800'
                  }`}
                  id="nav-dashboard"
                >
                  <BarChart2 className="h-4 w-4" />
                  Dashboard
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 transition-colors ${
                    activeTab === 'admin'
                      ? 'text-rose-600 font-semibold'
                      : 'text-slate-500 hover:text-rose-600'
                  }`}
                  id="nav-admin"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </button>
              )}
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-4">
            {/* Credit Status (for Free Users) */}
            {!isPremium && !isAdmin && (
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex flex-col items-end mr-1">
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Daily Usage</div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-300" 
                        style={{ width: `${((usageLimit.max - usageLimit.remaining) / usageLimit.max) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {usageLimit.max - usageLimit.remaining} / {usageLimit.max}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onOpenPricing}
                  className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100/50 transition shadow-xs"
                  id="nav-upgrade-btn"
                >
                  Go Pro
                </button>
              </div>
            )}

            {isPremium && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 fill-indigo-500 text-indigo-500" />
                <span>{user?.subscriptionTier === 'pro' ? 'PRO Plan' : 'TEAM Plan'}</span>
              </div>
            )}

            {/* Profile Dropdown / Auth Actions */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-400 font-mono">{user.email}</span>
                </div>
                
                {/* Standard log out and profile links */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="User Dashboard"
                    id="profile-dashboard-btn"
                  >
                    <UserIcon className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/60 transition"
                    title="Sign Out"
                    id="logout-btn"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  id="login-trigger-btn"
                >
                  Log In
                </button>
                <button
                  onClick={onOpenPricing}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                  id="signup-trigger-btn"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
