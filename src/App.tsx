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
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [dbStatusDetails, setDbStatusDetails] = useState<string>("Detecting connection...");

  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'users' | 'reminders' | 'logs' | 'payments'>('overview');

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
  const logLoginEvent = async (actor: User) => {
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

    try {
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
    } catch (err) {
      console.warn("Could not push login activity to database server.");
    }
  };
  // Wizard creation/editing state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // View editable proposal in wizard
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  // Separate view screen for reading & printing document
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  const [proposalViewTab, setProposalViewTab] = useState<'document' | 'history' | 'payment'>('document');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pre-populate database memory with sample values on load
  useEffect(() => {
    async function loadDataAndVerifyDb() {
      try {
        // Test database status
        const dbTestRes = await fetch('/api/proposals/test-db');
        const dbTestData = await dbTestRes.json();
        
        if (dbTestData && dbTestData.success) {
          setIsDbConnected(true);
          setDbStatusDetails("Hostinger Connected");
        } else {
          setIsDbConnected(false);
          setDbStatusDetails(dbTestData?.message || "Missing configs");
        }

        // Fetch proposals from API
        const response = await fetch('/api/proposals');
        if (response.ok) {
          const rawProposalsList = await response.json();
          if (Array.isArray(rawProposalsList) && rawProposalsList.length > 0) {
            // Unpack database JSON records safely and normalize field casing
            const unpackedProposalsList = rawProposalsList.map((item: any) => ({
              id: item.id,
              type: item.type,
              status: item.status,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              clientName: item.client_name,
              companyName: item.company_name,
              proposalDate: item.proposal_date,
              briefDescription: item.brief_description,
              brandingScope: typeof item.branding_scope === 'string' ? JSON.parse(item.branding_scope) : (item.branding_scope || {}),
              websiteScope: typeof item.website_scope === 'string' ? JSON.parse(item.website_scope) : (item.website_scope || {}),
              milestones: typeof item.milestones === 'string' ? JSON.parse(item.milestones) : (item.milestones || []),
              resourceCosts: typeof item.resource_costs === 'string' ? JSON.parse(item.resource_costs) : (item.resource_costs || []),
              weeks: item.weeks,
              developmentCost: parseFloat(item.development_cost || 0),
              pluginCost: parseFloat(item.plugin_cost || 0),
              maintenanceCost: parseFloat(item.maintenance_cost || 0),
              additionalCost: parseFloat(item.additional_cost || 0),
              totalCost: parseFloat(item.total_cost || 0),
              paymentTerms: item.payment_terms,
              preparedByName: item.prepared_by_name,
              preparedByCompany: item.prepared_by_company,
              preparedByTitle: item.prepared_by_title,
              preparedByUserId: item.prepared_by_user_id,
              assignedUserId: item.assigned_user_id,
              assignedUserName: item.assigned_user_name,
              sharedUserIds: typeof item.shared_user_ids === 'string' ? JSON.parse(item.shared_user_ids) : (item.shared_user_ids || []),
              paymentEntries: typeof item.payment_entries === 'string' ? JSON.parse(item.payment_entries) : (item.payment_entries || []),
              customLetterhead: item.custom_letterhead,
              letterheadHeight: item.letterhead_height,
              letterheadMode: item.letterhead_mode,
              letterheadFullPage: item.letterhead_full_page === 1,
              showWatermark: item.show_watermark === 1,
              customWatermarkText: item.custom_watermark_text,
            }));
            
            setProposals(unpackedProposalsList);
            localStorage.setItem('prowess_proposals_v1', JSON.stringify(unpackedProposalsList));
            return;
          }
        }
      } catch (err: any) {
        console.warn("Could not leverage Hostinger MySQL backend, relying on local state cache:", err.message);
        setDbStatusDetails("Offline Mode");
      }

      // Offline Cache Fallback load
      const cached = localStorage.getItem('prowess_proposals_v1');
      if (cached) {
        try {
          setProposals(JSON.parse(cached));
        } catch (err) {
          setProposals(SAMPLE_PROPOSALS);
          localStorage.setItem('prowess_proposals_v1', JSON.stringify(SAMPLE_PROPOSALS));
        }
      } else {
        setProposals(SAMPLE_PROPOSALS);
        localStorage.setItem('prowess_proposals_v1', JSON.stringify(SAMPLE_PROPOSALS));
      }
    }
    
    loadDataAndVerifyDb();
  }, []);

  // Save proposals helper
  const handleSaveProposal = async (savedProp: Proposal) => {
    // Ensure proposal is bound to the logged-in user if it does not have a creator or assignee set
    if (currentUser) {
      if (!savedProp.preparedByUserId) {
        savedProp.preparedByUserId = currentUser.id;
        if (!savedProp.preparedByName) {
          savedProp.preparedByName = currentUser.name;
        }
        if (!savedProp.preparedByCompany) {
          savedProp.preparedByCompany = "Astra Technologies";
        }
        if (!savedProp.preparedByTitle) {
          savedProp.preparedByTitle = currentUser.role === UserRole.SALES ? "Sales Executive" : currentUser.role;
        }
      }
      if (!savedProp.assignedUserId) {
        savedProp.assignedUserId = currentUser.id;
        if (!savedProp.assignedUserName) {
          savedProp.assignedUserName = currentUser.name;
        }
      }
    }

    // A. Update local React state instantly for high responsiveness
    setProposals(prev => {
      const idx = prev.findIndex(p => p.id === savedProp.id);
      let updated;
      if (idx !== -1) {
        const previousVer = prev[idx];
        
        const isAdmin = currentUser?.role === UserRole.ADMIN;
        const summary = generateEditSummary(previousVer, savedProp) + (isAdmin ? ` (Approved/Draft updated by Admin: ${currentUser.name})` : '');
        
        // Structure history entry for tracking previous edit state
        const historyEntry: ProposalHistoryEntry = {
          versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
          timestamp: previousVer.updatedAt || previousVer.createdAt || new Date().toISOString(),
          summary,
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

    // B. Push proposal payload to the backend database server asynchronously
    try {
      const saveRes = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(savedProp)
      });
      
      if (saveRes.ok) {
        // Successful DB synchronization, log client activity audit in background
        const logEntry = {
          id: 'log_' + Math.random().toString(36).substring(2, 10),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id,
          userName: currentUser?.name || 'System',
          userRole: currentUser?.role || UserRole.SALES,
          action: 'Modify Proposal',
          details: `Synchronized ${savedProp.type === 'branding' ? 'branding' : 'website'} proposal ID "${savedProp.id}" for client "${savedProp.clientName}" successfully in Hostinger MySQL.`
        };
        
        await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      }
    } catch (dbErr: any) {
      console.warn("Could not store proposal in backend database:", dbErr.message);
    }
    
    // Close modal, open document in viewer of step 6/7 or direct preview in Document View
    setIsCreating(false);
    setEditingProposal(null);
    setViewingProposal(savedProp);
  };

  // Revert proposal helper
  const handleRevertProposal = async (targetHistory: ProposalHistoryEntry) => {
    let revertedState: Proposal | null = null;
    
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
      
      const reverted: Proposal = JSON.parse(JSON.stringify(targetHistory.proposalState));
      reverted.updatedAt = new Date().toISOString();
      reverted.history = [historyEntry, ...(currentActive.history || [])];
      
      revertedState = reverted;
      
      const updated = [...prev];
      updated[idx] = reverted;
      localStorage.setItem('prowess_proposals_v1', JSON.stringify(updated));
      
      setViewingProposal(reverted);
      return updated;
    });

    if (revertedState) {
      try {
        await fetch('/api/proposals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(revertedState)
        });
      } catch (err: any) {
        console.warn("Could not save reverted state to database server:", err.message);
      }
    }
  };

  const handleDeleteProposal = async (id: string, e: React.MouseEvent) => {
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

      try {
        await fetch(`/api/proposals/${id}`, {
          method: 'DELETE'
        });

        // Register deletion log
        const logEntry = {
          id: 'log_' + Math.random().toString(36).substring(2, 10),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id,
          userName: currentUser?.name || 'System',
          userRole: currentUser?.role || UserRole.SALES,
          action: 'Delete Proposal',
          details: `Permanently deleted proposal ID "${id}" from database.`
        };

        await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      } catch (err: any) {
        console.warn("Could not delete from backend database:", err.message);
      }
    }
  };

  // Launch fresh builder
  const startNewProposal = (type: ProposalType) => {
    const blank = createDefaultProposal(type);
    if (currentUser) {
      blank.preparedByUserId = currentUser.id;
      blank.preparedByName = currentUser.name;
      blank.preparedByCompany = "Astra Technologies";
      blank.preparedByTitle = currentUser.role === UserRole.SALES ? "Sales Executive" : currentUser.role;
      blank.assignedUserId = currentUser.id;
      blank.assignedUserName = currentUser.name;
    }
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
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) return true;

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
    <div className="min-h-screen bg-[#030712] flex flex-col justify-between text-slate-100">
      
      {/* GLOBAL BANNER HEADER - Hidden during printing */}
      <header className="no-print bg-[#0a0f1d] border-b border-[#162035] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center font-extrabold text-slate-950 text-base shadow-sm font-sans">
              A
            </div>
            <div>
              <span className="font-sans font-bold text-white text-sm md:text-base tracking-wider uppercase block leading-none">
                Astra Team Hub
              </span>
              <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest block mt-1.5 leading-none">
                Admin Portal
              </span>
            </div>
            <div className="hidden lg:block border-l border-slate-800 h-6 mx-2"></div>
            <div className="hidden lg:block font-mono text-[9px] text-slate-400 tracking-widest uppercase">
              Secure Administrative Controller & Collaborative Logging Systems
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] bg-slate-900 border border-slate-800 text-slate-400 rounded-md font-mono">
              <span className={`h-1.5 w-1.5 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isDbConnected ? 'Hostinger DB' : 'Offline Cache'}
            </span>
            
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="h-6 w-6 rounded-full bg-slate-800 text-amber-500 flex items-center justify-center text-[10px] font-extrabold font-sans">
                {currentUser ? currentUser.name.split(' ').map(n=>n[0]).join('') : 'NJ'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-white font-medium">{currentUser ? currentUser.name : 'Unknown'}</span>
                <span className="text-[8px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                  {currentUser ? currentUser.role : 'Guest'}
                </span>
              </div>
            </div>

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
              className="p-2 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-450 border border-slate-800 hover:border-rose-500/20 rounded-xl transition-all cursor-pointer"
              title="Sign out of portal"
            >
              <LogOut className="h-4 w-4" />
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
              currentUser={currentUser}
              initialTab={proposalViewTab}
              onUpdateProposal={(updated) => {
                setProposals(prev => {
                  const idx = prev.findIndex(p => p.id === updated.id);
                  if (idx === -1) return prev;
                  const previousVer = prev[idx];
                  
                  let finalizedUpdated = { ...updated };
                  
                  const isUserAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;
                  if (isUserAdmin) {
                    const prevHistoryLen = (previousVer.history || []).length;
                    const nextHistoryLen = (updated.history || []).length;
                    
                    if (prevHistoryLen === nextHistoryLen) {
                      const historyEntry: ProposalHistoryEntry = {
                        versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
                        timestamp: new Date().toISOString(),
                        summary: `Administrative Update: Visual configuration / document styles customized (Modified by Admin/Manager: ${currentUser.name})`,
                        proposalState: JSON.parse(JSON.stringify(previousVer)),
                      };
                      finalizedUpdated.history = [historyEntry, ...(previousVer.history || [])];
                      finalizedUpdated.updatedAt = new Date().toISOString();
                    }
                  }
                  
                  const updatedList = prev.map(p => p.id === updated.id ? finalizedUpdated : p);
                  localStorage.setItem('prowess_proposals_v1', JSON.stringify(updatedList));
                  
                  // Instantly update current view page
                  setViewingProposal(finalizedUpdated);
                  
                  // Synchronize proposal state in host database dynamically
                  fetch('/api/proposals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalizedUpdated)
                  }).catch(err => console.warn("Failed to update proposal state in database:", err.message));
                  
                  return updatedList;
                });
              }}
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
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-[#0b101f] border border-[#1a2235] p-5 rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] tracking-widest font-mono text-[#d3af00] uppercase font-bold block mb-1">Stored Proposals</span>
                    <strong className="text-2xl font-extrabold text-white">{proposals.length} <span className="text-slate-400 text-xs font-normal font-sans">Saved</span></strong>
                  </div>
                  <div className="bg-[#d3af00]/10 text-[#d3af00] h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-[#d3af00]/20">
                    <Database className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-[#0b101f] border border-[#1a2235] p-5 rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] tracking-widest font-mono text-[#d3af00] uppercase font-bold block mb-1">Total Pipeline Value</span>
                    <strong className="text-2xl font-extrabold text-[#efbc00]">{formatQAR(totalValueSum)}</strong>
                  </div>
                  <div className="bg-[#d3af00]/10 text-[#d3af00] h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-[#d3af00]/20">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-[#0b101f] border border-[#1a2235] p-5 rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] tracking-widest font-mono text-[#d3af00] uppercase font-bold block mb-1">Web Platforms ratio</span>
                    <strong className="text-2xl font-extrabold text-white">{webProposalsCount} <span className="text-slate-400 text-xs font-normal font-sans">Active</span></strong>
                  </div>
                  <div className="bg-[#d3af00]/10 text-[#d3af00] h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-[#d3af00]/20">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-[#0b101f] border border-[#1a2235] p-5 rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] tracking-widest font-mono text-[#d3af00] uppercase font-bold block mb-1">Branding Campaigns</span>
                    <strong className="text-2xl font-extrabold text-white">{brandingProposalsCount} <span className="text-slate-400 text-xs font-normal font-sans">Issued</span></strong>
                  </div>
                  <div className="bg-[#d3af00]/10 text-[#d3af00] h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-[#d3af00]/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

              </div>
            )}

            {/* Create Proposal Selector Bar */}
            {activeTab === 'overview' && (
              <div className="bg-gradient-to-r from-[#0d1222] to-[#070b14] border border-[#1b253b] p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="font-sans font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                    Design bespoke proposals instantly
                  </h2>
                  <p className="text-xs text-slate-400 leading-normal font-sans mt-0.5">
                    Choose a blueprint target below. The wizard compiles locking master pages and asks only for clients specifics.
                  </p>
                </div>

                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => startNewProposal('branding')}
                    id="create-branding-proposal-btn"
                    className="px-4 py-2.5 bg-[#12192c] hover:bg-[#18233f] text-slate-200 hover:text-white font-sans font-bold text-xs rounded-xl shadow-sm border border-[#202b45] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4 text-amber-500" />
                    Branding & Identity Proposal
                  </button>
                  <button
                    onClick={() => startNewProposal('website')}
                    id="create-website-proposal-btn"
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4 text-slate-950" />
                    Website Development Proposal
                  </button>
                </div>
              </div>
            )}

            {/* HIGH-FIDELITY TEAM COLLABORATION HUB */}
            <div className="no-print">
              <AdminPortal 
                proposals={proposals}
                onUpdateProposals={(updated) => {
                  const processedUpdated = updated.map(updatedProp => {
                    const originalProp = proposals.find(p => p.id === updatedProp.id);
                    if (originalProp) {
                      const hasChanged = originalProp.status !== updatedProp.status || 
                                         originalProp.assignedUserId !== updatedProp.assignedUserId || 
                                         JSON.stringify(originalProp.sharedUserIds || []) !== JSON.stringify(updatedProp.sharedUserIds || []);
                                         
                      if (hasChanged) {
                        const isUserAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;
                        const roleLabel = isUserAdmin ? 'Administrative Control' : 'Account Lead';
                        
                        const historyEntry: ProposalHistoryEntry = {
                          versionId: Math.random().toString(36).substring(2, 10).toUpperCase(),
                          timestamp: new Date().toISOString(),
                          summary: `${roleLabel} Update: Status: ${originalProp.status || 'Draft'} → ${updatedProp.status || 'Draft'}` + 
                                   (originalProp.assignedUserId !== updatedProp.assignedUserId ? `, Assignee updated` : '') + 
                                   ` (Modified by ${currentUser?.name || 'User'} [${currentUser?.role || 'Guest'}])`,
                          proposalState: JSON.parse(JSON.stringify(originalProp)),
                        };
                        const currentHistory = originalProp.history || [];
                        return {
                          ...updatedProp,
                          history: [historyEntry, ...currentHistory],
                          updatedAt: new Date().toISOString()
                        };
                      }
                    }
                    return updatedProp;
                  });

                  setProposals(processedUpdated);
                  localStorage.setItem('prowess_proposals_v1', JSON.stringify(processedUpdated));

                  // Asynchronously push any modified proposals to the backend MySQL database
                  processedUpdated.forEach(async (updatedProp) => {
                    const originalProp = proposals.find(p => p.id === updatedProp.id);
                    if (!originalProp || 
                        originalProp.status !== updatedProp.status || 
                        originalProp.assignedUserId !== updatedProp.assignedUserId || 
                        JSON.stringify(originalProp.sharedUserIds || []) !== JSON.stringify(updatedProp.sharedUserIds || []) ||
                        originalProp.updatedAt !== updatedProp.updatedAt) {
                      
                      try {
                        await fetch('/api/proposals', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updatedProp)
                        });
                      } catch (err: any) {
                        console.warn("Could not save updated proposal to database:", err.message);
                      }
                    }
                  });
                }}
                currentUser={currentUser}
                onLoginUser={setCurrentUser}
                onViewProposalDetail={(prop, tab) => {
                  setViewingProposal(prop);
                  setProposalViewTab(tab || 'document');
                }}
                activeTab={activeTab}
                onActiveTabChange={setActiveTab}
              />
            </div>
            
            {/* Smart search center console */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder='Search by client, scope or type (e.g., "Show me the Mannai TechHub website proposal")...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-20 py-3.5 bg-[#090d16] border border-[#1b2539] hover:border-amber-500/30 text-white rounded-xl font-sans text-xs shadow-sm placeholder-slate-550 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#d3af00]/20 focus:border-[#d3af00] transition-all"
                    id="search-memory-input"
                  />
                  
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-200 transition-colors uppercase font-mono font-bold tracking-wider"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Suggestions Chips */}
                <div className="flex flex-wrap gap-2 items-center justify-center max-w-2xl mx-auto">
                  <span className="text-[9px] font-bold text-slate-500 font-mono uppercase shrink-0 tracking-wider">
                    Recent Queries:
                  </span>
                  {searchSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSearchQuery(s.query)}
                      className="px-3 py-1 font-sans text-[10px] border border-[#182132] hover:border-amber-500/30 bg-[#0b101e] hover:bg-[#12192f] text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results Table / Deck Grid */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#070b15] px-4 py-2 border border-[#141d30] rounded-xl text-xs font-mono">
                  <span className="font-bold text-[#d3af00] tracking-wider">
                    ACTIVE MEMORY DIRECTORY
                  </span>
                  <span className="text-slate-400 font-sans">
                    Showing <strong className="text-white font-bold">{filteredProposals.length}</strong> of <strong className="text-white font-bold">{proposals.length}</strong> stored proposals
                  </span>
                </div>

                {filteredProposals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProposals.map((prop) => {
                      const isB = prop.type === 'branding';
                      return (
                        <div 
                          key={prop.id}
                          onClick={() => {
                            setProposalViewTab('document');
                            setViewingProposal(prop);
                          }}
                          className="bg-[#0b101f] border border-[#1a2235] p-5 rounded-2xl hover:border-amber-500/50 hover:shadow-lg transition-all cursor-pointer relative group flex flex-col justify-between"
                        >
                          {/* Type Tag indicator */}
                          <div className="absolute top-5 right-5 flex flex-col items-end gap-1.5">
                            <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded uppercase leading-none ${
                              isB ? 'bg-cyan-500/10 text-cyan-405 text-cyan-400 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-405 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isB ? "Identity" : "Website"}
                            </span>
                            <span className={`text-[8.5px] font-sans font-bold px-2 py-0.5 border rounded leading-none uppercase ${
                              prop.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              prop.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              prop.status === 'Under Process' ? 'bg-[#d3af00]/10 text-amber-500 border border-amber-500/20' :
                              prop.status === 'Under Review' ? 'bg-slate-500/10 text-slate-450 text-slate-400 border-slate-550 border-slate-700' :
                              prop.status === 'Awaiting Client Feedback' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                              'bg-slate-800 text-slate-400 border-slate-750'
                            }`}>
                              {prop.status || 'Draft'}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-slate-450 text-slate-450 text-slate-400 text-xs mb-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-500" />
                              <span className="font-mono text-[10px] mr-1">{prop.proposalDate}</span>
                              {prop.assignedUserName && (
                                <span className="text-[9px] bg-[#11182c] text-amber-500 font-semibold px-2 py-0.5 rounded border border-[#1c294a] leading-none uppercase font-mono tracking-wider">
                                  Lead: {prop.assignedUserName}
                                </span>
                              )}
                            </div>

                            <h3 className="font-sans font-extrabold text-white text-base leading-tight group-hover:text-amber-500 transition-colors mt-2.5">
                              {prop.clientName || "Unnamed Client"}
                            </h3>
                            <p className="font-sans text-[11.5px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
                              {prop.companyName || (isB ? "Branding Strategy Suite" : "Custom Web Project")}
                            </p>
                            
                            <p className="text-slate-400 text-[10.5px] italic font-sans mt-3 line-clamp-2 border-l-2 border-[#d3af00]/20 pl-3">
                              "{prop.briefDescription || "Bespoke production strategic deck targeting operational deadlines and conversion metrics."}"
                            </p>
                          </div>

                          {/* Specs grid */}
                          <div className="mt-5 pt-4 border-t border-[#1a2235] flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Contract Value</span>
                              <strong className="text-sm font-sans font-extrabold text-[#efbc00] mt-0.5">
                                {formatQAR(prop.totalCost)} QAR
                              </strong>
                            </div>

                            <div className="flex gap-1">
                              {/* View block */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProposalViewTab('document');
                                  setViewingProposal(prop);
                                }}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
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
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-500 rounded-md border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                                title="Modify Proposal"
                              >
                                <Edit3 className="h-4.5 w-4.5" />
                              </button>
                              {/* Delete block */}
                              <button
                                onClick={(e) => handleDeleteProposal(prop.id, e)}
                                className="p-1.5 hover:bg-rose-950/20 text-slate-405 text-slate-400 hover:text-rose-450 hover:text-rose-400 rounded-md border border-transparent hover:border-rose-900/30 transition-colors cursor-pointer"
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
                  <div className="p-12 text-center bg-[#070b15] border border-[#141d30] border-dashed rounded-2xl max-w-md mx-auto">
                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                    <h4 className="text-white font-sans font-bold text-xs">No matching proposals retrieved</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans pr-2 pl-2">
                      Our dynamic memory indexing returns zero matches for <strong>"{searchQuery}"</strong>. Ensure keywords match clients, dates or sitemap scopes, or click a prefilled prompt chip to clear.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-3.5 py-1 text-xs border border-slate-704 border-slate-700 hover:bg-slate-850 hover:border-amber-500 text-slate-300 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      Reset Query Engine
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Workflow information assist box */}
            {activeTab === 'overview' && (
              <div className="bg-[#0b101f] border border-[#1a2235] rounded-xl p-5 flex items-start gap-4 shadow-md">
                <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-sans font-bold text-white text-xs">
                    Understanding Proposal Workflow Automation
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed mt-1 pr-6">
                    Locked templates represent official legal and operational standards (Approach, Methodology, Exclusion terms etc.) automatically merged during compilation. You only define details that vary per client (Company Name, Weeks duration, active sitemaps, budgeting allocation). Saved entries are stored locally on-device and mapped into the retrieval search bar instantly.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER - Hidden during printing */}
      <footer className="no-print bg-[#0a0f1d] border-t border-[#162035] py-6 text-slate-500 text-xs text-center mt-8 font-sans">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Astra Tech. All rights reserved. Operating under regional corporate regulations.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Security Ledger</span>
            <span>•</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">System Protocol</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
