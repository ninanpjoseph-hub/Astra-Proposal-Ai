/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Proposal, ProposalType, Milestone, ResourceCost, ProposalStatus, DomainItem, WebsiteAuditScope } from '../types';
import { createDefaultProposal, generateId, formatQAR, createDefaultModularServicesScope, calculateModularServicesTotal, getModularDeliverableLineItems } from '../proposalUtils';
import { DEFAULT_SCOPE_TEMPLATES } from '../staticTemplates';
import SitemapGenerator from './SitemapGenerator';
import ProposalDocumentView from './ProposalDocumentView';
import { getScopeCategory, ScopeCategory } from '../utils/scopeClassifier';
import { 
  Building2, User, Calendar, FileText, CheckSquare, Clock, Landmark, Settings, 
  Trash2, Plus, ArrowLeft, ArrowRight, Eye, Sparkles, Check, HelpCircle, ArrowUp, ArrowDown, Edit3, X 
} from 'lucide-react';

interface ProposalWizardProps {
  initialProposal?: Proposal | null;
  onSave: (proposal: Proposal) => void;
  onCancel: () => void;
}

export default function ProposalWizard({ initialProposal, onSave, onCancel }: ProposalWizardProps) {
  // Wizard steps: 1 to 7
  const [step, setStep] = useState<number>(1);
  const [proposal, setProposal] = useState<Proposal>(() => {
    const rawP = initialProposal ? JSON.parse(JSON.stringify(initialProposal)) : createDefaultProposal('branding');
    const defaults = createDefaultProposal(rawP.type || 'branding');
    return {
      ...defaults,
      ...rawP,
      type: rawP.type || defaults.type,
      brandingScope: {
        ...defaults.brandingScope,
        ...(rawP.brandingScope || {})
      },
      websiteScope: {
        ...defaults.websiteScope,
        ...(rawP.websiteScope || {})
      },
      servicesScope: {
        ...defaults.servicesScope,
        ...(rawP.servicesScope || {})
      },
      milestones: rawP.milestones || defaults.milestones || [],
      resourceCosts: rawP.resourceCosts || defaults.resourceCosts || [],
      history: rawP.history || defaults.history || [],
    };
  });

  // Keep type local variable
  const [proposalType, setProposalType] = useState<ProposalType>(() => {
    return initialProposal ? initialProposal.type : 'branding';
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  // Track if user has changed fields, reset milestones if type changes
  const handleTypeSelect = (type: ProposalType) => {
    if (type === proposal.type) return;
    setProposalType(type);
    const newDefault = createDefaultProposal(type);
    // Keep client info and date if already typed
    newDefault.clientName = proposal.clientName;
    newDefault.companyName = proposal.companyName;
    newDefault.proposalDate = proposal.proposalDate;
    newDefault.briefDescription = proposal.briefDescription;
    newDefault.preparedByName = proposal.preparedByName;
    newDefault.preparedByCompany = proposal.preparedByCompany;
    newDefault.preparedByTitle = proposal.preparedByTitle;
    newDefault.preparedByUserId = proposal.preparedByUserId;
    newDefault.assignedUserId = proposal.assignedUserId;
    newDefault.assignedUserName = proposal.assignedUserName;
    newDefault.sharedUserIds = proposal.sharedUserIds;
    newDefault.status = proposal.status;
    setProposal(newDefault);
  };

  const isBranding = proposal.type === 'branding';

  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  useEffect(() => {
    const list = localStorage.getItem('prowess_suppliers_v1');
    if (list) {
      setSuppliersList(JSON.parse(list));
    } else {
      fetch('/api/proposals/suppliers/all')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSuppliersList(data);
            localStorage.setItem('prowess_suppliers_v1', JSON.stringify(data));
          }
        })
        .catch(e => console.warn("Could not load suppliers inside Proposal Wizard", e));
    }
  }, []);

  // Enhanced scope module editing states
  const [customItemTitle, setCustomItemTitle] = useState('');
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');
  const [editingItemDesc, setEditingItemDesc] = useState('');
  const [activeScopeTab, setActiveScopeTab] = useState<ScopeCategory>('core');

  // Handle standard strings/numbers in state helper
  const updateField = (field: keyof Proposal, value: any) => {
    setProposal(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calculate total cost automatically if we updated costs
      if (field === 'developmentCost' || field === 'pluginCost' || field === 'maintenanceCost' || field === 'additionalCost') {
        const devCost = field === 'developmentCost' ? Number(value) : Number(prev.developmentCost);
        const plugCost = field === 'pluginCost' ? Number(value) : Number(prev.pluginCost);
        const maintCost = field === 'maintenanceCost' ? Number(value) : Number(prev.maintenanceCost);
        const addCost = field === 'additionalCost' ? Number(value) : Number(prev.additionalCost);
        updated.totalCost = devCost + plugCost + maintCost + addCost;
      }
      
      return updated;
    });
  };

  // Handle nested branding scope update
  const updateBrandingScope = (key: keyof Proposal['brandingScope'], value: any) => {
    setProposal(prev => ({
      ...prev,
      brandingScope: {
        ...prev.brandingScope,
        [key]: value
      }
    }));
  };

  // Handle nested website scope update
  const updateWebsiteScope = (key: keyof Proposal['websiteScope'], value: any) => {
    setProposal(prev => {
      const updatedScope = {
        ...prev.websiteScope,
        [key]: value
      };
      
      let basePages = 2; // Home + About/Services
      if (updatedScope.contactForms) basePages += 1;
      if (updatedScope.blogModule) basePages += 2; // Index + Single
      if (updatedScope.gallery) basePages += 1;
      if (updatedScope.careersSection) basePages += 2; // Board + Apply Form
      if (updatedScope.downloadsSection) basePages += 1;

      // Ensure total pages is updated correctly or computed based on elements selection
      let computedPages = key === 'totalPages' ? value : prev.websiteScope.totalPages;
      if (computedPages < basePages) {
        computedPages = basePages;
      }

      return {
        ...prev,
        websiteScope: {
          ...updatedScope,
          totalPages: computedPages
        }
      };
    });
  };

  // Milestone inline operations
  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setProposal(prev => ({
      ...prev,
      milestones: (prev.milestones || []).map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const deleteMilestone = (id: string) => {
    setProposal(prev => ({
      ...prev,
      milestones: (prev.milestones || []).filter(m => m.id !== id)
    }));
  };

  const addMilestone = () => {
    const id = `m_custom_${generateId()}`;
    const newM: Milestone = {
      id,
      week: `Week ${(proposal.milestones || []).length + 1}`,
      title: "New Deliverable Module",
      description: "Provide a descriptive account of what will be validated."
    };
    setProposal(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), newM]
    }));
  };

  // Branding resource cost operations
  const updateResourceCost = (id: string, field: keyof ResourceCost, value: any) => {
    setProposal(prev => {
      const updatedCosts = (prev.resourceCosts || []).map(rc => {
        if (rc.id === id) {
          const updatedRC = { ...rc, [field]: value };
          return updatedRC;
        }
        return rc;
      });

      // Recalculate total cost
      const newTotal = updatedCosts.reduce((sum, item) => sum + (item.hours * item.rate), 0);
      
      return {
        ...prev,
        resourceCosts: updatedCosts,
        totalCost: newTotal
      };
    });
  };

  const deleteResourceCost = (id: string) => {
    setProposal(prev => {
      const updatedCosts = (prev.resourceCosts || []).filter(rc => rc.id !== id);
      const newTotal = updatedCosts.reduce((sum, item) => sum + (item.hours * item.rate), 0);
      return {
        ...prev,
        resourceCosts: updatedCosts,
        totalCost: newTotal
      };
    });
  };

  const addResourceCost = () => {
    const id = `rc_custom_${generateId()}`;
    const newRC: ResourceCost = {
      id,
      role: "Design / Architectural Resource",
      hours: 10,
      rate: 150
    };
    setProposal(prev => {
      const updatedCosts = [...(prev.resourceCosts || []), newRC];
      const newTotal = updatedCosts.reduce((sum, item) => sum + (item.hours * item.rate), 0);
      return {
        ...prev,
        resourceCosts: updatedCosts,
        totalCost: newTotal
      };
    });
  };

  // Modular Services scope handlers
  const toggleModularService = (serviceId: 'website_audit' | 'hosting_domain' | 'ssl_renewal' | 'amc' | 'custom_service') => {
    setProposal(prev => {
      const currentScope = prev.servicesScope || createDefaultModularServicesScope();
      const currentSelected = currentScope.selectedServices || [];
      let updatedSelected: string[];
      if (currentSelected.includes(serviceId)) {
        updatedSelected = currentSelected.filter(s => s !== serviceId);
      } else {
        updatedSelected = [...currentSelected, serviceId];
      }
      const updatedScope = {
        ...currentScope,
        selectedServices: updatedSelected as any
      };
      const newTotal = calculateModularServicesTotal(updatedScope);
      return {
        ...prev,
        servicesScope: updatedScope,
        totalCost: newTotal
      };
    });
  };

  const updateServiceDetail = (
    serviceKey: 'websiteAudit' | 'hostingDomain' | 'sslRenewal' | 'amc' | 'customService',
    field: string,
    value: any
  ) => {
    setProposal(prev => {
      const currentScope = prev.servicesScope || createDefaultModularServicesScope();
      const currentService = (currentScope as any)[serviceKey] || {};
      const updatedService = {
        ...currentService,
        [field]: value
      };
      const updatedScope = {
        ...currentScope,
        [serviceKey]: updatedService
      };
      const newTotal = calculateModularServicesTotal(updatedScope);
      return {
        ...prev,
        servicesScope: updatedScope,
        totalCost: newTotal
      };
    });
  };

  // Hosting & Domain Entry Handlers
  const addHostingDomainEntry = () => {
    setProposal(prev => {
      const currentScope = prev.servicesScope || createDefaultModularServicesScope();
      const currentHosting = currentScope.hostingDomain || {} as any;
      const currentEntries: HostingDomainEntry[] = currentHosting.entries || [];
      const newEntry: HostingDomainEntry = {
        id: `hd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        domainName: '',
        hostingProvider: '',
        hostingPlan: '',
        renewalDate: new Date().toISOString().split('T')[0],
        renewalDuration: '1 Year',
        renewalCost: 0,
        notes: ''
      };
      const updatedEntries = [...currentEntries, newEntry];
      const newModuleCost = updatedEntries.reduce((sum, item) => sum + (Number(item.renewalCost) || 0), 0);
      const updatedScope = {
        ...currentScope,
        hostingDomain: {
          ...currentHosting,
          entries: updatedEntries,
          cost: newModuleCost
        }
      };
      const newTotal = calculateModularServicesTotal(updatedScope);
      return {
        ...prev,
        servicesScope: updatedScope,
        totalCost: newTotal
      };
    });
  };

  const updateHostingDomainEntry = (id: string, field: keyof HostingDomainEntry, value: any) => {
    setProposal(prev => {
      const currentScope = prev.servicesScope || createDefaultModularServicesScope();
      const currentHosting = currentScope.hostingDomain || {} as any;
      const currentEntries: HostingDomainEntry[] = currentHosting.entries || [];
      const updatedEntries = currentEntries.map(e => e.id === id ? { ...e, [field]: value } : e);
      const newModuleCost = updatedEntries.reduce((sum, item) => sum + (Number(item.renewalCost) || 0), 0);
      const updatedScope = {
        ...currentScope,
        hostingDomain: {
          ...currentHosting,
          entries: updatedEntries,
          cost: newModuleCost
        }
      };
      const newTotal = calculateModularServicesTotal(updatedScope);
      return {
        ...prev,
        servicesScope: updatedScope,
        totalCost: newTotal
      };
    });
  };

  const removeHostingDomainEntry = (id: string) => {
    setProposal(prev => {
      const currentScope = prev.servicesScope || createDefaultModularServicesScope();
      const currentHosting = currentScope.hostingDomain || {} as any;
      const currentEntries: HostingDomainEntry[] = currentHosting.entries || [];
      const updatedEntries = currentEntries.filter(e => e.id !== id);
      const newModuleCost = updatedEntries.reduce((sum, item) => sum + (Number(item.renewalCost) || 0), 0);
      const updatedScope = {
        ...currentScope,
        hostingDomain: {
          ...currentHosting,
          entries: updatedEntries,
          cost: newModuleCost
        }
      };
      const newTotal = calculateModularServicesTotal(updatedScope);
      return {
        ...prev,
        servicesScope: updatedScope,
        totalCost: newTotal
      };
    });
  };

  const handleNext = () => {
    if (step < 7) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinalSave = () => {
    // Validate proposal fields briefly before archiving
    if (!proposal.clientName.trim()) {
      alert("Please provide the Client Name before saving.");
      setStep(1);
      return;
    }
    
    // Auto populate default project descriptions if blank
    const sanitizedProposal = { ...proposal };
    if (!sanitizedProposal.briefDescription.trim()) {
      sanitizedProposal.briefDescription = isBranding 
        ? "Dynamic visual brand strategy involving specific company layouts, high-fidelity iconography, and coordinate books."
        : "An interactive, double-language responsive corporate portal built with high speed CMS and custom plugins.";
    }
    
    sanitizedProposal.updatedAt = new Date().toISOString();
    onSave(sanitizedProposal);
  };

  // Define steps titles
  const stepsList = [
    { title: "Client Info", icon: User },
    { title: "Brief Details", icon: FileText },
    { title: "Select Scope", icon: CheckSquare },
    { title: "Draft Timeline", icon: Clock },
    { title: "Financials Plan", icon: Landmark },
    { title: "Review PDF", icon: Eye },
    { title: "Finalize & Save", icon: Sparkles }
  ];

  return (
    <div id="wizard-outer-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl mx-auto py-4">
      {/* LEFT WIZARD CONTROLLER: Col span 12 on mobile, 8 on desktop */}
      <div id="wizard-form-box" className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden">
        
        {/* Wizard step progress block */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-slate-400 font-bold">Proposal Builder</span>
              <h2 className="font-sans font-bold text-slate-800 text-lg leading-tight antialiased">
                {initialProposal ? "Revise Existing Proposal" : "Assemble Custom Proposal"}
              </h2>
            </div>
            <button 
              onClick={onCancel}
              className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              Close Creator
            </button>
          </div>

          {/* Stepper bubbles */}
          <div className="flex justify-between items-center relative mt-6 px-1">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
            {stepsList.map((s, idx) => {
              const activeNum = idx + 1;
              const isPassed = step > activeNum;
              const isCurrent = step === activeNum;
              const StepIcon = s.icon;
              
              return (
                <div key={idx} className="flex flex-col items-center z-10">
                  <button
                    onClick={() => {
                      // Only allow jumping back or moving forward if we have basic info filled
                      if (proposal.clientName || activeNum === 1) {
                        setStep(activeNum);
                      }
                    }}
                    disabled={!proposal.clientName && activeNum > 1}
                    className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isPassed 
                        ? 'bg-emerald-600 text-white border-2 border-emerald-600 shadow-sm' 
                        : isCurrent
                        ? 'bg-blue-600 text-white border-2 border-blue-600 ring-4 ring-white shadow-md'
                        : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isPassed ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </button>
                  <span className={`text-[10px] font-sans font-bold mt-2 text-center absolute -bottom-5 transform translate-y-0.5 ${
                    isCurrent ? 'text-blue-600 font-extrabold' : 'text-slate-400'
                  } hidden md:inline`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-4"></div> {/* Spacer for bottom text */}
        </div>

        {/* --- STEP CONTENT --- */}
        <div className="p-8 flex-grow">
          
          {/* STEP 1: Select Type & Client Info */}
          {step === 1 && (
            <div id="step-1-form" className="space-y-6">
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 mb-6">
                <h4 className="text-xs font-sans font-bold text-slate-400 tracking-wider uppercase mb-3">
                  A. Select Proposal Target Type
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleTypeSelect('branding')}
                    className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between h-[125px] shadow-sm cursor-pointer ${
                      proposal.type === 'branding' 
                        ? 'bg-white border-blue-500 ring-2 ring-blue-50 text-slate-800' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase leading-none font-mono ${
                      proposal.type === 'branding' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Brand Identity
                    </span>
                    <div>
                      <h4 className="font-sans font-bold text-sm tracking-tight">Branding Proposal</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Logos, Brand Guidelines, stationery sets, and identity assets.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTypeSelect('website')}
                    className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between h-[125px] shadow-sm cursor-pointer ${
                      proposal.type === 'website' 
                        ? 'bg-white border-blue-500 ring-2 ring-blue-50 text-slate-800' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650'
                    }`}
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase leading-none font-mono ${
                      proposal.type === 'website' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Full Web Platform
                    </span>
                    <div>
                      <h4 className="font-sans font-bold text-sm tracking-tight">Website Proposal</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Custom pages, languages, CMS engines, plugins, and caching setups.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTypeSelect('services')}
                    className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between h-[125px] shadow-sm cursor-pointer ${
                      proposal.type === 'services' 
                        ? 'bg-white border-blue-500 ring-2 ring-blue-50 text-slate-800' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650'
                    }`}
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase leading-none font-mono ${
                      proposal.type === 'services' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Modular IT Services
                    </span>
                    <div>
                      <h4 className="font-sans font-bold text-sm tracking-tight">Services & Maintenance</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Website Audit, Hosting & Domain, SSL Renewal, and AMC in one document.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-sans font-bold text-slate-400 tracking-wider uppercase mb-1">
                  B. Client Demographics
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-semibold text-slate-700">Client Leader Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Mannai TechHub Group"
                        value={proposal.clientName}
                        onChange={(e) => updateField('clientName', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs leading-5 font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow bg-amber-50/5"
                        id="input-client-name"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-semibold text-slate-700">
                      {isBranding ? "Target Company Name" : "Official Project Name"}
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={isBranding ? "e.g. Mannai TechHub" : "e.g. Dual-Language Corporate Platform"}
                        value={proposal.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs leading-5 font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow"
                        id="input-company-name"
                      />
                    </div>
                  </div>
                </div>

                {/* Proposal Date */}
                <div className="flex flex-col gap-1.5 max-w-[200px]">
                  <label className="text-xs font-sans font-semibold text-slate-700">Proposal Stamp Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={proposal.proposalDate}
                      onChange={(e) => updateField('proposalDate', e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs leading-5 font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow cursor-pointer"
                      id="input-proposal-date"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: Preparer Information */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-sans font-bold text-slate-400 tracking-wider uppercase mb-1">
                  C. Preparer Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preparer Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-semibold text-slate-700">Preparer name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Ninan P Joseph"
                        value={proposal.preparedByName ?? ""}
                        onChange={(e) => updateField('preparedByName', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs leading-5 font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow"
                        id="input-preparer-name"
                      />
                    </div>
                  </div>

                  {/* Preparer Company */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-semibold text-slate-700">Agency / Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Astra Technologies"
                        value={proposal.preparedByCompany ?? ""}
                        onChange={(e) => updateField('preparedByCompany', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs leading-5 font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow"
                        id="input-preparer-company"
                      />
                    </div>
                  </div>
                </div>

                {/* Preparer Title */}
                <div className="flex flex-col gap-1.5 max-w-[400px]">
                  <label className="text-xs font-sans font-semibold text-slate-700">Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Design & Digital Strategy Partners"
                    value={proposal.preparedByTitle ?? ""}
                    onChange={(e) => updateField('preparedByTitle', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-xs leading-5 font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow"
                    id="input-preparer-title"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Project Details (Executive Summary) */}
          {step === 2 && (
            <div id="step-2-form" className="space-y-5">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-sm tracking-tight mb-1">
                  Executive Briefing details
                </h3>
                <p className="text-xs text-slate-500 leading-normal mb-4 font-sans">
                  Detail the business opportunities, desired outcome, or particular parameters of this collaboration. This replaces the generic executive summary placeholder block in the final documentation.
                </p>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-semibold text-slate-700">Project Mission & Objectives Brief</label>
                  <textarea
                    rows={6}
                    placeholder={isBranding 
                      ? "Describe the corporate persona attributes to capture, competitive gaps, and the ultimate positioning goal of Pearl Capital advisors..." 
                      : "Describe the primary services Mannai TechHub wants to showcase, the languages to include, lead generation forms, and general CMS requirements..."
                    }
                    value={proposal.briefDescription}
                    onChange={(e) => updateField('briefDescription', e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-lg text-xs leading-relaxed font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow resize-y"
                    id="input-brief-description"
                  />
                  <span className="text-[10px] text-slate-400 italic">
                    💡 High-quality brief translates into higher customer value perception. Keep it outcome-focused.
                  </span>

                  <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-center sm:flex-row flex-col gap-2">
                      <span className="text-[11px] font-sans font-medium text-blue-800 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                        Astra AI Copilot Assist
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!proposal.clientName || !proposal.companyName) {
                            alert("Please provide the Client Name and Company Name in Step 1 first.");
                            return;
                          }
                          setIsGeneratingAI(true);
                          setAiError("");
                          try {
                            const res = await fetch('/api/proposals/generate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                clientName: proposal.clientName,
                                companyName: proposal.companyName,
                                briefDescription: proposal.briefDescription,
                                type: proposal.type
                              })
                            });
                            
                            if (!res.ok) {
                              const errorData = await res.json();
                              throw new Error(errorData.error || "Generation endpoint returned status " + res.status);
                            }
                            
                            const data = await res.json();
                            if (data.success) {
                              setProposal(prev => ({
                                ...prev,
                                briefDescription: data.executiveSummary || prev.briefDescription,
                                milestones: data.milestones ? data.milestones.map((m: any, idx: number) => ({
                                  id: `${prev.id}_m_ai_${idx}`,
                                  week: m.week,
                                  title: m.title,
                                  description: m.description
                                })) : prev.milestones
                              }));
                            } else {
                              throw new Error(data.error || "Abnormal generation response.");
                            }
                          } catch (err: any) {
                            console.warn("Gemini connection error: ", err);
                            setAiError(err.message || "Could not link to backend Gemini proxy. Fallback outline loaded.");
                            
                            // Let's do a mock elegant description in case database/key is missing in workspace
                            setProposal(prev => ({
                              ...prev,
                              briefDescription: isBranding
                                ? `Our visual brand identity design for ${proposal.companyName} is optimized to maximize positioning for ${proposal.clientName} in Qatar's growing commercial landscape. We will orchestrate premium iconography, typography, layouts, and brand asset guidelines designed to capture attention and promote long-term buyer trust.`
                                : `Our engineering framework for ${proposal.companyName} delivers a tailored, responsive digital platform optimized for ${proposal.clientName}. It features fluid dual-language support, modern CMS editing dashboards, semantic SEO profiles, and secure cloud layouts to maximize lead capture.`
                            }));
                          } finally {
                            setIsGeneratingAI(false);
                          }
                        }}
                        disabled={isGeneratingAI}
                        className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isGeneratingAI ? "AI Consulting..." : "Auto-Generate with Gemini AI"}
                      </button>
                    </div>
                    {aiError && (
                      <span className="text-[10px] text-rose-600 font-sans block">{aiError}</span>
                    )}
                    {!aiError && isGeneratingAI && (
                      <span className="text-[10px] text-blue-600 font-sans block animate-pulse">
                        Analyzing briefing profile, structuring weekly roadmap, and formulating premium copy points on the fly...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Scope Selection */}
          {step === 3 && (
            <div id="step-3-form" className="space-y-6">
              
              {proposal.type === 'services' ? (
                /* MODULAR SERVICES CONFIGURATOR FORM */
                <div className="space-y-6">
                  <div className="bg-blue-50/60 border border-blue-200/80 p-4 rounded-xl flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Multi-Select Service Modules
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Select one or more service modules below to include in this proposal. The proposal document will dynamically generate individual sections and financial calculations based on your selections.
                      </p>
                    </div>
                  </div>

                  {/* Service 1: Website Audit */}
                  <div className={`p-5 border rounded-2xl transition-all ${
                    (proposal.servicesScope?.selectedServices || []).includes('website_audit')
                      ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-100'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(proposal.servicesScope?.selectedServices || []).includes('website_audit')}
                          onChange={() => toggleModularService('website_audit')}
                          className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500/50"
                        />
                        <div>
                          <span className="font-sans font-bold text-sm text-slate-800 block">Website Audit Module</span>
                          <span className="text-[11px] text-slate-500">Technical health, SEO performance, security vulnerabilities, Core Web Vitals & UX/UI</span>
                        </div>
                      </label>
                      {(proposal.servicesScope?.selectedServices || []).includes('website_audit') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">Module Cost:</span>
                          <div className="relative">
                            <input
                              type="number"
                              value={proposal.servicesScope?.websiteAudit?.cost || 0}
                              onChange={(e) => updateServiceDetail('websiteAudit', 'cost', Number(e.target.value))}
                              className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-right pr-11 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">QAR</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(proposal.servicesScope?.selectedServices || []).includes('website_audit') && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 block">Standard Scope Audit Checklist</label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  [
                                    'technicalAudit', 'seoAudit', 'performanceSpeed', 'securityAssessment',
                                    'mobileResponsiveness', 'uxUiReview', 'accessibilityReview',
                                    'brokenLinksError', 'cmsPluginCheck', 'detailedAuditReport'
                                  ].forEach(key => updateServiceDetail('websiteAudit', key, true));
                                }}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                Select All
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  [
                                    'technicalAudit', 'seoAudit', 'performanceSpeed', 'securityAssessment',
                                    'mobileResponsiveness', 'uxUiReview', 'accessibilityReview',
                                    'brokenLinksError', 'cmsPluginCheck', 'detailedAuditReport'
                                  ].forEach(key => updateServiceDetail('websiteAudit', key, false));
                                }}
                                className="text-[10px] font-bold text-slate-500 hover:underline"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {[
                              { key: 'technicalAudit', label: 'Technical Architecture & Code Standards Audit' },
                              { key: 'seoAudit', label: 'SEO Meta, Schema & Indexability Audit' },
                              { key: 'performanceSpeed', label: 'Core Web Vitals & Page Load Speed Benchmark' },
                              { key: 'securityAssessment', label: 'Security Vulnerabilities & SSL Inspection' },
                              { key: 'mobileResponsiveness', label: 'Mobile Responsiveness & Viewport Review' },
                              { key: 'uxUiReview', label: 'UX/UI Conversion & Journey Analysis' },
                              { key: 'accessibilityReview', label: 'WCAG Accessibility & Compliance Audit' },
                              { key: 'brokenLinksError', label: 'Broken Links & Console Script Error Check' },
                              { key: 'cmsPluginCheck', label: 'CMS Core & Plugin Compatibility Check' },
                              { key: 'detailedAuditReport', label: 'Executive Recommendations & Audit Report' },
                            ].map(({ key, label }) => {
                              const isChecked = proposal.servicesScope?.websiteAudit?.[key as keyof WebsiteAuditScope] ?? true;
                              return (
                                <label
                                  key={key}
                                  className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                                    isChecked
                                      ? 'bg-blue-50/60 border-blue-200 text-slate-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!isChecked}
                                    onChange={(e) => updateServiceDetail('websiteAudit', key, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500/50"
                                  />
                                  <span className={`text-[11px] font-medium ${isChecked ? 'text-slate-800 font-semibold' : 'text-slate-400 line-through'}`}>
                                    {label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Scope of Work Field */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Custom Scope of Work & Additional Audit Points (One requirement per line)
                          </label>
                          <textarea
                            rows={3}
                            value={proposal.servicesScope?.websiteAudit?.customScopeOfWork || ''}
                            placeholder="e.g. Third-party API integration & CRM sync audit&#10;Multilingual translation database performance check&#10;Custom payment gateway checkout flow security audit"
                            onChange={(e) => updateServiceDetail('websiteAudit', 'customScopeOfWork', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans font-mono placeholder:font-sans"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Custom items entered here will be appended seamlessly to the selected checklist points on the proposal document.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Delivery Timeline</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.websiteAudit?.timeline || '5 to 7 Business Days'}
                              onChange={(e) => updateServiceDetail('websiteAudit', 'timeline', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Deliverables & Report Format</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.websiteAudit?.deliverablesSummary || 'Comprehensive PDF Technical Audit Report & Priority Action Matrix'}
                              onChange={(e) => updateServiceDetail('websiteAudit', 'deliverablesSummary', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service 2: Hosting & Domain Renewal */}
                  <div className={`p-5 border rounded-2xl transition-all ${
                    (proposal.servicesScope?.selectedServices || []).includes('hosting_domain')
                      ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-100'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(proposal.servicesScope?.selectedServices || []).includes('hosting_domain')}
                          onChange={() => toggleModularService('hosting_domain')}
                          className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500/50"
                        />
                        <div>
                          <span className="font-sans font-bold text-sm text-slate-800 block">Hosting & Domain Renewal Module</span>
                          <span className="text-[11px] text-slate-500">Cloud web hosting server renewal, domain registry renewal, DNS management & backups</span>
                        </div>
                      </label>
                      {(proposal.servicesScope?.selectedServices || []).includes('hosting_domain') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">Module Cost:</span>
                          <div className="relative">
                            <input
                              type="number"
                              value={proposal.servicesScope?.hostingDomain?.cost || 0}
                              onChange={(e) => updateServiceDetail('hostingDomain', 'cost', Number(e.target.value))}
                              className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-right pr-11 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">QAR</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(proposal.servicesScope?.selectedServices || []).includes('hosting_domain') && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <Landmark className="h-4 w-4 text-blue-600" />
                              Hosting & Domain Renewal Items
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Add and manage individual hosting server and domain renewal entries for this proposal.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addHostingDomainEntry}
                            className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Hosting / Domain Entry
                          </button>
                        </div>

                        {/* ENTRIES LIST */}
                        {(!proposal.servicesScope?.hostingDomain?.entries || proposal.servicesScope.hostingDomain.entries.length === 0) ? (
                          <div className="text-center py-8 border border-dashed border-slate-300 rounded-xl bg-white space-y-2">
                            <p className="text-xs text-slate-500 font-medium">No hosting or domain renewal items added yet.</p>
                            <button
                              type="button"
                              onClick={addHostingDomainEntry}
                              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 transition-all inline-flex items-center gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add First Renewal Item
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(proposal.servicesScope?.hostingDomain?.entries || []).map((entry, idx) => (
                              <div key={entry.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs hover:border-blue-200 transition-all relative">
                                <div className="flex items-center justify-between border-b border-slate-150 pb-2.5">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-mono flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </span>
                                    {entry.domainName ? entry.domainName : `Renewal Record #${idx + 1}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeHostingDomainEntry(entry.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remove Entry"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Domain Name</label>
                                    <input
                                      type="text"
                                      value={entry.domainName || ''}
                                      placeholder="e.g. clientdomain.com"
                                      onChange={(e) => updateHostingDomainEntry(entry.id, 'domainName', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Hosting Provider</label>
                                    <input
                                      type="text"
                                      value={entry.hostingProvider || ''}
                                      placeholder="e.g. AWS Cloud / Godaddy / Ooredoo"
                                      onChange={(e) => updateHostingDomainEntry(entry.id, 'hostingProvider', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Hosting Plan / Package</label>
                                    <input
                                      type="text"
                                      value={entry.hostingPlan || ''}
                                      placeholder="e.g. NVMe High-Speed SSD Server"
                                      onChange={(e) => updateHostingDomainEntry(entry.id, 'hostingPlan', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Renewal Date</label>
                                    <input
                                      type="text"
                                      value={entry.renewalDate || ''}
                                      placeholder="YYYY-MM-DD"
                                      onChange={(e) => updateHostingDomainEntry(entry.id, 'renewalDate', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Renewal Duration</label>
                                    <input
                                      type="text"
                                      value={entry.renewalDuration || '1 Year'}
                                      placeholder="e.g. 1 Year, 2 Years"
                                      onChange={(e) => updateHostingDomainEntry(entry.id, 'renewalDuration', e.target.value)}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Renewal Cost (QAR)</label>
                                    <input
                                      type="number"
                                      value={entry.renewalCost || 0}
                                      onChange={(e) => updateHostingDomainEntry(entry.id, 'renewalCost', Number(e.target.value))}
                                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Additional Notes / Specs (Optional)</label>
                                  <input
                                    type="text"
                                    value={entry.notes || ''}
                                    placeholder="e.g. Primary production server, SSL included, 99.9% Uptime SLA"
                                    onChange={(e) => updateHostingDomainEntry(entry.id, 'notes', e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600"
                                  />
                                </div>
                              </div>
                            ))}

                            <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                              <button
                                type="button"
                                onClick={addHostingDomainEntry}
                                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs"
                              >
                                <Plus className="h-3.5 w-3.5 text-blue-600" />
                                Add More
                              </button>
                              <div className="text-right text-xs font-bold text-slate-800">
                                Total Module Renewal Items: <span className="font-mono text-blue-700 font-extrabold mr-3">{(proposal.servicesScope?.hostingDomain?.entries || []).length}</span>
                                Combined Subtotal: <span className="font-mono text-emerald-700 font-extrabold">{formatQAR((proposal.servicesScope?.hostingDomain?.entries || []).reduce((sum, e) => sum + (Number(e.renewalCost) || 0), 0))}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Service 3: SSL Renewal */}
                  <div className={`p-5 border rounded-2xl transition-all ${
                    (proposal.servicesScope?.selectedServices || []).includes('ssl_renewal')
                      ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-100'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(proposal.servicesScope?.selectedServices || []).includes('ssl_renewal')}
                          onChange={() => toggleModularService('ssl_renewal')}
                          className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500/50"
                        />
                        <div>
                          <span className="font-sans font-bold text-sm text-slate-800 block">SSL Renewal & Security Certificate</span>
                          <span className="text-[11px] text-slate-500">2048-bit RSA Encryption SSL installation, server CSR key generation & HTTPS binding</span>
                        </div>
                      </label>
                      {(proposal.servicesScope?.selectedServices || []).includes('ssl_renewal') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">Module Cost:</span>
                          <div className="relative">
                            <input
                              type="number"
                              value={proposal.servicesScope?.sslRenewal?.cost || 0}
                              onChange={(e) => updateServiceDetail('sslRenewal', 'cost', Number(e.target.value))}
                              className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-right pr-11 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">QAR</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(proposal.servicesScope?.selectedServices || []).includes('ssl_renewal') && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">SSL Certificate Type</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.sslRenewal?.sslType || '2048-bit RSA High-Assurance SSL Certificate'}
                              onChange={(e) => updateServiceDetail('sslRenewal', 'sslType', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">SSL Validity Term (Years)</label>
                            <input
                              type="number"
                              min={1}
                              max={5}
                              value={proposal.servicesScope?.sslRenewal?.sslYears || 1}
                              onChange={(e) => updateServiceDetail('sslRenewal', 'sslYears', Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service 4: AMC */}
                  <div className={`p-5 border rounded-2xl transition-all ${
                    (proposal.servicesScope?.selectedServices || []).includes('amc')
                      ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-100'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(proposal.servicesScope?.selectedServices || []).includes('amc')}
                          onChange={() => toggleModularService('amc')}
                          className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500/50"
                        />
                        <div>
                          <span className="font-sans font-bold text-sm text-slate-800 block">Annual Maintenance Contract (AMC)</span>
                          <span className="text-[11px] text-slate-500">Ongoing technical maintenance, core/plugin updates, backups, security & priority support SLA</span>
                        </div>
                      </label>
                      {(proposal.servicesScope?.selectedServices || []).includes('amc') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">Module Cost:</span>
                          <div className="relative">
                            <input
                              type="number"
                              value={proposal.servicesScope?.amc?.cost || 0}
                              onChange={(e) => updateServiceDetail('amc', 'cost', Number(e.target.value))}
                              className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-right pr-11 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">QAR</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(proposal.servicesScope?.selectedServices || []).includes('amc') && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Contract Duration</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.amc?.contractPeriod || '12 Months Annual Contract'}
                              onChange={(e) => updateServiceDetail('amc', 'contractPeriod', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Dedicated Support Hours / Month</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.amc?.supportHoursMonthly || 'Up to 5 Hours / Month'}
                              onChange={(e) => updateServiceDetail('amc', 'supportHoursMonthly', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">SLA Ticket Response Time</label>
                          <input
                            type="text"
                            value={proposal.servicesScope?.amc?.responseTimeSLA || 'Within 24 Hours Standard / 4 Hours Critical Outages'}
                            onChange={(e) => updateServiceDetail('amc', 'responseTimeSLA', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service 5: Custom Service */}
                  <div className={`p-5 border rounded-2xl transition-all ${
                    (proposal.servicesScope?.selectedServices || []).includes('custom_service')
                      ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-100'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(proposal.servicesScope?.selectedServices || []).includes('custom_service')}
                          onChange={() => toggleModularService('custom_service')}
                          className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500/50"
                        />
                        <div>
                          <span className="font-sans font-bold text-sm text-slate-800 block">Custom Service Module</span>
                          <span className="text-[11px] text-slate-500">Manually define a custom title, scope of work, deliverables, timeline, and pricing</span>
                        </div>
                      </label>
                      {(proposal.servicesScope?.selectedServices || []).includes('custom_service') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">Module Cost:</span>
                          <div className="relative">
                            <input
                              type="number"
                              value={proposal.servicesScope?.customService?.cost || 0}
                              onChange={(e) => updateServiceDetail('customService', 'cost', Number(e.target.value))}
                              className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-right pr-11 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">QAR</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(proposal.servicesScope?.selectedServices || []).includes('custom_service') && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Service Title</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.customService?.title || ''}
                              placeholder="e.g. Custom API & CRM Integration"
                              onChange={(e) => updateServiceDetail('customService', 'title', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Delivery Timeline</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.customService?.timeline || ''}
                              placeholder="e.g. 2 to 3 Weeks"
                              onChange={(e) => updateServiceDetail('customService', 'timeline', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Service Description & Summary</label>
                          <textarea
                            rows={2}
                            value={proposal.servicesScope?.customService?.description || ''}
                            placeholder="Briefly describe the overview and purpose of this custom service module..."
                            onChange={(e) => updateServiceDetail('customService', 'description', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Scope of Work (One item per line)</label>
                          <textarea
                            rows={4}
                            value={proposal.servicesScope?.customService?.scopeOfWork || ''}
                            placeholder="1. Third-party payment gateway integration&#10;2. Multi-language database translation setup&#10;3. Custom analytics tracking setup"
                            onChange={(e) => updateServiceDetail('customService', 'scopeOfWork', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Deliverables & Report Format</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.customService?.deliverables || ''}
                              placeholder="e.g. Configured Module, API Documentation & Admin Guide"
                              onChange={(e) => updateServiceDetail('customService', 'deliverables', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Terms & Conditions / Special Notes</label>
                            <input
                              type="text"
                              value={proposal.servicesScope?.customService?.termsConditions || ''}
                              placeholder="e.g. Subject to client API credential provisioning."
                              onChange={(e) => updateServiceDetail('customService', 'termsConditions', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : isBranding ? (
                /* BRANDING SCOPE FORM */
                <div className="space-y-4">
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-sm tracking-tight mb-1">
                      Visual Identity Deliverables
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal mb-4 font-sans">
                      Check each item that needs to be created on behalf of the client. Only checked components will materialize in the deliverables scope sheet.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Iterate over branding Scope keys */}
                    {Object.entries(proposal.brandingScope)
                      .filter(([key]) => key !== 'additionalDeliverables')
                      .map(([key, val]) => {
                        const wordFormatted = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <label 
                            key={key} 
                            className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer select-none transition-all hover:bg-slate-50 ${
                              val 
                                ? 'bg-blue-50/50 border-blue-200 text-slate-800 font-semibold' 
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={val as boolean}
                              onChange={(e) => updateBrandingScope(key as keyof Proposal['brandingScope'], e.target.checked)}
                              className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500/50"
                            />
                            <span className="text-xs leading-none font-sans">
                              {wordFormatted}
                            </span>
                          </label>
                        );
                      })
                    }
                  </div>

                  {/* Additional text field */}
                  <div className="flex flex-col gap-1.5 mt-4">
                    <label className="text-xs font-sans font-semibold text-slate-700">Any Additional Visual Deliverables?</label>
                    <input
                      type="text"
                      placeholder="e.g. Scented Packing Tape, Embossed Gold Foil seal, Acrylic Office Wall Sign"
                      value={proposal.brandingScope.additionalDeliverables}
                      onChange={(e) => updateBrandingScope('additionalDeliverables', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow"
                      id="input-branding-add-scope"
                    />
                  </div>
                </div>
              ) : (
                /* WEBSITE SCOPE FORM WITH ENHANCED MODULE DEFINITIONS */
                <div className="space-y-8 select-none">
                  {/* Part A: Base Parameters */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-5">
                    <div>
                      <h4 className="font-sans font-bold text-slate-800 text-xs tracking-wider uppercase mb-1">
                        1. Core Web System Parameters
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans">
                        Setup the baseline page capacity, framework mechanisms, translation profile, and maintenance parameters.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Pages total */}
                      <div className="flex flex-col gap-1.5 p-3.5 bg-white border border-slate-200/60 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-sans font-bold text-slate-700">Total Page Templates</label>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-sans font-bold">
                            {proposal.websiteScope.totalPages} Pages
                          </span>
                        </div>
                        <div className="relative w-full h-5 bg-slate-100 border-2 border-[#0b57d0] rounded-full flex items-center px-1">
                          <input
                            type="range"
                            min="2"
                            max="50"
                            value={proposal.websiteScope.totalPages}
                            onChange={(e) => updateWebsiteScope('totalPages', Number(e.target.value))}
                            className="w-full appearance-none bg-transparent cursor-pointer focus:outline-hidden [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-xs [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-xs"
                          />
                        </div>
                        <span className="text-[9px] text-slate-400">Slider adjusts vertical sitemap elements automatically below.</span>
                      </div>

                      {/* Language and CMS */}
                      <div className="flex flex-col gap-2 bg-white border border-slate-200/60 p-3.5 rounded-xl">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-sans font-semibold text-slate-700">Target Languages</label>
                          <input
                            type="text"
                            placeholder="e.g. English & Arabic (Dual-Language)"
                            value={proposal.websiteScope.languages}
                            onChange={(e) => updateWebsiteScope('languages', e.target.value)}
                            className="w-full px-3 py-1 border border-slate-300 rounded-lg text-xs font-sans focus:outline-hidden"
                          />
                        </div>
                        <div className="flex flex-col gap-1 mt-0.5">
                          <label className="text-xs font-sans font-semibold text-slate-700">CMS Framework Type</label>
                          <select
                            value={proposal.websiteScope.cmsType}
                            onChange={(e) => updateWebsiteScope('cmsType', e.target.value)}
                            className="w-full px-3 py-1 border border-slate-300 rounded-lg text-xs font-sans focus:outline-hidden bg-white"
                          >
                            <option value="WordPress">WordPress Core (Yoast Setup)</option>
                            <option value="headless-strapi">Headless CMS (Strapi + Next.js)</option>
                            <option value="Shopify Engine">Shopify eCommerce Framework</option>
                            <option value="Custom API Hub">Custom Node/Express Engine</option>
                            <option value="Static HTML5/SPA">Pure Static HTML5 / React SPA</option>
                          </select>
                        </div>
                      </div>

                      {/* Launch Maintenance Support */}
                      <div className="flex flex-col gap-1.5 p-3.5 bg-white border border-slate-200/60 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-sans font-bold text-slate-700">Launch Maintenance Support</label>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-sans font-bold">
                            {proposal.websiteScope.maintenancePeriod} Months
                          </span>
                        </div>
                        <div className="relative w-full h-5 bg-slate-100 border-2 border-[#0b57d0] rounded-full flex items-center px-1">
                          <input
                            type="range"
                            min="1"
                            max="24"
                            value={proposal.websiteScope.maintenancePeriod}
                            onChange={(e) => updateWebsiteScope('maintenancePeriod', Number(e.target.value))}
                            className="w-full appearance-none bg-transparent cursor-pointer focus:outline-hidden [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-xs [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-xs"
                          />
                        </div>
                        <span className="text-[9px] text-slate-400">Slider adjusts post-launch maintenance terms automatically below.</span>
                      </div>
                    </div>
                  </div>

                  {/* Part B: Website Type Selector (Dropdown) & Baseline Scope Items List */}
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <label htmlFor="website-type-select" className="text-xs font-bold font-sans text-slate-700 block uppercase tracking-wide">
                            2. Website Type Selection (Primary Control)
                          </label>
                          <span className="text-[11px] text-slate-400 block font-normal leading-normal">
                            Choose a template category below to automatically load its industry-standard baseline deliverables.
                          </span>
                        </div>
                        <select
                          id="website-type-select"
                          value={proposal.websiteScope.websiteType || 'static'}
                          onChange={(e) => {
                            const newType = e.target.value as 'static' | 'dynamic' | 'ecommerce';
                            const baseTemplates = DEFAULT_SCOPE_TEMPLATES[newType];
                            const freshItems = baseTemplates.map((item, idx) => ({
                              id: `scope_${newType}_${idx}_${Date.now()}`,
                              title: item.title,
                              description: item.description,
                              isSelected: true,
                              isCustom: false
                            }));
                            setProposal(prev => ({
                              ...prev,
                              websiteScope: {
                                ...prev.websiteScope,
                                websiteType: newType,
                                scopeItems: freshItems
                              }
                            }));
                          }}
                          className="px-3.5 py-2 border border-blue-200 text-xs font-bold font-sans text-blue-700 rounded-xl focus:ring-2 focus:ring-blue-100 bg-blue-50/50 focus:outline-hidden min-w-[220px]"
                        >
                          <option value="static">Static Website Scope</option>
                          <option value="dynamic">Dynamic Website Scope</option>
                          <option value="ecommerce">E-commerce Website Scope</option>
                        </select>
                      </div>

                      {/* PROGRESSIVE SCOPE FLOW (ANTI-CLUTTER SYSTEM) */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <h5 className="text-xs font-bold font-sans text-slate-700 uppercase tracking-widest">
                              Progressive Scope Blueprint Checklist
                            </h5>
                            <p className="text-[10px] text-slate-400 font-sans">
                              Deliverables are grouped into structured lanes.
                            </p>
                          </div>
                          <span className="text-[10.5px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold font-mono border border-blue-100 shrink-0">
                            {(proposal.websiteScope.scopeItems || []).filter(i => i.isSelected).length} / {(proposal.websiteScope.scopeItems || []).length} Selected
                          </span>
                        </div>

                        {/* Page/Section subtabs */}
                        <div className="grid grid-cols-2 min-[550px]:grid-cols-5 gap-1.5 p-1 bg-slate-50/85 border border-slate-200/50 rounded-2xl">
                          {(['core', 'features', 'integrations', 'analytics', 'custom'] as const).map((cat) => {
                            const catLabel = cat === 'core' ? '1. Core Structure' :
                                             cat === 'features' ? '2. Features' :
                                             cat === 'integrations' ? '3. Integrations' :
                                             cat === 'analytics' ? '4. Analytics' : '5. Custom Info';
                            
                            const allScopeItems = (proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.length > 0)
                              ? proposal.websiteScope.scopeItems
                              : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].map((item, idx) => ({
                                  id: `scope_${proposal.websiteScope.websiteType || 'static'}_${idx}`,
                                  title: item.title,
                                  description: item.description,
                                  isSelected: item.isSelected,
                                  isCustom: false
                                }));

                            const catItems = allScopeItems.filter(i => getScopeCategory(i.title, i.isCustom) === cat);
                            const selectedCount = catItems.filter(i => i.isSelected).length;
                            const totalCount = catItems.length;
                            const isActive = activeScopeTab === cat;

                            return (
                              <button
                                type="button"
                                key={cat}
                                onClick={() => setActiveScopeTab(cat)}
                                className={`text-left p-2.5 rounded-xl flex flex-col justify-between transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-slate-100 border border-slate-200/30 text-slate-700'
                                }`}
                              >
                                <span className="text-[9.5px] font-bold truncate tracking-tight block">
                                  {catLabel}
                                </span>
                                <span className={`text-[8.5px] mt-1 font-mono font-bold block ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                                  {selectedCount} / {totalCount} select
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Current lane's items */}
                        <div className="space-y-3">
                          {(() => {
                            const allScopeItems = (proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.length > 0)
                              ? proposal.websiteScope.scopeItems
                              : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].map((item, idx) => ({
                                  id: `scope_${proposal.websiteScope.websiteType || 'static'}_${idx}`,
                                  title: item.title,
                                  description: item.description,
                                  isSelected: item.isSelected,
                                  isCustom: false
                                }));

                            const filteredItems = allScopeItems.filter(item => getScopeCategory(item.title, item.isCustom) === activeScopeTab);
                            
                            // Visual threshold notice
                            const exceedsThreshold = filteredItems.filter(i => i.isSelected).length > 3;
                            const pageSplitsCount = Math.ceil(filteredItems.filter(i => i.isSelected).length / 3);

                            return (
                              <>
                                {exceedsThreshold && (
                                  <div className="p-2.5 bg-blue-50/50 border border-blue-100 text-[10px] text-blue-800 rounded-xl leading-normal font-sans flex items-center gap-2 select-none">
                                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                    <div>
                                      <strong>Anti-Clutter Page Split Active:</strong> This lane has {filteredItems.filter(i => i.isSelected).length} selected items (exceeding the visual limit of 3). It will automatically divide into <strong>{pageSplitsCount} split pages</strong> (Pages {activeScopeTab === 'core' ? '1a, 1b' : activeScopeTab === 'features' ? '2a, 2b' : activeScopeTab === 'integrations' ? '3a, 3b' : activeScopeTab === 'analytics' ? '4a, 4b' : '5a, 5b'}) in the generated PDF proposal to preserve pristine design.
                                    </div>
                                  </div>
                                )}

                                {filteredItems.length === 0 ? (
                                  <div className="p-8 text-center border-2 border-dashed border-slate-150 rounded-2xl text-slate-400 text-[11px] font-sans">
                                    No elements found in this category. Use the custom builder below to inject items.
                                  </div>
                                ) : (
                                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                    {filteredItems.map((item, index) => {
                                      const isEditing = editingItemId === item.id;
                                      return (
                                        <div 
                                          key={item.id}
                                          className={`p-3 border rounded-xl transition-all ${
                                            item.isSelected 
                                              ? 'bg-blue-50/10 border-blue-200/80 shadow-xs' 
                                              : 'bg-slate-50/30 border-slate-150 text-slate-400'
                                          }`}
                                        >
                                          {isEditing ? (
                                            /* Inline editing mode */
                                            <div className="space-y-3">
                                              <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-blue-600 uppercase font-mono">Editing Scope Item</span>
                                                <button 
                                                  type="button"
                                                  onClick={() => setEditingItemId(null)}
                                                  className="text-slate-400 hover:text-slate-600 text-xs"
                                                >
                                                  <X className="h-4 w-4" />
                                                </button>
                                              </div>
                                              <div className="space-y-2">
                                                <input 
                                                  type="text"
                                                  value={editingItemTitle}
                                                  onChange={(e) => setEditingItemTitle(e.target.value)}
                                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                                                  placeholder="Item Title"
                                                />
                                                <textarea 
                                                  value={editingItemDesc}
                                                  onChange={(e) => setEditingItemDesc(e.target.value)}
                                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans resize-y min-h-[50px]"
                                                  placeholder="Item Description"
                                                />
                                              </div>
                                              <div className="flex gap-2 justify-end">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingItemId(null)}
                                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (!editingItemTitle.trim()) return;
                                                    const updated = allScopeItems.map(i => 
                                                      i.id === item.id ? { ...i, title: editingItemTitle, description: editingItemDesc } : i
                                                    );
                                                    setProposal(prev => ({
                                                      ...prev,
                                                      websiteScope: {
                                                        ...prev.websiteScope,
                                                        scopeItems: updated
                                                      }
                                                    }));
                                                    setEditingItemId(null);
                                                  }}
                                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                                                >
                                                  Save Changes
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            /* Normal list display with actions */
                                            <div className="flex items-start gap-3">
                                              {/* Select toggle */}
                                              <input 
                                                type="checkbox"
                                                checked={!!item.isSelected}
                                                id={`check-${item.id}`}
                                                onChange={(e) => {
                                                  const updated = allScopeItems.map(i => 
                                                    i.id === item.id ? { ...i, isSelected: e.target.checked } : i
                                                  );
                                                  setProposal(prev => ({
                                                    ...prev,
                                                    websiteScope: { ...prev.websiteScope, scopeItems: updated }
                                                  }));
                                                }}
                                                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer shrink-0 mt-0.5"
                                              />

                                              {/* Text Content */}
                                              <div className="grow">
                                                <label 
                                                  htmlFor={`check-${item.id}`} 
                                                  className={`text-xs font-bold block cursor-pointer select-none leading-snug ${
                                                    item.isSelected ? 'text-slate-800' : 'text-slate-400 line-through'
                                                  }`}
                                                >
                                                  {item.title}
                                                  {item.isCustom && (
                                                    <span className="ml-1.5 px-1.5 py-0.5 text-[8.5px] bg-blue-50 border border-blue-100/55 rounded-sm font-bold text-blue-600 uppercase tracking-wider inline-block font-sans">
                                                      Custom
                                                    </span>
                                                  )}
                                                </label>
                                                <p className={`text-[11px] mt-1 font-sans leading-normal ${
                                                  item.isSelected ? 'text-slate-500' : 'text-slate-400'
                                                }`}>
                                                  {item.description}
                                                </p>
                                              </div>

                                              {/* Actions Right (Edit, Reorder Up, Reorder Down, Delete) */}
                                              <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                  type="button"
                                                  title="Edit this item"
                                                  onClick={() => {
                                                    setEditingItemId(item.id);
                                                    setEditingItemTitle(item.title);
                                                    setEditingItemDesc(item.description);
                                                  }}
                                                  className="p-1 hover:bg-slate-100/80 rounded text-slate-400 hover:text-slate-700 transition-colors"
                                                >
                                                  <Edit3 className="h-3 w-3" />
                                                </button>

                                                <button
                                                  type="button"
                                                  title="Move Up"
                                                  disabled={index === 0}
                                                  onClick={() => {
                                                    if (index === 0) return;
                                                    const currentGlobalIdx = allScopeItems.findIndex(i => i.id === item.id);
                                                    const targetItem = filteredItems[index - 1];
                                                    const targetGlobalIdx = allScopeItems.findIndex(i => i.id === targetItem.id);
                                                    if (currentGlobalIdx !== -1 && targetGlobalIdx !== -1) {
                                                      const updated = [...allScopeItems];
                                                      const temp = updated[currentGlobalIdx];
                                                      updated[currentGlobalIdx] = updated[targetGlobalIdx];
                                                      updated[targetGlobalIdx] = temp;
                                                      setProposal(prev => ({
                                                        ...prev,
                                                        websiteScope: { ...prev.websiteScope, scopeItems: updated }
                                                      }));
                                                    }
                                                  }}
                                                  className={`p-1 rounded transition-colors ${
                                                    index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100/85 hover:text-slate-700'
                                                  }`}
                                                >
                                                  <ArrowUp className="h-3 w-3" />
                                                </button>

                                                <button
                                                  type="button"
                                                  title="Move Down"
                                                  disabled={index === filteredItems.length - 1}
                                                  onClick={() => {
                                                    if (index === filteredItems.length - 1) return;
                                                    const currentGlobalIdx = allScopeItems.findIndex(i => i.id === item.id);
                                                    const targetItem = filteredItems[index + 1];
                                                    const targetGlobalIdx = allScopeItems.findIndex(i => i.id === targetItem.id);
                                                    if (currentGlobalIdx !== -1 && targetGlobalIdx !== -1) {
                                                      const updated = [...allScopeItems];
                                                      const temp = updated[currentGlobalIdx];
                                                      updated[currentGlobalIdx] = updated[targetGlobalIdx];
                                                      updated[targetGlobalIdx] = temp;
                                                      setProposal(prev => ({
                                                        ...prev,
                                                        websiteScope: { ...prev.websiteScope, scopeItems: updated }
                                                      }));
                                                    }
                                                  }}
                                                  className={`p-1 rounded transition-colors ${
                                                    index === filteredItems.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100/85 hover:text-slate-700'
                                                  }`}
                                                >
                                                  <ArrowDown className="h-3 w-3" />
                                                </button>

                                                <button
                                                  type="button"
                                                  title="Delete"
                                                  onClick={() => {
                                                    const updated = allScopeItems.filter(i => i.id !== item.id);
                                                    setProposal(prev => ({
                                                      ...prev,
                                                      websiteScope: { ...prev.websiteScope, scopeItems: updated }
                                                    }));
                                                  }}
                                                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-slate-400 transition-colors"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part C: Predefined Additional Modules & Custom Scope Builder */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div>
                      <h4 className="font-sans font-bold text-slate-800 text-xs tracking-wider uppercase mb-1">
                        3. Custom Scope Builder
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans">
                        Add completely new deliverables, or inject high-demand functional feature modules into the scope stack instantly.
                      </p>
                    </div>

                    {/* Predefined Addables list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider block">
                        Quick Add Baseline Feature Modules
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const currentScopeItems = (proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.length > 0)
                            ? proposal.websiteScope.scopeItems
                            : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].map((item, idx) => ({
                                id: `scope_${proposal.websiteScope.websiteType || 'static'}_${idx}`,
                                title: item.title,
                                description: item.description,
                                isSelected: item.isSelected,
                                isCustom: false
                              }));

                          return [
                            { 
                              name: "Blog system", 
                              title: "Blog & CMS Article Publication Hub", 
                              desc: "Fully built-in articles section with categorized archives, keyword semantic post-tagging, dynamic readers comment loops, and search engine friendliness." 
                            },
                            { 
                              name: "Multi-language support", 
                              title: "Multilingual Language Routing & Translation", 
                              desc: "Comprehensive dual-language subfolder routing containing a clean visual menu language switcher to accommodate diverse consumer profiles." 
                            },
                            { 
                              name: "Third-party integrations", 
                              title: "HubSpot CRM Sync & WhatsApp Live Support", 
                              desc: "Dynamic live chat popups linking direct with localized client WhatsApp triggers, paired with secure custom webhooks updating lead CRMs automatically." 
                            },
                            { 
                              name: "Analytics & tracking setup", 
                              title: "Google Analytics 4 & Conversion Event Mapping", 
                              desc: "Technical deployment of unified Google Tag Manager scripts configuring custom telemetry events tracking click funnels or key goal checkouts." 
                            },
                            { 
                              name: "Custom API development", 
                              title: "Custom Secured Backend Webhook & Service APIs", 
                              desc: "Architecting dedicated serverless microservice APIs to query structured database records, execute webhooks, or query business software." 
                            }
                          ].map((mod) => {
                            // Find if this module is already active in currentScopeItems
                            const existingItem = currentScopeItems.find(i => i.title.toLowerCase() === mod.title.toLowerCase());
                            const isActive = !!(existingItem && existingItem.isSelected);

                            return (
                              <button
                                type="button"
                                key={mod.name}
                                onClick={() => {
                                  let updated;
                                  if (existingItem) {
                                    // Toggle isSelected
                                    updated = currentScopeItems.map(i => 
                                      i.id === existingItem.id ? { ...i, isSelected: !i.isSelected } : i
                                    );
                                  } else {
                                    // Add as new item
                                    const newItem = {
                                      id: `scope_custom_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
                                      title: mod.title,
                                      description: mod.desc,
                                      isSelected: true,
                                      isCustom: true
                                    };
                                    updated = [...currentScopeItems, newItem];
                                  }

                                  setProposal(prev => ({
                                    ...prev,
                                    websiteScope: {
                                      ...prev.websiteScope,
                                      scopeItems: updated
                                    }
                                  }));
                                }}
                                className={`rounded-full px-3 py-1 font-sans font-semibold text-[10.5px] transition-all cursor-pointer inline-flex items-center gap-1 shrink-0 border ${
                                  isActive 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                                    : 'bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600'
                                }`}
                              >
                                {isActive ? <Check className="h-2.5 w-2.5 animate-pulse" /> : <Plus className="h-2.5 w-2.5" />}
                                <span>{mod.name}</span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Custom Form entry */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <span className="text-[10.5px] font-bold text-slate-700 block uppercase font-mono tracking-wider">Define Customized Deliverable</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Deliverable Title (e.g. Video Showcase Board)"
                          value={customItemTitle}
                          onChange={(e) => setCustomItemTitle(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-250 bg-white rounded-lg text-xs font-sans"
                        />
                        <input
                          type="text"
                          placeholder="Description explaining scope boundary details..."
                          value={customItemDesc}
                          onChange={(e) => setCustomItemDesc(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-250 bg-white rounded-lg text-xs font-sans"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!customItemTitle.trim()) return;
                            const currentScopeItems = (proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.length > 0)
                              ? proposal.websiteScope.scopeItems
                              : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].map((item, idx) => ({
                                  id: `scope_${proposal.websiteScope.websiteType || 'static'}_${idx}`,
                                  title: item.title,
                                  description: item.description,
                                  isSelected: item.isSelected,
                                  isCustom: false
                                }));

                            const newItem = {
                              id: `scope_custom_user_${Date.now()}`,
                              title: customItemTitle.trim(),
                              description: customItemDesc.trim() || "Custom development deliverable as defined by project requirements.",
                              isSelected: true,
                              isCustom: true
                            };
                            
                            setProposal(prev => ({
                              ...prev,
                              websiteScope: {
                                ...prev.websiteScope,
                                scopeItems: [...currentScopeItems, newItem]
                              }
                            }));
                            setCustomItemTitle('');
                            setCustomItemDesc('');
                          }}
                          disabled={!customItemTitle.trim()}
                          className={`px-4 py-1.5 font-sans font-bold text-xs rounded-lg inline-flex items-center gap-1.5 transition-all ${
                            customItemTitle.trim() 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-sm' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Direct Deliverable</span>
                        </button>
                      </div>
                    </div>

                    {/* Live interactive Custom Scope Items Management Box */}
                    {(() => {
                      const currentScopeItems = (proposal.websiteScope.scopeItems && proposal.websiteScope.scopeItems.length > 0)
                        ? proposal.websiteScope.scopeItems
                        : DEFAULT_SCOPE_TEMPLATES[proposal.websiteScope.websiteType || 'static'].map((item, idx) => ({
                            id: `scope_${proposal.websiteScope.websiteType || 'static'}_${idx}`,
                            title: item.title,
                            description: item.description,
                            isSelected: item.isSelected,
                            isCustom: false
                          }));

                      const customItems = currentScopeItems.filter(i => i.isCustom || getScopeCategory(i.title, i.isCustom) === 'custom');

                      if (customItems.length === 0) return null;

                      return (
                        <div className="border border-slate-150 rounded-xl overflow-hidden mt-2 bg-slate-50/40">
                          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wider flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                              Active Custom Deliverables ({customItems.length})
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">Changes sync instantly</span>
                          </div>
                          
                          <div className="divide-y divide-slate-150 max-h-[250px] overflow-y-auto">
                            {customItems.map((item) => {
                              const isEditingThis = editingItemId === item.id;
                              return (
                                <div key={item.id} className="p-3 bg-white hover:bg-slate-50/50 transition-colors">
                                  {isEditingThis ? (
                                    <div className="space-y-2.5">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-blue-600 font-mono uppercase">Editing Custom Item</span>
                                        <button 
                                          type="button"
                                          onClick={() => setEditingItemId(null)}
                                          className="text-slate-400 hover:text-slate-650"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                      <input 
                                        type="text"
                                        value={editingItemTitle}
                                        onChange={(e) => setEditingItemTitle(e.target.value)}
                                        className="w-full px-3 py-1 border border-slate-300 rounded text-xs font-bold font-sans"
                                      />
                                      <textarea 
                                        value={editingItemDesc}
                                        onChange={(e) => setEditingItemDesc(e.target.value)}
                                        className="w-full px-3 py-1 border border-slate-300 rounded text-xs font-sans resize-y min-h-[45px]"
                                      ></textarea>
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setEditingItemId(null)}
                                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold rounded"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!editingItemTitle.trim()) return;
                                            const updated = currentScopeItems.map(i => 
                                              i.id === item.id ? { ...i, title: editingItemTitle, description: editingItemDesc } : i
                                            );
                                            setProposal(prev => ({
                                              ...prev,
                                              websiteScope: { ...prev.websiteScope, scopeItems: updated }
                                            }));
                                            setEditingItemId(null);
                                          }}
                                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-semibold rounded"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2.5 min-w-0">
                                        <input 
                                          type="checkbox"
                                          checked={!!item.isSelected}
                                          onChange={(e) => {
                                            const updated = currentScopeItems.map(i => 
                                              i.id === item.id ? { ...i, isSelected: e.target.checked } : i
                                            );
                                            setProposal(prev => ({
                                              ...prev,
                                              websiteScope: { ...prev.websiteScope, scopeItems: updated }
                                            }));
                                          }}
                                          className="h-3.5 w-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer mt-0.5 shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <span className={`text-[11.5px] font-bold block ${item.isSelected ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                            {item.title}
                                          </span>
                                          <p className={`text-[10.5px] font-sans mt-0.5 leading-normal ${item.isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {item.description}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingItemId(item.id);
                                            setEditingItemTitle(item.title);
                                            setEditingItemDesc(item.description);
                                          }}
                                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = currentScopeItems.filter(i => i.id !== item.id);
                                            setProposal(prev => ({
                                              ...prev,
                                              websiteScope: { ...prev.websiteScope, scopeItems: updated }
                                            }));
                                          }}
                                          className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-slate-404"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Omnichannel E-Commerce System Settings (Only shown for ecommerce type) */}
                  {proposal.websiteScope.websiteType === 'ecommerce' && (
                    <div className="border border-blue-200 rounded-2xl p-5 bg-blue-50/10 space-y-5">
                      <div>
                        <h4 className="font-sans font-bold text-blue-800 text-xs tracking-wider uppercase mb-1">
                          4. Omnichannel E-Commerce Sync & Gateways Configuration
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-normal font-sans">
                          Customize backend Odoo ERP syncing points, checkout payment gateways, and core development technology frameworks directly.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Odoo synchronization */}
                        <div className="bg-white border border-slate-200/60 p-4 rounded-xl space-y-3">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                            Odoo ERP Active Sync Targets:
                          </label>
                          <div className="space-y-2">
                            {["Product Catalog", "Real-Time Inventory Status", "Sales Orders Processing", "Customer Profiles", "POS Synchronization", "Multi-Branch Routing"].map((mod) => {
                              const isChecked = (proposal.websiteScope.ecommerceOdooSyncModules || []).includes(mod);
                              return (
                                <label key={mod} className="flex items-center gap-2.5 cursor-pointer text-xs font-sans text-slate-600 select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const cur = proposal.websiteScope.ecommerceOdooSyncModules || [];
                                      const updated = cur.includes(mod) ? cur.filter(m => m !== mod) : [...cur, mod];
                                      setProposal(prev => ({ ...prev, websiteScope: { ...prev.websiteScope, ecommerceOdooSyncModules: updated } }));
                                    }}
                                    className="h-3.5 w-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                  />
                                  <span>{mod}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Supported checkout payment gateways */}
                        <div className="bg-white border border-slate-200/60 p-4 rounded-xl space-y-3">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                            Online Gateway Integration Scopes:
                          </label>
                          <div className="space-y-2">
                            {["Credit/Debit Cards", "Cash on Delivery (COD)", "Apple Pay", "Google Pay", "Multi-Currency Routing"].map((gw) => {
                              const isChecked = (proposal.websiteScope.ecommercePaymentGateways || []).includes(gw);
                              return (
                                <label key={gw} className="flex items-center gap-2.5 cursor-pointer text-xs font-sans text-slate-600 select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const cur = proposal.websiteScope.ecommercePaymentGateways || [];
                                      const updated = cur.includes(gw) ? cur.filter(g => g !== gw) : [...cur, gw];
                                      setProposal(prev => ({ ...prev, websiteScope: { ...prev.websiteScope, ecommercePaymentGateways: updated } }));
                                    }}
                                    className="h-3.5 w-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                  />
                                  <span>{gw}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tech Stack choice block */}
                        <div className="bg-white border border-slate-200/60 p-4 rounded-xl space-y-3 md:col-span-2">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono mb-1">
                            Architectural System Blueprint:
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                              { label: "Frontend", key: "website", options: ["React.js / Next.js", "Vue.js / Nuxt.js", "Pure Static SPA"] },
                              { label: "Mobile Apps", key: "mobile", options: ["Flutter (Android & iOS)", "React Native", "Native iOS/Android"] },
                              { label: "Backend API", key: "backend", options: ["Node.js", "Laravel", "Python Django"] },
                              { label: "Database", key: "database", options: ["PostgreSQL", "MySQL", "MongoDB"] },
                              { label: "Hosting", key: "hosting", options: ["AWS Cloud", "Azure Cloud", "Google Cloud (GCP)"] }
                            ].map((s) => (
                              <div key={s.key} className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase font-sans">{s.label}</span>
                                <select
                                  value={(proposal.websiteScope.ecommerceTechStack as any)?.[s.key] || s.options[0]}
                                  onChange={(e) => {
                                    const stack = proposal.websiteScope.ecommerceTechStack || {};
                                    setProposal(prev => ({
                                      ...prev,
                                      websiteScope: {
                                        ...prev.websiteScope,
                                        ecommerceTechStack: { ...stack, [s.key]: e.target.value }
                                      }
                                    }));
                                  }}
                                  className="px-2 py-1.5 border border-slate-200 text-xs font-sans text-slate-700 rounded-lg bg-slate-50 focus:outline-hidden"
                                >
                                  {s.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Part E: Section-Level Notes */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div>
                      <h4 className="font-sans font-bold text-slate-800 text-xs tracking-wider uppercase mb-1">
                        5. Section-Level Details & Boundaries
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans">
                        Control technical clarity and boundary definitions under separate heads. Unpopulated fields are omitted back-end automatically.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Projects scope notes */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-sans font-bold text-slate-700">Project-Specific Notes</label>
                        <textarea
                          placeholder="Add detail notes e.g., 'Weekly sync calls will review prototype links; Figma specs provided first.'"
                          value={proposal.websiteScope.scopeNotes?.notes || ''}
                          onChange={(e) => {
                            const newNotes = { ...(proposal.websiteScope.scopeNotes || {}), notes: e.target.value };
                            setProposal(prev => ({ ...prev, websiteScope: { ...prev.websiteScope, scopeNotes: newNotes } }));
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-sans focus:outline-hidden min-h-[70px] resize-y"
                        />
                      </div>

                      {/* Exclusions */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-sans font-bold text-slate-700 font-sans">Define Exclusions</label>
                        <textarea
                          placeholder="Add boundary items e.g., 'Writing copy assets, specialized drone video capturing, or server bills are client obligations.'"
                          value={proposal.websiteScope.scopeNotes?.exclusions || ''}
                          onChange={(e) => {
                            const newNotes = { ...(proposal.websiteScope.scopeNotes || {}), exclusions: e.target.value };
                            setProposal(prev => ({ ...prev, websiteScope: { ...prev.websiteScope, scopeNotes: newNotes } }));
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-sans focus:outline-hidden min-h-[70px] resize-y"
                        />
                      </div>

                      {/* Client Requirements */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-sans font-bold text-slate-700">Client-Specific Requirements</label>
                        <textarea
                          placeholder="Add requirements e.g., 'All assets shared via central OneDrive; site must comply with government accessibility metrics WCAG 2.1.'"
                          value={proposal.websiteScope.scopeNotes?.requirements || ''}
                          onChange={(e) => {
                            const newNotes = { ...(proposal.websiteScope.scopeNotes || {}), requirements: e.target.value };
                            setProposal(prev => ({ ...prev, websiteScope: { ...prev.websiteScope, scopeNotes: newNotes } }));
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-sans focus:outline-hidden min-h-[70px] resize-y"
                        />
                      </div>

                      {/* Technical Clarifications */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-sans font-bold text-slate-700">Technical Clarifications</label>
                        <textarea
                          placeholder="Add technical constraints e.g., 'WordPress requires MySQL v8.0 and safe PHP 8.2 active setups. Target API uses JSON via REST endpoints.'"
                          value={proposal.websiteScope.scopeNotes?.clarifications || ''}
                          onChange={(e) => {
                            const newNotes = { ...(proposal.websiteScope.scopeNotes || {}), clarifications: e.target.value };
                            setProposal(prev => ({ ...prev, websiteScope: { ...prev.websiteScope, scopeNotes: newNotes } }));
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-sans focus:outline-hidden min-h-[70px] resize-y"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Built sitemap visual representation preview */}
                  <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 mt-4 shadow-sm">
                    <div className="px-2 pb-1 bg-slate-100 rounded-md py-1 mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Interactive Sitemap Blueprint Overview</span>
                    </div>
                    <SitemapGenerator 
                      scope={proposal.websiteScope} 
                      projectName={proposal.clientName} 
                      onUpdateScope={(updatedScope) => {
                        setProposal(prev => ({
                          ...prev,
                          websiteScope: updatedScope
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 4: Timeline */}
          {step === 4 && (
            <div id="step-4-form" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-sm tracking-tight mb-1">
                    Timeline Milestone Allocations
                  </h3>
                  <p className="text-xs text-slate-500 font-sans leading-normal">
                    Set the ultimate project duration in weeks and map specific high-priority goals.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 border border-blue-150 rounded-lg shrink-0">
                  <span className="text-xs font-sans font-bold text-slate-800">Project Weeks:</span>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={proposal.weeks}
                    onChange={(e) => updateField('weeks', Number(e.target.value))}
                    className="w-12 text-center bg-white border border-blue-200 font-mono text-xs font-bold py-0.5 rounded-sm focus:outline-hidden"
                    id="input-project-weeks"
                  />
                </div>
              </div>

              {/* Milestones dynamic list */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {(proposal.milestones || []).map((m, index) => (
                  <div 
                    key={m.id} 
                    className="flex flex-col md:flex-row gap-3 p-4 border border-slate-200 bg-slate-50/30 rounded-xl relative hover:border-slate-350 transition-colors"
                  >
                    <div className="flex flex-col gap-2 shrink-0 md:w-32 lg:w-40">
                      <label className="text-[10px] font-sans font-bold text-slate-400 uppercase">Sprint Span</label>
                      <input
                        type="text"
                        value={m.week}
                        placeholder="e.g. Week 1 - 2"
                        onChange={(e) => updateMilestone(m.id, 'week', e.target.value)}
                        className="w-full border border-slate-300 px-2 py-1 text-xs rounded-md bg-white font-mono"
                      />
                    </div>
                    
                    <div className="flex-grow flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-sans font-bold text-slate-400 uppercase">Milestone Goal</label>
                        <button
                          onClick={() => deleteMilestone(m.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Milestone"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={m.title}
                        placeholder="Deliverable module name"
                        onChange={(e) => updateMilestone(m.id, 'title', e.target.value)}
                        className="w-full border border-slate-300 px-2.5 py-1 text-xs font-bold rounded-md bg-white text-slate-800"
                      />
                      <textarea
                        rows={2}
                        value={m.description}
                        placeholder="Detailed deliverables inside this module scope..."
                        onChange={(e) => updateMilestone(m.id, 'description', e.target.value)}
                        className="w-full border border-slate-300 px-2.5 py-1 text-xs rounded-md bg-white text-slate-650 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addMilestone}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 py-3 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-600 hover:text-blue-700 transition-all font-semibold font-sans cursor-pointer bg-slate-50/50"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Milestone Goal
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Financials */}
          {step === 5 && (
            <div id="step-5-form" className="space-y-6">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-sm tracking-tight mb-1">
                  Commercial Investment Structuring
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-normal mb-4">
                  Financial calculations in Qatari Riyals (QAR) update in real-time as values are modified.
                </p>
              </div>

              {proposal.type === 'services' ? (
                /* Modular Services Financials Form */
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="bg-slate-100 py-2.5 px-4 text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
                      <span className="col-span-6">Service / Deliverable Item</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-4 text-right">Module Charge (QAR)</span>
                    </div>
                    <div className="divide-y divide-slate-150">
                      {(proposal.servicesScope?.selectedServices || []).includes('website_audit') && (
                        <div className="grid grid-cols-12 gap-2 py-3 px-4 items-center">
                          <div className="col-span-6">
                            <span className="font-bold text-xs text-slate-800 block">Website Audit & Technical Review</span>
                            <span className="text-[11px] text-slate-500">Technical health, SEO, security vulnerabilities & UX/UI report</span>
                          </div>
                          <div className="col-span-2 text-center text-xs font-semibold text-slate-600">
                            {proposal.servicesScope?.websiteAudit?.quantity || 1} Audit
                          </div>
                          <div className="col-span-4 flex justify-end">
                            <input
                              type="number"
                              value={proposal.servicesScope?.websiteAudit?.cost || 0}
                              onChange={(e) => updateServiceDetail('websiteAudit', 'cost', Number(e.target.value))}
                              className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                            />
                          </div>
                        </div>
                      )}

                      {(proposal.servicesScope?.selectedServices || []).includes('hosting_domain') && (
                        <div className="grid grid-cols-12 gap-2 py-3 px-4 items-center">
                          <div className="col-span-6">
                            <span className="font-bold text-xs text-slate-800 block">Hosting & Domain Renewal</span>
                            <span className="text-[11px] text-slate-500">
                              Cloud server ({proposal.servicesScope?.hostingDomain?.hostingRenewalYears || 1} Yr) & Managed domains ({proposal.servicesScope?.hostingDomain?.domains?.length || proposal.servicesScope?.hostingDomain?.domainQty || 1} Domains)
                            </span>
                          </div>
                          <div className="col-span-2 text-center text-xs font-semibold text-slate-600">
                            {(proposal.servicesScope?.hostingDomain?.domains?.length || proposal.servicesScope?.hostingDomain?.domainQty || 1)} Items
                          </div>
                          <div className="col-span-4 flex justify-end">
                            <input
                              type="number"
                              value={proposal.servicesScope?.hostingDomain?.cost || 0}
                              onChange={(e) => updateServiceDetail('hostingDomain', 'cost', Number(e.target.value))}
                              className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                            />
                          </div>
                        </div>
                      )}

                      {(proposal.servicesScope?.selectedServices || []).includes('ssl_renewal') && (
                        <div className="grid grid-cols-12 gap-2 py-3 px-4 items-center">
                          <div className="col-span-6">
                            <span className="font-bold text-xs text-slate-800 block">SSL Certificate & Installation</span>
                            <span className="text-[11px] text-slate-500">2048-bit RSA Encryption SSL certificate ({proposal.servicesScope?.sslRenewal?.sslYears || 1} Yr)</span>
                          </div>
                          <div className="col-span-2 text-center text-xs font-semibold text-slate-600">
                            {proposal.servicesScope?.sslRenewal?.quantity || proposal.servicesScope?.sslRenewal?.sslYears || 1} Cert
                          </div>
                          <div className="col-span-4 flex justify-end">
                            <input
                              type="number"
                              value={proposal.servicesScope?.sslRenewal?.cost || 0}
                              onChange={(e) => updateServiceDetail('sslRenewal', 'cost', Number(e.target.value))}
                              className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                            />
                          </div>
                        </div>
                      )}

                      {(proposal.servicesScope?.selectedServices || []).includes('amc') && (
                        <div className="grid grid-cols-12 gap-2 py-3 px-4 items-center">
                          <div className="col-span-6">
                            <span className="font-bold text-xs text-slate-800 block">Annual Maintenance Contract (AMC)</span>
                            <span className="text-[11px] text-slate-500">CMS/plugin updates, monitoring, security & priority support SLA</span>
                          </div>
                          <div className="col-span-2 text-center text-xs font-semibold text-slate-600">
                            {proposal.servicesScope?.amc?.quantity || 1} Contract
                          </div>
                          <div className="col-span-4 flex justify-end">
                            <input
                              type="number"
                              value={proposal.servicesScope?.amc?.cost || 0}
                              onChange={(e) => updateServiceDetail('amc', 'cost', Number(e.target.value))}
                              className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                            />
                          </div>
                        </div>
                      )}

                      {(proposal.servicesScope?.selectedServices || []).includes('custom_service') && (
                        <div className="grid grid-cols-12 gap-2 py-3 px-4 items-center">
                          <div className="col-span-6">
                            <span className="font-bold text-xs text-slate-800 block">{proposal.servicesScope?.customService?.title || 'Custom Tailored Service'}</span>
                            <span className="text-[11px] text-slate-500">{proposal.servicesScope?.customService?.deliverables || 'Custom deliverables and scope of work'}</span>
                          </div>
                          <div className="col-span-2 text-center text-xs font-semibold text-slate-600">
                            {proposal.servicesScope?.customService?.quantity || 1} Unit
                          </div>
                          <div className="col-span-4 flex justify-end">
                            <input
                              type="number"
                              value={proposal.servicesScope?.customService?.cost || 0}
                              onChange={(e) => updateServiceDetail('customService', 'cost', Number(e.target.value))}
                              className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Itemized Deliverables Live Preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Itemized Financial Deliverables Preview:
                    </h4>
                    <div className="space-y-2">
                      {getModularDeliverableLineItems(proposal.servicesScope).map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">{item.deliverableName}</span>
                            <span className="text-[11px] text-slate-500">{item.scopeDescription}</span>
                          </div>
                          <div className="text-right whitespace-nowrap pl-3">
                            <span className="text-slate-500 text-[11px] block">{item.quantity} {item.unitLabel} × {formatQAR(item.unitPrice)}</span>
                            <strong className="text-slate-900 font-bold">{formatQAR(item.totalCost)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : isBranding ? (
                /* Branding Resource Billing */
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-sans font-bold text-slate-700">Project Staffing Estimates</label>
                    <span className="text-xs text-blue-600 font-bold font-sans">
                      Resource Sum: {proposal.resourceCosts.length} Specialist(s)
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white divide-y divide-slate-150">
                    <div className="grid grid-cols-12 bg-slate-100 py-2.5 px-4 text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider text-center">
                      <span className="col-span-5 text-left">Role Class / Title</span>
                      <span className="col-span-2">Hours</span>
                      <span className="col-span-2">Rate QAR</span>
                      <span className="col-span-2 text-right">Row Sum</span>
                      <span className="col-span-1"></span>
                    </div>

                    {/* Role Class / Title cost line loops */}
                    {(proposal.resourceCosts || []).map((rc) => (
                      <div key={rc.id} className="grid grid-cols-12 gap-2 py-2 px-4 items-center text-center">
                        <input
                          type="text"
                          value={rc.role}
                          onChange={(e) => updateResourceCost(rc.id, 'role', e.target.value)}
                          className="col-span-5 text-left border border-slate-200 rounded-md px-2 py-1 text-xs font-medium"
                        />
                        <input
                          type="number"
                          value={rc.hours}
                          onChange={(e) => updateResourceCost(rc.id, 'hours', Number(e.target.value))}
                          className="col-span-2 border border-slate-200 rounded-md py-1 text-xs text-center font-mono"
                        />
                        <input
                          type="number"
                          value={rc.rate}
                          onChange={(e) => updateResourceCost(rc.id, 'rate', Number(e.target.value))}
                          className="col-span-2 border border-slate-200 rounded-md py-1 text-xs text-center font-mono"
                        />
                        <span className="col-span-2 text-right text-xs font-bold text-slate-800 font-mono">
                          {formatQAR(rc.hours * rc.rate)}
                        </span>
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => deleteResourceCost(rc.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 animate-none" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addResourceCost}
                    className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs text-slate-655 hover:text-blue-700 transition-all font-semibold font-sans cursor-pointer bg-slate-50/50"
                  >
                    <Plus className="h-4 w-4" />
                    Assign Dynamic Role
                  </button>
                </div>
              ) : (
                /* Website Simple Costs Form */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-sans font-semibold text-slate-700">Development Cost (QAR)</label>
                    <input
                      type="number"
                      value={proposal.developmentCost}
                      onChange={(e) => updateField('developmentCost', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-sans font-semibold text-slate-700">Plugin Licences Cost (QAR)</label>
                    <input
                      type="number"
                      value={proposal.pluginCost}
                      onChange={(e) => updateField('pluginCost', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-sans font-semibold text-slate-700">Support Maintenance Cost (QAR)</label>
                    <input
                      type="number"
                      value={proposal.maintenanceCost}
                      onChange={(e) => updateField('maintenanceCost', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-sans font-semibold text-slate-700">Additional Features Cost (QAR)</label>
                    <input
                      type="number"
                      value={proposal.additionalCost}
                      onChange={(e) => updateField('additionalCost', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Supplier Linked items list inside Proposal */}
              <div className="border border-slate-200 mt-6 p-4 rounded-xl bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Third-Party Sourcing Margin Planner</h4>
                    <p className="text-[10px] text-slate-400">Map auxiliary items (e.g. hardware, readers, special servers) sourced from external partners.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const list = proposal.supplierItems || [];
                      const defaultSup = suppliersList[0];
                      const newItem = {
                        id: 'item_' + Math.random().toString(36).substring(2, 9),
                        description: '',
                        supplierId: defaultSup?.id || 'default_sup',
                        supplierName: defaultSup?.name || 'Partner Supplier',
                        purchaseCost: 0,
                        unitPrice: 0,
                        qty: 1
                      };
                      updateField('supplierItems', [...list, newItem]);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[10.5px] border border-slate-200 font-bold text-slate-705 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Sourced Item
                  </button>
                </div>

                {(!proposal.supplierItems || proposal.supplierItems.length === 0) ? (
                  <p className="text-[10.5px] text-slate-400 italic text-center py-2">No third-party sourced hardware or software items mapped yet.</p>
                ) : (
                  <div className="space-y-3">
                    {proposal.supplierItems.map((item, index) => (
                      <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            const next = (proposal.supplierItems || []).filter(x => x.id !== item.id);
                            updateField('supplierItems', next);
                          }}
                          className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          ✕
                        </button>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">SI #{index + 1} Description</label>
                          <input 
                            type="text"
                            value={item.description}
                            placeholder="e.g. MICR Scanner System"
                            onChange={(e) => {
                              const next = (proposal.supplierItems || []).map(x => x.id === item.id ? { ...x, description: e.target.value } : x);
                              updateField('supplierItems', next);
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                          <div className="space-y-0.5">
                            <label className="text-[9.5px] font-bold text-slate-500">Supplier Sourced</label>
                            <select
                              value={item.supplierId}
                              onChange={(e) => {
                                const val = e.target.value;
                                const match = suppliersList.find(s => s.id === val);
                                const next = (proposal.supplierItems || []).map(x => x.id === item.id ? { 
                                  ...x, 
                                  supplierId: val,
                                  supplierName: match?.name || 'Partner Supplier' 
                                } : x);
                                updateField('supplierItems', next);
                              }}
                              className="w-full p-1 border border-slate-300 rounded bg-white text-[11px]"
                            >
                              {suppliersList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                              {suppliersList.length === 0 && (
                                <option value="default_sup">Doha Sourcing Co</option>
                              )}
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9.5px] font-bold text-slate-500">Qty</label>
                            <input 
                              type="number"
                              value={item.qty}
                              min="1"
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                const next = (proposal.supplierItems || []).map(x => x.id === item.id ? { ...x, qty: val } : x);
                                updateField('supplierItems', next);
                              }}
                              className="w-full p-1 border border-slate-300 rounded text-[11px] font-mono"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9.5px] font-bold text-slate-500">Buying Price (QAR)</label>
                            <input 
                              type="number"
                              value={item.purchaseCost}
                              min="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const next = (proposal.supplierItems || []).map(x => x.id === item.id ? { ...x, purchaseCost: val } : x);
                                updateField('supplierItems', next);
                              }}
                              className="w-full p-1 border border-slate-300 rounded text-[11px] font-mono"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9.5px] font-bold text-slate-500">Selling Price (QAR)</label>
                            <input 
                              type="number"
                              value={item.unitPrice}
                              min="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const next = (proposal.supplierItems || []).map(x => x.id === item.id ? { ...x, unitPrice: val } : x);
                                updateField('supplierItems', next);
                              }}
                              className="w-full p-1 border border-slate-300 rounded text-[11px] font-mono"
                            />
                          </div>
                        </div>

                        {/* Internal Margin Analysis */}
                        <div className="bg-slate-50 p-1.5 px-2.5 rounded border border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Purchase Cost: { (item.purchaseCost * item.qty).toLocaleString() } QAR</span>
                          <span>Selling Cost: { (item.unitPrice * item.qty).toLocaleString() } QAR</span>
                          <span className="font-bold text-emerald-600">
                            Profit: +{ ((item.unitPrice * item.qty) - (item.purchaseCost * item.qty)).toLocaleString() } QAR
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shared payment details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-semibold text-slate-700">Detailed Payment Terms Text</label>
                  <textarea
                    rows={4}
                    value={proposal.paymentTerms}
                    onChange={(e) => updateField('paymentTerms', e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs leading-relaxed font-sans focus:outline-hidden"
                  />
                </div>

                {/* Calculation view card */}
                <div className="bg-blue-50/55 border border-blue-150 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-sans font-bold text-blue-800 tracking-widest uppercase">Estimates Ledger</span>
                    <h5 className="font-serif font-bold text-slate-900 text-sm mt-1">Summary Sum</h5>
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5 leading-relaxed">
                      All calculations are structured in real-time adhering strictly to target delivery blocks.
                    </p>
                  </div>
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-blue-105 border-blue-100">
                    <span className="text-xs font-sans font-bold text-slate-700">TOTAL COST:</span>
                    <strong className="font-serif text-3xl font-bold text-blue-750 text-blue-700 tracking-tight">
                      {formatQAR(proposal.totalCost)} QAR
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Preview PDF */}
          {step === 6 && (
            <div id="step-6-form" className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-center">
                <p className="text-xs text-emerald-800 font-medium">
                  🎉 **Document Draft Complete!** Below is a real-time responsive representation of your multi-paged strategic proposal. Select any section to review page layout structures before finalization!
                </p>
              </div>
              <div className="border border-slate-300 rounded-2xl bg-slate-100 p-2 md:p-6 overflow-x-auto select-none max-h-[500px]">
                {/* Scale layout to fit in view perfectly */}
                <div className="scale-75 sm:scale-90 origin-top">
                  <ProposalDocumentView proposal={proposal} showBackBtn={false} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Save & Seal */}
          {step === 7 && (
            <div id="step-7-form" className="text-center space-y-6 py-8 px-4">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="h-8 w-8" />
              </div>
              
              <div className="max-w-md mx-auto">
                <h3 className="font-sans font-bold text-slate-900 text-xl tracking-tight">
                  Proposal Configuration Approved!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-2 font-sans">
                  The system is ready to save this proposal configuration directly to its persistent memory indexing engine, mapping client details, scopes, timeline, sitemaps, and costs for instantaneous search.
                </p>
              </div>

              {/* Recapitulation cards */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl max-w-sm mx-auto text-left space-y-3 font-sans">
                <div className="flex justify-between border-b border-slate-150 pb-2 text-xs">
                  <span className="text-slate-400">Client Profile:</span>
                  <strong className="text-slate-800 font-bold">{proposal.clientName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-2 text-xs">
                  <span className="text-slate-400">Proposal Type:</span>
                  <strong className="text-slate-800 font-bold uppercase">{proposal.type}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-2 text-xs">
                  <span className="text-slate-400">Total Value:</span>
                  <strong className="text-blue-600 font-semibold">{formatQAR(proposal.totalCost)} QAR</strong>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-2 text-xs">
                  <span className="text-slate-400">Timeline Length:</span>
                  <strong className="text-slate-800 font-bold">{proposal.weeks} Weeks</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Current Status:</span>
                  <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                    proposal.status === ProposalStatus.WON
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : proposal.status === ProposalStatus.LOST
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {proposal.status || ProposalStatus.DRAFT}
                  </span>
                </div>
              </div>

              {/* Status Update Interactive Controls */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl max-w-sm mx-auto text-left space-y-3 font-sans">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-500 animate-spin-slow" />
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Opportunity Status
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Toggle this commercial interest pipeline state to either active or won/lost. The system refreshes timestamps and stops email alerts immediately if won or lost.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProposal(prev => ({
                        ...prev,
                        status: ProposalStatus.WON,
                        updatedAt: new Date().toISOString()
                      }));
                    }}
                    className={`flex-1 py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                      proposal.status === ProposalStatus.WON
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    🏆 Mark as Won
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProposal(prev => ({
                        ...prev,
                        status: ProposalStatus.LOST,
                        updatedAt: new Date().toISOString()
                      }));
                    }}
                    className={`flex-1 py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                      proposal.status === ProposalStatus.LOST
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/40 text-slate-600 hover:text-rose-700'
                    }`}
                  >
                    ❌ Mark as Lost
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleFinalSave}
                  id="finalize-and-archive-btn"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl font-bold font-sans tracking-wide text-xs transition-all w-full max-w-xs cursor-pointer"
                >
                  Save Configuration & Add to Memory
                </button>
              </div>
            </div>
          )}

        </div>

        {/* --- STEPPERS CONTROLLER PANEL --- */}
        <div id="steppers-panel" className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={step === 1}
            id="wizard-step-back-btn"
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1 border transition-colors cursor-pointer ${
              step === 1
                ? 'opacity-40 bg-slate-100 border-slate-150 text-slate-400 cursor-not-allowed'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
            Step {step} of 7
          </span>

          {step < 7 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !proposal.clientName}
              id="wizard-step-next-btn"
              className={`px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1 text-white shadow-sm transition-colors cursor-pointer ${
                step === 1 && !proposal.clientName
                  ? 'bg-blue-400 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Next Step
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalSave}
              id="wizard-step-finish-btn"
              className="px-5 py-2 text-xs font-bold rounded-lg flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              Add to Memory
              <Sparkles className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>

      {/* RIGHT WORKSPACE CONSOLE / SIDEBAR SUMMARY (Only visible from step 1 to 5) */}
      {step <= 5 && (
        <div id="side-preview-container" className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white h-fit shadow-xl space-y-6">
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-blue-400 block uppercase">Real-Time Canvas</span>
            <h3 className="font-sans font-bold text-sm tracking-tight mt-1">Live Deck Draft</h3>
            <p className="text-[11px] text-slate-400 leading-normal font-sans mt-0.5">
              Draft layout compiles in real-time as choices are updated.
            </p>
          </div>

          {/* Simulated mini cover card */}
          <div className="border border-slate-800 bg-slate-950/50 p-5 rounded-xl space-y-4 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            
            <div className="flex justify-between items-center text-[8px] tracking-widest font-mono text-slate-500">
              <span>AGENCY DECK</span>
              <span>EST. {proposal.weeks} WEEKS</span>
            </div>

            <div className="pt-2">
              <h4 className="font-serif text-lg font-bold text-slate-100 leading-tight">
                {isBranding ? "Visual Branding Identity" : "Custom Web Dev Architecture"}
              </h4>
              <p className="font-serif italic text-xs text-blue-400 mt-1 leading-normal pl-0.5">
                Prepared for {proposal.clientName || "[Client Name]"}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900/40 grid grid-cols-2 text-[9px] text-slate-400 leading-snug">
              <div>
                <span className="text-[7px] text-slate-600 uppercase block leading-none font-mono mb-1">Prepared By:</span>
                <span className="font-semibold text-slate-300">{proposal.preparedByCompany || "Astra Technologies"}</span>
              </div>
              <div className="text-right">
                <span className="text-[7px] text-slate-600 uppercase block leading-none font-mono mb-1">Doc Date:</span>
                <span className="font-semibold text-slate-300">{proposal.proposalDate || "Today"}</span>
              </div>
            </div>
          </div>

          {/* Quick specs lists */}
          <div className="space-y-3 font-sans text-xs border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Project Type:</span>
              <strong className="text-slate-100 uppercase font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded-sm">
                {proposal.type}
              </strong>
            </div>

            {isBranding ? (
              <div className="space-y-2">
                <span className="text-slate-400 block text-[11px] tracking-wide uppercase mb-1">Primary Deliverables:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] pl-1">
                  {Object.entries(proposal.brandingScope)
                    .filter(([key, val]) => key !== 'additionalDeliverables' && val)
                    .map(([key]) => {
                      const wordFormatted = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <div key={key} className="flex items-center gap-1 text-slate-300">
                          <Check className="h-3 w-3 text-emerald-500 shrinks-0" />
                          <span className="truncate">{wordFormatted}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-[10px] text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div className="flex justify-between">
                  <span>Target Sitemaps:</span>
                  <span className="font-bold text-blue-400">{proposal.websiteScope.totalPages} templates</span>
                </div>
                <div className="flex justify-between">
                  <span>Language Profile:</span>
                  <span className="font-mono text-[9px] font-semibold text-slate-300">{proposal.websiteScope.languages}</span>
                </div>
                <div className="flex justify-between">
                  <span>CMS Base:</span>
                  <span className="font-mono text-[9px] tracking-wide text-slate-300 uppercase">{proposal.websiteScope.cmsType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact Inbound:</span>
                  <span>{proposal.websiteScope.contactForms ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blog Module:</span>
                  <span>{proposal.websiteScope.blogModule ? "Yes" : "No"}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
              <span className="text-slate-400">Total Project Value:</span>
              <strong className="text-lg font-serif text-blue-400 font-bold">
                {formatQAR(proposal.totalCost)} QAR
              </strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
