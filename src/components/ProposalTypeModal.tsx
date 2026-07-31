import React from 'react';
import { ProposalType } from '../types';
import { Globe, Palette, Cpu, Landmark, X, Sparkles, ChevronRight } from 'lucide-react';

interface ProposalTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: ProposalType) => void;
  onSelectChequeSoftware: () => void;
  isLuxury?: boolean;
}

export default function ProposalTypeModal({
  isOpen,
  onClose,
  onSelectType,
  onSelectChequeSoftware,
  isLuxury = true
}: ProposalTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
      <div 
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden font-sans transition-all ${
          isLuxury 
            ? 'bg-[#0F172A] border-slate-800 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white tracking-tight">
                Create New Client Proposal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a proposal template architecture to launch the interactive wizard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - Option Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Option 1: Website Design */}
          <button
            onClick={() => {
              onSelectType('website');
              onClose();
            }}
            className="p-5 rounded-xl border border-slate-800 bg-[#111C35]/60 hover:bg-[#1E293B] hover:border-[#C5A059]/50 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                  Web & App
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-white group-hover:text-[#C5A059] transition-colors">
                Website Design & Development
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Custom web design, sitemap structure, responsive development, and CMS integration.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-[#C5A059]">
              <span>Launch Builder</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 2: Branding */}
          <button
            onClick={() => {
              onSelectType('branding');
              onClose();
            }}
            className="p-5 rounded-xl border border-slate-800 bg-[#111C35]/60 hover:bg-[#1E293B] hover:border-[#C5A059]/50 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Palette className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                  Identity
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-white group-hover:text-[#C5A059] transition-colors">
                Branding & Visual Identity
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Brand strategy, logo creation, typography systems, and corporate style guidelines.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-[#C5A059]">
              <span>Launch Builder</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 3: Modular IT Services */}
          <button
            onClick={() => {
              onSelectType('services');
              onClose();
            }}
            className="p-5 rounded-xl border border-slate-800 bg-[#111C35]/60 hover:bg-[#1E293B] hover:border-emerald-500/50 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  IT & AMC
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Modular IT Services & AMC
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Enterprise cloud hosting, security audits, software maintenance, and tech support.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Launch Builder</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 4: Cheque Printing Software */}
          <button
            onClick={() => {
              onSelectChequeSoftware();
              onClose();
            }}
            className="p-5 rounded-xl border border-slate-800 bg-[#111C35]/60 hover:bg-[#1E293B] hover:border-amber-500/50 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Landmark className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                  Software
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                Cheque Printing Quotation
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Hardware MICR scanners, software license quotations, and receipt voucher ledgers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Open Console</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}
