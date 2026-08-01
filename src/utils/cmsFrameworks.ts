export interface CMSFrameworkConfig {
  id: string;
  name: string;
  stackTitle: string;
  description: string;
  advantages: string[];
  features: string[];
  techStack: {
    website: string;
    mobile: string;
    backend: string;
    database: string;
    hosting: string;
  };
}

export const CMS_FRAMEWORKS: Record<string, CMSFrameworkConfig> = {
  "Basic HTML5": {
    id: "Basic HTML5",
    name: "Basic HTML5 / Static",
    stackTitle: "Static Website Stack",
    description: "Lightweight, lightning-fast static web application compiled with modern HTML5, CSS3, and JavaScript, ensuring peak page speeds and minimal server overhead.",
    advantages: [
      "Maximum security with zero database vulnerability vectors",
      "Near-instantaneous global CDN page load times",
      "Ultra-low hosting and maintenance overhead",
      "Clean, lightweight semantic DOM architecture"
    ],
    features: [
      "Semantic HTML5 & CSS3 layout structure",
      "Responsive web design for all viewports",
      "Static assets CDN edge delivery",
      "Client-side form validation"
    ],
    techStack: {
      website: "HTML5 / CSS JavaScript",
      mobile: "Responsive Web Design",
      backend: "Static (No Backend)",
      database: "N/A",
      hosting: "Static HTML Hosting (CDN)"
    }
  },
  "WordPress": {
    id: "WordPress",
    name: "WordPress CMS",
    stackTitle: "WordPress CMS Stack",
    description: "Flexible open-source content management engine powered by PHP and MySQL, offering intuitive page building, structured media libraries, and robust SEO optimization.",
    advantages: [
      "User-friendly admin dashboard for rapid content publishing",
      "Vast ecosystem of verified plugins and integrations",
      "Built-in blogging engine and taxonomy management",
      "Strong native search engine optimization (SEO) foundation"
    ],
    features: [
      "Gutenberg drag-and-drop block editor",
      "Role-based multi-user access control",
      "Yoast / RankMath SEO suite integration",
      "Automated XML sitemap & schema markup generation"
    ],
    techStack: {
      website: "WordPress Theme Engine",
      mobile: "Responsive Web Design",
      backend: "WordPress REST API (PHP)",
      database: "MySQL",
      hosting: "WordPress Managed Hosting"
    }
  },
  "WooCommerce": {
    id: "WooCommerce",
    name: "WooCommerce E-Commerce",
    stackTitle: "WooCommerce E-Commerce Stack",
    description: "Scalable e-commerce framework built on WordPress, providing complete store ownership, customizable product catalogs, order processing pipelines, and payment gateway sync.",
    advantages: [
      "Full ownership of customer data, order history, and store assets",
      "Unlimited product variations and flexible pricing tiers",
      "Seamless payment gateway & ERP integration pipelines",
      "Modular extensions for subscriptions, bookings, and inventory sync"
    ],
    features: [
      "Automated order processing & email notifications",
      "Coupons, discounts, and promotional rule engines",
      "Multi-currency & localized payment checkout",
      "Real-time inventory and stock level tracking"
    ],
    techStack: {
      website: "WordPress + WooCommerce",
      mobile: "Responsive E-Commerce",
      backend: "WordPress REST API (PHP)",
      database: "MySQL",
      hosting: "WordPress Managed Hosting"
    }
  },
  "Shopify Framework": {
    id: "Shopify Framework",
    name: "Shopify E-Commerce",
    stackTitle: "Shopify E-Commerce Stack",
    description: "Fully hosted enterprise e-commerce infrastructure offering ultra-reliable cloud hosting, PCI-compliant checkout, global CDN acceleration, and native mobile readiness.",
    advantages: [
      "Zero server management or infrastructure maintenance",
      "Instant Level-1 PCI DSS compliant secure checkout",
      "Multi-channel inventory selling across web, mobile, and social",
      "Global high-availability cloud CDN distribution"
    ],
    features: [
      "Custom Shopify Liquid theme engine",
      "Shopify Admin & Storefront REST/GraphQL APIs",
      "Native mobile-first checkout experience",
      "Integrated analytics & automated inventory sync"
    ],
    techStack: {
      website: "Shopify Liquid Templates",
      mobile: "Shopify Native Mobile Ready",
      backend: "Shopify Admin & REST APIs",
      database: "Shopify Managed (Proprietary)",
      hosting: "Shopify Cloud Infrastructure"
    }
  },
  "Custom PHP/Node.js Backend": {
    id: "Custom PHP/Node.js Backend",
    name: "Custom PHP Stack",
    stackTitle: "Custom PHP Stack",
    description: "Bespoke web architecture powered by custom PHP REST API or Node.js services, engineered for tailored business logic, custom database relations, and high-performance throughput.",
    advantages: [
      "100% tailored functionality with zero third-party framework bloat",
      "Precise control over API payloads, data schemas, and security",
      "High-concurrency query execution and custom caching layers",
      "Seamless connection with proprietary third-party enterprise APIs"
    ],
    features: [
      "Bespoke RESTful JSON API endpoints",
      "Custom relational database schemas & indexing",
      "Optimized query caching & session stores",
      "Granular role-based security & JWT authentication"
    ],
    techStack: {
      website: "HTML5 / CSS JavaScript",
      mobile: "Responsive Web Design",
      backend: "Custom PHP REST API",
      database: "MySQL / PostgreSQL",
      hosting: "Cloud VPS / Dedicated Server"
    }
  },
  "Laravel": {
    id: "Laravel",
    name: "Laravel Framework",
    stackTitle: "Laravel Enterprise PHP Stack",
    description: "Modern MVC web framework providing elegant syntax, robust Eloquent ORM data models, built-in security middleware, and enterprise-grade backend stability.",
    advantages: [
      "Eloquent ORM for streamlined complex database operations",
      "Automated migration pipelines and schema versioning",
      "Robust background job queuing and task scheduling",
      "Built-in CSRF protection, password hashing, and XSS filtering"
    ],
    features: [
      "Blade template engine & reactive Inertia.js views",
      "Role-based access control (RBAC) & authentication",
      "Redis caching & queue workers",
      "RESTful API rate limiting and API token management"
    ],
    techStack: {
      website: "Blade / Vue.js / React",
      mobile: "Responsive Web & API-Ready",
      backend: "Laravel RESTful API (PHP 8+)",
      database: "PostgreSQL / MySQL",
      hosting: "Cloud VPS / AWS Elastic Beanstalk"
    }
  },
  "Magento": {
    id: "Magento",
    name: "Magento / Adobe Commerce",
    stackTitle: "Magento E-Commerce Stack",
    description: "High-capacity enterprise commerce platform engineered for large-scale multi-store catalogs, complex B2B pricing structures, and global multi-region trade.",
    advantages: [
      "Unlimited multi-store and multi-currency expansion capacity",
      "Advanced customer segmentation and custom tier pricing",
      "Sophisticated B2B requisitions and purchase order workflows",
      "High-speed Elasticsearch / OpenSearch catalog indexing"
    ],
    features: [
      "Multi-site & multi-language store management",
      "Headless GraphQL & REST API layer",
      "Advanced rule-based promotional engine",
      "PWA Studio for mobile app experience"
    ],
    techStack: {
      website: "Magento Luma / PWA Studio",
      mobile: "Headless PWA / Mobile Native",
      backend: "Magento GraphQL & REST API",
      database: "MySQL / MariaDB",
      hosting: "High-Performance Cloud Hosting"
    }
  },
  "Drupal": {
    id: "Drupal",
    name: "Drupal Enterprise CMS",
    stackTitle: "Drupal Enterprise CMS Stack",
    description: "Security-focused enterprise CMS platform designed for complex taxonomy, fine-grained access permissions, multi-site networks, and structured content modeling.",
    advantages: [
      "Government-grade security standard and granular permissions",
      "Flexible content architecture for complex data models",
      "Native decoupled API support via core JSON:API module",
      "Multilingual translation workflow out of the box"
    ],
    features: [
      "Twig templating & responsive layout builder",
      "Native RESTful & JSON:API content services",
      "Multilingual translation and workflow moderation",
      "Structured taxonomy and field API management"
    ],
    techStack: {
      website: "Drupal Twig Template Engine",
      mobile: "Responsive Web & Headless API",
      backend: "Drupal Core REST & JSON:API",
      database: "MySQL / PostgreSQL",
      hosting: "Enterprise Managed Hosting"
    }
  }
};

/**
 * Normalizes any cmsType string to its corresponding CMSFrameworkConfig object.
 */
export function getCMSFrameworkConfig(cmsType: string | undefined): CMSFrameworkConfig {
  if (!cmsType) return CMS_FRAMEWORKS["WordPress"];

  const normalized = cmsType.trim().toLowerCase();

  if (normalized.includes("woocommerce")) {
    return CMS_FRAMEWORKS["WooCommerce"];
  }
  if (normalized.includes("shopify")) {
    return CMS_FRAMEWORKS["Shopify Framework"];
  }
  if (normalized.includes("basic") || normalized.includes("html") || normalized.includes("static")) {
    return CMS_FRAMEWORKS["Basic HTML5"];
  }
  if (normalized.includes("laravel")) {
    return CMS_FRAMEWORKS["Laravel"];
  }
  if (normalized.includes("magento") || normalized.includes("adobe")) {
    return CMS_FRAMEWORKS["Magento"];
  }
  if (normalized.includes("drupal")) {
    return CMS_FRAMEWORKS["Drupal"];
  }
  if (normalized.includes("php") || normalized.includes("node") || normalized.includes("custom")) {
    return CMS_FRAMEWORKS["Custom PHP/Node.js Backend"];
  }
  if (normalized.includes("wordpress")) {
    return CMS_FRAMEWORKS["WordPress"];
  }

  for (const key of Object.keys(CMS_FRAMEWORKS)) {
    if (key.toLowerCase() === normalized) {
      return CMS_FRAMEWORKS[key];
    }
  }

  return {
    ...CMS_FRAMEWORKS["WordPress"],
    id: cmsType,
    name: cmsType,
    stackTitle: `${cmsType} Stack`
  };
}
