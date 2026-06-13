/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Proposal, ProposalType, Milestone, ResourceCost, ProposalStatus } from './types';

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

export const DEFAULT_RESOURCE_COSTS: Omit<ResourceCost, 'id'>[] = [
  { role: "Brand Lead / Creative Director", hours: 25, rate: 250 },
  { role: "Senior Identity Designer", hours: 40, rate: 180 },
  { role: "Copywriter & Brand Consultant", hours: 15, rate: 120 }
];

export function createDefaultProposal(type: ProposalType): Proposal {
  const fileDate = new Date();
  const dateFormatted = fileDate.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const id = generateId();

  return {
    id,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: ProposalStatus.DRAFT,
    
    // Client Info
    clientName: "",
    companyName: "",
    proposalDate: dateFormatted,
    
    // Executive Summary
    briefDescription: "",
    
    // Branding default scope
    brandingScope: {
      logoDesign: true,
      brandGuidelines: true,
      businessCards: false,
      letterheads: false,
      emailSignature: false,
      envelopes: false,
      officeStamp: false,
      employeeIdCards: false,
      receiptsVouchers: false,
      additionalDeliverables: ""
    },
    
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
      maintenancePeriod: 3
    },
    
    // Timeline
    weeks: type === 'branding' ? 5 : 8,
    milestones: type === 'branding' 
      ? DEFAULT_BRANDING_MILESTONES.map((m, i) => ({ ...m, id: `${id}_m_${i}` }))
      : DEFAULT_WEBSITE_MILESTONES.map((m, i) => ({ ...m, id: `${id}_m_${i}` })),
    
    // Financials
    resourceCosts: type === 'branding'
      ? DEFAULT_RESOURCE_COSTS.map((r, i) => ({ ...r, id: `${id}_r_${i}` }))
      : [],
    developmentCost: type === 'website' ? 12000 : 0,
    pluginCost: type === 'website' ? 1200 : 0,
    maintenanceCost: type === 'website' ? 1500 : 0,
    additionalCost: type === 'website' ? 1500 : 0,
    
    totalCost: type === 'branding'
      ? DEFAULT_RESOURCE_COSTS.reduce((acc, curr) => acc + (curr.hours * curr.rate), 0)
      : 16200, // 12000 + 1200 + 1500 + 1500 = 16200
      
    paymentTerms: "50% Advanced Payment upon Agreement sign-off, 25% upon Design Approval, and 25% upon final assets delivery and Launch.",
    preparedByName: "Ninan P Joseph",
    preparedByCompany: "Astra Technologies",
    preparedByTitle: "Astra Technologies"
  };
}

// Prefill some sample historical proposals if the memory is clean
export const SAMPLE_PROPOSALS: Proposal[] = [
  {
    id: "prop_sample_mannai",
    type: "website",
    createdAt: "2026-02-08T10:00:00.000Z",
    updatedAt: "2026-02-08T10:30:00.000Z",
    status: ProposalStatus.UNDER_PROCESS,
    clientName: "Mannai TechHub",
    companyName: "Mannai TechHub Premium Site",
    proposalDate: "2026-02-08",
    briefDescription: "A modern, double-language corporate platform for Mannai TechHub to exhibit their emerging venture portfolio, cloud-native services, and capture regional enterprise leads across Qatar.",
    preparedByName: "Ninan P Joseph",
    preparedByCompany: "Astra Technologies",
    preparedByTitle: "Astra Technologies",
    preparedByUserId: "user_ninan",
    assignedUserId: "user_carlos",
    assignedUserName: "Carlos Ruiz",
    brandingScope: {
      logoDesign: false,
      brandGuidelines: false,
      businessCards: false,
      letterheads: false,
      emailSignature: false,
      envelopes: false,
      officeStamp: false,
      employeeIdCards: false,
      receiptsVouchers: false,
      additionalDeliverables: ""
    },
    websiteScope: {
      totalPages: 12,
      languages: "English & Arabic",
      cmsType: "headless-strapi",
      contactForms: true,
      blogModule: true,
      gallery: true,
      careersSection: true,
      downloadsSection: false,
      seoPlugin: true,
      securityPlugin: true,
      cachePlugin: true,
      maintenancePeriod: 6
    },
    weeks: 8,
    milestones: [
      { id: "sm_m1", week: "Week 1 - 2", title: "Information Architecture", description: "Design dual-language interactive sitemaps, wireframes, and UX storyboards." },
      { id: "sm_m2", week: "Week 3 - 5", title: "Theme Composition & Front-ends", description: "Implement high-speed Next.js pages styled with Tailwind, and dynamic transitions." },
      { id: "sm_m3", week: "Week 6 - 7", title: "Headless CMS Connection & SEO", description: "Integrate Strapi endpoints for career postings, portfolio items, and configure Yoast Premium metadata." },
      { id: "sm_m4", week: "Week 8", title: "Staging Audits & Domain DNS Cutover", description: "Complete responsive tests, security audits, and shift traffic to Cloud Run server setups." }
    ],
    resourceCosts: [],
    developmentCost: 12000,
    pluginCost: 1200,
    maintenanceCost: 1500,
    additionalCost: 1500,
    totalCost: 16200,
    paymentTerms: "50% Advanced, 25% upon Client Design approval, 25% upon Deployment."
  },
  {
    id: "prop_sample_pearl",
    type: "branding",
    createdAt: "2026-04-12T14:22:00.000Z",
    updatedAt: "2026-04-12T15:10:00.000Z",
    status: ProposalStatus.COMPLETED,
    clientName: "Pearl Capital Advisors",
    companyName: "Pearl Capital Advisors",
    proposalDate: "2026-04-12",
    briefDescription: "An ultra-premium visual branding system to project credibility and trust for an elite wealth advisory based in The Pearl-Qatar, referencing maritime heritage through modern golden luxury design cues.",
    preparedByName: "Lina Vance",
    preparedByCompany: "Astra Technologies",
    preparedByTitle: "Astra Technologies",
    preparedByUserId: "user_lina",
    assignedUserId: "user_lina",
    assignedUserName: "Lina Vance",
    brandingScope: {
      logoDesign: true,
      brandGuidelines: true,
      businessCards: true,
      letterheads: true,
      emailSignature: true,
      envelopes: true,
      officeStamp: true,
      employeeIdCards: false,
      receiptsVouchers: false,
      additionalDeliverables: "Scented Letterhead Papers, Embossed Gold Foil Seal Stamp"
    },
    websiteScope: {
      totalPages: 5,
      languages: "English",
      cmsType: "WordPress",
      contactForms: true,
      blogModule: false,
      gallery: false,
      careersSection: false,
      downloadsSection: false,
      seoPlugin: true,
      securityPlugin: true,
      cachePlugin: true,
      maintenancePeriod: 3
    },
    weeks: 5,
    milestones: [
      { id: "sm_m5", week: "Week 1", title: "Visual Space Alignment & Auditing", description: "Workshop mapping competing funds, luxurious layouts, gold typography traits, and core colors." },
      { id: "sm_m6", week: "Weeks 2 - 3", title: "Shield & Logomark Creation", description: "Develop three prestige crest/shield logomark proposals, typesetting with bespoke serifs." },
      { id: "sm_m7", week: "Week 4", title: "Executive Stationery Package", description: "Formulating physical specs for letterheads, premium cotton business cards, envelopes, and signature stamps." },
      { id: "sm_m8", week: "Week 5", title: "Brand Guidelines Delivery", description: "Compile detailed book of layouts, color tolerances (PMS Gold), safe boundaries, and vector drops." }
    ],
    resourceCosts: [
      { id: "sm_rc1", role: "Creative Director", hours: 30, rate: 300 },
      { id: "sm_rc2", role: "Senior Typographer & Designer", hours: 50, rate: 200 },
      { id: "sm_rc3", role: "Material & Print Consultant", hours: 10, rate: 150 }
    ],
    developmentCost: 0,
    pluginCost: 0,
    maintenanceCost: 0,
    additionalCost: 0,
    totalCost: 20500, // 9000 + 10000 + 1500 = 20500
    paymentTerms: "40% upfront deposit on contract signature, 40% after creative concept selection, and 20% on brand guidelines delivery."
  }
];
