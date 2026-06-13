/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Proposal, ProposalType, ProposalHistoryEntry, User, UserRole } from './types';
import { SAMPLE_PROPOSALS, formatQAR, createDefaultProposal } from './proposalUtils';
import ProposalWizard from './components/ProposalWizard';
import ProposalDocumentView from './components/ProposalDocumentView';
import AdminPortal from './components/AdminPortal';
import LandingPage from './components/LandingPage';
import { 
  Plus, Search, FileText, Calendar, Building, Landmark, Trash2, Edit3, Eye, 
  HelpCircle, ChevronRight, BarChart3, Database, TrendingUp, Sparkles, AlertCircle,
  LogOut
} from 'lucide-react';

function generateEditSummary(oldProp: Proposal, newProp: Proposal): string {
  const changes: string[] = [];
  if (oldProp.clientName !== newProp.clientName) {
    changes.push(`Client: "${oldProp.clientName}" → "${newProp.clientName}"`);
  }
  if (oldProp.companyName !== newProp.companyName) {
    changes.push(`Project Name: "${oldProp.companyName}" → "${newProp.companyName}"`);
  }
  if (oldProp.totalCost !== newProp.totalCost) {
    changes.push(`Value: QAR ${oldProp.totalCost.toLocaleString()} → QAR ${newProp.totalCost.toLocaleString()}`);
  }
  if (oldProp.weeks !== newProp.weeks) {
    changes.push(`Timeline: ${oldProp.weeks}w → ${newProp.weeks}w`);
  }
  if (oldProp.paymentTerms !== newProp.paymentTerms) {
    changes.push(`Payment updated`);
  }
  if (oldProp.briefDescription !== newProp.briefDescription) {
    changes.push(`Brief details refined`);
  }
  return changes.length > 0 ? changes.join(' | ') : 'General content refinements';
}


export default function App() {
  // Central proposals memory state
  const [proposals, setProposals] = useState<Proposal[]>([]);
  // Team active login session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('prowess_session_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Log login helper
  const logLoginEvent = (actor: User) => {
    const cachedLogs = localStorage.getItem('prowess_admin_logs');
    let logs = [];
    if (cachedLogs) {
      try {
        logs = JSON.parse(cachedLogs);
      } catch {
        logs = [];
      }
    }
    const newEntry = {
      id: 'log_' + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'User Login',
      details: `${actor.name} (${actor.role}) logged in securely via the main gateway landing page.`
    };
    localStorage.setItem('prowess_admin_logs', JSON.stringify([newEntry, ...logs]));
  };
  // Wizard creation/editing state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // View editable proposal in wizard
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  // Separate view screen for reading & printing document
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pre-populate database memory with sample values on load
  useEffect(() => {
    const cached = localStorage.getItem('prowess_proposals_v1');
    if (cached) {
      try {
        setProposals(JSON.parse(cached));
      } catch (err) {
        console.error("Cache parsing issues", err);
        setProposals(SAMPLE_PROPOSALS);
        localStorage.setItem('prowess_proposals_v1', JSON.stringify(SAMPLE_PROPOSALS));
      }
    } else {
      setProposals(SAMPLE_PROPOSALS);
      localStorage.setItem('prowess_proposals_v1', JSON.stringify(SAMPLE_PROPOSALS));
    }
  }, []);

  // Save proposals helper
  const handleSaveProposal = (savedProp: Proposal) => {
    setProposals(prev => {
      const idx = prev.findIndex(p => p.id === savedProp.id);
      let updated;
      if (idx !== -1) {
        const previousVer = prev[idx];
        
        // Structure history entry for tracking previous edit state
        const historyEntry: ProposalHistoryEntry = {
          versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
          timestamp: previousVer.updatedAt || previousVer.createdAt || new Date().toISOString(),
          summary: generateEditSummary(previousVer, savedProp),
          proposalState: JSON.parse(JSON.stringify(previousVer)),
        };
        
        // Prepend new history entry to preserve current state before update
        const currentHistory = previousVer.history || [];
        savedProp.history = [historyEntry, ...currentHistory];
        
        updated = [...prev];
        updated[idx] = savedProp;
      } else {
        savedProp.history = [];
        updated = [savedProp, ...prev];
      }
      localStorage.setItem('prowess_proposals_v1', JSON.stringify(updated));
      return updated;
    });
    
    // Close modal, open document in viewer of step 6/7 or direct preview in Document View
    setIsCreating(false);
    setEditingProposal(null);
    setViewingProposal(savedProp);
  };

  // Revert proposal helper
  const handleRevertProposal = (targetHistory: ProposalHistoryEntry) => {
    setProposals(prev => {
      const idx = prev.findIndex(p => p.id === targetHistory.proposalState.id);
      if (idx === -1) return prev;
      
      const currentActive = prev[idx];
      
      // We are reverting, so save current state as history entry so users can undo or track
      const historyEntry: ProposalHistoryEntry = {
        versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
        timestamp: new Date().toISOString(),
        summary: `Reverted to version ${targetHistory.versionId} (Created at ${new Date(targetHistory.timestamp).toLocaleString()})`,
        proposalState: JSON.parse(JSON.stringify(currentActive)),
      };
      
      const revertedState: Proposal = JSON.parse(JSON.stringify(targetHistory.proposalState));
      revertedState.updatedAt = new Date().toISOString();
      revertedState.history = [historyEntry, ...(currentActive.history || [])];
      
      const updated = [...prev];
      updated[idx] = revertedState;
      localStorage.setItem('prowess_proposals_v1', JSON.stringify(updated));
      
      setViewingProposal(revertedState);
      return updated;
    });
  };

  const handleDeleteProposal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this proposal from memory?")) {
      setProposals(prev => {
        const filtered = prev.filter(p => p.id !== id);
        localStorage.setItem('prowess_proposals_v1', JSON.stringify(filtered));
        return filtered;
      });
      // Clear viewing if deleted active
      if (viewingProposal?.id === id) {
        setViewingProposal(null);
      }
    }
  };

  // Launch fresh builder
  const startNewProposal = (type: ProposalType) => {
    const blank = createDefaultProposal(type);
    setEditingProposal(blank);
    setIsCreating(true);
  };

  // Pre-defined search triggers requested by user
  const searchSuggestions = [
    { label: "Show me the Mannai TechHub website proposal", query: "Show me the Mannai TechHub website proposal" },
    { label: "Pearl Capital proposal", query: "Pearl Capital proposal" },
    { label: "Show all website proposals", query: "website" },
    { label: "Value above QAR 18,000", query: "above 18000" }
  ];

  // Security Access Control: Filter proposals based on active session role cards
  const visibleProposals = proposals.filter(p => {
    if (!currentUser) return true; // Show all to non-logged users/guests by default
    if (currentUser.role === UserRole.ADMIN) return true;

    // Standard users can see proposals prepared by them, assigned to them, or explicitly shared with them
    const isPreparedBy = p.preparedByUserId === currentUser.id;
    const isAssignedTo = p.assignedUserId === currentUser.id;
    const isShared = p.sharedUserIds && p.sharedUserIds.includes(currentUser.id);

    return isPreparedBy || isAssignedTo || isShared;
  });

  // Smart conversational / natural search matching algorithm
  const getFilteredProposals = () => {
    if (!searchQuery.trim()) return visibleProposals;

    const query = searchQuery.toLowerCase().trim();

    // 1. Check if user typed the literal suggested query or conversational phrasing
    // e.g. "show me the mannai techhub website proposal"
    if (query.includes("show me") || query.includes("retrieve") || query.includes("find")) {
      // Extract main nouns
      let isWeb = query.includes("website") || query.includes("web") || query.includes("development");
      let isBrand = query.includes("branding") || query.includes("identity") || query.includes("logo");
      
      return visibleProposals.filter(p => {
        // Match client name keyword
        const nameMatch = p.clientName.toLowerCase().split(' ').some(word => query.includes(word));
        const typeMatch = (isWeb && p.type === 'website') || (isBrand && p.type === 'branding');
        
        if (nameMatch && typeMatch) return true;
        if (nameMatch) return true;
        return false;
      });
    }

    // 2. Numeric range checks (e.g. "above 15000", "over 18,000")
    if (query.includes("above") || query.includes("over") || query.includes("more than")) {
      const matchNum = query.replace(/[^\d]/g, '');
      if (matchNum) {
        const threshold = Number(matchNum);
        return visibleProposals.filter(p => p.totalCost >= threshold);
      }
    }

    // 3. Fallback standard tokenized string search (matches client name, type, dates, value)
    const terms = query.split(/\s+/);
    return visibleProposals.filter(p => {
      const typeText = p.type === 'branding' ? 'branding & identity' : 'website design & development';
      const formattedValue = formatQAR(p.totalCost).toLowerCase();
      
      return terms.every(term => 
        p.clientName.toLowerCase().includes(term) ||
        p.companyName.toLowerCase().includes(term) ||
        p.proposalDate.includes(term) ||
        typeText.includes(term) ||
        formattedValue.includes(term) ||
        p.briefDescription.toLowerCase().includes(term)
      );
    });
  };

  const filteredProposals = getFilteredProposals();

  // Metrics calculators
  const totalValueSum = visibleProposals.reduce((acc, curr) => acc + curr.totalCost, 0);
  const webProposalsCount = visibleProposals.filter(p => p.type === 'website').length;
  const brandingProposalsCount = visibleProposals.filter(p => p.type === 'branding').length;

  if (!currentUser) {
    return (
      <LandingPage
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('prowess_session_user', JSON.stringify(user));
          logLoginEvent(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* GLOBAL BANNER HEADER - Hidden during printing */}
      <header className="no-print bg-slate-900 text-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 h-9 w-9 rounded-lg flex items-center justify-center font-bold font-serif italic text-white text-lg animate-none">
              Pr
            </div>
            <div>
              <h1 className="font-serif font-bold text-base md:text-lg tracking-tight leading-none text-slate-100">
                Prowess Strategic Builder
              </h1>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">
                Automated Client Proposal Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs col-span-2 md:col-span-1">
            <span className="text-slate-400 hidden sm:inline">
              {currentUser?.name} <span className="opacity-60">({currentUser?.role})</span>
            </span>
            <span className="font-mono bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700">
              {currentUser?.email}
            </span>
            <button 
              onClick={() => {
                // Log action in audit trail before clearing session
                const cachedLogs = localStorage.getItem('prowess_admin_logs');
                let logs = [];
                if (cachedLogs) {
                  try {
                    logs = JSON.parse(cachedLogs);
                  } catch {
                    logs = [];
                  }
                }
                const newEntry = {
                  id: 'log_' + Math.random().toString(36).substring(2, 10),
                  timestamp: new Date().toISOString(),
                  userId: currentUser?.id || 'system',
                  userName: currentUser?.name || 'Anonymous User',
                  userRole: currentUser?.role || UserRole.SALES,
                  action: 'User Logout',
                  details: `${currentUser?.name} signed out securely.`
                };
                localStorage.setItem('prowess_admin_logs', JSON.stringify([newEntry, ...logs]));
                
                // Clear state & session
                localStorage.removeItem('prowess_session_user');
                setCurrentUser(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-md transition-all cursor-pointer text-[11px] font-semibold"
              title="Sign Out of Session"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* PRIMARY STAGE SCREEN SPACE */}
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 py-8 w-full">
        
        {/* VIEW 1: ACTIVE PDF DOCUMENT RENDER SCREEN */}
        {viewingProposal ? (
          <div id="full-screen-document-preview" className="space-y-4">
            <div className="no-print flex items-center gap-2 mb-2">
              <button
                onClick={() => setViewingProposal(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-600 hover:text-slate-800 hover:shadow-xs transition-shadow cursor-pointer flex items-center gap-1"
              >
                ← Back to Dashboard Directory
              </button>
              <button
                onClick={() => {
                  setEditingProposal(viewingProposal);
                  setIsCreating(true);
                  setViewingProposal(null);
                }}
                className="px-4 py-2 border border-blue-200 rounded-lg bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit / Update Proposal Details
              </button>
            </div>
            
            {/* The multi-paged printable sheet stack */}
            <ProposalDocumentView 
              proposal={viewingProposal} 
              onBack={() => setViewingProposal(null)} 
              onRevert={handleRevertProposal}
            />
          </div>
        ) : isCreating ? (
          /* VIEW 2: HIGH-FIDELITY BUILDER WIZARD */
          <div id="proposal-wizard-panel">
            <div className="no-print max-w-4xl mx-auto mb-4">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingProposal(null);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer flex items-center gap-1"
              >
                ← Discard & Return to Dashboard
              </button>
            </div>
            <ProposalWizard 
              initialProposal={editingProposal} 
              onSave={handleSaveProposal}
              onCancel={() => {
                setIsCreating(false);
                setEditingProposal(null);
              }}
            />
          </div>
        ) : (
          /* VIEW 3: RICH METRICS & SEARCH ARCHIVE DASHBOARD */
          <div id="dashboard-main-view" className="space-y-8 font-sans">
            
            {/* SaaS Metrics block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="bg-blue-50 text-blue-600 h-10 w-10 rounded-xl flex items-center justify-center shrink-0">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Stored Proposals</span>
                  <strong className="text-xl font-bold text-slate-800">{proposals.length} Saved</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="bg-emerald-50 text-emerald-600 h-10 w-10 rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Total Pipeline Value</span>
                  <strong className="text-xl font-bold text-slate-800">{formatQAR(totalValueSum)}</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="bg-amber-50 text-amber-600 h-10 w-10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Web Platforms ratio</span>
                  <strong className="text-xl font-bold text-slate-800">{webProposalsCount} Active</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="bg-sky-50 text-sky-600 h-10 w-10 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Branding Campaigns</span>
                  <strong className="text-xl font-bold text-slate-800">{brandingProposalsCount} Issued</strong>
                </div>
              </div>

            </div>

            {/* Create Proposal Selector Bar */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-slate-900 text-lg tracking-tight">
                  Design bespoke proposals instantly
                </h2>
                <p className="text-xs text-slate-500 leading-normal font-sans">
                  Choose a blueprint target below. The wizard compiles locking master pages and asks only for clients specifics.
                </p>
              </div>

              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => startNewProposal('branding')}
                  id="create-branding-proposal-btn"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-blue-400" />
                  + Branding & Identity Proposal
                </button>
                <button
                  onClick={() => startNewProposal('website')}
                  id="create-website-proposal-btn"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  + Website Development Proposal
                </button>
              </div>
            </div>

            {/* HIGH-FIDELITY TEAM COLLABORATION HUB */}
            <div className="no-print">
              <AdminPortal 
                proposals={proposals}
                onUpdateProposals={(updated) => {
                  setProposals(updated);
                  localStorage.setItem('prowess_proposals_v1', JSON.stringify(updated));
                }}
                currentUser={currentUser}
                onLoginUser={setCurrentUser}
              />
            </div>

            {/* Smart search center console */}
            <div className="space-y-4">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder='Search by client, scope or type (e.g., "Show me the Mannai TechHub website proposal")...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-xl font-sans text-xs shadow-sm bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-sha pr-8"
                  id="search-memory-input"
                />
                
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Suggestions Chips */}
              <div className="flex flex-wrap gap-2 items-center justify-center max-w-2xl mx-auto">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase shrink-0">
                  Search Prompts:
                </span>
                {searchSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(s.query)}
                    className="px-3 py-1 font-sans text-[10px] border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-600 rounded-full transition-colors cursor-pointer"
                  >
                    "{s.label}"
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results Table / Deck Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-100/50 px-4 py-2 border border-slate-200/80 rounded-lg">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  ACTIVE MEMORY DIRECTORY
                </span>
                <span className="text-xs font-sans text-slate-500">
                  Showing <strong>{filteredProposals.length}</strong> of <strong>{proposals.length}</strong> stored proposals
                </span>
              </div>

              {filteredProposals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProposals.map((prop) => {
                    const isB = prop.type === 'branding';
                    return (
                      <div 
                        key={prop.id}
                        onClick={() => setViewingProposal(prop)}
                        className="bg-white border border-slate-200 p-5 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
                      >
                        {/* Type Tag indicator */}
                        <div className="absolute top-5 right-5 flex flex-col items-end gap-1.5">
                          <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase leading-none ${
                            isB ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isB ? "Identity" : "Website"}
                          </span>
                          <span className={`text-[8.5px] font-sans font-bold px-2 py-0.5 border rounded-full leading-none uppercase ${
                            prop.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            prop.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            prop.status === 'Under Process' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            prop.status === 'Under Review' ? 'bg-amber-50 text-amber-750 border-amber-200' :
                            prop.status === 'Awaiting Client Feedback' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                            'bg-slate-100 text-slate-600 border-slate-205'
                          }`}>
                            {prop.status || 'Draft'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-mono text-[10px] mr-1">{prop.proposalDate}</span>
                            {prop.assignedUserName && (
                              <span className="text-[9.5px] bg-slate-100/80 text-slate-600 font-sans px-1.5 py-0.5 rounded border border-slate-200 leading-none">
                                Lead: {prop.assignedUserName}
                              </span>
                            )}
                          </div>

                          <h3 className="font-serif font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">
                            {prop.clientName || "Unnamed Client"}
                          </h3>
                          <p className="font-sans text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">
                            {prop.companyName || (isB ? "Branding Strategy Suite" : "Custom Web Project")}
                          </p>
                          
                          <p className="text-slate-400 text-[10px] italic font-sans mt-3 line-clamp-2 border-l-2 border-slate-100 pl-2">
                            "{prop.briefDescription || "Bespoke production strategic deck targeting operational deadlines and conversion metrics."}"
                          </p>
                        </div>

                        {/* Specs grid */}
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block">Contract Value</span>
                            <strong className="text-sm font-sans font-extrabold text-blue-700 mt-0.5">
                              {formatQAR(prop.totalCost)} QAR
                            </strong>
                          </div>

                          <div className="flex gap-1">
                            {/* View block */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingProposal(prop);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-md transition-colors"
                              title="Render PDF"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            {/* Edit block */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProposal(prop);
                                setIsCreating(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-md transition-colors"
                              title="Modify Proposal"
                            >
                              <Edit3 className="h-4.5 w-4.5" />
                            </button>
                            {/* Delete block */}
                            <button
                              onClick={(e) => handleDeleteProposal(prop.id, e)}
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-md transition-colors animate-none"
                              title="Delete from memory"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty state */
                <div className="p-12 text-center bg-white border border-slate-200 border-dashed rounded-2xl max-w-md mx-auto">
                  <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h4 className="text-slate-800 font-sans font-bold text-xs">No matching proposals retrieved</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans pr-2 pl-2">
                    Our dynamic memory indexing returns zero matches for <strong>"{searchQuery}"</strong>. Ensure keywords match clients, dates or sitemap scopes, or click a prefilled prompt chip to clear.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-3.5 py-1 text-xs border border-blue-200 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    Reset Query Engine
                  </button>
                </div>
              )}
            </div>

            {/* Workflow information assist box */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
              <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans font-bold text-slate-800 text-xs">
                  Understanding Proposal Workflow Automation
                </h4>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed mt-1 pr-6">
                  Locked templates represent official legal and operational standards (Approach, Methodology, Exclusion terms etc.) automatically merged during compilation. You only define details that vary per client (Company Name, Weeks duration, active sitemaps, budgeting allocation). Saved entries are stored locally on-device and mapped into the retrieval search bar instantly.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER - Hidden during printing */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 text-slate-400 text-xs text-center mt-8 font-sans">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Prowess Strategic Builder. All rights reserved. Registered trademark of Qatar.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Security Cert</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Data Policy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
