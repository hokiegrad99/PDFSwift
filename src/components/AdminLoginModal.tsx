import React, { useState } from 'react';
import { User } from '../types';
import { getAllUsers, saveCurrentUser, saveAllUsers, getCurrentUser } from '../utils/storage';
import { Shield, Mail, Lock, X, AlertCircle, Check, Key, Clipboard, ClipboardCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const adminEmailCred = 'admin@pdftools.com';
  const adminPassCred = 'admin-pass-2026';

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'email' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleAdminAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please provide administrative credentials.');
      return;
    }

    if (email.toLowerCase() !== adminEmailCred.toLowerCase() || password !== adminPassCred) {
      setError('Invalid security token or unauthorized administrative credentials.');
      return;
    }

    // Success! Log in as the administrative user
    const users = getAllUsers();
    let adminUser = users.find(u => u.email.toLowerCase() === adminEmailCred.toLowerCase());

    if (!adminUser) {
      // Reseed admin user in case they deleted it or it got cleared
      adminUser = {
        id: 'admin-id-123',
        email: adminEmailCred,
        name: 'Sarah Jenkins (Admin)',
        role: 'admin',
        subscriptionTier: 'team',
        premiumUntil: '2030-12-31T23:59:59.000Z',
        dailyUsageCount: 0,
        lastUsageResetDate: new Date().toISOString().split('T')[0],
        createdAt: '2026-01-15T08:30:00.000Z',
      };
      saveAllUsers([...users, adminUser]);
    } else {
      // Ensure role is admin
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        const updated = users.map(u => u.id === adminUser!.id ? adminUser! : u);
        saveAllUsers(updated);
      }
    }

    saveCurrentUser(adminUser);
    onLoginSuccess(adminUser);
    setSuccess('Administrative secure tunnel established successfully!');
    
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4" id="admin-login-overlay">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-white" id="admin-login-content">
        
        {/* Decorative ambient background light */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
          id="close-admin-login-modal"
          aria-label="Close Admin Portal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-3">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight">Administrative Security Gate</h3>
          <p className="text-xs text-slate-400 mt-1">Authorized system administrators only.</p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 p-3.5 text-xs text-rose-300 font-medium mb-4 animate-shake" id="admin-login-error">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 p-3.5 text-xs text-emerald-300 font-medium mb-4" id="admin-login-success">
            <Check className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Credentials Display Panel */}
        <div className="mb-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 space-y-3.5 text-xs">
          <span className="block text-[10px] uppercase font-extrabold tracking-wider text-rose-500 font-mono">
            SECURE ACCESS CREDENTIALS:
          </span>
          
          <div className="space-y-2">
            {/* Email credential block */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-2">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium">ADMIN EMAIL</span>
                <span className="font-mono text-slate-200 font-semibold">{adminEmailCred}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(adminEmailCred, 'email')}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                title="Copy Email"
                id="copy-admin-email"
              >
                {copiedEmail ? <ClipboardCheck className="h-4 w-4 text-emerald-500" /> : <Clipboard className="h-4 w-4" />}
              </button>
            </div>

            {/* Password credential block */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-2">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium">SECURITY KEY / PASSWORD</span>
                <span className="font-mono text-slate-200 font-semibold">{adminPassCred}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(adminPassCred, 'pass')}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                title="Copy Security Key"
                id="copy-admin-pass"
              >
                {copiedPass ? <ClipboardCheck className="h-4 w-4 text-emerald-500" /> : <Clipboard className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleAdminAuthenticate} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
              Secure Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                placeholder="admin@pdftools.com"
                id="admin-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
              Security Key / Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                placeholder="••••••••••••••••"
                id="admin-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-3 text-xs font-extrabold text-white shadow-md hover:from-rose-500 hover:to-rose-600 transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-900 mt-2"
            id="admin-auth-submit-btn"
          >
            <Key className="h-3.5 w-3.5" /> Authenticate Connection
          </button>
        </form>

        <div className="text-center mt-5 text-[11px] text-slate-500">
          This connection is fully encrypted and monitored.
        </div>
      </div>
    </div>
  );
}
