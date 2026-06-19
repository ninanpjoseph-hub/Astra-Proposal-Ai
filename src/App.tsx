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
import ChequeQuotationModule from './components/ChequeQuotationModule';
import { 
  Plus, Search, FileText, Calendar, Building, Landmark, Trash2, Edit3, Eye, 
  HelpCircle, ChevronRight, BarChart3, Database, TrendingUp, Sparkles, AlertCircle,
  LogOut, X, Server
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
  const [showDbDiagnostics, setShowDbDiagnostics] = useState<boolean>(false);
  const [dbInfo, setDbInfo] = useState<{ host?: string; port?: string; database?: string; user?: string }>({});
  
  // Theme state: defaulting to 'luxury-dark' representing Elite Wealth platform
  const [dashboardTheme, setDashboardTheme] = useState<'luxury-dark' | 'classic'>(() => {
    const cached = localStorage.getItem('prowess_dashboard_theme');
    return cached === 'classic' ? 'classic' : 'luxury-dark';
  });
  
  const isLuxury = dashboardTheme === 'luxury-dark';

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
  const [activeModule, setActiveModule] = useState<'proposals' | 'cheque-quotations'>('proposals');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pre-populate database memory with sample values on load
  useEffect(() => {
    async function loadDataAndVerifyDb() {
      try {
        // Test database status
        const dbTestRes = await fetch('/api/proposals/test-db');
        const dbTestData = await dbTestRes.json();
        
        if (dbTestData) {
          setDbInfo({
            host: dbTestData.host,
            port: dbTestData.port,
            database: dbTestData.database,
            user: dbTestData.user
          });
        }

        if (dbTestData && dbTestData.success) {
          setIsDbConnected(true);
          setDbStatusDetails("Hostinger Connected");
        } else {
          setIsDbConnected(false);
          setDbStatusDetails(dbTestData?.message || "Missing configs");
        }

        // Fetch proposals from API
        let dbProposals: Proposal[] = [];
        try {
          const response = await fetch('/api/proposals');
          if (response.ok) {
            const rawProposalsList = await response.json();
            if (Array.isArray(rawProposalsList)) {
              // Unpack database JSON records safely and normalize field casing
              dbProposals = rawProposalsList.map((item: any) => ({
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
            }
          }
        } catch (fetchErr) {
          console.warn("Failed to retrieve active database proposals:", fetchErr);
        }

        // Get local storage proposals
        const localCached = localStorage.getItem('prowess_proposals_v1');
        let localProposals: Proposal[] = [];
        if (localCached) {
          try {
            localProposals = JSON.parse(localCached);
          } catch (e) {
            console.error("Failed to parse local cached proposals", e);
          }
        }

        // If DB is connected and active: we upload any newer or missing local proposals to the DB
        if (dbTestData && dbTestData.success && localProposals.length > 0) {
          // Identify missing/newer proposals in localStorage to upload
          const proposalsToUpload = localProposals.filter(localP => {
            // Do not upload uncustomized sample/template proposals unless they were edited
            if (localP.id.startsWith('prop_sample_') && !localP.updatedAt) {
              return false;
            }

            const matchingDbP = dbProposals.find(dbP => dbP.id === localP.id);
            if (!matchingDbP) {
              // Missing in DB entirely - should be migrated
              return true;
            } else {
              // Exists in DB: compare timestamps and upload if local copy is strictly newer
              const localTime = new Date(localP.updatedAt || localP.createdAt || 0).getTime();
              const dbTime = new Date(matchingDbP.updatedAt || matchingDbP.createdAt || 0).getTime();
              return localTime > dbTime + 1000; // local is newer by more than a second
            }
          });

          if (proposalsToUpload.length > 0) {
            console.log(`📡 [Sync] Migrating ${proposalsToUpload.length} local proposals to Hostinger MySQL Database...`);
            for (const prop of proposalsToUpload) {
              try {
                await fetch('/api/proposals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(prop)
                });
              } catch (err) {
                console.error(`Local migration upload failed for proposal ${prop.id}:`, err);
              }
            }

            // Re-fetch master state from DB to get the consolidated online lists
            try {
              const refetchResponse = await fetch('/api/proposals');
              if (refetchResponse.ok) {
                const rawRefetched = await refetchResponse.json();
                if (Array.isArray(rawRefetched)) {
                  dbProposals = rawRefetched.map((item: any) => ({
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
                }
              }
            } catch (err) {
              console.warn("Failed to refetch after master upload:", err);
            }
          }
        }

        // Merge DB master records and local storage records to ensure zero data loss
        const mergedList = [...dbProposals];
        for (const localP of localProposals) {
          if (!mergedList.some(p => p.id === localP.id)) {
            // Keep any unique local records that aren't on the DB yet (e.g., templates or items we skipped)
            mergedList.push(localP);
          }
        }

        if (mergedList.length > 0) {
          setProposals(mergedList);
          localStorage.setItem('prowess_proposals_v1', JSON.stringify(mergedList));
        } else {
          setProposals(SAMPLE_PROPOSALS);
          localStorage.setItem('prowess_proposals_v1', JSON.stringify(SAMPLE_PROPOSALS));
        }
      } catch (err: any) {
        console.warn("Could not leverage Hostinger MySQL backend, relying on local state cache:", err.message);
        setDbStatusDetails("Offline Mode");
        
        const cached = localStorage.getItem('prowess_proposals_v1');
        if (cached) {
          try {
            setProposals(JSON.parse(cached));
          } catch (e) {
            setProposals(SAMPLE_PROPOSALS);
          }
        } else {
          setProposals(SAMPLE_PROPOSALS);
        }
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
        theme={dashboardTheme}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('prowess_session_user', JSON.stringify(user));
          logLoginEvent(user);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col justify-between ${isLuxury ? 'bg-[#070b19] text-slate-100' : 'bg-slate-50 text-[#1e293b]'}`}>
      
      {/* GLOBAL BANNER HEADER - Hidden during printing */}
      <header className={`no-print text-white shadow-md border-b-4 transition-all ${
        isLuxury 
          ? 'bg-[#0B1120] border-[#C5A059] shadow-[0_4px_25px_rgba(0,0,0,0.4)]' 
          : 'bg-slate-900 border-blue-600'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold font-serif italic text-white text-lg animate-none ${
              isLuxury ? 'bg-[#C5A059]' : 'bg-blue-600'
            }`}>
              As
            </div>
            <div>
              <h1 className={`font-serif font-bold text-base md:text-lg tracking-tight leading-none text-slate-100 ${
                isLuxury ? 'text-[#C5A059]' : 'text-slate-100'
              }`}>
                Astra Tech
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
            <span className={`font-mono px-2.5 py-1 rounded-md border ${
              isLuxury 
                ? 'bg-[#111C35] text-[#C5A059] border-[#C5A059]/20' 
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}>
              {currentUser?.email}
            </span>
            
            {/* Hostinger DB connection badge */}
            <div 
              onClick={() => setShowDbDiagnostics(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[10px] font-mono font-medium cursor-pointer select-none hover:scale-105 active:scale-95 transition-all duration-150 ${
                isDbConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
              }`} 
              title="Click here to inspect Database Connection Status & Diagnostics"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="hidden lg:inline">{isDbConnected ? 'Hostinger DB' : 'Offline Cache'}</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-md transition-all cursor-pointer text-[11px] font-semibold"
              title="Sign Out of Session"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* MODULE TAB NAVIGATION BAR */}
      <div className={`no-print border-b transition-all ${
        isLuxury 
          ? 'bg-[#0F172A] border-[#C5A059]/15' 
          : 'bg-white border-slate-200 shadow-3xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-6">
          <button
            onClick={() => {
              setActiveModule('proposals');
              setViewingProposal(null);
              setIsCreating(false);
            }}
            className={`py-3.5 text-xs font-serif font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeModule === 'proposals' 
                ? isLuxury 
                  ? 'border-[#C5A059] text-[#C5A059]' 
                  : 'border-blue-600 text-blue-700' 
                : isLuxury 
                  ? 'border-transparent text-slate-400 hover:text-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            Proposals Directory
          </button>
          <button
            onClick={() => {
              setActiveModule('cheque-quotations');
            }}
            className={`py-3.5 text-xs font-serif font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeModule === 'cheque-quotations' 
                ? isLuxury 
                  ? 'border-[#C5A059] text-[#C5A059]' 
                  : 'border-blue-600 text-blue-700' 
                : isLuxury 
                  ? 'border-transparent text-slate-400 hover:text-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark className="h-4 w-4" />
            Cheque Printing Software Quotations
          </button>
        </div>
      </div>

      {/* PRIMARY STAGE SCREEN SPACE */}
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 py-8 w-full">
        
        {activeModule === 'cheque-quotations' ? (
          <ChequeQuotationModule />
        ) : viewingProposal ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className={`p-5 rounded-2xl flex items-center gap-4 border transition-all ${
                isLuxury 
                  ? 'bg-[#111C35]/65 border-[#C5A059]/20 shadow-[0_8px_30px_rgb(0,0,0,0.55)] text-white' 
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLuxury ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Stored Proposals</span>
                  <strong className={`text-xl font-bold ${isLuxury ? 'text-white' : 'text-slate-800'}`}>{proposals.length} Saved</strong>
                </div>
              </div>

              <div className={`p-5 rounded-2xl flex items-center gap-4 border transition-all ${
                isLuxury 
                  ? 'bg-[#111C35]/65 border-[#C5A059]/20 shadow-[0_8px_30px_rgb(0,0,0,0.55)] text-white' 
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLuxury ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-500/10 text-emerald-600'
                }`}>
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Total Pipeline Value</span>
                  <strong className={`text-xl font-bold ${isLuxury ? 'text-[#C5A059] font-serif' : 'text-slate-800'}`}>{formatQAR(totalValueSum)}</strong>
                </div>
              </div>

              <div className={`p-5 rounded-2xl flex items-center gap-4 border transition-all ${
                isLuxury 
                  ? 'bg-[#111C35]/65 border-[#C5A059]/20 shadow-[0_8px_30px_rgb(0,0,0,0.55)] text-white' 
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLuxury ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20' : 'bg-amber-50 text-amber-600'
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Web Platforms ratio</span>
                  <strong className={`text-xl font-bold ${isLuxury ? 'text-white' : 'text-slate-800'}`}>{webProposalsCount} Active</strong>
                </div>
              </div>

              <div className={`p-5 rounded-2xl flex items-center gap-4 border transition-all ${
                isLuxury 
                  ? 'bg-[#111C35]/65 border-[#C5A059]/20 shadow-[0_8px_30px_rgb(0,0,0,0.55)] text-white' 
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLuxury ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-sky-50 text-sky-600'
                }`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Branding Campaigns</span>
                  <strong className={`text-xl font-bold ${isLuxury ? 'text-sky-350' : 'text-slate-800'}`}>{brandingProposalsCount} Issued</strong>
                </div>
              </div>

            </div>

            {/* Create Proposal Selector Bar */}
            <div className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
              isLuxury 
                ? 'bg-[#111C35]/65 border-[#C5A059]/20 shadow-xl text-white' 
                : 'bg-white border border-slate-200 shadow-xs'
            }`}>
              <div>
                <h2 className={`font-serif font-bold text-lg tracking-tight ${isLuxury ? 'text-[#C5A059]' : 'text-slate-900'}`}>
                  Design bespoke proposals instantly
                </h2>
                <p className={`text-xs leading-normal font-sans ${isLuxury ? 'text-slate-300' : 'text-slate-500'}`}>
                  Choose a blueprint target below. The wizard compiles locking master pages and asks only for clients specifics.
                </p>
              </div>

              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => startNewProposal('branding')}
                  id="create-branding-proposal-btn"
                  className={`px-4 py-2 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isLuxury 
                      ? 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#070b19] hover:brightness-110 font-bold' 
                      : 'bg-slate-900 hover:bg-slate-850 text-white'
                  }`}
                >
                  <Plus className={`h-4 w-4 ${isLuxury ? 'text-[#070b19]' : 'text-blue-400'}`} />
                  + Branding & Identity Proposal
                </button>
                <button
                  onClick={() => startNewProposal('website')}
                  id="create-website-proposal-btn"
                  className={`px-4 py-2 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    isLuxury 
                      ? 'bg-[#111C35] hover:bg-[#1E293B] text-[#C5A059] border border-[#C5A059]/40 shadow-xs' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  }`}
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
              />
            </div>

            {/* Smart search center console */}
            <div className="space-y-4">
              <div className="relative max-w-2xl mx-auto">
                <Search className={`absolute left-4 top-3.5 h-4.5 w-4.5 ${isLuxury ? 'text-[#C5A059]' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder='Search by client, scope or type (e.g., "Show me the Mannai TechHub website proposal")...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-12 py-3 border rounded-xl font-sans text-xs transition-shadow pr-8 ${
                    isLuxury 
                      ? 'bg-[#111C35]/65 border-[#C5A059]/25 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]/25 focus:border-[#C5A059]' 
                      : 'border-slate-300 shadow-sm bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                  id="search-memory-input"
                />
                
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-4 top-3.5 text-xs ${isLuxury ? 'text-[#C5A059]/80 hover:text-white' : 'text-slate-400'}`}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Suggestions Chips */}
              <div className="flex flex-wrap gap-2 items-center justify-center max-w-2xl mx-auto">
                <span className={`text-[10px] font-bold font-mono uppercase shrink-0 ${isLuxury ? 'text-slate-300' : 'text-slate-400'}`}>
                  Search Prompts:
                </span>
                {searchSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(s.query)}
                    className={`px-3 py-1 font-sans text-[10px] rounded-full transition-colors cursor-pointer border ${
                      isLuxury 
                        ? 'bg-[#111C35] border-[#C5A059]/15 hover:border-[#C5A059]/35 text-slate-300 hover:text-white' 
                        : 'border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    "{s.label}"
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results Table / Deck Grid */}
            <div className="space-y-4">
              <div className={`flex justify-between items-center px-4 py-2 rounded-lg border ${
                isLuxury 
                  ? 'bg-[#111C35]/35 border-[#C5A059]/10 text-slate-100' 
                  : 'bg-slate-100/50 border-slate-200/80 text-slate-700'
              }`}>
                <span className={`text-xs font-mono font-bold uppercase ${isLuxury ? 'text-[#C5A059]' : 'text-slate-400'}`}>
                  ACTIVE MEMORY DIRECTORY
                </span>
                <span className="text-xs font-sans">
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
                        onClick={() => {
                          setProposalViewTab('document');
                          setViewingProposal(prop);
                        }}
                        className={`p-5 rounded-2xl cursor-pointer relative group flex flex-col justify-between border transition-all ${
                          isLuxury 
                            ? 'bg-[#111C35]/65 border-[#C5A059]/20 hover:border-[#C5A059]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] text-white hover:shadow-[#C5A059]/5' 
                            : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md text-slate-800'
                        }`}
                      >
                        {/* Type Tag indicator */}
                        <div className="absolute top-5 right-5 flex flex-col items-end gap-1.5">
                          <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase leading-none ${
                            isB 
                              ? isLuxury ? 'bg-[#C5A059]/15 text-[#C5A059]' : 'bg-sky-50 text-sky-700'
                              : isLuxury ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isB ? "Identity" : "Website"}
                          </span>
                          <span className={`text-[8.5px] font-sans font-bold px-2 py-0.5 border rounded-full leading-none uppercase ${
                            prop.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' :
                            prop.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' :
                            prop.status === 'Under Process' ? isLuxury ? 'bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30' : 'bg-blue-50 text-blue-700 border-blue-200' :
                            prop.status === 'Under Review' ? 'bg-amber-500/10 text-amber-450 border-amber-500/20' :
                            prop.status === 'Awaiting Client Feedback' ? 'bg-pink-500/10 text-pink-450 border-pink-500/20' :
                            isLuxury ? 'bg-slate-800 text-slate-350 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-205'
                          }`}>
                            {prop.status || 'Draft'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-mono text-[10px] mr-1">{prop.proposalDate}</span>
                            {prop.assignedUserName && (
                              <span className={`text-[9.5px] font-sans px-1.5 py-0.5 rounded border leading-none ${
                                isLuxury 
                                  ? 'bg-[#0B1120] text-[#C5A059] border-[#C5A059]/20' 
                                  : 'bg-slate-100/80 text-slate-600 border-slate-200'
                              }`}>
                                Lead: {prop.assignedUserName}
                              </span>
                            )}
                          </div>

                          <h3 className={`font-serif font-bold text-base leading-tight transition-colors ${
                            isLuxury 
                              ? 'text-white group-hover:text-[#C5A059]' 
                              : 'text-slate-800 group-hover:text-blue-600'
                          }`}>
                            {prop.clientName || "Unnamed Client"}
                          </h3>
                          <p className={`font-sans text-[11px] mt-1 lines-clamp-2 leading-relaxed ${
                            isLuxury ? 'text-slate-300' : 'text-slate-500'
                          }`}>
                            {prop.companyName || (isB ? "Branding Strategy Suite" : "Custom Web Project")}
                          </p>
                          
                          <p className={`text-[10px] italic font-sans mt-3 line-clamp-2 border-l-2 pl-2 ${
                            isLuxury ? 'text-slate-400 border-[#C5A059]/40' : 'text-slate-400 border-slate-100'
                          }`}>
                            "{prop.briefDescription || "Bespoke production strategic deck targeting operational deadlines and conversion metrics."}"
                          </p>
                        </div>

                        {/* Specs grid */}
                        <div className={`mt-5 pt-4 border-t flex items-center justify-between gap-4 ${
                          isLuxury ? 'border-slate-800/80' : 'border-slate-100'
                        }`}>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-slate-450 uppercase tracking-wider block">Contract Value</span>
                            <strong className={`text-sm font-sans font-extrabold mt-0.5 ${
                              isLuxury ? 'text-[#C5A059]' : 'text-blue-700'
                            }`}>
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
                              className={`p-1.5 rounded-md transition-colors ${
                                isLuxury ? 'hover:bg-[#C5A059]/10 text-slate-400 hover:text-[#C5A059]' : 'hover:bg-slate-100 text-slate-500 hover:text-blue-600'
                              }`}
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
                              className={`p-1.5 rounded-md transition-colors ${
                                isLuxury ? 'hover:bg-[#C5A059]/10 text-slate-400 hover:text-[#C5A059]' : 'hover:bg-slate-100 text-[#C5A059] hover:text-blue-600'
                              }`}
                              title="Modify Proposal"
                            >
                              <Edit3 className="h-4.5 w-4.5" />
                            </button>
                            {/* Delete block */}
                            <button
                              onClick={(e) => handleDeleteProposal(prop.id, e)}
                              className={`p-1.5 rounded-md transition-colors ${
                                isLuxury ? 'hover:bg-rose-500/10 text-slate-400 hover:text-rose-400' : 'hover:bg-slate-100 text-slate-400 hover:text-rose-600'
                              }`}
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
          <span>© 2026 Astra Tech. All rights reserved. Registered trademark of Qatar.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Security Cert</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Data Policy</span>
          </div>
        </div>
      </footer>


      {showDbDiagnostics && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm no-print p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl font-sans relative">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-900/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2.5">
                <Database className={`h-5 w-5 ${isDbConnected ? 'text-emerald-500 hover:animate-pulse' : 'text-amber-500'}`} />
                <h3 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">
                  Database Sync & Connection Diagnostics
                </h3>
              </div>
              <button 
                onClick={() => setShowDbDiagnostics(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/40"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-slate-650 dark:text-slate-400 leading-normal max-h-[75vh] overflow-y-auto">
              
              {/* Badge Status Row */}
              <div className="p-4 rounded-xl border flex items-center gap-3 bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-900">
                <span className={`h-2.5 w-2.5 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Connection State: {isDbConnected ? 'CONNECTED' : 'OFFLINE MODE (FALLBACK)'}
                  </p>
                  <p className="text-[10.5px] opacity-75 mt-0.5">
                    {isDbConnected 
                      ? 'Perfect connection! Your team is sharing the cloud-synchronized real-time database.' 
                      : 'Unreachable active database. Local storage is acting as high-speed standalone backup.'}
                  </p>
                </div>
              </div>

              {!isDbConnected && (
                <div className="space-y-4">
                  {/* Current Active Logs */}
                  <div className="space-y-1.5 font-mono text-[10.5px]">
                    <span className="text-slate-400 uppercase font-bold text-[9.5px] tracking-wider block">Container Environment parameters:</span>
                    <div className="bg-slate-900 text-slate-300 p-3 rounded-lg border border-slate-850 space-y-1 select-all font-mono">
                      <div>DB_HOST: "{dbInfo.host || 'Not configured (Empty)'}"</div>
                      <div>DB_PORT: "{dbInfo.port || '3306'}"</div>
                      <div>DB_NAME: "{dbInfo.database || 'Not configured (Empty)'}"</div>
                      <div>DB_USER: "{dbInfo.user || 'Not configured (Empty)'}"</div>
                    </div>
                  </div>

                  {/* Diagnosed Error */}
                  <div className="space-y-1.5">
                    <span className="text-amber-600 dark:text-amber-400 font-bold block flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Diagnosed Connectivity Defect:
                    </span>
                    <div className="bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-300 p-3 rounded-lg leading-relaxed select-all font-mono text-[10.5px]">
                      {dbStatusDetails}
                    </div>
                  </div>

                  {/* Impact explanation */}
                  <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-950/40 p-3.5 rounded-xl space-y-1 text-slate-700 dark:text-slate-350">
                    <p className="font-bold text-[11px] text-blue-700 dark:text-blue-400">Why proposals do not sync on different computers:</p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed">
                      Because the server database host fell back to offline mode, the system defaults to your browser's <strong className="font-semibold text-slate-805 dark:text-white">localStorage</strong>. Storing files locally means they are saved inside this browser only, and are completely missing on other devices or when you log in elsewhere.
                    </p>
                  </div>

                  {/* Actionable Remedies */}
                  <div className="space-y-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200">How to establish correct connection:</p>
                    <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                      <li>
                        <strong>Update DB_HOST parameter:</strong> In Hostinger hPanel, locate the actual Host name or IP under <em>"MySQL Server"</em> (usually looks like an IP address or a server address, e.g. <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono">109.84...</code> or <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono">sql123.main-hosting.eu</code>). Currently, you have set it to <code className="bg-slate-105 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-rose-500">"{dbInfo.host || 'Not set'}"</code>. If this is a database name, NOT a host address, please correct it.
                      </li>
                      <li>
                        <strong>Apply Secrets in AI Studio:</strong> Open the <strong>Settings</strong> or <strong>Secrets</strong> panel of your AI Studio Workspace, locate the active secrets list, and update <code className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">DB_HOST</code>.
                      </li>
                      <li>
                        <strong>Allow Remote MySQL access:</strong> Open Hostinger's hPanel, navigate to the **Remote MySQL** tab of your database, and authorize access for standard hosts (using <code className="font-mono bg-slate-100 dark:bg-slate-905 px-1 py-0.5 rounded">%</code> wildcard) to allow the Cloud Run runtime to issue ingress handshakes.
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {isDbConnected && (
                <div className="space-y-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl leading-relaxed text-center font-medium">
                    Excellent! The server is actively synchronized with the Hostinger MySQL database. Any saved proposals are visible to offsite users, other computers, and different browsers.
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-1 block">
                    <p className="font-bold text-slate-800 dark:text-slate-300">Connected database info:</p>
                    <ul className="list-disc pl-4 mt-1 font-mono text-[10.5px]">
                      <li>Host: "{dbInfo.host || 'Not set'}"</li>
                      <li>Schema: "{dbInfo.database || 'Not set'}"</li>
                      <li>User: "{dbInfo.user || 'Not set'}"</li>
                      <li>Port: "{dbInfo.port || '3306'}"</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/10 flex justify-end">
              <button 
                onClick={() => setShowDbDiagnostics(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Heard, thank you!
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
