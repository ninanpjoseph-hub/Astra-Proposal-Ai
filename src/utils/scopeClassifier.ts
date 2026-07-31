/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScopeOfWorkItem } from '../types';

export type ScopeCategory = 'core' | 'features' | 'integrations' | 'analytics' | 'custom';

export interface ScopePage {
  id: string;
  pageNum: number;
  subPageLabel?: string; // e.g. "a", "b" for splits
  category: ScopeCategory;
  categoryTitle: string;
  items: ScopeOfWorkItem[];
}

export function getScopeCategory(title: string, isCustom?: boolean): ScopeCategory {
  if (isCustom) return 'custom';
  
  const t = title.toLowerCase();

  // Explicit title matches for Core Structure
  if (
    t.includes('homepage layout') ||
    t.includes('standard page templates') ||
    t.includes('navigation & information architecture') ||
    t.includes('homepage with dynamic content') ||
    t.includes('blog/news section') ||
    t.includes('user authentication') ||
    t.includes('admin dashboard for content management') ||
    t.includes('product catalog pages') ||
    t.includes('shopping cart system') ||
    t.includes('checkout flow') ||
    t.includes('order management system') ||
    t.includes('admin dashboard (inventory, orders, customers)')
  ) {
    return 'core';
  }

  // Explicit title matches for Features
  if (
    t.includes('search functionality') ||
    t.includes('comment system') ||
    t.includes('user profile management') ||
    t.includes('product search') ||
    t.includes('wishlist/favorites') ||
    t.includes('customer reviews & ratings') ||
    t.includes('discount/coupon system') ||
    t.includes('email order confirmations')
  ) {
    return 'features';
  }

  // Explicit title matches for Integrations
  if (
    t.includes('contact form (email/leads') ||
    t.includes('cms (wordpress/strapi') ||
    t.includes('email notification system') ||
    t.includes('payment gateway') ||
    t.includes('email marketing system') ||
    t.includes('inventory/pos synchronization')
  ) {
    return 'integrations';
  }

  // Explicit title matches for Analytics
  if (
    t.includes('google analytics setup') ||
    t.includes('google analytics with event') ||
    t.includes('user behavior dashboard') ||
    t.includes('sales dashboard & reporting') ||
    t.includes('customer behavior tracking') ||
    t.includes('conversion rate optimization')
  ) {
    return 'analytics';
  }

  // Explicit title matches for Custom Info
  if (
    t.includes('custom database schema') ||
    t.includes('product database schema') ||
    t.includes('security compliance')
  ) {
    return 'custom';
  }
  
  // Integrations & APIs
  if (
    t.includes('odoo') || 
    t.includes('api') || 
    t.includes('payment') || 
    t.includes('gateway') || 
    t.includes('contact form') || 
    t.includes('integration') || 
    t.includes('webhook') ||
    t.includes('connector')
  ) {
    return 'integrations';
  }
  
  // Analytics & Tracking & Server Setup
  if (
    t.includes('seo') || 
    t.includes('analytic') || 
    t.includes('google tag') ||
    t.includes('security') || 
    t.includes('database') || 
    t.includes('hosting') || 
    t.includes('server') || 
    t.includes('audit') || 
    t.includes('backup') ||
    t.includes('infrastructure')
  ) {
    return 'analytics';
  }
  
  // Features & Functionality
  if (
    t.includes('driver') || 
    t.includes('admin') || 
    t.includes('portal') || 
    t.includes('dashboard') || 
    t.includes('branch') || 
    t.includes('promotion') || 
    t.includes('promo') || 
    t.includes('coupon') || 
    t.includes('cart') || 
    t.includes('checkout') || 
    t.includes('user management') || 
    t.includes('cms') || 
    t.includes('member') ||
    t.includes('feedback') ||
    t.includes('variant') ||
    t.includes('search')
  ) {
    return 'features';
  }
  
  // Custom scope items or ops support / instruction guides
  if (
    t.includes('training') || 
    t.includes('document') || 
    t.includes('guide') || 
    t.includes('support') || 
    t.includes('handover')
  ) {
    return 'custom';
  }
  
  // Default base category
  return 'core';
}

export function getCategoryLabel(category: ScopeCategory): string {
  switch (category) {
    case 'core': return 'Core Website Structure';
    case 'features': return 'Features & Functionality';
    case 'integrations': return 'Integrations & APIs';
    case 'analytics': return 'Analytics & Tracking';
    case 'custom': return 'Custom & Operational Delivery';
    default: return 'Core Scope Elements';
  }
}

/**
 * Groups and automatically splits scope items when exceeding visual threshold
 */
export function groupScopeIntoPages(items: ScopeOfWorkItem[], threshold = 3): ScopePage[] {
  // First, categorize each item
  const categorized: Record<ScopeCategory, ScopeOfWorkItem[]> = {
    core: [],
    features: [],
    integrations: [],
    analytics: [],
    custom: []
  };
  
  items.forEach(item => {
    const category = getScopeCategory(item.title, item.isCustom);
    categorized[category].push(item);
  });
  
  const pages: ScopePage[] = [];
  const order: ScopeCategory[] = ['core', 'features', 'integrations', 'analytics', 'custom'];
  
  let pageCounter = 1;
  
  order.forEach(category => {
    const groupItems = categorized[category];
    if (groupItems.length === 0) return;
    
    // Split into chunks if items count exceeds the visual threshold
    const chunks: ScopeOfWorkItem[][] = [];
    for (let i = 0; i < groupItems.length; i += threshold) {
      chunks.push(groupItems.slice(i, i + threshold));
    }
    
    chunks.forEach((chunk, chunkIdx) => {
      // Create sub-page label if split has happened
      const subLabel = chunks.length > 1 ? String.fromCharCode(97 + chunkIdx) : undefined; // a, b, c...
      
      pages.push({
        id: `page-${category}-${chunkIdx}`,
        pageNum: pageCounter,
        subPageLabel: subLabel,
        category,
        categoryTitle: getCategoryLabel(category),
        items: chunk
      });
    });
    
    pageCounter++;
  });
  
  return pages;
}
