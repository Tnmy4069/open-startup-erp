'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  User,
  Plus,
  X,
  Eye,
  Mail,
  Phone
} from 'lucide-react';

interface Person {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  totalReceived: number;
  totalPaid: number;
  transactionCount: number;
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

export function PeopleList({ globalSearch }: { globalSearch: string }) {
  const { role, refreshTrigger, triggerNotification } = useApp();

  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Drilldown states
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personTransactions, setPersonTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New Person modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [personRole, setPersonRole] = useState('Member');

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/people');
      if (res.ok) {
        const data = await res.json();
        setPeople(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchPeople();
    }, 0);
  }, [refreshTrigger]);

  const handleOpenHistory = async (person: Person) => {
    setSelectedPerson(person);
    try {
      setLoadingHistory(true);
      const params = new URLSearchParams({ party: person.name, limit: '100' });
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPersonTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      alert('Please fill out required fields.');
      return;
    }

    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          role: personRole,
          user: 'SimulationUser',
          userRole: role
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setPhone('');
        setEmail('');
        setPersonRole('Member');
        fetchPeople();
        triggerNotification(`Added profile for ${name} (${personRole})`, 'Created');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredPeople = people.filter((p) => {
    const s = globalSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.email.toLowerCase().includes(s) ||
      p.role.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Members & Contact Registry"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">Manage speakers, student attendees, vendors and active volunteers</p>
        </div>

        {role !== 'Read Only' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-95 text-black font-semibold text-xs transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member Profile</span>
          </button>
        )}
      </div>

      {/* PEOPLE CARDS GRID */}
      {loading ? (
        <div className="text-center py-12 font-mono text-xs text-text-muted animate-pulse">
          {"// Loading member files..."}
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-12 font-mono text-xs text-text-muted">
          {"// No registry profiles found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.map((p) => (
            <div
              key={p.id}
              className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-text-heading text-sm">{p.name}</h3>
                      <span className="text-[9px] text-text-muted font-mono">{"// "}{p.role.toUpperCase()}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-bg-elevated border border-border-normal text-[9px] font-mono text-text-muted">
                    {p.role}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-border-normal/40"></div>

                {/* Contact list */}
                <div className="space-y-2 text-xs text-text-body">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-text-muted shrink-0" />
                    <span>{p.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-text-muted shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </div>
                </div>

                {/* Ledger figures */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono">
                  <div className="p-2 bg-bg-primary rounded border border-border-normal/40 text-cyber-success">
                    <span className="text-text-muted">TOTAL RECEIVED</span>
                    <p className="font-bold mt-0.5">{formatCurrency(p.totalReceived)}</p>
                  </div>
                  <div className="p-2 bg-bg-primary rounded border border-border-normal/40 text-cyber-danger">
                    <span className="text-text-muted">TOTAL PAID OUT</span>
                    <p className="font-bold mt-0.5">{formatCurrency(p.totalPaid)}</p>
                  </div>
                </div>

              </div>

              {/* Action trigger */}
              <button
                onClick={() => handleOpenHistory(p)}
                className="mt-5 w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated hover:text-text-heading text-xs font-semibold font-sans transition-colors"
              >
                <Eye className="w-4 h-4 text-text-muted" />
                <span>Transaction History ({p.transactionCount})</span>
              </button>

            </div>
          ))}
        </div>
      )}

      {/* 1. INDIVIDUAL HISTORY DRILLDOWN */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-normal rounded-xl max-w-3xl w-full flex flex-col shadow-2xl animate-in scale-in duration-200">
            
            <div className="px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">{"// Personal Ledger History"}</h3>
                <span className="text-[10px] text-text-muted font-mono">{selectedPerson.name} ({selectedPerson.role}) Transaction History</span>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-text-muted hover:text-text-heading p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] text-xs">
              {loadingHistory ? (
                <div className="text-center py-12 font-mono text-text-muted animate-pulse">
                  {"// Fetching history logs..."}
                </div>
              ) : personTransactions.length === 0 ? (
                <div className="text-center py-12 font-mono text-text-muted">
                  {"// No matching transactions logged for this individual."}
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
                      {personTransactions.map((tx) => {
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

            <div className="px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end">
              <button
                onClick={() => setSelectedPerson(null)}
                className="h-10 px-6 rounded-lg bg-primary text-black font-bold text-xs transition-all hover:bg-opacity-95"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePerson} className="bg-bg-surface border border-border-normal rounded-xl max-w-md w-full flex flex-col shadow-2xl animate-in scale-in duration-200">
            
            <div className="px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">{"// Register Profile"}</h3>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">Add an individual member, speaker or vendor to the system</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-heading p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Account Role *</label>
                <select
                  value={personRole}
                  onChange={(e) => setPersonRole(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                >
                  <option value="Member">Member</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Student">Student</option>
                </select>
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
                    placeholder="name@cyberx.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-10 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 px-6 rounded-lg bg-primary text-black font-bold text-xs transition-all hover:bg-opacity-95"
              >
                Create Profile
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
