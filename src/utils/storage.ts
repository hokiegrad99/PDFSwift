import { User, UsageLog, PaymentHistory, ToolId, SubscriptionTier, LimitCheckResult } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'pdf_tools_current_user',
  ALL_USERS: 'pdf_tools_all_users',
  USAGE_LOGS: 'pdf_tools_usage_logs',
  PAYMENTS: 'pdf_tools_payments',
};

// Seed administrative and regular user accounts for quick testing
const PRE_SEEDED_USERS: User[] = [
  {
    id: 'admin-id-123',
    email: 'admin@pdftools.com',
    name: 'Sarah Jenkins (Admin)',
    password: 'admin-pass-2026',
    role: 'admin',
    subscriptionTier: 'team',
    premiumUntil: '2030-12-31T23:59:59.000Z',
    dailyUsageCount: 0,
    lastUsageResetDate: new Date().toISOString().split('T')[0],
    createdAt: '2026-01-15T08:30:00.000Z',
  },
  {
    id: 'user-id-456',
    email: 'user@pdftools.com',
    name: 'Alex Rivera',
    password: 'password',
    role: 'user',
    subscriptionTier: 'free',
    premiumUntil: null,
    dailyUsageCount: 0,
    lastUsageResetDate: new Date().toISOString().split('T')[0],
    createdAt: '2026-06-20T14:15:00.000Z',
  },
  {
    id: 'user-id-789',
    email: 'premium@pdftools.com',
    name: 'Emily Chen',
    password: 'password',
    role: 'user',
    subscriptionTier: 'pro',
    premiumUntil: '2027-01-01T00:00:00.000Z',
    dailyUsageCount: 0,
    lastUsageResetDate: new Date().toISOString().split('T')[0],
    createdAt: '2026-06-25T09:00:00.000Z',
  }
];

const PRE_SEEDED_LOGS = (userIds: string[]): UsageLog[] => {
  return [];
};

const PRE_SEEDED_PAYMENTS = (userIds: string[]): PaymentHistory[] => [];

export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ALL_USERS)) {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(PRE_SEEDED_USERS));
  }
  
  // Clean all preloaded sample data from local storage if not cleared yet
  const cacheCleared = localStorage.getItem('pdfswift_sample_data_cleared_v1');
  if (cacheCleared !== 'true') {
    localStorage.setItem(STORAGE_KEYS.USAGE_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem('pdfswift_sample_data_cleared_v1', 'true');
  } else {
    if (!localStorage.getItem(STORAGE_KEYS.USAGE_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.USAGE_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    }
  }
};

export const getAllUsers = (): User[] => {
  initializeStorage();
  const usersStr = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
  return usersStr ? JSON.parse(usersStr) : PRE_SEEDED_USERS;
};

export const saveAllUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!userStr) return null;
  
  const user: User = JSON.parse(userStr);
  // Ensure daily counter is reset if day changed
  const today = new Date().toISOString().split('T')[0];
  if (user.lastUsageResetDate !== today) {
    user.dailyUsageCount = 0;
    user.lastUsageResetDate = today;
    saveCurrentUser(user);
    updateUserInList(user);
  }
  return user;
};

export const saveCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const updateUserInList = (user: User) => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
    saveAllUsers(users);
  }
};

export const getUsageLogs = (): UsageLog[] => {
  initializeStorage();
  const logsStr = localStorage.getItem(STORAGE_KEYS.USAGE_LOGS);
  return logsStr ? JSON.parse(logsStr) : [];
};

export const addUsageLog = (log: Omit<UsageLog, 'id' | 'timestamp'>) => {
  const logs = getUsageLogs();
  const newLog: UsageLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.USAGE_LOGS, JSON.stringify(logs));
};

export const getPayments = (): PaymentHistory[] => {
  initializeStorage();
  const paymentsStr = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
  return paymentsStr ? JSON.parse(paymentsStr) : [];
};

export const addPayment = (payment: Omit<PaymentHistory, 'id' | 'date'>) => {
  const payments = getPayments();
  const newPayment: PaymentHistory = {
    ...payment,
    id: `pay-${Date.now()}`,
    date: new Date().toISOString(),
  };
  payments.unshift(newPayment);
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
};

// Check if user has available limits
export const checkUsageLimit = (user: User | null): LimitCheckResult => {
  const maxFreeUses = 3;
  const today = new Date().toISOString().split('T')[0];

  // If user is Admin or Premium (Pro or Team), they have unlimited usage
  if (user && (user.role === 'admin' || user.subscriptionTier === 'pro' || user.subscriptionTier === 'team')) {
    return { allowed: true, remaining: 99999, max: 99999 };
  }

  if (user) {
    // Registered free user
    if (user.lastUsageResetDate !== today) {
      user.dailyUsageCount = 0;
      user.lastUsageResetDate = today;
      saveCurrentUser(user);
      updateUserInList(user);
    }
    const remaining = Math.max(0, maxFreeUses - user.dailyUsageCount);
    return {
      allowed: remaining > 0,
      remaining,
      max: maxFreeUses,
    };
  } else {
    // Anonymous/Guest user
    const guestKey = `pdf_tools_guest_usage_${today}`;
    const usageCount = Number(localStorage.getItem(guestKey) || '0');
    const remaining = Math.max(0, maxFreeUses - usageCount);
    return {
      allowed: remaining > 0,
      remaining,
      max: maxFreeUses,
    };
  }
};

// Record tool usage
export const recordToolUsage = (user: User | null, toolId: ToolId, toolName: string, fileName?: string, fileSize?: string): User | null => {
  const today = new Date().toISOString().split('T')[0];
  
  // Log the usage
  addUsageLog({
    userId: user ? user.id : 'guest',
    userEmail: user ? user.email : 'guest@anonymous.com',
    toolId,
    toolName,
    fileName,
    fileSize,
  });

  if (user) {
    // Skip updating limits for unlimited tiers
    if (user.role === 'admin' || user.subscriptionTier === 'pro' || user.subscriptionTier === 'team') {
      return user;
    }
    
    // Increment registered free user
    if (user.lastUsageResetDate !== today) {
      user.dailyUsageCount = 1;
      user.lastUsageResetDate = today;
    } else {
      user.dailyUsageCount += 1;
    }
    saveCurrentUser(user);
    updateUserInList(user);
    return user;
  } else {
    // Increment guest user
    const guestKey = `pdf_tools_guest_usage_${today}`;
    const usageCount = Number(localStorage.getItem(guestKey) || '0');
    localStorage.setItem(guestKey, String(usageCount + 1));
    return null;
  }
};
