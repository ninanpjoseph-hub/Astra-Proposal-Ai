/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { BRANDING_TEMPLATES, WEBSITE_TEMPLATES, DEFAULT_SCOPE_TEMPLATES } from '../staticTemplates';
import { formatQAR, DEFAULT_BRANDING_MILESTONES, DEFAULT_WEBSITE_MILESTONES, triggerAutomatedFollowUp, createDefaultProposal, getModularDeliverableLineItems, renderExecutiveSummary, renderProjectMission } from '../proposalUtils';
import SitemapGenerator from './SitemapGenerator';
import { groupScopeIntoPages, packScopePagesIntoPhysicalPageGroups } from '../utils/scopeClassifier';
import { Check, Bookmark, DollarSign, Calendar, Landmark, BookOpen, Signature, Award, ChevronRight, FileText, Printer, Download, History, RotateCcw, Clock, Sliders, Upload, Trash2, Plus, AlertCircle, Coins, CreditCard, Shield, Users, MoreVertical, ChevronDown, Mail } from 'lucide-react';
import { Proposal, ProposalHistoryEntry, ProposalStatus, PaymentEntry, UserRole } from '../types';
import { exportProposalToDocx } from '../utils/docxExport';
import { getCMSFrameworkConfig } from '../utils/cmsFrameworks';

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

export default function ProposalDocumentView({ proposal: incomingProposal, onBack, showBackBtn = true, onRevert, onUpdateProposal, currentUser, initialTab = 'document' }: ProposalDocumentViewProps) {
  const proposal = React.useMemo<Proposal>(() => {
    const defaults = createDefaultProposal(incomingProposal.type || 'branding');
    return {
      ...defaults,
      ...incomingProposal,
      type: incomingProposal.type || defaults.type,
      brandingScope: {
        ...defaults.brandingScope,
        ...(incomingProposal.brandingScope || {})
      },
      websiteScope: {
        ...defaults.websiteScope,
        ...(incomingProposal.websiteScope || {})
      },
      servicesScope: {
        ...defaults.servicesScope,
        ...(incomingProposal.servicesScope || {})
      },
      milestones: incomingProposal.milestones || defaults.milestones || [],
      resourceCosts: incomingProposal.resourceCosts || defaults.resourceCosts || [],
      history: incomingProposal.history || defaults.history || [],
    };
  }, [incomingProposal]);

  const isBranding = proposal.type === 'branding';
  const isServices = proposal.type === 'services';
  const isWhatsapp = proposal.type === 'whatsapp';
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
  const [isGeneratingDocx, setIsGeneratingDocx] = React.useState(false);
  const [progressText, setProgressText] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'document' | 'history' | 'payment'>('document');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

  const handleDownloadDocx = async () => {
    try {
      setIsGeneratingDocx(true);
      await exportProposalToDocx(proposal);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('An error occurred while generating the Word (.docx) document.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

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

      // Temporarily override window.getComputedStyle to intercept oklch/oklab color values live during html2canvas traversal
      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle.call(window, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === 'getPropertyValue') {
              return (name: string) => {
                const valStr = target.getPropertyValue(name);
                if (typeof valStr === 'string' && (valStr.includes('oklch') || valStr.includes('oklab'))) {
                  let cleaned = valStr;
                  if (cleaned.includes('oklch')) {
                    cleaned = replaceOklchInCss(cleaned);
                  }
                  if (cleaned.includes('oklab')) {
                    cleaned = replaceOklabInCss(cleaned);
                  }
                  return cleaned;
                }
                return valStr;
              };
            }

            try {
              // Retrieve property with native target as the receiver to prevent Illegal Invocation on native getter methods
              const val = Reflect.get(target, prop, target);
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
            } catch (err) {
              const val = target[prop as any];
              if (typeof val === 'function') {
                return val.bind(target);
              }
              return val;
            }
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
        
        try {
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
        } catch (pageError) {
          console.error(`Error rendering page ${i + 1}:`, pageError);
          // Retry without useCORS / allowTaint safely to see if that resolves cross-origin problems
          try {
            const canvasFallback = await html2canvas(element, {
              scale: 1.5,
              useCORS: false,
              allowTaint: true,
              logging: false,
              scrollX: 0,
              scrollY: 0,
              backgroundColor: '#ffffff',
              width: element.offsetWidth || 794,
              height: element.offsetHeight || 1123,
            });
            const imgData = canvasFallback.toDataURL('image/jpeg', 0.9);
            const pdfWidth = 210;
            const pdfHeight = 297;
            if (i > 0) {
              pdf.addPage();
            }
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
          } catch (fallbackError) {
            console.error(`Complete failure on page ${i + 1}:`, fallbackError);
            if (i > 0) {
              pdf.addPage();
            }
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.text(`[Error rendering Proposal Page ${i + 1}]`, 20, 50);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.text('This page contained complex resources or cross-origin images that could not be processed directly.', 20, 60);
          }
        }
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

    if (isWhatsapp) {
      list.push({ id: "whatsapp_scope", title: "Cloud API Scope & Key Features", pageNumStr: String(currentNum).padStart(2, '0') });
      currentNum++;
      if (proposal.whatsappScope?.includeTierComparisonMatrix !== false) {
        list.push({ id: "whatsapp_matrix", title: "Taswiq Solution Tier Comparison", pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }
    } else if (isServices) {
      const selected = proposal.servicesScope?.selectedServices || ['website_audit', 'hosting_domain', 'ssl_renewal', 'amc'];
      if (selected.includes('website_audit')) {
        list.push({ id: "service_website_audit", title: "Website Audit & Health Report", pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }
      if (selected.includes('hosting_domain')) {
        list.push({ id: "service_hosting_domain", title: "Hosting & Domain Infrastructure", pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }
      if (selected.includes('ssl_renewal')) {
        list.push({ id: "service_ssl_renewal", title: "SSL Security & Certificate Renewal", pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }
      if (selected.includes('amc')) {
        list.push({ id: "service_amc", title: "Annual Maintenance Contract (AMC)", pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
        list.push({ id: "service_amc_exclusions", title: "AMC Scope Exclusions & Policies", pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }
      if (selected.includes('custom_service')) {
        list.push({ id: "service_custom_service", title: proposal.servicesScope?.customService?.title || "Custom Service Scope", pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      }
    } else if (isBranding) {
      list.push({ id: "scope_branding", title: "Detailed Scope of Work", pageNumStr: String(currentNum).padStart(2, '0') });
      currentNum++;
    } else {
      // Website has Scope Setup page
      list.push({ id: "scope_setup", title: "Deliverable Parameters & Stack", pageNumStr: String(currentNum).padStart(2, '0') });
      currentNum++;

      // Progressive Scope Blueprint dedicated page(s)
      const activeItems = (proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.filter(item => item.isSelected).length > 0)
        ? proposal.websiteScope.scopeItems.filter(item => item.isSelected)
        : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].map(item => ({ ...item, id: Math.random().toString(), isSelected: true }));
      
      const scopePages = groupScopeIntoPages(activeItems, 4);
      const pageGroups = packScopePagesIntoPhysicalPageGroups(scopePages, 8.0);

      pageGroups.forEach((group, idx) => {
        const pageId = `scope_progressive_${idx + 1}`;
        let pageTitle = "Progressive Scope Blueprint";
        if (pageGroups.length > 1) {
          pageTitle += ` (Part ${idx + 1})`;
        }
        list.push({ id: pageId, title: pageTitle, pageNumStr: String(currentNum).padStart(2, '0') });
        currentNum++;
      });

      list.push({ id: "scope_going_live", title: "Deployment & Launch Blueprint", pageNumStr: String(currentNum).padStart(2, '0') });
      currentNum++;

      // Website has Sitemap Page
      list.push({ id: "scope_sitemap", title: "Interactive Sitemap Blueprint", pageNumStr: String(currentNum).padStart(2, '0') });
      currentNum++;
    }

    list.push({ id: "timeline", title: "Timeline & Delivery Sprints", pageNumStr: String(currentNum).padStart(2, '0') });
    currentNum++;

    list.push({ id: "financials", title: "Proposal Financials", pageNumStr: String(currentNum).padStart(2, '0') });
    currentNum++;

    list.push({ id: "maintenance_terms", title: "1-Year Maintenance Terms", pageNumStr: String(currentNum).padStart(2, '0') });
    currentNum++;

    list.push({ id: "terms_exclusions", title: "Terms & Exclusions", pageNumStr: String(currentNum).padStart(2, '0') });
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
      <div className="no-print bg-[#0F172A] border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap gap-4 items-center justify-between text-white">
        <div className="flex items-center gap-3.5">
          <div className="bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] h-11 w-11 rounded-xl flex items-center justify-center font-bold font-serif text-base shadow-xs">
            {isBranding ? "BI" : "WD"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-bold text-white text-base leading-tight">
                {proposal.clientName || "Unnamed Client"}
              </h3>
              <span className={`text-[9.5px] font-sans font-bold px-2 py-0.5 border rounded-full leading-none uppercase ${
                proposal.status === ProposalStatus.COMPLETED ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                proposal.status === ProposalStatus.CANCELLED ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                proposal.status === ProposalStatus.UNDER_PROCESS ? 'bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30' :
                proposal.status === ProposalStatus.UNDER_REVIEW ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {proposal.status || 'Draft'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Type: <span className="text-slate-200 font-medium">{isBranding ? "Branding & Identity" : "Website Design & Development"}</span> • Deal Value: <strong className="text-[#C5A059] font-semibold">{formatQAR(proposal.totalCost)} QAR</strong>
            </p>
          </div>
        </div>
        
        {/* Structured Action Button System */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {showBackBtn && onBack && (
            <button
               onClick={onBack}
               id="back-to-dashboard-btn"
               className="h-9 px-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
            >
              ← Workspace
            </button>
          )}

          {/* Primary Action: Download PDF Direct */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            id="download-pdf-btn"
            className="h-9 px-4 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-amber-500 hover:brightness-110 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl shadow-md hover:shadow-xl border border-amber-300 flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer"
          >
            {isGenerating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-slate-950 stroke-[2.5]" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Secondary Action 1: Word Export */}
          <button
            onClick={handleDownloadDocx}
            disabled={isGeneratingDocx}
            id="download-docx-btn"
            className="h-9 px-3.5 bg-[#111C35] hover:bg-[#1E293B] text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/80 text-xs font-semibold rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer disabled:opacity-60"
          >
            {isGeneratingDocx ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin"></span>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>Word (.docx)</span>
              </>
            )}
          </button>

          {/* Secondary Action 2: Print */}
          <button
            onClick={handlePrint}
            id="print-proposal-btn"
            className="h-9 px-3.5 bg-[#111C35] hover:bg-[#1E293B] text-slate-200 border border-slate-700 hover:border-slate-500 text-xs font-semibold rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-400" />
            <span>Print</span>
          </button>

          {/* Secondary Action 3: Approve (When Eligible) */}
          {currentUser?.role === UserRole.ADMIN && proposal.status !== ProposalStatus.COMPLETED && (
            <button
              onClick={handleAdminApprove}
              className="h-9 px-3.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-500 text-xs font-bold rounded-xl shadow-xs hover:shadow-md flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Approve</span>
            </button>
          )}

          {/* Action Menu: More Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="h-9 px-3 bg-[#111C35] hover:bg-[#1E293B] text-slate-300 border border-slate-700 hover:border-slate-500 text-xs font-semibold rounded-xl shadow-xs hover:shadow-md flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer"
            >
              <MoreVertical className="h-4 w-4 text-slate-400" />
              <span>More</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-slate-200 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <div className="py-1">
                  <button
                    onClick={async () => {
                      try {
                        await triggerAutomatedFollowUp(proposal.id);
                        alert(`Follow-up notification sent for ${proposal.clientName}`);
                      } catch (e: any) {
                        alert(`Error sending alert: ${e.message}`);
                      }
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-300 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Mail className="h-3.5 w-3.5 text-amber-400" />
                    <span>Send Follow-Up Alert</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5 text-sky-400" />
                    <span>Revision History ({proposal.history?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('payment')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Landmark className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Payment Tracker</span>
                  </button>
                </div>

                {currentUser?.role === UserRole.ADMIN && (
                  <div className="py-1">
                    <button
                      onClick={() => {
                        const el = document.getElementById('admin-action-center-panel');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Shield className="h-3.5 w-3.5 text-amber-400" />
                      <span>Admin Settings & Sharing</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
      <div className="no-print flex border-b border-slate-200/80 dark:border-slate-800 my-2 gap-1 bg-slate-100/60 dark:bg-[#0B1120] p-1.5 rounded-xl">
        <button
          onClick={() => setActiveTab('document')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'document'
              ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4 text-blue-500" />
          <span>Document Draft</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <History className="h-4 w-4 text-amber-500" />
          <span>Revision History</span>
          {proposal.history && proposal.history.length > 0 && (
            <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] shrink-0">
              {proposal.history.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'payment'
              ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Landmark className="h-4 w-4 text-emerald-500" />
          <span>Payment Tracker</span>
          {proposal.paymentEntries && proposal.paymentEntries.length > 0 && (
            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] shrink-0">
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
              {isBranding ? "Visual Branding & Identity" : "Proposed Website Structure & Functionality"}
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
          <div className="border-t border-slate-200/80 pt-6 grid grid-cols-3 gap-6 relative z-10 mb-6 min-w-0">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-[9px] font-sans font-bold text-slate-400 tracking-wider uppercase leading-normal">
                PREPARED BY
              </p>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-xs font-sans font-bold text-slate-800 leading-snug break-words">
                  {proposal.preparedByName || "Ninan P Joseph"}
                </p>
                <p className="text-[11px] font-sans font-semibold text-[#d3af00] leading-snug break-words">
                  {proposal.preparedByCompany || "Astra Technologies"}
                </p>
                {proposal.preparedByTitle && (
                  <p className="text-[10px] font-sans text-slate-400 italic leading-snug break-words">
                    {proposal.preparedByTitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-[9px] font-sans font-bold text-slate-400 tracking-wider uppercase leading-normal">
                CLIENT POC / CONTACT
              </p>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-xs font-sans font-bold text-slate-800 leading-snug break-words">
                  {proposal.clientPocName || proposal.clientName || "[Client Representative]"}
                </p>
                {proposal.companyName && (
                  <p className="text-[11px] font-sans font-semibold text-[#d3af00] leading-snug break-words">
                    {proposal.companyName}
                  </p>
                )}
                {proposal.clientPocDesignation && (
                  <p className="text-[10px] font-sans text-slate-400 italic leading-snug break-words">
                    {proposal.clientPocDesignation}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-right min-w-0">
              <p className="text-[9px] font-sans font-bold text-slate-400 tracking-wider uppercase leading-normal">
                DOCUMENT EXCLUSIVES
              </p>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-xs font-sans font-bold text-slate-800 leading-snug">
                  {formatFriendlyDate(proposal.proposalDate)}
                </p>
                <p className="text-[11px] font-sans text-slate-500 uppercase font-semibold leading-snug">
                  Valid for 30 Days
                </p>
              </div>
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
              {renderExecutiveSummary(proposal)}
            </p>

            {/* Navy Callout Block */}
            <div style={{ backgroundColor: '#1a2744', borderRadius: '10px', padding: '24px 32px', textAlign: 'center', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', color: '#B8962E', fontWeight: 'bold', marginBottom: '8px' }}>
                KEY BUSINESS INTENT & DESIRED OUTCOME
              </span>
              <p style={{ color: '#ffffff', fontSize: '15px', fontStyle: 'italic', margin: '0', lineHeight: '1.5', fontFamily: 'serif' }}>
                "{renderProjectMission(proposal)}"
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

          <div className="my-auto max-w-xl mx-auto w-full relative z-10 px-1">
            <div className="mb-3">
              <span className="text-[10px] font-sans tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                HOW WE DELIVER
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Our Process & Approach
              </h2>
            </div>

            {/* OUR APPROACH SECTION */}
            <div className="bg-[#fafaf8] p-3.5 rounded-xl border border-[#e0ddd5] mb-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-2 w-2 rounded-full bg-[#B8962E]"></div>
                <h3 className="text-xs font-sans font-bold text-[#1a2744] uppercase tracking-wider">
                  Our Approach
                </h3>
              </div>
              <div className="text-[10.5px] text-slate-700 font-sans leading-relaxed space-y-1.5">
                <p>
                  Our website development approach focuses on creating a digital platform that meets your immediate business requirements while being strategically prepared for future growth. We consider your organisation’s evolving needs, industry trends, changing digital landscapes, and long-term business objectives to ensure the website remains relevant, scalable, and effective.
                </p>
                <p>
                  Our goal is to build a digital experience that not only represents your brand today but also supports its future expansion and continued success.
                </p>
              </div>
            </div>

            {/* OUR PROCESS SECTION */}
            <div>
              <div className="flex items-center gap-2 mb-2 border-b border-[#e0ddd5] pb-1.5">
                <div className="h-2 w-2 rounded-full bg-[#1a2744]"></div>
                <h3 className="text-xs font-sans font-bold text-[#1a2744] uppercase tracking-wider">
                  Our Process
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Discovery */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#1a2744] font-serif">Discovery</span>
                      <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">01</span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-sans leading-relaxed">
                      We begin by understanding your business, operations, objectives, target audience, and challenges. Through detailed discovery, we identify key opportunities and insights that help shape the right digital strategy, messaging, and user experience for your website.
                    </p>
                  </div>
                </div>

                {/* 2. Strategy */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#1a2744] font-serif">Strategy</span>
                      <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">02</span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-sans leading-relaxed">
                      A strong digital presence begins with a clear brand and content strategy. We evaluate your existing brand positioning, architecture, and communication approach to ensure consistency across all touchpoints. Where required, we help establish a stronger digital foundation that aligns your brand identity with your business goals and customer expectations.
                    </p>
                  </div>
                </div>

                {/* 3. Design */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#1a2744] font-serif">Design</span>
                      <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">03</span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-sans leading-relaxed">
                      Our design approach combines creativity, usability, and industry best practices to deliver a visually engaging and intuitive website experience. Every design decision is carefully considered — from visual style and user behaviour to market trends and audience expectations — ensuring a digital presence that reflects your brand personality while creating meaningful engagement with your customers.
                    </p>
                  </div>
                </div>

                {/* 4. Delivery */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#1a2744] font-serif">Delivery</span>
                      <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">04</span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-sans leading-relaxed">
                      We transform strategy and design into a high-performing digital solution that supports your business growth. With our expertise, attention to detail, and commitment to quality, we deliver a website that exceeds expectations, enhances customer experience, and provides a strong foundation for long-term digital success.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber="05" />
        </div>

        {isWhatsapp ? (
          /* WHATSAPP MARKETING PAGES */
          <>
            {/* WHATSAPP SCOPE & FEATURES PAGE */}
            <div id={`page-${getPageNumberById("whatsapp_scope")}-whatsapp-scope`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
              <ProposalWatermark proposal={proposal} />
              <ProposalCustomLetterheadBackground proposal={proposal} />
              <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("whatsapp_scope")} />

              <div className="my-auto w-full relative z-10 max-w-xl mx-auto font-sans">
                <div className="text-center border-b border-slate-200 pb-3 mb-4">
                  <span className="text-xs tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                    CLOUD API INTEGRATION & CAPABILITIES
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                    Taswiq WhatsApp Business Solution
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Version 1.0 — Direct Meta Integration, Automated Workflows & Omnichannel Chatbot Architecture
                  </p>
                </div>

                {/* Scope of Work Grid */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider mb-2 border-l-2 border-[#B8962E] pl-2">
                    Scope of Work
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(proposal.whatsappScope?.scopeOfWorkItems || []).filter(i => i.isSelected).map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="font-bold text-xs text-[#1a2744] flex items-center gap-1.5">
                          <span className="text-[#B8962E] font-bold">✓</span> {item.title}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 leading-snug">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Included Features */}
                <div>
                  <h3 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider mb-2 border-l-2 border-[#B8962E] pl-2">
                    Key Features Included
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(proposal.whatsappScope?.featuresIncluded || []).filter(f => f.isSelected).map((feat) => (
                      <div key={feat.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-start gap-2">
                        <span className="text-[#B8962E] font-bold text-xs mt-0.5">✓</span>
                        <div>
                          <div className="font-bold text-xs text-slate-800">{feat.title}</div>
                          <div className="text-[10.5px] text-slate-500 leading-snug">{feat.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("whatsapp_scope")} />
            </div>

            {/* WHATSAPP TIER COMPARISON MATRIX PAGE */}
            {proposal.whatsappScope?.includeTierComparisonMatrix !== false && (
              <div id={`page-${getPageNumberById("whatsapp_matrix")}-whatsapp-matrix`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
                <ProposalWatermark proposal={proposal} />
                <ProposalCustomLetterheadBackground proposal={proposal} />
                <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("whatsapp_matrix")} />

                <div className="my-auto w-full relative z-10 max-w-xl mx-auto font-sans">
                  <div className="text-center border-b border-slate-200 pb-2 mb-3">
                    <span className="text-[10px] tracking-widest text-[#B8962E] font-bold uppercase block">
                      SOLUTION TIER COMPARISON
                    </span>
                    <h2 className="font-serif text-xl font-bold text-[#1a2744]">
                      Taswiq Intelligent Chat Solution Matrix
                    </h2>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-[10.5px]">
                    <table className="w-full text-left font-sans">
                      <thead>
                        <tr className="bg-[#1a2744] text-white font-bold text-[10px] uppercase">
                          <th className="p-2 border-b">Feature / Specification</th>
                          <th className="p-2 border-b text-center bg-teal-900/40">Startup Plan</th>
                          <th className="p-2 border-b text-center bg-blue-900/40">Growth Plan</th>
                          <th className="p-2 border-b text-center bg-amber-900/40">Premium Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        <tr>
                          <td className="p-2 font-bold bg-slate-50">Portal Charge (Yearly)</td>
                          <td className="p-2 text-center font-bold text-teal-700 bg-teal-50/20">2,200 QR</td>
                          <td className="p-2 text-center font-bold text-blue-700 bg-blue-50/20">4,500 QR</td>
                          <td className="p-2 text-center font-bold text-amber-700 bg-amber-50/20">9,999 QR</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold bg-slate-50">API Configuration (One Time)</td>
                          <td className="p-2 text-center">500 QR</td>
                          <td className="p-2 text-center">500 QR</td>
                          <td className="p-2 text-center font-semibold text-emerald-600">FREE</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">User Agents</td>
                          <td className="p-2 text-center">3</td>
                          <td className="p-2 text-center">10</td>
                          <td className="p-2 text-center font-bold">UNLIMITED</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Contacts Limit</td>
                          <td className="p-2 text-center">5,000</td>
                          <td className="p-2 text-center">25,000</td>
                          <td className="p-2 text-center font-bold">UNLIMITED</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Interactive Chatbots</td>
                          <td className="p-2 text-center">Up to 5 (50 steps)</td>
                          <td className="p-2 text-center">Up to 15 (150 steps)</td>
                          <td className="p-2 text-center font-bold">UNLIMITED</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Broadcast Campaign Filters</td>
                          <td className="p-2 text-center">Basic Excel</td>
                          <td className="p-2 text-center">Advanced Segmentation</td>
                          <td className="p-2 text-center font-bold">AI Customer Tags</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">In-Chat Payment Collection</td>
                          <td className="p-2 text-center">✓ Enabled</td>
                          <td className="p-2 text-center">✓ Enabled</td>
                          <td className="p-2 text-center font-bold">✓ Payment Gateway Hooks</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">WhatsApp eCommerce Store</td>
                          <td className="p-2 text-center">Catalog Sync</td>
                          <td className="p-2 text-center">Full Storefront + Orders</td>
                          <td className="p-2 text-center font-bold">Odoo ERP Live Sync</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Support SLA</td>
                          <td className="p-2 text-center">Email & Chat</td>
                          <td className="p-2 text-center">Priority Phone</td>
                          <td className="p-2 text-center font-bold">24/7 Dedicated Account Lead</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("whatsapp_matrix")} />
              </div>
            )}
          </>
        ) : isServices ? (
          /* MODULAR SERVICES PAGES */
          <>
            {/* 1. WEBSITE AUDIT PAGE */}
            {(proposal.servicesScope?.selectedServices || []).includes('website_audit') && (
              <div id={`page-${getPageNumberById("service_website_audit")}-service-website-audit`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
                <ProposalWatermark proposal={proposal} />
                <ProposalCustomLetterheadBackground proposal={proposal} />
                <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("service_website_audit")} />

                <div className="my-auto w-full relative z-10 max-w-xl mx-auto font-sans">
                  <span className="text-xs tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                    SERVICE MODULE 01 — TECHNICAL AUDIT
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#1a2744] mb-3">
                    Website Audit & Health Review
                  </h2>
                  <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                    A multi-layered technical, security, SEO, and user experience evaluation designed to isolate system bottlenecks, compliance gaps, and growth opportunities.
                  </p>

                  {/* Audit Checklist Items */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                    <h4 className="text-[11px] font-bold text-[#1a2744] uppercase tracking-wider mb-3">
                      Audit Scope Coverage:
                    </h4>
                    {(() => {
                      const audit = proposal.servicesScope?.websiteAudit;
                      const items: string[] = [];
                      if (audit?.technicalAudit ?? true) items.push('Technical Architecture & Code Standards');
                      if (audit?.seoAudit ?? true) items.push('SEO Meta, Schema & Search Indexing');
                      if (audit?.performanceSpeed ?? true) items.push('Core Web Vitals & Load Speed Benchmarks');
                      if (audit?.securityAssessment ?? true) items.push('Security Vulnerabilities & SSL Inspection');
                      if (audit?.mobileResponsiveness ?? true) items.push('Mobile Viewport & Responsiveness');
                      if (audit?.uxUiReview ?? true) items.push('UX/UI Conversion & Journey Mapping');
                      if (audit?.accessibilityReview ?? true) items.push('WCAG Accessibility & Compliance');
                      if (audit?.brokenLinksError ?? true) items.push('Broken Links & Script Error Diagnostics');
                      if (audit?.cmsPluginCheck ?? true) items.push('CMS Core & Extension Compatibility');
                      if (audit?.detailedAuditReport ?? true) items.push('Executive Action Plan & Priority Matrix');

                      const customLines = (audit?.customScopeOfWork || '')
                        .split('\n')
                        .map(line => line.trim())
                        .filter(Boolean);

                      const totalItems = [...items, ...customLines];

                      if (totalItems.length === 0) {
                        return (
                          <p className="text-xs text-slate-500 italic py-1">
                            Full comprehensive technical, security, and performance audit.
                          </p>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                          {totalItems.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#B8962E] shrink-0 mt-1.5"></span>
                              <span className="text-[11px] font-medium leading-snug">{item}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Key Parameters Box */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Delivery Timeline
                      </span>
                      <strong className="text-xs text-[#1a2744] font-bold block">
                        {proposal.servicesScope?.websiteAudit?.timeline || '5 to 7 Business Days'}
                      </strong>
                    </div>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Report Format
                      </span>
                      <strong className="text-xs text-[#1a2744] font-bold block">
                        {proposal.servicesScope?.websiteAudit?.deliverablesSummary || 'PDF Audit Report & Priority Matrix'}
                      </strong>
                    </div>
                  </div>
                </div>

                <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("service_website_audit")} />
              </div>
            )}

            {/* 2. HOSTING & DOMAIN RENEWAL PAGE */}
            {(proposal.servicesScope?.selectedServices || []).includes('hosting_domain') && (
              <div id={`page-${getPageNumberById("service_hosting_domain")}-service-hosting-domain`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
                <ProposalWatermark proposal={proposal} />
                <ProposalCustomLetterheadBackground proposal={proposal} />
                <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("service_hosting_domain")} />

                <div className="my-auto w-full relative z-10 max-w-xl mx-auto font-sans">
                  <span className="text-xs tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                    SERVICE MODULE 02 — CLOUD INFRASTRUCTURE
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#1a2744] mb-3">
                    Hosting & Domain Renewal
                  </h2>
                  <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                    High-performance cloud hosting renewal and domain registry management to guarantee maximum uptime, high-speed data transmission, and active DNS resolution.
                  </p>

                  {/* Multi-Entry Hosting & Domain Renewal Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-4">
                    <div className="bg-[#1a2744] px-3.5 py-2 text-white flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8962E]">
                        Hosting Infrastructure & Domain Renewal Schedule
                      </span>
                      <span className="text-[9px] text-slate-300 font-mono">
                        {(proposal.servicesScope?.hostingDomain?.entries || []).length} Renewal Item(s)
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px]">
                            <th className="py-1.5 px-3">Domain Name</th>
                            <th className="py-1.5 px-2">Hosting Provider & Plan</th>
                            <th className="py-1.5 px-2">Renewal Date & Term</th>
                            <th className="py-1.5 px-2 text-right">Cost (QAR)</th>
                            <th className="py-1.5 px-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                          {(proposal.servicesScope?.hostingDomain?.entries || []).map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-bold text-[#1a2744] font-mono">{item.domainName || '—'}</td>
                              <td className="py-2 px-2 text-slate-700">
                                <span className="font-semibold block">{item.hostingProvider || 'Standard Provider'}</span>
                                {item.hostingPlan && <span className="text-[9px] text-slate-500 block">{item.hostingPlan}</span>}
                              </td>
                              <td className="py-2 px-2 font-mono text-slate-600">
                                <span>{item.renewalDate || '—'}</span>
                                {item.renewalDuration && <span className="text-[9px] text-slate-500 block">({item.renewalDuration})</span>}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                {formatQAR(Number(item.renewalCost) || 0)}
                              </td>
                              <td className="py-2 px-2 text-slate-500 text-[9px] truncate max-w-[130px]">
                                {item.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 flex items-center justify-between text-[10px] font-bold text-slate-800">
                      <span>Total Module Renewal Schedule</span>
                      <span className="font-mono text-[#1a2744] text-xs font-extrabold">
                        {formatQAR((proposal.servicesScope?.hostingDomain?.entries || []).reduce((sum, e) => sum + (Number(e.renewalCost) || 0), 0))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <h4 className="text-[10px] font-bold text-[#1a2744] uppercase tracking-wider mb-2">
                      Included Managed Services & Infrastructure Guarantees:
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700">
                      {[
                        'DNS Record Management & Zone File Maintenance',
                        '99.9% Uptime Guarantee with Cloud SLA',
                        'Daily & Weekly Automated Off-Site Backups',
                        'Domain Name Registry Renewal & WHOIS Privacy'
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="text-[10px] font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("service_hosting_domain")} />
              </div>
            )}

            {/* 3. SSL RENEWAL PAGE */}
            {(proposal.servicesScope?.selectedServices || []).includes('ssl_renewal') && (
              <div id={`page-${getPageNumberById("service_ssl_renewal")}-service-ssl-renewal`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
                <ProposalWatermark proposal={proposal} />
                <ProposalCustomLetterheadBackground proposal={proposal} />
                <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("service_ssl_renewal")} />

                <div className="my-auto w-full relative z-10 max-w-xl mx-auto font-sans">
                  <span className="text-xs tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                    SERVICE MODULE 03 — SECURITY ENCRYPTION
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#1a2744] mb-3">
                    SSL Security Certificate Renewal
                  </h2>
                  <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                    Deployment of enterprise RSA security encryption certificates to establish HTTPS trust, prevent browser warning banners, and protect user data transmissions.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-600">Certificate Standard:</span>
                      <span className="text-xs font-bold text-[#1a2744] font-mono">{proposal.servicesScope?.sslRenewal?.sslType || '2048-bit RSA Encryption SSL'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-600">Validity Period:</span>
                      <span className="text-xs font-bold text-[#1a2744]">{proposal.servicesScope?.sslRenewal?.sslYears || 1} Year Certificate Coverage</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Installation & Configuration:</span>
                      <span className="text-xs font-bold text-emerald-600">Full Server CSR Key Setup & Binding Included</span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                      Security & SEO Benefits
                    </h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Ensures padlock browser validation, encrypts contact form transmissions, fulfills PCI compliance baselines, and maintains Google search engine ranking signals.
                    </p>
                  </div>
                </div>

                <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("service_ssl_renewal")} />
              </div>
            )}

            {/* 4. AMC PAGE */}
            {(proposal.servicesScope?.selectedServices || []).includes('amc') && (
              <div id={`page-${getPageNumberById("service_amc")}-service-amc`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
                <ProposalWatermark proposal={proposal} />
                <ProposalCustomLetterheadBackground proposal={proposal} />
                <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("service_amc")} />

                <div className="my-auto w-full relative z-10 max-w-xl mx-auto font-sans">
                  <span className="text-xs tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                    SERVICE MODULE 04 — MAINTENANCE SLA
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#1a2744] mb-3">
                    Annual Maintenance Contract (AMC)
                  </h2>
                  <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                    Comprehensive technical support and preventive maintenance to keep your web assets updated, secure, optimized, and fully operational throughout the year.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Contract Term</span>
                      <strong className="text-xs text-[#1a2744]">{proposal.servicesScope?.amc?.contractPeriod || '12 Months Annual Contract'}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Monthly Tech Support</span>
                      <strong className="text-xs text-[#1a2744]">{proposal.servicesScope?.amc?.supportHoursMonthly || 'Up to 5 Hours / Month'}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                    <h4 className="text-[11px] font-bold text-[#1a2744] uppercase tracking-wider mb-2">
                      Routine AMC Service Checklist:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                      {[
                        'CMS Core & Framework Updates',
                        'Plugin & Extension Version Upgrades',
                        'Active Malware & Security Scanning',
                        'Website Health & Speed Checkups',
                        'Rapid Bug Fixes & Technical Troubleshooting',
                        'Content Updates & Minor Layout Edits',
                        'Automated Offsite Database Backups',
                        'SLA Priority Ticket Escalation'
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="text-[11px] font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#1a2744] text-white rounded-xl text-xs flex items-center justify-between">
                    <span>Target Response Time SLA:</span>
                    <strong className="text-[#B8962E] font-mono">{proposal.servicesScope?.amc?.responseTimeSLA || 'Within 24 Hours'}</strong>
                  </div>
                </div>

                <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("service_amc")} />
              </div>
            )}

            {/* 4b. AMC SCOPE EXCLUSIONS PAGE */}
            {(proposal.servicesScope?.selectedServices || []).includes('amc') && (
              <div id={`page-${getPageNumberById("service_amc_exclusions")}-service-amc-exclusions`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
                <ProposalWatermark proposal={proposal} />
                <ProposalCustomLetterheadBackground proposal={proposal} />
                <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("service_amc_exclusions")} />

                <div className="my-auto w-full relative z-10 max-w-xl mx-auto font-sans">
                  <span className="text-xs tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                    AMC BOUNDARIES & POLICIES
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#1a2744] mb-2">
                    AMC Scope Exclusions (Not Included)
                  </h2>
                  <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                    The Annual Maintenance Contract (AMC) covers regular website maintenance, updates, security checks, backups, and minor technical fixes. The following services are not included under the AMC scope and will be considered as separate projects with additional quotations:
                  </p>

                  {/* Exclusions Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700 mb-3">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> Major Website Restructuring
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        Complete restructuring of website pages, navigation, user flow, or overall website architecture & layout redesign.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> Website Redesign & UI/UX
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        Complete redesign, theme changes, design framework, branding elements, visual identity, or major UI/UX changes.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> New Feature Development
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        Development of new modules, advanced functionalities, custom plugins, integrations, or complex coding.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> Content Creation & Updates
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        New website content, articles, SEO copy, large-scale content migration, photography, or media production.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> New Page Development
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        Creation of additional website pages, landing pages, campaign pages, or new service sections.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> E-Commerce Modifications
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        Adding products in bulk, changes to payment gateways, checkout, shipping integrations, or store restructuring.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> Third-Party & Server Issues
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        Issues caused by external APIs, hosting limitations, server-side configs beyond control, or server migrations.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> Security & Malware Recovery
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        Complete website recovery after major hacking incidents or malware infections (treated as a separate project).
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> SEO & Digital Marketing
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        SEO campaigns, keyword optimization, backlink building, Google Ads, and social media marketing activities.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <span className="text-red-500 font-bold">✕</span> Additional Development Hours
                      </span>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        Any development work exceeding the agreed AMC scope or monthly allocated hours will be quoted separately.
                      </p>
                    </div>
                  </div>

                  {/* Additional Work Requests Callout */}
                  <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                    <strong className="font-bold text-amber-950 block mb-1 uppercase tracking-wider text-[10px]">
                      Additional Work Requests
                    </strong>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Any requirement outside the defined AMC scope, including website redesign, structural changes, new functionalities, integrations, or major improvements, will be assessed separately and provided as an independent quotation.
                    </p>
                  </div>
                </div>

                <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("service_amc_exclusions")} />
              </div>
            )}

            {/* 5. CUSTOM SERVICE PAGE */}
            {(proposal.servicesScope?.selectedServices || []).includes('custom_service') && (
              <div id={`page-${getPageNumberById("service_custom_service")}-service-custom-service`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
                <ProposalWatermark proposal={proposal} />
                <ProposalCustomLetterheadBackground proposal={proposal} />
                <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("service_custom_service")} />

                <div className="my-auto w-full relative z-10 max-w-xl mx-auto font-sans">
                  <span className="text-xs tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                    SERVICE MODULE — TAILORED TECHNICAL SCOPE
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#1a2744] mb-3">
                    {proposal.servicesScope?.customService?.title || 'Custom Tailored Service'}
                  </h2>
                  <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                    {proposal.servicesScope?.customService?.description || 'Customized technical solutions and dedicated deliverables tailored specifically to client requirements.'}
                  </p>

                  {/* Scope of Work Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                    <h4 className="text-[11px] font-bold text-[#1a2744] uppercase tracking-wider mb-3">
                      Detailed Scope of Work:
                    </h4>
                    <div className="space-y-2 text-xs text-slate-700">
                      {(proposal.servicesScope?.customService?.scopeOfWork || '1. Custom service implementation and technical setup.')
                        .split('\n')
                        .filter(Boolean)
                        .map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#B8962E] shrink-0 mt-1.5"></span>
                            <span className="text-xs text-slate-700 leading-relaxed font-medium">{item}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Key Deliverables & Timeline Box */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Delivery Timeline
                      </span>
                      <strong className="text-xs text-[#1a2744] font-bold block">
                        {proposal.servicesScope?.customService?.timeline || '2 to 3 Weeks'}
                      </strong>
                    </div>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Primary Deliverables
                      </span>
                      <strong className="text-xs text-[#1a2744] font-bold block">
                        {proposal.servicesScope?.customService?.deliverables || 'Configured Technical Module & Documentation'}
                      </strong>
                    </div>
                  </div>

                  {proposal.servicesScope?.customService?.termsConditions && (
                    <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                      <strong className="text-slate-800 font-bold block mb-0.5">Special Terms & Notes:</strong>
                      {proposal.servicesScope.customService.termsConditions}
                    </div>
                  )}
                </div>

                <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("service_custom_service")} />
              </div>
            )}
          </>
        ) : isBranding ? (
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

                  {/* Tech stack: display as a single-row grid of labelled badges */}
                  {(() => {
                    const currentFwConfig = getCMSFrameworkConfig(proposal.websiteScope.cmsType);
                    return (
                      <div style={{ border: '1px solid #e0ddd5', borderRadius: '8px', backgroundColor: '#fafaf8', padding: '14px', textAlign: 'left' }}>
                        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                              SYSTEM INFRASTRUCTURE
                            </span>
                            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px' }}>
                              Provisioned Container Technology Stack
                            </h4>
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1a2744', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {proposal.websiteScope.cmsType || currentFwConfig.name}
                          </span>
                        </div>

                        {/* Responsive Grid for Container Technology Stack */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                          {[
                            { label: "Frontend", val: proposal.websiteScope.ecommerceTechStack?.website || currentFwConfig.techStack.website },
                            { label: "Mobile Apps", val: proposal.websiteScope.ecommerceTechStack?.mobile || currentFwConfig.techStack.mobile },
                            { label: "Backend API", val: proposal.websiteScope.ecommerceTechStack?.backend || currentFwConfig.techStack.backend },
                            { label: "Database", val: proposal.websiteScope.ecommerceTechStack?.database || currentFwConfig.techStack.database },
                            { label: "Hosting", val: proposal.websiteScope.ecommerceTechStack?.hosting || currentFwConfig.techStack.hosting }
                          ].map((stackIdx) => (
                            <div key={stackIdx.label} style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '6px', padding: '10px 12px', textAlign: 'left', boxSizing: 'border-box' }} className="min-w-0">
                              <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#B8962E', fontWeight: 'bold' }}>
                                {stackIdx.label}
                              </span>
                              <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#1a2744', marginTop: '4px', wordBreak: 'break-word', lineHeight: '1.3' }}>
                                {stackIdx.val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* PREMIUM WORDPRESS PLUGINS & LICENSING SECTION (for WordPress / WooCommerce) */}
                  {proposal.type === 'website' && 
                   ((proposal.websiteScope.cmsType || '').toLowerCase().includes('wordpress') || (proposal.websiteScope.cmsType || '').toLowerCase().includes('woocommerce')) && 
                   proposal.websiteScope.includeWordpressPlugins !== false && (
                    <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #1a2744', borderRadius: '8px', padding: '14px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0ddd5', paddingBottom: '6px', marginBottom: '10px' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                            LICENSED INFRASTRUCTURE & EXTENSIONS
                          </span>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a2744', margin: '2px 0 0 0', fontFamily: 'serif' }}>
                            Premium WordPress Plugins & Licensing
                          </h3>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#fafaf8', border: '1px solid #e0ddd5', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#1a2744', display: 'block' }}>
                          Plugin Usage – Licensed (Annual Renewal)
                        </span>
                        <p style={{ fontSize: '10px', color: '#4b5563', margin: '2px 0 0 0', fontStyle: 'italic' }}>
                          Pricing for all licensed plugins will be detailed separately in the Financial Section of this proposal.
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Plugin 1 */}
                        <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px' }}>
                          <h4 style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1a2744', margin: '0' }}>
                            1. Yoast SEO (Premium)
                          </h4>
                          <p style={{ fontSize: '10px', color: '#4b5563', margin: '2px 0 0 0', lineHeight: '1.45' }}>
                            Integrated to optimize on-page SEO, improve search engine visibility, generate XML sitemaps, manage metadata, and enhance overall website performance.
                          </p>
                        </div>

                        {/* Plugin 2 */}
                        <div style={{ borderLeft: '3px solid #1a2744', paddingLeft: '10px' }}>
                          <h4 style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1a2744', margin: '0' }}>
                            2. WP Rocket
                          </h4>
                          <p style={{ fontSize: '10px', color: '#4b5563', margin: '2px 0 0 0', lineHeight: '1.45' }}>
                            A premium performance optimization and caching plugin that significantly improves website loading speed, Core Web Vitals, and overall user experience.
                          </p>
                        </div>

                        {/* Plugin 3 */}
                        <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px' }}>
                          <h4 style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1a2744', margin: '0' }}>
                            3. Wordfence Security (Premium)
                          </h4>
                          <p style={{ fontSize: '10px', color: '#4b5563', margin: '2px 0 0 0', lineHeight: '1.45' }}>
                            Provides enterprise-grade website security, including firewall protection, malware scanning, brute-force attack prevention, and continuous threat monitoring.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* NOTES & ASSUMPTIONS SECTION */}
                  {proposal.type === 'website' && proposal.websiteScope.includeNotesAssumptions !== false && (
                    <div style={{ backgroundColor: '#fafaf8', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '14px', textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold', marginBottom: '4px' }}>
                        TERMS & SCOPE BOUNDARIES
                      </span>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', margin: '0 0 8px 0', fontFamily: 'serif' }}>
                        Notes & Assumptions
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#B8962E', fontWeight: 'bold', fontSize: '11px', marginTop: '1px' }}>•</span>
                          <span style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.45' }}>
                            Any additional requirements, features, or functionality not explicitly mentioned in this proposal shall be considered out of scope.
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#B8962E', fontWeight: 'bold', fontSize: '11px', marginTop: '1px' }}>•</span>
                          <span style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.45' }}>
                            Any out-of-scope work may only be undertaken after receiving written authorization and approval from <strong style={{ color: '#1a2744' }}>{proposal.clientName || 'the client'}</strong>, and will be covered under a separate Statement of Work (SOW) and commercial agreement.
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#B8962E', fontWeight: 'bold', fontSize: '11px', marginTop: '1px' }}>•</span>
                          <span style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.45' }}>
                            The client is responsible for providing the latest approved Brand Guidelines, including logos, fonts, colour palette, imagery, and brand assets before the design phase commences.
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#B8962E', fontWeight: 'bold', fontSize: '11px', marginTop: '1px' }}>•</span>
                          <span style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.45' }}>
                            Please be advised that this proposal does not include the cost or purchase of any premium plugins or third-party licenses. Our development scope is strictly limited to the use of such plugins that are either bundled with the selected theme or freely available.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}


                </div>
              </div>

              <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("scope_setup")} />
            </div>

            {/* 2. Dynamic Progressive Scope Blueprint Pages */}
            {(() => {
              const activeItems = (proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.filter(item => item.isSelected).length > 0)
                ? proposal.websiteScope.scopeItems.filter(item => item.isSelected)
                : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].map(item => ({ ...item, id: Math.random().toString(), isSelected: true }));
              
              const scopePages = groupScopeIntoPages(activeItems, 4);

              const webTypeLabel = proposal.websiteScope.websiteType === 'ecommerce' 
                ? 'Omnichannel E-Commerce Scope Blueprint' 
                : proposal.websiteScope.websiteType === 'dynamic' 
                ? 'Dynamic CMS Scope Blueprint' 
                : 'Static Website Scope Blueprint';

              const webTypeDesc = proposal.websiteScope.websiteType === 'ecommerce'
                ? 'Comprehensive catalog, transaction, fulfillment, and operational integration specifications.'
                : proposal.websiteScope.websiteType === 'dynamic'
                ? 'Content management, database schema, search, and dynamic publishing features.'
                : 'Core page architecture, layout templates, lead forms, and analytics setup.';

              // Map scopePages into physical document pages dynamically based on available visual capacity
              const renderedPages: React.ReactNode[] = [];
              const pageGroups = packScopePagesIntoPhysicalPageGroups(scopePages, 8.0);

              pageGroups.forEach((group, pageIdx) => {
                const pageId = `scope_progressive_${pageIdx + 1}`;
                const pNum = getPageNumberById(pageId);
                if (!pNum) return;

                renderedPages.push(
                  <div key={pageId} id={`page-${pNum}-${pageId}`} className="proposal-page relative flex flex-col justify-between overflow-hidden" style={{ boxSizing: 'border-box' }}>
                    <ProposalWatermark proposal={proposal} />
                    <ProposalCustomLetterheadBackground proposal={proposal} />
                    <ProposalPageHeader proposal={proposal} pageNumber={pNum} />

                    <div className="my-auto w-full relative z-10 py-1" style={{ padding: '0 24px', boxSizing: 'border-box' }}>
                      <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        <div style={{ textAlign: 'center', borderBottom: '1px solid #e0ddd5', paddingBottom: '8px', marginBottom: '8px' }}>
                          <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                            PROGRESSIVE SCOPE BLUEPRINT {pageGroups.length > 1 ? `(PART ${pageIdx + 1})` : ''}
                          </span>
                          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a2744', marginTop: '2px', fontFamily: 'serif' }}>
                            {webTypeLabel}
                          </h2>
                          <p style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0 0 0' }}>
                            {webTypeDesc}
                          </p>
                        </div>

                        {group.map((sPage) => (
                          <div key={sPage.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '10px', marginBottom: '4px', textAlign: 'left' }}>
                              <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                                CATEGORY
                              </span>
                              <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                                {sPage.categoryTitle} {sPage.subPageLabel ? `(${sPage.subPageLabel.toUpperCase()})` : ''}
                              </h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: sPage.items.length === 1 ? '1fr' : '1fr 1fr', gap: '10px' }}>
                              {sPage.items.map((item, itemIdx) => (
                                <div key={item.id || itemIdx} style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a2744', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#B8962E', fontWeight: 'bold' }}>✓</span> {item.title}
                                  </h4>
                                  <p style={{ fontSize: '10.5px', color: '#4b5563', lineHeight: '1.45', margin: '0' }}>
                                    {item.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'monospace', color: '#9ca3af', borderTop: '1px solid #e0ddd5', padding: '8px 24px 0 24px', marginTop: 'auto', width: '100%', boxSizing: 'border-box' }}>
                      <span>* Fully authorised work package modules ({activeItems.length} total deliverables)</span>
                      <span>Progressive Scope Blueprint</span>
                    </div>

                    <ProposalPageFooter proposal={proposal} pageNumber={pNum} />
                  </div>
                );
              });

              // Add the Going Live & Launch Blueprint Page
              const livePNum = getPageNumberById("scope_going_live");
              if (livePNum) {
                renderedPages.push(
                  <div key="scope_going_live" id={`page-${livePNum}-scope-going-live`} className="proposal-page relative flex flex-col justify-between overflow-hidden" style={{ boxSizing: 'border-box' }}>
                    <ProposalWatermark proposal={proposal} />
                    <ProposalCustomLetterheadBackground proposal={proposal} />
                    <ProposalPageHeader proposal={proposal} pageNumber={livePNum} />

                    <div className="my-auto w-full relative z-10 py-1" style={{ padding: '0 24px', boxSizing: 'border-box' }}>
                      <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        <div style={{ textAlign: 'center', borderBottom: '1px solid #e0ddd5', paddingBottom: '6px', marginBottom: '2px' }}>
                          <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8962E', fontWeight: 'bold' }}>
                            DEPLOYMENT & LAUNCH
                          </span>
                          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a2744', marginTop: '1px', fontFamily: 'serif' }}>
                            Deployment & Launch Blueprint
                          </h2>
                          <p style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', margin: '2px 0 0 0' }}>
                            Quality assurance, cross-browser validation, and live server migration protocols
                          </p>
                        </div>

                        <div style={{ backgroundColor: '#fafaf8', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '10px 14px' }}>
                          <p style={{ fontSize: '10.5px', color: '#374151', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>
                            The final phase of the website development process involves thorough testing, deployment, and official launch. We follow a structured approach to ensure optimal performance, technical stability, and a seamless user experience across platforms.
                          </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
                          
                          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ borderLeft: '3px solid #B8962E', paddingLeft: '8px' }}>
                              <h3 style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#1a2744', margin: 0, fontFamily: 'serif' }}>
                                Testing & Quality Assurance
                              </h3>
                            </div>
                            <p style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.45', margin: 0 }}>
                              Comprehensive quality assurance checks ensuring the website meets performance, functionality, compatibility, and accuracy standards.
                            </p>

                            <div>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a2744', display: 'block', marginBottom: '4px' }}>
                                The testing process includes:
                              </span>
                              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9.5px', color: '#4b5563', lineHeight: '1.45', listStyleType: 'disc' }}>
                                <li>Cross-browser compatibility testing</li>
                                <li>HTML, CSS, and API endpoint validation</li>
                                <li>Functional testing of features, forms, links, and gateways</li>
                                <li>Performance, speed, and usability checks</li>
                                <li>Verification of content accuracy and security protocols</li>
                              </ul>
                            </div>

                            <div style={{ paddingTop: '6px', borderTop: '1px dashed #e0ddd5' }}>
                              <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#1a2744', display: 'block', marginBottom: '4px' }}>
                                Optimization targets:
                              </span>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                {['Google Chrome', 'Mozilla Firefox', 'Safari', 'Microsoft Edge'].map((browser, idx) => (
                                  <div key={idx} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 6px', fontSize: '9px', fontWeight: '600', color: '#334155', textAlign: 'center' }}>
                                    {browser}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0ddd5', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ borderLeft: '3px solid #1a2744', paddingLeft: '8px' }}>
                              <h3 style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#1a2744', margin: 0, fontFamily: 'serif' }}>
                                Live Production Launch
                              </h3>
                            </div>
                            <p style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.45', margin: 0 }}>
                              Once testing and QA procedures are successfully completed, the website will be migrated from the staging environment to the live production server.
                            </p>

                            <div>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a2744', display: 'block', marginBottom: '4px' }}>
                                The launch process includes:
                              </span>
                              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9.5px', color: '#4b5563', lineHeight: '1.5', listStyleType: 'disc' }}>
                                <li style={{ marginBottom: '3px' }}>Final client approval and pre-launch checklist review</li>
                                <li style={{ marginBottom: '3px' }}>Deployment of code and database to live environment</li>
                                <li style={{ marginBottom: '3px' }}>Configuration of SSL, domain routing, and integrations</li>
                                <li>Post-launch monitoring and verification</li>
                              </ul>
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'monospace', color: '#9ca3af', borderTop: '1px solid #e0ddd5', padding: '8px 24px 0 24px', marginTop: 'auto', width: '100%', boxSizing: 'border-box' }}>
                      <span>* Fully authorised work package modules</span>
                      <span>Deployment & Launch Blueprint</span>
                    </div>

                    <ProposalPageFooter proposal={proposal} pageNumber={livePNum} />
                  </div>
                );
              }

              return renderedPages;
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

            {isWhatsapp ? (
              /* WhatsApp Financials Table */
              <div className="space-y-4 mb-6">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="min-w-full text-xs font-sans">
                    <thead>
                      <tr className="bg-[#1a2744] text-white">
                        <th className="py-2.5 px-4 text-left font-bold">Component / Service Item</th>
                        <th className="py-2.5 px-4 text-left font-bold">Billing Cycle</th>
                        <th className="py-2.5 px-4 text-right font-bold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          Taswiq WhatsApp Business API Portal License
                          <div className="text-[10.5px] text-slate-500 font-normal">
                            Multi-agent dashboard, broadcast engine, mobile apps & chatbot platform ({proposal.whatsappScope?.planType?.toUpperCase() || 'STARTUP'} PLAN)
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">Yearly Subscription</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatQAR(proposal.whatsappScope?.portalYearlyCharge ?? 2200)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          One-Time API Configuration & Phone Linking Charge
                          <div className="text-[10.5px] text-slate-500 font-normal">
                            Official phone number registration, Meta Business Manager verification setup & webhook endpoints
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">One Time Charge</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatQAR(proposal.whatsappScope?.apiConfigCharge ?? 500)}
                        </td>
                      </tr>
                      <tr className="bg-teal-50/40 font-bold">
                        <td className="py-3 px-4 text-teal-900" colSpan={2}>Total Initial Portal Investment</td>
                        <td className="py-3 px-4 text-right text-teal-900 text-sm">
                          {formatQAR((proposal.whatsappScope?.portalYearlyCharge ?? 2200) + (proposal.whatsappScope?.apiConfigCharge ?? 500))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                    Meta Message Usage Charges (Direct to META):
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div className="p-2 bg-white border border-slate-200 rounded-lg">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Utility Messages</div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {formatQAR(proposal.whatsappScope?.utilityMessageRate ?? 0.05)} / message
                      </div>
                      <div className="text-[10px] text-slate-500">OTPs, notifications, order confirmations</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded-lg">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Marketing Messages</div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        {formatQAR(proposal.whatsappScope?.marketingMessageRate ?? 0.13)} / message
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">Promotions, broadcasts, offers</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1.5">
                    * Message fees are paid directly to Meta based on actual consumption via linked credit card on Meta Business Manager.
                  </p>
                </div>
              </div>
            ) : isServices ? (
              /* Modular IT Services Financials Table */
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-white shadow-xs">
                <table className="min-w-full text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="py-2.5 px-4 text-left font-semibold">Service / Deliverable Item</th>
                      <th className="py-2.5 px-4 text-left font-semibold">Deliverable Scope & Terms</th>
                      <th className="py-2.5 px-3 text-center font-semibold">Qty</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Unit Price</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-600">
                    {getModularDeliverableLineItems(proposal.servicesScope).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <div>{item.deliverableName}</div>
                          {item.moduleTitle !== item.deliverableName && (
                            <div className="text-[10px] text-slate-400 font-normal">{item.moduleTitle}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-sm">
                          {item.domainList && item.domainList.length > 0 ? (
                            <div className="space-y-1">
                              <div className="font-bold text-slate-800 text-[11px]">
                                {item.summaryLabel}
                              </div>
                              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 pl-0.5 font-mono">
                                {item.domainList.map((domain, dIdx) => (
                                  <li key={dIdx}>{domain}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="whitespace-pre-line text-[11px]">{item.scopeDescription}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                          {item.quantity} {item.unitLabel}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                          {formatQAR(item.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatQAR(item.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : isBranding ? (
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
                    {(proposal.resourceCosts || []).map((rc) => (
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

            {/* What Your Investment Covers & Milestone Timeline - Omitted for Modular IT Services */}
            {!isServices && (
              <>
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
              </>
            )}
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("financials")} />
        </div>

        {/* --- PAGE: MAINTENANCE TERMS PAGE --- */}
        <div id={`page-${getPageNumberById("maintenance_terms")}-maintenance-terms`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("maintenance_terms")} />

          <div className="my-auto w-full max-w-xl mx-auto font-sans relative z-10 px-1">
            <div className="mb-3.5">
              <span className="text-[10px] font-sans tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                POST-LAUNCH SUPPORT & COVERAGE
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Maintenance Agreement
              </h2>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                Here's what is included in your 1 year free maintenance contract:
              </p>
            </div>

            {/* Included in 1-Year Free Maintenance */}
            <div className="bg-[#fafaf8] border border-[#e0ddd5] rounded-xl p-3.5 mb-3.5">
              <div className="space-y-2 text-[10.5px] text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="text-[#B8962E] font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    Edit, revise, update or create new textural/minor graphical content.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#B8962E] font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    Web bug fixes and updates, plugin updates and enhancements.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#B8962E] font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    Consultation and guidance on using the website.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#B8962E] font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    Monitoring of website uptime and performance tuning.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#B8962E] font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    Priority support when downtime or hacking, has been identified.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#B8962E] font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    <strong className="text-[#1a2744]">{proposal.clientName || 'Mannai TechHub'}</strong> web and full and database backup.
                  </p>
                </div>
              </div>
            </div>

            {/* What is NOT included */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-1.5">
                <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                <h3 className="text-xs font-sans font-bold text-rose-900 uppercase tracking-wider">
                  What is NOT included in this agreement?
                </h3>
              </div>
              <div className="space-y-2 text-[10.5px] text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    Website redesign, new frameworks or redevelopment equaling more than 50% change to a webpage, website or web graphics.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    New Blogs, syndications, API integration, purchase of third party plugins, mobile applications, or E-Commerce shopping carts that would require a new proposal/agreement.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    <strong className="text-slate-900">Website Marketing</strong> – the scope of this contract does not include making or adding any Meta-tags, Alt-tags, Titles, Keywords or Page Descriptions. These tasks fall under the scope of Search Engine Optimization and require a different contract.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("maintenance_terms")} />
        </div>

        {/* --- PAGE: TERMS & EXCLUSIONS PAGE --- */}
        <div id={`page-${getPageNumberById("terms_exclusions")}-terms-exclusions`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("terms_exclusions")} />

          <div className="my-auto w-full max-w-xl mx-auto font-sans relative z-10 px-1">
            <div className="mb-3">
              <span className="text-[10px] font-sans tracking-widest text-[#B8962E] font-bold uppercase mb-1 block">
                COMMERCIAL CONDITIONS & BOUNDARIES
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Terms & Exclusions
              </h2>
            </div>

            {/* Terms Section */}
            <div className="bg-[#fafaf8] border border-[#e0ddd5] rounded-xl p-3.5 mb-3">
              <div className="flex items-center gap-2 mb-2 border-b border-[#e0ddd5] pb-1.5">
                <div className="h-2 w-2 rounded-full bg-[#1a2744]"></div>
                <h3 className="text-xs font-sans font-bold text-[#1a2744] uppercase tracking-wider">
                  Commercial Terms
                </h3>
              </div>
              <div className="space-y-2 text-[10.5px] text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="text-[#B8962E] font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    <strong className="text-[#1a2744]">INVOICING:</strong> 50% upfront on proposal approval and 50% on project completion and delivery.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#B8962E] font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">
                    <strong className="text-[#1a2744]">PAYMENT TERMS:</strong> Payment due within 20 days from date of invoice.
                  </p>
                </div>
              </div>
            </div>

            {/* Exclusions Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-1.5">
                <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                <h3 className="text-xs font-sans font-bold text-rose-900 uppercase tracking-wider">
                  Exclusions
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-700">
                {[
                  "Printing of any item.",
                  "Production management.",
                  "Naming registration.",
                  "Domaine name purchase.",
                  "Hosting purchase.",
                  "Utilizing any third party plugins or purchase of any plugins.",
                  "Content development-detailing / copywriting / proofreading / translation.",
                  "Purchase images from online image libraries.",
                  "Photo-shoot/Video/models.",
                  "Any third party not mentioned in the proposal.",
                  "Deliverables not mentioned in the proposal.",
                  "Search engine optimization (SEO).",
                  "Google search engine site submission.",
                  "Social media management, buying or media buying.",
                  "Font purchase.",
                  "Signage and/or signage way-finding.",
                  "Brand Management."
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold shrink-0">•</span>
                    <span className="leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <ProposalPageFooter proposal={proposal} pageNumber={getPageNumberById("terms_exclusions")} />
        </div>

        {/* --- PAGE: ACCEPTANCE PAGE --- */}
        <div id={`page-${getPageNumberById("acceptance")}-acceptance`} className="proposal-page relative flex flex-col justify-between overflow-hidden">
          {/* Background Watermark */}
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />

          {/* Top Letterhead Header */}
          <ProposalPageHeader proposal={proposal} pageNumber={getPageNumberById("acceptance")} />

          <div className="my-auto w-full max-w-xl mx-auto font-sans relative z-10">
            <span className="text-xs font-sans tracking-widest text-[#B8962E] font-bold uppercase mb-2 block">
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
                  <strong className="text-xs text-slate-800 block">{proposal.companyName || proposal.clientName || "[Client Company]"}</strong>
                  {proposal.clientPocName && (
                    <div className="mt-1 text-[10.5px] font-sans text-slate-600">
                      <span className="font-bold text-slate-700 block">{proposal.clientPocName}</span>
                      {proposal.clientPocDesignation && <span className="text-slate-400 text-[9.5px] block">{proposal.clientPocDesignation}</span>}
                      {proposal.clientPocEmail && <span className="text-slate-400 text-[9px] font-mono block">{proposal.clientPocEmail}</span>}
                    </div>
                  )}
                </div>

                <div className="h-10 border-b border-slate-200/80 border-dashed relative flex items-center justify-center font-mono text-[9px] text-slate-400 select-none">
                  (Authorized Representative Signature Stamp)
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 uppercase font-mono">
                  <span className="truncate">Sign: {proposal.clientPocName || "________________"}</span>
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
                <span style={{ color: '#1a2744', fontWeight: 'bold' }}>4480 4157</span>
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
          if (active && Array.isArray(list)) {
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
