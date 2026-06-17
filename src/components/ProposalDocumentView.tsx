/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BRANDING_TEMPLATES, WEBSITE_TEMPLATES, DEFAULT_SCOPE_TEMPLATES } from '../staticTemplates';
import { formatQAR, DEFAULT_BRANDING_MILESTONES, DEFAULT_WEBSITE_MILESTONES, triggerAutomatedFollowUp } from '../proposalUtils';
import SitemapGenerator from './SitemapGenerator';
import { groupScopeIntoPages } from '../utils/scopeClassifier';
import { Check, Bookmark, DollarSign, Calendar, Landmark, BookOpen, Signature, Award, ChevronRight, FileText, Printer, Download, History, RotateCcw, Clock, Sliders, Upload, Trash2, Plus, AlertCircle, Coins, CreditCard, Shield, Users } from 'lucide-react';
import { Proposal, ProposalHistoryEntry, ProposalStatus, PaymentEntry, UserRole } from '../types';

interface ProposalDocumentViewProps {
  proposal: Proposal;
  onBack?: () => void;
  showBackBtn?: boolean;
  onRevert?: (targetHistory: ProposalHistoryEntry) => void;
  onUpdateProposal?: (updated: Proposal) => void;
  currentUser?: any;
  initialTab?: 'document' | 'history' | 'payment';
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

export default function ProposalDocumentView({ proposal, onBack, showBackBtn = true, onRevert, onUpdateProposal, currentUser, initialTab = 'document' }: ProposalDocumentViewProps) {
  const isBranding = proposal.type === 'branding';
  const templates = isBranding ? BRANDING_TEMPLATES : WEBSITE_TEMPLATES;
  
  const [allUsers, setAllUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllUsers(data);
          }
        })
        .catch(err => console.warn("Failed to fetch users list for administration tasks:", err.message));
    }
  }, [currentUser]);

  const handleAdminApprove = () => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER)) return;
    
    const isManager = currentUser.role === UserRole.MANAGER;
    const historyEntry: ProposalHistoryEntry = {
      versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      timestamp: new Date().toISOString(),
      summary: `Proposal approved, sealed, and finalized in administrative session by ${isManager ? 'Manager' : 'Admin'}: ${currentUser.name}`,
      proposalState: JSON.parse(JSON.stringify(proposal))
    };
    
    const updatedProposal: Proposal = {
      ...proposal,
      status: ProposalStatus.COMPLETED,
      updatedAt: new Date().toISOString(),
      history: [historyEntry, ...(proposal.history || [])]
    };
    
    if (onUpdateProposal) {
      onUpdateProposal(updatedProposal);
      alert(`Proposal status successfully updated to "Completed" and sealed as an administrative revision.`);
    }
  };

  const handleAdminStatusChange = (newStatus: ProposalStatus) => {
    if (!currentUser) return;
    if (proposal.status === newStatus) return;

    const isPowerUser = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
    const authorType = isPowerUser ? 'Administrative Update' : 'Account Lead ';

    const historyEntry: ProposalHistoryEntry = {
      versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      timestamp: new Date().toISOString(),
      summary: `${authorType}: Status: ${proposal.status || 'Draft'} → ${newStatus} (Modified by ${currentUser.role}: ${currentUser.name})`,
      proposalState: JSON.parse(JSON.stringify(proposal))
    };

    const updatedProposal: Proposal = {
      ...proposal,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      history: [historyEntry, ...(proposal.history || [])]
    };

    if (onUpdateProposal) {
      onUpdateProposal(updatedProposal);
    }
  };

  const handleAdminAssigneeChange = (assigneeId: string) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER)) return;
    if (proposal.assignedUserId === assigneeId) return;

    const targetUser = allUsers.find(u => u.id === assigneeId);
    const assigneeName = targetUser ? targetUser.name : undefined;

    const historyEntry: ProposalHistoryEntry = {
      versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      timestamp: new Date().toISOString(),
      summary: `Administrative Update: Assignment changed to ${assigneeName || 'Unassigned'} (Modified by Admin/Manager: ${currentUser.name})`,
      proposalState: JSON.parse(JSON.stringify(proposal))
    };

    const updatedProposal: Proposal = {
      ...proposal,
      assignedUserId: assigneeId || undefined,
      assignedUserName: assigneeName,
      updatedAt: new Date().toISOString(),
      history: [historyEntry, ...(proposal.history || [])]
    };

    if (onUpdateProposal) {
      onUpdateProposal(updatedProposal);
    }
  };

  const handleAdminToggleShare = (sharedUserId: string) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER)) return;
    const currentShared = proposal.sharedUserIds || [];
    let updatedShared: string[];
    
    if (currentShared.includes(sharedUserId)) {
      updatedShared = currentShared.filter(id => id !== sharedUserId);
    } else {
      updatedShared = [...currentShared, sharedUserId];
    }

    const userNameStr = allUsers.find(u => u.id === sharedUserId)?.name || sharedUserId;

    const historyEntry: ProposalHistoryEntry = {
      versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      timestamp: new Date().toISOString(),
      summary: `Administrative Update: Sharing settings updated for user ${userNameStr} (Modified by Admin/Manager: ${currentUser.name})`,
      proposalState: JSON.parse(JSON.stringify(proposal))
    };

    const updatedProposal: Proposal = {
      ...proposal,
      sharedUserIds: updatedShared,
      updatedAt: new Date().toISOString(),
      history: [historyEntry, ...(proposal.history || [])]
    };

    if (onUpdateProposal) {
      onUpdateProposal(updatedProposal);
    }
  };

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
  const [activeTab, setActiveTab] = React.useState<'document' | 'history' | 'payment'>('document');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  // Pre-calculated page items dynamically computed based on scope configuration
  const getPagesDefinition = () => {
    const list: { id: string; title: string; pageNumStr: string }[] = [
      { id: "cover", title: "Cover Page", pageNumStr: "01" },
      { id: "toc", title: "Table of Contents", pageNumStr: "02" },
      { id: "objectives", title: "Project Objectives", pageNumStr: "03" },
      { id: "exec_summary", title: "Executive Summary", pageNumStr: "04" },
      { id: "approach_process", title: "Strategic Methodology", pageNumStr: "05" },
    ];

    let currentNum = 6;

    if (isBranding) {
      list.push({ id: "scope_branding", title: "Detailed Scope of Work", pageNumStr: String(currentNum).padStart(2, '0') });
      currentNum++;
    } else {
      // Website has Scope Setup page
      list.push({ id: "scope_setup", title: "Deliverable Parameters & Stack", pageNumStr: String(currentNum).padStart(2, '0') });
      currentNum++;

      // Website has Sprints pages combined logically on the same pages
      const activeItems = (proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.filter(item => item.isSelected).length > 0)
        ? proposal.websiteScope.scopeItems.filter(item => item.isSelected)
        : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].map(item => ({ ...item, id: Math.random().toString() }));
      const scopePages = groupScopeIntoPages(activeItems, 3);
      
      const group1 = scopePages.slice(0, 2);
      if (group1.length > 0) {
        const titles = group1.map(g => {
          let label = g.categoryTitle;
          if (g.subPageLabel) {
            label += ` (${g.subPageLabel.toUpperCase()})`;
          }
          return label.replace(" & Functionality", "").replace(" Structure", "");
        }).join(" & ");
        list.push({ id: "scope_combined_1", title: `Scope Sprints: ${titles}`, pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }

      const group2 = scopePages.slice(2, 5);
      if (group2.length > 0) {
        const titles = group2.map(g => {
          let label = g.categoryTitle;
          if (g.subPageLabel) {
            label += ` (${g.subPageLabel.toUpperCase()})`;
          }
          return label.replace(" & Functionality", "").replace(" Structure", "").replace(" & APIs", "");
        }).join(", ");
        list.push({ id: "scope_combined_2", title: `Scope Sprints: ${titles}`, pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }

      const group3 = scopePages.slice(5);
      if (group3.length > 0) {
        const titles = group3.map(g => {
          let label = g.categoryTitle;
          if (g.subPageLabel) {
            label += ` (${g.subPageLabel.toUpperCase()})`;
          }
          return label.replace(" & Functionality", "").replace(" Structure", "").replace(" & Operational Delivery", "");
        }).join(" & ");
        list.push({ id: "scope_combined_3", title: `Scope Sprints: ${titles}`, pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }

      // Website has Sitemap Page
      list.push({ id: "scope_sitemap", title: "Interactive Sitemap Blueprint", pageNumStr: String(currentNum).padStart(2, '0') });
      currentNum++;
    }

    list.push({ id: "timeline", title: "Timeline & Delivery Sprints", pageNumStr: String(currentNum).padStart(2, '0') });
    currentNum++;

    list.push({ id: "financials", title: "Proposal Financials", pageNumStr: String(currentNum).padStart(2, '0') });
    currentNum++;

    list.push({ id: "acceptance", title: "Acceptance & Authorization", pageNumStr: String(currentNum).padStart(2, '0') });
    currentNum++;

    list.push({ id: "thank_you", title: "Official Closing", pageNumStr: String(currentNum).padStart(2, '0') });

    return list;
  };

  const pagesList = getPagesDefinition();

  const getPageNumberById = (id: string) => {
    const item = pagesList.find(p => p.id === id);
    return item ? item.pageNumStr : "00";
  };

  const parseDescription = (desc: string) => {
    if (!desc) return { main: '', subItems: [] };
    // If there are bullet characters
    if (desc.includes('•')) {
      const parts = desc.split('•').map(p => p.trim()).filter(Boolean);
      return { main: parts[0], subItems: parts.slice(1) };
    }
    // If there are newlines
    if (desc.includes('\n')) {
      const parts = desc.split('\n').map(p => p.trim()).filter(Boolean);
      return { main: parts[0], subItems: parts.slice(1) };
    }
    // Triggers that introduce lists
    const triggers = ["featuring ", "including ", "supporting ", "covering "];
    for (const trigger of triggers) {
      if (desc.includes(trigger)) {
        const splitParts = desc.split(trigger);
        const main = splitParts[0] + trigger.trim() + ":";
        const subItems = splitParts[1].split(/,|and/).map(s => s.trim().replace(/^\w/, c => c.toUpperCase())).filter(s => s.length > 2);
        return { main, subItems };
      }
    }
    return { main: desc, subItems: [] };
  };

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
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'payment'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
          }`}
        >
          <Landmark className="h-4 w-4" />
          Payment Tracker
          {proposal.paymentEntries && proposal.paymentEntries.length > 0 && (
            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full text-[10px] shrink-0">
              {proposal.paymentEntries.length}
            </span>
          )}
        </button>
      </div>

      <p className={`no-print text-center text-xs text-slate-500 font-sans font-medium bg-slate-100 py-2 rounded-lg border border-dashed border-slate-200 ${activeTab === 'document' ? 'block' : 'hidden'}`}>
        💡 <strong>Pro-Tip:</strong> Set the page margins to <strong>None/Minimum</strong> and check <strong>Background Graphics</strong> in your printer settings for accurate high-fidelity PDF output.
      </p>

      {/* ADMINISTRATOR CONTROL PANEL - Persistent Audit revisions generator */}
      {activeTab === 'document' && currentUser?.role === UserRole.ADMIN && (
        <div id="admin-action-center-panel" className="no-print bg-amber-50/45 border border-amber-200 rounded-2xl p-5 mb-4 font-sans shadow-xs select-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/60 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-800">Administrative Workspace Operations</h4>
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                    Admin Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">View, edit, assign, grant shares, and finalize any team proposal with automatic revision logging</p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {proposal.status !== ProposalStatus.COMPLETED && (
                <button
                  type="button"
                  onClick={handleAdminApprove}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Approve & Finalize
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Manager */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">
                Proposal Status Tag
              </label>
              <select
                value={proposal.status || ProposalStatus.DRAFT}
                onChange={(e) => handleAdminStatusChange(e.target.value as ProposalStatus)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-400"
              >
                {Object.values(ProposalStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Assignee Direct Override */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">
                Assigned Team Lead
              </label>
              <select
                value={proposal.assignedUserId || ''}
                onChange={(e) => handleAdminAssigneeChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-400"
              >
                <option value="">Unassigned / No Active Lead</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Share Access Rights */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">
                Cooperation Sharing Board
              </label>
              {allUsers.length === 0 ? (
                <span className="text-slate-400 text-xs font-sans italic">Loading teammates list...</span>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                  {allUsers
                    .filter((u) => u.id !== proposal.preparedByUserId) // exclude prep agent for sharing list
                    .map((u) => {
                      const isShared = (proposal.sharedUserIds || []).includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleAdminToggleShare(u.id)}
                          className={`px-2 py-1 rounded-sm text-[10px] font-bold flex items-center gap-1 transition-all ${
                            isShared
                              ? 'bg-amber-100 border border-amber-300 text-amber-800'
                              : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        >
                          <Users className="h-3 w-3 shrink-0" />
                          <span>{u.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    Page {p.pageNumStr}
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
            <span className="text-xs font-sans tracking-widest text-[#B8962E] font-bold uppercase mb-2 block">
              PHASE ZERO
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">
              Project Objectives
            </h2>
            <p className="font-serif italic text-slate-800 mb-6 border-b border-light-100 pb-4 text-sm">
              Aligning our engineering standards with your long-term business roadmap.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  icon: "🎯",
                  text: "To architect a fast, accessible, responsive web platform that merges your business priorities with exceptional user journeys."
                },
                {
                  icon: "📐",
                  text: "To design intuitive information architecture to optimise user conversion rates, newsletter signups, and service discovery."
                },
                {
                  icon: "📈",
                  text: "To establish a technically sound, SEO-primed base structure that can scale with your organisation's future growth and product lanes."
                }
              ].map((obj, idx) => (
                <div 
                  key={idx}
                  style={{
                    backgroundColor: '#fafaf8',
                    borderLeft: '3px solid #B8962E',
                    borderRadius: '0 8px 8px 0',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: '1', marginTop: '2px' }}>{obj.icon}</span>
                  <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                    <strong style={{ color: '#1a2744' }}>Objective:</strong> {obj.text}
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
            <span className="text-xs font-sans tracking-widest text-[#B8962E] font-bold uppercase mb-2 block">
              THE OPPORTUNITY
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-6">
              Executive Proposal Summary
            </h2>
            
            <p className="text-xs text-slate-600 leading-relaxed font-sans mb-6">
              We appreciate the opportunity to collaborate with <strong>{proposal.clientName}</strong> on this commercial initiative. Guided by your operational boundaries and our high-performance technical frameworks, we have drafted a streamlined strategy designed to create tangible, lasting market differentiation.
            </p>

            {/* Navy Callout Block */}
            <div style={{ backgroundColor: '#1a2744', borderRadius: '10px', padding: '24px 32px', textAlign: 'center', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', color: '#B8962E', fontWeight: 'bold', marginBottom: '8px' }}>
                KEY BUSINESS INTENT & DESIRED OUTCOME
              </span>
              <p style={{ color: '#ffffff', fontSize: '16px', fontStyle: 'italic', margin: '0', lineHeight: '1.5', fontFamily: 'serif' }}>
                "{proposal.briefDescription || "An interactive, double-language responsive corporate portal built with high speed CMS and custom plugins."}"
              </p>
            </div>

            {/* Why This Matters Flow */}
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                WHY THIS MATTERS
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  {
                    icon: "⚡",
                    title: "Performance",
                    desc: "High-speed rendering for superior user retention & conversion."
                  },
                  {
                    icon: "🧱",
                    title: "Scalability",
                    desc: "Robust architecture ready to grow with your roadmap."
                  },
                  {
                    icon: "🌐",
                    title: "Market Reach",
                    desc: "Seamless dual-language indexing for global audience."
                  }
                ].map((col, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#fafaf8',
                      border: '1px solid #e0ddd5',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{col.icon}</div>
                    <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a2744', marginBottom: '2px' }}>{col.title}</h4>
                    <p style={{ fontSize: '9.5px', color: '#4b5563', lineHeight: '1.35', margin: '0' }}>{col.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-6 leading-relaxed font-sans border-t border-slate-100 pt-3">
              *The above objectives serve as the strict operational boundaries for product sprint delivery tracks.
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

        {isBranding ? (
          /* BRANDING SCOPE SHEET - SINGLE COVER-TO-COVER A4 SHEET */
          <div id={`page-${getPageNumberById("scope_branding")}-scope-branding`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
            {/* Background Watermark */}
            <ProposalWatermark proposal={proposal} />
            <ProposalCustomLetterheadBackground proposal={proposal} />

            {/* Top Letterhead Header */}
            <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("scope_branding")} />

            <div className="my-auto w-full relative z-10">
              <div className="max-w-2xl mx-auto">
                <span className="text-xs font-sans tracking-widest text-[#d3af00] font-bold uppercase mb-2 block text-center">
                  DELIVERABLE DETAILS
                </span>
                <h2 className="font-serif text-3xl font-bold text-slate-900 mb-6 tracking-tight text-center">
                  Scope of Work Definition
                </h2>
                
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
                            style={{ height: "48px" }}
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
                            <span className="font-sans font-semibold text-[12.5px] truncate">
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
              </div>
            </div>

            {/* Footer */}
            <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("scope_branding")} />
          </div>
        ) : (
          /* WEBSITE SCOPE - MULTI-PAGE FLOW WITH AUTOMATED PAGINATION */
          <>
            {/* 1. Scope Setup & Parameters & Tech Stack Page */}
            <div id={`page-${getPageNumberById("scope_setup")}-scope-setup`} className="proposal-page relative flex flex-col justify-between overflow-hidden" style={{ boxSizing: 'border-box' }}>
              <ProposalWatermark proposal={proposal} />
              <ProposalCustomLetterheadBackground proposal={proposal} />
              <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("scope_setup")} />

              <div className="my-auto w-full relative z-10">
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Page header */}
                  <div className="text-center">
                    <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                      DELIVERABLE DETAILS
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px', fontFamily: 'serif' }}>
                      Scope & Tech Specifications
                    </h2>
                    <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                      Overview of core setup parameters, content capacity constraints, integrated frameworks, and client-specific boundary guidelines.
                    </p>
                  </div>

                  {/* Stat blocks - 3-column row with uppercase muted label above and large bold value below */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center', backgroundColor: '#fafaf8', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 'bold', marginBottom: '4px' }}>Page Capacity</span>
                      <strong style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#1a2744' }}>{proposal.websiteScope.totalPages} Templates</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 'bold', marginBottom: '4px' }}>Language Profile</span>
                      <strong style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#1a2744' }}>{proposal.websiteScope.languages || "English"}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 'bold', marginBottom: '4px' }}>CMS Architecture</span>
                      <strong style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#1a2744', textTransform: 'uppercase' }}>{proposal.websiteScope.cmsType}</strong>
                    </div>
                  </div>

                  {/* Omnichannel E-Commerce Specifications Summary */}
                  {proposal.websiteScope.websiteType === 'ecommerce' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#fafaf8', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px' }}>
                      {/* Column 1: Odoo ERP Sync Targets */}
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                            INTEGRATION PIPELINES
                          </span>
                          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px' }}>
                            Odoo ERP Sync Targets
                          </h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(proposal.websiteScope.ecommerceOdooSyncModules && proposal.websiteScope.ecommerceOdooSyncModules.length > 0
                            ? proposal.websiteScope.ecommerceOdooSyncModules
                            : ["Product Catalog", "Real-Time Inventory Status", "Sales Orders Processing", "Customer Profiles"]
                          ).map((mod) => (
                            <div key={mod} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10.5px', color: '#4b5563' }}>
                              <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span>
                              <span>{mod}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Payment Gateway Scopes */}
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                            TRANSACTION GATEWAYS
                          </span>
                          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px' }}>
                            Payment Gateway Scopes
                          </h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(proposal.websiteScope.ecommercePaymentGateways && proposal.websiteScope.ecommercePaymentGateways.length > 0
                            ? proposal.websiteScope.ecommercePaymentGateways
                            : ["Credit/Debit Cards", "Cash on Delivery (COD)"]
                          ).map((gw) => (
                            <div key={gw} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10.5px', color: '#4b5563' }}>
                              <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span>
                              <span>{gw}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tech stack: display as a single-row grid of labelled badges, one per technology layer */}
                  <div style={{ border: '1px solid #e0ddd5', borderRadius: '8px', backgroundColor: '#fafaf8', padding: '14px' }}>
                    <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                        SYSTEM INFRASTRUCTURE
                      </span>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px' }}>
                        Provisioned Container Technology Stack
                      </h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                      {[
                        { label: "Frontend", val: proposal.websiteScope.ecommerceTechStack?.website || "React / Next.js" },
                        { label: "Mobile Apps", val: proposal.websiteScope.ecommerceTechStack?.mobile || "Flutter (iOS/Android)" },
                        { label: "Backend API", val: proposal.websiteScope.ecommerceTechStack?.backend || "Node.js" },
                        { label: "Database", val: proposal.websiteScope.ecommerceTechStack?.database || "PostgreSQL" },
                        { label: "Hosting", val: proposal.websiteScope.ecommerceTechStack?.hosting || "AWS Cloud" }
                      ].map((stackIdx) => (
                        <div key={stackIdx.label} style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '6px', padding: '8px', textAlign: 'center', boxSizing: 'border-box' }}>
                          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#B8962E', fontWeight: 'bold' }}>
                            {stackIdx.label}
                          </span>
                          <span style={{ display: 'block', fontSize: '10.5px', fontWeight: 'bold', color: '#1a2744', marginTop: '4px', wordBreak: 'break-word', lineHeight: '1.2' }}>
                            {stackIdx.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section-Level Notes & Boundaries Grid */}
                  {proposal.websiteScope.scopeNotes && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Project Notes & Client Requirements side by side */}
                      {(proposal.websiteScope.scopeNotes.notes || proposal.websiteScope.scopeNotes.requirements) && (
                        <div style={{ backgroundColor: '#fafaf8', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px', textAlign: 'left' }}>
                          <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold', marginBottom: '6px' }}>
                            Specific Deliverables & Directions
                          </span>
                          {proposal.websiteScope.scopeNotes.notes && (
                            <p style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.4', margin: '0 0 6px 0' }}>
                              <strong style={{ color: '#1a2744' }}>Notes:</strong> {proposal.websiteScope.scopeNotes.notes}
                            </p>
                          )}
                          {proposal.websiteScope.scopeNotes.requirements && (
                            <p style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.4', margin: '0' }}>
                              <strong style={{ color: '#1a2744' }}>Client Directs:</strong> {proposal.websiteScope.scopeNotes.requirements}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Exclusions & Technical Clarifications side by side */}
                      {(proposal.websiteScope.scopeNotes.exclusions || proposal.websiteScope.scopeNotes.clarifications) && (
                        <div style={{ backgroundColor: '#fafaf8', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px', textAlign: 'left' }}>
                          <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold', marginBottom: '6px' }}>
                            Technical Constraints & Boundaries
                          </span>
                          {proposal.websiteScope.scopeNotes.exclusions && (
                            <p style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.4', margin: '0 0 6px 0' }}>
                              <strong style={{ color: '#B8962E' }}>Exclusions:</strong> {proposal.websiteScope.scopeNotes.exclusions}
                            </p>
                          )}
                          {proposal.websiteScope.scopeNotes.clarifications && (
                            <p style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.4', margin: '0' }}>
                              <strong style={{ color: '#1a2744' }}>Clarifications:</strong> {proposal.websiteScope.scopeNotes.clarifications}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("scope_setup")} />
            </div>

            {/* 2. Custom Scope Sprint Pages (Combined statically into 3 structured high-density pages to avoid truncation) */}
            {(() => {
              const pNumber1 = getPageNumberById("scope_combined_1");
              const pNumber2 = getPageNumberById("scope_combined_2");
              const pNumber3 = getPageNumberById("scope_combined_3");

              return (
                <>
                  {/* Page 7: Scope Page 1 */}
                  <div id={`page-${pNumber1}-scope-combined-1`} className="proposal-page relative flex flex-col justify-between overflow-hidden" style={{ boxSizing: 'border-box' }}>
                    <ProposalWatermark proposal={proposal} />
                    <ProposalCustomLetterheadBackground proposal={proposal} />
                    <ProposalPageHeader proposal={proposal} pageNumber={pNumber1} />

                    <div className="my-auto w-full relative z-10 py-1" style={{ padding: '0 24px', boxSizing: 'border-box' }}>
                      <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        <div style={{ textAlign: 'center', borderBottom: '1px solid #e0ddd5', paddingBottom: '8px', marginBottom: '8px' }}>
                          <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                            DELIVERABLE TRACK
                          </span>
                          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px', fontFamily: 'serif' }}>
                            Foundational Architecture & Interface Framework
                          </h2>
                        </div>

                        {/* SECTION 01 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px', marginBottom: '4px', textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                              SECTION 01
                            </span>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                              Core Website Structure
                            </h3>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Omnichannel E-Commerce Web Storefront
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Fully responsive, optimised React.js/Next.js store featuring product catalogs, advanced search, multi-branch inventory visibility, and seamless checkout funnels integrated with Odoo ERP.
                              </p>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Bilingual iOS & Android Customer Mobile Application
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Bilingual (English & Arabic) native mobile apps with secure profile management, address books, saved card vaults, real-time order tracking, and push notification systems.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 02 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px', marginBottom: '4px', textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                              SECTION 02
                            </span>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                              Features & Functionality (Part A)
                            </h3>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Real-Time Driver Delivery Tracking Application
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Interactive map-driven mobile application for delivery agents offering instant routing directions, status tags, customer confirmations, and digital proof-of-delivery capture.
                              </p>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Centralised Admin Management Portal
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                A command centre dashboard displaying sales analytics, revenue reports, branch performances, product catalog controls, staff role permissions, and customer management tools.
                              </p>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', gridColumn: 'span 2' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Dynamic Multi-Branch Inventory Control
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Automated routing that geolocates buyers, runs stock checks at nearest fulfilment centres, and routes orders to the closest available branch for fastest delivery.
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Footer Footnote */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'monospace', color: '#9ca3af', borderTop: '1px solid #e0ddd5', padding: '8px 24px 0 24px', marginTop: 'auto', width: '100%', boxSizing: 'border-box' }}>
                      <span>* Fully authorised work package modules</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Continued on Page 8 <ChevronRight style={{ width: '10px', height: '10px' }} />
                      </span>
                    </div>

                    <ProposalPageFooter proposal={proposal} pageNumber={pNumber1} />
                  </div>

                  {/* Page 8: Scope Page 2 */}
                  <div id={`page-${pNumber2}-scope-combined-2`} className="proposal-page relative flex flex-col justify-between overflow-hidden" style={{ boxSizing: 'border-box' }}>
                    <ProposalWatermark proposal={proposal} />
                    <ProposalCustomLetterheadBackground proposal={proposal} />
                    <ProposalPageHeader proposal={proposal} pageNumber={pNumber2} />

                    <div className="my-auto w-full relative z-10 py-1" style={{ padding: '0 24px', boxSizing: 'border-box' }}>
                      <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        <div style={{ textAlign: 'center', borderBottom: '1px solid #e0ddd5', paddingBottom: '8px', marginBottom: '8px' }}>
                          <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                            DELIVERABLE TRACK
                          </span>
                          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px', fontFamily: 'serif' }}>
                            Advanced Systems, Service Gateways & Analytics
                          </h2>
                        </div>

                        {/* SECTION 03 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px', marginBottom: '4px', textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                              SECTION 03
                            </span>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                              Features & Functionality (Part B)
                            </h3>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', gridColumn: 'span 2' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Targeted Promotions & Promo Code Engine
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Promo code management module supporting fixed discounts, percentages, first-order incentives, category-specific offers, and time-bound flash sale activations.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 04 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px', marginBottom: '4px', textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                              SECTION 04
                            </span>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                              Integrations & APIs
                            </h3>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Odoo ERP API Integration Gateway
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                API-based bidirectional integration between E-Commerce engines and the Client's existing Odoo ERP system, syncing product data, inventory levels, sales orders, and customer profiles in real time.
                              </p>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Integrated Payment Processor & COD
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Secure integration of approved credit/debit card payment gateways and optional Cash on Delivery (COD) logic with automated order confirmation and receipt generation.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 05 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px', marginBottom: '4px', textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                              SECTION 05
                            </span>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                              Analytics & Tracking
                            </h3>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Enterprise-Grade Security & Audit Suite
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Implementation of secure protocol architectures (SSL, JWT auth tokens, granular RBAC permissions, client data encryption) and a compliance audit trail module.
                              </p>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> High-Availability Database & Cloud Hosting
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Staging and production deployment of Node.js backend pipelines and PostgreSQL/MySQL databases on high-availability AWS or equivalent cloud infrastructure.
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Footer Footnote */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'monospace', color: '#9ca3af', borderTop: '1px solid #e0ddd5', padding: '8px 24px 0 24px', marginTop: 'auto', width: '100%', boxSizing: 'border-box' }}>
                      <span>* Fully authorised work package modules</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Continued on Page 9 <ChevronRight style={{ width: '10px', height: '10px' }} />
                      </span>
                    </div>

                    <ProposalPageFooter proposal={proposal} pageNumber={pNumber2} />
                  </div>

                  {/* Page 9: Scope Page 3 */}
                  <div id={`page-${pNumber3}-scope-combined-3`} className="proposal-page relative flex flex-col justify-between overflow-hidden" style={{ boxSizing: 'border-box' }}>
                    <ProposalWatermark proposal={proposal} />
                    <ProposalCustomLetterheadBackground proposal={proposal} />
                    <ProposalPageHeader proposal={proposal} pageNumber={pNumber3} />

                    <div className="my-auto w-full relative z-10 py-1" style={{ padding: '0 24px', boxSizing: 'border-box' }}>
                      <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        <div style={{ textAlign: 'center', borderBottom: '1px solid #e0ddd5', paddingBottom: '8px', marginBottom: '8px' }}>
                          <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                            DELIVERABLE TRACK
                          </span>
                          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px', fontFamily: 'serif' }}>
                            Operational Handover & Production Standards
                          </h2>
                        </div>

                        {/* SECTION 06 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px', marginBottom: '4px', textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                              SECTION 06
                            </span>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                              Custom & Operational Delivery (Part A)
                            </h3>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> User Guides & Technical Documentation
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Publication of operator user onboarding guides, developer system maps, data dictionaries, API path references, and admin panel walkthrough documentation.
                              </p>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Corporate Staff Training & Maintenance Support
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Live interactive training workshops for administrators and branch agents, plus initial post-launch AMC support covering bug resolution and performance monitoring.
                              </p>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', gridColumn: 'span 2' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> Multilingual Language Routing & Translation
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Comprehensive dual-language subfolder routing containing a clean visual menu language switcher to support full English and Arabic content delivery across all pages.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 07 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px', marginBottom: '4px', textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                              SECTION 07
                            </span>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                              Custom & Operational Delivery (Part B)
                            </h3>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', gridColumn: 'span 2' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> HubSpot CRM Sync & WhatsApp Live Support
                              </h4>
                              <p style={{ fontSize: '11.5px', color: '#4b5563', lineHeight: '1.55', margin: '0' }}>
                                Dynamic live chat popups linking direct with localised client WhatsApp triggers, paired with secure custom HubSpot CRM pipeline integrations for lead capture and client follow-up automation.
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Footer Footnote */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'monospace', color: '#9ca3af', borderTop: '1px solid #e0ddd5', padding: '8px 24px 0 24px', marginTop: 'auto', width: '100%', boxSizing: 'border-box' }}>
                      <span>* Fully authorised work package modules</span>
                      <span>End of Scope Sprints list</span>
                    </div>

                    <ProposalPageFooter proposal={proposal} pageNumber={pNumber3} />
                  </div>
                </>
              );
            })()}

            {/* 3. Dedicated Visual Sitemap Blueprint Page */}
            <div id={`page-${getPageNumberById("scope_sitemap")}-scope-sitemap`} className="proposal-page relative flex flex-col justify-between overflow-hidden" style={{ boxSizing: 'border-box' }}>
              <ProposalWatermark proposal={proposal} />
              <ProposalCustomLetterheadBackground proposal={proposal} />
              <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("scope_sitemap")} />

              <div className="my-auto w-full relative z-10" style={{ padding: '0 20px' }}>
                <div className="max-w-2xl mx-auto space-y-4">
                  
                  {/* Section header styled exactly as specified */}
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                      ARCHITECTURAL BLUEPRINT
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px', fontFamily: 'serif' }}>
                      Sitemap & User Flow Hierarchy
                    </h2>
                    <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                      Detailed sitemap layout depicting page levels, custom form placements, shopping funnels, and supplementary structural links.
                    </p>
                  </div>

                  {/* 2-Column Grid of static clean cards matching the layout rules */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'left' }}>
                    {[
                      { id: "1", title: "1. Home Page", description: "Main landing experience, hero section, corporate summary, and core pillars.", children: [] },
                      { id: "2", title: "2. About Us & Services", description: "Company journey, executive bios, and specialised business offerings page.", children: [] },
                      { id: "3", title: "3. Contact Us", description: "Direct localisation map, office address coordinates, and active inquiry dispatch form.", children: [] },
                      { id: "4", title: "4. Media Portfolio", description: "Visual grid with filter categories and touch-responsive lightbox galleries.", children: [] },
                      { id: "5", title: "5. E-Commerce Product Catalog", description: "Responsive catalog supporting categories, subcategories, custom attributes, filters, search, and sorting.", children: ["Category Filtering Layout", "Advanced Smart Search"] },
                      { id: "6", title: "6. Product Details & Reviews", description: "Page showcasing variants, multi-image gallery zoom, customer video support, reviews, and question forums.", children: ["Variant Selector Module", "Interactive Visual Gallery Slider"] },
                      { id: "7", title: "7. Shopping Cart & Checkout", description: "Optimised omnichannel checkout funnel including coupons, shipping rate calculators, and secure gateways.", children: ["Coupon Validation Portal", "Integrated Gateway Handler"] },
                      { id: "8", title: "8. Real-Time Tracking & Account", description: "Customer accounts listing purchase histories, interactive delivery routes, return requests, and PDF invoices.", children: ["Order Status Dispatcher", "Automated PDF Invoice Printer"] },
                      { id: "9", title: "9. Admin & Branch Management", description: "Centralised command portal monitoring sales metrics, branch inventory pools, driver assignments, and refunds.", children: [] },
                    ].map((node) => (
                      <div 
                        key={node.id} 
                        style={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e0ddd5', 
                          borderRadius: '8px', 
                          padding: '10px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box'
                        }}
                        className={node.id === "9" ? "col-span-1 md:col-span-2" : ""}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ display: 'inline-block', width: '3px', height: '10px', backgroundColor: '#B8962E', borderRadius: '1px' }}></span>
                            <h3 style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1a2744', margin: 0 }}>
                              {node.title}
                            </h3>
                          </div>
                          <p style={{ fontSize: '9.5px', color: '#4b5563', lineHeight: '1.4', margin: 0 }}>
                            {node.description}
                          </p>
                          {node.children && node.children.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                              {node.children.map((child, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#4b5563' }}>
                                  <span style={{ color: '#B8962E', fontWeight: 'bold' }}>↳</span>
                                  <span>{child}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footnote */}
                  <div style={{ textAlign: 'center', paddingTop: '6px', fontSize: '9.5px', color: '#9ca3af', borderTop: '1px solid #e0ddd5', marginTop: '4px' }}>
                    * All pages are customisable. Additional sub-pages and structural links can be added upon request.
                  </div>

                </div>
              </div>

              <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("scope_sitemap")} />
            </div>
          </>
        )}

        {/* --- PAGE 7: TIMELINE & MILESTONES --- */}
        <div id={`page-${getPageNumberById("timeline")}-timeline`} className="proposal-page relative flex flex-col justify-between overflow-hidden" style={{ boxSizing: 'border-box' }}>
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("timeline")} />

          <div className="my-auto w-full relative z-10" style={{ padding: '0 24px', boxSizing: 'border-box' }}>
            <div className="max-w-2xl mx-auto space-y-4">
              
              {/* Existing section header style */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                  THE MILESTONE HIGHWAYS
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px', fontFamily: 'serif' }}>
                  Timeline & Delivery Sprints
                </h2>
              </div>

              {/* Stat block for total duration */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold' }}>
                  TOTAL DURATION
                </span>
                <strong style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px' }}>
                  8 WEEKS
                </strong>
              </div>

              {/* Gantt bar container */}
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', width: '100%', height: '32px', borderRadius: '6px', overflow: 'hidden', boxSizing: 'border-box', border: '1px solid #e0ddd5', marginBottom: '6px' }}>
                  {/* Phase 1 (2 weeks = 25%) */}
                  <div style={{ width: '25%', backgroundColor: '#faeeda', borderRight: '1.5px solid #B8962E', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a2744' }}>PH 1</span>
                  </div>
                  {/* Phase 2 (3 weeks = 37.5%) */}
                  <div style={{ width: '37.5%', backgroundColor: '#1a2744', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffffff' }}>PH 2</span>
                  </div>
                  {/* Phase 3 (2 weeks = 25%) */}
                  <div style={{ width: '25%', backgroundColor: '#B8962E', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffffff' }}>PH 3</span>
                  </div>
                  {/* Phase 4 (1 week = 12.5%) */}
                  <div style={{ width: '12.5%', backgroundColor: '#0f1f3d', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffffff' }}>PH 4</span>
                  </div>
                </div>

                {/* Week labels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', textAlign: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>Week 1</span>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>Week 2</span>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>Week 3</span>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>Week 4</span>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>Week 5</span>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>Week 6</span>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>Week 7</span>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>Week 8</span>
                </div>
              </div>

              {/* Phase cards list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  {
                    ph: "PH 1",
                    title: "Wireframes & Visual Direction",
                    weeks: "Weeks 1–2",
                    desc: "Structuring information architecture, customised maps, sitemaps, and core theme approval."
                  },
                  {
                    ph: "PH 2",
                    title: "Component Engineering & Alpha Development",
                    weeks: "Weeks 3–5",
                    desc: "Implementing custom React structures, high-performance layouts, and responsive component code."
                  },
                  {
                    ph: "PH 3",
                    title: "Plugin Integrations & Content Setup",
                    weeks: "Weeks 6–7",
                    desc: "Integrating CMS modules, dynamic blog/careers boards, analytic triggers, and SEO metadata."
                  },
                  {
                    ph: "PH 4",
                    title: "Quality Assurance, Optimisations & Launch",
                    weeks: "Week 8",
                    desc: "Cross-platform speed checks, DNS cutover, staging migration, and direct search engine indexing hooks."
                  }
                ].map((phase, i) => (
                  <div 
                    key={phase.ph}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      gap: '16px', 
                      backgroundColor: '#fafaf8', 
                      border: '1px solid #e0ddd5', 
                      borderRadius: '8px', 
                      padding: '14px 18px', 
                      boxSizing: 'border-box' 
                    }}
                  >
                    {/* Left side: gold phase label + bold navy phase name */}
                    <div style={{ width: '30%', flexShrink: 0, textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                        {phase.ph}
                      </span>
                      <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px', lineHeight: '1.3' }}>
                        {phase.title}
                      </h3>
                    </div>
                    
                    {/* Right side: week range in small muted text + description paragraph */}
                    <div style={{ flexGrow: 1, textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: '9.5px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3px' }}>
                        {phase.weeks}
                      </span>
                      <p style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.4', margin: 0 }}>
                        {phase.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("timeline")} />
        </div>

        {/* --- PAGE 8: FINANCIAL BLUEPRINT --- */}
        <div id={`page-${getPageNumberById("financials")}-financials`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("financials")} />

          <div className="my-auto w-full max-w-xl mx-auto relative z-10">
            <span className="text-xs font-sans tracking-widest text-[#B8962E] font-bold uppercase mb-2 block">
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
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between mb-4">
              <span className="font-sans font-bold text-slate-800 uppercase text-xs tracking-wider">
                TOTAL CONTRACT VALUE:
              </span>
              <strong className="font-serif text-2xl font-bold text-[#1a2744]">
                {formatQAR(proposal.totalCost)} QAR
              </strong>
            </div>

            {/* Terms text */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-sans text-slate-500 leading-relaxed mb-4">
              <h4 className="font-bold uppercase text-slate-700 tracking-wide mb-1">
                Payment Terms & Invoicing
              </h4>
              <p className="pr-2">{proposal.paymentTerms}</p>
            </div>

            {/* What Your Investment Covers */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '9.5px', fontFamily: 'sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold', marginBottom: '6px' }}>
                WHAT YOUR INVESTMENT COVERS
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { icon: "🎨", title: "UX/UI Design", desc: "Wireframes, visual design, and component architecture" },
                  { icon: "⚙️", title: "Development", desc: "Full-stack build, integrations, and QA" },
                  { icon: "🛡️", title: "Support", desc: "3-month maintenance, training, and AMC coverage" }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#fafaf8',
                      border: '1px solid #e0ddd5',
                      borderRadius: '8px',
                      padding: '12px 10px',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ fontSize: '15px', marginBottom: '3px' }}>{item.icon}</div>
                    <h5 style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#1a2744', marginBottom: '2px' }}>{item.title}</h5>
                    <p style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.25', margin: '0' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Payment Milestone Strip */}
            <div>
              <span style={{ display: 'block', fontSize: '9.5px', fontFamily: 'sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold', marginBottom: '6px' }}>
                MILESTONE INVESTMENT TIMELINE
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                
                {/* Milestone 1: First Navy */}
                <div style={{ 
                  flex: '1', 
                  backgroundColor: '#1a2744', 
                  color: '#ffffff', 
                  borderRadius: '6px', 
                  padding: '10px 8px', 
                  textAlign: 'center', 
                  boxSizing: 'border-box' 
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>50%</div>
                  <div style={{ fontSize: '9px', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 'medium', marginTop: '2px' }}>On Signing</div>
                </div>

                {/* Arrow */}
                <div style={{ color: '#B8962E', fontWeight: 'bold', fontSize: '14px' }}>→</div>

                {/* Milestone 2: Gold */}
                <div style={{ 
                  flex: '1', 
                  backgroundColor: '#B8962E', 
                  color: '#ffffff', 
                  borderRadius: '6px', 
                  padding: '10px 8px', 
                  textAlign: 'center', 
                  boxSizing: 'border-box' 
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>25%</div>
                  <div style={{ fontSize: '9px', color: '#ffffff', textTransform: 'uppercase', fontWeight: 'medium', marginTop: '2px' }}>Design Approval</div>
                </div>

                {/* Arrow */}
                <div style={{ color: '#B8962E', fontWeight: 'bold', fontSize: '14px' }}>→</div>

                {/* Milestone 3: Second Navy */}
                <div style={{ 
                  flex: '1', 
                  backgroundColor: '#1a2744', 
                  color: '#ffffff', 
                  borderRadius: '6px', 
                  padding: '10px 8px', 
                  textAlign: 'center', 
                  boxSizing: 'border-box' 
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>25%</div>
                  <div style={{ fontSize: '9px', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 'medium', marginTop: '2px' }}>On Launch</div>
                </div>

              </div>
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("financials")} />
        </div>

        {/* --- PAGE 9: ACCEPTANCE PAGE --- */}
        <div id={`page-${getPageNumberById("acceptance")}-acceptance`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("acceptance")} />

          {/* Thin full-width navy header band */}
          <div className="mx-[-20mm] print:mx-[-15mm] bg-[#1a2744] py-1.5 text-center mt-3 mb-5">
            <span className="text-[10px] font-sans tracking-[0.25em] font-bold text-[#B8962E] block">
              OFFICIAL RATIFICATION
            </span>
          </div>

          <div className="my-auto w-full max-w-xl mx-auto font-sans relative z-10">
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
          <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("acceptance")} />
        </div>

        {/* --- PAGE 10: THANK YOU PAGE --- */}
        <div id={`page-${getPageNumberById("thank_you")}-thanks`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("thank_you")} />

          <div className="my-auto py-12 text-center max-w-lg mx-auto relative z-10" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{
              fontFamily: 'serif',
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#B8962E',
              margin: '0 0 8px 0',
              textAlign: 'center'
            }}>
              Thank You.
            </h2>

            <p style={{
              fontSize: '18px',
              color: '#1a2744',
              fontStyle: 'normal',
              fontWeight: '500',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              We look forward to creating digital value with your team.
            </p>

            <div style={{
              width: '80px',
              height: '1px',
              backgroundColor: '#B8962E',
              margin: '0 auto 24px auto'
            }}></div>

            <div style={{
              backgroundColor: '#fafaf8',
              border: '1px solid #e0ddd5',
              borderRadius: '8px',
              padding: '16px 24px',
              textAlign: 'center',
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '380px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '13px', color: '#4b5563', margin: '0', fontWeight: '500', fontFamily: 'sans-serif' }}>
                <span style={{ color: '#B8962E', fontWeight: 'bold' }}>info@technoastra.com</span>
                <span style={{ color: '#d1d5db', margin: '0 12px' }}>|</span>
                <span style={{ color: '#1a2744', fontWeight: 'bold' }}>4440 0100</span>
              </p>
            </div>

            <p style={{
              fontSize: '11px',
              color: '#9ca3af',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              margin: '0',
              textAlign: 'center',
              fontFamily: 'sans-serif'
            }}>
              Astra Technologies <span style={{ color: '#d1d5db', margin: '0 6px' }}>|</span> Confidentiality Guaranteed
            </p>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("thank_you")} />
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

      {activeTab === 'payment' && (
        <PaymentTracker 
          proposal={proposal} 
          onUpdateProposal={onUpdateProposal} 
          currentUser={currentUser} 
        />
      )}
    </div>
  );
}

function PaymentTracker({ 
  proposal, 
  onUpdateProposal, 
  currentUser 
}: { 
  proposal: Proposal; 
  onUpdateProposal?: (updated: Proposal) => void;
  currentUser?: any;
}) {
  const [amount, setAmount] = React.useState<number>(0);
  const [type, setType] = React.useState<PaymentEntry['type']>('Advance');
  const [reference, setReference] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [payDate, setPayDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [method, setMethod] = React.useState('Bank Transfer');
  const [recordedBy, setRecordedBy] = React.useState(() => currentUser?.name || 'Astra Operations');

  const [payments, setPayments] = React.useState<PaymentEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Load payment entries from database table on startup
  React.useEffect(() => {
    let active = true;
    async function fetchPayments() {
      try {
        setLoading(true);
        const res = await fetch(`/api/proposals/${proposal.id}/payments`);
        if (res.ok) {
          const list = await res.json();
          if (active) {
            const formatted = list.map((item: any) => ({
              id: item.id,
              timestamp: item.paymentDate || item.createdAt || new Date().toISOString(),
              amount: Number(item.amount),
              type: item.type,
              method: item.method,
              reference: item.reference,
              notes: item.notes,
              recordedBy: item.recordedBy
            }));
            setPayments(formatted);
          }
        } else {
          if (active && proposal.paymentEntries) {
            setPayments(proposal.paymentEntries);
          }
        }
      } catch (err: any) {
        console.warn("Could not fetch payments from database:", err.message);
        if (active && proposal.paymentEntries) {
          setPayments(proposal.paymentEntries);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchPayments();
    return () => {
      active = false;
    };
  }, [proposal.id, proposal.paymentEntries]);

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingBalance = Math.max(0, proposal.totalCost - totalPaid);
  const paidPercent = Math.min(100, Math.round((totalPaid / proposal.totalCost) * 100));

  // Auto set to remaining balance when mounting or when pendingBalance changes
  React.useEffect(() => {
    setAmount(parseFloat(pendingBalance.toFixed(2)));
  }, [pendingBalance]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert("Please specify a positive payment amount.");
      return;
    }
    if (amount > pendingBalance + 0.01) {
      if (!confirm(`Warning: The payment amount of ${formatQAR(amount)} exceeds the remaining pending balance of ${formatQAR(pendingBalance)}. Are you sure you want to log an overpayment?`)) {
        return;
      }
    }

    const newPaymentId = 'pay_' + Math.random().toString(36).substring(2, 10);
    const newPaymentTimestamp = new Date(payDate).toISOString();

    const newPayment: PaymentEntry = {
      id: newPaymentId,
      timestamp: newPaymentTimestamp,
      amount: Number(amount),
      type,
      method,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      recordedBy: recordedBy.trim() || undefined
    };

    // Update local reactive state
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);

    // Save to server-side SQL table
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: newPaymentId,
          amount: Number(amount),
          paymentDate: payDate,
          reference: reference.trim() || null,
          method,
          type,
          notes: notes.trim() || null,
          recordedBy: recordedBy.trim() || null
        })
      });
      if (!res.ok) {
        console.warn("Server failed to persist transaction entry to proposal_payments table.");
      }
    } catch (err: any) {
      console.warn("Failed to save payment to database:", err.message);
    }

    // Sync backup JSON column
    if (onUpdateProposal) {
      onUpdateProposal({
        ...proposal,
        paymentEntries: updatedPayments
      });
    }

    // Reset inputs
    setReference('');
    setNotes('');
    setPayDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm("Are you sure you want to void this payment entry? This will re-extend the pending customer balance.")) {
      const updatedPayments = payments.filter(p => p.id !== paymentId);
      setPayments(updatedPayments);

      // Delete from database
      try {
        const res = await fetch(`/api/proposals/${proposal.id}/payments/${paymentId}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          console.warn("Server failed to delete payment entry from proposal_payments table.");
        }
      } catch (err: any) {
        console.warn("Failed to delete payment from DB server:", err.message);
      }

      // Sync backup JSON column
      if (onUpdateProposal) {
        onUpdateProposal({
          ...proposal,
          paymentEntries: updatedPayments
        });
      }
    }
  };

  // Helper selectors
  const applyPresetPercentage = (percent: number) => {
    const val = parseFloat(((proposal.totalCost * percent) / 100).toFixed(2));
    setAmount(val);
  };

  return (
    <div id="payment-tracker-tab" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-8 font-sans">
      {/* Header section with Balance Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 animate-none">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Coins className="h-5 w-5 text-indigo-600" />
            Financial Payment Ledger
          </h2>
          <p className="text-xs text-slate-500">Track milestones, initial down payments, second installments, and launch sign-offs</p>
        </div>

        <div className="flex items-center gap-3">
          {pendingBalance === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-3xs">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
              <span className="text-xs font-black tracking-wider uppercase font-sans text-emerald-800">FULLY PAID & SETTLED</span>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 text-rose-850 rounded-xl flex flex-col items-end">
              <span className="text-[9px] font-bold text-rose-500 uppercase font-mono tracking-widest leading-none mb-1">Pending Balance</span>
              <span className="text-base font-extrabold text-rose-600 leading-none">{formatQAR(pendingBalance)} QAR</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress section */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-3">
        <div className="flex justify-between items-end text-xs">
          <div>
            <span className="text-slate-500 font-medium">Sinking Ledger Progress:</span>
            <span className="ml-1.5 font-bold text-slate-800">{formatQAR(totalPaid)} QAR</span>
            <span className="text-slate-400"> of {formatQAR(proposal.totalCost)} QAR</span>
          </div>
          <span className={`font-black text-sm ${pendingBalance === 0 ? 'text-emerald-600' : 'text-blue-600'}`}>{paidPercent}%</span>
        </div>
        <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden shadow-inner border border-slate-300">
          <div 
            className={`h-full transition-all duration-700 ease-out ${pendingBalance === 0 ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
            style={{ width: `${paidPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Record payment form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <CreditCard className="h-4 w-4 text-slate-400" />
            Record Manual Receipt
          </h3>

          <form onSubmit={handleAddPayment} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Receipt Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border border-slate-250 bg-slate-50 rounded-xl px-3 py-2 text-slate-850 outline-hidden focus:border-blue-500 focus:bg-white text-xs transition-colors"
              >
                <option value="Advance">Advance (Down Payment)</option>
                <option value="Second">Second Installment</option>
                <option value="Final">Final Payment (Launch)</option>
                <option value="Custom">Custom Milestone / Installment</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-600 font-bold">Amount (QAR)</label>
                <div className="flex gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => applyPresetPercentage(40)} 
                    className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    40%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPresetPercentage(50)} 
                    className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    50%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPresetPercentage(100)} 
                    className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    Full
                  </button>
                </div>
              </div>
              <input 
                type="number"
                step="any"
                min="0"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Amount in QAR"
                className="w-full border border-slate-250 bg-slate-50 rounded-xl px-3 py-2 text-slate-850 font-bold focus:border-blue-500 focus:bg-white text-sm transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Payment Method</label>
                <select 
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full border border-slate-250 bg-slate-50 rounded-xl px-3 py-2 text-slate-850 outline-hidden focus:border-blue-500 focus:bg-white text-xs transition-colors"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Ooredoo Money">Ooredoo Money</option>
                  <option value="Other">Other Method</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Payment Date</label>
                <input 
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full border border-slate-250 bg-slate-50 rounded-xl px-3 py-2 text-slate-850 focus:border-blue-500 focus:bg-white text-xs transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Ref / Receipt # / Wire Reference (Optional)</label>
              <input 
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. TXN-108239A or QNB Chq #900"
                className="w-full border border-slate-250 bg-slate-50 rounded-xl px-3 py-2 text-slate-850 focus:border-blue-500 focus:bg-white text-xs transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Recorded By</label>
              <input 
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                placeholder="Staff handler identity"
                className="w-full border border-slate-250 bg-slate-50 rounded-xl px-3 py-2 text-slate-850 focus:border-blue-500 focus:bg-white text-xs transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Internal Log Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received down-payment following board signoff..."
                className="w-full border border-slate-250 bg-slate-50 rounded-xl px-3 py-2 text-slate-850 h-16 resize-none focus:border-blue-500 focus:bg-white text-xs transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Register Payment Entry
            </button>
          </form>
        </div>

        {/* Payment history list */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Landmark className="h-4 w-4 text-slate-400" />
            Transaction Ledger Entries ({payments.length})
          </h3>

          {payments.length === 0 ? (
            <div className="border border-dashed border-slate-250 rounded-2xl p-8 text-center bg-slate-50 flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-slate-100 text-slate-400 rounded-full">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">No transactions recorded yet</p>
              <p className="text-[10px] text-slate-500 max-w-xs leading-normal">Use the manual entry form to log the first down payment or advance received from the client.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {[...payments].reverse().map((p, idx) => (
                <div key={p.id || idx} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-350 transition-all shadow-3xs relative group select-none">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                          p.type === 'Advance' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' :
                          p.type === 'Second' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                          p.type === 'Final' ? 'bg-emerald-55/40 border border-emerald-250 text-emerald-800' :
                          'bg-slate-50 border border-slate-250 text-slate-705'
                        }`}>
                          {p.type} Receipt
                        </span>
                        
                        <span className="text-[10px] text-slate-500 font-mono">
                          {p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : ''}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-700 font-sans tracking-tight leading-relaxed">
                        {p.notes || "No additional remarks logged for this transaction."}
                      </div>

                      {p.reference && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          <strong className="text-slate-400 font-bold uppercase">Ref Code:</strong> {p.reference}
                        </div>
                      )}

                      <div className="text-[9px] text-slate-400 font-sans">
                        Logged by <strong className="text-slate-500">{p.recordedBy || 'System Operator'}</strong>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-2">
                      <span className="text-xs font-black text-slate-900">{formatQAR(p.amount)} QAR</span>
                      
                      <button 
                        type="button" 
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-1 px-2 border border-rose-100 hover:border-rose-300 text-rose-500 hover:text-rose-700 rounded-lg bg-rose-50 hover:bg-rose-100 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                      >
                        <Trash2 className="h-3 w-3" />
                        Void
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
