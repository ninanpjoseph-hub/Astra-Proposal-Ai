import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Edit3, Eye, Calendar, Building, Landmark, 
  MapPin, User, FileText, ArrowUp, ArrowDown, Save, 
  RotateCcw, Download, Printer, Search, PlusCircle, Check, 
  Copy, CheckCircle2, ChevronRight, HelpCircle, Receipt, Coins, Database, Sparkles
} from 'lucide-react';

export interface ChequeQuotationItem {
  id: string;
  description: string;
  unitPrice: number;
  qty: number;
  supplierId?: string;
  supplierName?: string;
  purchaseCost?: number;
}

export interface ChequeQuotationReceipt {
  id: string;
  date: string;
  amount: number;
  reference: string; // e.g. "Cheque No. 200421", "QNB Transfer"
  notes?: string;
}

export interface ChequeQuotation {
  id: string;
  refNo: string;
  date: string;
  customerName: string;
  customerCompany: string;
  customerLocation: string;
  customerContact?: string;
  items: ChequeQuotationItem[];
  currency: string;             // e.g. "QR"
  currencyFull: string;         // e.g. "QATAR RIYAL"
  subunitFull: string;          // e.g. "DIRHAM"
  terms: string[];
  preparedByName: string;
  preparedByTitle: string;
  preparedByCompany: string;
  preparedByLocation: string;
  updatedAt: string;
  payments?: ChequeQuotationReceipt[];
  showLedgerOnPrint?: boolean;
}

export function getTotals(itemsList: ChequeQuotationItem[]): number {
  return itemsList.reduce((acc, it) => acc + (it.unitPrice * it.qty), 0);
}

// Number to Words Converter
function amountToWords(amount: number, currency: string = "QATAR RIYAL", subunit: string = "DIRHAM"): string {
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", 
                "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  
  function convertLessThanThousand(num: number): string {
    if (num === 0) return "";
    let str = "";
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + " HUNDRED ";
      num %= 100;
      if (num > 0) str += "AND ";
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
      if (num > 0) str += ones[num] + " ";
    } else if (num > 0) {
      str += ones[num] + " ";
    }
    return str;
  }

  function convert(num: number): string {
    if (num === 0) return "ZERO";
    let str = "";
    
    // Millions
    if (num >= 1000000) {
      str += convertLessThanThousand(Math.floor(num / 1000000)) + "MILLION ";
      num %= 1000000;
      if (num > 0 && num < 100) str += "AND ";
    }
    
    // Thousands
    if (num >= 1000) {
      str += convertLessThanThousand(Math.floor(num / 1000)) + "THOUSAND ";
      num %= 1000;
      if (num > 0 && num < 100) str += "AND ";
    }
    
    // Hundreds & Tens
    str += convertLessThanThousand(num);
    return str.trim();
  }

  const rounded = Math.round(amount * 100) / 100;
  const whole = Math.floor(rounded);
  const decimal = Math.round((rounded - whole) * 100);

  let result = convert(whole) + " " + currency.toUpperCase();
  
  if (currency.toUpperCase() === "QATAR RIYAL" || currency.toUpperCase() === "QATAR RIYALS") {
    result = convert(whole) + " QATAR RIYAL";
  } else if (currency.toUpperCase() === "QAR") {
    result = convert(whole) + " QATAR RIYAL";
  }

  if (decimal > 0) {
    result += " AND " + convert(decimal) + " " + subunit.toUpperCase();
  } else {
    // No decimal suffix
  }

  return result.trim() + " ONLY";
}

// Suggestion helpers
const DESCRIPTION_SUGGESTIONS = [
  "Cheque Easy Software – 1 License",
  "Cheque Easy Software Enterprise Edition – Unlimited Licenses",
  "Canon LBP 6030 Laser Printer",
  "High Speed Cheque MICR Laser Reader/Scanner",
  "Software Customization & API Ledger Integration",
  "Professional On-Site Installation & Training Support",
  "Annual Maintenance Contract (AMC) – Dedicated Virtual Lead",
  "Custom Premium Layout Alignment & Digital Watermarks Template Setup"
];

const DEFAULT_TERMS_TEMPLATES = [
  {
    name: "Standard Software & Hardware Bundle",
    terms: [
      "Payment: 100% on installation",
      "License Validity - 3 Year",
      "AMC – 750 QR/3 year after every 3 years",
      "Manufacture warranty for Hardware"
    ]
  },
  {
    name: "Enterprise SLA - Annual Payment",
    terms: [
      "Payment: 50% Advance, 50% after deployment and user sign-off",
      "License Validity - Perpetuity with annual cloud hosting terms",
      "Support SLA: 24/7 dedicated telephone and on-site support coverage",
      "Hardware warranty including local product swap within 4 business hours"
    ]
  },
  {
    name: "Consultation & Implementation Only",
    terms: [
      "Payment: 100% on delivery",
      "Validity of Quotation: 30 Calendar Days",
      "Work includes setup, staff validation, and 1 year basic patch upgrades",
      "Assigned engineer leads dynamic database connections layout validation"
    ]
  }
];

export default function ChequeQuotationModule() {
  const [quotations, setQuotations] = useState<ChequeQuotation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuotation, setActiveQuotation] = useState<ChequeQuotation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  useEffect(() => {
    // Read the current supplier list
    const loadLocalSuppliers = () => {
      const cached = localStorage.getItem('prowess_suppliers_v1');
      if (cached) {
        setSuppliersList(JSON.parse(cached));
      } else {
        fetch('/api/proposals/suppliers/all')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setSuppliersList(data);
              localStorage.setItem('prowess_suppliers_v1', JSON.stringify(data));
            }
          })
          .catch(e => console.warn("Failed fetching suppliers inside Cheque Printing model", e));
      }
    };
    loadLocalSuppliers();
  }, [activeQuotation, isEditing]);

  // Invoice Mode states
  const [chequeViewMode, setChequeViewMode] = useState<'quotation' | 'invoice'>('quotation');
  const [invoiceNoOverride, setInvoiceNoOverride] = useState('');
  const [invoiceDateOverride, setInvoiceDateOverride] = useState('');
  const [customerIDOverride, setCustomerIDOverride] = useState('');
  const [customerPOOverride, setCustomerPOOverride] = useState('');
  const [paymentTermsOverride, setPaymentTermsOverride] = useState('');
  const [attnDepartmentOverride, setAttnDepartmentOverride] = useState('Finance Department');
  const [phoneNoOverride, setPhoneNoOverride] = useState('+974 4400 0000');



  // Payment Logging panel states (for active adding)
  const [logAmount, setLogAmount] = useState<string>('');
  const [logDate, setLogDate] = useState<string>('');
  const [logRef, setLogRef] = useState<string>('');
  const [logNotes, setLogNotes] = useState<string>('');
  const [showPayForm, setShowPayForm] = useState<boolean>(false);

  useEffect(() => {
    setLogDate(new Date().toISOString().substring(0, 10));
  }, []);

  // Master helper to update database records
  const updateQuotationInStateAndStorage = (updatedQ: ChequeQuotation) => {
    setQuotations(prev => {
      const next = prev.map(q => q.id === updatedQ.id ? updatedQ : q);
      localStorage.setItem('prowess_cheque_quotations_v1', JSON.stringify(next));
      return next;
    });
    setActiveQuotation(updatedQ);
  };

  // Toggle printed ledger option
  const handleTogglePrintLedger = () => {
    if (!activeQuotation) return;
    const updated = {
      ...activeQuotation,
      showLedgerOnPrint: !activeQuotation.showLedgerOnPrint,
      updatedAt: new Date().toISOString()
    };
    updateQuotationInStateAndStorage(updated);
  };

  // Add payment receipt
  const handleAddPaymentReceipt = (amount: number, date: string, ref: string, notes: string) => {
    if (!activeQuotation) return;
    const newReceipt: ChequeQuotationReceipt = {
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      date: date || new Date().toISOString().substring(0, 10),
      amount: Number(amount) || 0,
      reference: ref.trim() || 'Payment Receipt',
      notes: notes.trim()
    };

    const currentPayments = activeQuotation.payments || [];
    const updated = {
      ...activeQuotation,
      payments: [...currentPayments, newReceipt],
      updatedAt: new Date().toISOString()
    };
    updateQuotationInStateAndStorage(updated);
  };

  // Delete payment receipt
  const handleDeletePaymentReceipt = (receiptId: string) => {
    if (!activeQuotation) return;
    const currentPayments = activeQuotation.payments || [];
    const updated = {
      ...activeQuotation,
      payments: currentPayments.filter(p => p.id !== receiptId),
      updatedAt: new Date().toISOString()
    };
    updateQuotationInStateAndStorage(updated);
  };

  const handleAddNewReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(logAmount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount greater than zero.");
      return;
    }
    handleAddPaymentReceipt(amt, logDate, logRef || "Standard Receipt", logNotes);
    setLogAmount('');
    setLogRef('');
    setLogNotes('');
    setLogDate(new Date().toISOString().substring(0, 10));
    setShowPayForm(false);
  };

  // Helper calculations for active quote
  const activeTotalContract = useMemo(() => {
    if (!activeQuotation) return 0;
    return getTotals(activeQuotation.items || []);
  }, [activeQuotation]);

  const activeTotalReceived = useMemo(() => {
    if (!activeQuotation) return 0;
    const payments = activeQuotation.payments || [];
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [activeQuotation]);

  const activePendingBalance = useMemo(() => {
    return Math.max(0, activeTotalContract - activeTotalReceived);
  }, [activeTotalContract, activeTotalReceived]);

  const activeProjectStatus = useMemo(() => {
    if (activeTotalContract === 0) return 'PENDING';
    if (activeTotalReceived >= activeTotalContract) return 'FULLY PAID';
    if (activeTotalReceived > 0) return 'PARTIALLY PAID';
    return 'UNPAID / ACTIVE';
  }, [activeTotalContract, activeTotalReceived]);
  
  // Terms templates in local storage
  const [customTemplates, setCustomTemplates] = useState<{name: string, terms: string[]}[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Form input states
  const [formRefNo, setFormRefNo] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCustName, setFormCustName] = useState('');
  const [formCustCompany, setFormCustCompany] = useState('');
  const [formCustLocation, setFormCustLocation] = useState('');
  const [formCustContact, setFormCustContact] = useState('');
  
  const [formCurrency, setFormCurrency] = useState('QR');
  const [formCurrencyFull, setFormCurrencyFull] = useState('QATAR RIYAL');
  const [formSubunitFull, setFormSubunitFull] = useState('DIRHAM');
  
  const [formItems, setFormItems] = useState<ChequeQuotationItem[]>([]);
  const [formTerms, setFormTerms] = useState<string[]>([]);
  
  const [formPrepName, setFormPrepName] = useState('SHAMLAN');
  const [formPrepTitle, setFormPrepTitle] = useState('PROJECT DIRECTOR');
  const [formPrepCompany, setFormPrepCompany] = useState('ASTRA TECH');
  const [formPrepLocation, setFormPrepLocation] = useState('DOHA – QATAR');

  // Load invoice overrides when active quotation changes
  useEffect(() => {
    if (activeQuotation) {
      const ref = activeQuotation.refNo || formRefNo || 'PENDING';
      setInvoiceNoOverride(`INV-${ref.replace('AST-CQ-', '')}`);
      setInvoiceDateOverride(activeQuotation.date || formDate || new Date().toISOString().substring(0, 10));
      setCustomerIDOverride(`CUST-${ref.replace(/[^0-9]/g, '') || '912'}`);
      setCustomerPOOverride(`PO-${ref.replace(/[^0-9]/g, '') || '45021'}`);
      setPaymentTermsOverride(activeQuotation.terms?.[0] || (formTerms && formTerms[0]) || '100% on installation');
    }
  }, [activeQuotation, formRefNo, formDate, formTerms]);

  const [newTermText, setNewTermText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const displayedQuotation = useMemo(() => {
    if (!activeQuotation) return null;
    if (isEditing) {
      return {
        id: activeQuotation.id,
        refNo: formRefNo,
        date: formDate,
        customerName: formCustName,
        customerCompany: formCustCompany,
        customerLocation: formCustLocation,
        customerContact: formCustContact,
        currency: formCurrency,
        currencyFull: formCurrencyFull,
        subunitFull: formSubunitFull,
        items: formItems || [],
        terms: formTerms || [],
        preparedByName: formPrepName,
        preparedByTitle: formPrepTitle,
        preparedByCompany: formPrepCompany,
        preparedByLocation: formPrepLocation,
        payments: activeQuotation.payments || [],
        showLedgerOnPrint: activeQuotation.showLedgerOnPrint ?? false,
      };
    }
    if (activeQuotation.id === 'new_temp') {
      return {
        id: 'new_temp',
        refNo: formRefNo || 'PENDING',
        date: formDate || new Date().toISOString().substring(0, 10),
        customerName: formCustName || '',
        customerCompany: formCustCompany || '',
        customerLocation: formCustLocation || 'Doha-Qatar',
        customerContact: formCustContact || '',
        currency: formCurrency || 'QR',
        currencyFull: formCurrencyFull || 'QATAR RIYAL',
        subunitFull: formSubunitFull || 'DIRHAM',
        items: formItems || [],
        terms: formTerms || [],
        preparedByName: formPrepName || 'SHAMLAN',
        preparedByTitle: formPrepTitle || 'PROJECT DIRECTOR',
        preparedByCompany: formPrepCompany || 'ASTRA TECH',
        preparedByLocation: formPrepLocation || 'DOHA – QATAR',
        payments: [],
        showLedgerOnPrint: false,
      };
    }
    return {
      ...activeQuotation,
      items: activeQuotation.items || [],
      terms: activeQuotation.terms || [],
      payments: activeQuotation.payments || [],
      showLedgerOnPrint: activeQuotation.showLedgerOnPrint ?? false,
    };
  }, [
    activeQuotation,
    isEditing,
    formRefNo,
    formDate,
    formCustName,
    formCustCompany,
    formCustLocation,
    formCustContact,
    formCurrency,
    formCurrencyFull,
    formSubunitFull,
    formItems,
    formTerms,
    formPrepName,
    formPrepTitle,
    formPrepCompany,
    formPrepLocation,
  ]);

  // Initialize data
  useEffect(() => {
    // Load Quotations
    const cachedQuotations = localStorage.getItem('prowess_cheque_quotations_v1');
    if (cachedQuotations) {
      try {
        const decoded = JSON.parse(cachedQuotations);
        setQuotations(decoded);
        if (decoded.length > 0) {
          setActiveQuotation(decoded[0]);
        } else {
          loadDefaultQuotation();
        }
      } catch (err) {
        loadDefaultQuotation();
      }
    } else {
      loadDefaultQuotation();
    }

    // Load templates
    const cachedTemplates = localStorage.getItem('prowess_cheque_templates_v1');
    if (cachedTemplates) {
      try {
        setCustomTemplates(JSON.parse(cachedTemplates));
      } catch (err) {
        setCustomTemplates([]);
      }
    }
  }, []);

  const loadDefaultQuotation = () => {
    const defaultQuotation: ChequeQuotation = {
      id: "q_default_demo_1",
      refNo: "AT/QT-06/26-6134",
      date: "2026-06-02",
      customerName: "ALMAKKI",
      customerCompany: "TRADING AND CONTRACTING EST",
      customerLocation: "Doha-Qatar",
      customerContact: "",
      currency: "QR",
      currencyFull: "QATAR RIYAL",
      subunitFull: "DIRHAM",
      items: [
        { id: "item_1", description: "Cheque Easy Software – 1 License", unitPrice: 1500, qty: 1 },
        { id: "item_2", description: "Canon LBP 6030 Printer", unitPrice: 500, qty: 1 }
      ],
      terms: [
        "Payment: 100% on installation",
        "License Validity - 3 Year",
        "AMC – 750 QR/3 year after every 3 years",
        "Manufacture warranty for Hardware"
      ],
      preparedByName: "SHAMLAN",
      preparedByTitle: "PROJECT DIRECTOR",
      preparedByCompany: "ASTRA TECH",
      preparedByLocation: "DOHA – QATAR",
      updatedAt: new Date().toISOString(),
      payments: [
        {
          id: "rec_default_1",
          date: "2026-06-05",
          amount: 500,
          reference: "Cash Payment",
          notes: "Initial Token Advance"
        },
        {
          id: "rec_default_2",
          date: "2026-06-10",
          amount: 1000,
          reference: "QNB Cheque #304215",
          notes: "Standard Delivery Milestone Payment"
        }
      ],
      showLedgerOnPrint: true,
    };

    setQuotations([defaultQuotation]);
    setActiveQuotation(defaultQuotation);
    localStorage.setItem('prowess_cheque_quotations_v1', JSON.stringify([defaultQuotation]));
  };

  // Switch active quotation
  const handleSelectQuotation = (q: ChequeQuotation) => {
    setActiveQuotation(q);
    setIsEditing(false);
  };

  // Enter edit mode
  const handleStartEdit = () => {
    if (!activeQuotation) return;
    setFormRefNo(activeQuotation.refNo);
    setFormDate(activeQuotation.date);
    setFormCustName(activeQuotation.customerName);
    setFormCustCompany(activeQuotation.customerCompany);
    setFormCustLocation(activeQuotation.customerLocation);
    setFormCustContact(activeQuotation.customerContact || '');
    setFormCurrency(activeQuotation.currency);
    setFormCurrencyFull(activeQuotation.currencyFull);
    setFormSubunitFull(activeQuotation.subunitFull);
    setFormItems([...activeQuotation.items]);
    setFormTerms([...activeQuotation.terms]);
    setFormPrepName(activeQuotation.preparedByName);
    setFormPrepTitle(activeQuotation.preparedByTitle);
    setFormPrepCompany(activeQuotation.preparedByCompany);
    setFormPrepLocation(activeQuotation.preparedByLocation);
    
    setIsEditing(true);
  };

  // Generate dynamic Ref Number
  const handleGenerateRefNo = () => {
    const d = formDate ? new Date(formDate) : new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).substring(2);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormRefNo(`AT/QT-${mm}/${yy}-${rand}`);
  };

  // Launch fresh new quotation
  const handleAddNewQuotation = () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).substring(2);
    const rand = Math.floor(1000 + Math.random() * 9000);
    
    setFormRefNo(`AT/QT-${mm}/${yy}-${rand}`);
    setFormDate(todayStr);
    setFormCustName('');
    setFormCustCompany('');
    setFormCustLocation('Doha-Qatar');
    setFormCustContact('');
    setFormCurrency('QR');
    setFormCurrencyFull('QATAR RIYAL');
    setFormSubunitFull('DIRHAM');
    setFormItems([
      { id: "item_init", description: "Cheque Easy Software – 1 License", unitPrice: 1500, qty: 1 }
    ]);
    setFormTerms([
      "Payment: 100% on installation",
      "License Validity - 3 Year",
      "AMC – 750 QR/3 year after every 3 years",
      "Manufacture warranty for Hardware"
    ]);
    setFormPrepName('SHAMLAN');
    setFormPrepTitle('PROJECT DIRECTOR');
    setFormPrepCompany('ASTRA TECH');
    setFormPrepLocation('DOHA – QATAR');
    
    setIsEditing(true);
    // Temp key to identify new
    setActiveQuotation({ id: 'new_temp' } as any);
  };

  // Item management inside edit form
  const handleAddItemRow = () => {
    const newRow: ChequeQuotationItem = {
      id: 'row_' + Math.random().toString(36).substring(2, 9),
      description: '',
      unitPrice: 0,
      qty: 1
    };
    setFormItems([...formItems, newRow]);
  };

  const handleUpdateItemRow = (id: string, field: keyof ChequeQuotationItem, value: any) => {
    setFormItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleDeleteItemRow = (id: string) => {
    if (formItems.length <= 1) {
      alert("Quotation must have at least one product line item.");
      return;
    }
    setFormItems(prev => prev.filter(i => i.id !== id));
  };

  // Terms and details inside edit form
  const handleAddTerm = () => {
    if (!newTermText.trim()) return;
    setFormTerms([...formTerms, newTermText.trim()]);
    setNewTermText('');
  };

  const handleUpdateTermInline = (index: number, val: string) => {
    setFormTerms(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveTerm = (index: number) => {
    setFormTerms(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveTerm = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formTerms.length - 1) return;
    
    setFormTerms(prev => {
      const updated = [...prev];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      const tmp = updated[index];
      updated[index] = updated[targetIdx];
      updated[targetIdx] = tmp;
      return updated;
    });
  };

  // Load preset templates
  const handleLoadTemplate = (termsList: string[]) => {
    if (window.confirm("Do you want to override current terms with this template?")) {
      setFormTerms([...termsList]);
    }
  };

  // Save new client/terms template
  const handleSaveTermsTemplate = () => {
    if (!newTemplateName.trim()) {
      alert("Please provide a template name");
      return;
    }
    const n = { name: newTemplateName.trim(), terms: [...formTerms] };
    const list = [n, ...customTemplates];
    setCustomTemplates(list);
    localStorage.setItem('prowess_cheque_templates_v1', JSON.stringify(list));
    setNewTemplateName('');
    alert("Template saved successfully!");
  };

  const handleDeleteTemplate = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this custom template?")) {
      const list = customTemplates.filter((_, i) => i !== idx);
      setCustomTemplates(list);
      localStorage.setItem('prowess_cheque_templates_v1', JSON.stringify(list));
    }
  };

  // Save quotation to persistence
  const handleSaveQuotation = () => {
    if (!formCustName.trim()) {
      alert("Please enter customer name");
      return;
    }
    if (!formRefNo.trim()) {
      alert("A unique Quotation Reference Number is required");
      return;
    }

    const isNew = !activeQuotation || activeQuotation.id === 'new_temp';
    const targetId = isNew ? 'q_' + Math.random().toString(36).substring(2, 10) : activeQuotation!.id;

    const saved: ChequeQuotation = {
      id: targetId,
      refNo: formRefNo.trim(),
      date: formDate || new Date().toISOString().substring(0, 10),
      customerName: formCustName.toUpperCase().trim(),
      customerCompany: formCustCompany.toUpperCase().trim(),
      customerLocation: formCustLocation.trim(),
      customerContact: formCustContact.trim(),
      currency: formCurrency.toUpperCase().trim(),
      currencyFull: formCurrencyFull.trim(),
      subunitFull: formSubunitFull.trim(),
      items: formItems.map(it => ({
        ...it,
        description: it.description.trim(),
        unitPrice: Number(it.unitPrice) || 0,
        qty: Number(it.qty) || 1
      })),
      terms: formTerms,
      preparedByName: formPrepName.toUpperCase().trim(),
      preparedByTitle: formPrepTitle.toUpperCase().trim(),
      preparedByCompany: formPrepCompany.toUpperCase().trim(),
      preparedByLocation: formPrepLocation.toUpperCase().trim(),
      updatedAt: new Date().toISOString(),
      payments: isNew ? [] : (activeQuotation?.payments || []),
      showLedgerOnPrint: isNew ? false : (activeQuotation?.showLedgerOnPrint ?? false),
    };

    setQuotations(prev => {
      let next;
      if (isNew) {
        next = [saved, ...prev];
      } else {
        next = prev.map(q => q.id === targetId ? saved : q);
      }
      localStorage.setItem('prowess_cheque_quotations_v1', JSON.stringify(next));
      return next;
    });

    setActiveQuotation(saved);
    setIsEditing(false);
  };

  const handleDeleteQuotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this Cheque Printing Quotation?")) {
      const filtered = quotations.filter(q => q.id !== id);
      setQuotations(filtered);
      localStorage.setItem('prowess_cheque_quotations_v1', JSON.stringify(filtered));
      
      if (activeQuotation?.id === id) {
        if (filtered.length > 0) {
          setActiveQuotation(filtered[0]);
        } else {
          setActiveQuotation(null);
        }
      }
    }
  };

  // Print command
  const handleTriggerPrint = () => {
    window.print();
  };

  const filteredQuotations = quotations.filter(q => 
    q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.refNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Styles injected to hook window.print for standard A4 formatting */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          nav, header, footer, .no-print, .btn, .editor-control-panel {
            display: none !important;
          }
          .print-section {
            display: block !important;
            position: relative !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 18mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-section:last-child {
            page-break-after: avoid !important;
            break-after: auto !important;
          }
          .watermark-container {
            display: flex !important;
            opacity: 0.05 !important;
          }
        }
      `}</style>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Directory & Controls Interface */}
        <div className="xl:col-span-5 space-y-6 no-print editor-control-panel">
          
          {/* Active Quotation Stats Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 block">
              Quotation Management Console
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search bar */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search quotations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-350 rounded-xl text-xs bg-slate-50 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-150 focus:border-blue-500"
                />
              </div>

              {/* Add New Button */}
              <button
                onClick={handleAddNewQuotation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                New Quotation
              </button>
            </div>

            {/* List entries */}
            <div className="mt-4 max-h-[170px] overflow-y-auto space-y-2 border-t border-slate-100 pt-3">
              {filteredQuotations.length > 0 ? (
                filteredQuotations.map((q) => {
                  const isActive = activeQuotation && activeQuotation.id === q.id;
                  const total = getTotals(q.items);
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleSelectQuotation(q)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-center ${
                        isActive 
                        ? 'bg-blue-50 border-blue-300 shadow-3xs' 
                        : 'bg-white border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold border border-slate-200 leading-none">
                            {q.refNo}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {q.date}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {q.customerName || "No Client Name"}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {q.customerCompany || "No Company Specified"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0 pl-1">
                        <strong className="text-xs font-mono font-extrabold text-blue-700">
                          {total.toLocaleString()} {q.currency}
                        </strong>
                        <button
                          onClick={(e) => handleDeleteQuotation(q.id, e)}
                          className="mt-1.5 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Quotation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-400 py-6">No matching records found.</p>
              )}
            </div>
          </div>

          {/* Form Editor Section */}
          {isEditing && (
            <div className="bg-slate-50 border-2 border-blue-400 rounded-2xl p-5 shadow-xs space-y-4 max-h-[700px] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {activeQuotation?.id === 'new_temp' ? 'Create New Quotation' : 'Edit Quotation Details'}
                  </h3>
                  <p className="text-[10px] text-slate-500">Live preview adjusts instantly on the right sheet</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if(activeQuotation?.id === 'new_temp') {
                        if (quotations.length > 0) setActiveQuotation(quotations[0]);
                      }
                      setIsEditing(false);
                    }}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuotation}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-lg shadow-3xs flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save & Apply
                  </button>
                </div>
              </div>

              {/* Quotation Ref & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 border border-slate-200 rounded-xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Reference Number</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={formRefNo}
                      onChange={(e) => setFormRefNo(e.target.value)}
                      placeholder="e.g. AT/QT-06/26-6134"
                      className="flex-grow px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                    <button
                      onClick={handleGenerateRefNo}
                      className="px-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[9px] font-bold rounded"
                      title="Generate dynamic reference based on date"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Quotation Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-2 bg-white p-3.5 border border-slate-200 rounded-xl">
                <h4 className="text-[11px] font-extrabold text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-blue-500" />
                  Client Recipient Details (To,)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Customer Name / Lead ID</label>
                    <input
                      type="text"
                      placeholder="e.g. ALMAKKI"
                      value={formCustName}
                      onChange={(e) => setFormCustName(e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Company Name / EST</label>
                    <input
                      type="text"
                      placeholder="e.g. TRADING AND CONTRACTING EST"
                      value={formCustCompany}
                      onChange={(e) => setFormCustCompany(e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Location / Landmark</label>
                    <input
                      type="text"
                      placeholder="e.g. Doha-Qatar"
                      value={formCustLocation}
                      onChange={(e) => setFormCustLocation(e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Customer Contact / Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="Tel: +974 4455XXXX"
                      value={formCustContact}
                      onChange={(e) => setFormCustContact(e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Currency Configuration */}
              <div className="space-y-2 bg-white p-3.5 border border-slate-200 rounded-xl">
                <h4 className="text-[11px] font-extrabold text-slate-700 border-b border-slate-100 pb-1">
                  Currency Setup
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Symbol</label>
                    <input
                      type="text"
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value)}
                      placeholder="e.g. QR"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Full Currency Name</label>
                    <input
                      type="text"
                      value={formCurrencyFull}
                      onChange={(e) => setFormCurrencyFull(e.target.value)}
                      placeholder="e.g. QATAR RIYAL"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Fraction Name</label>
                    <input
                      type="text"
                      value={formSubunitFull}
                      onChange={(e) => setFormSubunitFull(e.target.value)}
                      placeholder="e.g. DIRHAM"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Product Row Items */}
              <div className="space-y-2 bg-white p-3.5 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <h4 className="text-[11px] font-extrabold text-slate-700">
                    Product & Hardware Lines (Itemized)
                  </h4>
                  <button
                    onClick={handleAddItemRow}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded text-[9px] font-bold"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-3 mt-2">
                  {formItems.map((item, index) => (
                    <div key={item.id} className="p-2.5 border border-slate-150 rounded-lg bg-slate-50 space-y-2 relative">
                      <div className="absolute top-1 right-1">
                        <button
                          onClick={() => handleDeleteItemRow(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[9px] font-mono text-slate-400">SI #{index + 1} Description</label>
                        </div>
                        
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItemRow(item.id, 'description', e.target.value)}
                          placeholder="e.g. Cheque Easy Software – 1 License"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          list="desc-suggestions"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[8.5px] font-bold text-slate-500">Unit Price ({formCurrency})</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItemRow(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8.5px] font-bold text-slate-500">Qty</label>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleUpdateItemRow(item.id, 'qty', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* SUPPLIER SCM LINKING */}
                      <div className="border-t border-dashed border-slate-200 mt-2 pt-2 text-[10.5px] space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="checkbox" 
                            id={`sourced-chk-${item.id}`}
                            checked={!!item.supplierId}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const defaultSup = suppliersList[0];
                                handleUpdateItemRow(item.id, 'supplierId', defaultSup?.id || 'default_sup');
                                handleUpdateItemRow(item.id, 'supplierName', defaultSup?.name || 'Partner Supplier');
                                handleUpdateItemRow(item.id, 'purchaseCost', Math.round(item.unitPrice * 0.7)); // default purchase cost: 70% of unit price
                              } else {
                                handleUpdateItemRow(item.id, 'supplierId', '');
                                handleUpdateItemRow(item.id, 'supplierName', '');
                                handleUpdateItemRow(item.id, 'purchaseCost', 0);
                              }
                            }}
                            className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <label htmlFor={`sourced-chk-${item.id}`} className="font-bold text-slate-600 cursor-pointer text-[9.5px]">
                            Sourced from external Supplier (Internal only)
                          </label>
                        </div>

                        {!!item.supplierId && (
                          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-100/50 border border-slate-150 rounded-lg">
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-extrabold uppercase text-slate-400 block">Sourcing Partner</label>
                              <select
                                value={item.supplierId || ''}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  const supObj = suppliersList.find(s => s.id === selectedId);
                                  handleUpdateItemRow(item.id, 'supplierId', selectedId);
                                  handleUpdateItemRow(item.id, 'supplierName', supObj ? supObj.name : 'Partner Supplier');
                                }}
                                className="w-full p-1 border border-slate-300 rounded bg-white text-[10.5px]"
                              >
                                {suppliersList.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                                {suppliersList.length === 0 && (
                                  <option value="default_sup">Doha Tech Hub Systems</option>
                                )}
                              </select>
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-extrabold uppercase text-slate-400 block">Purchase Cost ({formCurrency})</label>
                              <input
                                type="number"
                                value={item.purchaseCost || 0}
                                onChange={(e) => handleUpdateItemRow(item.id, 'purchaseCost', parseFloat(e.target.value) || 0)}
                                className="w-full p-1 border border-slate-300 rounded text-[10.5px] font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <datalist id="desc-suggestions">
                  {DESCRIPTION_SUGGESTIONS.map((st, i) => <option key={i} value={st} />)}
                </datalist>
              </div>

              {/* Terms and Conditions Section */}
              <div className="space-y-2 bg-white p-3.5 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <h4 className="text-[11px] font-extrabold text-slate-700">
                    Terms & Conditions List
                  </h4>
                  <span className="text-[8.5px] text-slate-400">Arrange clauses dynamically</span>
                </div>

                {/* Pre-made template selector */}
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg mb-2">
                  <label className="text-[8.5px] font-extrabold text-slate-500 block mb-1">Load Preset SLA Template</label>
                  <div className="flex flex-wrap gap-1">
                    {DEFAULT_TERMS_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLoadTemplate(tmpl.terms)}
                        className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 text-[8.5px] font-sans font-bold rounded"
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reordering list of current terms */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {formTerms.map((term, idx) => (
                    <div key={idx} className="flex gap-1 items-center bg-slate-50 p-1.5 rounded border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 w-4 shrink-0 font-mono text-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={term}
                        onChange={(e) => handleUpdateTermInline(idx, e.target.value)}
                        className="flex-grow px-2 py-0.5 border border-slate-205 rounded text-[11px] bg-white text-slate-700"
                      />
                      
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          onClick={() => handleMoveTerm(idx, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 bg-white border border-slate-200 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <ArrowUp className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={() => handleMoveTerm(idx, 'down')}
                          disabled={idx === formTerms.length - 1}
                          className="p-0.5 bg-white border border-slate-200 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <ArrowDown className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveTerm(idx)}
                          className="p-0.5 bg-white border border-slate-200 rounded text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Addition form for single terms */}
                <div className="pt-2 flex gap-1.5 border-t border-slate-100">
                  <input
                    type="text"
                    value={newTermText}
                    onChange={(e) => setNewTermText(e.target.value)}
                    placeholder="Type customized terms clause..."
                    className="flex-grow px-2 py-1 border border-slate-300 rounded text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTerm()}
                  />
                  <button
                    onClick={handleAddTerm}
                    className="px-2.5 py-1 bg-slate-800 text-white text-xs font-bold rounded"
                  >
                    Add
                  </button>
                </div>

                {/* Save reusable templates custom */}
                <div className="pt-2 border-t border-slate-100 bg-slate-50/50 p-2 rounded-lg space-y-1.5 mt-2">
                  <label className="text-[8.5px] font-extrabold text-slate-500 block">Save Current Clauses as Reusable Template</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. My Premium Terms Combo"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="flex-grow px-2 py-0.5 border border-slate-300 rounded text-[10px]"
                    />
                    <button
                      onClick={handleSaveTermsTemplate}
                      className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-105 border border-blue-200 font-sans text-[9px] font-bold shrink-0"
                    >
                      Save Template
                    </button>
                  </div>

                  {/* Saved list */}
                  {customTemplates.length > 0 && (
                    <div className="space-y-1 mt-1 pb-1">
                      <span className="text-[8px] uppercase font-bold text-slate-400 block">Your Saved Templates:</span>
                      <div className="flex flex-wrap gap-1">
                        {customTemplates.map((t, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleLoadTemplate(t.terms)}
                            className="bg-white border rounded text-[8px] pl-1.5 pr-1 py-0.5 flex items-center gap-1 cursor-pointer hover:border-slate-350"
                          >
                            <span className="text-slate-600 font-bold max-w-[90px] truncate">{t.name}</span>
                            <button
                              onClick={(e) => handleDeleteTemplate(idx, e)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prepared By credentials */}
              <div className="space-y-2 bg-white p-3.5 border border-slate-200 rounded-xl">
                <h4 className="text-[11px] font-extrabold text-slate-700 border-b border-slate-100 pb-1">
                  Prepared By Sign-off Profile
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-bold text-slate-500">Officer Name</label>
                    <input
                      type="text"
                      value={formPrepName}
                      onChange={(e) => setFormPrepName(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-bold text-slate-500">Job Title</label>
                    <input
                      type="text"
                      value={formPrepTitle}
                      onChange={(e) => setFormPrepTitle(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-bold text-slate-500">Company</label>
                    <input
                      type="text"
                      value={formPrepCompany}
                      onChange={(e) => setFormPrepCompany(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-bold text-slate-500">Corporate Address</label>
                    <input
                      type="text"
                      value={formPrepLocation}
                      onChange={(e) => setFormPrepLocation(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Save apply */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveQuotation}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Save & Apply Config
                </button>
              </div>
            </div>
          )}

          {/* Quick Guide card if not editing */}
          {!isEditing && activeQuotation && (
            <div className="space-y-6">
              
              {/* Action Toolbench Card */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Action Toolbench
                </h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Select a quotation from the list above, click <strong>Modify Details</strong> to edit products, prices, terms, client information, and update dates. Use the printable layout sheet on the right to direct print or export to PDF.
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleStartEdit}
                    className="w-full px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Modify Quotation details
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleTriggerPrint}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="h-4 w-4 text-blue-400" />
                      Print Sheet
                    </button>
                    <button
                      onClick={handleTriggerPrint}
                      className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="h-4 w-4 text-slate-500" />
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Visual Payment Summary Cards (Commercial Financial Ledger) */}
              <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 space-y-4 shadow-md">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                      Commercial Financial Ledger
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Track downpayments & outstanding balances</p>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-2 py-1 rounded-md text-[9px] font-extrabold tracking-wider border font-mono ${
                    activeProjectStatus === 'FULLY PAID' 
                      ? 'bg-emerald-950/85 text-emerald-400 border-emerald-800' 
                      : activeProjectStatus === 'PARTIALLY PAID'
                      ? 'bg-blue-950/85 text-blue-400 border-blue-805'
                      : 'bg-amber-950/85 text-amber-500 border-amber-805'
                  }`}>
                    {activeProjectStatus}
                  </div>
                </div>

                {/* Bento Grid Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Contract</span>
                    <p className="text-xs font-mono font-black text-slate-100 truncate">
                      {activeTotalContract.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[9.5px] font-sans font-bold text-slate-455">{activeQuotation.currency}</span>
                    </p>
                  </div>

                  <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Received</span>
                    <p className="text-xs font-mono font-black text-emerald-400 truncate">
                      {activeTotalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[9.5px] font-sans font-bold text-slate-455">{activeQuotation.currency}</span>
                    </p>
                  </div>

                  <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Balance Due</span>
                    <p className={`text-xs font-mono font-black truncate ${activePendingBalance > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {activePendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[9.5px] font-sans font-bold text-slate-455">{activeQuotation.currency}</span>
                    </p>
                  </div>
                </div>
                
                {/* Checkbox for PDF ledger inclusion */}
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px]">
                  <input
                    type="checkbox"
                    id="toggle-pdf-ledger"
                    checked={!!activeQuotation.showLedgerOnPrint}
                    onChange={handleTogglePrintLedger}
                    className="rounded border-slate-750 text-blue-500 focus:ring-blue-500/30 font-bold bg-slate-800 cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="toggle-pdf-ledger" className="text-slate-350 font-bold text-[10.5px] cursor-pointer select-none">
                    Enable Financial Statement on A4 Sheet Layout
                  </label>
                </div>
              </div>

              {/* Interactive Receipt Logger */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    <h4 className="text-xs font-bold uppercase text-slate-800 font-mono tracking-wider">
                      Interactive Receipt Logger
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPayForm(!showPayForm)}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[9px] rounded transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {showPayForm ? 'Hide Form' : 'Log Payment'}
                  </button>
                </div>

                {/* Collapsible New Payment Form */}
                {showPayForm && (
                  <form onSubmit={handleAddNewReceiptSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 no-print">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Record New Payment Entry</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Amount ({activeQuotation.currency})</label>
                        <input
                          type="number"
                          required
                          value={logAmount}
                          onChange={(e) => setLogAmount(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500"
                          max={activePendingBalance > 0 ? activePendingBalance : undefined}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Posting Date</label>
                        <input
                          type="date"
                          required
                          value={logDate}
                          onChange={(e) => setLogDate(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Reference / Method</label>
                      <input
                        type="text"
                        required
                        value={logRef}
                        onChange={(e) => setLogRef(e.target.value)}
                        placeholder="e.g. Cheque #402123 or Cash"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                        list="pm-suggestions"
                      />
                      <datalist id="pm-suggestions">
                        <option value="Cash Payment" />
                        <option value="Bank Wire Transfer" />
                        <option value="QNB Cheque Entry" />
                        <option value="CBQ Cheque No." />
                        <option value="Doha Bank Cheque" />
                      </datalist>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Memo / Internal Notes (Optional)</label>
                      <input
                        type="text"
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        placeholder="e.g. 50% mobilization down payment"
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded text-xs"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPayForm(false);
                          setLogAmount('');
                          setLogRef('');
                          setLogNotes('');
                        }}
                        className="px-2.5 py-1 border border-slate-205 rounded bg-white text-[10px] font-semibold text-slate-655 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded shadow-3xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                        Post Receipt
                      </button>
                    </div>
                  </form>
                )}

                {/* Transactions Ledger Log */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Posting History Ledger</span>
                  
                  {(activeQuotation.payments || []).length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto">
                      {(activeQuotation.payments || []).map((pay) => (
                        <div key={pay.id} className="p-3 bg-slate-50/40 hover:bg-slate-50 flex justify-between items-center gap-2 text-slate-800">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] text-slate-400 font-semibold">{pay.date}</span>
                              <span className="text-[10px] font-bold text-slate-700 truncate">{pay.reference}</span>
                            </div>
                            {pay.notes && (
                              <p className="text-[9px] text-slate-500 italic mt-0.5 truncate">{pay.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pr-1 select-none shrink-0">
                            <strong className="font-mono text-xs font-black text-slate-900">
                              +{pay.amount.toLocaleString()} <span className="text-[10px] font-sans font-medium text-slate-505">{activeQuotation.currency}</span>
                            </strong>
                            <button
                              type="button"
                              onClick={() => handleDeletePaymentReceipt(pay.id)}
                              className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Remove receipt entry"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-slate-205 rounded-xl bg-slate-50/50">
                      <Database className="h-5 w-5 text-slate-350 mx-auto mb-1.5" />
                      <p className="text-[10.5px] font-bold text-slate-705">No receipts logged yet</p>
                      <p className="text-[9px] text-slate-455 mt-0.5 leading-relaxed max-w-xs mx-auto">
                        This quotation does not have active transaction records. Toggle "Log Payment" above to post cheque or cash vouchers.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Value Proposition / Client Pitch Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-150 rounded-2xl p-4 space-y-3">
                <div className="flex gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-sans font-extrabold text-slate-800 text-[10.5px] text-indigo-950 uppercase tracking-wide">
                      Client Value Statement
                    </h5>
                    <p className="text-[9.5px] text-slate-600 leading-normal mt-1">
                      Share this direct copy block with your client to emphasize our built-in financial oversight system as a premium benefit:
                    </p>
                  </div>
                </div>
                
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText("At Astra Technologies, we include our smart Interactive Financial Oversight & Receipt Ledger directly with this quotation. This premium governance platform tracks your downpart payments, milestone deliveries, and outstanding balances in real-time, providing immediate transparency and offline cheque receipt audits to prevent account discrepancies.");
                    alert("Copied to clipboard!");
                  }}
                  className="bg-white border border-blue-100 p-3 rounded-xl relative select-all cursor-pointer hover:border-indigo-300 transition-colors group"
                  title="Click to copy copy text"
                >
                  <span className="absolute right-2 top-2 bg-indigo-50 text-[7.5px] text-indigo-700 font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Copy Text
                  </span>
                  <p className="text-[10px] text-slate-700 font-sans leading-relaxed italic pr-2">
                    "At Astra Technologies, we include our smart **Interactive Financial Oversight & Receipt Ledger** directly with this quotation. This premium governance platform tracks your downpart payments, milestone deliveries, and outstanding balances in real-time, providing immediate transparency and offline cheque receipt audits to prevent account discrepancies."
                  </p>
                </div>
              </div>

            </div>
          )}
          
          {/* Help box */}
          <div className="bg-slate-105 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-sans font-bold text-slate-800 text-xs">A4 Printing Guidelines</h5>
              <p className="text-[10px] text-slate-500 font-sans leading-relaxed mt-0.5">
                For perfect pixel fidelity matching the physical specimen, ensure "Headers and footers" are unchecked, "Margins" are set to Default, and "Background graphics" is enabled in browser printing configuration popup.
              </p>
            </div>
          </div>

        </div>

        {/* Right Side: High-Fidelity Custom Paper Sheet WYSIWYG */}
        <div className="xl:col-span-7 flex justify-center">
          
          {displayedQuotation ? (
            <div className="space-y-4 w-full">
              
              {/* Context Actions top line (visible in UI, hidden on print) */}
              <div className="no-print flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-800 hover:bg-slate-850 text-white px-4 py-3 rounded-2xl shadow-xs transition-colors mb-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] font-sans font-bold text-slate-205">
                      Active: {displayedQuotation.refNo}
                    </span>
                  </div>
                  
                  {/* View switcher tabs */}
                  <div className="flex bg-slate-700/60 p-0.5 rounded-lg border border-slate-600/40 shrink-0">
                    <button
                      type="button"
                      onClick={() => setChequeViewMode('quotation')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        chequeViewMode === 'quotation' 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                      }`}
                    >
                      Quotation
                    </button>
                    <button
                      type="button"
                      onClick={() => setChequeViewMode('invoice')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        chequeViewMode === 'invoice' 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                      }`}
                    >
                      Commercial Invoice
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleTriggerPrint}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print {chequeViewMode === 'quotation' ? 'Quotation' : 'Invoice'} (A4)
                  </button>
                </div>
              </div>

              {chequeViewMode === 'quotation' ? (
                <>
                  {/* The Actual Printed A4 Page */}
                  <div 
                    id="printable-quotation-sheet"
                    className="print-section bg-white border border-slate-300 w-full max-w-[210mm] min-h-[297mm] shadow-xl p-[15mm] relative text-black overflow-hidden flex flex-col justify-between font-sans selection:bg-yellow-105"
                    style={{ contentVisibility: 'auto' }}
                  >
                
                {/* 1. Large Pale Watermark Background Centered behind everything */}
                <div className="watermark-container absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none opacity-[0.035]">
                  <span className="font-sans font-black text-[120px] tracking-widest text-[#0b57d0] select-none rotate-[20deg] block">
                    ASTRA
                  </span>
                </div>

                {/* Main Content Body */}
                <div className="relative z-10 space-y-6">
                  
                  {/* Dynamic Header Section */}
                  <div className="border-b-2 border-slate-850 pb-5 flex justify-between items-start">
                    
                    {/* Header Left: Corporate Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {/* Astra Technologies Logo */}
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
                          <span>Tel: +974 4493 8211</span>
                          <span className="text-slate-300">•</span>
                          <span>Web: www.technoastra.com</span>
                          <span className="text-slate-300">•</span>
                          <span>Email: projects@technoastra.com</span>
                        </p>
                      </div>
                    </div>

                    {/* Header Right: Meta Info */}
                    <div className="text-right font-sans shrink-0">
                      <div className="text-xs font-extrabold text-slate-900 tracking-tight">
                        REF : {displayedQuotation.refNo}
                      </div>
                      <div className="text-[11px] text-slate-650 font-mono mt-1">
                        {displayedQuotation.date ? new Date(displayedQuotation.date).toLocaleDateString('en-GB') : "02/06/2026"}
                      </div>
                    </div>

                  </div>

                  {/* To Recipient Customer Segment */}
                  <div className="pt-2 font-sans text-xs">
                    <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">To,</p>
                    <div className="mt-1 font-bold text-[12px] text-slate-900 transition-all flex flex-col gap-0.5">
                      <span className="border-b border-slate-600 inline-block pb-0.5 max-w-max">
                        M/S – {displayedQuotation.customerName || "CUSTOMER NAME"} {displayedQuotation.customerCompany || "COMPANY / ORGANISATION"}
                      </span>
                      <span className="text-[11.5px] text-slate-850 font-semibold mt-0.5">
                        {displayedQuotation.customerLocation || "Doha-Qatar"}
                      </span>
                      {displayedQuotation.customerContact && (
                        <span className="text-[10px] text-slate-550 font-normal mt-0.5 italic">
                          Contact: {displayedQuotation.customerContact}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Centered Quotation Title with specific styling */}
                  <div className="text-center py-1">
                    <h1 className="text-sm font-extrabold tracking-widest text-slate-850 uppercase underline decoration-double decoration-slate-800 inline-block px-4 py-0.5">
                      QUOTATION
                    </h1>
                  </div>

                  {/* Itemized Table */}
                  <div className="border border-slate-800 rounded overflow-hidden">
                    <table className="w-full text-xs font-sans border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-850 font-extrabold border-b border-slate-800 text-left">
                          <th className="py-2.5 px-3 border-r border-slate-800 w-12 text-center">SI</th>
                          <th className="py-2.5 px-3 border-r border-slate-800">DESCRIPTION</th>
                          <th className="py-2.5 px-3 border-r border-slate-800 text-right w-24">U.PRICE</th>
                          <th className="py-2.5 px-3 border-r border-slate-800 text-center w-14">QTY</th>
                          <th className="py-2.5 px-3 text-right w-28">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedQuotation.items.map((it, idx) => (
                           <tr key={it.id} className="border-b border-slate-300 text-slate-900 hover:bg-slate-50/55">
                             <td className="py-2 px-3 border-r border-slate-800 text-center font-mono">{idx + 1}</td>
                             <td className="py-2 px-3 border-r border-slate-800 font-bold max-w-md break-words">{it.description}</td>
                             <td className="py-2 px-3 border-r border-slate-800 text-right font-mono font-bold">{(it.unitPrice).toFixed(2)}</td>
                             <td className="py-2 px-3 border-r border-slate-800 text-center font-mono">{it.qty}</td>
                             <td className="py-2 px-3 text-right font-mono font-extrabold">
                               {(it.unitPrice * it.qty).toFixed(2)} {displayedQuotation.currency}
                             </td>
                           </tr>
                        ))}

                        {/* Blank pacing rows to make page look standard size */}
                        {displayedQuotation.items.length < 5 && 
                          Array.from({ length: 5 - displayedQuotation.items.length }).map((_, idx) => (
                            <tr key={`blank_${idx}`} className="border-b border-slate-300 h-8 opacity-40">
                              <td className="border-r border-slate-800"></td>
                              <td className="border-r border-slate-800"></td>
                              <td className="border-r border-slate-800"></td>
                              <td className="border-r border-slate-800"></td>
                              <td></td>
                            </tr>
                          ))
                        }

                        {/* Grand Total Row */}
                        <tr className="bg-slate-50/30 text-slate-900 font-extrabold border-t border-slate-800">
                          <td colSpan={2} className="py-2.5 px-3 border-r border-slate-800 text-center uppercase tracking-wider">
                            AMOUNT
                          </td>
                          <td className="border-r border-slate-800"></td>
                          <td className="border-r border-slate-800"></td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#0b57d0] text-sm">
                            {(getTotals(displayedQuotation.items)).toFixed(2)} {displayedQuotation.currency}
                          </td>
                        </tr>

                        {/* Grand Total in Words Row */}
                        <tr className="bg-white text-slate-900 font-extrabold">
                          <td colSpan={5} className="py-2.5 px-3 border-t border-slate-800 text-left uppercase text-[9.5px] leading-relaxed border-b border-slate-800">
                            <span className="underline decoration-[#0b57d0] decoration-2">AMOUNT :</span>{' '}
                            {amountToWords(getTotals(displayedQuotation.items), displayedQuotation.currencyFull, displayedQuotation.subunitFull)}
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>

                  {/* Terms & Conditions Segment */}
                  {displayedQuotation.terms.length > 0 && (
                    <div className="pt-2 font-sans space-y-1">
                      <h4 className="text-[11px] font-extrabold text-slate-850 uppercase tracking-widest">
                        TERMS & CONDITION
                      </h4>
                      <ol className="list-decimal pl-4.5 space-y-1 text-slate-900 text-xs font-bold leading-normal">
                        {displayedQuotation.terms.map((term, i) => (
                          <li key={i} className="pl-1">
                            {term}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Financial Statement & Payment Ledger Section (Visually embedded if showLedgerOnPrint is enabled) */}
                  {displayedQuotation.showLedgerOnPrint && (
                    <div className="pt-4 mt-2 font-sans space-y-2 border-t border-dashed border-slate-300">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                          🗃️ STATEMENT OF ACCOUNTS & PAYMENTS RECORD
                        </h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 border border-slate-400 font-mono tracking-tight text-slate-700 bg-slate-50 uppercase rounded">
                          STATUS: {activeProjectStatus}
                        </span>
                      </div>

                      <div className="border border-slate-800 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b border-slate-800 font-extrabold text-slate-900">
                            <tr>
                              <th className="py-1 px-3 border-r border-slate-800 text-center font-bold w-12 text-[10px]">#</th>
                              <th className="py-1 px-3 border-r border-slate-800 text-[10px]">POSTING DATE</th>
                              <th className="py-1 px-3 border-r border-slate-800 text-[10px]">TRANSACTION / PAYMENT REFERENCE</th>
                              <th className="py-1 px-3 text-right text-[10px]">CREDIT AMOUNT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300 font-bold">
                            {/* Contract Value Statement Base */}
                            <tr className="bg-slate-50/10 text-slate-900 border-b border-slate-400">
                              <td className="py-1 px-3 border-r border-slate-800 text-center font-mono font-semibold">0</td>
                              <td className="py-1 px-3 border-r border-slate-800 font-mono text-slate-500">{displayedQuotation.date}</td>
                              <td className="py-1 px-3 border-r border-slate-800 text-slate-600 font-semibold uppercase">Total Quotation Value Signed</td>
                              <td className="py-1 px-3 text-right font-mono font-black text-slate-700">
                                {activeTotalContract.toFixed(2)} {displayedQuotation.currency}
                              </td>
                            </tr>

                            {/* List of payments */}
                            {(displayedQuotation.payments || []).length > 0 ? (
                              (displayedQuotation.payments || []).map((pay, pIdx) => (
                                <tr key={pay.id} className="text-slate-800">
                                  <td className="py-0.5 px-3 border-r border-slate-800 text-center font-mono text-slate-500">{pIdx + 1}</td>
                                  <td className="py-0.5 px-3 border-r border-slate-800 font-mono">{pay.date}</td>
                                  <td className="py-0.5 px-3 border-r border-slate-800 font-semibold uppercase">
                                    {pay.reference} {pay.notes ? `(${pay.notes})` : ''}
                                  </td>
                                  <td className="py-0.5 px-3 text-right font-mono text-emerald-700">
                                    - {pay.amount.toFixed(2)} {displayedQuotation.currency}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-2 px-3 text-center text-slate-400 italic">
                                  No receipts registered. Contract net balances remain outstanding.
                                </td>
                              </tr>
                            )}

                            {/* Calculation Ledgers */}
                            <tr className="bg-slate-50/10 text-slate-900 font-extrabold border-t border-slate-800 text-[10px]">
                              <td colSpan={3} className="py-1.5 px-3 border-r border-slate-800 text-right uppercase tracking-wider">
                                Total Cash & Cheque Payments Deposited:
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-black text-emerald-700">
                                {activeTotalReceived.toFixed(2)} {displayedQuotation.currency}
                              </td>
                            </tr>
                            
                            <tr className="bg-[#f0f4f9] text-slate-900 font-bold border-t border-slate-800 text-[11px]">
                              <td colSpan={3} className="py-2 px-3 border-r border-slate-800 text-right uppercase tracking-widest font-black text-[#0b57d0]">
                                Outstanding Net Balance Payable:
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-black text-[#0b57d0] text-xs">
                                {activePendingBalance.toFixed(2)} {displayedQuotation.currency}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>

                {/* Prepared By Footer sign off section */}
                <div className="pt-8 border-t border-slate-100 mt-auto flex justify-between items-end">
                  
                  {/* Left Signature Segment */}
                  <div className="space-y-4 font-sans text-xs">
                    <p className="font-extrabold text-slate-800 border-b border-slate-600 inline-block pb-0.5">
                      Prepared By
                    </p>
                    <div className="space-y-0.5 font-bold uppercase text-[10.5px] text-slate-900 tracking-tight">
                      <p className="text-[11.5px] font-extrabold text-slate-950">{displayedQuotation.preparedByName || "SHAMLAN"}</p>
                      <p className="text-slate-700">{displayedQuotation.preparedByTitle || "PROJECT DIRECTOR"}</p>
                      <p className="text-slate-500">{displayedQuotation.preparedByCompany || "ASTRA TECH"}</p>
                      <p className="text-slate-400 font-mono italic text-[9.5px] pt-1.5">{displayedQuotation.preparedByLocation || "DOHA – QATAR"}</p>
                    </div>
                  </div>

                  {/* Right Signature Line for Stamp / Reception signoff */}
                  <div className="text-center w-40 space-y-12">
                    <div className="h-0 border-b border-slate-400 border-dashed"></div>
                    <div className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Client Seal & Sign
                    </div>
                  </div>

                </div>

              </div>

              {/* Standalone Statement of Accounts Page */}
              {displayedQuotation.showLedgerOnPrint && (
                <div 
                  id="printable-ledger-sheet"
                  className="print-section bg-white border border-slate-300 w-full max-w-[210mm] min-h-[297mm] shadow-xl p-[15mm] mt-4 relative text-black overflow-hidden flex flex-col justify-between font-sans selection:bg-yellow-105"
                  style={{ contentVisibility: 'auto' }}
                >
                  
                  {/* 1. Large Pale Watermark Background Centered behind everything */}
                  <div className="watermark-container absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none opacity-[0.035]">
                    <span className="font-sans font-black text-[120px] tracking-widest text-[#0b57d0] select-none rotate-[20deg] block">
                      STATEMENT
                    </span>
                  </div>

                  {/* Main Content Body */}
                  <div className="relative z-10 space-y-6">
                    
                    {/* Dynamic Header Section */}
                    <div className="border-b-2 border-slate-850 pb-5 flex justify-between items-start">
                      
                      {/* Header Left: Corporate Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {/* Astra Technologies Logo */}
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
                            <span>Tel: +974 4493 8211</span>
                            <span className="text-slate-300">•</span>
                            <span>Web: www.technoastra.com</span>
                            <span className="text-slate-300">•</span>
                            <span>Email: projects@technoastra.com</span>
                          </p>
                        </div>
                      </div>

                      {/* Header Right: Meta Info */}
                      <div className="text-right font-sans shrink-0">
                        <div className="text-xs font-extrabold text-slate-900 tracking-tight">
                          REF : {displayedQuotation.refNo}
                        </div>
                        <div className="text-[11px] text-slate-650 font-mono mt-1">
                          {displayedQuotation.date ? new Date(displayedQuotation.date).toLocaleDateString('en-GB') : "02/06/2026"}
                        </div>
                      </div>

                    </div>

                    {/* To Recipient Customer Segment */}
                    <div className="pt-2 font-sans text-xs">
                      <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">To,</p>
                      <div className="mt-1 font-bold text-[12px] text-slate-900 transition-all flex flex-col gap-0.5">
                        <span className="border-b border-slate-600 inline-block pb-0.5 max-w-max">
                          M/S – {displayedQuotation.customerName || "CUSTOMER NAME"} {displayedQuotation.customerCompany || "COMPANY / ORGANISATION"}
                        </span>
                        <span className="text-[11.5px] text-slate-850 font-semibold mt-0.5">
                          {displayedQuotation.customerLocation || "Doha-Qatar"}
                        </span>
                        {displayedQuotation.customerContact && (
                          <span className="text-[10px] text-slate-550 font-normal mt-0.5 italic">
                            Contact: {displayedQuotation.customerContact}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Centered Title with specific styling */}
                    <div className="text-center py-1">
                      <h1 className="text-sm font-extrabold tracking-widest text-[#0b57d0] uppercase underline decoration-double decoration-slate-800 inline-block px-4 py-0.5">
                        STATEMENT OF ACCOUNTS
                      </h1>
                    </div>

                    {/* Description message */}
                    <p className="text-xs font-bold leading-relaxed text-slate-800">
                      We hereby submit the official Commercial Financial Statement of Accounts & payment receipts record detailing the payments, contract baseline, and active values for the software integrations described in proposal <span className="font-mono text-blue-700">{displayedQuotation.refNo}</span>.
                    </p>

                    {/* Standalone Financial Ledger Segment */}
                    <div className="pt-2 font-sans space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                          🗃️ STATEMENT OF ACCOUNTS & PAYMENTS RECORD
                        </h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 border border-slate-400 font-mono tracking-tight text-slate-700 bg-slate-50 uppercase rounded">
                          STATUS: {activeProjectStatus}
                        </span>
                      </div>

                      <div className="border border-slate-800 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b border-slate-800 font-extrabold text-slate-900">
                            <tr>
                              <th className="py-2 px-3 border-r border-slate-800 text-center font-bold w-12 text-[10px]">#</th>
                              <th className="py-2 px-3 border-r border-slate-805 text-[10px]">POSTING DATE</th>
                              <th className="py-2 px-3 border-r border-slate-805 text-[10px]">TRANSACTION / PAYMENT REFERENCE</th>
                              <th className="py-2 px-3 text-right text-[10px]">CREDIT AMOUNT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300 font-bold">
                            {/* Contract Value Statement Base */}
                            <tr className="bg-slate-50/10 text-slate-900 border-b border-slate-450">
                              <td className="py-2 px-3 border-r border-slate-800 text-center font-mono font-semibold">0</td>
                              <td className="py-2 px-3 border-r border-slate-800 font-mono text-slate-500">{displayedQuotation.date}</td>
                              <td className="py-2 px-3 border-r border-slate-800 text-slate-600 font-bold uppercase">Total Quotation Value Signed</td>
                              <td className="py-2 px-3 text-right font-mono font-black text-slate-700">
                                {activeTotalContract.toFixed(2)} {displayedQuotation.currency}
                              </td>
                            </tr>

                            {/* List of payments */}
                            {(displayedQuotation.payments || []).length > 0 ? (
                              (displayedQuotation.payments || []).map((pay, pIdx) => (
                                <tr key={pay.id} className="text-slate-800">
                                  <td className="py-1.5 px-3 border-r border-slate-800 text-center font-mono text-slate-500">{pIdx + 1}</td>
                                  <td className="py-1.5 px-3 border-r border-slate-800 font-mono">{pay.date}</td>
                                  <td className="py-1.5 px-3 border-r border-slate-800 font-semibold uppercase">
                                    {pay.reference} {pay.notes ? `(${pay.notes})` : ''}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono text-emerald-700">
                                    - {pay.amount.toFixed(2)} {displayedQuotation.currency}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-4 px-3 text-center text-slate-400 italic">
                                  No receipts registered. Contract net balances remain outstanding.
                                </td>
                              </tr>
                            )}

                            {/* Calculation Ledgers */}
                            <tr className="bg-slate-50/10 text-slate-900 font-extrabold border-t border-slate-800 text-[10px]">
                              <td colSpan={3} className="py-2 px-3 border-r border-slate-800 text-right uppercase tracking-wider">
                                Total Cash & Cheque Payments Deposited:
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                                {activeTotalReceived.toFixed(2)} {displayedQuotation.currency}
                              </td>
                            </tr>
                            
                            <tr className="bg-[#f0f4f9] text-slate-900 font-bold border-t border-slate-800 text-[11px]">
                              <td colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-right uppercase tracking-widest font-black text-[#0b57d0]">
                                Outstanding Net Balance Payable:
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-[#0b57d0] text-xs">
                                {activePendingBalance.toFixed(2)} {displayedQuotation.currency}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                  {/* Statement Verification Footer sign off section */}
                  <div className="pt-8 border-t border-slate-100 mt-auto flex justify-between items-end">
                    
                    {/* Left Signature Segment */}
                    <div className="space-y-4 font-sans text-xs">
                      <p className="font-extrabold text-[#0b57d0] border-b border-blue-600 inline-block pb-0.5 uppercase tracking-wide">
                        Verified By (Finance Dept)
                      </p>
                      <div className="space-y-0.5 font-bold uppercase text-[10.5px] text-slate-900 tracking-tight">
                        <p className="text-[11.5px] font-extrabold text-slate-950">ASTRA TECH FINANCE DEPT</p>
                        <p className="text-slate-700">Accounts & Ledger Verification</p>
                        <p className="text-slate-500">ASTRA TECH</p>
                        <p className="text-slate-405 font-mono italic text-[9.5px] pt-1.5">{displayedQuotation.preparedByLocation || "DOHA – QATAR"}</p>
                      </div>
                    </div>

                    {/* Right Signature Acknowledgment */}
                    <div className="text-center w-40 space-y-12">
                      <div className="h-0 border-b border-slate-400 border-dashed"></div>
                      <div className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Customer Signature & Date
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </>
          ) : (
            <div 
              id="printable-invoice-sheet"
              className="print-section bg-white border border-slate-300 w-full max-w-[210mm] min-h-[297mm] shadow-xl p-[15mm] relative text-black overflow-hidden flex flex-col justify-between font-sans selection:bg-yellow-105"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="watermark-container absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none opacity-[0.035]">
                <span className="font-sans font-black text-[120px] tracking-widest text-[#0b57d0] select-none rotate-[20deg] block">
                  ASTRA
                </span>
              </div>

              <div className="relative z-10 space-y-4">
                {/* 1. Header Segment */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="bg-[#0b57d0] h-8 w-8 rounded flex items-center justify-center font-bold font-serif italic text-white text-base">
                        As
                      </div>
                      <div>
                        <h2 className="text-base font-serif font-extrabold text-[#0b57d0] tracking-tight leading-none text-blue-700">
                          Astra Technologies
                        </h2>
                        <p className="text-[8.5px] font-mono text-slate-550 uppercase tracking-widest mt-0.5">
                          Integrations & Software Solutions
                        </p>
                      </div>
                    </div>
                    <div className="text-[8.5px] text-slate-500 font-sans mt-2 space-y-0.5">
                      <p>P.O. Box 2434, Grand Corporate Tower, West Bay, Doha – Qatar</p>
                      <p>Tel: +974 4493 8211 • Web: www.technoastra.com • Email: projects@technoastra.com</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-sans font-black text-2xl text-slate-500 uppercase tracking-widest block">
                      INVOICE
                    </span>
                  </div>
                </div>

                {/* 2. Bill To & Invoice Info Blocks */}
                <div className="grid grid-cols-2 gap-6 pt-1">
                  <div className="border border-slate-400 rounded-xs overflow-hidden bg-white flex flex-col">
                    <div className="bg-slate-400 text-slate-900 font-bold px-3 py-1 text-[10px] font-sans uppercase">
                      Bill To:
                    </div>
                    <div className="p-2.5 text-slate-850 text-[10.5px] font-sans space-y-1.5 flex-1 flex flex-col justify-center">
                      <div className="flex gap-1.5 items-baseline">
                        <span className="font-bold text-slate-500 w-16 shrink-0">Name:</span>
                        <span className="font-black text-slate-900 leading-tight">
                          {displayedQuotation.customerCompany || displayedQuotation.customerName || "CUSTOMER NAME"}
                        </span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span className="font-bold text-slate-500 w-16 shrink-0">Attn:</span>
                        <input
                          type="text"
                          value={attnDepartmentOverride}
                          onChange={(e) => setAttnDepartmentOverride(e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 px-1 py-0.5 border border-transparent hover:border-slate-300 rounded text-slate-900 font-bold text-[10.5px] focus:outline-hidden transition-all shrink"
                        />
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span className="font-bold text-slate-500 w-16 shrink-0">Phone No:</span>
                        <input
                          type="text"
                          value={phoneNoOverride}
                          onChange={(e) => setPhoneNoOverride(e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 px-1 py-0.5 border border-transparent hover:border-slate-300 rounded text-slate-900 font-bold text-[10.5px] focus:outline-hidden transition-all shrink"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-400 rounded-xs overflow-hidden bg-white flex flex-col">
                    <div className="bg-slate-400 text-slate-900 font-bold px-3 py-1 text-[10px] font-sans uppercase">
                      Invoice Details:
                    </div>
                    <div className="p-2.5 text-slate-850 text-[10.5px] font-sans space-y-1.5 flex-1 flex flex-col justify-center">
                      <div className="flex gap-1.5 items-center">
                        <span className="font-bold text-slate-500 w-24 shrink-0">Invoice Number:</span>
                        <input
                          type="text"
                          value={invoiceNoOverride}
                          onChange={(e) => setInvoiceNoOverride(e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 px-1 py-0.5 border border-transparent hover:border-slate-300 rounded text-slate-900 font-bold text-[10.5px] focus:outline-hidden transition-all shrink"
                        />
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span className="font-bold text-slate-500 w-24 shrink-0">Invoice Date:</span>
                        <input
                          type="text"
                          value={invoiceDateOverride}
                          onChange={(e) => setInvoiceDateOverride(e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 px-1 py-0.5 border border-transparent hover:border-slate-300 rounded text-slate-900 font-bold text-[10.5px] focus:outline-hidden transition-all shrink"
                        />
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span className="font-bold text-slate-500 w-24 shrink-0">Page:</span>
                        <span className="font-black text-slate-900">1</span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span className="font-bold text-slate-500 w-24 shrink-0">Contact:</span>
                        <span className="font-black text-slate-900 text-[10.5px]">projects@technoastra.com</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Customer Meta Info Segment (ID, PO, Terms) */}
                <div className="grid grid-cols-3 border border-slate-400 overflow-hidden text-center text-[10px] font-sans mt-2">
                  <div className="border-r border-slate-400 flex flex-col">
                    <div className="bg-slate-400 text-slate-950 font-bold py-1 border-b border-slate-400 uppercase tracking-wide">
                      Customer ID
                    </div>
                    <input
                      type="text"
                      value={customerIDOverride}
                      onChange={(e) => setCustomerIDOverride(e.target.value)}
                      className="text-center w-full py-1 bg-transparent border-0 font-bold text-slate-900 focus:ring-0 focus:outline-hidden text-[10.5px]"
                    />
                  </div>
                  <div className="border-r border-slate-400 flex flex-col">
                    <div className="bg-slate-400 text-slate-950 font-bold py-1 border-b border-slate-400 uppercase tracking-wide">
                      Customer PO
                    </div>
                    <input
                      type="text"
                      value={customerPOOverride}
                      onChange={(e) => setCustomerPOOverride(e.target.value)}
                      className="text-center w-full py-1 bg-transparent border-0 font-bold text-slate-900 focus:ring-0 focus:outline-hidden text-[10.5px]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="bg-slate-400 text-slate-950 font-bold py-1 border-b border-slate-400 uppercase tracking-wide">
                      Payment Terms
                    </div>
                    <input
                      type="text"
                      value={paymentTermsOverride}
                      onChange={(e) => setPaymentTermsOverride(e.target.value)}
                      className="text-center w-full py-1 bg-transparent border-0 font-bold text-slate-909 focus:ring-0 focus:outline-hidden text-[10.5px]"
                    />
                  </div>
                </div>

                {/* 4. Products & Services Table */}
                <div className="border border-slate-400 rounded-xs overflow-hidden mt-2">
                  <table className="w-full text-left text-[11px] font-sans border-collapse">
                    <thead>
                      <tr className="bg-slate-400 text-slate-950 font-bold text-center border-b border-slate-400 uppercase">
                        <th className="py-2 px-2 border-r border-slate-400 text-center w-12 text-[10px]">SL</th>
                        <th className="py-2.5 px-3 border-r border-slate-400 text-left text-[10px]">Description</th>
                        <th className="py-2 px-2 border-r border-slate-400 text-center w-20 text-[10px]">Quantity</th>
                        <th className="py-2.5 px-3 border-r border-slate-400 text-right w-24 text-[10px]">Unit Price</th>
                        <th className="py-2.5 px-3 text-right w-28 text-[10px]">Amount QAR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {displayedQuotation.items.map((it, idx) => (
                        <tr key={it.id} className="text-slate-900 font-bold hover:bg-slate-50/50">
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-left text-[10.5px]">
                            {it.description}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono">
                            {it.qty}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right font-mono">
                            {(it.unitPrice).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {(it.unitPrice * it.qty).toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      {/* Filler rows */}
                      {displayedQuotation.items.length < 8 && 
                        Array.from({ length: 8 - displayedQuotation.items.length }).map((_, idx) => (
                          <tr key={`invoice-filler-${idx}`} className="h-8">
                            <td className="py-2 border-r border-slate-200"></td>
                            <td className="py-2 border-r border-slate-200"></td>
                            <td className="py-2 border-r border-slate-200"></td>
                            <td className="py-2 border-r border-slate-200"></td>
                            <td className="py-2"></td>
                          </tr>
                        ))}
                        
                      <tr className="bg-slate-50 font-bold border-t border-slate-400">
                        <td colSpan={4} className="py-2 px-3 border-r border-slate-400 text-right uppercase tracking-wider text-[9.5px]">
                          Grand Total:
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-800 text-[11px]">
                          {(getTotals(displayedQuotation.items)).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Payments & Accounts Info */}
                <div className="grid grid-cols-12 gap-6 mt-3 pt-1">
                  <div className="col-span-8 text-[10px] space-y-1 text-slate-850">
                    <p className="font-extrabold text-slate-950 uppercase tracking-wide text-[10.5px]">
                      Payment can be made by bank
                    </p>
                    <div className="space-y-0.5 text-slate-900 font-bold text-[10.5px]">
                      <p>Payable to: <span className="font-extrabold text-[#0b57d0]">Doha Bank</span></p>
                      <p className="leading-snug">Account Holder Name: <span className="text-slate-950 uppercase select-all">ASTRA TRADING AND CONTRACTING AND SERVICES</span></p>
                      <p>Branch: <span className="text-slate-950 font-semibold">Main Branch</span></p>
                      <p>Account Number: <span className="text-slate-950 font-mono select-all">225-377033-001-0010-000</span></p>
                      <p>Swift Code: <span className="text-slate-950 font-mono select-all">DOHBQAQA</span></p>
                      <p>IBAN: <span className="text-blue-600 font-mono tracking-tight select-all">QA35 DOHB 0225 0377 0330 0100 1000 0</span></p>
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col justify-end text-right">
                    <div className="border border-slate-400 rounded-xs overflow-hidden">
                      <div className="bg-slate-400 text-slate-950 font-bold px-3 py-1 text-[9.5px] uppercase font-sans tracking-wide text-center">
                        Grand Total:
                      </div>
                      <div className="p-2.5 bg-white text-right font-mono text-sm font-black text-blue-600 tracking-tight">
                        {(getTotals(displayedQuotation.items)).toFixed(2)} QAR
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Signatures stamp segment */}
              <div className="pt-10 mt-auto flex justify-between items-end text-slate-800 text-[10px] font-sans">
                <div className="text-center w-40 space-y-1.5">
                  <div className="h-0 border-b border-slate-600"></div>
                  <p className="font-sans font-black uppercase text-slate-900 tracking-wide text-[10px]">
                    Approved By
                  </p>
                </div>
                <div className="text-center w-40 space-y-1.5">
                  <div className="h-0 border-b border-slate-600"></div>
                  <p className="font-sans font-black uppercase text-slate-900 tracking-wide text-[10px]">
                    Received By
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200 border-dashed rounded-2xl max-w-sm mt-8">
          <Landmark className="h-10 w-10 text-slate-450 mx-auto mb-3" />
          <h4 className="text-slate-800 font-sans font-bold text-sm">No Active Quotation Selection</h4>
          <p className="text-xs text-slate-500 mt-1">Please select an existing quotation on the left or create a new custom configuration.</p>
        </div>
      )}

        </div>

      </div>

    </div>
  );
}
