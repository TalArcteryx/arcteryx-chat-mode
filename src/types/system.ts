import { BaseDocument } from './base';

// Logs Collection
export interface Log extends BaseDocument {
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'auth' | 'chat' | 'api' | 'system' | 'security' | 'real_estate';
  message: string;
  userId?: string;
  chatId?: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    stackTrace?: string;
  };
  severity: number; // 1-5 scale
}

// Configs Collection
export interface Config extends BaseDocument {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: 'api' | 'ui' | 'security' | 'limits' | 'real_estate';
  isPublic: boolean;
  updatedBy: string;
  version: number;
}

// Notifications Collection
export interface Notification extends BaseDocument {
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  expiresAt?: Date;
  readAt?: Date;
}

// Integrations Collection
export interface Integration extends BaseDocument {
  name: string;
  type: 'payment' | 'email' | 'analytics' | 'crm' | 'mls';
  config: any;
  isActive: boolean;
  lastSync?: Date;
  errorCount: number;
  lastError?: string;
}
