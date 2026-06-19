import React, { useState, useEffect } from 'react';
import { 
  X, Printer, Plus, Trash2, Edit2, FileText, Check, DollarSign, 
  MapPin, Phone, Building, Calendar, Info, ShieldAlert, FilePlus2, 
  CheckCircle2, FileSpreadsheet, Lock
} from 'lucide-react';
import { Proposal, PaymentEntry, UserRole, User } from '../types';
import { formatQAR } from '../proposalUtils';

interface InvoiceModalProps {
  proposal: Proposal;
  onClose: () => void;
  currentUser: User | null;
}

interface InvoiceItem {
  id: string;
  sl: number;
  description: string;
  qty: number;
  unitPrice: number;
}

export function InvoiceModal({ proposal, onClose, currentUser }: InvoiceModalProps) {
  const [billToName, setBillToName] = useState(proposal.companyName || proposal.clientName);
  const [attnDepartment, setAttnDepartment] = useState('Finance Department');
  const [phoneNo, setPhoneNo] = useState('+974 4400 0000');
  const [invoiceNo, setInvoiceNo] = useState(`INV-${proposal.id.replace('PROP_', '')}-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState(`CUST-${proposal.id.substring(5, 11)}`);
  const [customerPo, setCustomerPo] = useState(`PO-${Math.floor(4500000 + Math.random() * 90000)}`);
  const [paymentTerms, setPaymentTerms] = useState(proposal.paymentTerms || '50% Advance, 25% Second, 25% Final');
  const [contactName, setContactName] = useState(currentUser?.name || 'finance@technoastra.com');

  // Items table state
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isEditingData, setIsEditingData] = useState(false);

  // Auto-init items based on the proposal structure
  useEffect(() => {
    const items: InvoiceItem[] = [];
    if (proposal.type === 'branding') {
      const scope = proposal.brandingScope;
      let sl = 1;
      
      // Look for selected deliverables
      if (scope.logoDesign) items.push({ id: 'brand_1', sl: sl++, description: 'Strategic Brand Identity & Professional Logo Design Suite SOW', qty: 1, unitPrice: Math.round(proposal.totalCost * 0.45) });
      if (scope.brandGuidelines) items.push({ id: 'brand_2', sl: sl++, description: 'Corporate Brand Guidelines Document & Sizing Parameters SOW', qty: 1, unitPrice: Math.round(proposal.totalCost * 0.15) });
      
      // Combine other selected static deliverables
      const others: string[] = [];
      if (scope.businessCards) others.push('Business Cards');
      if (scope.letterheads) others.push('Corporate Letterheads');
      if (scope.emailSignature) others.push('Email Signature');
      if (scope.envelopes) others.push('Envelopes Pack');
      if (scope.officeStamp) others.push('Office Wooden Stamps');
      if (scope.employeeIdCards) others.push('Employee ID Cards Layout');
      if (scope.receiptsVouchers) others.push('Official Receipts/Vouchers Design');
      
      if (others.length > 0) {
        items.push({
          id: 'brand_others',
          sl: sl++,
          description: `Custom Stationery Pack SOW: [${others.join(', ')}]`,
          qty: 1,
          unitPrice: Math.round(proposal.totalCost * 0.25)
        });
      }

      if (scope.additionalDeliverables) {
        items.push({
          id: 'brand_ext',
          sl: sl++,
          description: `Deliverable Extension: ${scope.additionalDeliverables}`,
          qty: 1,
          unitPrice: Math.round(proposal.totalCost * 0.15)
        });
      }

      // Check sum to make sure it matches proposal totals perfectly
      let currentSum = items.reduce((acc, it) => acc + (it.qty * it.unitPrice), 0);
      if (currentSum > 0 && proposal.totalCost !== currentSum) {
        // Adjust the first item unit price to balance
        const diff = proposal.totalCost - currentSum;
        if (items.length > 0) {
          items[0].unitPrice += diff;
        }
      } else if (items.length === 0) {
        items.push({
          id: 'brand_fallback',
          sl: 1,
          description: 'Comprehensive Corporate Branding & Identity Design SOW',
          qty: 1,
          unitPrice: proposal.totalCost
        });
      }
    } else {
      // Website SOW
      const scope = proposal.websiteScope;
      let sl = 1;
      const typeLabel = scope.websiteType === 'ecommerce' ? 'E-Commerce' : scope.websiteType === 'dynamic' ? 'Interactive Dynamic portal' : 'Symmetric Static website';
      
      items.push({
        id: 'web_main',
        sl: sl++,
        description: `Premium bespoke ${typeLabel} frontend application architected with React & Next.js - Up to ${scope.totalPages || 8} optimized templates`,
        qty: 1,
        unitPrice: Math.round(proposal.totalCost * 0.65)
      });

      const modules: string[] = [];
      if (scope.contactForms) modules.push('Contact Forms Engine');
      if (scope.blogModule) modules.push('Dynamic CMS Blog/News Module');
      if (scope.gallery) modules.push('High-Fidelity Project Gallery');
      if (scope.careersSection) modules.push('Careers & Resume Application Center');
      if (scope.downloadsSection) modules.push('Client Document Downloads repository');
      if (scope.seoPlugin || scope.securityPlugin) modules.push('Enterprise SEO, Cache & Core Security Optimizations');

      if (modules.length > 0) {
        items.push({
          id: 'web_addons',
          sl: sl++,
          description: `Module Addons: [${modules.join(', ')}]`,
          qty: 1,
          unitPrice: Math.round(proposal.totalCost * 0.20)
        });
      }

      if (scope.maintenancePeriod) {
        items.push({
          id: 'web_maint',
          sl: sl++,
          description: `Expert Tech Support & Active Cloud Security Guarding Package - Duration Limit ${scope.maintenancePeriod} Months`,
          qty: 1,
          unitPrice: Math.round(proposal.totalCost * 0.15)
        });
      }

      // Check sum validation
      let currentSum = items.reduce((acc, it) => acc + (it.qty * it.unitPrice), 0);
      if (currentSum > 0 && proposal.totalCost !== currentSum) {
        const diff = proposal.totalCost - currentSum;
        if (items.length > 0) {
          items[0].unitPrice += diff;
        }
      } else if (items.length === 0) {
        items.push({
          id: 'web_fallback',
          sl: 1,
          description: 'Custom Enterprise Software and Website development SOW integration',
          qty: 1,
          unitPrice: proposal.totalCost
        });
      }
    }

    setInvoiceItems(items);
  }, [proposal]);

  // Recalculate sums
  const subTotal = invoiceItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleAddItem = () => {
    const nextSl = invoiceItems.length + 1;
    setInvoiceItems([
      ...invoiceItems,
      {
        id: `custom_${Date.now()}`,
        sl: nextSl,
        description: 'New service deliverable description line...',
        qty: 1,
        unitPrice: 1000
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    const remaining = invoiceItems.filter(it => it.id !== id);
    // Recalculate SL indices
    const normalized = remaining.map((it, idx) => ({
      ...it,
      sl: idx + 1
    }));
    setInvoiceItems(normalized);
  };

  const handleFieldChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        return updated;
      }
      return item;
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 overflow-y-auto p-4 font-sans text-slate-800 no-print">
      <div className="bg-white rounded-2xl w-full max-w-[1000px] shadow-2xl flex flex-col md:flex-row h-[90vh]">
        
        {/* Left Toolbar: Interactive parameters configuration */}
        <div className="w-full md:w-[320px] bg-slate-550 border-r border-slate-200 p-5 flex flex-col justify-between overflow-y-auto space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-205 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                  ⚙️ INVOICE BUILDER
                </h3>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">Customize properties and itemized financials in real-time</p>
              </div>
              <button 
                onClick={onClose} 
                className="md:hidden text-slate-400 hover:text-slate-650 p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Toggle Configuration Mode */}
            <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700">Quick Edit Items Table</span>
              <button
                onClick={() => setIsEditingData(!isEditingData)}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md shadow-3xs cursor-pointer transition-all ${
                  isEditingData 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                {isEditingData ? 'Lock List' : 'Edit List'}
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <label className="block">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Bill To Client Name</span>
                <input 
                  type="text" 
                  value={billToName}
                  onChange={(e) => setBillToName(e.target.value)}
                  className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Finance Department Contact</span>
                <input 
                  type="text" 
                  value={attnDepartment}
                  onChange={(e) => setAttnDepartment(e.target.value)}
                  className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Billing Phone Number</span>
                <input 
                  type="text" 
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Invoice Ref</span>
                  <input 
                    type="text" 
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Invoice Date</span>
                  <input 
                    type="date" 
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Customer ID</span>
                  <input 
                    type="text" 
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Customer PO</span>
                  <input 
                    type="text" 
                    value={customerPo}
                    onChange={(e) => setCustomerPo(e.target.value)}
                    className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Payment Terms Override</span>
                <input 
                  type="text" 
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Contact / Email on Block</span>
                <input 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-slate-200">
            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-[#0b57d0] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print Commercial Invoice
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-350 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Close Builder
            </button>
          </div>
        </div>

        {/* Right Preview Sheet Space: Structured to print perfectly on real A4 paper */}
        <div id="document-viewer-wrapper" className="flex-1 bg-slate-100 p-6 overflow-y-auto flex justify-center border-l border-slate-200">
          
          <div className="flex flex-col items-center">
            
            {/* Sheet Page */}
            <div 
              id="printable-bill-sheet"
              className="bg-white border border-slate-300 w-[210mm] min-h-[297mm] shadow-xl p-[20mm] relative text-black overflow-hidden flex flex-col justify-between font-sans selection:bg-yellow-100"
              style={{ contentVisibility: 'auto' }}
            >
              
              {/* Dynamic Watermark Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none opacity-[0.035]">
                <span className="font-sans font-black text-[150px] tracking-widest text-[#000000] rotate-[30deg] block">
                  INVOICE
                </span>
              </div>

              {/* Page Content Body */}
              <div className="relative z-10 space-y-6">
                
                {/* 1. Brand Corporate Header */}
                <div className="flex justify-between items-start border-b border-stone-200 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#0b57d0] h-10 w-10 rounded flex items-center justify-center font-bold font-serif italic text-white text-xl">
                        At
                      </div>
                      <div>
                        <h2 className="text-xl font-sans font-black text-slate-900 tracking-tight leading-none">
                          Astra Technologies
                        </h2>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                          Integrations & Software Solutions
                        </p>
                      </div>
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-sans pt-1 space-y-0.5">
                      <p>P.O. Box 2434, Grand Corporate Tower, West Bay, Doha – Qatar</p>
                      <p>Tel: +974 4493 8211 • Web: www.technoastra.com • Email: projects@technoastra.com</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <h1 className="text-3xl font-sans font-black tracking-tight text-slate-900 uppercase">
                      INVOICE
                    </h1>
                    <p className="text-[10px] font-mono font-bold text-slate-450 tracking-wider">OFFICIAL RECOVERY / CREDIT</p>
                  </div>
                </div>

                {/* 2. Structured Meta Info Grid */}
                <div className="grid grid-cols-2 gap-8 pt-2">
                  
                  {/* Bill To Info Box */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <h4 className="bg-slate-100 font-bold px-3 py-1.5 border-b border-slate-300 text-xs font-sans text-slate-905 uppercase tracking-wide">
                      Bill To:
                    </h4>
                    <div className="p-3 text-[11px] space-y-1 text-slate-800">
                      <p className="font-extrabold text-slate-950 font-sans text-xs">Name: {billToName}</p>
                      <p><span className="text-slate-500 font-medium font-sans">Attn:</span> {attnDepartment}</p>
                      <p><span className="text-slate-500 font-medium font-sans">Phone No:</span> {phoneNo}</p>
                    </div>
                  </div>

                  {/* Invoice attributes */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <h4 className="bg-slate-100 font-bold px-3 py-1.5 border-b border-slate-300 text-xs text-slate-905 uppercase tracking-wide">
                      Invoice Details:
                    </h4>
                    <div className="p-3 text-[11px] space-y-1 text-slate-800">
                      <p><span className="text-slate-450 font-bold font-sans">Invoice Number:</span> {invoiceNo}</p>
                      <p><span className="text-slate-450 font-bold font-sans">Invoice Date:</span> {invoiceDate}</p>
                      <p><span className="text-slate-450 font-bold font-sans">Page:</span> 1</p>
                      <p className="truncate"><span className="text-slate-450 font-bold font-sans">Contact:</span> {contactName}</p>
                    </div>
                  </div>

                </div>

                {/* 3. Dynamic Customer SOW context parameters row */}
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-[11px] font-sans">
                    <thead className="bg-[#e4e8f0]/45 border-b border-slate-300 font-extrabold text-slate-900 uppercase text-[9.5px] tracking-wider">
                      <tr>
                        <th className="py-1.5 px-3 border-r border-slate-300 font-black text-center w-1/3">Customer ID</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 font-black text-center w-1/3">Customer PO</th>
                        <th className="py-1.5 px-3 font-black text-center w-1/3">Payment Terms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-bold">
                      <tr>
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-mono text-slate-700">{customerId}</td>
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-mono text-slate-700">{customerPo}</td>
                        <td className="py-2 px-3 text-center text-slate-700 font-semibold">{paymentTerms}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Structured Items Breakdown Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white mt-4 relative">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#e4e8f0]/45 border-b border-slate-300 font-extrabold text-[#0b57d0]">
                      <tr>
                        <th className="py-2 px-3 border-r border-slate-300 text-center w-12 font-bold select-none text-[10px]">SL</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-[10px]">DESCRIPTION</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-center w-16 text-[10px]">QUANTITY</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-right w-24 text-[10px]">UNIT PRICE</th>
                        <th className="py-2 px-3 text-right w-28 text-[10px]">AMOUNT QAR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-bold font-sans">
                      {invoiceItems.map((item, idx) => (
                        <tr key={item.id} className="text-slate-800 group relative">
                          <td className="py-2 px-3 border-r border-slate-300 text-center font-mono text-slate-600 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-300 text-slate-900 text-xs max-w-[340px]">
                            {isEditingData ? (
                              <textarea
                                value={item.description}
                                onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                                className="w-full border border-dashed border-blue-400 p-1 rounded-sm text-xs text-slate-900 bg-blue-50/50"
                                rows={2}
                              />
                            ) : (
                              <span>{item.description}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-300 text-center font-mono text-slate-705">
                            {isEditingData ? (
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => handleFieldChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                                className="w-12 border border-dashed border-blue-400 p-0.5 rounded-sm text-center font-mono bg-blue-50/50"
                              />
                            ) : (
                              <span>{item.qty}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-300 text-right font-mono text-slate-705">
                            {isEditingData ? (
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleFieldChange(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                                className="w-20 border border-dashed border-blue-400 p-0.5 text-right font-mono bg-blue-50/50"
                              />
                            ) : (
                              <span>{item.unitPrice.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-950 font-bold relative">
                            <span>{(item.qty * item.unitPrice).toLocaleString()}</span>
                            {isEditingData && (
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="absolute right-1 top-2.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Fallback to let them add items */}
                      {invoiceItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 px-3 text-center text-slate-400 text-xs italic">
                            No billing invoice items defined. Please click "Quick Edit Items table" to add columns.
                          </td>
                        </tr>
                      )}

                      {/* Double Total block matching PDF style */}
                      <tr className="bg-slate-50/10 text-slate-900 border-t-2 border-slate-800 font-extrabold text-[12px]">
                        <td colSpan={4} className="py-2.5 px-3 border-r border-slate-300 text-right uppercase tracking-wider font-extrabold">
                          Grand Total:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 text-sm">
                          {subTotal.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Add Item Button in Editor Mode */}
                  {isEditingData && (
                    <div className="absolute left-2 -bottom-9 z-20">
                      <button
                        onClick={handleAddItem}
                        className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1 text-[10px] uppercase font-bold cursor-pointer font-sans shadow-sm"
                      >
                        <Plus className="h-3 w-3" /> Add Custom Billing Row
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-1">
                  
                  {/* Total summary Box */}
                  <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">Sub-Total Value:</span>
                      <strong className="font-mono text-slate-900">{subTotal.toLocaleString()} QAR</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">Service Tax (0.0%):</span>
                      <strong className="font-mono text-emerald-700">0.00 QAR</strong>
                    </div>
                    <div className="border-t border-slate-205 pt-1.5 flex justify-between items-center text-xs font-black">
                      <span className="uppercase tracking-widest text-[#0b57d0]">Grand Total:</span>
                      <strong className="font-mono text-[#0b57d0] text-sm">{subTotal.toLocaleString()} QAR</strong>
                    </div>
                  </div>

                  {/* Empty right footer spacer */}
                  <div></div>

                </div>

                {/* 5. Doha Bank Mandatory Account Details Block */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="border border-slate-350 rounded-lg bg-[#f8fafc] p-3 text-[10px] space-y-1">
                    <p className="font-serif font-extrabold text-[#0b57d0] uppercase tracking-wide leading-none text-[11px] mb-1">
                      Payment can be made by bank • Payable to: Doha Bank
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700 font-sans">
                      <p><span className="font-semibold text-slate-500">Account Holder Name:</span> <strong className="text-slate-900">ASTRA TRADING AND CONTRACTING AND SERVICES</strong></p>
                      <p><span className="font-semibold text-slate-500">Branch:</span> <strong className="text-slate-900">Main Branch</strong></p>
                      <p><span className="font-semibold text-slate-500">Account Number:</span> <strong className="text-slate-900">225-377033-001-0010-000</strong></p>
                      <p><span className="font-semibold text-slate-500">Swift Code:</span> <strong className="text-slate-900 font-mono">DOHBQAQA</strong></p>
                      <p className="col-span-2"><span className="font-semibold text-slate-500">IBAN:</span> <strong className="text-slate-900 font-mono">QA35 DOHB 0225 0377 0330 0100 1000 0</strong></p>
                    </div>
                  </div>
                </div>

              </div>

              {/* 6. A4 Verification & Signatures block */}
              <div className="pt-8 flex justify-between items-end">
                <div className="text-center w-48 space-y-12">
                  <div className="h-0 border-b border-stone-300 border-dashed"></div>
                  <div className="text-[10px] font-semibold text-slate-550 uppercase tracking-widest select-none">
                    Approved By
                  </div>
                </div>
                
                <div className="text-center w-48 space-y-12">
                  <div className="h-0 border-b border-stone-300 border-dashed"></div>
                  <div className="text-[10px] font-semibold text-slate-550 uppercase tracking-widest select-none">
                    Received By
                  </div>
                </div>
              </div>

            </div>
            
          </div>

        </div>

      </div>

      {/* Styled Printable Styles for exact printing page dimension overriding browser headers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-bill-sheet, #printable-bill-sheet * {
            visibility: visible !important;
          }
          #printable-bill-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            padding: 15mm 12mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}

interface StatementModalProps {
  proposal: Proposal;
  onClose: () => void;
  currentUser: User | null;
}

export function StatementOfAccountModal({ proposal, onClose, currentUser }: StatementModalProps) {
  const [statementRef, setStatementRef] = useState(`STMT-${proposal.id.replace('PROP_', '')}-${Math.floor(100 + Math.random() * 900)}`);
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerLocation, setCustomerLocation] = useState('Doha – Qatar');
  
  // In-session temporary payments ledger list for previews
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayAmount, setNewPayAmount] = useState<number>(Math.round(proposal.totalCost * 0.25));
  const [newPayType, setNewPayType] = useState<'Advance' | 'Second' | 'Final' | 'Custom'>('Custom');
  const [newPayReference, setNewPayReference] = useState('Bank Wire Transfer');
  const [newPayDate, setNewPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPayNotes, setNewPayNotes] = useState('Advance Milestone Receipt');

  // Load existing payments from proposal
  useEffect(() => {
    if (proposal.paymentEntries) {
      setPaymentEntries(proposal.paymentEntries);
    } else {
      setPaymentEntries([]);
    }
  }, [proposal]);

  // Calculations
  const contractTotal = proposal.totalCost || 0;
  const totalPaid = paymentEntries.reduce((sum, pay) => sum + Number(pay.amount), 0);
  const pendingBalance = Math.max(0, contractTotal - totalPaid);
  const payPercent = contractTotal > 0 ? Math.min(100, Math.round((totalPaid / contractTotal) * 100)) : 0;
  const statusLabel = pendingBalance === 0 ? 'SETTLED' : payPercent >= 50 ? 'PARTIALLY OUTSTANDING' : 'PENDING INSTALLMENT';

  const handlePrint = () => {
    window.print();
  };

  const handleSavePayment = () => {
    if (newPayAmount <= 0) return;
    
    const entry: PaymentEntry = {
      id: `session_pay_${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: newPayAmount,
      type: newPayType,
      reference: newPayReference,
      notes: newPayNotes,
      date: newPayDate, // fallback/timestamp date representation
    } as any;

    setPaymentEntries([...paymentEntries, entry]);
    setIsAddingPayment(false);
    // Reset values
    setNewPayAmount(Math.round(proposal.totalCost * 0.25));
    setNewPayReference('Bank Wire Transfer');
    setNewPayNotes('Installment Milestone payment');
  };

  const handleRemovePayment = (id: string) => {
    setPaymentEntries(paymentEntries.filter(p => p.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 overflow-y-auto p-4 font-sans text-slate-800 no-print">
      <div className="bg-white rounded-2xl w-full max-w-[1000px] shadow-2xl flex flex-col md:flex-row h-[90vh]">
        
        {/* Left config side */}
        <div className="w-full md:w-[320px] bg-slate-550 border-r border-slate-205 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                📊 STATEMENT BUILDER
              </h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Manage financial entries & ledger configurations</p>
            </div>

            <div className="space-y-2.5 font-sans text-xs">
              <label className="block">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Statement Date</span>
                <input 
                  type="date" 
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Statement Reference Code</span>
                <input 
                  type="text" 
                  value={statementRef}
                  onChange={(e) => setStatementRef(e.target.value)}
                  className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-1">Customer Location</span>
                <input 
                  type="text" 
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  className="w-full border border-slate-250 p-2 text-xs rounded-lg shadow-3xs bg-white"
                />
              </label>
            </div>

            {/* Simulated Live Ledger Addition */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
              <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-black mb-2 flex items-center gap-1">
                ➕ ADD REAL-TIME DEPOSIT
              </h4>

              {isAddingPayment ? (
                <div className="space-y-2 font-sans text-xs">
                  <div>
                    <span className="text-[9px] text-slate-450 block font-bold">Amount (QAR)</span>
                    <input 
                      type="number"
                      value={newPayAmount}
                      onChange={(e) => setNewPayAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-250 p-1.5 text-xs rounded shadow-3xs font-mono bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-450 block font-bold">Reference / Method</span>
                    <input 
                      type="text"
                      value={newPayReference}
                      onChange={(e) => setNewPayReference(e.target.value)}
                      className="w-full border border-slate-250 p-1.5 text-xs rounded bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[9px] text-slate-450 block font-bold">Category</span>
                      <select
                        value={newPayType}
                        onChange={(e) => setNewPayType(e.target.value as any)}
                        className="w-full border border-slate-250 p-1.5 text-xs rounded bg-white"
                      >
                        <option value="Advance">Advance</option>
                        <option value="Second">Second Phase</option>
                        <option value="Final">Final Balance</option>
                        <option value="Custom">Custom Deposit</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-450 block font-bold">Recording Date</span>
                      <input 
                        type="date"
                        value={newPayDate}
                        onChange={(e) => setNewPayDate(e.target.value)}
                        className="w-full border border-slate-200 p-1 text-xs rounded bg-white font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 pt-2">
                    <button
                      onClick={handleSavePayment}
                      className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded shadow-3xs cursor-pointer flex items-center justify-center gap-1 uppercase"
                    >
                      <Check className="h-3 w-3" /> Save Deposit
                    </button>
                    <button
                      onClick={() => setIsAddingPayment(false)}
                      className="py-1 px-2.5 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100 text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingPayment(true)}
                  className="w-full py-1.5 border border-dashed border-blue-400 text-blue-700 hover:bg-blue-50 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Insert Payment Entry
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-slate-205">
            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-[#0b57d0] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print Commercial Statement
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-350 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Close Statement
            </button>
          </div>
        </div>

        {/* Right Preview Sheet Space: Render exact custom Statement of Account Page */}
        <div id="document-viewer-wrapper" className="flex-1 bg-slate-100 p-6 overflow-y-auto flex justify-center border-l border-slate-200">
          
          <div className="flex flex-col items-center">
            
            <div 
              id="printable-statement-sheet"
              className="bg-white border border-slate-300 w-[210mm] min-h-[297mm] shadow-xl p-[20mm] relative text-black overflow-hidden flex flex-col justify-between font-sans selection:bg-yellow-100"
              style={{ contentVisibility: 'auto' }}
            >
              
              {/* 1. Watermark Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none opacity-[0.035]">
                <span className="font-sans font-black text-[100px] tracking-widest text-[#0b57d0] select-none rotate-[20deg] block">
                  STATEMENT
                </span>
              </div>

              {/* Page Content Body */}
              <div className="relative z-10 space-y-6">
                
                {/* 2. Brand Corporate Header */}
                <div className="border-b-2 border-slate-850 pb-5 flex justify-between items-start">
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#0b57d0] h-9 w-9 rounded flex items-center justify-center font-bold font-serif italic text-white text-lg">
                        As
                      </div>
                      <div>
                        <h2 className="text-lg font-serif font-extrabold text-slate-850 tracking-tight leading-none">
                          Astra Technologies
                        </h2>
                        <p className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                          Integrations & Software Solutions
                        </p>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 font-sans pt-1.5 space-y-0.5">
                      <p className="flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 text-blue-600 shrink-0" />
                        <span>P.O. Box 2434, Grand Corporate Tower, West Bay, Doha – Qatar</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span>Tel: +974 4493 8211 • Web: www.technoastra.com • Email: projects@technoastra.com</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-sans shrink-0">
                    <div className="text-xs font-extrabold text-slate-900 tracking-tight">
                      REF NO: {statementRef}
                    </div>
                    <div className="text-[11px] text-slate-650 font-mono mt-1">
                      DATE: {statementDate ? new Date(statementDate).toLocaleDateString('en-GB') : "19/06/2026"}
                    </div>
                  </div>

                </div>

                {/* 3. Recipient Segment */}
                <div className="pt-2 font-sans text-xs">
                  <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">To Reception of,</p>
                  <div className="mt-1 font-bold text-[12px] text-slate-900 transition-all flex flex-col gap-0.5">
                    <span className="border-b border-slate-600 inline-block pb-0.5 max-w-max">
                      M/S – {proposal.companyName || proposal.clientName}
                    </span>
                    <span className="text-[11.5px] text-slate-850 font-semibold mt-0.5">
                      {customerLocation}
                    </span>
                  </div>
                </div>

                {/* 4. Statement Title */}
                <div className="text-center py-1">
                  <h1 className="text-sm font-extrabold tracking-widest text-[#0b57d0] uppercase underline decoration-double decoration-slate-800 inline-block px-4 py-0.5">
                    STATEMENT OF ACCOUNTS
                  </h1>
                </div>

                <p className="text-xs font-bold leading-relaxed text-slate-800">
                  We hereby submit the official Commercial Financial Statement of Accounts & payment receipts record detailing the payments, contract baseline, and active values for the software integrations described in proposal <span className="font-mono text-blue-700">{proposal.id}</span>.
                </p>

                {/* 5. Statement Table */}
                <div className="pt-2 font-sans space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-extrabold text-slate-850 uppercase tracking-widest flex items-center gap-1">
                      🗃️ STATEMENT OF ACCOUNTS & PAYMENTS RECORD
                    </h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 border border-slate-400 font-mono tracking-tight text-slate-700 bg-slate-50 uppercase rounded">
                      STATUS: {statusLabel}
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#e4e8f0]/45 border-b border-slate-805 font-extrabold text-slate-900">
                        <tr>
                          <th className="py-2 px-3 border-r border-slate-800 text-center font-bold w-12 text-[10px]">#</th>
                          <th className="py-2 px-3 border-r border-slate-805 text-[10px]">POSTING DATE</th>
                          <th className="py-2 px-3 border-r border-slate-805 text-[10px]">TRANSACTION / PAYMENT REFERENCE</th>
                          <th className="py-2 px-3 text-right text-[10px]">CREDIT AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-bold">
                        {/* Contract Value Base */}
                        <tr className="bg-slate-50/10 text-slate-900 border-b border-slate-450">
                          <td className="py-2 px-3 border-r border-slate-800 text-center font-mono font-semibold">0</td>
                          <td className="py-2 px-3 border-r border-slate-800 font-mono text-slate-500">
                            {proposal.proposalDate || new Date(proposal.createdAt).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-800 text-slate-600 font-bold uppercase">Total SOW Contract Value Agreed</td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-700">
                            {contractTotal.toLocaleString()} QAR
                          </td>
                        </tr>

                        {/* List of payments */}
                        {paymentEntries.length > 0 ? (
                          paymentEntries.map((pay, pIdx) => (
                            <tr key={pay.id} className="text-slate-800 group relative">
                              <td className="py-1.5 px-3 border-r border-slate-800 text-center font-mono text-slate-500">
                                {pIdx + 1}
                              </td>
                              <td className="py-1.5 px-3 border-r border-slate-800 font-mono">
                                {pay.timestamp ? new Date(pay.timestamp).toLocaleDateString('en-GB') : (pay as any).date || statementDate}
                              </td>
                              <td className="py-1.5 px-3 border-r border-slate-800 font-semibold uppercase flex justify-between items-center pr-8">
                                <span>{pay.reference || `Milestone payment [${pay.type}]`} {pay.notes ? `(${pay.notes})` : ''}</span>
                                <button
                                  onClick={() => handleRemovePayment(pay.id)}
                                  className="text-stone-300 hover:text-rose-650 opacity-0 group-hover:opacity-100 p-0.5 absolute right-2 bg-stone-50 rounded"
                                  title="Delete simulated payment"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-emerald-700">
                                - {pay.amount.toLocaleString()} QAR
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 px-3 text-center text-slate-400 italic">
                              No receipts registered in ledger. Outstanding contract balances remain fully due.
                            </td>
                          </tr>
                        )}

                        {/* Totals Ledgers */}
                        <tr className="bg-slate-50/10 text-slate-900 font-extrabold border-t border-slate-800 text-[10px]">
                          <td colSpan={3} className="py-2 px-3 border-r border-slate-800 text-right uppercase tracking-wider">
                            Total Cash & Wire Payments Deposited:
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-emerald-700 text-xs">
                            {totalPaid.toLocaleString()} QAR
                          </td>
                        </tr>
                        
                        <tr className="bg-[#f0f4f9] text-slate-900 font-bold border-t border-slate-800 text-[11px]">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-right uppercase tracking-widest font-black text-[#0b57d0]">
                            Outstanding Net Balance Payable:
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-[#0b57d0] text-xs">
                            {pendingBalance.toLocaleString()} QAR
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* 6. Statement Verification Sign off */}
              <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                <div className="space-y-4 font-sans text-xs">
                  <p className="font-extrabold text-[#0b57d0] border-b border-blue-600 inline-block pb-0.5 uppercase tracking-wide">
                    Verified By (Finance Dept)
                  </p>
                  <div className="space-y-0.5 font-bold uppercase text-[10.5px] text-slate-905 tracking-tight">
                    <p className="text-[11.5px] font-extrabold text-slate-950">ASTRA TECH FINANCE DEPT</p>
                    <p className="text-slate-700">Accounts & Ledger Verification</p>
                    <p className="text-slate-500">ASTRA TECH</p>
                    <p className="text-slate-400 font-mono italic text-[9px] pt-1">{customerLocation.toUpperCase()}</p>
                  </div>
                </div>

                <div className="text-center w-40 space-y-12 shrink-0">
                  <div className="h-0 border-b border-slate-400 border-dashed"></div>
                  <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Signature & Date
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Styled Printable Styles for exact printing page dimension overriding browser headers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-statement-sheet, #printable-statement-sheet * {
            visibility: visible !important;
          }
          #printable-statement-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            padding: 15mm 12mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
