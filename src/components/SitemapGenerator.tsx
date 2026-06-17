/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WebsiteScope, CustomSitemapNode } from '../types';
import { 
  Network, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Columns, 
  AlignJustify,
  CornerDownRight,
  HelpCircle,
  FolderPlus,
  Compass
} from 'lucide-react';

interface SitemapGeneratorProps {
  scope: WebsiteScope;
  projectName: string;
  onUpdateScope?: (scope: WebsiteScope) => void;
}

export const getDefaultNodes = (scope: WebsiteScope): CustomSitemapNode[] => {
  const nodes: CustomSitemapNode[] = [
    {
      id: "home",
      title: "Home Page",
      description: "Main landing experience, hero section, corporate summary, and core pillars.",
      children: []
    },
    {
      id: "about",
      title: "About Us & Services",
      description: "Company journey, executive bios, and specialized business offerings page.",
      children: []
    }
  ];

  if (scope.contactForms) {
    nodes.push({
      id: "contact",
      title: "Contact Us",
      description: "Direct localization map, office address coordinates, and active inquiry dispatch form.",
      children: []
    });
  }

  if (scope.blogModule) {
    nodes.push({
      id: "blog",
      title: "Insights & Blog Index",
      description: "Editorial board grid with categorization filters and search capability.",
      children: ["Individual Article Layout", "Author Bio Sheet"]
    });
  }

  if (scope.gallery) {
    nodes.push({
      id: "gallery",
      title: "Media Portfolio / Gallery",
      description: "Visual grid with filter categories and touch-responsive lightbox galleries.",
      children: []
    });
  }

  if (scope.careersSection) {
    nodes.push({
      id: "careers",
      title: "Careers Board",
      description: "Listing of open operations roles with real-time CV submission workflows.",
      children: ["Online Job Application Form"]
    });
  }

  if (scope.downloadsSection) {
    nodes.push({
      id: "downloads",
      title: "Resources & Download Center",
      description: "Whitepapers, catalog brochures, and secure digital file access points.",
      children: []
    });
  }

  // Adding specific e-commerce architecture if website type is e-commerce
  if (scope.websiteType === 'ecommerce') {
    nodes.push({
      id: "eco_catalog",
      title: "E-Commerce Product Catalog",
      description: "Responsive catalog supporting categories, subcategories, custom attributes, filters, search, and sorting.",
      children: ["Category Filtering Layout", "Advanced Smart Search"]
    });
    nodes.push({
      id: "eco_product",
      title: "Product Details & Reviews",
      description: "Page showcasing variants, multi-image gallery zoom, customer video support, reviews, and question forums.",
      children: ["Variant Selector Module", "Interactive Visual Gallery Slider"]
    });
    nodes.push({
      id: "eco_checkout",
      title: "Shopping Cart & Checkout Hub",
      description: "Optimized omnichannel checkout funnel including coupons, shipping rate calculators, and secure gateways.",
      children: ["Coupon Validation Portal", "Integrated Gateway Handler"]
    });
    nodes.push({
      id: "eco_orders",
      title: "Real-Time Tracking & Accounts",
      description: "Customer accounts listing purchase histories, interactive delivery routes, return requests, and pdf invoices.",
      children: ["Order Status Dispatcher", "Automated PDF Invoice Printer"]
    });
    nodes.push({
      id: "eco_admin",
      title: "Admin & Branch Dashboard",
      description: "Centralized command portal monitoring sales metrics, branch inventory pools, driver assignments, and refunds.",
      children: ["Dynamic Multi-Branch Routing", "Sales Summary Dashboard"]
    });
  }

  const baseCount = nodes.reduce((acc, curr) => acc + 1 + (curr.children?.length || 0), 0);
  const diff = scope.totalPages - baseCount;

  if (diff > 0) {
    nodes.push({
      id: "extra_pages",
      title: `${diff} Additional Sub-page${diff > 1 ? 's' : ''}`,
      description: "Supplementary dynamic content pages, utility, privacy policies, or landing grids as identified in sprint logs.",
      children: []
    });
  }

  return nodes;
};

export default function SitemapGenerator({ scope, projectName, onUpdateScope }: SitemapGeneratorProps) {
  // Determine nodes (load from state if customized, or compute default)
  const [activeNodes, setActiveNodes] = useState<CustomSitemapNode[]>([]);
  const isInteractive = typeof onUpdateScope === 'function';

  // Initialize nodes based on scope custom nodes
  useEffect(() => {
    if (scope.customSitemapNodes && scope.customSitemapNodes.length > 0) {
      setActiveNodes(scope.customSitemapNodes);
    } else {
      setActiveNodes(getDefaultNodes(scope));
    }
  }, [
    scope.customSitemapNodes, 
    scope.totalPages, 
    scope.contactForms, 
    scope.blogModule, 
    scope.gallery, 
    scope.careersSection, 
    scope.downloadsSection, 
    scope.websiteType
  ]);

  // Determine actual layout mode. If explicitly chosen, use it. Otherwise, autodetect (landscape if nodes > 4).
  const currentLayout = scope.sitemapLayout || (activeNodes.length > 4 ? 'landscape' : 'portrait');

  // Local state for editing individual nodes
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Local state for adding nested child elements
  const [newChildTexts, setNewChildTexts] = useState<Record<string, string>>({});

  // Local state for adding a fresh custom page node
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Save changes back to Parent State
  const persistChanges = (updatedNodes: CustomSitemapNode[]) => {
    setActiveNodes(updatedNodes);
    if (onUpdateScope) {
      onUpdateScope({
        ...scope,
        customSitemapNodes: updatedNodes
      });
    }
  };

  const changeLayoutMode = (mode: 'portrait' | 'landscape') => {
    if (onUpdateScope) {
      onUpdateScope({
        ...scope,
        sitemapLayout: mode
      });
    }
  };

  // Handler to Reset to dynamic standard blueprint
  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to revert sitemap changes and load default pages for the selected scope settings?")) {
      persistChanges(getDefaultNodes(scope));
    }
  };

  // Handler to Add a Custom Node
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newNode: CustomSitemapNode = {
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom designated section for specialized operations.',
      children: [],
      isCustom: true
    };

    const updated = [...activeNodes, newNode];
    persistChanges(updated);
    setNewTitle('');
    setNewDesc('');
    setShowAddForm(false);
  };

  // Handler to delete a node
  const handleDeleteNode = (id: string) => {
    const updated = activeNodes.filter(n => n.id !== id);
    persistChanges(updated);
  };

  // Handler to start editing a node
  const startEditing = (node: CustomSitemapNode) => {
    setEditingNodeId(node.id);
    setEditTitle(node.title);
    setEditDesc(node.description);
  };

  // Handler to save node updates
  const saveNodeEdits = (id: string) => {
    if (!editTitle.trim()) return;
    const updated = activeNodes.map(n => {
      if (n.id === id) {
        return { ...n, title: editTitle.trim(), description: editDesc.trim() };
      }
      return n;
    });
    persistChanges(updated);
    setEditingNodeId(null);
  };

  // Handle reordering (Up)
  const moveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...activeNodes];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    persistChanges(copy);
  };

  // Handle reordering (Down)
  const moveDown = (index: number) => {
    if (index === activeNodes.length - 1) return;
    const copy = [...activeNodes];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    persistChanges(copy);
  };

  // Add child nested node under specified ID
  const addChildNode = (nodeId: string) => {
    const text = newChildTexts[nodeId] || '';
    if (!text.trim()) return;

    const updated = activeNodes.map(n => {
      if (n.id === nodeId) {
        const children = n.children || [];
        return { ...n, children: [...children, text.trim()] };
      }
      return n;
    });

    persistChanges(updated);
    setNewChildTexts(prev => ({ ...prev, [nodeId]: '' }));
  };

  // Remove child nested node
  const removeChildNode = (nodeId: string, childIdx: number) => {
    const updated = activeNodes.map(n => {
      if (n.id === nodeId) {
        const children = n.children || [];
        return { ...n, children: children.filter((_, idx) => idx !== childIdx) };
      }
      return n;
    });
    persistChanges(updated);
  };

  const calculatedTotalPages = activeNodes.reduce((acc, curr) => acc + 1 + (curr.children?.length || 0), 0);

  return (
    <div id="sitemap-generator-container" className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs max-w-full">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600 shrink-0" />
          <h4 className="font-sans font-semibold text-slate-800 text-sm tracking-tight uppercase">
            Interactive Sitemap Blueprint Overview
          </h4>
        </div>

        {/* Builder Toolbar - Only active if interactive scope update function passed */}
        {isInteractive && (
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Reset to standard */}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-sans font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Reset configuration back to template standard"
            >
              <RotateCcw className="h-3 w-3 text-amber-500" />
              Reset Pages
            </button>

            {/* Layout Toggles */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/40 shadow-inner">
              <button
                type="button"
                onClick={() => changeLayoutMode('portrait')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  currentLayout === 'portrait' 
                    ? 'bg-white shadow-2xs text-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Portrait Flow (Vertical)"
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => changeLayoutMode('landscape')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  currentLayout === 'landscape' 
                    ? 'bg-white shadow-2xs text-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Landscape Flow (Horizontal)"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick add card trigger */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1 text-[10.5px] font-sans font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Custom Page
            </button>
          </div>
        )}
      </div>

      <p className="text-[11.5px] text-slate-500 leading-relaxed font-sans mb-5 pb-4 border-b border-slate-200/65">
        This interactive sitemap structure maps the page routing of <strong>{projectName || "Your Custom Website"}</strong>. You can customize page titles, descriptions, nest custom sub-pages, or change flow configurations.
      </p>

      {/* Manual Page Insertion Form */}
      {showAddForm && (
        <form onSubmit={handleAddNode} className="mb-6 p-4 bg-white border border-blue-100 rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <FolderPlus className="h-4 w-4 text-blue-600" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-blue-800 font-mono">Insert New Sitemap Node</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[9.5px] font-bold text-slate-400 block mb-1 uppercase font-sans">Page Title *</label>
              <input
                type="text"
                placeholder="e.g. Terms & Privacy Policy Center"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-sans text-slate-700 bg-slate-50 focus:bg-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[9.5px] font-bold text-slate-400 block mb-1 uppercase font-sans">Description Overview</label>
              <input
                type="text"
                placeholder="Brief summary of layout utility..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-sans text-slate-700 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-sans font-bold"
            >
              Save Custom Page
            </button>
          </div>
        </form>
      )}

      {/* --- RENDER PIPELINE: PORTRAIT FLOW --- */}
      {currentLayout === 'portrait' ? (
        <div className="flex flex-col items-center">
          
          {/* Root Card Node */}
          <div className="relative mb-2 shrink-0">
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-6 py-3 rounded-xl shadow-md border border-blue-900 font-sans font-bold text-xs tracking-widest uppercase text-center min-w-[210px] select-none">
              🌐 Core Web Root
              <div className="text-[9.5px] font-mono font-normal lowercase tracking-wide mt-0.5 opacity-90">
                {projectName ? projectName.toLowerCase().replace(/\s+/g, '-') : 'company'}.com
              </div>
            </div>
          </div>

          {/* Vertical path bars */}
          <div className="w-0.5 h-6 bg-slate-300"></div>
          <div className="w-5/6 h-0.5 bg-slate-300 relative"></div>
          <div className="w-0.5 h-4 bg-slate-300"></div>

          {/* Children block */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full mt-2">
            {activeNodes.map((node, index) => (
              <div 
                key={node.id} 
                id={`sitemap-node-${node.id}`}
                className={`sitemap-node flex flex-col justify-between bg-white border rounded-xl p-4 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all ${
                  editingNodeId === node.id ? 'border-amber-400 ring-2 ring-amber-400/10 bg-amber-50/5' : 'border-slate-200'
                }`}
              >
                <div>
                  
                  {/* Title Bar & Sorting Controls */}
                  <div className="flex items-start justify-between gap-1 border-b border-slate-100 pb-2 mb-2">
                    {editingNodeId === node.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="font-sans font-bold text-xs text-slate-800 border border-amber-300 px-1.5 py-0.5 rounded focus:outline-none w-11/12"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="font-sans font-bold text-[12.5px] text-slate-900 tracking-tight leading-snug">
                          {node.title}
                        </span>
                        {node.isCustom && (
                          <span className="text-[8px] bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded-full font-sans uppercase font-bold border border-sky-250">
                            Custom
                          </span>
                        )}
                      </div>
                    )}

                    {/* Inline edit and sorting features */}
                    {isInteractive && (
                      <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 text-slate-400 disabled:opacity-30 rounded cursor-pointer"
                          title="Move Left/Up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === activeNodes.length - 1}
                          className="p-1 hover:bg-slate-100 text-slate-400 disabled:opacity-30 rounded cursor-pointer"
                          title="Move Right/Down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        {editingNodeId === node.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveNodeEdits(node.id)}
                              className="p-1 hover:bg-emerald-50 text-emerald-600 rounded cursor-pointer"
                              title="Save updates"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNodeId(null)}
                              className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(node)}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                              title="Edit title & overview"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNode(node.id)}
                              className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                              title="Remove card"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Body description */}
                  {editingNodeId === node.id ? (
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full text-[11px] font-sans text-slate-600 border border-amber-350 p-1.5 rounded focus:outline-none mb-2 bg-slate-50"
                    />
                  ) : (
                    <p className="text-[11.2px] text-slate-500 leading-normal font-sans pl-2">
                      {node.description}
                    </p>
                  )}

                  {/* Nested child templates list & adder */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-2 font-sans pl-1.5">
                      Nested Layouts / Actions
                    </span>

                    {/* Children List */}
                    {node.children && node.children.length > 0 && (
                      <div className="space-y-1.5 pl-1.5 mb-3">
                        {node.children.map((child, cIdx) => (
                          <div key={cIdx} className="flex items-center justify-between gap-1 group bg-slate-50/50 p-1 rounded-md border border-slate-200/40">
                            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-600 font-sans">
                              <CornerDownRight className="h-3 w-3 text-blue-500 shrink-0" />
                              <span className="truncate max-w-[130px] sm:max-w-none">{child}</span>
                            </div>
                            {isInteractive && (
                              <button
                                type="button"
                                onClick={() => removeChildNode(node.id, cIdx)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer transition-opacity"
                                title="Delete layout point"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adding Nested Point inline */}
                    {isInteractive && (
                      <div className="flex items-center gap-1 pl-1.5">
                        <input
                          type="text"
                          placeholder="Add sub-view..."
                          value={newChildTexts[node.id] || ''}
                          onChange={(e) => setNewChildTexts({ ...newChildTexts, [node.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addChildNode(node.id);
                            }
                          }}
                          className="flex-1 text-[10.5px] font-sans px-2 py-1 border border-slate-200 bg-white rounded focus:outline-none focus:border-blue-400"
                        />
                        <button
                          type="button"
                          onClick={() => addChildNode(node.id)}
                          className="p-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                          title="Save Sub-item"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        /* --- RENDER PIPELINE: LANDSCAPE FLOW (Horizontal Mindmap style) --- */
        <div className="flex flex-col md:flex-row items-stretch gap-6 w-full relative">
          
          {/* Left Anchor: Core Root Node */}
          <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-blue-50 to-slate-100 border border-blue-150 rounded-2xl md:w-[220px] shrink-0 text-center select-none shadow-2xs">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mb-3 border border-blue-200">
              <Compass className="h-5 w-5 text-blue-600" />
            </div>
            <strong className="text-[12.5px] uppercase font-bold text-blue-900 tracking-wider block font-sans">
              📍 CORE WEB ROOT
            </strong>
            <span className="text-[11px] font-mono text-slate-500 block truncate mt-1">
              {projectName ? projectName.toLowerCase().replace(/\s+/g, '-') : 'company'}.com
            </span>
            <div className="mt-4 pt-3.5 border-t border-slate-200 w-full text-[10px] text-slate-400 font-mono">
              Branch Tree Anchor
            </div>
          </div>

          {/* Graphical Trunk Link (Only on wide screens) */}
          <div className="hidden md:flex flex-col justify-center items-center w-6 shrink-0 relative">
            <div className="w-full h-0.5 bg-slate-350 absolute left-0"></div>
            <div className="w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white absolute"></div>
          </div>

          {/* Right Area: Large, High-readability Columns Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeNodes.map((node, index) => (
              <div 
                key={node.id} 
                id={`sitemap-node-${node.id}`}
                className={`flex flex-col justify-between bg-white border rounded-xl p-3.5 shadow-2xs hover:shadow-xs hover:border-blue-350 transition-all ${
                  editingNodeId === node.id ? 'border-amber-400 ring-2 ring-amber-400/10 bg-amber-50/5' : 'border-slate-200'
                }`}
              >
                <div>
                  
                  {/* Card Title & Custom Badge */}
                  <div className="flex items-start justify-between gap-1 border-b border-slate-100 pb-2 mb-2">
                    {editingNodeId === node.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="font-sans font-bold text-xs text-slate-800 border border-amber-300 px-1.5 py-0.5 rounded focus:outline-none w-11/12"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-sans font-bold text-[12px] text-slate-900 tracking-tight truncate leading-snug">
                          {node.title}
                        </span>
                        {node.isCustom && (
                          <span className="text-[7.5px] bg-sky-50 text-sky-700 px-1 rounded-sm uppercase font-bold border border-sky-200">
                            Custom
                          </span>
                        )}
                      </div>
                    )}

                    {/* Options Toolbar */}
                    {isInteractive && (
                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 text-slate-400 disabled:opacity-20 rounded"
                          title="Move Card Left"
                        >
                          <ArrowUp className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === activeNodes.length - 1}
                          className="p-1 hover:bg-slate-100 text-slate-400 disabled:opacity-20 rounded"
                          title="Move Card Right"
                        >
                          <ArrowDown className="h-2.5 w-2.5" />
                        </button>
                        {editingNodeId === node.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveNodeEdits(node.id)}
                              className="p-0.5 hover:bg-emerald-50 text-emerald-600 rounded"
                            >
                              <Check className="h-2.5 w-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNodeId(null)}
                              className="p-0.5 hover:bg-red-50 text-red-500 rounded"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(node)}
                              className="p-0.5 hover:bg-slate-100 text-slate-500 rounded"
                              title="Edit Node details"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNode(node.id)}
                              className="p-0.5 hover:bg-red-50 text-red-500 rounded"
                              title="Delete Page Node"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Body description panel */}
                  {editingNodeId === node.id ? (
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full text-[10.5px] font-sans text-slate-600 border border-amber-300 p-1 rounded focus:outline-none mb-2 bg-slate-50"
                    />
                  ) : (
                    <p className="text-[10.8px] text-slate-500 leading-normal font-sans tracking-tight">
                      {node.description}
                    </p>
                  )}

                  {/* Children / inner specifications list */}
                  <div className="mt-3.5 pt-2 border-t border-slate-100">
                    {node.children && node.children.length > 0 && (
                      <div className="space-y-1 mb-2.5">
                        {node.children.map((child, cIdx) => (
                          <div key={cIdx} className="flex items-center justify-between gap-1 group bg-slate-50/50 p-0.5 px-1 rounded border border-slate-150/40">
                            <div className="flex items-center gap-1 text-[10px] text-slate-600 font-sans tracking-tight truncate">
                              <CornerDownRight className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                              <span className="truncate max-w-[130px] sm:max-w-none">{child}</span>
                            </div>
                            {isInteractive && (
                              <button
                                type="button"
                                onClick={() => removeChildNode(node.id, cIdx)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick child loader input */}
                    {isInteractive && (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Add sub-page layout..."
                          value={newChildTexts[node.id] || ''}
                          onChange={(e) => setNewChildTexts({ ...newChildTexts, [node.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addChildNode(node.id);
                            }
                          }}
                          className="flex-1 text-[9.5px] font-sans px-1.5 py-0.5 border border-slate-200 bg-white rounded focus:outline-none focus:border-blue-450"
                        />
                        <button
                          type="button"
                          onClick={() => addChildNode(node.id)}
                          className="p-0.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded text-slate-500 transition-colors cursor-pointer font-bold"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Footer Details, Page Calculations */}
      <div className="mt-5 flex flex-wrap gap-4 items-center justify-between border-t border-slate-200 pt-3.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-sans not-italic text-[10.5px] text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
          <span>Automatic SEO search console & indexing schemas generated</span>
        </div>
        <div className="font-sans not-italic text-[10.5px] bg-slate-200/60 px-3 py-1 rounded-full text-slate-700">
          Composite Capacity: <strong className="text-slate-900 font-bold">{calculatedTotalPages}</strong> Active Templates & Layouts
        </div>
      </div>
    </div>
  );
}
