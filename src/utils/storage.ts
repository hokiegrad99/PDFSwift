import { User, UsageLog, PaymentHistory, ToolId, SubscriptionTier, LimitCheckResult } from '../types';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

export const syncAllUsersFromFirestore = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    
    if (users.length === 0) {
      // Seed pre-seeded users in Firestore
      for (const u of PRE_SEEDED_USERS) {
        try {
          await setDoc(doc(db, 'users', u.id), u);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${u.id}`);
        }
        users.push(u);
      }
    }
    
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
    return users;
  } catch (error) {
    if (error instanceof Error && error.message.includes('operationType')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, 'users');
    return getAllUsers();
  }
};

export const syncUsageLogsFromFirestore = async (): Promise<UsageLog[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'usage_logs'));
    const logs: UsageLog[] = [];
    querySnapshot.forEach((doc) => {
      logs.push(doc.data() as UsageLog);
    });
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    localStorage.setItem(STORAGE_KEYS.USAGE_LOGS, JSON.stringify(logs));
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'usage_logs');
    return getUsageLogs();
  }
};

export const syncPaymentsFromFirestore = async (): Promise<PaymentHistory[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'payments'));
    const payments: PaymentHistory[] = [];
    querySnapshot.forEach((doc) => {
      payments.push(doc.data() as PaymentHistory);
    });
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    return payments;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'payments');
    return getPayments();
  }
};

export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
};

export const getAllUsers = (): User[] => {
  initializeStorage();
  const usersStr = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
  return usersStr ? JSON.parse(usersStr) : PRE_SEEDED_USERS;
};

export const saveAllUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  // Write all to Firestore in background
  for (const u of users) {
    setDoc(doc(db, 'users', u.id), u).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`);
    });
  }
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
    // Write updated current user state to Firestore as well
    setDoc(doc(db, 'users', user.id), user).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    });
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
  } else {
    // If user is not in the local list, add them to it
    const updated = [...users, user];
    saveAllUsers(updated);
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
  
  // Write to Firestore in background
  setDoc(doc(db, 'usage_logs', newLog.id), newLog).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, `usage_logs/${newLog.id}`);
  });
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

  // Write to Firestore in background
  setDoc(doc(db, 'payments', newPayment.id), newPayment).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, `payments/${newPayment.id}`);
  });
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
