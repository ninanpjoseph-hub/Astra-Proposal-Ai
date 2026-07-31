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
    title: "Our Approach",
    subtitle: "Creating a Scalable Digital Platform",
    content: [
      "Our website development approach focuses on creating a digital platform that meets your immediate business requirements while being strategically prepared for future growth. We consider your organisation’s evolving needs, industry trends, changing digital landscapes, and long-term business objectives to ensure the website remains relevant, scalable, and effective.",
      "Our goal is to build a digital experience that not only represents your brand today but also supports its future expansion and continued success."
    ]
  },
  process: {
    title: "Our Process",
    subtitle: "Strategic Delivery Phases",
    content: [
      "Discovery — We begin by understanding your business, operations, objectives, target audience, and challenges. Through detailed discovery, we identify key opportunities and insights that help shape the right digital strategy, messaging, and user experience for your website.",
      "Strategy — A strong digital presence begins with a clear brand and content strategy. We evaluate your existing brand positioning, architecture, and communication approach to ensure consistency across all touchpoints. Where required, we help establish a stronger digital foundation that aligns your brand identity with your business goals and customer expectations.",
      "Design — Our design approach combines creativity, usability, and industry best practices to deliver a visually engaging and intuitive website experience. Every design decision is carefully considered — from visual style and user behaviour to market trends and audience expectations — ensuring a digital presence that reflects your brand personality while creating meaningful engagement with your customers.",
      "Delivery — We transform strategy and design into a high-performing digital solution that supports your business growth. With our expertise, attention to detail, and commitment to quality, we deliver a website that exceeds expectations, enhances customer experience, and provides a strong foundation for long-term digital success."
    ]
  },
  goingLive: {
    title: "Going Live",
    subtitle: "Deployment & Launch",
    content: [
      "Testing & Quality Assurance — Comprehensive checks including browser compatibility across Google Chrome, Mozilla Firefox, Safari, and Microsoft Edge; HTML/CSS validation; functional testing of features, forms, links, and interactive elements; performance and usability checks; and content accuracy verification.",
      "Website Launch — Migration from staging to the live production server, including final pre-launch checklist review, deployment of website files and database, configuration of required settings/integrations, and post-launch verification."
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
    { title: "Omnichannel E-Commerce Web Storefront", description: "Fully responsive, optimized React.js/Next.js store featuring product catalogs, advanced categories/subcategories, filtering, search, sorting, zoomable media galleries, and verified reviews.", isSelected: true },
    { title: "Bilingual iOS & Android Customer Mobile Applications", description: "Bilingual (English & Arabic) native mobile apps with secure profile management, address books, saved card tokens, wishlists, order histories, and push notifications.", isSelected: true },
    { title: "Real-Time Driver Delivery Tracking App", description: "Interactive map-driven mobile application for delivery agents offering instant routing directions, status tags, and automated nearest-driver assignment logic.", isSelected: true },
    { title: "Centralized Admin Management Portal", description: "A command center dashboard displaying sales analytics, revenue reports, branch performances, product catalog uploads, and secure refund/cancellation controls.", isSelected: true },
    { title: "Dynamic Multi-Branch Inventory Control", description: "Automated routing that geolocates buyers, runs stock-checks at nearest fulfillment centers, and routes order tracking branch-wise to optimize delivery speed.", isSelected: true },
    { title: "Targeted Promotions & Promo Code Engine", description: "Promo code management module supporting fixed discounts, percentages, first-order incentives, category-based triggers, and segmented customer campaign rules.", isSelected: true },
    { title: "Odoo ERP API Integration Gateway", description: "API-based bidirectional integration between E-Commerce engines and Client's existing Odoo ERP environment for customer profiles, stock, and orders synchronization.", isSelected: true },
    { title: "Integrated Payment Processor & COD", description: "Secure integration of approved credit/debit card payment gateways and optional Cash on Delivery (COD) workflows with checkout validations.", isSelected: true },
    { title: "Enterprise-Grade Security & Audit Suite", description: "Implementation of secure protocol architectures (SSL, JWT auth tokens, granular RBAC permissions, client data protection policies, and immutable system audit logs).", isSelected: true },
    { title: "High-Availability Database & Cloud Hosting", description: "Staging and production deployment of Node.js backend pipelines and PostgreSQL/MySQL databases on high-uptime hosting systems with auto-backups.", isSelected: true },
    { title: "User Guides & Technical Documentation", description: "Publication of operator user onboarding guides, developer system maps, data dictionaries, API path descriptions, and administrator training instructions.", isSelected: true },
    { title: "Corporate Staff Training & Maintenance Support", description: "Live interactive training workshops for administrators and branch agents, plus initial post-launch AMC support covering fixes and optimization monitoring.", isSelected: true }
  ]
};

