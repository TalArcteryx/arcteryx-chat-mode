import { BaseDocument } from './base';

// Properties Collection
export interface Property extends BaseDocument {
  mlsNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'commercial' | 'land';
  status: 'for_sale' | 'sold' | 'pending' | 'off_market' | 'rented';
  price: {
    current: number;
    original: number;
    pricePerSqFt: number;
  };
  details: {
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    lotSize: number;
    yearBuilt: number;
    parking: string;
  };
  features: string[];
  images: string[];
  description: string;
  agentId: string;
  brokerageId: string;
  listedAt: Date;
  soldAt?: Date;
  daysOnMarket: number;
}

// Brokerages Collection
export interface Brokerage extends BaseDocument {
  name: string;
  licenseNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  logo?: string;
  description: string;
  specialties: string[];
  teamSize: number;
  yearsInBusiness: number;
  isActive: boolean;
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
    features: string[];
    startDate: Date;
    endDate: Date;
  };
}

// Leads Collection
export interface Lead extends BaseDocument {
  source: 'chat' | 'website_form' | 'referral' | 'social_media' | 'mls' | 'open_house';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    preferredContact: 'email' | 'phone' | 'text';
  };
  
  needs: {
    propertyType: string;
    budget: {
      min: number;
      max: number;
    };
    location: string[];
    timeline: 'immediate' | '3_months' | '6_months' | '1_year';
    urgency: 'very_urgent' | 'urgent' | 'not_urgent';
  };
  
  assignedTo: string;
  brokerageId: string;
  
  score: number; // 1-100 lead quality score
  sourceScore: number;
  
  firstContact?: Date;
  lastContact?: Date;
  nextFollowUp?: Date;
  totalContacts: number;
  
  convertedProperty?: string;
  convertedAt?: Date;
  commission?: number;
  
  notes: LeadNote[];
}

export interface LeadNote {
  content: string;
  createdBy: string;
  createdAt: Date;
  isPrivate: boolean;
}

// Appointments Collection
export interface Appointment extends BaseDocument {
  leadId: string;
  propertyId?: string;
  agentId: string;
  type: 'showing' | 'consultation' | 'open_house' | 'closing';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  
  startTime: Date;
  endTime: Date;
  duration: number; // In minutes
  
  location: {
    address: string;
    coordinates?: [number, number];
    isVirtual: boolean;
  };
  
  notes?: string;
  followUpRequired: boolean;
  nextAction?: string;
  
  reminders: AppointmentReminder[];
}

export interface AppointmentReminder {
  type: 'email' | 'sms' | 'push';
  time: Date;
  sent: boolean;
}

// Market Data Collection
export interface MarketData extends BaseDocument {
  location: string;
  date: Date;
  
  metrics: {
    medianPrice: number;
    averagePrice: number;
    pricePerSqFt: number;
    daysOnMarket: number;
    inventoryCount: number;
    monthsOfInventory: number;
    priceChange: number;
    salesVolume: number;
  };
  
  byPropertyType: {
    singleFamily: any;
    condo: any;
    townhouse: any;
  };
  
  byPriceRange: {
    under300k: number;
    '300k-500k': number;
    '500k-750k': number;
    '750k-1m': number;
    over1m: number;
  };
  
  trends: {
    priceDirection: 'up' | 'down' | 'stable';
    marketPhase: 'buyers_market' | 'sellers_market' | 'balanced';
    forecast: 'bullish' | 'bearish' | 'neutral';
  };
}
