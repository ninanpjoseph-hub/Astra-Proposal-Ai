/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProposalType = 'branding' | 'website' | 'services';

export type ModularServiceId = 'website_audit' | 'hosting_domain' | 'ssl_renewal' | 'amc' | 'custom_service';

export interface WebsiteAuditScope {
  technicalAudit: boolean;
  seoAudit: boolean;
  performanceSpeed: boolean;
  securityAssessment: boolean;
  mobileResponsiveness: boolean;
  uxUiReview: boolean;
  accessibilityReview: boolean;
  brokenLinksError: boolean;
  cmsPluginCheck: boolean;
  detailedAuditReport: boolean;
  customScopeOfWork?: string;
  deliverables: string;
  estimatedTimeline: string;
  clientBenefits: string;
  termsConditions: string;
  cost: number;
  timeline?: string;
  deliverablesSummary?: string;
}

export interface DomainItem {
  id: string;
  domainName: string;
  renewalDate: string;
  renewalCost: number;
  status: 'Active' | 'Expired' | 'Pending';
  notes?: string;
}

export interface HostingDomainScope {
  hostingRenewalYears: number;
  domainRenewalYears: number;
  includeDomain: boolean;
  includeDomainRenewal?: boolean;
  serverSpecs?: string;
  hostingSpecifications: string;
  domainName: string;
  domains?: DomainItem[];
  renewalTerms: string;
  exclusions: string;
  supportInfo: string;
  cost: number;
}

export interface SslRenewalScope {
  sslYears: number;
  sslType?: string;
  certificateType: string;
  installationConfig: boolean;
  validationTesting: boolean;
  securityBenefits: string;
  termsConditions: string;
  cost: number;
}

export interface AmcScope {
  cmsUpdates: boolean;
  pluginUpdates: boolean;
  themeUpdates: boolean;
  securityMonitoring: boolean;
  websiteHealthChecks: boolean;
  bugFixes: boolean;
  minorContentUpdates: boolean;
  websiteBackups: boolean;
  performanceOptimization: boolean;
  uptimeMonitoring: boolean;
  technicalSupportHours: string;
  monthlyReports: boolean;
  slaResponseTime: string;
  termsConditions: string;
  cost: number;
  contractPeriod?: string;
  supportHoursMonthly?: string;
  responseTimeSLA?: string;
}

export interface CustomServiceScope {
  title: string;
  description: string;
  scopeOfWork: string;
  deliverables: string;
  timeline: string;
  termsConditions: string;
  cost: number;
}

export interface ModularServicesScope {
  selectedServices: ModularServiceId[];
  websiteAudit: WebsiteAuditScope;
  hostingDomain: HostingDomainScope;
  sslRenewal: SslRenewalScope;
  amc: AmcScope;
  customService?: CustomServiceScope;
}

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

export interface CustomSitemapNode {
  id: string;
  title: string;
  description: string;
  children?: string[];
  isCustom?: boolean;
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
  ecommerceOdooSyncModules?: string[];
  ecommercePaymentGateways?: string[];
  ecommerceTechStack?: {
    website?: string;
    mobile?: string;
    backend?: string;
    database?: string;
    hosting?: string;
  };
  customSitemapNodes?: CustomSitemapNode[];
  sitemapLayout?: 'portrait' | 'landscape';
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

export interface PaymentEntry {
  id: string;
  timestamp: string;
  amount: number;
  type: 'Advance' | 'Second' | 'Final' | 'Custom';
  method?: string;
  reference?: string;
  notes?: string;
  recordedBy?: string;
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
  servicesScope?: ModularServicesScope;
  
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
  paymentEntries?: PaymentEntry[];

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
  supplierItems?: SupplierLinkedItem[]; // Supplier-linked items for internal calculation/auditing
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  companyName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  proposalId?: string;
  amount: number;
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdAt?: string;
}

export interface SupplierLinkedItem {
  id: string;
  description: string;
  supplierId: string;
  supplierName: string;
  purchaseCost: number; // buy price (per unit)
  unitPrice: number;    // sell price (per unit)
  qty: number;
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
  CLOSED = 'Closed',
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

