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
    role: 'user',
    subscriptionTier: 'free',
    premiumUntil: null,
    dailyUsageCount: 1, // Pre-used 1 for realism
    lastUsageResetDate: new Date().toISOString().split('T')[0],
    createdAt: '2026-06-20T14:15:00.000Z',
  },
  {
    id: 'user-id-789',
    email: 'premium@pdftools.com',
    name: 'Emily Chen',
    role: 'user',
    subscriptionTier: 'pro',
    premiumUntil: '2027-01-01T00:00:00.000Z',
    dailyUsageCount: 0,
    lastUsageResetDate: new Date().toISOString().split('T')[0],
    createdAt: '2026-06-25T09:00:00.000Z',
  }
];

const PRE_SEEDED_LOGS = (userIds: string[]): UsageLog[] => {
  const tools: { id: ToolId; name: string }[] = [
    { id: 'merge-pdf', name: 'Merge PDF' },
    { id: 'split-pdf', name: 'Split PDF' },
    { id: 'compress-pdf', name: 'Compress PDF' },
    { id: 'pdf-to-image', name: 'PDF to Image' },
    { id: 'image-to-pdf', name: 'Image to PDF' },
    { id: 'pdf-to-word', name: 'PDF to Word' },
    { id: 'word-to-pdf', name: 'Word to PDF' },
    { id: 'image-convert', name: 'Convert Image' },
  ];

  const logs: UsageLog[] = [];
  const now = new Date();

  // Create mock logs for the last 7 days
  for (let i = 0; i < 45; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const logDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const randomUserIndex = Math.floor(Math.random() * userIds.length);
    const randomTool = tools[Math.floor(Math.random() * tools.length)];
    const isEmily = randomUserIndex === 2;
    const email = isEmily ? 'premium@pdftools.com' : (randomUserIndex === 1 ? 'user@pdftools.com' : 'guest@anonymous.com');
    const uId = isEmily ? userIds[2] : (randomUserIndex === 1 ? userIds[1] : 'guest');

    logs.push({
      id: `log-${i}`,
      userId: uId,
      userEmail: email,
      toolId: randomTool.id,
      toolName: randomTool.name,
      timestamp: logDate.toISOString(),
      fileName: `document_${i + 1}.${randomTool.id.includes('image') ? 'jpg' : 'pdf'}`,
      fileSize: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
    });
  }
  return logs;
};

const PRE_SEEDED_PAYMENTS = (userIds: string[]): PaymentHistory[] => [
  {
    id: 'pay-1',
    userId: userIds[2], // Emily Chen
    userEmail: 'premium@pdftools.com',
    planName: 'Pro Monthly',
    amount: 9,
    date: '2026-06-25T09:05:00.000Z',
    status: 'completed',
    transactionId: 'ch_3M8x9fLkd93Jdj82Jsd10a',
    cardBrand: 'Visa',
    last4: '4242',
  },
  {
    id: 'pay-2',
    userId: 'user-id-custom-1',
    userEmail: 'finance-corp@office.com',
    planName: 'Team Annual',
    amount: 228,
    date: '2026-06-18T11:24:00.000Z',
    status: 'completed',
    transactionId: 'ch_3M8x9fLkd93Jdj82Jsd10b',
    cardBrand: 'Mastercard',
    last4: '9876',
  },
  {
    id: 'pay-3',
    userId: 'user-id-custom-2',
    userEmail: 'jack.design@gmail.com',
    planName: 'Pro Annual',
    amount: 84,
    date: '2026-06-02T16:40:00.000Z',
    status: 'completed',
    transactionId: 'ch_3M8x9fLkd93Jdj82Jsd10c',
    cardBrand: 'Amex',
    last4: '1005',
  }
];

export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ALL_USERS)) {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(PRE_SEEDED_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USAGE_LOGS)) {
    const userIds = PRE_SEEDED_USERS.map(u => u.id);
    localStorage.setItem(STORAGE_KEYS.USAGE_LOGS, JSON.stringify(PRE_SEEDED_LOGS(userIds)));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    const userIds = PRE_SEEDED_USERS.map(u => u.id);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(PRE_SEEDED_PAYMENTS(userIds)));
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
