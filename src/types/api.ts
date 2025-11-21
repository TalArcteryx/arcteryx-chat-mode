import { BaseDocument } from './base';

// API Call Collection
export interface ApiCall extends BaseDocument {
  userId: string;
  chatId: string;
  endpoint: string;
  method: string;
  requestTokens: number;
  responseTokens: number;
  totalTokens: number;
  model: string;
  cost: number;
  status: 'success' | 'error' | 'rate_limited';
  errorMessage?: string;
  responseTime: number;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

// Rate Limits Collection
export interface RateLimit extends BaseDocument {
  userId: string;
  type: 'daily' | 'monthly' | 'per_request';
  limit: number;
  used: number;
  resetAt: Date;
  isActive: boolean;
}
