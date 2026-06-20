import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Edit3, Save, Calendar, FileText, TrendingUp, DollarSign,
  Briefcase, Users, Landmark, CreditCard, ChevronRight, CheckCircle2,
  AlertCircle, Download, List, BarChart3, Receipt, ArrowRight, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { Proposal, Supplier, SupplierPayment, SupplierLinkedItem } from '../types';

export default function SupplierProfitDesk() {
  // Navigation tabs within Module
  const [deskTab, setDeskTab] = useState<'dashboard' | 'suppliers' | 'ledger' | 'reports'>('dashboard');

  // State arrays containing all our core records
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [chequeQuotations, setChequeQuotations] = useState<any[]>([]);

  // Filtering/Selection states
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string>('');
  
  // Dialog / Edit states for Suppliers
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState<string>('');
  const [supContact, setSupContact] = useState<string>('');
  const [supMobile, setSupMobile] = useState<string>('');
  const [supEmail, setSupEmail] = useState<string>('');
  const [supCompany, setSupCompany] = useState<string>('');
  const [supNotes, setSupNotes] = useState<string>('');

  // Log Payment states
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payProposalId, setPayProposalId] = useState<string>('');

  // Load everything
  const loadData = async () => {
    setIsLoading(true);
    setErrorNotice('');
    try {
      // 1. Fetch Suppliers
      let supsList: Supplier[] = [];
      try {
        const res = await fetch('/api/proposals/suppliers/all');
        if (res.ok) {
          supsList = await res.json();
        } else {
          throw new Error('API return non-200');
        }
      } catch (err) {
        console.warn('API error loading suppliers, using localStorage fallback');
        const local = localStorage.getItem('prowess_suppliers_v1');
        supsList = local ? JSON.parse(local) : [
          {
            id: 'sup_default_1',
            name: 'Astra Hardware Systems',
            contactPerson: 'Adnan Mansour',
            mobile: '+974 5544 1122',
            email: 'adnan@astrahardware.qa',
            companyName: 'Astra Hardware Trading LLC',
            notes: 'Main partner for MICR readers, barcode scanners, and custom cheque printers.'
          },
          {
            id: 'sup_default_2',
            name: 'Gulf Solutions Corp',
            contactPerson: 'Farhan Al-Khouri',
            mobile: '+974 6677 8899',
            email: 'farhan@gulfsolutions.qa',
            companyName: 'Gulf Solutions Technology',
            notes: 'Sourcing agent for premium laser printers and ink consumables.'
          }
        ];
        localStorage.setItem('prowess_suppliers_v1', JSON.stringify(supsList));
      }
      setSuppliers(supsList);
      if (supsList.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supsList[0].id);
      }

      // 2. Fetch Supplier Payments
      let pmsList: SupplierPayment[] = [];
      try {
        const res = await fetch('/api/proposals/supplier-payments/all');
        if (res.ok) {
          pmsList = await res.json();
        } else {
          throw new Error('API return non-200');
        }
      } catch (err) {
        console.warn('API error loading payments, using localStorage fallback');
        const local = localStorage.getItem('prowess_supplier_payments_v1');
        pmsList = local ? JSON.parse(local) : [
          {
            id: 'sp_1',
            supplierId: 'sup_default_1',
            amount: 750,
            paymentDate: '2026-06-15',
            reference: 'CBQ Bank Transfer TXN-81203',
            notes: 'Advance for MICR Reader on approved client deployment.'
          }
        ];
        localStorage.setItem('prowess_supplier_payments_v1', JSON.stringify(pmsList));
      }
      setPayments(pmsList);

      // 3. Fetch regular state proposals
      try {
        const res = await fetch('/api/proposals');
        if (res.ok) {
          const props = await res.json();
          // Parse string JSON if returned as raw string
          const processed = props.map((p: any) => {
            let supplierItemsParsed: SupplierLinkedItem[] = [];
            if (p.supplier_items) {
              try {
                supplierItemsParsed = typeof p.supplier_items === 'string' 
                  ? JSON.parse(p.supplier_items) 
                  : p.supplier_items;
              } catch (e) {
                console.error("Error parsing supplier_items", e);
              }
            } else if (p.supplierItems) {
              supplierItemsParsed = p.supplierItems;
            }
            return {
              ...p,
              // Map DB snake case to React properties
              clientName: p.client_name || p.clientName || '',
              companyName: p.company_name || p.companyName || '',
              proposalDate: p.proposal_date || p.proposalDate || '',
              totalCost: parseFloat(p.total_cost || p.totalCost || 0),
              supplierItems: supplierItemsParsed
            };
          });
          setProposals(processed);
        }
      } catch (e) {
        console.error("Failed to load regular database proposals:", e);
      }

      // 4. Load Cheque Quotations from localStorage
      const cachedCheques = localStorage.getItem('prowess_cheque_quotations_v1');
      if (cachedCheques) {
        setChequeQuotations(JSON.parse(cachedCheques));
      }

    } catch (err: any) {
      setErrorNotice('Error compiling supplier metrics: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync to API with local storage redundancy
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const id = editingSupplier ? editingSupplier.id : 'sup_' + Math.random().toString(36).substring(2, 11);
    const payload: Supplier = {
      id,
      name: supName.trim(),
      contactPerson: supContact.trim(),
      mobile: supMobile.trim(),
      email: supEmail.trim(),
      companyName: supCompany.trim(),
      notes: supNotes.trim()
    };

    const nextSups = editingSupplier 
      ? suppliers.map(s => s.id === id ? payload : s)
      : [...suppliers, payload];

    // Local state immediate update
    setSuppliers(nextSups);
    localStorage.setItem('prowess_suppliers_v1', JSON.stringify(nextSups));

    // Async server write
    try {
      await fetch('/api/proposals/suppliers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Database save supplier failed, holding local state only:', err);
    }

    // Reset state & close modal
    setShowSupplierModal(false);
    setEditingSupplier(null);
    setSupName('');
    setSupContact('');
    setSupMobile('');
    setSupEmail('');
    setSupCompany('');
    setSupNotes('');
    
    if (!selectedSupplierId) {
      setSelectedSupplierId(id);
    }
  };

  const handleEditSupplierClick = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupContact(s.contactPerson || '');
    setSupMobile(s.mobile || '');
    setSupEmail(s.email || '');
    setSupCompany(s.companyName || '');
    setSupNotes(s.notes || '');
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this supplier? All associated ledgers will reflect empty records.")) {
      return;
    }

    const nextSups = suppliers.filter(s => s.id !== id);
    setSuppliers(nextSups);
    localStorage.setItem('prowess_suppliers_v1', JSON.stringify(nextSups));

    try {
      await fetch(`/api/proposals/suppliers/delete/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("API error while deleting supplier:", err);
    }

    if (selectedSupplierId === id) {
      setSelectedSupplierId(nextSups[0]?.id || '');
    }
  };

  const handleAddPaymentClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !payAmount || parseFloat(payAmount) <= 0) return;

    const newPay: SupplierPayment = {
      id: 'sup_pay_' + Math.random().toString(36).substring(2, 11),
      supplierId: selectedSupplierId,
      amount: parseFloat(payAmount),
      paymentDate: payDate,
      reference: payRef.trim(),
      notes: payNotes.trim(),
      proposalId: payProposalId || undefined
    };

    const nextPayments = [...payments, newPay];
    setPayments(nextPayments);
    localStorage.setItem('prowess_supplier_payments_v1', JSON.stringify(nextPayments));

    try {
      await fetch('/api/proposals/supplier-payments/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPay)
      });
    } catch (err) {
      console.warn("API write error while recording vendor payment:", err);
    }

    // Reset log pay states
    setPayAmount('');
    setPayRef('');
    setPayNotes('');
    setPayProposalId('');
  };

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm("Are you sure you want to void this supplier payment record?")) return;

    const nextPayments = payments.filter(pm => pm.id !== id);
    setPayments(nextPayments);
    localStorage.setItem('prowess_supplier_payments_v1', JSON.stringify(nextPayments));

    try {
      await fetch(`/api/proposals/supplier-payments/delete/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("API call to delete payment failed:", err);
    }
  };


  // ==========================================
  // UNIFIED DATA AGGREGATION & profit ENGINE
  // ==========================================
  
  // Synthesize ALL logical supplier items from regular proposals AND cheque software quotations
  const supplierIntegrations = useMemo(() => {
    const list: Array<{
      sourceType: 'Cheque Quotation' | 'Enterprise Proposal';
      proposalId: string;
      refNo: string;
      proposalDate: string;
      clientName: string;
      companyName: string;
      status: string;
      // Itemized attributes
      itemDescription: string;
      qty: number;
      purchaseCost: number; // buy cost per unit
      unitPrice: number;    // sell cost per unit
      supplierId: string;
      supplierName: string;
      totalPurchase: number;
      totalSelling: number;
      profitAmount: number;
      profitMarginPercent: number;
    }> = [];

    // 1. Gather from Cheque Quotations (`localStorage`)
    chequeQuotations.forEach((q: any) => {
      const items = q.items || [];
      items.forEach((item: any) => {
        // If it is linked to a supplier (has supplierId)
        if (item.supplierId) {
          const qty = item.qty || 1;
          const buy = parseFloat(item.purchaseCost || 0);
          const sell = parseFloat(item.unitPrice || 0);
          const totBuy = buy * qty;
          const totSell = sell * qty;
          const profit = totSell - totBuy;
          const pct = totSell > 0 ? (profit / totSell) * 100 : 0;

          list.push({
            sourceType: 'Cheque Quotation',
            proposalId: q.id,
            refNo: q.refNo || 'Cheque Quotation',
            proposalDate: q.date || '2026-06-01',
            clientName: q.customerName || 'Inward Client',
            companyName: q.customerCompany || 'Direct Business',
            status: 'Approved', // Handled as immediately approved / won cost structure
            itemDescription: item.description,
            qty,
            purchaseCost: buy,
            unitPrice: sell,
            supplierId: item.supplierId,
            supplierName: item.supplierName || 'Sourced Hardware vendor',
            totalPurchase: totBuy,
            totalSelling: totSell,
            profitAmount: profit,
            profitMarginPercent: pct
          });
        }
      });
    });

    // 2. Gather from general enterprise database proposals
    proposals.forEach((p: Proposal) => {
      const items = p.supplierItems || [];
      items.forEach((item: SupplierLinkedItem) => {
        if (item.supplierId) {
          const qty = item.qty || 1;
          const buy = parseFloat(item.purchaseCost as any || 0);
          const sell = parseFloat(item.unitPrice as any || 0);
          const totBuy = buy * qty;
          const totSell = sell * qty;
          const profit = totSell - totBuy;
          const pct = totSell > 0 ? (profit / totSell) * 100 : 0;

          list.push({
            sourceType: 'Enterprise Proposal',
            proposalId: p.id,
            refNo: p.id.replace('prop_', 'AT/PR-'),
            proposalDate: p.proposalDate || '2026-06-01',
            clientName: p.clientName,
            companyName: p.companyName,
            status: p.status || 'Draft',
            itemDescription: item.description,
            qty,
            purchaseCost: buy,
            unitPrice: sell,
            supplierId: item.supplierId,
            supplierName: item.supplierName || 'Third Party supplier',
            totalPurchase: totBuy,
            totalSelling: totSell,
            profitAmount: profit,
            profitMarginPercent: pct
          });
        }
      });
    });

    return list;
  }, [proposals, chequeQuotations]);

  // Supplier Profit Analysis & Balances computation
  const suppliersStats = useMemo(() => {
    return suppliers.map(sup => {
      // Sourced items under this supplier
      const supItems = supplierIntegrations.filter(integration => integration.supplierId === sup.id);
      
      // APPROVED items (count Won, Completed, Approved, Sent statuses to determine payables)
      const approvedItems = supItems.filter(item => 
        ['Won', 'Completed', 'Approved', 'Sent', 'Under Process'].includes(item.status)
      );

      const totalRevenue = supItems.reduce((acc, curr) => acc + curr.totalSelling, 0);
      const totalCost = supItems.reduce((acc, curr) => acc + curr.totalPurchase, 0);
      const grossProfit = totalRevenue - totalCost;
      const avgMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Payable is based on approved/active projects
      const totalPayable = approvedItems.reduce((acc, curr) => acc + curr.totalPurchase, 0);
      
      // Payments received by this supplier
      const totalPaid = payments
        .filter(p => p.supplierId === sup.id)
        .reduce((acc, p) => acc + parseFloat(p.amount as any || 0), 0);

      const outstandingBalance = totalPayable - totalPaid;

      return {
        ...sup,
        totalRevenue,
        totalCost,
        grossProfit,
        avgMargin,
        totalPayable,
        totalPaid,
        outstandingBalance,
        associatedItems: supItems
      };
    });
  }, [suppliers, supplierIntegrations, payments]);

  // Overall financial sums
  const overallMetrics = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let profit = 0;
    let payables = 0;
    let outstanding = 0;
    let paid = 0;

    suppliersStats.forEach((stat) => {
      revenue += stat.totalRevenue;
      cost += stat.totalCost;
      profit += stat.grossProfit;
      payables += stat.totalPayable;
      outstanding += stat.outstandingBalance;
      paid += stat.totalPaid;
    });

    return {
      revenue,
      cost,
      profit,
      payables,
      outstanding,
      paid,
      netMarginPercent: revenue > 0 ? (profit / revenue) * 100 : 0
    };
  }, [suppliersStats]);

  // Reports view lists
  const reportLists = useMemo(() => {
    // 1. Group profit by proposal
    const proposalMap: Record<string, {
      id: string;
      refNo: string;
      client: string;
      company: string;
      type: string;
      status: string;
      itemsCount: number;
      revenue: number;
      cost: number;
      profit: number;
    }> = {};

    supplierIntegrations.forEach(item => {
      const key = item.proposalId;
      if (!proposalMap[key]) {
        proposalMap[key] = {
          id: item.proposalId,
          refNo: item.refNo,
          client: item.clientName,
          company: item.companyName,
          type: item.sourceType,
          status: item.status,
          itemsCount: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }
      proposalMap[key].itemsCount += 1;
      proposalMap[key].revenue += item.totalSelling;
      proposalMap[key].cost += item.totalPurchase;
      proposalMap[key].profit += item.profitAmount;
    });

    const profitPerProposal = Object.values(proposalMap);

    // 2. Profit monthly breakdown
    const monthlyMap: Record<string, {
      monthLabel: string; // e.g. "June 2026"
      revenue: number;
      cost: number;
      profit: number;
    }> = {};

    supplierIntegrations.forEach(item => {
      const d = new Date(item.proposalDate);
      if (isNaN(d.getTime())) return;
      
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          monthLabel: label,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }
      monthlyMap[key].revenue += item.totalSelling;
      monthlyMap[key].cost += item.totalPurchase;
      monthlyMap[key].profit += item.profitAmount;
    });

    const monthlyBreakdown = Object.values(monthlyMap);

    return {
      profitPerProposal,
      monthlyBreakdown
    };

  }, [supplierIntegrations]);

  // Selected supplier in ledger tab
  const activeLedgerSupplier = useMemo(() => {
    return suppliersStats.find(s => s.id === selectedSupplierId);
  }, [suppliersStats, selectedSupplierId]);

  // Selected supplier payment list
  const activeSupplierPayments = useMemo(() => {
    return payments
      .filter(p => p.supplierId === selectedSupplierId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, selectedSupplierId]);

  // Proposals offering items from this supplier to link to payments
  const supplierApprovedProposalsList = useMemo(() => {
    if (!selectedSupplierId) return [];
    
    const set = new Set<string>();
    const out: Array<{ id: string; ref: string; desc: string }> = [];

    supplierIntegrations.forEach(p => {
      if (p.supplierId === selectedSupplierId && !set.has(p.proposalId)) {
        set.add(p.proposalId);
        out.push({
          id: p.proposalId,
          ref: p.refNo,
          desc: `${p.refNo} - M/S ${p.clientName} (${p.companyName})`
        });
      }
    });

    return out;
  }, [supplierIntegrations, selectedSupplierId]);

  return (
    <div id="supplier-profit-desk-wrapper" className="space-y-6">
      
      {/* 1. SECTION COMPONENT TOP METRIC STRIP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <h2 className="text-xl font-serif font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="h-5 w-5 text-blue-600" />
            Supplier Partnership & Profits Desk
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-channel cost structure analytics, procurement margins, outstanding vendor ledger payments, and profit margin governance.
          </p>
        </div>

        {/* Outer Tab Navigation */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setDeskTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              deskTab === 'dashboard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Control Dashboard
          </button>
          <button 
            onClick={() => setDeskTab('suppliers')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              deskTab === 'suppliers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Suppliers List
          </button>
          <button 
            onClick={() => setDeskTab('ledger')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              deskTab === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Ledger & Vouchers
          </button>
          <button 
            onClick={() => setDeskTab('reports')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              deskTab === 'reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Profit Margin Audits
          </button>
        </div>
      </div>

      {/* ERROR DISPLAY SYSTEM */}
      {errorNotice && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center gap-2.5 text-rose-700 text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          {errorNotice}
        </div>
      )}

      {/* =======================================================
          A. TAB: CONTROL DASHBOARD (MANAGEMENT DASHBOARD)
          ======================================================= */}
      {deskTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-950 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Proposal Revenue</span>
              <div className="mt-2 text-2xl font-mono font-extrabold text-blue-400">
                {overallMetrics.revenue.toLocaleString()} <span className="text-white text-xs">QAR</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1.5 font-sans leading-none">Gross external sales value</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Sourced Cost</span>
              <div className="mt-2 text-2xl font-mono font-extrabold text-slate-900">
                {overallMetrics.cost.toLocaleString()} <span className="text-slate-500 text-xs">QAR</span>
              </div>
              <span className="text-[10px] text-slate-405 block mt-1.5 leading-none">Total purchase buying cost</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Gross Sourced Profit</span>
              <div className="mt-2 text-2xl font-mono font-extrabold text-emerald-800 flex items-baseline gap-1">
                {overallMetrics.profit.toLocaleString()} <span className="text-xs">QAR</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1.5 leading-none">
                Net Sourced Margin: {overallMetrics.netMarginPercent.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Supplier Payables</span>
              <div className="mt-2 text-2xl font-mono font-extrabold text-indigo-700">
                {overallMetrics.payables.toLocaleString()} <span className="text-slate-500 text-xs">QAR</span>
              </div>
              <span className="text-[10px] text-slate-405 block mt-1.5 leading-none">Under Won/Approved quotes</span>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-700 block">Outstanding Balance</span>
              <div className="mt-2 text-2xl font-mono font-extrabold text-orange-700">
                {overallMetrics.outstanding.toLocaleString()} <span className="text-xs">QAR</span>
              </div>
              <span className="text-[10px] text-orange-600 block mt-1.5 font-bold leading-none">
                Paid: {overallMetrics.paid.toLocaleString()} QAR ({overallMetrics.payables > 0 ? ((overallMetrics.paid / overallMetrics.payables) * 100).toFixed(0) : 0}% cleared)
              </span>
            </div>

          </div>

          {/* Supplier-wise Profit Analysis and Key items Bento Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* L: Supplier-wise Margin analysis */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Supplier Profit & Margin Analysis
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  {suppliers.length} active vendors
                </span>
              </div>

              {suppliersStats.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No suppliers configured. Navigate to "Suppliers List" to store partners.
                </div>
              ) : (
                <div className="space-y-4">
                  {suppliersStats.map(sup => {
                    return (
                      <div key={sup.id} className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800">{sup.name}</h4>
                            <p className="text-[10px] text-slate-400">{sup.companyName || 'No corporate entity'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                              Margin {sup.avgMargin.toFixed(0)}%
                            </span>
                            <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                              Profit: +{sup.grossProfit.toLocaleString()} QAR
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar of Cost viz Sales */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>Sourced Cost: {sup.totalCost.toLocaleString()} QAR</span>
                            <span>Sales Revenue: {sup.totalRevenue.toLocaleString()} QAR</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                            <div 
                              title="Purchase Cost Ratio"
                              className="bg-slate-400 h-full" 
                              style={{ width: `${sup.totalRevenue > 0 ? (sup.totalCost / sup.totalRevenue) * 100 : 0}%` }}
                            />
                            <div 
                              title="Profit Yield"
                              className="bg-emerald-500 h-full" 
                              style={{ width: `${sup.totalRevenue > 0 ? (sup.grossProfit / sup.totalRevenue) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Outstanding Ledger stats banner */}
                        <div className="flex justify-between items-center text-[10px] border-t border-slate-150 pt-1.5 mt-1.5">
                          <span className="text-slate-500">
                            Outstanding Payables: <span className="font-mono font-bold text-indigo-700">{sup.totalPayable.toLocaleString()} QAR</span>
                          </span>
                          <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                            sup.outstandingBalance > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                          }`}>
                            Bal: {sup.outstandingBalance.toLocaleString()} QAR
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* R: Supplier Sourced Line Items Log */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <List className="h-4 w-4 text-slate-500" />
                  Recent Sourced Lines SCM Log
                </h3>
              </div>

              <div className="overflow-y-auto max-h-[380px] space-y-3 pr-1">
                {supplierIntegrations.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No hardware or accessories mapped to external suppliers yet. Create or edit a proposal to map itemized purchase costs.
                  </div>
                ) : (
                  supplierIntegrations.map((item, index) => (
                    <div key={index} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-400">{item.refNo}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                          item.sourceType === 'Cheque Quotation' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.sourceType === 'Cheque Quotation' ? 'Cheque' : 'Enterprise'}
                        </span>
                      </div>

                      <div className="font-bold text-slate-800 leading-tight">
                        {item.itemDescription || "Untitled Hardware Accessories"}
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px] border-t border-slate-150 pt-1 text-slate-500">
                        <div>
                          Qty: <span className="font-bold text-slate-700">{item.qty}</span> <br/>
                          Supplier: <span className="font-bold text-indigo-700">{item.supplierName}</span>
                        </div>
                        <div className="text-right">
                          Cost: <span className="font-mono">{item.totalPurchase.toLocaleString()} QAR</span><br />
                          Profit: <span className="font-mono text-emerald-600 font-bold">+{item.profitAmount.toLocaleString()} QAR</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =======================================================
          B. TAB: SUPPLIERS LIST DIRECTORY
          ======================================================= */}
      {deskTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-xl">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Sourcing Partner Directories</h3>
              <p className="text-[10.5px] text-slate-500">Add, alter, and log complete address logs of raw material suppliers and hardware integration distributors.</p>
            </div>
            <button 
              onClick={() => {
                setEditingSupplier(null);
                setSupName('');
                setSupContact('');
                setSupMobile('');
                setSupEmail('');
                setSupCompany('');
                setSupNotes('');
                setShowSupplierModal(true);
              }}
              className="px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Sourcing Partner
            </button>
          </div>

          {/* Suppliers Grid cards directory */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(s => {
              const stats = suppliersStats.find(st => st.id === s.id);
              
              return (
                <div key={s.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-xs">
                  
                  {/* Header info */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-indigo-700 font-mono font-bold uppercase block">Supplier Portal</span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1">{s.name}</h4>
                      {s.companyName && <span className="text-[10px] text-slate-500">{s.companyName}</span>}
                    </div>
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEditSupplierClick(s)}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                        title="Edit details"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSupplier(s.id)}
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                        title="Delete supplier"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body contact cards */}
                  <div className="p-4 space-y-3 flex-grow text-xs text-slate-600">
                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Contact Representative</span>
                        <span className="font-bold text-slate-800">{s.contactPerson || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Mobile Line</span>
                        <span className="font-mono text-slate-800 font-bold">{s.mobile || "N/A"}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Billing Email address</span>
                      <span className="font-mono text-slate-800">{s.email || "N/A"}</span>
                    </div>

                    {s.notes && (
                      <div className="p-2 border border-slate-100 bg-slate-50 rounded-lg text-[10.5px] italic text-slate-500 leading-tight">
                        "{s.notes}"
                      </div>
                    )}
                  </div>

                  {/* SCM metrics footer */}
                  <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex justify-between items-center text-xs text-slate-600 font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold leading-none">TOTAL OUTSTANDING</span>
                      <span className="text-orange-700 font-bold block mt-1">
                        {stats ? stats.outstandingBalance.toLocaleString() : 0} QAR
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedSupplierId(s.id);
                        setDeskTab('ledger');
                      }}
                      className="px-2 py-1 border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-bold font-sans rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      Ledger Account <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* SUPPLIER CREATE & EDIT DIALOG MODAL */}
          {showSupplierModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-250 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl space-y-4">
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                  <h3 className="text-xs font-serif font-extrabold uppercase tracking-widest text-[#C5A059]">
                    {editingSupplier ? 'Modify Supplier Profile' : 'Register New Vendor Affiliate'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowSupplierModal(false);
                      setEditingSupplier(null);
                    }}
                    className="text-slate-400 hover:text-white font-bold cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
                  
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Supplier / Vendor Name *</label>
                    <input 
                      type="text" 
                      required
                      value={supName}
                      onChange={(e) => setSupName(e.target.value)}
                      placeholder="e.g. Doha Tech Hardware & Systems"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Contact Person Representative</label>
                      <input 
                        type="text" 
                        value={supContact}
                        onChange={(e) => setSupContact(e.target.value)}
                        placeholder="e.g. Mansour Al-Rabban"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Corporate Company Name</label>
                      <input 
                        type="text" 
                        value={supCompany}
                        onChange={(e) => setSupCompany(e.target.value)}
                        placeholder="e.g. Al-Rabban Technology Solutions"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Mobile Dial Number</label>
                      <input 
                        type="text" 
                        value={supMobile}
                        onChange={(e) => setSupMobile(e.target.value)}
                        placeholder="e.g. +974 5500 1100"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Corporate Email Address</label>
                      <input 
                        type="email" 
                        value={supEmail}
                        onChange={(e) => setSupEmail(e.target.value)}
                        placeholder="e.g. billing@technodoha.qa"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Internal Remarks / Sourcing Notes</label>
                    <textarea 
                      value={supNotes}
                      onChange={(e) => setSupNotes(e.target.value)}
                      placeholder="e.g. Key partner for laser MICR cheque scanners. Handles custom firmware configuration."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowSupplierModal(false);
                        setEditingSupplier(null);
                      }}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 font-bold rounded-lg cursor-pointer text-slate-600"
                    >
                      Discard
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Save Partner profile
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          C. TAB: SUPPLIER LEDGER ACCOUNT & PAYMENT VOUCHERS
          ======================================================= */}
      {deskTab === 'ledger' && (
        <div id="supplier-ledger-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: SELECT SUPPLIER (Col span 4) */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Procurement Partners</h4>
            <div className="space-y-2">
              {suppliers.map(s => {
                const stats = suppliersStats.find(st => st.id === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSupplierId(s.id)}
                    className={`w-full p-3 rounded-lg text-left border flex flex-col justify-between transition-all cursor-pointer ${
                      selectedSupplierId === s.id 
                        ? 'bg-blue-600 border-blue-750 text-white shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <span className={`text-[9px] uppercase font-bold ${selectedSupplierId === s.id ? 'text-blue-200': 'text-blue-700'}`}>Partner ID</span>
                        <h5 className="text-xs font-extrabold mt-0.5 line-clamp-1">{s.name}</h5>
                      </div>
                    </div>
                    <div className="flex justify-between items-center w-full mt-3 border-t border-slate-100/10 pt-1.5 text-[10.5px]">
                      <span className={selectedSupplierId === s.id ? 'text-blue-100': 'text-slate-400'}>Ledger Bal:</span>
                      <span className="font-mono font-bold">
                        {stats ? stats.outstandingBalance.toLocaleString() : 0} QAR
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED LEDGER STATEMENTS & VOUCHER LOGGING (Col span 8) */}
          <div className="lg:col-span-8 space-y-6">
            {!activeLedgerSupplier ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-400">
                Please select a partners of suppliers from the left menu to audit statements.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Partnership Ledger state metrics */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">{activeLedgerSupplier.name} Ledger Account</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Corporate ID: {activeLedgerSupplier.id}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 bg-slate-100 border rounded">
                      Auditable Ledger
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center font-mono">
                    <div className="bg-slate-50 p-2.5 rounded-lg border">
                      <span className="text-[9px] text-slate-400 block font-sans font-bold">ACCUMULATED BUY COST</span>
                      <span className="text-xs font-extrabold text-slate-900 mt-1 block">
                        {activeLedgerSupplier.totalPayable.toLocaleString()} QAR
                      </span>
                    </div>
                    <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-[9px] text-emerald-600 block font-sans font-bold">TOTAL REMITTED CASH</span>
                      <span className="text-xs font-extrabold text-emerald-800 mt-1 block">
                        -{activeLedgerSupplier.totalPaid.toLocaleString()} QAR
                      </span>
                    </div>
                    <div className="bg-orange-50 text-orange-850 p-2.5 rounded-lg border border-orange-100">
                      <span className="text-[9px] text-orange-600 block font-sans font-bold">REMAINING UNPAID LIABILITY</span>
                      <span className="text-xs font-extrabold text-orange-800 mt-1 block">
                        {activeLedgerSupplier.outstandingBalance.toLocaleString()} QAR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ledger items list grouped (associated proposals list) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">Associated Proposals & purchase statements</h4>
                  
                  {activeLedgerSupplier.associatedItems.length === 0 ? (
                    <div className="text-center py-6 text-[11.5px] text-slate-400 italic">
                      There are currently no proposals linked to purchase materials from this partner.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-700">
                            <th className="p-2.5 text-[10px] uppercase">Proposal REF</th>
                            <th className="p-2.5 text-[10px] uppercase">Client Business</th>
                            <th className="p-2.5 text-[10px] uppercase">Hardware Description</th>
                            <th className="p-2.5 text-[10px] uppercase text-center">Qty</th>
                            <th className="p-2.5 text-[10px] uppercase text-right">Unit Buy</th>
                            <th className="p-2.5 text-[10px] uppercase text-right">Total Payable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {activeLedgerSupplier.associatedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 text-slate-650">
                              <td className="p-2.5 font-mono text-[10.5px] font-bold text-blue-700">{item.refNo}</td>
                              <td className="p-2.5">
                                <span className="font-bold text-slate-800">{item.clientName}</span>
                                <div className="text-[9.5px] text-slate-400 leading-none">{item.companyName}</div>
                              </td>
                              <td className="p-2.5 leading-tight">{item.itemDescription}</td>
                              <td className="p-2.5 text-center font-mono">{item.qty}</td>
                              <td className="p-2.5 text-right font-mono">{item.purchaseCost.toLocaleString()} QAR</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                                {item.totalPurchase.toLocaleString()} QAR
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Record new cash payment voucher */}
                <form onSubmit={handleAddPaymentClick} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5 pb-1 border-b">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                    Record Partner Cash Outflow payment Voucher
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">Date Paid</label>
                      <input 
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">Amount (QAR) *</label>
                      <input 
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2 space-y-1">
                      <label className="font-bold text-slate-500 block">Reference / Account TXN ID *</label>
                      <input 
                        type="text"
                        required
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="e.g. Txn-CQB-9020412 or Cheque 90215"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">Link to Sourced Quote (Optional)</label>
                      <select
                        value={payProposalId}
                        onChange={(e) => setPayProposalId(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="">-- General Payment Outflow --</option>
                        {supplierApprovedProposalsList.map(item => (
                          <option key={item.id} value={item.id}>{item.desc}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">Auditor Notes</label>
                      <input 
                        type="text"
                        value={payNotes}
                        onChange={(e) => setPayNotes(e.target.value)}
                        placeholder="e.g. Downpayment for MICR scanners for Qatar National Bank configuration"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded"
                      />
                    </div>

                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="h-4 w-4" /> Save Ledger Voucher Entry
                    </button>
                  </div>
                </form>

                {/* Payment History Archive list */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">Payment Outflow History Logs</h4>
                  
                  {activeSupplierPayments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 italic">
                      No payments recorded to this supplier yet. Use the voucher logger above to record payouts.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {activeSupplierPayments.map((pm) => {
                        const linkedRef = supplierApprovedProposalsList.find(pr => pr.id === pm.proposalId);
                        
                        return (
                          <div key={pm.id} className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-xs flex justify-between items-center transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                  -{parseFloat(pm.amount as any).toLocaleString()} QAR
                                </span>
                                <span className="text-slate-400 font-mono">{pm.paymentDate ? new Date(pm.paymentDate).toLocaleDateString('en-GB') : ''}</span>
                              </div>
                              <div className="text-slate-700">
                                Ref: <span className="font-semibold text-slate-800">{pm.reference}</span>
                                {pm.notes && <span className="text-[10.5px] text-slate-405 block italic">"{pm.notes}"</span>}
                                {linkedRef && (
                                  <span className="text-[10px] text-blue-700 block font-mono font-bold">
                                    Linked: {linkedRef.ref}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeletePayment(pm.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
                              title="Void ledger entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* =======================================================
          D. TAB: PROFIT & MARGIN REPORTING DESK
          ======================================================= */}
      {deskTab === 'reports' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-center">
            
            <div className="bg-slate-900 text-white p-4 rounded-xl border">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-sans">Gross Sourced Revenue</span>
              <span className="text-xl font-bold text-blue-400 block mt-1.5">{overallMetrics.revenue.toLocaleString()} QAR</span>
              <p className="text-[9px] text-slate-400 mt-1 font-sans leading-none">Aggregated external selling value</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block font-sans">Accumulated purchase Cost</span>
              <span className="text-xl font-bold text-slate-800 block mt-1.5">{overallMetrics.cost.toLocaleString()} QAR</span>
              <p className="text-[9px] text-slate-405 mt-1 font-sans leading-none">Vendor cost prices</p>
            </div>

            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100">
              <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider block font-sans">Realized Gross Margin</span>
              <span className="text-xl font-bold text-emerald-800 block mt-1.5">+{overallMetrics.profit.toLocaleString()} QAR</span>
              <p className="text-[9.5px] text-emerald-600 font-bold mt-1 font-sans leading-none">Yielding Margin: {overallMetrics.netMarginPercent.toFixed(1)}%</p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Profit Margin Breakdown per proposal */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Profit Margin per Proposal / quotation
              </h3>

              <div className="overflow-x-auto border rounded-lg max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-700">
                      <th className="p-2 text-[10px] uppercase">Ref ID</th>
                      <th className="p-2 text-[10px] uppercase">Client Business</th>
                      <th className="p-2 text-[10px] uppercase text-right">Revenue</th>
                      <th className="p-2 text-[10px] uppercase text-right">Cost</th>
                      <th className="p-2 text-[10px] uppercase text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportLists.profitPerProposal.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 italic">No supplier proposal records exist.</td>
                      </tr>
                    ) : (
                      reportLists.profitPerProposal.map((prop, i) => (
                        <tr key={i} className="hover:bg-slate-50 font-sans">
                          <td className="p-2 font-mono text-blue-700 font-bold">{prop.refNo}</td>
                          <td className="p-2">
                            <span className="font-bold text-slate-800">{prop.client}</span>
                            <div className="text-[9px] text-slate-400 font-mono leading-none">{prop.company}</div>
                          </td>
                          <td className="p-2 text-right font-mono">{prop.revenue.toLocaleString()} QAR</td>
                          <td className="p-2 text-right font-mono">{prop.cost.toLocaleString()} QAR</td>
                          <td className="p-2 text-right font-mono text-emerald-600 font-bold">
                            +{prop.profit.toLocaleString()} QAR
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Monthly SCM Profit summaries */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-sans">
                <Calendar className="h-4 w-4 text-slate-500" />
                 SC Pipeline Monthly aggregate summaries
              </h3>

              <div className="overflow-x-auto border rounded-lg max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-700">
                      <th className="p-2 text-[10px] uppercase">Billing Month</th>
                      <th className="p-2 text-[10px] uppercase text-right">Revenue</th>
                      <th className="p-2 text-[10px] uppercase text-right">Cost</th>
                      <th className="p-2 text-[10px] uppercase text-right">Profit</th>
                      <th className="p-2 text-[10px] uppercase text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportLists.monthlyBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 italic">No monthly aggregates available.</td>
                      </tr>
                    ) : (
                      reportLists.monthlyBreakdown.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50 font-sans">
                          <td className="p-2 font-bold text-slate-800">{m.monthLabel}</td>
                          <td className="p-2 text-right font-mono">{m.revenue.toLocaleString()} QAR</td>
                          <td className="p-2 text-right font-mono">{m.cost.toLocaleString()} QAR</td>
                          <td className="p-2 text-right font-mono text-emerald-600 font-bold">
                            +{m.profit.toLocaleString()} QAR
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">
                            {m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(0) : 0}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
