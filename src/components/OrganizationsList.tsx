'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  X,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  outstandingPayments: number;
  transactionCount: number;
  completedCount: number;
  totalVolume: number;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  purpose: string;
  party: string;
  amount: number;
  status: string;
  paymentMethod: string;
}

export function OrganizationsList({ globalSearch }: { globalSearch: string }) {
  const { role, refreshTrigger, triggerNotification } = useApp();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drilldown modal states
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgTransactions, setOrgTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New Organization modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchOrgs();
    }, 0);
  }, [refreshTrigger]);

  const handleOpenHistory = async (org: Organization) => {
    setSelectedOrg(org);
    try {
      setLoadingHistory(true);
      const params = new URLSearchParams({ party: org.name, limit: '100' });
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrgTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setContactPerson(org.contactPerson);
    setPhone(org.phone);
    setEmail(org.email);
    setAddress(org.address);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingOrg(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
  };

  const handleDeleteOrg = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete profile for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/organizations/${id}?user=SimulationUser&role=${role}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchOrgs();
        triggerNotification(`Deleted organization profile for "${name}"`, 'Deleted');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete profile');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name || !contactPerson || !phone || !email) {
      alert('Please fill out required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingOrg ? `/api/organizations/${editingOrg.id}` : '/api/organizations';
      const method = editingOrg ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contactPerson,
          phone,
          email,
          address,
          user: 'SimulationUser',
          role
        })
      });

      if (res.ok) {
        handleCloseModal();
        fetchOrgs();
        triggerNotification(
          editingOrg 
            ? `Updated organization profile for "${name}"` 
            : `Created organization profile for "${name}"`, 
          editingOrg ? 'Updated' : 'Created'
        );
      } else {
        const err = await res.json();
        alert(err.error || 'Request failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter list by global search input + local filters
  const filteredOrgs = organizations.filter((org) => {
    const s = globalSearch.toLowerCase();
    return (
      org.name.toLowerCase().includes(s) ||
      org.contactPerson.toLowerCase().includes(s) ||
      org.email.toLowerCase().includes(s) ||
      org.address.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Organizations Directory"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">Manage sponsoring corporations, vendors and partner institutions</p>
        </div>

        {role !== 'Read Only' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-95 text-black font-semibold text-xs transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organization</span>
          </button>
        )}
      </div>

      {/* ORGANIZATIONS CARD GRID */}
      {loading ? (
        <div className="text-center py-12 font-mono text-xs text-text-muted animate-pulse">
          {"// Loading organization profiles..."}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="text-center py-12 font-mono text-xs text-text-muted">
          {"// No organizations registered."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => {
            const hasOverdue = org.outstandingPayments > 0;
            const hasBalance = org.outstandingPayments !== 0;

            return (
              <div
                key={org.id}
                className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 hover:-translate-y-[2px] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Title & Outstanding */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-text-heading text-sm">{org.name}</h3>
                        <span className="text-[9px] text-text-muted font-mono">{"// Org Profile"}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {hasBalance && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          hasOverdue ? 'bg-cyber-danger/10 text-cyber-danger' : 'bg-cyber-success/10 text-cyber-success'
                        }`}>
                          {hasOverdue ? 'DUE: ' : 'CREDIT: '}{formatCurrency(Math.abs(org.outstandingPayments))}
                        </span>
                      )}
                      {role !== 'Read Only' && (
                        <div className="flex gap-1.5">
                          {(role === 'Super Admin' || role === 'Finance Head' || role === 'Founder') && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(org)}
                              className="p-1 rounded bg-bg-elevated border border-border-normal hover:border-primary text-text-muted hover:text-text-heading transition-colors cursor-pointer"
                              title="Edit Organization"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {role === 'Super Admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOrg(org.id, org.name)}
                              className="p-1 rounded bg-bg-elevated border border-border-normal hover:border-cyber-danger text-text-muted hover:text-cyber-danger transition-colors cursor-pointer"
                              title="Delete Organization"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border-normal/40"></div>

                  {/* Info list */}
                  <div className="space-y-2 text-xs text-text-body">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-text-muted shrink-0" />
                      <span>{org.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-text-muted shrink-0" />
                      <span>{org.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="truncate">{org.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="truncate">{org.address}</span>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono text-text-muted">
                    <div className="p-2 bg-bg-primary rounded border border-border-normal/40">
                      <span>VOLUME</span>
                      <p className="font-bold text-text-heading mt-0.5">{formatCurrency(org.totalVolume)}</p>
                    </div>
                    <div className="p-2 bg-bg-primary rounded border border-border-normal/40">
                      <span>TRANSACTIONS</span>
                      <p className="font-bold text-text-heading mt-0.5">{org.transactionCount} ({org.completedCount} ok)</p>
                    </div>
                  </div>
                </div>

                {/* Drilldown trigger */}
                <button
                  onClick={() => handleOpenHistory(org)}
                  className="mt-5 w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated hover:text-text-heading text-xs font-semibold font-sans transition-colors"
                >
                  <Eye className="w-4 h-4 text-text-muted" />
                  <span>Transaction History</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. TRANSACTION HISTORY DRILLDOWN MODAL */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-normal rounded-xl max-w-3xl w-full flex flex-col shadow-2xl animate-in scale-in duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">{"// Organization Ledger drilldown"}</h3>
                <span className="text-[10px] text-text-muted font-mono">{selectedOrg.name} Ledger History</span>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-text-muted hover:text-text-heading p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] text-xs">
              {loadingHistory ? (
                <div className="text-center py-12 font-mono text-text-muted animate-pulse">
                  {"// Fetching history ledger..."}
                </div>
              ) : orgTransactions.length === 0 ? (
                <div className="text-center py-12 font-mono text-text-muted">
                  {"// No transaction ledger items recorded for this organization."}
                </div>
              ) : (
                <div className="border border-border-normal rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border-normal bg-bg-elevated/40 text-text-muted font-mono">
                        <th className="py-2.5 px-4">TXN ID</th>
                        <th className="py-2.5 px-4">DATE</th>
                        <th className="py-2.5 px-4">TYPE</th>
                        <th className="py-2.5 px-4">PURPOSE</th>
                        <th className="py-2.5 px-4 text-right">AMOUNT</th>
                        <th className="py-2.5 px-4">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-normal text-text-body">
                      {orgTransactions.map((tx) => {
                        const isIncome = tx.type === 'Income' || tx.type === 'Refund';
                        return (
                          <tr key={tx.id} className="hover:bg-text-heading/3">
                            <td className="py-2.5 px-4 font-mono font-bold">{tx.id.slice(0, 8).toUpperCase()}</td>
                            <td className="py-2.5 px-4">{new Date(tx.date).toLocaleDateString()}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                tx.type === 'Income'
                                  ? 'bg-cyber-success/10 text-cyber-success'
                                  : 'bg-cyber-danger/10 text-cyber-danger'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">{tx.purpose}</td>
                            <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                              isIncome ? 'text-cyber-success' : 'text-cyber-danger'
                            }`}>
                              {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                tx.status === 'Completed' ? 'bg-cyber-success/15 text-cyber-success' : 'bg-cyber-warning/15 text-cyber-warning'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end">
              <button
                onClick={() => setSelectedOrg(null)}
                className="h-10 px-6 rounded-lg bg-primary text-black font-bold text-xs transition-all hover:bg-opacity-95"
              >
                Close Drilldown
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. ADD ORGANIZATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrg} className="bg-bg-surface border border-border-normal rounded-xl max-w-md w-full flex flex-col shadow-2xl animate-in scale-in duration-200">
            
            <div className="px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">{editingOrg ? "// Edit Corporate Profile" : "// Add Corporate Profile"}</h3>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">{editingOrg ? "Modify corporate profile fields in the registry" : "Register a partner client or sponsoring organization"}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-text-muted hover:text-text-heading p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wisetech Global, SMC Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Primary Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. George Miller"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="org@contact.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Physical Address</label>
                <input
                  type="text"
                  placeholder="Street name, City..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="h-10 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
               <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-lg bg-primary text-black font-bold text-xs transition-all hover:bg-opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (editingOrg ? 'Save Changes' : 'Register Profile')}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
