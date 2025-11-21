import { BaseDocument } from './base';

// Chat Message interface
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens: number;
}

// Chat Collection
export interface Chat extends BaseDocument {
  userId: string;
  title: string;
  messages: ChatMessage[];
  totalTokens: number;
  status: 'active' | 'archived' | 'deleted';
  tags: string[];
  metadata: {
    userAgent: string;
    ipAddress: string;
    location?: string;
  };
}

// Prompt Collection
export interface Prompt extends BaseDocument {
  name: string;
  category: string;
  content: string;
  variables: string[];
  usage: {
    totalUses: number;
    lastUsed?: Date;
    successRate: number;
  };
  isPublic: boolean;
  isActive: boolean;
  createdBy: string;
  tags: string[];
}

// Feedback Collection
export interface Feedback extends BaseDocument {
  chatId: string;
  userId: string;
  messageId: string;
  rating: number;
  feedback: string;
  category: 'accuracy' | 'helpfulness' | 'clarity';
  isResolved: boolean;
  adminNotes?: string;
}
