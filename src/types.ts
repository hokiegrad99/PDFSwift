export type SubscriptionTier = 'free' | 'pro' | 'team';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  subscriptionTier: SubscriptionTier;
  premiumUntil: string | null; // ISO timestamp or null if unlimited/active forever
  dailyUsageCount: number;
  lastUsageResetDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface UsageLog {
  id: string;
  userId: string;
  userEmail: string;
  toolId: string;
  toolName: string;
  timestamp: string; // ISO format
  fileName?: string;
  fileSize?: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  userEmail: string;
  planName: string;
  amount: number;
  date: string; // ISO format
  status: 'completed' | 'refunded';
  transactionId: string;
  cardBrand: string;
  last4: string;
}

export type ToolId =
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'pdf-to-image'
  | 'image-to-pdf'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'image-convert';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  category: 'pdf' | 'image' | 'convert';
  popular?: boolean;
}

export interface LimitCheckResult {
  allowed: boolean;
  remaining: number;
  max: number;
}

