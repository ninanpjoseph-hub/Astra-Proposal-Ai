/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Proposal, ProposalType, Milestone, ResourceCost } from '../types';
import { createDefaultProposal, generateId, formatQAR } from '../proposalUtils';
import SitemapGenerator from './SitemapGenerator';
import ProposalDocumentView from './ProposalDocumentView';
import { 
  Building2, User, Calendar, FileText, CheckSquare, Clock, Landmark, Settings, 
  Trash2, Plus, ArrowLeft, ArrowRight, Eye, Sparkles, Check, HelpCircle 
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
    if (initialProposal) {
      return JSON.parse(JSON.stringify(initialProposal));
    }
    return createDefaultProposal('branding'); // Default to branding first
  });

  // Keep type local variable
  const [proposalType, setProposalType] = useState<ProposalType>(() => {
    return initialProposal ? initialProposal.type : 'branding';
  });

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
    setProposal(newDefault);
  };

  const isBranding = proposal.type === 'branding';

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
      
      // Auto estimate total pages if elements were added/removed
      let computedPages = prev.websiteScope.totalPages;
      if (key !== 'totalPages') {
        let basePages = 2; // Home + About/Services
        if (updatedScope.contactForms) basePages += 1;
        if (updatedScope.blogModule) basePages += 2; // Index + Single
        if (updatedScope.gallery) basePages += 1;
        if (updatedScope.careersSection) basePages += 2; // Board + Apply Form
        if (updatedScope.downloadsSection) basePages += 1;
        
        // Ensure total pages is at least the logical checked base pages
        if (computedPages < basePages) {
          computedPages = basePages;
        }
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
      milestones: prev.milestones.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const deleteMilestone = (id: string) => {
    setProposal(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
    }));
  };

  const addMilestone = () => {
    const id = `m_custom_${generateId()}`;
    const newM: Milestone = {
      id,
      week: `Week ${proposal.milestones.length + 1}`,
      title: "New Deliverable Module",
      description: "Provide a descriptive account of what will be validated."
    };
    setProposal(prev => ({
      ...prev,
      milestones: [...prev.milestones, newM]
    }));
  };

  // Branding resource cost operations
  const updateResourceCost = (id: string, field: keyof ResourceCost, value: any) => {
    setProposal(prev => {
      const updatedCosts = prev.resourceCosts.map(rc => {
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
      const updatedCosts = prev.resourceCosts.filter(rc => rc.id !== id);
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
      const updatedCosts = [...prev.resourceCosts, newRC];
      const newTotal = updatedCosts.reduce((sum, item) => sum + (item.hours * item.rate), 0);
      return {
        ...prev,
        resourceCosts: updatedCosts,
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
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleTypeSelect('branding')}
                    className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between h-[120px] shadow-sm cursor-pointer ${
                      isBranding 
                        ? 'bg-white border-blue-500 ring-2 ring-blue-50 text-slate-800' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase leading-none font-mono ${
                      isBranding ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Brand Identity
                    </span>
                    <div>
                      <h4 className="font-sans font-bold text-sm tracking-tight">Branding Proposal</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Focuses on Logos, Brand Guidelines, stationery sets, and identity assets.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTypeSelect('website')}
                    className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between h-[120px] shadow-sm cursor-pointer ${
                      !isBranding 
                        ? 'bg-white border-blue-500 ring-2 ring-blue-50 text-slate-800' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650'
                    }`}
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase leading-none font-mono ${
                      !isBranding ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Full Web Platform
                    </span>
                    <div>
                      <h4 className="font-sans font-bold text-sm tracking-tight">Website Proposal</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Focuses on custom pages, languages, CMS engines, plugins, and caching setups.
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
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Scope Selection */}
          {step === 3 && (
            <div id="step-3-form" className="space-y-6">
              
              {isBranding ? (
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
                /* WEBSITE SCOPE FORM */
                <div className="space-y-6">
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-sm tracking-tight mb-1">
                      Web System Parameters
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal mb-4 font-sans">
                      Select target page counts, languages, CMS mechanisms, functional plugins, and active service periods.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pages total */}
                    <div className="flex flex-col gap-1.5 p-4 border border-slate-100 bg-slate-50/40 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-sans font-bold text-slate-700">Total Page Templates</label>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-sans font-bold">
                          {proposal.websiteScope.totalPages} Pages
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="50"
                        value={proposal.websiteScope.totalPages}
                        onChange={(e) => updateWebsiteScope('totalPages', Number(e.target.value))}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-400">Sliders adjusts vertical sitemap elements automatically.</span>
                    </div>

                    {/* Language and CMS */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-sans font-semibold text-slate-700">Target Languages</label>
                        <input
                          type="text"
                          placeholder="e.g. English & Arabic (Dual-Language)"
                          value={proposal.websiteScope.languages}
                          onChange={(e) => updateWebsiteScope('languages', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans focus:outline-hidden"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-sans font-semibold text-slate-700">CMS Framework Type</label>
                        <select
                          value={proposal.websiteScope.cmsType}
                          onChange={(e) => updateWebsiteScope('cmsType', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans focus:outline-hidden bg-white"
                        >
                          <option value="WordPress">WordPress Core (Yoast Setup)</option>
                          <option value="headless-strapi">Headless CMS (Strapi + Next.js)</option>
                          <option value="Shopify Engine">Shopify eCommerce Framework</option>
                          <option value="Custom API Hub">Custom Node/Express Engine</option>
                          <option value="Static HTML5/SPA">Pure Static HTML5 / React SPA</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Modules grid */}
                  <div className="space-y-3">
                    <label className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wide">Integrated Feature Modules</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {/* Form inputs mapping */}
                      {[
                        { title: "Contact Forms", key: "contactForms" },
                        { title: "Blog Article Module", key: "blogModule" },
                        { title: "Photo Gallery", key: "gallery" },
                        { title: "Careers Board", key: "careersSection" },
                        { title: "Download Sheet Section", key: "downloadsSection" },
                        { title: "SEO optimization", key: "seoPlugin" },
                        { title: "Anti-hack Shield", key: "securityPlugin" },
                        { title: "Speed cache profile", key: "cachePlugin" }
                      ].map((item) => (
                        <label 
                          key={item.key} 
                          className={`p-2.5 border rounded-lg flex items-center gap-2 cursor-pointer select-none text-[11px] font-sans hover:bg-slate-50 transition-colors ${
                            proposal.websiteScope[item.key as keyof Proposal['websiteScope']] 
                              ? 'bg-blue-50/50 border-blue-200 font-semibold text-slate-800' 
                              : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={proposal.websiteScope[item.key as keyof Proposal['websiteScope']] as boolean}
                            onChange={(e) => updateWebsiteScope(item.key as keyof Proposal['websiteScope'], e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded-sm focus:ring-none focus:outline-hidden"
                          />
                          <span>{item.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Maintenance block */}
                  <div className="flex flex-col gap-1 bg-slate-50/50 p-4 border border-slate-200 rounded-xl max-w-[280px]">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-sans font-bold text-slate-700">Launch Maintenance Support</label>
                      <strong className="text-xs text-blue-700">{proposal.websiteScope.maintenancePeriod} Months</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={proposal.websiteScope.maintenancePeriod}
                      onChange={(e) => updateWebsiteScope('maintenancePeriod', Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  {/* Live Sitemap view */}
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 mt-4">
                    <SitemapGenerator scope={proposal.websiteScope} projectName={proposal.clientName} />
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
                {proposal.milestones.map((m, index) => (
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

              {isBranding ? (
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

                    {proposal.resourceCosts.map((rc) => (
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
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Timeline Length:</span>
                  <strong className="text-slate-800 font-bold">{proposal.weeks} Weeks</strong>
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
