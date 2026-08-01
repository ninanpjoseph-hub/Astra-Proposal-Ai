/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Proposal } from '../types';
import { formatQAR, createDefaultBrandingScope, createDefaultBrandingDeliverables } from '../proposalUtils';
import { 
  ProposalPageHeader, 
  ProposalPageFooter, 
  ProposalWatermark, 
  ProposalCustomLetterheadBackground 
} from './ProposalDocumentView';
import { 
  Check, Rocket, Compass, Target, Calendar, ShieldAlert, FileText, Sparkles, 
  Building2, Mail, Phone, Globe, MapPin, Award, Layers, Users
} from 'lucide-react';

interface BrandingProposalDocumentProps {
  proposal: Proposal;
  isPrintMode?: boolean;
}

export default function BrandingProposalDocument({ proposal }: BrandingProposalDocumentProps) {
  const branding = proposal.brandingScope || createDefaultBrandingScope(proposal.clientName);

  const clientName = proposal.clientName || 'Valued Client';
  const companyName = proposal.companyName || 'Brand Identity Project';
  const proposalDate = proposal.proposalDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const presenterName = proposal.preparedByName || 'Ninan P Joseph';
  const presenterCompany = proposal.preparedByCompany || 'Commercial Agency';

  const deliverables = branding.deliverableItems || createDefaultBrandingDeliverables();
  const selectedDeliverables = deliverables.filter(d => d.isSelected);

  // Filter deliverables by category
  const strategyItems = selectedDeliverables.filter(d => d.category === 'Brand Strategy');
  const visualItems = selectedDeliverables.filter(d => d.category === 'Visual Identity');
  const stationeryItems = selectedDeliverables.filter(d => d.category === 'Corporate Stationery');
  const packagingItems = selectedDeliverables.filter(d => d.category === 'Packaging & Merchandise');
  const signageItems = selectedDeliverables.filter(d => d.category === 'Signage & Environmental');
  const digitalItems = selectedDeliverables.filter(d => d.category === 'Digital & Social Media');
  const marketingItems = selectedDeliverables.filter(d => d.category === 'Marketing Collateral');
  const customItems = selectedDeliverables.filter(d => d.category === 'Custom');

  const hasExtendedItems = packagingItems.length > 0 || signageItems.length > 0 || digitalItems.length > 0 || marketingItems.length > 0 || customItems.length > 0;

  // Track page numbers for table of contents
  let currentPage = 1;
  const pageMap: Record<string, number> = {};

  if (branding.includeCoverPage !== false) pageMap['cover'] = currentPage++;
  if (branding.includeTableOfContents !== false) pageMap['toc'] = currentPage++;
  if (branding.includeExecutiveSummary !== false) pageMap['exec'] = currentPage++;
  if (branding.includeObjectives !== false) pageMap['objectives'] = currentPage++;
  if (branding.includeKickoffApproach !== false) pageMap['kickoff'] = currentPage++;
  if (branding.includeProcess !== false) pageMap['process'] = currentPage++;
  if (branding.includeScopeDeliverables !== false) pageMap['scope_core'] = currentPage++;
  if (branding.includeScopeDeliverables !== false && hasExtendedItems) pageMap['scope_ext'] = currentPage++;
  if (branding.includePhasesOfExecution !== false) pageMap['phases'] = currentPage++;
  if (branding.includeTimeline !== false) pageMap['timeline'] = currentPage++;
  if (branding.includeFinancials !== false) pageMap['financials'] = currentPage++;
  if (branding.includeTermsExclusions !== false) pageMap['terms'] = currentPage++;
  if (branding.includeAcceptance !== false) pageMap['acceptance'] = currentPage++;

  return (
    <div className="branding-proposal-doc space-y-8 max-w-4xl mx-auto text-slate-800 font-sans">

      {/* PAGE 1: COVER PAGE */}
      {branding.includeCoverPage !== false && (
        <div id="page-branding-cover" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['cover'] || 1)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto text-center py-6">
            <span className="inline-block px-3 py-1 bg-[#d3af00]/10 border border-[#d3af00]/30 rounded-full text-[#d3af00] font-mono text-[11px] font-bold uppercase tracking-widest mb-4">
              COMMERCIAL BRANDING PROPOSAL
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1a2744] mb-3 leading-tight">
              {companyName}
            </h1>
            <div className="h-0.5 w-24 bg-[#d3af00] mx-auto mb-4" />
            <h2 className="text-base md:text-lg font-semibold text-slate-700 tracking-tight mb-8">
              Branding & Identity Development Proposal
            </h2>

            <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-6 text-left max-w-md mx-auto space-y-3.5 text-xs shadow-2xs">
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Prepared For:</span>
                <strong className="text-slate-900 font-bold">{clientName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Prepared By:</span>
                <strong className="text-slate-900 font-bold">{presenterCompany}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Consultant:</span>
                <span className="text-slate-800 font-medium">{presenterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Date:</span>
                <strong className="text-slate-800 font-mono">{proposalDate}</strong>
              </div>
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['cover'] || 1)} />
        </div>
      )}

      {/* PAGE 2: TABLE OF CONTENTS */}
      {branding.includeTableOfContents !== false && (
        <div id="page-branding-toc" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['toc'] || 2)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d3af00]">
                DOCUMENT OUTLINE
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744] mt-1">
                Table of Contents
              </h2>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              {[
                { title: 'Executive Summary', pageKey: 'exec' },
                { title: 'Project Mission & Objectives', pageKey: 'objectives' },
                { title: 'Kick-Off Meeting & Strategic Approach', pageKey: 'kickoff' },
                { title: 'Brand Development Methodology', pageKey: 'process' },
                { title: 'Scope of Work - Core Deliverables', pageKey: 'scope_core' },
                ...(hasExtendedItems ? [{ title: 'Scope of Work - Extended Applications', pageKey: 'scope_ext' }] : []),
                { title: 'Phases of Execution', pageKey: 'phases' },
                { title: 'Project Timeline Schedule', pageKey: 'timeline' },
                { title: 'Commercials & Financial Proposal', pageKey: 'financials' },
                { title: 'Terms & Scope Exclusions', pageKey: 'terms' },
                { title: 'Acceptance & Proposal Sign-off', pageKey: 'acceptance' }
              ].filter(item => pageMap[item.pageKey]).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-sans py-1.5 border-b border-slate-100 last:border-0">
                  <span className="font-bold text-[#1a2744] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d3af00]" />
                    {item.title}
                  </span>
                  <span className="border-b border-dotted border-slate-300 flex-grow mx-3 opacity-60" />
                  <span className="font-mono font-bold text-slate-500">Page {pageMap[item.pageKey]}</span>
                </div>
              ))}
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['toc'] || 2)} />
        </div>
      )}

      {/* PAGE 3: EXECUTIVE SUMMARY */}
      {branding.includeExecutiveSummary !== false && (
        <div id="page-branding-exec" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['exec'] || 3)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                EXECUTIVE BRIEFING
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Executive Summary
              </h2>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 text-xs text-slate-700 leading-relaxed shadow-2xs">
              {branding.customExecutiveSummaryLead ? (
                branding.customExecutiveSummaryLead.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))
              ) : (
                <>
                  <p>
                    Thank you very much for the opportunity to present our commercial proposal for your consideration. We are honoured to provide insight into our strategic creative capabilities and design services.
                  </p>
                  <p>
                    Within this proposal, we outline our comprehensive branding and identity development services designed to support your launch, market positioning, and long-term brand equity.
                  </p>
                  <p>
                    Our experienced strategy and design teams bring robust expertise across brand identity, digital assets, marketing collateral, and corporate stationery to deliver a distinctive and cohesive visual ecosystem.
                  </p>
                </>
              )}
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 text-xs text-slate-700 leading-relaxed shadow-2xs">
              <h3 className="font-serif font-bold text-sm text-[#1a2744] border-b border-slate-100 pb-2">
                Project Brief for {companyName}
              </h3>
              {branding.customExecutiveSummaryProject ? (
                branding.customExecutiveSummaryProject.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p>
                  This quotation has been crafted for <strong>{companyName}</strong> to guide its brand identity enhancement initiative. Our creative development ensures your brand is portrayed consistently and professionally across all client touchpoints.
                </p>
              )}
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['exec'] || 3)} />
        </div>
      )}

      {/* PAGE 4: MISSION & OBJECTIVES */}
      {branding.includeObjectives !== false && (
        <div id="page-branding-objectives" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['objectives'] || 4)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                STRATEGIC PURPOSE
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Project Mission & Brand Objectives
              </h2>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium leading-relaxed">
              {branding.objectivesOverview || "The new brand identity will echo core corporate values with a fresh, modern aesthetic, positioning the business for regional leadership."}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(branding.objectivesList || []).map((pt, idx) => (
                <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-[#1a2744] text-[#d3af00] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-700 font-sans leading-snug">
                    {pt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['objectives'] || 4)} />
        </div>
      )}

      {/* PAGE 5: KICKOFF & STRATEGIC APPROACH */}
      {branding.includeKickoffApproach !== false && (
        <div id="page-branding-kickoff" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['kickoff'] || 5)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                ENGAGEMENT ALIGNMENT
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Kick-Off & Strategic Approach
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="font-serif font-bold text-xs text-[#1a2744] uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#d3af00]" />
                  Kick-Off Meeting Agenda
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 font-sans">
                  {(branding.kickoffAgenda || [
                    "Agree on project deliverables & milestones",
                    "Clarify key stakeholders and decision makers",
                    "Discuss brand direction and target audience",
                    "Confirm presentation schedule & review gates",
                    "Finalize invoicing terms & billing contacts"
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#d3af00] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="font-serif font-bold text-xs text-[#1a2744] uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#1a2744]" />
                  Kick-Off Deliverables ({branding.kickoffTiming || 'Timing: 1 Day'})
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 font-sans">
                  {(branding.kickoffDeliverables || [
                    "Detailed project schedule with milestone dates",
                    "Formalized billing & invoicing schedule"
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strategic Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-serif font-bold text-xs text-[#1a2744]">1. Brand Strategy</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  {branding.approachStrategy || "Positioning framework to connect with target audience."}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-serif font-bold text-xs text-[#1a2744]">2. Tone & Voice</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  {branding.approachToneVoice || "Defining brand personality and key messaging rules."}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-serif font-bold text-xs text-[#1a2744]">3. Moodboard Direction</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  {branding.approachMoodboard || "Visual inspiration boards capturing typography and palette."}
                </p>
              </div>
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['kickoff'] || 5)} />
        </div>
      )}

      {/* PAGE 6: BRAND DEVELOPMENT METHODOLOGY */}
      {branding.includeProcess !== false && (
        <div id="page-branding-process" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['process'] || 6)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                CREATIVE METHODOLOGY
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Brand Development Workflow Stages
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(branding.processStages || []).map((st, idx) => (
                <div key={st.id} className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#1a2744] text-[#d3af00] font-mono text-[10px] font-bold flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <h4 className="font-serif font-bold text-xs text-[#1a2744]">{st.stageName}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{st.description}</p>
                </div>
              ))}
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['process'] || 6)} />
        </div>
      )}

      {/* PAGE 7: SCOPE OF WORK - CORE DELIVERABLES */}
      {branding.includeScopeDeliverables !== false && (
        <div id="page-branding-scope-core" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['scope_core'] || 7)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                SCOPE OF WORK
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Core Brand Deliverables
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Target design deliverable sheet configured for <strong>{companyName}</strong>:
              </p>
            </div>

            <div className="space-y-4">
              {/* Strategy */}
              {strategyItems.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider border-b border-slate-200 pb-1">
                    Brand Strategy & Positioning
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {strategyItems.map(item => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{item.title}:</strong> {item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Visual Identity */}
              {visualItems.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider border-b border-slate-200 pb-1">
                    Brand Identity & Visual Language
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {visualItems.map(item => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{item.title}:</strong> {item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Corporate Stationery */}
              {stationeryItems.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider border-b border-slate-200 pb-1">
                    Corporate Stationery Templates
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {stationeryItems.map(item => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{item.title}:</strong> {item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['scope_core'] || 7)} />
        </div>
      )}

      {/* PAGE 8: SCOPE OF WORK - EXTENDED APPLICATIONS */}
      {branding.includeScopeDeliverables !== false && hasExtendedItems && (
        <div id="page-branding-scope-ext" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['scope_ext'] || 8)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                EXTENDED APPLICATIONS
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Extended Brand Collateral & Touchpoints
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packagingItems.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                  <h4 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider border-b border-slate-100 pb-1">
                    Packaging & Merchandise
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {packagingItems.map(item => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{item.title}:</strong> {item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {signageItems.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                  <h4 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider border-b border-slate-100 pb-1">
                    Signage & Environmental
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {signageItems.map(item => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{item.title}:</strong> {item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {digitalItems.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                  <h4 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider border-b border-slate-100 pb-1">
                    Digital & Social Media
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {digitalItems.map(item => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{item.title}:</strong> {item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {marketingItems.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                  <h4 className="text-xs font-bold text-[#1a2744] uppercase tracking-wider border-b border-slate-100 pb-1">
                    Marketing Collateral
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {marketingItems.map(item => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{item.title}:</strong> {item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {customItems.length > 0 && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2 md:col-span-2">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-amber-200 pb-1">
                    Custom Client Deliverables
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-800">
                    {customItems.map(item => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>{item.title}:</strong> {item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['scope_ext'] || 8)} />
        </div>
      )}

      {/* PAGE 9: PHASES OF EXECUTION */}
      {branding.includePhasesOfExecution !== false && (
        <div id="page-branding-phases" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['phases'] || 9)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                EXECUTION ROADMAP
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Phases of Execution
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(branding.executionPhases || []).map((phase) => (
                <div key={phase.id} className="p-4.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <h4 className="font-serif font-bold text-xs text-[#1a2744] uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>{phase.phaseTitle}</span>
                    <span className="w-5 h-5 rounded-full bg-[#1a2744] text-[#d3af00] font-mono text-[10px] flex items-center justify-center font-bold">
                      {phase.phaseNumber}
                    </span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-sans">
                    {phase.actionPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#d3af00] font-bold">✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['phases'] || 9)} />
        </div>
      )}

      {/* PAGE 10: TIMELINE SCHEDULE */}
      {branding.includeTimeline !== false && (
        <div id="page-branding-timeline" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['timeline'] || 10)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                SCHEDULE & MILESTONES
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Project Timeline Schedule
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-[#1a2744] font-mono text-xs font-bold flex items-center justify-center mx-auto border border-slate-200">
                  W1
                </div>
                <h4 className="font-serif font-bold text-xs text-[#1a2744]">DISCOVER (1 Week)</h4>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">Understanding brand core values & research alignment.</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-[#1a2744] font-mono text-xs font-bold flex items-center justify-center mx-auto border border-slate-200">
                  W2-3
                </div>
                <h4 className="font-serif font-bold text-xs text-[#1a2744]">DESIGN (2 Weeks)</h4>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">Creative concepts (2 options) & feedback revisions.</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-[#1a2744] font-mono text-xs font-bold flex items-center justify-center mx-auto border border-slate-200">
                  W4-5
                </div>
                <h4 className="font-serif font-bold text-xs text-[#1a2744]">LAUNCH (2 Weeks)</h4>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">Brand guidelines & final print artwork delivery.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-sans text-center">
              <strong>Total Estimated Execution Window:</strong> 5 to 6 Working Weeks.<br />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Timeline subject to receipt of client feedback and asset approvals.
              </span>
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['timeline'] || 10)} />
        </div>
      )}

      {/* PAGE 11: COMMERCIALS & FINANCIALS */}
      {branding.includeFinancials !== false && (
        <div id="page-branding-financials" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['financials'] || 11)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                COMMERCIAL PROPOSAL
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Financial Fee Schedule
              </h2>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#1a2744] text-white font-bold">
                  <tr>
                    <th className="p-3 w-10 text-center">SL</th>
                    <th className="p-3 w-40">Resource / Role</th>
                    <th className="p-3">Detail & Execution Tasks</th>
                    <th className="p-3 w-24 text-center">Time-Days</th>
                    <th className="p-3 w-32 text-right">Amount QAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(branding.financialItems || []).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-bold font-mono text-slate-500">{item.sl || idx + 1}</td>
                      <td className="p-3 font-bold text-[#1a2744]">{item.resourceRole}</td>
                      <td className="p-3 text-slate-700">{item.detail}</td>
                      <td className="p-3 text-center font-mono text-slate-600">{item.timeDays}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {item.amount === 0 ? 'Waivered' : formatQAR(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
                  <tr>
                    <td colSpan={4} className="p-3.5 text-right text-xs uppercase tracking-wider text-slate-300">
                      Grand Total Investment:
                    </td>
                    <td className="p-3.5 text-right font-mono text-[#d3af00] text-sm font-extrabold">
                      {formatQAR(proposal.totalCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 font-sans space-y-1">
              <p className="font-bold text-[#1a2744]">{branding.financialNotes || "Signed proposal and LPO required to commence work."}</p>
              <p>{branding.paymentTermsText || "PAYMENT TERMS: Payment due within 21 days from date of invoice."}</p>
              <p>{branding.invoicingScheduleText || "INVOICING: 50% upfront on proposal approval and 50% on project completion and delivery."}</p>
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['financials'] || 11)} />
        </div>
      )}

      {/* PAGE 12: TERMS & EXCLUSIONS */}
      {branding.includeTermsExclusions !== false && (
        <div id="page-branding-terms" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['terms'] || 12)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                ENGAGEMENT CONDITIONS
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Terms & Scope Exclusions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <h4 className="font-serif font-bold text-xs text-[#1a2744] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Standard Engagement Terms
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 font-sans">
                  {(branding.termsList || [
                    "INVOICING: 50% upfront on proposal approval and 50% on project completion and delivery.",
                    "PAYMENT TERMS: Payment due within 21 days from date of invoice."
                  ]).map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#d3af00] font-bold">✓</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <h4 className="font-serif font-bold text-xs text-rose-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Scope Exclusions
                </h4>
                <div className="space-y-1.5 text-xs text-slate-600 font-sans max-h-64 overflow-y-auto">
                  {(branding.exclusionsList || []).map((exc, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{exc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['terms'] || 12)} />
        </div>
      )}

      {/* PAGE 13: ACCEPTANCE & SIGN-OFF */}
      {branding.includeAcceptance !== false && (
        <div id="page-branding-acceptance" className="proposal-page relative flex flex-col justify-between overflow-hidden">
          <ProposalWatermark proposal={proposal} />
          <ProposalCustomLetterheadBackground proposal={proposal} />
          <ProposalPageHeader proposal={proposal} pageNumber={String(pageMap['acceptance'] || 13)} />

          <div className="my-auto w-full relative z-10 font-sans max-w-2xl mx-auto space-y-5">
            <div className="text-center">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#d3af00] uppercase block mb-0.5">
                COMMERCIAL SIGN-OFF
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1a2744]">
                Acceptance of Proposal
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                To acknowledge acceptance of this proposal, please sign, stamp, and return below:
              </p>
            </div>

            <div className="space-y-4 bg-slate-50/80 p-6 rounded-2xl border border-slate-200 text-xs font-sans max-w-lg mx-auto shadow-2xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Client Authorized Name:</label>
                <div className="border-b-2 border-slate-300 h-8 flex items-end font-semibold text-slate-800">
                  {proposal.clientPocName || clientName}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Company Name:</label>
                <div className="border-b-2 border-slate-300 h-8 flex items-end font-semibold text-slate-800">
                  {companyName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Signature:</label>
                  <div className="border-b-2 border-slate-300 h-10" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Company Stamp:</label>
                  <div className="border-b-2 border-slate-300 h-10" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date:</label>
                <div className="border-b-2 border-slate-300 h-8" />
              </div>
            </div>

            {/* Presenter contact card */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs max-w-lg mx-auto shadow-2xs">
              <div>
                <strong className="text-[#1a2744] block font-serif text-sm">{presenterName}</strong>
                <span className="text-slate-500 block text-[11px]">Brand Consultant • {presenterCompany}</span>
              </div>
              <div className="text-right text-[11px] text-slate-600 font-mono">
                <span>Direct Commercial Inquiries</span>
              </div>
            </div>
          </div>

          <ProposalPageFooter proposal={proposal} pageNumber={String(pageMap['acceptance'] || 13)} />
        </div>
      )}

    </div>
  );
}
