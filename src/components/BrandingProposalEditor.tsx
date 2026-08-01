/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Proposal, BrandingScope, BrandingDeliverableItem, BrandingProcessStage, BrandingExecutionPhase, BrandingFinancialItem } from '../types';
import { createDefaultBrandingDeliverables, createDefaultBrandingScope, formatQAR } from '../proposalUtils';
import { 
  Check, Plus, Trash2, Edit3, Layers, Settings, FileText, Target, Compass, 
  Rocket, Calendar, DollarSign, ShieldAlert, FileCheck, Sparkles, MoveUp, MoveDown, Eye, RefreshCw
} from 'lucide-react';

interface BrandingProposalEditorProps {
  proposal: Proposal;
  onChange: (updatedProposal: Proposal) => void;
}

const CATEGORIES: BrandingDeliverableItem['category'][] = [
  'Brand Strategy',
  'Visual Identity',
  'Corporate Stationery',
  'Packaging & Merchandise',
  'Signage & Environmental',
  'Digital & Social Media',
  'Marketing Collateral',
  'Custom'
];

export default function BrandingProposalEditor({ proposal, onChange }: BrandingProposalEditorProps) {
  const [activeTab, setActiveTab] = useState<'preset_toggles' | 'deliverables' | 'process_content' | 'financials' | 'terms'>('preset_toggles');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const branding = proposal.brandingScope || createDefaultBrandingScope(proposal.clientName);

  // Helper to update brandingScope in proposal
  const updateBranding = (updates: Partial<BrandingScope>) => {
    const updatedBranding: BrandingScope = {
      ...branding,
      ...updates
    };

    // If financial items updated, recalculate totalCost
    let newTotal = proposal.totalCost;
    if (updates.financialItems) {
      newTotal = updates.financialItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }

    onChange({
      ...proposal,
      totalCost: newTotal,
      brandingScope: updatedBranding
    });
  };

  // Quick Presets
  const applyPreset = (presetType: 'full' | 'core' | 'strategy' | 'packaging') => {
    const defaultScope = createDefaultBrandingScope(proposal.clientName);
    let items = createDefaultBrandingDeliverables();

    if (presetType === 'core') {
      items = items.map(item => ({
        ...item,
        isSelected: item.category === 'Visual Identity' || item.category === 'Corporate Stationery'
      }));
    } else if (presetType === 'strategy') {
      items = items.map(item => ({
        ...item,
        isSelected: item.category === 'Brand Strategy' || item.category === 'Visual Identity'
      }));
    } else if (presetType === 'packaging') {
      items = items.map(item => ({
        ...item,
        isSelected: item.category === 'Packaging & Merchandise' || item.category === 'Visual Identity' || item.category === 'Signage & Environmental'
      }));
    }

    updateBranding({
      ...defaultScope,
      deliverableItems: items
    });
  };

  // Deliverables handlers
  const toggleDeliverable = (id: string) => {
    const items = (branding.deliverableItems || createDefaultBrandingDeliverables()).map(item => {
      if (item.id === id) {
        return { ...item, isSelected: !item.isSelected };
      }
      return item;
    });
    updateBranding({ deliverableItems: items });
  };

  const updateDeliverableItem = (id: string, field: keyof BrandingDeliverableItem, value: any) => {
    const items = (branding.deliverableItems || []).map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateBranding({ deliverableItems: items });
  };

  const addCustomDeliverable = () => {
    const newItem: BrandingDeliverableItem = {
      id: 'custom_del_' + Math.random().toString(36).substring(2, 9),
      category: 'Custom',
      title: 'New Custom Branding Service',
      description: 'Custom service deliverables tailored to client specifications.',
      isSelected: true,
      isCustom: true
    };
    updateBranding({
      deliverableItems: [...(branding.deliverableItems || []), newItem]
    });
  };

  const deleteDeliverable = (id: string) => {
    const items = (branding.deliverableItems || []).filter(item => item.id !== id);
    updateBranding({ deliverableItems: items });
  };

  // Process Stage Handlers
  const addProcessStage = () => {
    const newStage: BrandingProcessStage = {
      id: 'ps_' + Math.random().toString(36).substring(2, 8),
      stageName: 'New Workflow Phase',
      description: 'Stage description and key execution milestones.'
    };
    updateBranding({
      processStages: [...(branding.processStages || []), newStage]
    });
  };

  const updateProcessStage = (id: string, field: keyof BrandingProcessStage, value: string) => {
    const stages = (branding.processStages || []).map(st => st.id === id ? { ...st, [field]: value } : st);
    updateBranding({ processStages: stages });
  };

  const deleteProcessStage = (id: string) => {
    const stages = (branding.processStages || []).filter(st => st.id !== id);
    updateBranding({ processStages: stages });
  };

  // Execution Phase Handlers
  const addExecutionPhase = () => {
    const count = (branding.executionPhases || []).length + 1;
    const newPhase: BrandingExecutionPhase = {
      id: 'ep_' + Math.random().toString(36).substring(2, 8),
      phaseNumber: count,
      phaseTitle: `PHASE ${count}: CUSTOM PHASE`,
      actionPoints: ['Milestone execution point 1', 'Review and feedback']
    };
    updateBranding({
      executionPhases: [...(branding.executionPhases || []), newPhase]
    });
  };

  const updateExecutionPhase = (id: string, title: string, actionPoints: string[]) => {
    const phases = (branding.executionPhases || []).map(p => p.id === id ? { ...p, phaseTitle: title, actionPoints } : p);
    updateBranding({ executionPhases: phases });
  };

  const deleteExecutionPhase = (id: string) => {
    const phases = (branding.executionPhases || []).filter(p => p.id !== id);
    updateBranding({ executionPhases: phases });
  };

  // Financial Item Handlers
  const addFinancialRow = () => {
    const items = branding.financialItems || [];
    const newRow: BrandingFinancialItem = {
      id: 'fin_' + Math.random().toString(36).substring(2, 8),
      sl: items.length + 1,
      resourceRole: 'Additional Creative Service',
      detail: 'Custom design execution & collateral development',
      timeDays: '5 Days',
      amount: 3000
    };
    updateBranding({
      financialItems: [...items, newRow]
    });
  };

  const updateFinancialRow = (id: string, field: keyof BrandingFinancialItem, value: any) => {
    const items = (branding.financialItems || []).map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateBranding({ financialItems: items });
  };

  const deleteFinancialRow = (id: string) => {
    const items = (branding.financialItems || [])
      .filter(item => item.id !== id)
      .map((item, idx) => ({ ...item, sl: idx + 1 }));
    updateBranding({ financialItems: items });
  };

  // Terms & Exclusions Handlers
  const addExclusion = (text: string) => {
    if (!text.trim()) return;
    const list = branding.exclusionsList || [];
    if (!list.includes(text.trim())) {
      updateBranding({ exclusionsList: [...list, text.trim()] });
    }
  };

  const removeExclusion = (index: number) => {
    const list = (branding.exclusionsList || []).filter((_, i) => i !== index);
    updateBranding({ exclusionsList: list });
  };

  const addTerm = (text: string) => {
    if (!text.trim()) return;
    const list = branding.termsList || [];
    updateBranding({ termsList: [...list, text.trim()] });
  };

  const removeTerm = (index: number) => {
    const list = (branding.termsList || []).filter((_, i) => i !== index);
    updateBranding({ termsList: list });
  };

  // Filter deliverable items
  const deliverables = branding.deliverableItems || createDefaultBrandingDeliverables();
  const filteredDeliverables = deliverables.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedCount = deliverables.filter(d => d.isSelected).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Standalone Module
              </span>
              <span className="text-xs text-slate-400 font-medium">PDF Reference Engine</span>
            </div>
            <h2 className="text-lg font-bold font-sans mt-1 text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-400" />
              Branding & Identity Development Generator
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Configure deliverables, workflow stages, commercial fees, terms, and slide inclusions.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
              Selected Services Total
            </span>
            <span className="text-xl font-mono font-extrabold text-amber-400">
              {formatQAR(proposal.totalCost)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
              {selectedCount} of {deliverables.length} Deliverables Active
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('preset_toggles')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'preset_toggles'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            1. Document Layout & Presets
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deliverables')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'deliverables'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            2. Scope & Services ({selectedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('process_content')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'process_content'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            3. Strategy & Process
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'financials'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            4. Commercials & Fees
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            5. Terms & Exclusions
          </button>
        </div>
      </div>

      {/* TAB 1: PRESETS & SECTION TOGGLES */}
      {activeTab === 'preset_toggles' && (
        <div className="space-y-6">
          {/* Presets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Quick Scope Presets
            </h3>
            <p className="text-xs text-slate-500">
              Select a scope template to rapidly load pre-configured branding deliverables and structure.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <button
                type="button"
                onClick={() => applyPreset('full')}
                className="p-3.5 bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] font-bold text-amber-800 uppercase font-mono block">Complete Package</span>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-900">PDF Reference Master</h4>
                <p className="text-[11px] text-slate-600 mt-1">Full Strategy, Visual Identity, Corporate Stationery & Guidelines.</p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('core')}
                className="p-3.5 bg-blue-50/50 hover:bg-blue-100/60 border border-blue-200 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] font-bold text-blue-800 uppercase font-mono block">Essential Package</span>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-900">Logo & Stationery Focus</h4>
                <p className="text-[11px] text-slate-600 mt-1">Logo design, color palette, business cards & stationery essentials.</p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('strategy')}
                className="p-3.5 bg-indigo-50/50 hover:bg-indigo-100/60 border border-indigo-200 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] font-bold text-indigo-800 uppercase font-mono block">Strategic Focus</span>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">Brand Strategy & Identity</h4>
                <p className="text-[11px] text-slate-600 mt-1">Brand positioning, core values, typography & guidelines booklet.</p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('packaging')}
                className="p-3.5 bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-200 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono block">Retail / Products</span>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">Packaging & Signage</h4>
                <p className="text-[11px] text-slate-600 mt-1">Packaging design, signage wayfinding, & environmental graphics.</p>
              </button>
            </div>
          </div>

          {/* Section Toggles */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Configure Major Proposal Sections
            </h3>
            <p className="text-xs text-slate-500">
              Toggle which sections to display in the generated presentation deck or document view.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'includeCoverPage', label: '1. Cover Page', desc: 'Title, client name, confidentiality badge & Astra branding' },
                { key: 'includeTableOfContents', label: '2. Table of Contents', desc: 'Index page with dot leaders and page numbering' },
                { key: 'includeExecutiveSummary', label: '3. Executive Summary', desc: 'Agency introduction letter and project background summary' },
                { key: 'includeObjectives', label: '4. Project Mission & Objectives', desc: 'Strategic goals and brand building focus points' },
                { key: 'includeKickoffApproach', label: '5. Kick-Off & Strategic Approach', desc: 'Kick-off meeting agenda, deliverables & 3-pillar diagram' },
                { key: 'includeProcess', label: '6. Process & Methodology', desc: 'Research, Design, Implementation, & Evaluation stages' },
                { key: 'includeScopeDeliverables', label: '7. Scope of Work / Services', desc: 'Categorized deliverables & active service items list' },
                { key: 'includePhasesOfExecution', label: '8. Execution Phases', desc: 'Design Concept, Development, Collaterals, & Final Artwork' },
                { key: 'includeTimeline', label: '9. Project Timeline', desc: 'Discover, Design, Launch schedule & week durations' },
                { key: 'includeFinancials', label: '10. Commercials / Financials', desc: 'Resource role breakdown table & Grand Total QAR' },
                { key: 'includeTermsExclusions', label: '11. Terms & Exclusions', desc: 'Invoicing terms and detailed non-scope exclusions' },
                { key: 'includeAcceptance', label: '12. Acceptance & Sign-off', desc: 'Signature lines, company stamp box, & contact details' },
              ].map(sec => {
                const isChecked = branding[sec.key as keyof BrandingScope] !== false;
                return (
                  <label
                    key={sec.key}
                    className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all select-none ${
                      isChecked
                        ? 'bg-blue-50/40 border-blue-200 text-slate-900 shadow-2xs font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => updateBranding({ [sec.key]: e.target.checked })}
                      className="mt-0.5 h-4.5 w-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500/50"
                    />
                    <div>
                      <span className="text-xs font-bold block">{sec.label}</span>
                      <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">{sec.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERABLES & SERVICES MANAGEMENT */}
      {activeTab === 'deliverables' && (
        <div className="space-y-5">
          {/* Filter & Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Category:</span>
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories ({deliverables.length})
              </button>
              {CATEGORIES.map(cat => {
                const count = deliverables.filter(d => d.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 w-48 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={addCustomDeliverable}
                className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Custom Deliverable
              </button>
            </div>
          </div>

          {/* Deliverables Grid */}
          <div className="space-y-3">
            {filteredDeliverables.length === 0 ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6">
                <p className="text-xs text-slate-500 font-medium">No branding deliverables found for this filter.</p>
              </div>
            ) : (
              filteredDeliverables.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl p-4 transition-all shadow-2xs relative ${
                    item.isSelected
                      ? 'border-blue-400 ring-1 ring-blue-50/50'
                      : 'border-slate-200 bg-slate-50/50 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={() => toggleDeliverable(item.id)}
                      className="mt-1 h-4.5 w-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500/50 shrink-0 cursor-pointer"
                    />

                    <div className="flex-grow space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-slate-100 text-slate-600 border border-slate-200">
                            {item.category}
                          </span>
                          {item.isCustom && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800">
                              Custom Item
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteDeliverable(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                          title="Delete Item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Service Title</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateDeliverableItem(item.id, 'title', e.target.value)}
                            className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) => updateDeliverableItem(item.id, 'category', e.target.value as any)}
                            className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                          >
                            {CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Deliverable Description</label>
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => updateDeliverableItem(item.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-700 font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STRATEGY, PROCESS & OBJECTIVES */}
      {activeTab === 'process_content' && (
        <div className="space-y-6">
          {/* Executive Summary Overrides */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Executive Summary Texts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Agency Introductory Letter (Slide 3)
                </label>
                <textarea
                  rows={6}
                  value={branding.customExecutiveSummaryLead || ''}
                  onChange={(e) => updateBranding({ customExecutiveSummaryLead: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Project Specific Executive Summary (Slide 4)
                </label>
                <textarea
                  rows={6}
                  value={branding.customExecutiveSummaryProject || ''}
                  onChange={(e) => updateBranding({ customExecutiveSummaryProject: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 font-sans leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Objectives & Values */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              Project Mission & Brand Objectives
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Objectives Core Statement
              </label>
              <input
                type="text"
                value={branding.objectivesOverview || ''}
                onChange={(e) => updateBranding({ objectivesOverview: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Key Objective Points</label>
                <button
                  type="button"
                  onClick={() => updateBranding({ objectivesList: [...(branding.objectivesList || []), 'New strategic objective point'] })}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Point
                </button>
              </div>

              <div className="space-y-2">
                {(branding.objectivesList || []).map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => {
                        const list = [...(branding.objectivesList || [])];
                        list[idx] = e.target.value;
                        updateBranding({ objectivesList: list });
                      }}
                      className="flex-grow px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const list = (branding.objectivesList || []).filter((_, i) => i !== idx);
                        updateBranding({ objectivesList: list });
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strategic Approach 3 Pillars */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-600" />
              Strategic Approach Pillars
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pillar 1: Strategy</label>
                <textarea
                  rows={3}
                  value={branding.approachStrategy || ''}
                  onChange={(e) => updateBranding({ approachStrategy: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pillar 2: Tone & Voice</label>
                <textarea
                  rows={3}
                  value={branding.approachToneVoice || ''}
                  onChange={(e) => updateBranding({ approachToneVoice: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pillar 3: Moodboard</label>
                <textarea
                  rows={3}
                  value={branding.approachMoodboard || ''}
                  onChange={(e) => updateBranding({ approachMoodboard: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Workflow Stages */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Rocket className="h-4 w-4 text-amber-500" />
                Brand Development Workflow Stages
              </h3>
              <button
                type="button"
                onClick={addProcessStage}
                className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Workflow Stage
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(branding.processStages || []).map((stage, idx) => (
                <div key={stage.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Stage {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteProcessStage(stage.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Stage Name</label>
                    <input
                      type="text"
                      value={stage.stageName}
                      onChange={(e) => updateProcessStage(stage.id, 'stageName', e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Description</label>
                    <textarea
                      rows={2}
                      value={stage.description}
                      onChange={(e) => updateProcessStage(stage.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-700 bg-white font-sans"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIALS & COMMERCIALS */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Financial Proposal & Resource Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify resource roles, project tasks, execution days, and fee allocations.
                </p>
              </div>

              <button
                type="button"
                onClick={addFinancialRow}
                className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Resource Line Item
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">SL</th>
                    <th className="p-3 w-44">Resource / Role</th>
                    <th className="p-3">Tasks / Deliverable Detail</th>
                    <th className="p-3 w-28">Time-Days</th>
                    <th className="p-3 w-32 text-right">Amount QAR</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(branding.financialItems || []).map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="p-3 text-center font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.resourceRole}
                          onChange={(e) => updateFinancialRow(row.id, 'resourceRole', e.target.value)}
                          className="w-full px-2.5 py-1 border border-slate-300 rounded font-bold text-slate-900"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.detail}
                          onChange={(e) => updateFinancialRow(row.id, 'detail', e.target.value)}
                          className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-700"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.timeDays}
                          onChange={(e) => updateFinancialRow(row.id, 'timeDays', e.target.value)}
                          className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-800 font-mono text-center"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(e) => updateFinancialRow(row.id, 'amount', Number(e.target.value))}
                          className="w-full px-2.5 py-1 border border-slate-300 rounded font-bold font-mono text-right text-emerald-800"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => deleteFinancialRow(row.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold">
                  <tr>
                    <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-wider text-slate-300">
                      Grand Total Commercial Investment:
                    </td>
                    <td className="p-3 text-right font-mono text-amber-400 text-sm font-extrabold">
                      {formatQAR(proposal.totalCost)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment & Invoicing Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Invoicing Schedule</label>
                <input
                  type="text"
                  value={branding.invoicingScheduleText || ''}
                  onChange={(e) => updateBranding({ invoicingScheduleText: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Term Duration</label>
                <input
                  type="text"
                  value={branding.paymentTermsText || ''}
                  onChange={(e) => updateBranding({ paymentTermsText: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TERMS & EXCLUSIONS */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Scope Exclusions List
            </h3>
            <p className="text-xs text-slate-500">
              Clearly define out-of-scope services to prevent scope creep during artwork execution.
            </p>

            {/* Quick Add Common Exclusions */}
            <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600 mr-2">Quick Add:</span>
              {[
                'Printing of physical collateral',
                'Production & Manufacturing',
                'Naming registration & legal trademarking',
                'HTML / Web development',
                'Domain & Server Hosting',
                'Copywriting & Translation',
                'Stock photo licensing fees',
                'Photoshoot & video models',
                'Physical Signage fabrication',
                'Ad spend & media buying'
              ].map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => addExclusion(item)}
                  className="px-2 py-0.5 bg-white border border-slate-300 hover:border-blue-400 text-[11px] text-slate-700 rounded font-medium hover:text-blue-700 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-blue-600" />
                  {item}
                </button>
              ))}
            </div>

            {/* Exclusions List */}
            <div className="space-y-2">
              {(branding.exclusionsList || []).map((exc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={exc}
                    onChange={(e) => {
                      const list = [...(branding.exclusionsList || [])];
                      list[idx] = e.target.value;
                      updateBranding({ exclusionsList: list });
                    }}
                    className="flex-grow px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeExclusion(idx)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
