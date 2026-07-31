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

export const DEFAULT_SCOPE_TEMPLATES: Record<'static' | 'dynamic' | 'ecommerce', { title: string; description: string; isSelected: boolean; isCustom?: boolean }[]> = {
  static: [
    { title: "Homepage layout & design", description: "Homepage layout and visual design structure.", isSelected: true },
    { title: "Standard page templates (About, Services, Contact)", description: "Standard page layout templates including About Us, Services, Contact, etc.", isSelected: true },
    { title: "Navigation & information architecture", description: "Header navigation menus, footer layouts, and site information architecture.", isSelected: true },
    { title: "Contact form (email/leads collection)", description: "Interactive contact forms to capture user inquiries and route leads via email.", isSelected: true },
    { title: "Google Analytics setup", description: "Basic Google Analytics property setup and visitor tracking parameters.", isSelected: true }
  ],
  dynamic: [
    { title: "Homepage with dynamic content blocks", description: "Dynamic homepage featuring interactive modules, hero blocks, and live content feeds.", isSelected: true },
    { title: "Blog/News section with post management", description: "Full blog or news management system for publishing, categorizing, and managing articles.", isSelected: true },
    { title: "User authentication (login/signup)", description: "Secure user registration, authentication, login, and password recovery protocols.", isSelected: true },
    { title: "Admin dashboard for content management", description: "Backoffice administrative panel for managing dynamic page content, posts, and media.", isSelected: true },
    { title: "Search functionality", description: "Site-wide instant search capability across dynamic content and blog articles.", isSelected: true },
    { title: "Comment system (if blog)", description: "Interactive user comment and discussion thread system on blog posts.", isSelected: true },
    { title: "User profile management", description: "User account management, profile settings, and preference controls.", isSelected: true },
    { title: "CMS (WordPress/Strapi/Custom PHP)", description: "Content Management System implementation and custom backend connection.", isSelected: true },
    { title: "Email notification system", description: "Automated transactional and operational email notification workflows.", isSelected: true },
    { title: "Google Analytics with event tracking", description: "Google Analytics setup with custom conversion event tracking and goals.", isSelected: true },
    { title: "User behavior dashboard", description: "User activity, pageview engagement, and behavior analytics dashboard.", isSelected: true },
    { title: "Custom database schema & data models", description: "Custom database schema design, entity relationships, and relational data modeling.", isSelected: true, isCustom: true }
  ],
  ecommerce: [
    { title: "Product catalog pages with filtering", description: "Product catalog pages with multi-attribute filtering, category browsing, and sorting.", isSelected: true },
    { title: "Shopping cart system", description: "Interactive shopping cart system with real-time price, discount, and tax calculations.", isSelected: true },
    { title: "Checkout flow (multi-step)", description: "Streamlined multi-step checkout flow with shipping address validation and payment selection.", isSelected: true },
    { title: "Order management system", description: "Complete order processing, status tracking, and customer order history workflow.", isSelected: true },
    { title: "Admin dashboard (inventory, orders, customers)", description: "Centralized e-commerce command portal for managing inventory, orders, products, and customer data.", isSelected: true },
    { title: "Product search & advanced filtering", description: "Instant product search with advanced facet filtering by price, category, and specifications.", isSelected: true },
    { title: "Wishlist/favorites functionality", description: "Customer wishlist and saved product favorites functionality.", isSelected: true },
    { title: "Customer reviews & ratings", description: "Product review submission, star ratings, and verified buyer badge display.", isSelected: true },
    { title: "Discount/coupon system", description: "Promo code management module supporting percentage, fixed discounts, and coupon rules.", isSelected: true },
    { title: "Email order confirmations", description: "Automated order confirmation, invoice summary, and shipping notification emails.", isSelected: true },
    { title: "Payment gateway (Stripe/PayPal/2Checkout)", description: "Secure payment gateway integration for credit/debit card and online checkout.", isSelected: true },
    { title: "Email marketing system (abandoned cart)", description: "Email marketing integration with automated abandoned cart recovery campaigns.", isSelected: true },
    { title: "Inventory/POS synchronization", description: "Real-time inventory and point-of-sale system synchronization.", isSelected: true },
    { title: "Sales dashboard & reporting", description: "Comprehensive sales analytics, revenue reports, and performance metrics.", isSelected: true },
    { title: "Customer behavior tracking", description: "Customer funnel tracking, cart analytics, and drop-off behavior analysis.", isSelected: true },
    { title: "Conversion rate optimization metrics", description: "Conversion tracking, funnel metrics, and optimization KPIs.", isSelected: true },
    { title: "Product database schema", description: "Complex product catalog schema, variants, inventory models, and attribute mapping.", isSelected: true, isCustom: true },
    { title: "Security compliance (PCI-DSS, SSL encryption)", description: "PCI-DSS compliance standards, SSL encryption, and secure transactional protocols.", isSelected: true, isCustom: true }
  ]
};

