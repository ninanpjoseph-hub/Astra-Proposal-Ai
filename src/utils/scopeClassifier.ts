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
