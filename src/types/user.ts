import { BaseDocument } from './base';

// User Collection
export interface User extends BaseDocument {
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'realtor' | 'broker';
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
  
  // Realtor specific fields
  realtorLicense?: string;
  brokerageId?: string;
  specialties?: string[];
  yearsExperience?: number;
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
  metadata: any;
}
