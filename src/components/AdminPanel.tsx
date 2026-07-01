import React, { useState, useEffect } from 'react';
import { User, UsageLog, PaymentHistory, SubscriptionTier } from '../types';
import { getAllUsers, saveAllUsers, getUsageLogs, getPayments, addPayment, deleteUserFromFirestore, syncAllUsersFromFirestore, syncUsageLogsFromFirestore, syncPaymentsFromFirestore } from '../utils/storage';
import { Shield, Users, BarChart2, DollarSign, FileText, Check, Award, RefreshCw, AlertCircle, Plus } from 'lucide-react';

interface AdminPanelProps {
  user: User;
  onRefreshUserData: () => void;
}

export default function AdminPanel({ user, onRefreshUserData }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>(getAllUsers());
  const [logs, setLogs] = useState<UsageLog[]>(getUsageLogs());
  const [payments, setPayments] = useState<PaymentHistory[]>(getPayments());
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'billing'>('users');

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const syncedUsers = await syncAllUsersFromFirestore();
        const syncedLogs = await syncUsageLogsFromFirestore();
        const syncedPayments = await syncPaymentsFromFirestore();
        setUsers(syncedUsers);
        setLogs(syncedLogs);
        setPayments(syncedPayments);
      } catch (e) {
        console.error('Error in AdminPanel sync:', e);
      }
    };
    fetchLatest();
  }, []);

  // Quick state overrides for simulated fields
  const [newPayEmail, setNewPayEmail] = useState('');
  const [newPayPlan, setNewPayPlan] = useState('Pro Monthly');
  const [newPayAmount, setNewPayAmount] = useState('9');

  const refreshData = () => {
    setUsers(getAllUsers());
    setLogs(getUsageLogs());
    setPayments(getPayments());
    onRefreshUserData();
  };

  // Administrative stats calculations
  const totalRevenue = payments.reduce((acc, pay) => acc + pay.amount, 0);
  const freeUsersCount = users.filter(u => u.subscriptionTier === 'free').length;
  const proUsersCount = users.filter(u => u.subscriptionTier === 'pro').length;
  const teamUsersCount = users.filter(u => u.subscriptionTier === 'team').length;

  // Tool Usage counts grouping for custom SVG popularity bar chart
  const getToolPopularity = () => {
    const counts: { [key: string]: { name: string; count: number } } = {};
    logs.forEach(log => {
      if (!counts[log.toolId]) {
        counts[log.toolId] = { name: log.toolName, count: 0 };
      }
      counts[log.toolId].count += 1;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  };

  const toolPopularityData = getToolPopularity();
  const maxPopularityCount = Math.max(...toolPopularityData.map(d => d.count), 1);

  // Administrative controls
  const handleUpdateTier = (userId: string, tier: SubscriptionTier) => {
    const allUsers = getAllUsers();
    const index = allUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      allUsers[index].subscriptionTier = tier;
      if (tier === 'free') {
        allUsers[index].premiumUntil = null;
      } else {
        allUsers[index].premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      saveAllUsers(allUsers);
      refreshData();
    }
  };

  const handleUpdateRole = (userId: string, role: 'user' | 'admin') => {
    const allUsers = getAllUsers();
    const index = allUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      allUsers[index].role = role;
      saveAllUsers(allUsers);
      refreshData();
    }
  };

  const handleResetUsage = (userId: string) => {
    const allUsers = getAllUsers();
    const index = allUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      allUsers[index].dailyUsageCount = 0;
      allUsers[index].lastUsageResetDate = new Date().toISOString().split('T')[0];
      saveAllUsers(allUsers);
      refreshData();
    }
  };

  const handleResetAllCounters = () => {
    const allUsers = getAllUsers().map(u => ({
      ...u,
      dailyUsageCount: 0,
      lastUsageResetDate: new Date().toISOString().split('T')[0]
    }));
    saveAllUsers(allUsers);
    alert('All user daily action counts successfully reset to 0!');
    refreshData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user.id) {
      alert("You cannot delete your own logged-in admin account!");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user account?")) {
      const allUsers = getAllUsers();
      const updated = allUsers.filter(u => u.id !== userId);
      saveAllUsers(updated);
      await deleteUserFromFirestore(userId);
      refreshData();
    }
  };

  const handlePurgeTestUsers = async () => {
    if (window.confirm("Are you sure you want to delete all pre-loaded test users? (This will remove all non-admin accounts)")) {
      const allUsers = getAllUsers();
      const toDelete = allUsers.filter(u => u.role !== 'admin' && u.id !== user.id);
      const remaining = allUsers.filter(u => u.role === 'admin' || u.id === user.id);
      saveAllUsers(remaining);
      for (const u of toDelete) {
        await deleteUserFromFirestore(u.id);
      }
      refreshData();
    }
  };

  const handleCreateSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayEmail) {
      alert('Please enter a user email.');
      return;
    }

    const matchedUser = users.find(u => u.email.toLowerCase() === newPayEmail.toLowerCase());
    const uId = matchedUser ? matchedUser.id : 'guest';

    addPayment({
      userId: uId,
      userEmail: newPayEmail.toLowerCase(),
      planName: newPayPlan,
      amount: Number(newPayAmount),
      status: 'completed',
      transactionId: `ch_sim_${Math.random().toString(36).substring(2, 9)}`,
      cardBrand: 'Visa Sandbox',
      last4: '4242',
    });

    // If there's a registered user, let's auto-upgrade them to match the plan they paid for!
    if (matchedUser) {
      const tier: SubscriptionTier = newPayPlan.includes('Team') ? 'team' : 'pro';
      handleUpdateTier(matchedUser.id, tier);
    }

    setNewPayEmail('');
    setNewPayAmount('9');
    refreshData();
    alert('Simulated transaction processed successfully!');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left" id="admin-panel-container">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-100">
            <Shield className="h-3 w-3" /> System Administrator Mode
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-2">
            Central Command Platform
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review user subscriptions, transaction entries, global serverless limits, and mock ARR volumes.
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Reset Counters Action */}
          <button
            onClick={handleResetAllCounters}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
            id="admin-reset-all-btn"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset All Counters
          </button>

          {/* Purge Test Users Action */}
          <button
            onClick={handlePurgeTestUsers}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition"
            id="admin-purge-test-users-btn"
          >
            <Users className="h-3.5 w-3.5" />
            Purge Test Users
          </button>
        </div>
      </div>

      {/* Administrative Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Total Users
            </span>
            <Users className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <span className="block text-2xl font-extrabold text-slate-900">{users.length}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {freeUsersCount} Free • {proUsersCount} Pro • {teamUsersCount} Team
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Action Logs
            </span>
            <FileText className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <span className="block text-2xl font-extrabold text-slate-900">{logs.length}</span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            Client-Side Verified Sandbox
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Simulated Revenue
            </span>
            <DollarSign className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <span className="block text-2xl font-extrabold text-slate-900">${totalRevenue}.00</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Total simulated transaction ARR
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              System Health
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <span className="block text-xl font-bold text-slate-900">100% ONLINE</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Serverless • Zero Host Cost
          </span>
        </div>

      </div>

      {/* Navigation tabs within Admin */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Accounts & User Management
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            SaaS Usage Analytics
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'billing'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Billing Transactions
          </button>
        </nav>
      </div>

      {/* Tab Contents: Users List */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Registered Accounts Table</h3>
            <span className="text-xs text-slate-400 font-mono">Total size: {users.length} accounts</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/20 text-slate-500 font-semibold">
                  <th className="p-4">User / Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Subscription Tier</th>
                  <th className="p-4">Daily Actions Used</th>
                  <th className="p-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/40 font-sans">
                    <td className="p-4">
                      <div>
                        <span className="font-semibold text-slate-900 block">{u.name}</span>
                        <span className="text-slate-400 font-mono block mt-0.5">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value as 'user' | 'admin')}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={u.subscriptionTier}
                        onChange={(e) => handleUpdateTier(u.id, e.target.value as SubscriptionTier)}
                        className={`rounded-lg border px-2 py-1 font-semibold focus:outline-none ${
                          u.subscriptionTier === 'free'
                            ? 'border-slate-200 text-slate-700 bg-white'
                            : u.subscriptionTier === 'pro'
                            ? 'border-sky-200 text-sky-700 bg-sky-50'
                            : 'border-indigo-200 text-indigo-700 bg-indigo-50'
                        }`}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="team">Team</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{u.dailyUsageCount} / 3</span>
                        <button
                          onClick={() => handleResetUsage(u.id)}
                          className="text-[10px] font-bold text-sky-600 hover:text-sky-700 font-mono"
                          title="Reset daily action usage"
                        >
                          [Reset]
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateTier(u.id, 'pro')}
                          className="rounded-lg bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 px-2 py-1 font-semibold text-[10px] transition"
                        >
                          Grant Pro
                        </button>
                        <button
                          onClick={() => handleUpdateTier(u.id, 'team')}
                          className="rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 px-2 py-1 font-semibold text-[10px] transition"
                        >
                          Grant Team
                        </button>
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="rounded-lg bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 px-2.5 py-1 font-semibold text-[10px] transition"
                            title="Permanently delete user account"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Tool Popularity Bar Chart */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Tool Popularity</h3>
            <p className="text-xs text-slate-400 mb-6">Which document operations are executed most by client browser instances.</p>
            
            {toolPopularityData.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No tool logs recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {toolPopularityData.map((data, i) => {
                  const pct = (data.count / maxPopularityCount) * 100;
                  return (
                    <div key={i} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-800">{data.name}</span>
                        <span className="text-slate-500 font-mono">{data.count} actions</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 relative overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secure Operations Audit Feed */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Security Audit Feed</h3>
              <p className="text-xs text-slate-400 mb-4">Real-time listing of browser sandbox processing transactions.</p>
              
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {logs.slice(0, 15).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-mono text-slate-400 mr-1">[{log.toolName}]</span>
                        <span className="text-slate-700 font-semibold">{log.userEmail}</span>
                        <span className="text-slate-400 block truncate text-[10px]">
                          File: {log.fileName || 'document.pdf'} ({log.fileSize || 'N/A'})
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab Contents: Billing */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Simulated billing history table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Simulated Payments History</h3>
              <span className="text-xs text-slate-400 font-mono">Count: {payments.length} invoices</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/20 text-slate-500 font-semibold">
                    <th className="p-4">Receipt / Date</th>
                    <th className="p-4">Customer Email</th>
                    <th className="p-4">Paid Item</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/40">
                      <td className="p-4 font-mono">
                        <div>
                          <span className="font-semibold text-slate-800">{p.id}</span>
                          <span className="text-slate-400 block mt-0.5">
                            {new Date(p.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-700">{p.userEmail}</td>
                      <td className="p-4 font-semibold text-slate-900">{p.planName}</td>
                      <td className="p-4 font-bold text-slate-900">${p.amount}.00</td>
                      <td className="p-4 font-mono text-slate-500 text-[10px]">{p.transactionId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seed payment simulation console */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit text-left">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Simulate Revenue Event</h3>
            <p className="text-xs text-slate-400 mb-4">Inject mock Stripe receipts into the system audit log instantly.</p>
            
            <form onSubmit={handleCreateSimulatedPayment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  required
                  value={newPayEmail}
                  onChange={(e) => setNewPayEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                  placeholder="user@pdftools.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Plan Description
                </label>
                <select
                  value={newPayPlan}
                  onChange={(e) => setNewPayPlan(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 bg-white"
                >
                  <option value="Pro Monthly">Pro Monthly ($9)</option>
                  <option value="Pro Annual">Pro Annual ($84)</option>
                  <option value="Team Monthly">Team Monthly ($25)</option>
                  <option value="Team Annual">Team Annual ($228)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Paid Amount ($)
                </label>
                <input
                  type="number"
                  required
                  value={newPayAmount}
                  onChange={(e) => setNewPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 font-mono"
                  placeholder="9"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Seed Simulated Payment
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
