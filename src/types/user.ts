import { BaseDocument } from './base';

// User Collection
export interface User extends BaseDocument {
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'expert' | 'ambassador';
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'cancelled';
  };
  usage: {
    totalChats: number;
    totalTokens: number;
    monthlyTokens: number;
    lastReset: Date;
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
  lastActive: Date;
  isActive: boolean;
  
  // Expert/Ambassador specific fields
  expertise?: string[]; // e.g., ['climbing', 'skiing', 'trail_running']
  certifications?: string[];
  yearsExperience?: number;
  ambassadorTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// Subscription Collection
export interface Subscription extends BaseDocument {
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata: Record<string, unknown>;
}
