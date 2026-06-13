/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WebsiteScope } from '../types';
import { Network, FileText, CheckCircle2 } from 'lucide-react';

interface SitemapGeneratorProps {
  scope: WebsiteScope;
  projectName: string;
}

export default function SitemapGenerator({ scope, projectName }: SitemapGeneratorProps) {
  // Compute list of virtual sitemap nodes
  const sitemapNodes: { title: string; children?: string[]; description: string }[] = [
    { title: "Home Page", description: "Main landing experience, hero section, corporate summary, and core pillars." }
  ];

  // Dynamic structural additions based on user check selections:
  sitemapNodes.push({
    title: "About Us & Services",
    description: "Company journey, executive bios, and specialized business offerings page."
  });

  if (scope.contactForms) {
    sitemapNodes.push({
      title: "Contact Us",
      description: "Direct localization map, office address coordinates, and active inquiry dispatch form."
    });
  }

  if (scope.blogModule) {
    sitemapNodes.push({
      title: "Insights & Blog Index",
      description: "Editorial board grid with categorization filters and search capability.",
      children: ["Individual Article Layout", "Author Bio Sheet"]
    });
  }

  if (scope.gallery) {
    sitemapNodes.push({
      title: "Media Portfolio / Gallery",
      description: "Visual grid with filter categories and touch-responsive lightbox galleries."
    });
  }

  if (scope.careersSection) {
    sitemapNodes.push({
      title: "Careers Board",
      description: "Listing of open operations roles with real-time CV submission workflows.",
      children: ["Online Job Application Form"]
    });
  }

  if (scope.downloadsSection) {
    sitemapNodes.push({
      title: "Resources & Download Center",
      description: "Whitepapers, catalog brochures, and secure digital file access points."
    });
  }

  // Figure out if there are surplus pages based on the totalPages input
  const baseCount = sitemapNodes.reduce((acc, curr) => acc + 1 + (curr.children?.length || 0), 0);
  const diff = scope.totalPages - baseCount;
  
  if (diff > 0) {
    sitemapNodes.push({
      title: `${diff} Additional Sub-page${diff > 1 ? 's' : ''}`,
      description: "Supplementary dynamic content pages, utility, privacy policies, or landing grids as identified in sprint logs."
    });
  }

  return (
    <div id="sitemap-generator-container" className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-xs max-w-full">
      <div className="flex items-center gap-2 mb-4">
        <Network className="h-5 w-5 text-blue-600" />
        <h4 className="font-sans font-semibold text-slate-800 text-sm tracking-tight uppercase">
          Dynamic Sitemap Architecture
        </h4>
      </div>
      <p className="text-xs text-slate-500 mb-6 font-sans">
        This interactive site organization map is dynamically calculated based on selected scope checkboxes and total page specifications for <strong>{projectName || "Your Website Project"}</strong>.
      </p>

      {/* Sitemap Graphic */}
      <div className="flex flex-col items-center">
        {/* Root Node */}
        <div className="sitemap-root bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm border border-blue-700 font-sans font-bold text-xs tracking-wider uppercase text-center min-w-[200px] z-10">
          📍 Core Web Root
          <div className="text-[10px] font-normal lowercase mt-0.5 opacity-90">
            {projectName ? projectName.toLowerCase().replace(/\s+/g, '-') : 'company'}.com
          </div>
        </div>

        {/* Vertical divider list */}
        <div className="w-0.5 h-6 bg-slate-300"></div>

        {/* Mid connector bar */}
        <div className="w-5/6 h-0.5 bg-slate-300 relative"></div>

        {/* Leaves Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-4">
          {sitemapNodes.map((node, index) => (
            <div 
              key={index} 
              id={`sitemap-node-${index}`}
              className="sitemap-node flex flex-col bg-white border border-slate-200/80 rounded-lg p-3 shadow-xs hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-sans font-semibold text-[13px] text-slate-900 leading-snug">
                  {node.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans pl-6">
                {node.description}
              </p>

              {node.children && node.children.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 pl-6 flex flex-col gap-1.5">
                  {node.children.map((child, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                      <span className="text-amber-500 font-bold">└</span>
                      <span>{child}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Meta indicators */}
      <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-t border-slate-200 pt-4 text-xs font-serif italic text-slate-600">
        <div className="flex items-center gap-1 font-sans not-italic text-slate-500 text-[11px]">
          <CheckCircle2 className="h-4 w-4 text-blue-600 inline" />
          <span>Full SEO integration applied to each page layout</span>
        </div>
        <div className="font-sans not-italic text-[11px] bg-slate-100 px-2.5 py-1 rounded-full text-slate-700">
          Target Total: <strong className="text-slate-900 font-semibold">{scope.totalPages}</strong> Page Templates
        </div>
      </div>
    </div>
  );
}
