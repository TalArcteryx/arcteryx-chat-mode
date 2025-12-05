import { BaseDocument } from './base';

// Analytics Collection
export interface Analytics extends BaseDocument {
  date: Date;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalChats: number;
    totalTokens: number;
    totalApiCalls: number;
    averageResponseTime: number;
    errorRate: number;
  };
  topQueries: string[];
  topCategories: string[];
}

// Templates Collection
export interface Template extends BaseDocument {
  name: string;
  type: 'email' | 'sms' | 'letter';
  category: 'product_recommendation' | 'order_followup' | 'abandoned_cart' | 'post_purchase' | 'marketing';
  
  subject?: string;
  content: string;
  variables: string[];
  
  usage: {
    totalSent: number;
    openRate?: number;
    responseRate: number;
    conversionRate: number;
  };
  
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  collectionId?: string; // Product collection or campaign
}
