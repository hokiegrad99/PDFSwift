import React, { useState } from 'react';
import { User, UsageLog, PaymentHistory } from '../types';
import { getUsageLogs, getPayments } from '../utils/storage';
import { BarChart, Calendar, CreditCard, Clock, FileText, CheckCircle, RefreshCw, Award, ArrowUpRight } from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onOpenPricing: () => void;
}

export default function UserDashboard({ user, onOpenPricing }: UserDashboardProps) {
  const [activeReceipt, setActiveReceipt] = useState<PaymentHistory | null>(null);

  const logs = getUsageLogs().filter(log => log.userId === user.id);
  const payments = getPayments().filter(pay => pay.userId === user.id);

  const isPremium = user.subscriptionTier === 'pro' || user.subscriptionTier === 'team';

  // Group logs by day to display a beautiful visual SVG bar chart
  const getLast7DaysData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const count = logs.filter(log => log.timestamp.startsWith(dateStr)).length;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      data.push({ dayName, count });
    }
    return data;
  };

  const chartData = getLast7DaysData();
  const maxCount = Math.max(...chartData.map(d => d.count), 3); // minimum baseline height 3

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left" id="user-dashboard-container">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {user.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor your workspace, billing transactions, and browser usage logs in one secure interface.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl">
          Account ID: {user.id}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Billing */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Subscription Tier Info */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs relative overflow-hidden" id="dash-plan-card">
            <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Current Plan
            </span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-xl font-bold text-slate-900 capitalize">
                {user.subscriptionTier} Membership
              </h3>
              {isPremium && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100 uppercase">
                  Active
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {user.subscriptionTier === 'free' 
                ? 'Your free membership gives you 3 secure document edits per day.'
                : user.subscriptionTier === 'pro'
                ? 'Enjoy unlimited uploads, high-capacity file limits, and prioritized WASM speed.'
                : 'Enterprise team cluster enabled with access to master billing analytics.'}
            </p>

            {/* Display limits details */}
            <div className="mt-5 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Daily Free Actions</span>
                <span className="font-semibold text-slate-900">{isPremium ? 'Unlimited' : '3 uses'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Max Upload Limit</span>
                <span className="font-semibold text-slate-900">{isPremium ? '150 MB' : '10 MB'}</span>
              </div>
              {user.premiumUntil && (
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400">Renews On</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {new Date(user.premiumUntil).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {!isPremium && (
              <button
                onClick={onOpenPricing}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 mt-5 shadow-xs transition flex items-center justify-center gap-1"
                id="dash-upgrade-btn"
              >
                Go Pro for $9 <Award className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-200/40 mb-3">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <span className="block text-xs font-medium text-slate-500">Processed</span>
              <span className="block text-xl font-bold text-slate-900 mt-1">{logs.length} docs</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-200/40 mb-3">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
              <span className="block text-xs font-medium text-slate-500">Transactions</span>
              <span className="block text-xl font-bold text-slate-900 mt-1">{payments.length} paid</span>
            </div>
          </div>

          {/* Billing List */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs text-left">
            <h4 className="font-bold text-slate-900 text-sm mb-4">Billing History</h4>
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400">No transactions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((pay) => (
                  <button
                    key={pay.id}
                    onClick={() => setActiveReceipt(pay)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 text-left transition font-sans text-xs"
                    id={`payment-row-${pay.id}`}
                  >
                    <div>
                      <span className="block font-semibold text-slate-900">{pay.planName}</span>
                      <span className="block text-slate-400 font-mono mt-0.5">
                        {new Date(pay.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">${pay.amount}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Usage Graphs & Recent logs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SVG Usage Chart */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs text-left" id="dash-analytics">
            <h3 className="font-bold text-slate-900 text-base mb-1">Document Actions</h3>
            <p className="text-xs text-slate-400">Daily count of PDF & image processing actions over the last 7 days.</p>
            
            {/* Elegant SVG Chart */}
            <div className="mt-6 flex h-48 items-end gap-3 px-2">
              {chartData.map((data, i) => {
                const pct = (data.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-lg flex items-end h-32 relative overflow-hidden group">
                      {/* Interactive hover counter */}
                      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-semibold rounded px-1.5 py-0.5 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono">
                        {data.count} docs
                      </span>
                      {/* Active bar */}
                      <div
                        style={{ height: `${pct}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-600 group-hover:opacity-90 transition-all duration-500"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                      {data.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secure Execution Log */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs text-left" id="dash-logs-list">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Local Activity Logs</h3>
                <p className="text-[11px] text-slate-400">Chronological history of documents processed strictly in your client sandbox.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Secure Client
              </span>
            </div>

            {logs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs">No files processed in your history logs yet.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Try using any PDF or image format tool above!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs font-sans">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100/50">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block truncate max-w-xs md:max-w-md">
                          {log.fileName || 'unnamed_document.pdf'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Tool: {log.toolName} • {log.fileSize || 'Unknown Size'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Interactive invoice details popup drawer */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" id="receipt-overlay">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-left">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Receipt Detail</h4>
                <p className="text-xs text-slate-400">PDFSwift SaaS Platform Invoice</p>
              </div>
              <button
                onClick={() => setActiveReceipt(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-t border-slate-100 my-4" />

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-bold text-slate-900">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-bold text-slate-900">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purchased Item:</span>
                <span className="font-bold text-slate-900">{activeReceipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date Paid:</span>
                <span className="font-bold text-slate-900">
                  {new Date(activeReceipt.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Card:</span>
                <span className="font-bold text-slate-900">
                  {activeReceipt.cardBrand} (**** {activeReceipt.last4})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-bold text-slate-700 text-[10px]">{activeReceipt.transactionId}</span>
              </div>
              
              <div className="border-t border-dashed border-slate-200 my-3" />

              <div className="flex justify-between text-sm font-bold text-slate-950 pt-2">
                <span>Total Amount Charged:</span>
                <span className="text-indigo-600">${activeReceipt.amount}.00</span>
              </div>

              <div className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 p-2.5 text-center font-semibold text-[10px] mt-4 font-sans">
                ✓ Secured & Audited locally by sandbox ledger
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// X inline icon
function X({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
