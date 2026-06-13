/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProposalType = 'branding' | 'website';

export interface BrandingScope {
  logoDesign: boolean;
  brandGuidelines: boolean;
  businessCards: boolean;
  letterheads: boolean;
  emailSignature: boolean;
  envelopes: boolean;
  officeStamp: boolean;
  employeeIdCards: boolean;
  receiptsVouchers: boolean;
  additionalDeliverables: string; // Comma separated or text
}

export type WebsiteType = 'static' | 'dynamic' | 'ecommerce';

export interface ScopeOfWorkItem {
  id: string;
  title: string;
  description: string;
  isSelected: boolean;
  isCustom?: boolean;
}

export interface ScopeOfWorkNotes {
  notes?: string;
  exclusions?: string;
  requirements?: string;
  clarifications?: string;
}

export interface WebsiteScope {
  totalPages: number;
  languages: string;
  cmsType: string;
  contactForms: boolean;
  blogModule: boolean;
  gallery: boolean;
  careersSection: boolean;
  downloadsSection: boolean;
  seoPlugin: boolean;
  securityPlugin: boolean;
  cachePlugin: boolean;
  maintenancePeriod: number; // in months
  websiteType?: WebsiteType;
  scopeItems?: ScopeOfWorkItem[];
  scopeNotes?: ScopeOfWorkNotes;
}

export interface Milestone {
  id: string;
  week: string;
  title: string;
  description: string;
}

export interface ResourceCost {
  id: string;
  role: string;
  hours: number;
  rate: number;
}

export interface Proposal {
  id: string;
  type: ProposalType;
  createdAt: string;
  updatedAt: string;
  
  // Client Info
  clientName: string;
  companyName: string; // Also is Project Name for Website
  proposalDate: string;
  
  // Executive Summary
  briefDescription: string; // Specific project description or business overview
  
  // Custom scope for the specific type
  brandingScope: BrandingScope;
  websiteScope: WebsiteScope;
  
  // Timeline
  weeks: number;
  milestones: Milestone[];
  
  // Financials
  // Branding fields
  resourceCosts: ResourceCost[];
  // Website fields
  developmentCost: number;
  pluginCost: number;
  maintenanceCost: number;
  additionalCost: number;
  
  // Terms
  totalCost: number;
  paymentTerms: string;
  history?: ProposalHistoryEntry[];

  // Preparer Info
  preparedByName?: string;
  preparedByCompany?: string;
  preparedByTitle?: string;

  // Admin & Multi-user fields
  status?: ProposalStatus;
  assignedUserId?: string;
  assignedUserName?: string;
  preparedByUserId?: string;
  sharedUserIds?: string[];

  // Custom Letterhead configurations
  customLetterhead?: string; // Base64 Data URL of uploaded custom letterhead image
  letterheadHeight?: number; // Height of the letterhead in pixels
  letterheadMode?: 'minimal' | 'custom' | 'none'; // Header style mode
  letterheadFullPage?: boolean; // Whether the custom letterhead is a full A4 page template
  showWatermark?: boolean; // Whether to display a clean background watermark
  customWatermarkText?: string; // Optional custom watermark text
}

export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  SALES = 'Sales Executive',
  DESIGNER = 'Designer',
}

export enum ProposalStatus {
  DRAFT = 'Draft',
  UNDER_REVIEW = 'Under Review',
  UNDER_PROCESS = 'Under Process',
  AWAITING_CLIENT_FEEDBACK = 'Awaiting Client Feedback',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  SENT = 'Sent',
  FOLLOW_UP_REQUIRED = 'Follow-Up Required',
  WON = 'Won',
  LOST = 'Lost',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export interface Reminder {
  id: string;
  proposalId: string;
  proposalClient: string;
  title: string;
  dueDate: string;
  notes: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}

export interface ProposalHistoryEntry {
  versionId: string;
  timestamp: string;
  summary: string;
  proposalState: Proposal;
}

