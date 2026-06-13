/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BRANDING_TEMPLATES, WEBSITE_TEMPLATES, DEFAULT_SCOPE_TEMPLATES } from '../staticTemplates';
import { formatQAR, DEFAULT_BRANDING_MILESTONES, DEFAULT_WEBSITE_MILESTONES, triggerAutomatedFollowUp } from '../proposalUtils';
import SitemapGenerator from './SitemapGenerator';
import { Check, Bookmark, DollarSign, Calendar, Landmark, BookOpen, Signature, Award, ChevronRight, FileText, Printer, Download, History, RotateCcw, Clock, Sliders, Upload } from 'lucide-react';
import { Proposal, ProposalHistoryEntry, ProposalStatus } from '../types';

interface ProposalDocumentViewProps {
  proposal: Proposal;
  onBack?: () => void;
  showBackBtn?: boolean;
  onRevert?: (targetHistory: ProposalHistoryEntry) => void;
  onUpdateProposal?: (updated: Proposal) => void;
}

// Helper functions to convert oklch to rgb to prevent html2canvas color parsing crashes
function oklchToRgb(L: number, C: number, H: number, alpha: string = '1'): string {
  // Convert Hue from degrees to radians
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // Conversion matrix from OKLab to LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Cube LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS to Linear sRGB
  const r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bVal = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Gamma correction to sRGB
  const gamma = (c: number) => {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  const r255 = Math.max(0, Math.min(255, Math.round(gamma(r) * 255)));
  const g255 = Math.max(0, Math.min(255, Math.round(gamma(g) * 255)));
  const b255 = Math.max(0, Math.min(255, Math.round(gamma(bVal) * 255)));

  return `rgba(${r255}, ${g255}, ${b255}, ${alpha})`;
}

function oklabToRgb(L: number, a: number, b: number, alpha: string = '1'): string {
  // Conversion matrix from OKLab to LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Cube LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS to Linear sRGB
  const r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bVal = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Gamma correction to sRGB
  const gamma = (c: number) => {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  const r255 = Math.max(0, Math.min(255, Math.round(gamma(r) * 255)));
  const g255 = Math.max(0, Math.min(255, Math.round(gamma(g) * 255)));
  const b255 = Math.max(0, Math.min(255, Math.round(gamma(bVal) * 255)));

  return `rgba(${r255}, ${g255}, ${b255}, ${alpha})`;
}

function replaceOklchInCss(cssText: string): string {
  return cssText.replace(/oklch\s*\(\s*([^)]+)\s*\)/g, (match, inner) => {
    try {
      const parts = inner.trim().split(/[\s/]+/);
      if (parts.length < 3) return 'rgba(0,0,0,0)';
      
      let L = parseFloat(parts[0]);
      if (parts[0].includes('%')) L /= 100;
      
      let C = parseFloat(parts[1]);
      if (parts[1].includes('%')) C /= 100;
      
      let H = parseFloat(parts[2]);
      if (parts[2].includes('deg')) H = parseFloat(parts[2]);
      
      // Support alpha if declared
      let alpha = '1';
      if (parts.length > 3) {
        let aVal = parseFloat(parts[3]);
        if (parts[3].includes('%')) aVal /= 100;
        alpha = String(aVal);
      }
      
      return oklchToRgb(L, C, H, alpha);
    } catch (e) {
      console.warn('Failed to parse oklch color match:', match, e);
      return 'rgba(0,0,0,0)';
    }
  });
}

function replaceOklabInCss(cssText: string): string {
  return cssText.replace(/oklab\s*\(\s*([^)]+)\s*\)/g, (match, inner) => {
    try {
      const parts = inner.trim().split(/[\s/]+/);
      if (parts.length < 3) return 'rgba(0,0,0,0)';
      
      let L = parseFloat(parts[0]);
      if (parts[0].includes('%')) L /= 100;
      
      let a = parseFloat(parts[1]);
      if (parts[1].includes('%')) a /= 100;
      
      let b = parseFloat(parts[2]);
      if (parts[2].includes('%')) b /= 100;
      
      // Support alpha if declared
      let alpha = '1';
      if (parts.length > 3) {
        let aVal = parseFloat(parts[3]);
        if (parts[3].includes('%')) aVal /= 100;
        alpha = String(aVal);
      }
      
      return oklabToRgb(L, a, b, alpha);
    } catch (e) {
      console.warn('Failed to parse oklab color match:', match, e);
      return 'rgba(0,0,0,0)';
    }
  });
}

export function ProposalPageHeader({ proposal, pageNumber }: { proposal: any; pageNumber: string }) {
  const mode = proposal.letterheadMode || 'minimal';
  const customImg = proposal.customLetterhead;
  const height = proposal.letterheadHeight || 80;
  const isFullPage = !!proposal.letterheadFullPage;

  if (mode === 'none') {
    return null;
  }

  if (mode === 'custom' && customImg) {
    if (isFullPage) {
      return null;
    }
    // Render a clean spacing block to keep text from overlapping the top-edge letterhead background.
    // The A4 container has 24mm (approx 90px) or 20mm (approx 75px) of padding.
    const spaceNeeded = Math.max(0, height - 70);
    if (spaceNeeded > 0) {
      return (
        <div 
          style={{ height: `${spaceNeeded}px` }} 
          className="w-full relative z-10 select-none mb-4" 
        />
      );
    }
    return null;
  }

  // default / 'minimal' layout (highly elegant, neutral, no hardcoded Astra stuff)
  return (
    <div className="flex justify-between items-center pb-3 border-b border-slate-200/80 mb-6 relative z-10 w-full select-none text-slate-500 text-[10px] font-sans">
      <div className="flex items-center gap-2">
        <span className="font-mono tracking-wider text-slate-400 font-bold uppercase block">
          Client Proposal
        </span>
        <span className="text-slate-350 font-mono">|</span>
        <span className="font-medium text-slate-700">
          Client: {proposal.clientName}
        </span>
      </div>
      <div className="text-right flex items-center gap-2">
        <span className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider text-[8px]">
          {proposal.status || "Draft"}
        </span>
        <span className="text-slate-350 font-mono">|</span>
        <span className="font-mono tracking-wider font-bold text-slate-600">PAGE {pageNumber}</span>
      </div>
    </div>
  );
}

export function ProposalCustomLetterheadBackground({ proposal }: { proposal: any }) {
  const mode = proposal.letterheadMode || 'minimal';
  const customImg = proposal.customLetterhead;
  const height = proposal.letterheadHeight || 80;
  const isFullPage = !!proposal.letterheadFullPage;

  if (mode !== 'custom' || !customImg) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden rounded-2xl print:rounded-none">
      <img
        src={customImg}
        style={isFullPage ? { width: '100%', height: '100%' } : { height: `${height}px`, width: '100%' }}
        className={isFullPage ? "w-full h-full object-cover" : "w-full object-contain object-top"}
        alt="Custom Corporate Letterhead Background"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export function ProposalPageFooter({ proposal, pageNumber }: { proposal: any; pageNumber: string }) {
  const mode = proposal.letterheadMode || 'minimal';
  if (mode === 'none') {
    return (
      <div className="w-full mt-auto relative z-10 pb-1 pt-4 text-right text-slate-400 font-mono text-[9px]">
        {pageNumber}
      </div>
    );
  }

  return (
    <div className="w-full mt-auto relative z-10 select-none pb-1 pt-4">
      {/* Neutral thin divider */}
      <div className="h-[1px] w-full bg-slate-200 mb-2" />

      {/* Footer Info Strip */}
      <div className="flex justify-between items-center text-[9px] text-slate-500 font-sans font-medium px-1">
        <div>
          <span>{proposal.preparedByCompany || "Commercial Proposal"}</span>
          <span className="mx-1.5 text-slate-300">|</span>
          <span>Confidentiality Guaranteed</span>
        </div>
        <div className="font-mono text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          Page {pageNumber}
        </div>
      </div>
    </div>
  );
}

export function ProposalWatermark({ proposal }: { proposal: any }) {
  if (!proposal.showWatermark) return null;
  const text = proposal.customWatermarkText || proposal.companyName || "CONFIDENTIAL";
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
      <div className="relative opacity-[0.025] flex flex-col items-center">
        <div className="font-sans font-black text-[90px] tracking-[0.14em] text-slate-900 leading-none uppercase transform -rotate-[15deg]">
          {text}
        </div>
      </div>
    </div>
  );
}

export function AstraLogo({ className = "h-10" }: { className?: string }) {
  return null;
}

export function AstraWatermark() {
  return null;
}

export function AstraFooter({ pageNumber }: { pageNumber: string }) {
  return null;
}

export default function ProposalDocumentView({ proposal, onBack, showBackBtn = true, onRevert, onUpdateProposal }: ProposalDocumentViewProps) {
  const isBranding = proposal.type === 'branding';
  const templates = isBranding ? BRANDING_TEMPLATES : WEBSITE_TEMPLATES;
  
  // Format dates beautifully
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    const originalTab = activeTab;
    if (originalTab !== 'document') {
      setActiveTab('document');
      setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error("Print was blocked or failed", e);
        }
        setTimeout(() => {
          setActiveTab(originalTab);
        }, 500);
      }, 500);
    } else {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.error("Print was blocked or failed", e);
      }
    }
  };

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progressText, setProgressText] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'document' | 'history'>('document');

  const handleDownloadPDF = async () => {
    const originalTab = activeTab;
    const originalStyles = new Map<HTMLStyleElement, string>();
    const originalInlineStyles = new Map<HTMLElement, string>();
    const disabledLinks: HTMLLinkElement[] = [];
    const tempSafeStyles: HTMLStyleElement[] = [];
    const originalGetComputedStyle = window.getComputedStyle;

    try {
      setIsGenerating(true);
      
      // If user was on revision tab, switch to document tab momentarily so DOM elements exist and are styled
      if (originalTab !== 'document') {
        setProgressText('Preparing draft container templates...');
        setActiveTab('document');
        // Let React finish commit and layout update before DOM measurement
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      setProgressText('Spinning up high-fidelity PDF engines...');
      
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Temporarily override window.getComputedStyle to intercept oklch/oklab color values live during html2canvas traversal
      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle.call(window, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return (name: string) => {
                const val = target.getPropertyValue(name);
                if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                  let cleaned = val;
                  if (cleaned.includes('oklch')) {
                    cleaned = replaceOklchInCss(cleaned);
                  }
                  if (cleaned.includes('oklab')) {
                    cleaned = replaceOklabInCss(cleaned);
                  }
                  return cleaned;
                }
                return val;
              };
            }
            const val = target[prop as any];
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              let cleaned = val;
              if (cleaned.includes('oklch')) {
                cleaned = replaceOklchInCss(cleaned);
              }
              if (cleaned.includes('oklab')) {
                cleaned = replaceOklabInCss(cleaned);
              }
              return cleaned;
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        });
      };

      // Select all elements with the class 'proposal-page'
      const pageElements = document.querySelectorAll('.proposal-page');
      if (pageElements.length === 0) {
        throw new Error('No pages found to generate PDF');
      }

      setProgressText('Translating vector colors for compatibility...');
      // 1. Process all inline style tags
      const styleElements = Array.from(document.querySelectorAll('style'));
      for (const styleNode of styleElements) {
        const text = styleNode.textContent || '';
        originalStyles.set(styleNode, text);
        if (text.includes('oklch') || text.includes('oklab')) {
          let updatedText = text;
          if (text.includes('oklch')) {
            updatedText = replaceOklchInCss(updatedText);
          }
          if (text.includes('oklab')) {
            updatedText = replaceOklabInCss(updatedText);
          }
          styleNode.textContent = updatedText;
        }
      }

      // 2. Process all external same-origin stylesheet links which could contain oklch (like built CSS)
      const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      for (const linkNode of linkElements) {
        try {
          const href = linkNode.href;
          if (href && href.startsWith(window.location.origin)) {
            const response = await fetch(href);
            const originalCss = await response.text();
            
            if (originalCss.includes('oklch') || originalCss.includes('oklab')) {
              linkNode.disabled = true;
              disabledLinks.push(linkNode);
              
              let convertedCss = originalCss;
              if (originalCss.includes('oklch')) {
                convertedCss = replaceOklchInCss(convertedCss);
              }
              if (originalCss.includes('oklab')) {
                convertedCss = replaceOklabInCss(convertedCss);
              }
              const tempStyle = document.createElement('style');
              tempStyle.id = 'temp-pdf-safe-style';
              tempStyle.textContent = convertedCss;
              document.head.appendChild(tempStyle);
              tempSafeStyles.push(tempStyle);
            }
          }
        } catch (linkError) {
          console.warn('Skipping linked stylesheet rewrite due to access or network:', linkNode.href, linkError);
        }
      }

      // 3. Process inline styles on all elements under pageElements
      pageElements.forEach(pageEl => {
        const allDescendants = pageEl.querySelectorAll('*');
        const elementsToCheck = [pageEl, ...Array.from(allDescendants)] as HTMLElement[];
        for (const el of elementsToCheck) {
          if (el.style) {
            const cssText = el.style.cssText || '';
            if (cssText.includes('oklch') || cssText.includes('oklab')) {
              originalInlineStyles.set(el, cssText);
              let updated = cssText;
              if (cssText.includes('oklch')) {
                updated = replaceOklchInCss(updated);
              }
              if (cssText.includes('oklab')) {
                updated = replaceOklabInCss(updated);
              }
              el.style.cssText = updated;
            }
          }
        }
      });

      // Initialize jsPDF: standard A4 is 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const totalPages = pageElements.length;

      for (let i = 0; i < totalPages; i++) {
        const element = pageElements[i] as HTMLElement;
        setProgressText(`Converting page layout ${i + 1} of ${totalPages}...`);
        
        // Render element to canvas
        // Important: DO NOT use allowTaint: true as it causes a SecurityError when toDataURL is called on canvas element.
        // Also avoid windowWidth and windowHeight which clip pages on narrow mobile screens/iframes.
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: '#ffffff',
          width: element.offsetWidth || 794,
          height: element.offsetHeight || 1123,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // A4 dimensions
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      setProgressText('Wrapping and downloading strategic asset...');
      const cleanClientName = (proposal.clientName || 'Client').trim().replace(/[^a-zA-Z0-9]/g, '-');
      const fileName = `Proposal-${cleanClientName}-${proposal.id.substring(0, 8)}.pdf`;
      pdf.save(fileName);
      setProgressText('Document download triggered!');

      // Automatically mark proposal as completed (final) if not already, and trigger 2-day follow-up reminder
      if (proposal.status !== ProposalStatus.COMPLETED && onUpdateProposal) {
        onUpdateProposal({
          ...proposal,
          status: ProposalStatus.COMPLETED,
          updatedAt: new Date().toISOString()
        });
      }

      triggerAutomatedFollowUp({
        ...proposal,
        status: ProposalStatus.COMPLETED
      });
    } catch (error) {
      console.error('PDF generation crash:', error);
      alert('We encountered an error generating the high-fidelity PDF directly. We recommend using the "Print / Print Dialog" option to save as PDF via your browser\'s native high-resolution system.');
    } finally {
      // Restore original computed style implementation immediately after canvas generation
      window.getComputedStyle = originalGetComputedStyle;

      // RESTORE ORIGINAL STYLES
      originalStyles.forEach((css, styleNode) => {
        styleNode.textContent = css;
      });
      originalInlineStyles.forEach((css, el) => {
        try {
          el.style.cssText = css;
        } catch (restoreError) {
          console.warn('Failed to restore inline element style:', el, restoreError);
        }
      });
      disabledLinks.forEach(linkNode => {
        linkNode.disabled = false;
      });
      tempSafeStyles.forEach(tempStyle => {
        if (tempStyle.parentNode) {
          tempStyle.parentNode.removeChild(tempStyle);
        }
      });

      // Revert the active tab back to what the user had selected
      if (originalTab !== 'document') {
        setActiveTab(originalTab);
      }
      setTimeout(() => {
        setIsGenerating(false);
        setProgressText('');
      }, 1500);
    }
  };

  // Pre-calculated page items
  const pagesList = [
    { id: "cover", title: "Cover Page" },
    { id: "toc", title: "Table of Contents" },
    { id: "objectives", title: "Project Objectives" },
    { id: "exec_summary", title: "Executive Summary" },
    { id: "approach_process", title: "Strategic Methodology" },
    { id: "scope", title: "Detailed Scope of Work" },
    { id: "timeline", title: "Milestone Deliverables" },
    { id: "financials", title: "Financial Breakdown" },
    { id: "acceptance", title: "Service Acceptance" },
    { id: "thank_you", title: "Official Closing" }
  ];

  return (
    <div id="document-viewer-wrapper" className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-6">
      {/* Top action header - hidden when printing */}
      <div className="no-print bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-700 h-10 w-10 rounded-lg flex items-center justify-center font-bold">
            {isBranding ? "BI" : "WD"}
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-800 text-base leading-tight">
              Proposal: {proposal.clientName || "Unnamed Client"}
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Type: {isBranding ? "Branding & Identity" : "Website Design & Development"} | Standard Value: <strong className="text-blue-600 font-semibold">{formatQAR(proposal.totalCost)}</strong>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {showBackBtn && onBack && (
            <button
               onClick={onBack}
               id="back-to-dashboard-btn"
               className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Back to Workspace
            </button>
          )}
          <button
            onClick={handlePrint}
            id="print-proposal-btn"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-250 shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print / Print Dialog
          </button>
          
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            id="download-pdf-btn"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF Direct
              </>
            )}
          </button>
        </div>
      </div>

      {isGenerating && (
        <div id="pdf-generation-progress-banner" className="no-print bg-slate-900 border border-slate-800 text-slate-100 px-5 py-4 rounded-xl flex items-center justify-between shadow-lg animate-none">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
            </span>
            <span className="text-xs font-sans font-bold tracking-tight text-slate-200 leading-none">{progressText}</span>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 hidden sm:inline">PDF compilation in progress</span>
        </div>
      )}

      {/* TABS SELECTION BAR - Hidden when printing */}
      <div className="no-print flex border-b border-slate-200 my-1 gap-2">
        <button
          onClick={() => setActiveTab('document')}
          className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'document'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Document Draft
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          <History className="h-4 w-4" />
          Revision History
          {proposal.history && proposal.history.length > 0 && (
            <span className="bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full text-[10px] shrink-0">
              {proposal.history.length}
            </span>
          )}
        </button>
      </div>

      <p className={`no-print text-center text-xs text-slate-500 font-sans font-medium bg-slate-100 py-2 rounded-lg border border-dashed border-slate-200 ${activeTab === 'document' ? 'block' : 'hidden'}`}>
        💡 <strong>Pro-Tip:</strong> Set the page margins to <strong>None/Minimum</strong> and check <strong>Background Graphics</strong> in your printer settings for accurate high-fidelity PDF output.
      </p>

      {/* Dynamic letterhead and styling customization card - Hidden when printing */}
      {activeTab === 'document' && (
        <div id="brand-customization-card" className="no-print bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-2 font-sans select-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Visual Brand & Letterhead Customization</h4>
                <p className="text-xs text-slate-500">Configure corporate headers, uploads, and watermarks dynamically</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-start md:self-auto">
              {/* Letterhead Mode Selectors */}
              <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateProposal) {
                      onUpdateProposal({
                        ...proposal,
                        letterheadMode: 'minimal',
                        updatedAt: new Date().toISOString()
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    (proposal.letterheadMode || 'minimal') === 'minimal'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Minimal Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateProposal) {
                      onUpdateProposal({
                        ...proposal,
                        letterheadMode: 'custom',
                        updatedAt: new Date().toISOString()
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    proposal.letterheadMode === 'custom'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Custom Letterhead
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateProposal) {
                      onUpdateProposal({
                        ...proposal,
                        letterheadMode: 'none',
                        updatedAt: new Date().toISOString()
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    proposal.letterheadMode === 'none'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  No Header
                </button>
              </div>
            </div>
          </div>

          {/* Configurations Fields conditional content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Column 1: upload custom letterhead file */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Manual Letterhead Upload</span>
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-slate-50/50 transition-colors relative h-36">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        if (onUpdateProposal && base64) {
                          onUpdateProposal({
                            ...proposal,
                            customLetterhead: base64,
                            letterheadMode: 'custom', // Auto-switch to custom letterhead mode on upload
                            updatedAt: new Date().toISOString()
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  title="Choose an image file"
                />
                {proposal.customLetterhead ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={proposal.customLetterhead} style={{ height: '56px' }} className="object-contain max-w-full rounded border border-slate-100 p-1 bg-white" alt="Current Upload" />
                    <div className="z-20 relative">
                      <span className="text-xs font-bold text-slate-700 block text-center">Custom Letterhead Uploaded</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onUpdateProposal) {
                            onUpdateProposal({
                              ...proposal,
                              customLetterhead: undefined,
                              letterheadMode: 'minimal',
                              updatedAt: new Date().toISOString()
                            });
                          }
                        }}
                        className="text-[10px] text-rose-500 font-bold hover:underline mt-1 block text-center w-full cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-slate-400 animate-none" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block text-blue-600">Drag & drop or Click to manual upload</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Accepts corporate logos or full top-banners (PNG, JPG, SVG)</span>
                    </div>
                  </div>
                )}
              </div>

              {proposal.letterheadMode === 'custom' && proposal.customLetterhead && (
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between bg-white border border-slate-200/60 p-3 rounded-xl">
                    <div>
                      <label htmlFor="full-page-config" className="text-xs font-bold text-slate-700 block cursor-pointer">Full A4 Page Cover Template</label>
                      <span className="text-[10px] text-slate-400 block">Treat upload as full A4 page background layer</span>
                    </div>
                    <input
                      type="checkbox"
                      id="full-page-config"
                      checked={!!proposal.letterheadFullPage}
                      onChange={(e) => {
                        if (onUpdateProposal) {
                          onUpdateProposal({
                            ...proposal,
                            letterheadFullPage: e.target.checked,
                            updatedAt: new Date().toISOString()
                          });
                        }
                      }}
                      className="h-4.5 w-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  {!proposal.letterheadFullPage && (
                    <div className="space-y-1.5 bg-white border border-slate-200/60 p-3 rounded-xl">
                      <div className="flex justify-between text-xs text-slate-600 font-semibold mb-1">
                        <span>Top Letterhead Height Adjustment:</span>
                        <span className="font-mono font-bold text-blue-600">{proposal.letterheadHeight || 80}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="180"
                        value={proposal.letterheadHeight || 80}
                        onChange={(e) => {
                          if (onUpdateProposal) {
                            onUpdateProposal({
                              ...proposal,
                              letterheadHeight: parseInt(e.target.value),
                              updatedAt: new Date().toISOString()
                            });
                          }
                        }}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <span className="text-[9.5px] text-slate-400 block leading-normal">
                        Dynamically adjust the top header height. The layout flow mathematically maps dynamic top spacers to guarantee pristine spacing without text overlaps.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Watermark options */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Subtle Background Watermark</span>
              
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="watermark-toggle" className="text-xs font-bold text-slate-700 block cursor-pointer">Enable Background Watermark</label>
                    <span className="text-[10px] text-slate-400 block">Renders faint clean text diagonally in background</span>
                  </div>
                  <input
                    type="checkbox"
                    id="watermark-toggle"
                    checked={!!proposal.showWatermark}
                    onChange={(e) => {
                      if (onUpdateProposal) {
                        onUpdateProposal({
                          ...proposal,
                          showWatermark: e.target.checked,
                          updatedAt: new Date().toISOString()
                        });
                      }
                    }}
                    className="h-4.5 w-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {proposal.showWatermark && (
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label htmlFor="watermark-text" className="text-[11px] font-bold text-slate-600 block">Custom Watermark Text:</label>
                    <input
                      type="text"
                      id="watermark-text"
                      value={proposal.customWatermarkText !== undefined ? proposal.customWatermarkText : (proposal.companyName || proposal.clientName || '')}
                      placeholder="e.g. CONFIDENTIAL"
                      onChange={(e) => {
                        if (onUpdateProposal) {
                          onUpdateProposal({
                            ...proposal,
                            customWatermarkText: e.target.value,
                            updatedAt: new Date().toISOString()
                          });
                        }
                      }}
                      className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50/30 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition-all font-sans"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-150 rounded-xl text-[10px] text-blue-800 leading-normal">
                💡 <strong>Brand Integrity Rule:</strong> The pre-set Astra contractor letterhead structures have been fully deactivated. Use <strong>Manual Upload</strong> to easily drag and drop your own team's authentic custom company letterhead image!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pages Canvas */}
      <div className={`print-only flex flex-col gap-10 bg-slate-200/40 p-4 rounded-2xl border border-slate-300 no-print:shadow-inner ${activeTab === 'document' ? 'block' : 'hidden print:block'}`}>
        
        {/* --- PAGE 1: COVER PAGE --- */}
        <div id="page-1-cover" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="01" />

          {/* Main Title Area */}
          <div className="my-auto py-12 relative z-10">
            <p className="text-[13px] font-sans font-bold text-slate-500 tracking-widest uppercase mb-4">
              COMMERCIAL PROPOSAL FOR
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
              {isBranding ? "Visual Branding & Identity" : "Custom Web Software Architecture"}
            </h1>
            <div className="w-24 h-1 bg-[#d3af00] mb-8 rounded-full"></div>
            
            <p className="font-serif text-2xl italic text-slate-800 mb-2 font-medium">
              Prepared for {proposal.clientName || "[Client Name]"}
            </p>
            <p className="text-sm font-sans text-slate-600 max-w-xl">
              {isBranding 
                ? "An elite strategy formulation targeting core design alignment, corporate value communication, and comprehensive asset standardization."
                : "A custom blueprint focusing on high-speed response frameworks, secure database patterns, CMS features, and streamlined user interfaces."
              }
            </p>
          </div>

          {/* Bottom details block */}
          <div className="border-t border-slate-200/80 pt-8 grid grid-cols-2 gap-4 relative z-10 mb-6">
            <div>
              <p className="text-[9px] font-sans font-bold text-slate-400 tracking-wider uppercase mb-1">
                PREPARED BY
              </p>
              <p className="text-xs font-sans font-bold text-slate-800">
                {proposal.preparedByName || "Ninan P Joseph"}
              </p>
              <p className="text-[11px] font-sans text-slate-500 font-semibold text-[#d3af00]">
                {proposal.preparedByCompany || "Astra Technologies"}
              </p>
              {proposal.preparedByTitle && (
                <p className="text-[10px] font-sans text-slate-400 italic">
                  {proposal.preparedByTitle}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[9px] font-sans font-bold text-slate-400 tracking-wider uppercase mb-1">
                DOCUMENT EXCLUSIVES
              </p>
              <p className="text-xs font-sans font-bold text-slate-800">
                {formatFriendlyDate(proposal.proposalDate)}
              </p>
              <p className="text-[11px] font-sans text-slate-500 uppercase font-semibold">
                Valid for 30 Days
              </p>
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="01" />
        </div>

        {/* --- PAGE 2: TABLE OF CONTENTS --- */}
        <div id="page-2-toc" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="02" />

          <div className="my-auto max-w-2xl mx-auto w-full relative z-10">
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-8 tracking-tight text-center">
              Proposal Directory
            </h2>
            <div className="flex flex-col gap-6 font-sans">
              {pagesList.map((p, idx) => (
                <div key={p.id} className="flex items-end justify-between text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-blue-500 font-bold bg-blue-50 h-6 w-6 rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-[14px]">
                      {p.title}
                    </span>
                  </div>
                  <div className="flex-grow border-b border-dashed border-slate-200 mx-4 h-1"></div>
                  <span className="font-mono text-xs text-slate-500">
                    Page 0{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="02" />
        </div>

        {/* --- PAGE 3: PROJECT OBJECTIVES --- */}
        <div id="page-3-objectives" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="03" />

          <div className="my-auto max-w-xl mx-auto w-full relative z-10">
            <span className="text-xs font-sans tracking-widest text-blue-600 font-bold uppercase mb-2 block">
              PHASE ZERO
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">
              {templates.objectives.title}
            </h2>
            <p className="font-serif italic text-slate-800 mb-8 border-b border-blue-100 pb-4 text-sm">
              {templates.objectives.subtitle}
            </p>

            <div className="flex flex-col gap-6">
              {templates.objectives.content.map((p, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans">
                    {p}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="03" />
        </div>

        {/* --- PAGE 4: EXECUTIVE SUMMARY --- */}
        <div id="page-4-summary" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="04" />

          <div className="my-auto max-w-xl mx-auto w-full relative z-10">
            <span className="text-xs font-sans tracking-widest text-blue-600 font-bold uppercase mb-2 block">
              THE OPPORTUNITY
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-6">
              Executive Proposal Summary
            </h2>
            
            <p className="text-sm text-slate-600 leading-relaxed font-sans mb-8">
              We appreciate the opportunity to collaborate with <strong>{proposal.clientName}</strong> on this commercial initiative. Guided by your operational boundaries and our high-performance technical frameworks, we have drafted a streamlined strategy designed to create tangible, lasting market differentiation.
            </p>

            <div className="bg-slate-50 border-l-4 border-blue-600 p-6 rounded-r-xl shadow-xs">
              <p className="text-[10px] font-mono font-bold text-blue-600 tracking-wider uppercase mb-2">
                PROJECT CLARIFICATIONS
              </p>
              <h4 className="font-serif font-bold text-slate-900 text-sm mb-3">
                Key Business Intent & Desired Outcome
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium italic">
                "{proposal.briefDescription || "A bespoke production targeting the launch and alignment of core structural solutions matching operational timelines."}"
              </p>
            </div>

            <p className="text-xs text-slate-400 mt-8 leading-relaxed font-sans border-t border-slate-100 pt-4">
              *The above descriptions serve as the strict operational limits for product sprints. Any additional capabilities discussed outside this parameter will follow standard change control protocols.
            </p>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="04" />
        </div>

        {/* --- PAGE 5: STRATEGIC METHODOLOGY --- */}
        <div id="page-5-methodology" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="05" />

          <div className="my-auto max-w-xl mx-auto w-full relative z-10">
            <span className="text-xs font-sans tracking-widest text-blue-600 font-bold uppercase mb-2 block">
              HOW WE DELIVER
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">
              Our Process & Approach
            </h2>
            <p className="font-serif italic text-slate-800 mb-8 border-b border-blue-105 pb-4 text-sm">
              {templates.approach.subtitle}
            </p>

            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-sans font-bold text-slate-800 uppercase mb-2">
                  Our core approach values:
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 pl-4 list-disc font-sans leading-relaxed">
                  {templates.approach.content.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h3 className="font-serif font-bold text-slate-800 text-lg mb-4">
              Structural Phase Mapping:
            </h3>
            <div className="space-y-4">
              {templates.process.content.map((ph, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="h-6 w-12 bg-blue-50 border border-blue-100 text-blue-600 font-mono text-[10px] font-bold rounded-md flex items-center justify-center shrink-0">
                    PH {index + 1}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    <strong>{ph.split(' — ')[0]}:</strong> {ph.split(' — ')[1] || ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="05" />
        </div>

        {/* --- PAGE 6: DETAILED SCOPE OF WORK --- */}
        <div id="page-6-scope" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="06" />

          <div className="my-auto w-full relative z-10">
            <div className="max-w-2xl mx-auto">
              <span className="text-xs font-sans tracking-widest text-[#d3af00] font-bold uppercase mb-2 block text-center">
                DELIVERABLE DETAILS
              </span>
              <h2 className="font-serif text-3xl font-bold text-slate-900 mb-6 tracking-tight text-center">
                Scope of Work Definition
              </h2>

              {isBranding ? (
                /* BRANDING SCOPE */
                <div className="space-y-6">
                  <p className="text-xs text-slate-500 font-sans text-center max-w-md mx-auto mb-4">
                    The requested assets below comprise the complete target design delivery sheet. Undisplayed components represent out-of-scope elements.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(proposal.brandingScope)
                      .filter(([key]) => key !== 'additionalDeliverables')
                      .map(([key, isSelected]) => {
                        const wordFormatted = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div 
                            key={key} 
                            className={`p-3 border rounded-xl flex items-center gap-3 transition-all ${
                              isSelected 
                                ? 'bg-[#d3af00]/10 border-[#d3af00]/30 text-slate-800' 
                                : 'bg-slate-50/40 border-slate-150 text-slate-400 line-through'
                            }`}
                          >
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                            }`}>
                              <Check className="h-3 w-3" />
                            </div>
                            <span className="font-sans font-semibold text-[13px]">
                              {wordFormatted}
                            </span>
                          </div>
                        );
                      })
                    }
                  </div>
                  {proposal.brandingScope.additionalDeliverables && (
                    <div className="mt-4 p-4 bg-slate-50/60 border border-slate-200 rounded-xl">
                      <h4 className="text-xs font-sans font-bold text-slate-800 uppercase mb-2">
                        Client Exclusives & Custom Deliverables:
                      </h4>
                      <p className="text-xs text-slate-600 font-mono italic pr-4">
                        {proposal.brandingScope.additionalDeliverables}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* WEBSITE SCOPE + SITEMAP + DETAILED DELIVERABLES */
                <div className="space-y-4">
                  {/* Parameter badges */}
                  <div className="bg-blue-50/40 p-3 border border-blue-100 rounded-xl grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-450 block mb-0.5">Page Capacity</span>
                      <strong className="text-sm text-blue-800 font-bold font-sans">{proposal.websiteScope.totalPages} Templates</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-450 block mb-0.5">Language Profile</span>
                      <strong className="text-sm text-blue-800 font-bold font-sans truncate block">{proposal.websiteScope.languages || "English"}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-450 block mb-0.5">CMS Architecture</span>
                      <strong className="text-sm text-blue-800 font-bold font-sans truncate block uppercase">{proposal.websiteScope.cmsType}</strong>
                    </div>
                  </div>

                  {/* Selected Deliverables List */}
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] uppercase font-bold font-sans tracking-widest text-[#d3af00] block mb-1.5">
                      Included Scope Sprints
                    </span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {((proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.filter(item => item.isSelected).length > 0)
                        ? proposal.websiteScope.scopeItems.filter(item => item.isSelected)
                        : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].slice(0, 6)
                      ).map((item, idx) => (
                        <div key={(item as any).id || idx} className="flex gap-2 items-start border-b border-slate-100 pb-1.5">
                          <Check className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block leading-tight">{item.title}</span>
                            <span className="text-[9.5px] text-slate-500 font-sans block leading-normal mt-0.5">{item.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section-Level Notes & Boundaries Grid */}
                  {proposal.websiteScope.scopeNotes && (
                    <div className="grid grid-cols-2 gap-3.5 border-t border-slate-150 pt-3">
                      {/* Project Notes & Client Requirements side by side */}
                      {(proposal.websiteScope.scopeNotes.notes || proposal.websiteScope.scopeNotes.requirements) && (
                        <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg">
                          <span className="text-[9px] uppercase font-bold font-sans tracking-wider text-slate-500 block mb-1">
                            Specific Deliverables & Requirements
                          </span>
                          {proposal.websiteScope.scopeNotes.notes && (
                            <p className="text-[10px] text-slate-700 italic font-sans mb-1 leading-normal">
                              <strong>Notes:</strong> {proposal.websiteScope.scopeNotes.notes}
                            </p>
                          )}
                          {proposal.websiteScope.scopeNotes.requirements && (
                            <p className="text-[10px] text-slate-700 font-sans leading-normal">
                              <strong>Client Directs:</strong> {proposal.websiteScope.scopeNotes.requirements}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Exclusions & Technical Clarifications side by side */}
                      {(proposal.websiteScope.scopeNotes.exclusions || proposal.websiteScope.scopeNotes.clarifications) && (
                        <div className="bg-red-50/30 border border-red-100 p-2.5 rounded-lg">
                          <span className="text-[9px] uppercase font-bold text-red-700 tracking-wider block mb-1">
                            Technical Constraints & Boundaries
                          </span>
                          {proposal.websiteScope.scopeNotes.exclusions && (
                            <p className="text-[10px] text-slate-750 font-sans mb-1 leading-normal">
                              <strong className="text-red-700">Exclusions:</strong> {proposal.websiteScope.scopeNotes.exclusions}
                            </p>
                          )}
                          {proposal.websiteScope.scopeNotes.clarifications && (
                            <p className="text-[10px] text-slate-755 font-sans leading-normal">
                              <strong>Clarifications:</strong> {proposal.websiteScope.scopeNotes.clarifications}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Built sitemap visual */}
                  <div className="mt-1 border-t border-slate-100 pt-3.5 origin-top">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block mb-1">
                      Visual Map Reference:
                    </span>
                    <SitemapGenerator scope={proposal.websiteScope} projectName={proposal.clientName} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="06" />
        </div>

        {/* --- PAGE 7: TIMELINE & MILESTONES --- */}
        <div id="page-7-timeline" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="07" />

          <div className="my-auto w-full max-w-xl mx-auto relative z-10">
            <span className="text-xs font-sans tracking-widest text-[#d3af00] font-bold uppercase mb-2 block">
              THE MILESTONE HIGHWAYS
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">
              Timeline & Delivery Sprints
            </h2>
            <p className="font-serif italic text-slate-800 mb-6 border-b border-blue-100 pb-3 text-xs">
              Project spans a planned duration of exactly <span className="font-bold underline text-blue-600">{proposal.weeks} Weeks</span>.
            </p>

            <div className="relative border-l border-blue-100 pl-6 ml-3 space-y-6">
              {proposal.milestones && proposal.milestones.length > 0 ? (
                proposal.milestones.map((milestone, idx) => (
                  <div key={milestone.id} className="relative">
                    {/* Ring indicator */}
                    <div className="absolute -left-[30px] top-1 bg-white h-4 w-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-sm w-fit mb-1">
                        {milestone.week}
                      </span>
                      <h4 className="font-sans font-bold text-slate-800 text-sm">
                        {milestone.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-normal mt-1.5">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-sans text-slate-400">No milestones calculated.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="07" />
        </div>

        {/* --- PAGE 8: FINANCIAL BLUEPRINT --- */}
        <div id="page-8-financials" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="08" />

          <div className="my-auto w-full max-w-xl mx-auto relative z-10">
            <span className="text-xs font-sans tracking-widest text-blue-600 font-bold uppercase mb-2 block">
              INVESTMENT ALLOCATION
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-6 tracking-tight">
              Proposal Financials
            </h2>

            {isBranding ? (
              /* Branding Table */
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-white">
                <table className="min-w-full text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="py-2.5 px-4 text-left font-semibold">Specialized Resource Role</th>
                      <th className="py-2.5 px-4 text-center font-semibold">Allocated Hours</th>
                      <th className="py-2.5 px-4 text-center font-semibold">Hourly Rate</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Row Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-600">
                    {proposal.resourceCosts.map((rc) => (
                      <tr key={rc.id} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-4 text-left font-medium text-slate-800">{rc.role}</td>
                        <td className="py-2.5 px-4 text-center">{rc.hours} hrs</td>
                        <td className="py-2.5 px-4 text-center">{formatQAR(rc.rate)}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900">{formatQAR(rc.hours * rc.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Website Table */
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-white">
                <div className="divide-y divide-slate-150 text-xs font-sans text-slate-600">
                  <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 py-2.5 px-4 font-semibold text-slate-700">
                    <span>Sprinting Resource Category</span>
                    <span className="text-right">Project Charge</span>
                  </div>
                  <div className="grid grid-cols-2 py-2.5 px-4">
                    <span className="font-medium text-slate-800">Architecture, UX/UI Design & Front-end Blocks</span>
                    <span className="text-right font-bold text-slate-900">{formatQAR(proposal.developmentCost)}</span>
                  </div>
                  <div className="grid grid-cols-2 py-2.5 px-4">
                    <span className="font-medium text-slate-800">Plugin Licences, Core Security & API Setup</span>
                    <span className="text-right font-bold text-slate-900">{formatQAR(proposal.pluginCost)}</span>
                  </div>
                  <div className="grid grid-cols-2 py-2.5 px-4">
                    <span className="font-medium text-slate-800">Support, Server Tuning & Maintenance Sprints ({proposal.websiteScope.maintenancePeriod} Months)</span>
                    <span className="text-right font-bold text-slate-900">{formatQAR(proposal.maintenanceCost)}</span>
                  </div>
                  <div className="grid grid-cols-2 py-2.5 px-4">
                    <span className="font-medium text-slate-800">SEO index, Google Console & Multi-language translation setup</span>
                    <span className="text-right font-bold text-slate-900">{formatQAR(proposal.additionalCost)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Total Block */}
            <div className="p-4 bg-blue-50 border border-blue-150 rounded-xl flex items-center justify-between mb-6">
              <span className="font-sans font-bold text-slate-800 uppercase text-xs tracking-wider">
                TOTAL CONTRACT VALUE:
              </span>
              <strong className="font-serif text-2xl font-bold text-blue-700">
                {formatQAR(proposal.totalCost)} QAR
              </strong>
            </div>

            {/* Terms text */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-sans text-slate-500 leading-relaxed">
              <h4 className="font-bold uppercase text-slate-700 tracking-wide mb-1">
                Payment Terms & Invoicing
              </h4>
              <p className="pr-2">{proposal.paymentTerms}</p>
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="08" />
        </div>

        {/* --- PAGE 9: ACCEPTANCE PAGE --- */}
        <div id="page-9-acceptance" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="09" />

          <div className="my-auto w-full max-w-xl mx-auto font-sans relative z-10">
            <span className="text-xs tracking-widest font-sans font-bold text-blue-600 uppercase mb-2 block">
              OFFICIAL RATIFICATION
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-950 mb-6">
              Acceptance & Authorization
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-10">
              By appending signatures below, both the Client and Agency agree to the parameters, terms, and billing specifications set forth within this document. No physical works or resource tracking will resume until both credentials have been approved and validated.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-6">
              {/* Agency approval */}
              <div className="flex flex-col justify-between h-[180px] border border-slate-200/80 p-4 rounded-xl relative bg-white">
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-blue-500 font-bold uppercase mb-0.5 block">Approved For</span>
                  <strong className="text-xs text-slate-800 block">{proposal.preparedByCompany || "Astra Technologies"}</strong>
                </div>
                
                {/* Drawn graphic signature */}
                <div className="h-10 border-b border-slate-200 relative flex items-center justify-center font-serif italic text-xs text-slate-800 select-none">
                  {proposal.preparedByName || "Ninan P Joseph"}
                  <div className="absolute top-1 right-2 uppercase font-mono text-[8px] tracking-wider text-slate-300 opacity-30">verified digital signature</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 uppercase font-mono">
                  <span>Sign: {proposal.preparedByName || "Ninan P Joseph"}</span>
                  <span className="text-right">Date: {proposal.proposalDate}</span>
                </div>
              </div>

              {/* Client approval */}
              <div className="flex flex-col justify-between h-[180px] border border-slate-200/80 p-4 rounded-xl bg-white">
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-emerald-500 font-bold uppercase mb-0.5 block">Accepted For</span>
                  <strong className="text-xs text-slate-800 block">{proposal.clientName || "[Client Company]"}</strong>
                </div>

                <div className="h-10 border-b border-slate-200/80 border-dashed relative flex items-center justify-center font-mono text-[9px] text-slate-400 select-none">
                  (Authorized Signature Stamp)
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 uppercase font-mono">
                  <span>Sign: ________________</span>
                  <span className="text-right">Date: ___ / ___ / 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="09" />
        </div>

        {/* --- PAGE 10: THANK YOU PAGE --- */}
        <div id="page-10-thanks" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber="10" />

          <div className="my-auto py-12 text-center max-w-lg mx-auto relative z-10">
            <h2 className="font-serif italic text-4xl text-[#d3af00] mb-4 block font-extrabold">
              Thank You.
            </h2>
            <p className="font-serif text-xl tracking-tight text-slate-800 mb-6 font-medium">
              We look forward to creating stellar digital value with your team.
            </p>
            <div className="w-12 h-0.5 bg-slate-200 mx-auto mb-8 rounded-full"></div>
            <p className="text-xs text-slate-550 leading-relaxed max-w-sm mx-auto font-sans">
              For immediate support escalations or procedural assistance, contact us at <span className="text-[#d3af00] font-semibold underline">info@technoastra.com</span> or dial our hotline number <span className="font-semibold text-slate-700">4440 0100</span>.
            </p>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="10" />
        </div>

      </div>

      {activeTab === 'history' && (
        <div id="proposal-edit-history-tab" className="no-print bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-700 p-2 rounded-xl shrink-0">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">
                Revision History & Checkpoints
              </h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Revert or compare previous versions of this proposal. Each update made inside the builder is backed up with a complete snapshot of all values.
              </p>
            </div>
          </div>

          {!proposal.history || proposal.history.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3 bg-slate-50/50">
              <Clock className="h-8 w-8 text-slate-400 mx-auto animate-none" />
              <div className="max-w-xs mx-auto">
                <p className="text-xs font-bold text-slate-700 font-sans">Pristine Initial Version</p>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed mt-1">
                  You are viewing the primary version draft of this proposal. Once you update key metrics inside the Builder, checkpoint snapshots will populate here.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative border-l border-blue-100 pl-6 ml-3 space-y-8 py-2">
              {proposal.history.map((entry, index) => {
                const dateText = new Date(entry.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                
                return (
                  <div key={entry.versionId} className="relative group">
                    {/* Node indicator */}
                    <div className="absolute -left-[31px] top-1 bg-white h-4 w-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-200 hover:bg-slate-50/50 transition-all">
                      <div className="space-y-1 w-full font-sans">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200 uppercase shrink-0">
                            VER {entry.versionId}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {dateText}
                          </span>
                          {index === 0 && (
                            <span className="text-[9px] font-sans font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                              Newest Checkpoint
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs font-sans text-slate-700 font-medium leading-relaxed mt-1">
                          {entry.summary || "General proposal corrections."}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-500 bg-white border border-slate-150 px-3 py-1.5 rounded-lg mt-2 font-sans w-fit">
                          <div>
                            <span className="text-slate-400">Client:</span> <strong className="font-semibold text-slate-750 text-slate-700">{entry.proposalState.clientName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Scope Type:</span> <strong className="font-semibold text-slate-750 text-slate-700 uppercase">{entry.proposalState.type}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Value:</span> <strong className="font-semibold text-slate-750 text-slate-700 font-sans">{formatQAR(entry.proposalState.totalCost)} QAR</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Timeline:</span> <strong className="font-semibold text-slate-755 text-slate-700">{entry.proposalState.weeks} weeks</strong>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pt-2 md:pt-0 w-full md:w-auto">
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to revert the current proposal back to the state saved on ${dateText}?`)) {
                              if (onRevert) {
                                onRevert(entry);
                              }
                            }
                          }}
                          className="px-3.5 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all w-full md:w-auto cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <RotateCcw className="h-3.5 w-3.5 animate-none" />
                          Revert to Active State
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
