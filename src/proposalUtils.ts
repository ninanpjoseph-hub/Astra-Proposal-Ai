/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Proposal, ProposalType, Milestone, ResourceCost, ProposalStatus, Reminder, ModularServicesScope, ModularServiceId, WhatsappScope, BrandingScope, BrandingDeliverableItem, BrandingProcessStage, BrandingExecutionPhase, BrandingFinancialItem } from './types';
import { DEFAULT_SCOPE_TEMPLATES } from './staticTemplates';

export function createDefaultBrandingDeliverables(): BrandingDeliverableItem[] {
  return [
    // 1. Brand Strategy & Positioning
    {
      id: 'bd_strat_1',
      category: 'Brand Strategy',
      title: 'Brand Strategy Development',
      description: 'Comprehensive brand positioning, core values definition, and strategic roadmap.',
      isSelected: true
    },
    {
      id: 'bd_strat_2',
      category: 'Brand Strategy',
      title: 'Brand Positioning & Model',
      description: 'Defining unique market positioning, Vision, Mission, Values, Essence, Promise, and Benefit framework.',
      isSelected: true
    },
    // 2. Visual Identity
    {
      id: 'bd_vis_1',
      category: 'Visual Identity',
      title: 'Logo Design & Concept Development',
      description: 'Vertical & Horizontal lockups, primary, secondary & mono variations with clear space rules.',
      isSelected: true
    },
    {
      id: 'bd_vis_2',
      category: 'Visual Identity',
      title: 'Typography & Colour System',
      description: 'Primary typeface definition, web font recommendations, Pantone references, CMYK, RGB, and HEX specifications.',
      isSelected: true
    },
    {
      id: 'bd_vis_3',
      category: 'Visual Identity',
      title: 'Brand Identity Guidelines Booklet',
      description: 'Master 20-page brand guidelines booklet in PDF format for both business entities.',
      isSelected: true
    },
    // 3. Corporate Stationery
    {
      id: 'bd_stat_1',
      category: 'Corporate Stationery',
      title: 'Stationery Design - Letterhead',
      description: 'Letterhead and continuation sheet (Ready to Print version & MS Word format).',
      isSelected: true
    },
    {
      id: 'bd_stat_2',
      category: 'Corporate Stationery',
      title: 'Envelopes (A4 & DL)',
      description: 'A4 and DL size corporate envelopes (Ready to Print version).',
      isSelected: true
    },
    {
      id: 'bd_stat_3',
      category: 'Corporate Stationery',
      title: 'Business Card Template',
      description: 'Executive double-sided business card templates.',
      isSelected: true
    },
    {
      id: 'bd_stat_4',
      category: 'Corporate Stationery',
      title: 'Email Signature',
      description: 'HTML & graphic email signature for company personnel.',
      isSelected: true
    },
    {
      id: 'bd_stat_5',
      category: 'Corporate Stationery',
      title: 'Receipts & Vouchers',
      description: 'Official payment receipt vouchers and invoice headers.',
      isSelected: true
    },
    {
      id: 'bd_stat_6',
      category: 'Corporate Stationery',
      title: 'Employee ID Card & Access Badge',
      description: 'Employee ID cards, visitor passes, and lanyard badge templates.',
      isSelected: true
    },
    {
      id: 'bd_stat_7',
      category: 'Corporate Stationery',
      title: 'Official Office Stamp',
      description: 'Vector artwork design for official corporate rubber seal & stamp.',
      isSelected: true
    },
    // 4. Packaging & Merchandise
    {
      id: 'bd_pack_1',
      category: 'Packaging & Merchandise',
      title: 'Packaging & Label Design',
      description: 'Custom retail package layout, product labels, and print-ready die-lines.',
      isSelected: false
    },
    {
      id: 'bd_pack_2',
      category: 'Packaging & Merchandise',
      title: 'Product Branding',
      description: 'Product merchandise application, tissue paper, and shopping bags.',
      isSelected: false
    },
    // 5. Signage & Environmental
    {
      id: 'bd_sign_1',
      category: 'Signage & Environmental',
      title: 'Signage Design & Wayfinding',
      description: 'Exterior building signage, reception backdrop, and indoor wayfinding graphics.',
      isSelected: false
    },
    {
      id: 'bd_sign_2',
      category: 'Signage & Environmental',
      title: 'Environmental Office Branding',
      description: 'Wall graphics, glass film frosting motifs, and interior branding elements.',
      isSelected: false
    },
    // 6. Digital & Social Media
    {
      id: 'bd_dig_1',
      category: 'Digital & Social Media',
      title: 'Social Media Kit',
      description: 'Profile pictures, cover banners, and template layouts for Instagram, LinkedIn, and X.',
      isSelected: false
    },
    {
      id: 'bd_dig_2',
      category: 'Digital & Social Media',
      title: 'Website UI/UX Direction',
      description: 'Brand application guidelines for digital web interfaces and mobile apps.',
      isSelected: false
    },
    // 7. Marketing Collateral
    {
      id: 'bd_mkt_1',
      category: 'Marketing Collateral',
      title: 'Brochure & Presentation Design',
      description: 'Corporate brochure layout and 10+ slide master PowerPoint / Keynote presentation deck.',
      isSelected: false
    },
    {
      id: 'bd_mkt_2',
      category: 'Marketing Collateral',
      title: 'Vehicle Branding',
      description: 'Fleet vehicle graphics, wrap layout, and company delivery van door artwork.',
      isSelected: false
    },
    {
      id: 'bd_mkt_3',
      category: 'Marketing Collateral',
      title: 'Uniform Design',
      description: 'Staff polo shirts, caps, high-vis vests, and executive wear embroidery artwork.',
      isSelected: false
    }
  ];
}

export function createDefaultBrandingScope(clientName?: string): BrandingScope {
  const name = clientName && clientName.trim() ? clientName.trim() : "your organization";

  return {
    includeCoverPage: true,
    includeTableOfContents: true,
    includeExecutiveSummary: true,
    includeObjectives: true,
    includeKickoffApproach: true,
    includeProcess: true,
    includeScopeDeliverables: true,
    includePhasesOfExecution: true,
    includeTimeline: true,
    includeFinancials: true,
    includeTermsExclusions: true,
    includeAcceptance: true,

    customExecutiveSummaryLead: `Thank you very much for this opportunity to present our proposal for your consideration. We are honoured to have the chance in providing you an insight of what we can offer you.\n\nWithin our proposal we have explained our proposed creative services that will support your efforts in launching your brand ideas.\n\nAstra is an agency that has been serving clients since 2010 and has recently restructured our team, strengthened our core strategy and creative offer, and set up in-house media, technology, and digital functions.\n\nWe now offer our clients an unparalleled combination of local and international insight, outstanding talent in strategic thinking and creative output for: Branding, Digital, Technology, and Events.`,

    customExecutiveSummaryProject: `This quotation has been prepared for ${name} to support its brand development and identity enhancement initiative for its business ventures.\n\nExecutive Summary:\nThey aim to create a fresh new brand identity for their venture. Aligned with the organization's future plans and projections, we will craft a clear and cohesive brand rooted in the company's vision.\n\nOur creative development will ensure your brand is always portrayed consistently and accurately, so investors and shareholders have the opportunity to develop trust in the brand and its promise.`,

    objectivesOverview: `The new brand identity has to promote and echo the core principles of their brand with a fresh and modern approach, positioning the brand on local and regional market platforms.`,

    objectivesList: [
      "In brand building, we focus on increasing the prestige and status of the new brand.",
      "To ensure the brand message is reproduced correctly, consistently, and in line with company objectives across different departments, communication channels, and suppliers.",
      "Save marketers time and increase overall team productivity.",
      "Provide a one-stop source of information about the brand to new employees, marketing agencies, and other service providers.",
      "Craft a brand identity that can be used globally with high scalability.",
      "Heavily represent and showcase your brand's ethical and social values to potential investors and partners.",
      "Provide company employees with clarity, focus, and strategic direction."
    ],

    kickoffAgenda: [
      "Agree on project deliverables and key dependencies",
      "Clarify client final decision makers and approval workflows",
      "Discuss potentially sensitive areas of engagement",
      "Agree on presentation dates and milestone review meetings",
      "Agree billing schedule and finalize payment terms"
    ],
    kickoffDeliverables: [
      "A project plan that finalizes appointed Astra project manager, adjusted proposal (if necessary), detailed project timeline with all key dependencies, delivery, and meeting dates.",
      "Formalized billing schedule with key financial contacts."
    ],
    kickoffTiming: "Timing: 1 Day",

    approachIntro: "The brand identity development will address both the organization's current needs and its future growth, adapting to evolving market conditions. Together, we will keep the changing media landscape and your long-term expansion plans at the forefront, ensuring a strategic approach that delivers a brand with lasting relevance and impact.",
    approachStrategy: "It's time to create a plan to attract potential clienteles and create a trustful brand so that people think of them when they are willing to engage their product or service.",
    approachToneVoice: "How is the brand going to communicate with its target audience? Formality, emotional approach, humor, storytelling, etc. Our goal is to find a unique tone that will humanize the brand and connect emotionally.",
    approachMoodboard: "We set up a mood board to collect visual inspiration that will help us define a visual concept for the brand. This includes images, textures, patterns, colors, typographies, and lockups.",

    processStages: [
      {
        id: 'ps_1',
        stageName: 'Research',
        description: 'Before any actual creative work begins, we conduct extensive background research. We will meet with you to understand your goals, audience needs, and project expectations.'
      },
      {
        id: 'ps_2',
        stageName: 'Design',
        description: 'When analysis is complete, design work begins. We keep your communication needs at the core of every design decision from colors to font styles to layouts.'
      },
      {
        id: 'ps_3',
        stageName: 'Implementation',
        description: 'After selecting your preferred creative direction, we begin design execution, producing draft outputs and refined collaterals for your review.'
      },
      {
        id: 'ps_4',
        stageName: 'Evaluation',
        description: 'After design completion, we follow up to assess project outcomes and deliver final artwork in print-ready PDF and open vector formats.'
      }
    ],

    executionPhases: [
      {
        id: 'ep_1',
        phaseNumber: 1,
        phaseTitle: 'PHASE 1: DESIGN CONCEPT',
        actionPoints: [
          'Develop two logo design concepts for each of your business entities.',
          'Develop a visual language comprising typography, colors, and graphics.',
          'Apply the approved identity direction to agreed collaterals.',
          'Client presentation - review and feedback.',
          '2 sets of amends on agreed design concept.',
          'Client presentation and final approval.'
        ]
      },
      {
        id: 'ep_2',
        phaseNumber: 2,
        phaseTitle: 'PHASE 2: DESIGN DEVELOPMENT',
        actionPoints: [
          'Design development of the chosen logo and visual language.',
          'Development of brand language and graphic elements.',
          'Validation of each element.',
          'Finalization of visual identity elements & stationery design.'
        ]
      },
      {
        id: 'ep_3',
        phaseNumber: 3,
        phaseTitle: 'PHASE 3: COLLATERALS DEVELOPMENT',
        actionPoints: [
          'Letterhead and continuation sheet (Ready to print version).',
          'Envelopes (A4 and DL).',
          'Business card template.',
          'Payment Receipts & Vouchers.',
          'Email signature artwork.'
        ]
      },
      {
        id: 'ep_4',
        phaseNumber: 4,
        phaseTitle: 'PHASE 4: FINAL ARTWORK',
        actionPoints: [
          'Create artwork for applications listed in design development stage.',
          'Detail collaterals with information provided by client.',
          'Client presentation - review and feedback.',
          'Provide client with artwork in PDF and open file format.',
          'Prepare final artwork files, get client sign-off.'
        ]
      }
    ],

    deliverableItems: createDefaultBrandingDeliverables(),

    financialItems: [
      {
        id: 'fin_1',
        sl: 1,
        resourceRole: 'Project Management',
        detail: 'Client Liaison & Quality Assurance',
        timeDays: '5 Days',
        amount: 0
      },
      {
        id: 'fin_2',
        sl: 2,
        resourceRole: 'Sr. Visualiser',
        detail: 'Research & Planning, Creative & Art Direction, Approach, Ideation/Concept',
        timeDays: '12 Days',
        amount: 12000
      },
      {
        id: 'fin_3',
        sl: 3,
        resourceRole: 'Sr. Designer',
        detail: 'Design Development & Artwork, Print ready templates',
        timeDays: '15 Days',
        amount: 10000
      }
    ],
    financialNotes: "Signed proposal and LPO required for Astra to commence work.",
    paymentTermsText: "PAYMENT TERMS: Payment due within 21 days from date of invoice.",
    invoicingScheduleText: "INVOICING: 50% upfront on proposal approval and 50% on project completion and delivery.",

    termsList: [
      "INVOICING: 50% upfront on proposal approval and 50% on project completion and delivery.",
      "PAYMENT TERMS: Payment due within 21 days from date of invoice."
    ],
    exclusionsList: [
      "Printing of any physical item.",
      "Production management and manufacturing.",
      "Naming registration and legal trademarking.",
      "HTML development or web programming.",
      "Domain name purchase or web hosting.",
      "Website or App look and feel / software development.",
      "Content development, copywriting, proofreading, or translation.",
      "Purchase of stock images from online image libraries.",
      "Photo-shoot, video production, or model hire.",
      "Any third party services not explicitly mentioned in the proposal.",
      "Deliverables not explicitly listed in the scope of work.",
      "Social media management, ad spend, or media buying.",
      "Font license purchases.",
      "Physical signage fabrication or wayfinding installation.",
      "Product Flyers or printed catalog distribution."
    ],

    deliveryOverviewText: "Once any final changes have been made and the product has been approved, we will commence the delivery phase.",
    deliveryDeliverablesText: [
      "Print ready files in PDF (CMYK)",
      "Invoicing - payment terms are explained in the financials"
    ],
    supportOverviewText: "Astra does not see the delivery of the project as the end of the process and we enjoy long term relationships with many of our clients. The primary aim of the Support phase is to offer consultative and technical support and additional channels of content distribution.",
    technicalSupportList: [
      "Post project review to identify opportunities for further improvement in future",
      "Digital open vector version of your logo & visual identity package"
    ],

    // Legacy fallback booleans
    logoDesign: true,
    brandGuidelines: true,
    businessCards: true,
    letterheads: true,
    emailSignature: true,
    envelopes: true,
    officeStamp: true,
    employeeIdCards: true,
    receiptsVouchers: true,
    additionalDeliverables: ""
  };
}

export interface ModularDeliverableLineItem {
  id: string;
  moduleKey: ModularServiceId;
  moduleTitle: string;
  deliverableName: string;
  scopeDescription: string;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
  totalCost: number;
  domainList?: string[];
  summaryLabel?: string;
}

// Simple unique ID generator
export function generateId(): string {
  return 'prop_' + Math.random().toString(36).substring(2, 11);
}

// Format currency to QAR (Qatari Riyal)
export function formatQAR(amount: number): string {
  return new Intl.NumberFormat('en-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Standard Executive Briefing & Project Mission Templates
export const DEFAULT_EXECUTIVE_BRIEFING_TEMPLATE = 
  "We appreciate the opportunity to present this formal commercial proposal to {{client_name}}. Guided by your operational boundaries and technical milestones, our team at Astra Technologies has structured a comprehensive, high-performance solution tailored specifically to elevate {{client_name}}'s digital capabilities and market positioning. This proposal outlines the full scope of work, transparent deliverables, resource allocation, and operational timelines required to achieve your strategic objectives seamlessly.";

export const DEFAULT_PROJECT_MISSION_TEMPLATE = 
  "To empower {{client_name}} with a robust, scalable, and high-conversion digital ecosystem designed to optimize user engagement, streamline operational workflows, and establish an industry-leading brand presence across key target markets.";

/**
 * Returns Executive Briefing Details populated with client name.
 */
export function getDefaultExecutiveBriefing(clientName?: string): string {
  const name = clientName && clientName.trim() ? clientName.trim() : "{{client_name}}";
  return DEFAULT_EXECUTIVE_BRIEFING_TEMPLATE.replace(/\{\{client_name\}\}/g, name);
}

/**
 * Returns Project Mission & Objectives Brief populated with client name.
 */
export function getDefaultProjectMission(clientName?: string): string {
  const name = clientName && clientName.trim() ? clientName.trim() : "{{client_name}}";
  return DEFAULT_PROJECT_MISSION_TEMPLATE.replace(/\{\{client_name\}\}/g, name);
}

/**
 * Renders Executive Briefing for document view / exports, replacing {{client_name}} dynamically.
 */
export function renderExecutiveSummary(proposal: { executiveSummary?: string; clientName?: string }): string {
  const rawText = proposal.executiveSummary && proposal.executiveSummary.trim()
    ? proposal.executiveSummary
    : getDefaultExecutiveBriefing(proposal.clientName);
  const clientName = proposal.clientName && proposal.clientName.trim() ? proposal.clientName.trim() : "your organization";
  return rawText.replace(/\{\{client_name\}\}/g, clientName);
}

/**
 * Renders Project Mission Brief for document view / exports, replacing {{client_name}} dynamically.
 */
export function renderProjectMission(proposal: { briefDescription?: string; clientName?: string }): string {
  const rawText = proposal.briefDescription && proposal.briefDescription.trim()
    ? proposal.briefDescription
    : getDefaultProjectMission(proposal.clientName);
  const clientName = proposal.clientName && proposal.clientName.trim() ? proposal.clientName.trim() : "your organization";
  return rawText.replace(/\{\{client_name\}\}/g, clientName);
}

// Default items
export const DEFAULT_BRANDING_MILESTONES: Omit<Milestone, 'id'>[] = [
  { week: "Week 1", title: "Discovery & Mood Boards", description: "Market research, stakeholder alignment, and core design styles formulation." },
  { week: "Week 2 - 3", title: "Logo Concepts & Core Layouts", description: "Design of 3 unique core logo concepts and brandmark typesetting." },
  { week: "Week 4", title: "Collateral Development", description: "Applying selected logo, color palette, and assets to requested physical or digital applications." },
  { week: "Week 5", title: "Brand Guidelines Sourcebook & Delivery", description: "Compilation of detailed design parameters, do's/don'ts, and final vector package handover." }
];

export const DEFAULT_WEBSITE_MILESTONES: Omit<Milestone, 'id'>[] = [
  { week: "Week 1 - 2", title: "Wireframes & Visual Direction", description: "Structuring information architecture, customized maps, sitemaps, and core theme approval." },
  { week: "Week 3 - 5", title: "Component Engineering & Alpha Development", description: "Implementing custom React structures, high-performance layouts, and responsive component code." },
  { week: "Week 6 - 7", title: "Plugin Integrations & Content Setup", description: "Integrating CMS modules, dynamic blog/careers boards, analytic triggers, and SEO metadata." },
  { week: "Week 8", title: "Quality Assurance, Optimizations, & Launch", description: "Cross-platform speed checks, DNS cutover, staging migration, and direct search engine indexing hooks." }
];

export const DEFAULT_SERVICES_MILESTONES: Omit<Milestone, 'id'>[] = [
  { week: "Week 1", title: "Service Onboarding & Technical Discovery", description: "Audit initiation, domain/SSL authorization verification, and server access setup." },
  { week: "Week 2", title: "Audit Execution & Infrastructure Configuration", description: "Deep security/SEO scanning, hosting renewal processing, and SSL handshake testing." },
  { week: "Week 3", title: "Deliverables Handover & Maintenance Activation", description: "Presentation of comprehensive audit report, activation of 24/7 SLA monitoring, and AMC support onboarding." }
];

export const DEFAULT_WHATSAPP_MILESTONES: Omit<Milestone, 'id'>[] = [
  { week: "Week 1", title: "Meta Business Manager Verification", description: "Meta Business Manager verification assistance and WhatsApp Cloud API app setup." },
  { week: "Week 1 - 2", title: "API Integration & Phone Number Linking", description: "Configuring official phone number, webhook listeners, and backend API integration." },
  { week: "Week 2 - 3", title: "Chatbots & Broadcast Campaign Setup", description: "Building up to 5 interactive chatbots and configuring message templates for Meta approval." },
  { week: "Week 3", title: "Mobile App & eCommerce Configuration", description: "Configuring Android/iOS chat apps, payment link collection, and product/order catalog sync." },
  { week: "Week 3 - 4", title: "Testing, Go-Live & Staff Training", description: "End-to-end messaging verification, user access setup, and operational deployment." }
];

export function createDefaultWhatsappScope(): WhatsappScope {
  return {
    planType: 'startup',
    portalYearlyCharge: 2200,
    apiConfigCharge: 500,
    utilityMessageRate: 0.05,
    marketingMessageRate: 0.13,
    platformName: "Taswiq Intelligent Chat Solution",
    version: "1.0",
    maxChatbots: 5,
    maxStepsPerChatbot: 50,
    objectives: [
      "Connect client system with official WhatsApp Business Cloud API.",
      "Enable automated OTP and notification delivery to customers.",
      "Maintain direct integration with Meta, eliminating third-party dependencies.",
      "Ensure full data security, message reliability, and Meta compliance.",
      "Build a scalable and future-proof communication channel."
    ],
    scopeOfWorkItems: [
      { id: "sow_1", title: "Meta Verification", description: "Assistance in getting verified via Meta Business Manager (Facebook).", isSelected: true },
      { id: "sow_2", title: "Cloud API Setup", description: "Setup of phone number and Meta app for WhatsApp Cloud API.", isSelected: true },
      { id: "sow_3", title: "Software Support", description: "Technical support for software bugs and API connectivity.", isSelected: true },
      { id: "sow_4", title: "Chatbot Development", description: "Assistance in building up to 5 chatbots (max 50 steps per chatbot).", isSelected: true }
    ],
    featuresIncluded: [
      { id: "feat_1", title: "Bulk Contact Groups", description: "Contact groups with bulk import/export via Excel.", isSelected: true },
      { id: "feat_2", title: "Broadcast Campaigns", description: "WhatsApp broadcast campaigns with group filters.", isSelected: true },
      { id: "feat_3", title: "Campaign Reports & Templates", description: "Campaign reports and Meta-approved message templates.", isSelected: true },
      { id: "feat_4", title: "Mobile Chat Apps", description: "Android & iOS mobile apps for managing multi-agent chats.", isSelected: true },
      { id: "feat_5", title: "In-Chat Payments", description: "Payment link generation and in-chat payment collection.", isSelected: true },
      { id: "feat_6", title: "WhatsApp eCommerce Store", description: "WhatsApp eCommerce functionality and product sharing.", isSelected: true },
      { id: "feat_7", title: "eCommerce Backend", description: "eCommerce backend to manage products, categories, and orders.", isSelected: true }
    ],
    includeTierComparisonMatrix: true,
    termsConditionsList: [
      "Fees Payable for Service: Taswiq reserves the right not to begin implementation until full payment is received. Payment is non-refundable once implementation starts.",
      "Supply of Materials: The Client must provide all necessary materials, APIs, credentials, and documentation.",
      "Payment Schedule: 100% Advance yearly payment required upon contract signing.",
      "Remedies for Overdue Payment: Overdue accounts by 30+ days may have service licenses suspended or revoked.",
      "Third-Party Subscriptions: Any third-party tools or usage-based APIs must be purchased directly by the Client.",
      "Message Payment: Utility (.05 QR) and Marketing (.13 QR) message charges are paid directly to META based on actual usage.",
      "Custom Features: Custom feature updates beyond standard release updates are quoted separately.",
      "Meta/WhatsApp Policy Compliance: The Client agrees to comply with all existing and future Meta policies applicable to Cloud API users."
    ]
  };
}

export const DEFAULT_RESOURCE_COSTS: Omit<ResourceCost, 'id'>[] = [
  { role: "Brand Lead / Creative Director", hours: 25, rate: 250 },
  { role: "Senior Identity Designer", hours: 40, rate: 180 },
  { role: "Copywriter & Brand Consultant", hours: 15, rate: 120 }
];

export function createDefaultModularServicesScope(): ModularServicesScope {
  return {
    selectedServices: ['website_audit', 'hosting_domain', 'ssl_renewal', 'amc'],
    websiteAudit: {
      technicalAudit: true,
      seoAudit: true,
      performanceSpeed: true,
      securityAssessment: true,
      mobileResponsiveness: true,
      uxUiReview: true,
      accessibilityReview: true,
      brokenLinksError: true,
      cmsPluginCheck: true,
      detailedAuditReport: true,
      deliverables: "Comprehensive PDF Audit Report, Executive Summary, Prioritized Action Items, SEO & Speed Optimization Roadmap, Security Vulnerability Matrix",
      deliverablesSummary: "Technical, SEO, Speed & Security Vulnerability Audit Report",
      estimatedTimeline: "1 - 2 Weeks",
      clientBenefits: "Identify critical bottlenecks, enhance Google ranking potential, reduce security risks, and improve conversion rate and user experience.",
      termsConditions: "Audit findings are based on current site architecture. Implementation of recommended fixes is subject to separate deployment agreement or AMC.",
      quantity: 1,
      unitPrice: 0,
      cost: 0
    },
    hostingDomain: {
      entries: [
        {
          id: "hd-1",
          domainName: "clientdomain.com",
          hostingProvider: "AWS / Cloud Infrastructure",
          hostingPlan: "High-Performance Cloud Server (NVMe SSD)",
          renewalDate: "2026-11-15",
          renewalDuration: "1 Year",
          renewalCost: 1400,
          notes: "Primary Production Domain & Cloud Server Infrastructure"
        },
        {
          id: "hd-2",
          domainName: "clientdomain.qa",
          hostingProvider: "Ooredoo Cloud Registry",
          hostingPlan: "DNS Routing & Regional Registry",
          renewalDate: "2026-12-01",
          renewalDuration: "1 Year",
          renewalCost: 400,
          notes: "Local Qatar Registry Domain (.qa)"
        }
      ],
      hostingRenewalYears: 1,
      hostingQty: 1,
      hostingUnitPrice: 1400,
      hostingCost: 1400,
      domainRenewalYears: 1,
      includeDomain: true,
      includeDomainRenewal: true,
      serverSpecs: "High-Performance Cloud Server / NVMe SSD Storage / 99.9% Uptime SLA / Automated Daily Backups / Free SSL Certificate / Unlimited Bandwidth",
      hostingSpecifications: "High-Performance Cloud Server / NVMe SSD Storage / 99.9% Uptime SLA / Automated Daily Backups / Free SSL Certificate / Unlimited Bandwidth",
      domainName: "clientdomain.com",
      domainQty: 2,
      domainUnitPrice: 200,
      domainCost: 400,
      renewalTerms: "1-Year License Renewal for Hosting Server Infrastructure and Domain Name Registration. Renewal invoices are issued 30 days prior to expiration.",
      exclusions: "Third-party paid API subscriptions, premium external software licenses, and major server migrations.",
      supportInfo: "24/7 Server Infrastructure Monitoring with automated failover and ticket-based technical support.",
      cost: 1800
    },
    sslRenewal: {
      entries: [
        {
          id: "ssl-1",
          domainName: "clientdomain.com",
          certificateType: "2048-bit RSA High-Assurance SSL Certificate (HTTPS)",
          renewalDuration: "1 Year",
          cost: 600,
          notes: "Primary Domain SSL Certificate"
        },
        {
          id: "ssl-2",
          domainName: "clientdomain.qa",
          certificateType: "2048-bit RSA High-Assurance SSL Certificate (HTTPS)",
          renewalDuration: "1 Year",
          cost: 600,
          notes: "Regional Registry (.qa) SSL Certificate"
        }
      ],
      sslYears: 1,
      quantity: 2,
      unitPrice: 600,
      certificateType: "2048-bit RSA High-Assurance SSL Certificate (HTTPS)",
      sslType: "2048-bit RSA High-Assurance SSL Certificate",
      installationConfig: true,
      validationTesting: true,
      securityBenefits: "Encrypts user data transmission, builds customer trust badge, prevents browser 'Not Secure' warnings, and satisfies search engine HTTPS ranking requirements.",
      termsConditions: "Includes domain validation, server CSR generation, CRT installation, HTTP to HTTPS 301 redirection, and cross-browser handshake verification.",
      cost: 1200
    },
    amc: {
      entries: [
        {
          id: "amc-1",
          domainName: "clientdomain.com",
          planName: "Standard AMC – Technical Maintenance & SLA",
          contractPeriod: "12 Months",
          cost: 3000,
          notes: "Primary Production Website Technical AMC"
        },
        {
          id: "amc-2",
          domainName: "clientdomain.qa",
          planName: "Secondary Site Maintenance",
          contractPeriod: "12 Months",
          cost: 1500,
          notes: "Regional Web Asset Maintenance"
        }
      ],
      cmsUpdates: true,
      pluginUpdates: true,
      themeUpdates: true,
      securityMonitoring: true,
      websiteHealthChecks: true,
      bugFixes: true,
      minorContentUpdates: true,
      websiteBackups: true,
      performanceOptimization: true,
      uptimeMonitoring: true,
      technicalSupportHours: "Up to 5 Hours / Month Dedicated Tech Support",
      monthlyReports: true,
      slaResponseTime: "24 Hours Response Time for Standard Tickets / 4 Hours for Critical Outages",
      contractPeriod: "12 Months Annual Contract",
      supportHoursMonthly: "Up to 5 Hours / Month",
      termsConditions: "AMC covers routine updates, minor content adjustments, and bug fixes. Major functional redesigns or custom feature additions are quoted separately.",
      quantity: 2,
      unitPrice: 2250,
      cost: 4500
    },
    customService: {
      title: "Custom Tailored Technical Service",
      description: "Bespoke technical solutions, specialized integrations, custom feature development, or expert consultation tailored specifically to client requirements.",
      scopeOfWork: "1. Tailored architectural discovery and specification design\n2. Implementation of custom endpoints and module integrations\n3. Quality assurance testing, performance tuning, and technical handover",
      deliverables: "Custom Technical Module Deliverables, Documentation & Handover Walkthrough",
      timeline: "2 to 3 Weeks",
      termsConditions: "Custom scope subject to client specification sign-off. Work outside defined scope will be evaluated under separate change request.",
      quantity: 1,
      unitPrice: 3500,
      cost: 3500
    }
  };
}

export function getModularDeliverableLineItems(servicesScope?: ModularServicesScope): ModularDeliverableLineItem[] {
  if (!servicesScope || !servicesScope.selectedServices) return [];
  const items: ModularDeliverableLineItem[] = [];
  const { selectedServices, websiteAudit, hostingDomain, sslRenewal, amc, customService } = servicesScope;

  // 1. Website Audit
  if (selectedServices.includes('website_audit') && websiteAudit) {
    const qty = websiteAudit.quantity || 1;
    const total = Number(websiteAudit.cost) || 0;
    const uPrice = websiteAudit.unitPrice || (qty > 0 ? total / qty : total);
    items.push({
      id: 'item_website_audit',
      moduleKey: 'website_audit',
      moduleTitle: 'Website Audit & Technical Review',
      deliverableName: qty > 1 ? `Website Audit & Technical Review (${qty} Audits)` : 'Website Audit & Technical Review',
      scopeDescription: websiteAudit.deliverablesSummary || websiteAudit.deliverables || 'Technical, SEO, Speed & Security Vulnerability Audit Report',
      quantity: qty,
      unitLabel: qty === 1 ? 'Audit' : 'Audits',
      unitPrice: uPrice,
      totalCost: total,
    });
  }

  // 2. Hosting & Domain Renewal
  if (selectedServices.includes('hosting_domain') && hostingDomain) {
    let domainList: string[] = [];
    let totalCost = 0;

    if (hostingDomain.entries && hostingDomain.entries.length > 0) {
      domainList = hostingDomain.entries.map(e => e.domainName).filter(Boolean);
      totalCost = hostingDomain.entries.reduce((sum, e) => sum + (Number(e.renewalCost) || 0), 0);
    } else if (hostingDomain.domains && hostingDomain.domains.length > 0) {
      domainList = hostingDomain.domains.map(d => d.domainName).filter(Boolean);
      totalCost = Number(hostingDomain.cost) || hostingDomain.domains.reduce((sum, d) => sum + (Number(d.renewalCost) || 0), 0);
    } else if (hostingDomain.domainName) {
      domainList = [hostingDomain.domainName];
      totalCost = Number(hostingDomain.cost) || 0;
    } else {
      totalCost = Number(hostingDomain.cost) || 0;
    }

    const qty = domainList.length > 0 ? domainList.length : (hostingDomain.hostingRenewalYears || 1);
    const uPrice = qty > 0 ? totalCost / qty : totalCost;

    const summaryLabel = `Total Renewal Items: ${qty}`;
    const scopeLines = [summaryLabel];
    if (domainList.length > 0) {
      domainList.forEach(d => scopeLines.push(`• ${d}`));
    } else {
      scopeLines.push('Cloud Hosting Server Infrastructure & Domain Registry Renewal');
    }

    items.push({
      id: 'item_hosting_domain_summary',
      moduleKey: 'hosting_domain',
      moduleTitle: 'Hosting & Domain Renewal',
      deliverableName: 'Hosting & Domain Renewal',
      scopeDescription: scopeLines.join('\n'),
      quantity: qty,
      unitLabel: qty === 1 ? 'Item' : 'Items',
      unitPrice: uPrice,
      totalCost: totalCost,
      domainList: domainList,
      summaryLabel: summaryLabel,
    });
  }

  // 3. SSL Renewal & Security Certificate
  if (selectedServices.includes('ssl_renewal') && sslRenewal) {
    let domainList: string[] = [];
    let totalCost = 0;

    if (sslRenewal.entries && sslRenewal.entries.length > 0) {
      domainList = sslRenewal.entries.map(e => e.domainName).filter(Boolean);
      totalCost = sslRenewal.entries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
    } else if (sslRenewal.domainName) {
      domainList = [sslRenewal.domainName];
      totalCost = Number(sslRenewal.cost) || 0;
    } else {
      totalCost = Number(sslRenewal.cost) || 0;
    }

    const qty = domainList.length > 0 ? domainList.length : (sslRenewal.quantity || sslRenewal.sslYears || 1);
    const uPrice = qty > 0 ? totalCost / qty : totalCost;

    const summaryLabel = `Total SSL Certificates: ${qty}`;
    const scopeLines = [summaryLabel];
    if (domainList.length > 0) {
      domainList.forEach(d => scopeLines.push(`• ${d}`));
    } else {
      scopeLines.push('2048-bit RSA Security Certificate & HTTPS Setup');
    }

    items.push({
      id: 'item_ssl_renewal_summary',
      moduleKey: 'ssl_renewal',
      moduleTitle: 'SSL Certificate & Renewal',
      deliverableName: 'SSL Renewal & Security Certificate',
      scopeDescription: scopeLines.join('\n'),
      quantity: qty,
      unitLabel: qty === 1 ? 'Certificate' : 'SSL Certificates',
      unitPrice: uPrice,
      totalCost: totalCost,
      domainList: domainList,
      summaryLabel: summaryLabel,
    });
  }

  // 4. Annual Maintenance Contract (AMC)
  if (selectedServices.includes('amc') && amc) {
    let domainList: string[] = [];
    let totalCost = 0;

    if (amc.entries && amc.entries.length > 0) {
      domainList = amc.entries.map(e => e.domainName).filter(Boolean);
      totalCost = amc.entries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
    } else if (amc.domainName) {
      domainList = [amc.domainName];
      totalCost = Number(amc.cost) || 0;
    } else {
      totalCost = Number(amc.cost) || 0;
    }

    const qty = domainList.length > 0 ? domainList.length : (amc.quantity || 1);
    const uPrice = qty > 0 ? totalCost / qty : totalCost;

    const summaryLabel = `Total AMC Items: ${qty}`;
    const scopeLines = [summaryLabel];
    if (domainList.length > 0) {
      domainList.forEach(d => scopeLines.push(`• ${d}`));
    } else {
      scopeLines.push('CMS Updates, Health Checks, Backups & SLA Technical Support');
    }

    items.push({
      id: 'item_amc_summary',
      moduleKey: 'amc',
      moduleTitle: 'Annual Maintenance Contract (AMC)',
      deliverableName: 'Annual Maintenance Contract (AMC)',
      scopeDescription: scopeLines.join('\n'),
      quantity: qty,
      unitLabel: qty === 1 ? 'AMC Item' : 'AMC Items',
      unitPrice: uPrice,
      totalCost: totalCost,
      domainList: domainList,
      summaryLabel: summaryLabel,
    });
  }

  // 5. Custom Service
  if (selectedServices.includes('custom_service') && customService) {
    const qty = customService.quantity || 1;
    const total = Number(customService.cost) || 0;
    const uPrice = customService.unitPrice || (qty > 0 ? total / qty : total);
    items.push({
      id: 'item_custom_service',
      moduleKey: 'custom_service',
      moduleTitle: customService.title || 'Custom Tailored Technical Service',
      deliverableName: customService.title || 'Custom Tailored Technical Service',
      scopeDescription: customService.deliverables || customService.description || 'Custom deliverables and scope of work',
      quantity: qty,
      unitLabel: qty === 1 ? 'Unit' : 'Units',
      unitPrice: uPrice,
      totalCost: total,
    });
  }

  return items;
}

export function calculateModularServicesTotal(servicesScope?: ModularServicesScope): number {
  if (!servicesScope || !servicesScope.selectedServices) return 0;
  const items = getModularDeliverableLineItems(servicesScope);
  return items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
}

export function createDefaultProposal(type: ProposalType, initialClientName?: string): Proposal {
  const fileDate = new Date();
  const dateFormatted = fileDate.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const id = generateId();
  const defaultServicesScope = createDefaultModularServicesScope();
  const servicesTotal = calculateModularServicesTotal(defaultServicesScope);
  const cName = initialClientName || "";

  return {
    id,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: ProposalStatus.DRAFT,
    
    // Client Info
    clientName: cName,
    companyName: "",
    proposalDate: dateFormatted,
    
    // Client Point of Contact (POC) Info
    clientPocName: "",
    clientPocDesignation: "",
    clientPocPhone: "",
    clientPocEmail: "",
    
    // Executive Summary & Objectives Brief
    executiveSummary: getDefaultExecutiveBriefing(cName),
    briefDescription: getDefaultProjectMission(cName),
    isExecutiveSummaryEdited: false,
    isBriefDescriptionEdited: false,
    
    // Branding default scope
    brandingScope: createDefaultBrandingScope(cName),
    
    // Website default scope
    websiteScope: {
      totalPages: 5,
      languages: "English",
      cmsType: "WordPress",
      contactForms: true,
      blogModule: false,
      gallery: true,
      careersSection: false,
      downloadsSection: false,
      seoPlugin: true,
      securityPlugin: true,
      cachePlugin: true,
      maintenancePeriod: 3,
      websiteType: 'static',
      scopeItems: DEFAULT_SCOPE_TEMPLATES.static.map((item, idx) => ({
        id: `scope_static_${idx}`,
        title: item.title,
        description: item.description,
        isSelected: item.isSelected,
        isCustom: false
      })),
      scopeNotes: {
        notes: "",
        exclusions: "",
        requirements: "",
        clarifications: ""
      },
      includeWordpressPlugins: true,
      includeNotesAssumptions: true,
      includeSectionLevelDetails: true,
      ecommerceOdooSyncModules: ["Product Catalog", "Real-Time Inventory Status", "Sales Orders Processing", "Customer Profiles"],
      ecommercePaymentGateways: ["Credit/Debit Cards", "Cash on Delivery (COD)"],
      ecommerceTechStack: {
        website: "HTML5 & PHP CMS",
        mobile: "Responsive Web Design",
        backend: "WordPress CMS (PHP)",
        database: "MySQL",
        hosting: "Web Server Infrastructure"
      }
    },

    // Modular Services scope
    servicesScope: defaultServicesScope,

    // WhatsApp scope
    whatsappScope: createDefaultWhatsappScope(),
    
    // Timeline
    weeks: type === 'branding' ? 5 : (type === 'services' ? 3 : (type === 'whatsapp' ? 4 : 8)),
    milestones: type === 'branding' 
      ? DEFAULT_BRANDING_MILESTONES.map((m, i) => ({ ...m, id: `${id}_m_${i}` }))
      : (type === 'services'
          ? DEFAULT_SERVICES_MILESTONES.map((m, i) => ({ ...m, id: `${id}_m_${i}` }))
          : (type === 'whatsapp'
              ? DEFAULT_WHATSAPP_MILESTONES.map((m, i) => ({ ...m, id: `${id}_m_${i}` }))
              : DEFAULT_WEBSITE_MILESTONES.map((m, i) => ({ ...m, id: `${id}_m_${i}` }))
            )
        ),
    
    // Financials
    resourceCosts: type === 'branding'
      ? DEFAULT_RESOURCE_COSTS.map((r, i) => ({ ...r, id: `${id}_r_${i}` }))
      : [],
    developmentCost: type === 'website' ? 12000 : 0,
    pluginCost: type === 'website' ? 1200 : 0,
    maintenanceCost: type === 'website' ? 1500 : 0,
    additionalCost: type === 'website' ? 1500 : 0,
    
    totalCost: type === 'branding'
      ? 22000
      : (type === 'services' ? servicesTotal : (type === 'whatsapp' ? 2700 : 16200)),
      
    paymentTerms: type === 'whatsapp' 
      ? "100% Advance Yearly Payment for Taswiq WhatsApp Business API Portal and Setup. Message usage charges paid directly to Meta."
      : "50% Advanced Payment upon Agreement sign-off, 25% upon Design Approval, and 25% upon final assets delivery and Launch.",
    preparedByName: "Ninan P Joseph",
    preparedByCompany: "Astra Technologies",
    preparedByTitle: "Astra Technologies"
  };
}

// Empty default array - no dummy proposals generated or seeded
export const SAMPLE_PROPOSALS: Proposal[] = [];

export async function triggerAutomatedFollowUp(proposal: Proposal) {
  try {
    const res = await fetch('/api/email/send-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: proposal.id,
        trigger: 'manual'
      })
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Failed to dispatch email follow-up alert.');
    }

    // Store reminder in local state for UI list tracking
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const formattedDueDate = futureDate.toISOString().split('T')[0];

    const newReminder: Reminder = {
      id: 'rem_auto_' + Math.random().toString(36).substring(2, 10),
      proposalId: proposal.id,
      proposalClient: proposal.clientName || 'Client',
      title: `Follow-up: ${proposal.clientName || 'Client'} Proposal`,
      dueDate: formattedDueDate,
      notes: `Automated SMTP follow-up alert dispatched to ${data.sent && data.sent.length > 0 ? data.sent.join(', ') : 'recipients'}. Value: QAR ${proposal.totalCost}.`,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    const cached = localStorage.getItem('prowess_admin_reminders');
    let remindersList: Reminder[] = [];
    if (cached) {
      try { remindersList = JSON.parse(cached); } catch { remindersList = []; }
    }
    const updatedReminders = [newReminder, ...remindersList];
    localStorage.setItem('prowess_admin_reminders', JSON.stringify(updatedReminders));

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('reminders_updated', { detail: updatedReminders }));

    return data;
  } catch (err: any) {
    console.error('Failed to dispatch follow-up email alert:', err.message);
    throw err;
  }
}

