'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Filter,
  Plus,
  Trash2,
  FileDown,
  Edit2,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ArrowUpDown,
  X,
  Upload,
  QrCode,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  type: string;
  purpose: string;
  party: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionBy: string;
  approvedBy: string | null;
  notes: string | null;
  attachments: string; // JSON string
  referenceNumber: string | null;
  utr: string | null;
  paymentLink: string | null;
  upiId: string | null;
  bankDetails: string | null;
}

export function LedgerTable({
  globalSearch,
  openAddDrawer,
  setOpenAddDrawer
}: {
  globalSearch: string;
  openAddDrawer: boolean;
  setOpenAddDrawer: (open: boolean) => void;
}) {
  const { role, refreshTrigger, refreshData, triggerNotification } = useApp();
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sorting State
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter Panel Visibility
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');

  // Active transaction drawer states
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Saved Filters
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: Record<string, string> }[]>([]);
  const [saveFilterName, setSaveFilterName] = useState('');

  // UPI QR Code preview state
  const [showQrPreview, setShowQrPreview] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form Fields State
  const [formType, setFormType] = useState('Expense');
  const [formPurpose, setFormPurpose] = useState('Campus Session');
  const [formParty, setFormParty] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formStatus, setFormStatus] = useState('Pending');
  const [formPaymentMethod, setFormPaymentMethod] = useState('UPI');
  const [formTransactionBy, setFormTransactionBy] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formUtr, setFormUtr] = useState('');
  const [formPaymentLink, setFormPaymentLink] = useState('');
  const [formUpiId, setFormUpiId] = useState('');
  const [formBankDetails, setFormBankDetails] = useState('');
  
  // Attachments state
  const [formAttachments, setFormAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        search: globalSearch,
        type: filterType,
        status: filterStatus,
        purpose: filterPurpose,
        paymentMethod: filterPaymentMethod,
        party: filterParty,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
        amountMin: filterAmountMin,
        amountMax: filterAmountMax
      });

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortBy,
    sortOrder,
    globalSearch,
    filterType,
    filterStatus,
    filterPurpose,
    filterPaymentMethod,
    filterParty,
    filterDateFrom,
    filterDateTo,
    filterAmountMin,
    filterAmountMax
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 0);
    // Load saved filters
    const saved = localStorage.getItem('cyberx_saved_filters');
    if (saved) {
      setTimeout(() => setSavedFilters(JSON.parse(saved)), 0);
    }
    return () => clearTimeout(timer);
  }, [fetchTransactions, refreshTrigger]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(transactions.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setFilterType('');
    setFilterStatus('');
    setFilterPurpose('');
    setFilterPaymentMethod('');
    setFilterParty('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Save Current Filter Config
  const handleSaveFilter = () => {
    if (!saveFilterName) return;
    const newFilter = {
      name: saveFilterName,
      filters: {
        filterType,
        filterStatus,
        filterPurpose,
        filterPaymentMethod,
        filterParty,
        filterDateFrom,
        filterDateTo,
        filterAmountMin,
        filterAmountMax
      }
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('cyberx_saved_filters', JSON.stringify(updated));
    setSaveFilterName('');
    triggerNotification(`Saved custom filter configuration "${saveFilterName}"`, 'System');
  };

  const applySavedFilter = (f: { name: string; filters: Record<string, string> }) => {
    const { filters } = f;
    setFilterType(filters.filterType || '');
    setFilterStatus(filters.filterStatus || '');
    setFilterPurpose(filters.filterPurpose || '');
    setFilterPaymentMethod(filters.filterPaymentMethod || '');
    setFilterParty(filters.filterParty || '');
    setFilterDateFrom(filters.filterDateFrom || '');
    setFilterDateTo(filters.filterDateTo || '');
    setFilterAmountMin(filters.filterAmountMin || '');
    setFilterAmountMax(filters.filterAmountMax || '');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const deleteSavedFilter = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFilters.filter((f) => f.name !== name);
    setSavedFilters(updated);
    localStorage.setItem('cyberx_saved_filters', JSON.stringify(updated));
  };

  // Form submission (Add/Edit/Duplicate)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formParty || !formAmount || !formTransactionBy) {
      alert('Please fill in required fields (Party, Amount, Logged By)');
      return;
    }

    const payload = {
      type: formType,
      purpose: formPurpose,
      party: formParty,
      amount: parseFloat(formAmount),
      status: formStatus,
      paymentMethod: formPaymentMethod,
      transactionBy: formTransactionBy,
      notes: formNotes,
      referenceNumber: formReferenceNumber,
      utr: formUtr,
      paymentLink: formPaymentLink,
      upiId: formUpiId,
      bankDetails: formBankDetails,
      attachments: JSON.stringify(formAttachments),
      user: formTransactionBy,
      userRole: role
    };

    try {
      setIsSubmitting(true);
      let res;
      if (editingTx && !isDuplicate) {
        // Edit Operation
        res = await fetch(`/api/transactions/${editingTx.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create or Duplicate Operation
        res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setOpenAddDrawer(false);
        setEditingTx(null);
        setIsDuplicate(false);
        clearForm();
        refreshData();
        triggerNotification(
          editingTx && !isDuplicate
            ? `Transaction for ${formParty} updated successfully.`
            : `New ${formType} transaction of INR ${formAmount} for ${formParty} created.`,
          editingTx && !isDuplicate ? 'Updated' : 'Created'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setIsDuplicate(false);
    fillForm(tx);
    setOpenAddDrawer(true);
  };

  const handleOpenDuplicate = (tx: Transaction) => {
    setEditingTx(tx);
    setIsDuplicate(true);
    fillForm(tx);
    setOpenAddDrawer(true);
  };

  const handleDelete = async (id: string, party: string, amount: number, type: string) => {
    if (!confirm('Are you sure you want to delete this transaction from the ledger?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}?user=SimulationUser&role=${role}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        refreshData();
        triggerNotification(`Deleted ${type} transaction for ${party} of INR ${amount}`, 'Deleted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkAction = async (action: string, status?: string) => {
    if (selectedIds.length === 0) return;
    const msg = action === 'delete' 
      ? `Are you sure you want to delete ${selectedIds.length} transactions?` 
      : `Change status of ${selectedIds.length} items to ${status}?`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          action,
          status,
          user: 'SimulationUser',
          role
        })
      });
      if (res.ok) {
        setSelectedIds([]);
        refreshData();
        triggerNotification(
          action === 'delete'
            ? `Bulk deleted ${selectedIds.length} transactions`
            : `Bulk changed status of ${selectedIds.length} items to ${status}`,
          action === 'delete' ? 'Deleted' : 'Approved'
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fillForm = (tx: Transaction) => {
    setFormType(tx.type);
    setFormPurpose(tx.purpose);
    setFormParty(tx.party);
    setFormAmount(tx.amount.toString());
    setFormStatus(tx.status);
    setFormPaymentMethod(tx.paymentMethod);
    setFormTransactionBy(tx.transactionBy);
    setFormNotes(tx.notes || '');
    setFormReferenceNumber(tx.referenceNumber || '');
    setFormUtr(tx.utr || '');
    setFormPaymentLink(tx.paymentLink || '');
    setFormUpiId(tx.upiId || '');
    setFormBankDetails(tx.bankDetails || '');
    try {
      setFormAttachments(JSON.parse(tx.attachments || '[]'));
    } catch {
      setFormAttachments([]);
    }
  };

  const clearForm = () => {
    setFormType('Expense');
    setFormPurpose('Campus Session');
    setFormParty('');
    setFormAmount('');
    setFormStatus('Pending');
    setFormPaymentMethod('UPI');
    setFormTransactionBy('');
    setFormNotes('');
    setFormReferenceNumber('');
    setFormUtr('');
    setFormPaymentLink('');
    setFormUpiId('');
    setFormBankDetails('');
    setFormAttachments([]);
  };

  // Mock upload implementation
  const handleMockUpload = () => {
    setUploadProgress(true);
    setTimeout(() => {
      const mockFiles = [
        { name: 'bill_receipt_1904.pdf', url: '#', type: 'pdf' },
        { name: 'payment_success_ss.jpg', url: '#', type: 'image' },
        { name: 'invoice_approved.pdf', url: '#', type: 'pdf' }
      ];
      const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
      setFormAttachments((prev) => [...prev, randomFile]);
      setUploadProgress(false);
    }, 1000);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const exportCSV = () => {
    const dataToExport = selectedIds.length > 0 
      ? transactions.filter((t) => selectedIds.includes(t.id))
      : transactions;

    const headers = ['Transaction ID', 'Date', 'Type', 'Purpose', 'Party', 'Amount', 'Status', 'Payment Method', 'Logged By', 'Approved By', 'Notes', 'Reference/UTR'];
    const rows = dataToExport.map((tx) => [
      tx.id,
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      tx.purpose,
      tx.party,
      tx.amount,
      tx.status,
      tx.paymentMethod,
      tx.transactionBy,
      tx.approvedBy || '',
      tx.notes || '',
      tx.referenceNumber || tx.utr || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((e) => e.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cyberx_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification(`Exported ${dataToExport.length} transactions to CSV`, 'Exported');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const purposes = [
    'Campus Session', 'Workshop', 'Sponsorship', 'Merchandise',
    'Travel', 'Food', 'Equipment', 'Software', 'Marketing',
    'Reimbursement', 'Miscellaneous'
  ];

  const paymentMethods = ['Cash', 'UPI', 'Bank', 'Card', 'Cheque'];

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Transactions Ledger"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">Organize, approve and audit org finances</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 h-11 px-4 rounded-lg border text-xs font-semibold font-sans transition-all duration-150 ${showFilters ? 'bg-primary text-black border-primary' : 'border-border-normal hover:bg-bg-elevated'}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 h-11 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated text-xs font-semibold font-sans transition-all duration-150"
            title="Export full ledger or selected items to CSV"
          >
            <FileDown className="w-4 h-4 text-text-muted" />
            <span>Export</span>
          </button>

          {role !== 'Read Only' && (
            <button
              onClick={() => {
                clearForm();
                setEditingTx(null);
                setOpenAddDrawer(true);
              }}
              className="flex items-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-opacity-95 text-black font-semibold text-xs transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              <span>Create Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ADVANCED FILTERS PANEL */}
      {showFilters && (
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-border-normal/40 pb-2">
            <span className="text-xs font-semibold text-text-heading font-display">{"// Filter Matrix"}</span>
            
            {/* SAVED FILTERS DROPDOWN */}
            {savedFilters.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted font-mono">SAVED:</span>
                <div className="flex flex-wrap gap-1.5">
                  {savedFilters.map((f) => (
                    <span 
                      key={f.name}
                      onClick={() => applySavedFilter(f)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-elevated border border-border-normal hover:border-primary text-[9px] font-mono text-text-body cursor-pointer transition-colors"
                    >
                      {f.name}
                      <X className="w-2.5 h-2.5 hover:text-cyber-danger" onClick={(e) => deleteSavedFilter(f.name, e)} />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-sans">
            {/* Date range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted font-medium">Date Range (From)</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted font-medium">Date Range (To)</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
              />
            </div>

            {/* Amount range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted font-medium">Min Amount (INR)</label>
              <input
                type="number"
                placeholder="0"
                value={filterAmountMin}
                onChange={(e) => setFilterAmountMin(e.target.value)}
                className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted font-medium">Max Amount (INR)</label>
              <input
                type="number"
                placeholder="999,999"
                value={filterAmountMax}
                onChange={(e) => setFilterAmountMax(e.target.value)}
                className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* Type filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted font-medium">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Transfer">Transfer</option>
                <option value="Refund">Refund</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted font-medium">Approval Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Purpose filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted font-medium">Purpose</label>
              <select
                value={filterPurpose}
                onChange={(e) => setFilterPurpose(e.target.value)}
                className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
              >
                <option value="">All Purposes</option>
                {purposes.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Payment Method filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted font-medium">Payment Method</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
              >
                <option value="">All Methods</option>
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border-normal/40">
            {/* Save filter name input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Custom view name"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                className="h-9 px-3 bg-bg-primary border border-border-normal rounded-lg text-xs text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleSaveFilter}
                disabled={!saveFilterName}
                className="h-9 px-3 bg-bg-elevated hover:bg-bg-primary border border-border-normal rounded-lg text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed font-mono transition-colors"
              >
                SAVE VIEW
              </button>
            </div>

            <button
              onClick={resetFilters}
              className="text-xs text-primary hover:underline font-semibold self-end sm:self-auto"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* 3. BULK ACTIONS TOOLBAR */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0"></span>
            <span className="text-xs font-semibold text-text-heading font-mono">{selectedIds.length} transactions selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {role !== 'Read Only' && (
              <>
                <button
                  onClick={() => handleBulkAction('change_status', 'Completed')}
                  className="px-3.5 py-2 rounded-lg bg-cyber-success/15 hover:bg-cyber-success/20 border border-cyber-success/30 text-cyber-success text-xs font-semibold transition-colors"
                >
                  Approve/Complete
                </button>
                <button
                  onClick={() => handleBulkAction('change_status', 'Cancelled')}
                  className="px-3.5 py-2 rounded-lg bg-cyber-warning/15 hover:bg-cyber-warning/20 border border-cyber-warning/30 text-cyber-warning text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3.5 py-2 rounded-lg bg-cyber-danger/15 hover:bg-cyber-danger/25 border border-cyber-danger/30 text-cyber-danger text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </>
            )}
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-normal text-text-body text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-2 text-text-muted hover:text-text-heading rounded-lg transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. DATA TABLE */}
      <div className="bg-bg-surface border border-border-normal rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-border-normal bg-bg-elevated/40 text-text-muted font-mono">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={transactions.length > 0 && selectedIds.length === transactions.length}
                    onChange={handleSelectAll}
                    className="h-3.5 w-3.5 rounded bg-bg-primary border-border-normal focus:ring-0 focus:outline-none"
                  />
                </th>
                <th className="py-3.5 px-4 font-semibold shrink-0">TXN ID</th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer select-none hover:text-text-heading transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1.5">
                    <span>DATE</span>
                    {sortBy === 'date' ? (
                      <ArrowUpDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 text-text-muted" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer select-none hover:text-text-heading transition-colors" onClick={() => handleSort('type')}>
                  <div className="flex items-center gap-1.5">
                    <span>TYPE</span>
                    {sortBy === 'type' ? (
                      <ArrowUpDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 text-text-muted" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer select-none hover:text-text-heading transition-colors" onClick={() => handleSort('purpose')}>
                  <div className="flex items-center gap-1.5">
                    <span>PURPOSE</span>
                    {sortBy === 'purpose' ? (
                      <ArrowUpDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 text-text-muted" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer select-none hover:text-text-heading transition-colors" onClick={() => handleSort('party')}>
                  <div className="flex items-center gap-1.5">
                    <span>PARTY</span>
                    {sortBy === 'party' ? (
                      <ArrowUpDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 text-text-muted" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-right cursor-pointer select-none hover:text-text-heading transition-colors" onClick={() => handleSort('amount')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>AMOUNT</span>
                    {sortBy === 'amount' ? (
                      <ArrowUpDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 text-text-muted" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer select-none hover:text-text-heading transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1.5">
                    <span>STATUS</span>
                    {sortBy === 'status' ? (
                      <ArrowUpDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 text-text-muted" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold hidden lg:table-cell">METHOD</th>
                <th className="py-3.5 px-4 font-semibold hidden xl:table-cell">LOGGED BY</th>
                <th className="py-3.5 px-4 text-center font-semibold w-24">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-normal text-text-body">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-text-muted font-mono animate-pulse">
                    {"// Loading transaction records..."}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-text-muted font-mono">
                    {"// No matching ledger transactions found."}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isIncome = tx.type === 'Income' || tx.type === 'Refund';
                  const shortId = tx.id.slice(0, 8).toUpperCase();
                  
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-text-heading/3 transition-colors ${
                        selectedIds.includes(tx.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(tx.id)}
                          onChange={() => handleSelectRow(tx.id)}
                          className="h-3.5 w-3.5 rounded bg-bg-primary border-border-normal focus:ring-0 focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-text-heading shrink-0">
                        {shortId}
                      </td>
                      <td className="py-3 px-4 text-text-heading">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                          tx.type === 'Income'
                            ? 'bg-cyber-success/10 text-cyber-success'
                            : tx.type === 'Expense'
                            ? 'bg-cyber-danger/10 text-cyber-danger'
                            : tx.type === 'Refund'
                            ? 'bg-cyber-info/10 text-cyber-info'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-body font-medium">
                        {tx.purpose}
                      </td>
                      <td className="py-3 px-4 text-text-heading font-semibold">
                        {tx.party}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                        isIncome ? 'text-cyber-success' : 'text-cyber-danger'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          tx.status === 'Completed'
                            ? 'bg-cyber-success/15 text-cyber-success'
                            : tx.status === 'Cancelled'
                            ? 'bg-cyber-danger/15 text-cyber-danger'
                            : 'bg-cyber-warning/15 text-cyber-warning'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-body hidden lg:table-cell">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-text-muted hidden xl:table-cell">
                        {tx.transactionBy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingTx(tx)}
                            className="p-1.5 rounded bg-bg-elevated hover:bg-bg-primary text-text-muted hover:text-text-heading transition-colors"
                            title="View Transaction Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          {role !== 'Read Only' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(tx)}
                                className="p-1.5 rounded bg-bg-elevated hover:bg-bg-primary text-text-muted hover:text-text-heading transition-colors"
                                title="Edit Transaction"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDuplicate(tx)}
                                className="p-1.5 rounded bg-bg-elevated hover:bg-bg-primary text-text-muted hover:text-text-heading transition-colors"
                                title="Duplicate Transaction"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {role === 'Super Admin' && (
                                <button
                                  onClick={() => handleDelete(tx.id, tx.party, tx.amount, tx.type)}
                                  className="p-1.5 rounded bg-bg-elevated hover:bg-cyber-danger/15 text-text-muted hover:text-cyber-danger transition-colors"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div className="p-4 border-t border-border-normal bg-bg-elevated/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-text-muted">
          <div>
            Showing <span className="font-semibold text-text-heading">{transactions.length}</span> of <span className="font-semibold text-text-heading">{pagination.total}</span> entries
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="flex items-center justify-center p-2 rounded border border-border-normal bg-bg-surface hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed text-text-heading transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            <div className="flex items-center gap-1">
              <span>Page</span>
              <span className="font-semibold text-text-heading">{pagination.page}</span>
              <span>of</span>
              <span className="font-semibold text-text-heading">{pagination.totalPages}</span>
            </div>

            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="flex items-center justify-center p-2 rounded border border-border-normal bg-bg-surface hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed text-text-heading transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. CREATE / EDIT / DUPLICATE DRAWER (SLIDEOUT MODAL) */}
      {openAddDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-bg-surface border-l border-border-normal w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="h-[72px] shrink-0 px-6 border-b border-border-normal flex items-center justify-between bg-bg-elevated/20">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">
                  {editingTx ? (isDuplicate ? '// Duplicate Transaction' : '// Edit Transaction') : '// Create Transaction'}
                </h3>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">Define transaction parameters and payment parameters</p>
              </div>
              <button
                onClick={() => {
                  setOpenAddDrawer(false);
                  setEditingTx(null);
                  setIsDuplicate(false);
                  clearForm();
                }}
                className="text-text-muted hover:text-text-heading p-1.5 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-sans">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Transaction Type *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="h-11 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Refund">Refund</option>
                  </select>
                </div>

                {/* Purpose */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Purpose / Category *</label>
                  <select
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    className="h-11 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                  >
                    {purposes.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Party */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Counter Party (Member/Speaker/Org) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name (e.g. SMC Corp, Alice Sharma)"
                    value={formParty}
                    onChange={(e) => setFormParty(e.target.value)}
                    className="h-11 px-3.5 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Amount (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="h-11 px-3.5 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Payment Method */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Payment Method *</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="h-11 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                  >
                    {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Ledger Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="h-11 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                    disabled={role === 'Committee Member'} // Committee Members can only submit Pending
                  >
                    <option value="Pending">Pending Approval</option>
                    <option value="Completed">Completed / Cleared</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Logged by */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Transaction Logged By *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formTransactionBy}
                    onChange={(e) => setFormTransactionBy(e.target.value)}
                    className="h-11 px-3.5 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>

              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Transaction Notes</label>
                <textarea
                  rows={2}
                  placeholder="Detail purchase item, speaker details, invoice summaries..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="p-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* PAYMENT DETAILS COLLAPSED DRAWER (Stripe / UPI QR config) */}
              <div className="border border-border-normal rounded-xl p-4 bg-bg-elevated/20 space-y-4">
                <span className="font-display font-semibold text-text-heading text-xs flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  <span>Payments Registry &amp; Reference</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted">UPI ID for transaction</label>
                    <input
                      type="text"
                      placeholder="e.g. cyberx@hdfcbank"
                      value={formUpiId}
                      onChange={(e) => setFormUpiId(e.target.value)}
                      className="h-9 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted">UTR / Bank Transfer Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR182901"
                      value={formUtr}
                      onChange={(e) => setFormUtr(e.target.value)}
                      className="h-9 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted">General Reference Number</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-9901"
                      value={formReferenceNumber}
                      onChange={(e) => setFormReferenceNumber(e.target.value)}
                      className="h-9 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted">Payment Link</label>
                    <input
                      type="text"
                      placeholder="e.g. https://stripe.com/pay..."
                      value={formPaymentLink}
                      onChange={(e) => setFormPaymentLink(e.target.value)}
                      className="h-9 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted">Custom Bank details (Raw string or text)</label>
                  <textarea
                    rows={1}
                    placeholder="e.g. Acc: 502000, IFSC: HDFC..."
                    value={formBankDetails}
                    onChange={(e) => setFormBankDetails(e.target.value)}
                    className="p-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* ATTACHMENTS MANAGER */}
              <div className="border border-border-normal rounded-xl p-4 bg-bg-elevated/20 space-y-4">
                <span className="font-display font-semibold text-text-heading text-xs flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Attachments (Bills, Screenshots, Invoices)</span>
                </span>

                <div 
                  onClick={handleMockUpload}
                  className="border-2 border-dashed border-border-normal hover:border-primary rounded-xl p-6 text-center cursor-pointer transition-all duration-150 bg-bg-primary"
                >
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-[11px] text-text-heading font-medium">Click to upload receipts, bills, payment screenshots</p>
                  <p className="text-[9px] text-text-muted mt-1">PDF, PNG, JPG, JPEG (Max 5MB each)</p>
                  {uploadProgress && <div className="text-[10px] text-primary font-mono mt-2 animate-pulse">Uploading to ledger file system...</div>}
                </div>

                {/* Uploaded attachments list */}
                {formAttachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-text-muted font-mono">ATTACHED:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formAttachments.map((f, i) => (
                        <div key={i} className="flex justify-between items-center bg-bg-primary border border-border-normal rounded-lg px-3 py-2">
                          <span className="text-[10px] font-medium text-text-body truncate w-44">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setFormAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-text-muted hover:text-cyber-danger p-0.5 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </form>

            {/* Drawer Footer */}
            <div className="h-[72px] shrink-0 border-t border-border-normal px-6 flex items-center justify-end gap-3 bg-bg-elevated/20">
              <button
                type="button"
                onClick={() => {
                  setOpenAddDrawer(false);
                  setEditingTx(null);
                  setIsDuplicate(false);
                  clearForm();
                }}
                className="h-11 px-4 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={isSubmitting}
                className="h-11 px-6 rounded-lg bg-primary hover:bg-opacity-95 text-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (editingTx ? (isDuplicate ? 'Duplicate & Save' : 'Save Changes') : 'Save Transaction')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. VIEW DETAILS DIALOG OVERLAY */}
      {viewingTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-normal rounded-xl max-w-xl w-full flex flex-col shadow-2xl animate-in scale-in duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">{"// Transaction Audit View"}</h3>
                <span className="text-[9px] text-text-muted font-mono">ID: {viewingTx.id}</span>
              </div>
              <button
                onClick={() => {
                  setViewingTx(null);
                  setShowQrPreview(null);
                }}
                className="text-text-muted hover:text-text-heading p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-xs">
              
              {/* Primary info details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="py-2 px-3 bg-bg-primary rounded-lg border border-border-normal/40">
                  <span className="text-[10px] text-text-muted font-mono">TYPE</span>
                  <p className="font-bold text-text-heading mt-0.5">{viewingTx.type}</p>
                </div>
                <div className="py-2 px-3 bg-bg-primary rounded-lg border border-border-normal/40">
                  <span className="text-[10px] text-text-muted font-mono">STATUS</span>
                  <p className="font-bold text-text-heading mt-0.5">{viewingTx.status}</p>
                </div>
                <div className="py-2 px-3 bg-bg-primary rounded-lg border border-border-normal/40">
                  <span className="text-[10px] text-text-muted font-mono">PARTY</span>
                  <p className="font-bold text-text-heading mt-0.5">{viewingTx.party}</p>
                </div>
                <div className="py-2 px-3 bg-bg-primary rounded-lg border border-border-normal/40">
                  <span className="text-[10px] text-text-muted font-mono">AMOUNT</span>
                  <p className={`font-bold text-sm mt-0.5 ${viewingTx.type === 'Income' || viewingTx.type === 'Refund' ? 'text-cyber-success' : 'text-cyber-danger'}`}>
                    {formatCurrency(viewingTx.amount)}
                  </p>
                </div>
                <div className="py-2 px-3 bg-bg-primary rounded-lg border border-border-normal/40">
                  <span className="text-[10px] text-text-muted font-mono">PURPOSE</span>
                  <p className="font-medium text-text-heading mt-0.5">{viewingTx.purpose}</p>
                </div>
                <div className="py-2 px-3 bg-bg-primary rounded-lg border border-border-normal/40">
                  <span className="text-[10px] text-text-muted font-mono">DATE</span>
                  <p className="font-medium text-text-heading mt-0.5">{new Date(viewingTx.date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Notes */}
              {viewingTx.notes && (
                <div className="p-3 bg-bg-primary rounded-lg border border-border-normal/40 space-y-1">
                  <span className="text-[10px] text-text-muted font-mono">NOTES &amp; AUDIT REMARKS</span>
                  <p className="text-text-body text-xs leading-relaxed">{viewingTx.notes}</p>
                </div>
              )}

              {/* Payments Details */}
              <div className="p-4 border border-border-normal rounded-xl bg-bg-elevated/20 space-y-3">
                <span className="font-display font-semibold text-text-heading text-[10px] tracking-wider block">{"// Payments & References"}</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                  {viewingTx.paymentMethod && (
                    <div className="flex justify-between items-center py-1 border-b border-border-normal/30">
                      <span className="text-text-muted">Method:</span>
                      <span className="text-text-heading font-medium">{viewingTx.paymentMethod}</span>
                    </div>
                  )}
                  {viewingTx.referenceNumber && (
                    <div className="flex justify-between items-center py-1 border-b border-border-normal/30">
                      <span className="text-text-muted">Ref Num:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-heading">{viewingTx.referenceNumber}</span>
                        <button onClick={() => handleCopy(viewingTx.referenceNumber!, 'ref')} className="text-text-muted hover:text-text-heading">
                          {copiedText === 'ref' ? <CheckCircle className="w-3.5 h-3.5 text-cyber-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {viewingTx.utr && (
                    <div className="flex justify-between items-center py-1 border-b border-border-normal/30">
                      <span className="text-text-muted">UTR:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-heading">{viewingTx.utr}</span>
                        <button onClick={() => handleCopy(viewingTx.utr!, 'utr')} className="text-text-muted hover:text-text-heading">
                          {copiedText === 'utr' ? <CheckCircle className="w-3.5 h-3.5 text-cyber-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {viewingTx.upiId && (
                    <div className="flex justify-between items-center py-1 border-b border-border-normal/30 col-span-1 sm:col-span-2">
                      <span className="text-text-muted">UPI ID:</span>
                      <div className="flex items-center gap-3">
                        <span className="text-text-heading">{viewingTx.upiId}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleCopy(viewingTx.upiId!, 'upi')} className="text-text-muted hover:text-text-heading" title="Copy UPI ID">
                            {copiedText === 'upi' ? <CheckCircle className="w-3.5 h-3.5 text-cyber-success" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setShowQrPreview(showQrPreview ? null : `upi://pay?pa=${viewingTx.upiId}&pn=${viewingTx.party}&am=${viewingTx.amount}&cu=INR`)} className="text-text-muted hover:text-text-heading" title="Generate UPI QR Code">
                            <QrCode className="w-3.5 h-3.5 text-primary" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated QR Code display */}
                {showQrPreview && (
                  <div className="flex flex-col items-center justify-center p-4 bg-white border border-border-normal rounded-xl mt-3 animate-in fade-in duration-150">
                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                      {/* We make an outline mock representing the QR code */}
                      <div className="w-32 h-32 border-2 border-black relative flex items-center justify-center font-mono text-[8px] text-black text-center p-2 font-bold select-none">
                        CYBERX SECURE QR
                        <div className="absolute top-1 left-1 w-3 h-3 bg-black"></div>
                        <div className="absolute top-1 right-1 w-3 h-3 bg-black"></div>
                        <div className="absolute bottom-1 left-1 w-3 h-3 bg-black"></div>
                        {/* QR grid design */}
                        <div className="w-20 h-20 border border-dashed border-gray-400 mt-2 flex flex-col justify-center gap-1 text-[5px]">
                          <div>UPI: {viewingTx.upiId}</div>
                          <div>AMT: {viewingTx.amount}</div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-500 font-sans mt-2 font-semibold">Scan with any UPI App to Pay INR {viewingTx.amount}</span>
                  </div>
                )}
              </div>

              {/* Attachments List */}
              {viewingTx.attachments && (
                <div className="space-y-2">
                  <span className="text-[10px] text-text-muted font-mono block">AUDIT PROOF &amp; ATTACHMENTS</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {JSON.parse(viewingTx.attachments || '[]').length === 0 ? (
                      <p className="text-text-muted italic text-[11px]">No receipts or bills attached.</p>
                    ) : (
                      JSON.parse(viewingTx.attachments || '[]').map((file: { name: string; url: string; type: string }, index: number) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between bg-bg-primary border border-border-normal rounded-lg px-3 py-2 hover:border-primary transition-colors"
                        >
                          <span className="text-[10px] font-medium text-text-body truncate w-40">{file.name}</span>
                          <span className="text-[8px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-mono font-semibold uppercase">
                            {file.type}
                          </span>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Log/Approval detail */}
              <div className="border-t border-border-normal/40 pt-3 flex justify-between text-[10px] text-text-muted font-mono">
                <span>Logged by: {viewingTx.transactionBy}</span>
                {viewingTx.approvedBy && <span>Approved by: {viewingTx.approvedBy}</span>}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end gap-3">
              {role !== 'Read Only' && (
                <button
                  onClick={() => {
                    handleOpenEdit(viewingTx);
                    setViewingTx(null);
                  }}
                  className="h-9 px-4 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-normal text-text-heading font-semibold transition-colors"
                >
                  Edit Item
                </button>
              )}
              <button
                onClick={() => {
                  setViewingTx(null);
                  setShowQrPreview(null);
                }}
                className="h-9 px-4 rounded-lg bg-primary text-black font-bold transition-all hover:bg-opacity-95"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
