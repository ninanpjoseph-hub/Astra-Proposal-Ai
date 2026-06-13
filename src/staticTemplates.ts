/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StaticPage {
  title: string;
  subtitle: string;
  content: string[];
}

export const BRANDING_TEMPLATES: Record<string, StaticPage> = {
  objectives: {
    title: "Project Objectives",
    subtitle: "Establishing a Powerful Commercial Landmark",
    content: [
      "To build an authentic, durable, and highly adaptive visual identity system that positions your company as a distinguished market leader.",
      "To synthesize client aspirations and market opportunities into a clear, unified voice that commands attention across all brand touchpoints.",
      "To establish formal design rules that ensure visual parity, internal brand alignment, and high recall value for your target audience."
    ]
  },
  kickOff: {
    title: "Kick-Off & Alignment",
    subtitle: "The Genesis of the Collaborative Cycle",
    content: [
      "Discovery Session: Collaborative workshops mapping competitive landscapes, brand personalities, and key value drivers.",
      "Stakeholder Audits: Qualitative interviews to synchronize leadership visions, core customer stories, and commercial expectations.",
      "Operational Logistics: Establish shared communication channels, direct accountability lines, review mechanisms, and secure asset directories."
    ]
  },
  approach: {
    title: "Our Tactical Approach",
    subtitle: "Merging Empirical Research with Creative Vision",
    content: [
      "Customer-Centric Focus: Analyzing target demographic profiles to engineer precise visceral and intellectual brand connections.",
      "Visual Versatility: Building a brand that scales gracefully from a favicon to a physical highway billboard, maintaining visual fidelity throughout.",
      "Cohesive Ecosystem: Engineering a continuous brand signature across print, web, workspace signage, and communication collateral."
    ]
  },
  process: {
    title: "The Creative Process",
    subtitle: "A Structured Blueprint to Perfection",
    content: [
      "Phase 1: Discover & Map (Week 1) — Industry benchmarks, mood boards, competitive spacing arrays, and verbal identity rules.",
      "Phase 2: Concept & Design (Weeks 2-3) — Primary and secondary logo mark iterations, lockups, typesetting, and corporate colour palettes.",
      "Phase 3: Application Systems (Week 4) — High-fidelity collateral mockups like business cards, letterheads, and active packaging.",
      "Phase 4: Brand Guidelines (Week 5) — Compilation of the ultimate Brand Sourcebook detailing misuse rules, margins, and type scales."
    ]
  },
  delivery: {
    title: "Delivery Specifications",
    subtitle: "Handover of Production-Ready Assets",
    content: [
      "Vector Hierarchy: Source files in raw SVG, EPS, or AI layouts alongside optimized web-native PNG and JPEG packages.",
      "The Brand Bible: Interactive digital parameters outlining chromatic values (CMYK, RGB, Pantone, HEX) and typography rules.",
      "Print Setup: Pre-formatted print layouts containing bleed limits, crop-marks, and structural vector coordinates for collateral."
    ]
  },
  terms: {
    title: "Terms & Exclusions",
    subtitle: "Operational Boundaries & Mutual Assurances",
    content: [
      "Revision Boundaries: Base estimates factor in exactly three (3) iterative feedback loops. Additional revisions are billed flat per hour.",
      "Property Transfer: Full ownership copyrights of selected final designs transfer to the client automatically upon settlement of final invoices.",
      "Fabrication Exclusions: Physical material sourcing, offset print costs, stamp manufacturing, and structural signs are excluded from creative costs."
    ]
  }
};

export const WEBSITE_TEMPLATES: Record<string, StaticPage> = {
  objectives: {
    title: "Project Objectives",
    subtitle: "Engineering High-Yield Digital Gateways",
    content: [
      "To architect an fast, accessible, responsive web platform that merges your business priorities with exceptional user journeys.",
      "To design intuitive information architecture to optimize user conversion rates, newsletter signups, and service discovery.",
      "To establish a technically sound, SEO-primed base structure that can scale with your organization's future growth and product lanes."
    ]
  },
  approach: {
    title: "Our Tactical Approach",
    subtitle: "Performance, Accessibility, and Design Craft",
    content: [
      "Responsive Fluidity: Designing with percentage-based dynamic models ensuring optimal viewport experiences on mobile, tablet, and widescreen layouts.",
      "Technical Hygiene: Clean index semantic HTML, optimized WebP graphics, lazy-loading strategies, and localized caching setups.",
      "Search and Discovery Prep: Native semantic metadata, automatic sitemaps, structured local schema marks, and index crawling setups."
    ]
  },
  process: {
    title: "The Development Process",
    subtitle: "Iterative Construction of Premium Software",
    content: [
      "Phase 1: Design & Sitemap (Sprint 1) — High-fidelity wireframes, responsive component mockups, page hierarchy, and copy formulation.",
      "Phase 2: Development & Alpha (Sprint 2) — Writing clean custom React/TypeScript code, component structures, asset pipelines, and basic database endpoints.",
      "Phase 3: Integrations & Plugins (Sprint 3) — Deploying forms, CMS, tracking hooks, blog layouts, search engine features, and caching profiles.",
      "Phase 4: QA & Deploy (Sprint 4) — Cross-browser responsiveness checks, speed benchmarks, security verification, DNS swap, and go-live launch."
    ]
  },
  goingLive: {
    title: "Deployment & Going Live",
    subtitle: "Flawless Transitions to Server Production",
    content: [
      "The Migration Checklist: Safe transfers of staging environments to the main DNS host, securely routing live HTTPS credentials.",
      "Post-Launch Testing: In-place verification of form integrations, analytics events, load indicators, and API validation checks.",
      "Search Engine Handover: Direct sitemap registration to Google Search Console to ignite direct crawling indexation."
    ]
  },
  timelineMethodology: {
    title: "Timeline Methodology",
    subtitle: "Adaptive Milestones Driven by Agility",
    content: [
      "Continuous Sync: Staging links updated at the end of each weekly sprint, encouraging live client reviews and instantaneous feedback pipelines.",
      "Critical Path Tracking: Project milestones are tightly governed. Client approvals are requested within a 48-hour window to preserve launch dates."
    ]
  },
  milestones: {
    title: "Key Milestones",
    subtitle: "Progress Markers of Success",
    content: [
      "Milestone 1 — Design Framework & Information Architecture Approval",
      "Milestone 2 — Complete High-Fidelity Responsive Page Mockups Approval",
      "Milestone 3 — Functional Alpha Build deployed on private staging servers",
      "Milestone 4 — Final Client Content integration & Production Go-Live Setup"
    ]
  },
  futurePlans: {
    title: "Future Plans & Support",
    subtitle: "Durable Security & Application Health",
    content: [
      "Active Updates: Standard monthly reviews of dynamic CMS plugins, themes, security components, and database size checks.",
      "Scalable Features: Optional additions for upcoming product lanes, automated payments, and deep CRM connections are easily implemented post-launch."
    ]
  },
  terms: {
    title: "Terms & Exclusions",
    subtitle: "Standard Scope and Boundary Protections",
    content: [
      "Third-Party charges: Costs for domains, servers, premium storage, API tiers, and third-party SaaS engines are client expenses.",
      "Asset Responsibilities: High-resolution images, video files, exact vector logos, and custom advertising copy must be provided by the client.",
      "Review Hold: Project holds exceeding 30 calendar days due to client delays will trigger a fractional project reactivation charge."
    ]
  }
};

export const DEFAULT_SCOPE_TEMPLATES: Record<'static' | 'dynamic' | 'ecommerce', { title: string; description: string; isSelected: boolean }[]> = {
  static: [
    { title: "Number of pages", description: "Design and content layout for standard pages (Home, About, Services, Contact, etc.).", isSelected: true },
    { title: "Basic UI/UX design", description: "User interface and experience design phase ensuring clean aesthetics and consistent font pairings.", isSelected: true },
    { title: "Responsive design", description: "Seamless mobile, tablet, and desktop layout compatibility testing and viewport optimizations.", isSelected: true },
    { title: "Contact form integration", description: "Interactive contact forms to capture user inquiries and route to email seamlessly.", isSelected: true },
    { title: "Basic SEO setup", description: "Meta titles, descriptions, open graph social sharing cards, and foundational indexing parameters.", isSelected: true },
    { title: "Hosting deployment support", description: "Staging deployment, main domain DNS settings, and SSL security certificate installation.", isSelected: true }
  ],
  dynamic: [
    { title: "Admin panel / CMS integration", description: "Secure backoffice administrative dashboards for painless and dynamic page content updates.", isSelected: true },
    { title: "Database-driven content structure", description: "Structured database models for post categories, news listings, or other relational data records.", isSelected: true },
    { title: "User management", description: "Restricted profile areas, registration, and role-based login protocols if needed.", isSelected: true },
    { title: "Dynamic page templates", description: "Reusable dynamic layout blocks fetching database items (e.g. single blog posts, dynamic projects).", isSelected: true },
    { title: "API integrations", description: "Connecting external web services, RSS feeds, or application helper APIs to synchronize content.", isSelected: true },
    { title: "Advanced SEO configuration", description: "Automatic dynamic XML sitemaps, structured local schema metadata markups, and search console registration.", isSelected: true }
  ],
  ecommerce: [
    { title: "Product catalog structure", description: "Categories, custom attributes (size, colour), tags, customizable items collections, and filtering controls.", isSelected: true },
    { title: "Shopping cart & checkout system", description: "Professional, multi-step checkout funnel designed to maximize user completed transactions.", isSelected: true },
    { title: "Payment gateway integration", description: "Seamless connection to major card processors like Stripe, PayPal, or regional merchants.", isSelected: true },
    { title: "Order management system", description: "Backoffice dashboards for tracking new orders, customer details, and payment/fulfillment states.", isSelected: true },
    { title: "Inventory management", description: "Automated stock reduction tracking, custom alert limits, and product option levels control.", isSelected: true },
    { title: "Customer login/registration", description: "Dedicated customer area logging historical orders, checking statuses, and managing checkout profiles.", isSelected: true },
    { title: "Shipping configuration", description: "Complex dynamic shipping rules, flat rates, free shipping benchmarks, and regional tracking parameters.", isSelected: true },
    { title: "Invoice generation system", description: "Automatic checkout system PDF invoices or custom emailed receipts triggered post-purchase.", isSelected: true }
  ]
};

