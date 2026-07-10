'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, ShieldAlert, CreditCard, Tags, Save } from 'lucide-react';


export function SettingsPanel() {
  const { role, refreshTrigger, triggerNotification } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [communityName, setCommunityName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [categories, setCategories] = useState('');
  const [paymentMethods, setPaymentMethods] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'banking' | 'ledger'>('general');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        
        // Fill form states
        setCommunityName(data.communityName || '');
        setBankName(data.bankName || '');
        setBankAccount(data.bankAccount || '');
        setBankIfsc(data.bankIfsc || '');
        setUpiId(data.upiId || '');
        setDefaultCurrency(data.defaultCurrency || 'INR');
        setFinancialYear(data.financialYear || '2026-2027');
        setCategories(data.categories || '');
        setPaymentMethods(data.paymentMethods || '');
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchSettings();
    }, 0);
  }, [refreshTrigger]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'Super Admin' && role !== 'Finance Head') {
      alert('Access Denied. Only Super Admin or Finance Head can change settings.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityName,
          bankName,
          bankAccount,
          bankIfsc,
          upiId,
          defaultCurrency,
          financialYear,
          categories,
          paymentMethods,
          user: 'SimulationUser',
          role
        })
      });

      if (res.ok) {
        triggerNotification('Global system configuration updated successfully.', 'Updated');
        fetchSettings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 font-mono text-xs text-text-muted animate-pulse">
      {"// Syncing configurations..."}
      </div>
    );
  }

  const isReadOnlyUser = role === 'Treasurer' || role === 'Committee Member' || role === 'Read Only';

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// System Configurations"}</h2>
        <p className="text-[10px] text-text-muted font-mono mt-0.5 font-semibold">Customize ledger parameters, UPI receivers and categories</p>
      </div>

      <div className="bg-bg-surface border border-border-normal rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[450px]">
        
        {/* Settings Left Tab Menu */}
        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-border-normal bg-bg-elevated/20 p-4 space-y-1.5">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'general' ? 'bg-primary text-black' : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Community Settings</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('banking')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'banking' ? 'bg-primary text-black' : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Bank &amp; UPI Details</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'ledger' ? 'bg-primary text-black' : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <Tags className="w-4 h-4 shrink-0" />
            <span>Ledger Categories</span>
          </button>

          {isReadOnlyUser && (
            <div className="mt-8 p-3 rounded-lg border border-cyber-warning/20 bg-cyber-warning/5 text-[10px] text-cyber-warning flex gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-tight">Read-only configurations. Switch simulator role to Super Admin to edit settings.</p>
            </div>
          )}
        </div>

        {/* Settings Right Form Panel */}
        <form onSubmit={handleSaveSettings} className="flex-1 p-6 space-y-6 text-xs text-sans">
          
          {/* GENERAL SECTION */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-text-heading font-display tracking-wider border-b border-border-normal/40 pb-1.5">
                {"// Community Details"}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Community Name</label>
                  <input
                    type="text"
                    disabled={isReadOnlyUser}
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Financial Year</label>
                  <input
                    type="text"
                    disabled={isReadOnlyUser}
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Default Currency</label>
                  <select
                    disabled={isReadOnlyUser}
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* BANKING SECTION */}
          {activeSubTab === 'banking' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-text-heading font-display tracking-wider border-b border-border-normal/40 pb-1.5">
                {"// Bank Details & UPI"}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Bank Name</label>
                  <input
                    type="text"
                    disabled={isReadOnlyUser}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Bank Account Number</label>
                  <input
                    type="text"
                    disabled={isReadOnlyUser}
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">IFSC Code</label>
                  <input
                    type="text"
                    disabled={isReadOnlyUser}
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">UPI ID (pa receiver)</label>
                  <input
                    type="text"
                    disabled={isReadOnlyUser}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LEDGER CATEGORIES */}
          {activeSubTab === 'ledger' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-text-heading font-display tracking-wider border-b border-border-normal/40 pb-1.5">
                {"// Ledger Categories & Methods"}
              </h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Transaction Purposes (Comma-separated)</label>
                <textarea
                  rows={3}
                  disabled={isReadOnlyUser}
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  className="p-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50 resize-none font-mono"
                />
                <span className="text-[9px] text-text-muted font-mono">{"// Dropdown values for ledger transaction types"}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Payment Methods (Comma-separated)</label>
                <input
                  type="text"
                  disabled={isReadOnlyUser}
                  value={paymentMethods}
                  onChange={(e) => setPaymentMethods(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none disabled:opacity-50 font-mono"
                />
              </div>
            </div>
          )}

          {/* Save Action Row */}
          {!isReadOnlyUser && (
            <div className="flex justify-end pt-4 border-t border-border-normal/40">
              <button
                type="submit"
                disabled={submitting}
                className="h-11 px-6 bg-primary hover:bg-opacity-95 text-black rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4.5 h-4.5" />
                <span>{submitting ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          )}

        </form>
      </div>

    </div>
  );
}
