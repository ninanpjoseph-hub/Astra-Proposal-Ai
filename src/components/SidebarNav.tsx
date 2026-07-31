import React from 'react';
import { User, UserRole } from '../types';
import { 
  FileText, Landmark, Users, ShieldCheck, Database, Plus, 
  LogOut, Sun, Moon, ChevronRight, X, Sparkles
} from 'lucide-react';

interface SidebarNavProps {
  activeModule: 'proposals' | 'cheque-quotations' | 'suppliers';
  onSelectModule: (module: 'proposals' | 'cheque-quotations' | 'suppliers') => void;
  proposalsCount: number;
  currentUser: User | null;
  isDbConnected: boolean;
  onOpenDbDiagnostics: () => void;
  onOpenNewProposalModal: () => void;
  dashboardTheme: 'luxury-dark' | 'classic';
  onToggleTheme: () => void;
  onSignOut: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export default function SidebarNav({
  activeModule,
  onSelectModule,
  proposalsCount,
  currentUser,
  isDbConnected,
  onOpenDbDiagnostics,
  onOpenNewProposalModal,
  dashboardTheme,
  onToggleTheme,
  onSignOut,
  isOpenMobile,
  onCloseMobile
}: SidebarNavProps) {
  const isLuxury = dashboardTheme === 'luxury-dark';

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4 font-sans text-white select-none">
      
      {/* Top Brand Section */}
      <div>
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#C5A059] to-amber-600 border border-amber-300 flex items-center justify-center font-bold font-serif text-slate-950 text-xl shadow-lg shadow-amber-500/10">
              As
            </div>
            <div>
              <h1 className="font-serif font-bold text-base tracking-tight text-white leading-none flex items-center gap-1.5">
                Astra Tech
              </h1>
              <span className="text-[10px] font-mono text-[#C5A059] tracking-wider uppercase block mt-1">
                Proposal Engine v2.4
              </span>
            </div>
          </div>

          {/* Close Mobile Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Database Status Widget */}
        <div 
          onClick={onOpenDbDiagnostics}
          className="mb-5 p-3 rounded-xl bg-[#111C35] border border-slate-800 hover:border-[#C5A059]/40 transition-all cursor-pointer group flex items-center justify-between"
          title="Click to view Database Diagnostics"
        >
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <div>
              <div className="text-[11px] font-semibold text-slate-200 group-hover:text-white transition-colors">
                {isDbConnected ? 'Hostinger MySQL' : 'Standalone Memory'}
              </div>
              <div className="text-[9.5px] font-mono text-slate-400">
                {isDbConnected ? 'Cloud Real-time Sync' : 'Local Storage Mode'}
              </div>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            onOpenNewProposalModal();
            onCloseMobile();
          }}
          className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-amber-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/15 border border-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ Create New Proposal</span>
        </button>

        {/* Group 1: Core Navigation */}
        <div className="space-y-1 mb-6">
          <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Core Workspace
          </div>

          <button
            onClick={() => {
              onSelectModule('proposals');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
              activeModule === 'proposals'
                ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className={`h-4 w-4 ${activeModule === 'proposals' ? 'text-[#C5A059]' : 'text-slate-400'}`} />
              <span>Proposals Directory</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeModule === 'proposals' ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'bg-slate-800 text-slate-400'
            }`}>
              {proposalsCount}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectModule('cheque-quotations');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
              activeModule === 'cheque-quotations'
                ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Landmark className={`h-4 w-4 ${activeModule === 'cheque-quotations' ? 'text-[#C5A059]' : 'text-slate-400'}`} />
              <span>Cheque Software</span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              Console
            </span>
          </button>

          <button
            onClick={() => {
              onSelectModule('suppliers');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
              activeModule === 'suppliers'
                ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className={`h-4 w-4 ${activeModule === 'suppliers' ? 'text-[#C5A059]' : 'text-slate-400'}`} />
              <span>Supplier & Profit Desk</span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Margin
            </span>
          </button>
        </div>

        {/* Group 2: Management & Governance */}
        <div className="space-y-1">
          <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Governance & Audit
          </div>

          <button
            onClick={() => {
              onSelectModule('proposals');
              onCloseMobile();
              setTimeout(() => {
                const el = document.getElementById('admin-action-center-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span>Admin Pipeline Control</span>
            </div>
            {currentUser?.role === UserRole.ADMIN && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold">
                Admin
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Footer Profile & Session Bar */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="h-8 w-8 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.name || "Guest User"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {currentUser?.role || "Sales Executive"}
              </div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {isLuxury ? <Moon className="h-3.5 w-3.5 text-amber-400" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
            <span className="text-[11px] font-medium">Theme: {isLuxury ? "Luxury Dark" : "Classic Light"}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Toggle</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-64 xl:w-72 bg-[#0F172A] border-r border-slate-800/80 z-40 no-print shadow-2xl">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0F172A] border-r border-slate-800 shadow-2xl z-50">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
