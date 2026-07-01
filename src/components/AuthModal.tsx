import React, { useState } from 'react';
import { User } from '../types';
import { getAllUsers, saveCurrentUser, saveAllUsers, getCurrentUser } from '../utils/storage';
import { Mail, Lock, User as UserIcon, X, AlertCircle, Sparkles, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleDemoLogin = (demoEmail: string) => {
    const users = getAllUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === demoEmail.toLowerCase());
    if (foundUser) {
      saveCurrentUser(foundUser);
      onLoginSuccess(foundUser);
      setSuccess(`Welcome back, ${foundUser.name}!`);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields.');
      return;
    }

    const users = getAllUsers();

    if (email.toLowerCase() === 'admin@pdftools.com') {
      setError('Access denied. Administrative accounts must authenticate via the secure Admin Portal.');
      return;
    }

    if (isLogin) {
      // Handle login
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (foundUser) {
        saveCurrentUser(foundUser);
        onLoginSuccess(foundUser);
        setSuccess(`Welcome back, ${foundUser.name}!`);
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1200);
      } else {
        // Automatically create a free user if not found (helps reduce signup Friction)
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: email.toLowerCase(),
          name: email.split('@')[0],
          role: 'user',
          subscriptionTier: 'free',
          premiumUntil: null,
          dailyUsageCount: 0,
          lastUsageResetDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };
        const updatedUsers = [...users, newUser];
        saveAllUsers(updatedUsers);
        saveCurrentUser(newUser);
        onLoginSuccess(newUser);
        setSuccess(`Welcome to PDFSwift, ${newUser.name}!`);
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1200);
      }
    } else {
      // Handle register
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (foundUser) {
        setError('This email is already registered. Please log in.');
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        name,
        role: 'user',
        subscriptionTier: 'free',
        premiumUntil: null,
        dailyUsageCount: 0,
        lastUsageResetDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...users, newUser];
      saveAllUsers(updatedUsers);
      saveCurrentUser(newUser);
      onLoginSuccess(newUser);
      setSuccess(`Account created! Welcome, ${name}.`);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" id="auth-modal-overlay">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl border border-slate-100" id="auth-modal-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            id="close-auth-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info or Alerts */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 font-medium mb-4 animate-shake" id="auth-error-alert">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-700 font-medium mb-4" id="auth-success-alert">
            <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Demo Fast-login shortcuts */}
        <div className="mb-5 bg-slate-50 border border-slate-200/60 rounded-xl p-3">
          <span className="block text-xs font-semibold text-slate-500 mb-2 font-mono">
            TEST ACCESS SHORTCUTS:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('user@pdftools.com')}
              className="flex-1 rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition hover:border-slate-300"
              id="quick-login-free"
            >
              👤 Log In (Free Tier)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('premium@pdftools.com')}
              className="flex-1 rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition hover:border-slate-300"
              id="quick-login-premium"
            >
              ⭐ Log In (Pro Tier)
            </button>
          </div>
        </div>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="John Doe"
                  id="auth-name-input"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="name@example.com"
                id="auth-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="••••••••"
                id="auth-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 mt-2"
            id="auth-submit-btn"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center mt-5 text-xs text-slate-500">
          {isLogin ? (
            <span>
              Don't have an account yet?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="font-semibold text-sky-600 hover:text-sky-700"
                id="toggle-register-btn"
              >
                Sign Up for free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="font-semibold text-sky-600 hover:text-sky-700"
                id="toggle-login-btn"
              >
                Sign In instead
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
