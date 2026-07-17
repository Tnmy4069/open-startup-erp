'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Wrench,
  Plus,
  X,
  Search,
  Calendar,
  User,
  MapPin,
  ClipboardList,
  AlertCircle,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
}

interface AssetHistory {
  id: string;
  action: string;
  holder: string | null;
  date: string;
  notes: string | null;
}

interface AssetMaintenance {
  id: string;
  startDate: string;
  endDate: string | null;
  cost: number;
  issue: string;
  resolution: string | null;
  status: string;
}

interface Asset {
  id: string;
  assetId: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  vendor: string;
  warranty: string | null;
  condition: string;
  status: string;
  location: string;
  holderId: string | null;
  holder: Member | null;
  qrCode: string | null;
}

interface AssetDetail extends Asset {
  history: AssetHistory[];
  maintenances: AssetMaintenance[];
}

export function AssetsPanel() {
  const { role, refreshTrigger, triggerNotification } = useApp();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Detail
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Members list (for checkout holder selector)
  const [members, setMembers] = useState<Member[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Asset Form States
  const [formAssetId, setFormAssetId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Electronics');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formPurchaseCost, setFormPurchaseCost] = useState('0');
  const [formVendor, setFormVendor] = useState('');
  const [formWarranty, setFormWarranty] = useState('');
  const [formCondition, setFormCondition] = useState('Excellent');
  const [formLocation, setFormLocation] = useState('Office HQ');

  // Issue Checkout form states
  const [checkoutHolderId, setCheckoutHolderId] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // Return form states
  const [returnCondition, setReturnCondition] = useState('Excellent');
  const [returnNotes, setReturnNotes] = useState('');

  // Maintenance form states
  const [maintAction, setMaintAction] = useState('Start'); // Start, Resolve, Lost
  const [maintIssue, setMaintIssue] = useState('');
  const [maintCost, setMaintCost] = useState('0');
  const [maintResolution, setMaintResolution] = useState('');
  const [maintLogId, setMaintLogId] = useState('');

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        category: categoryFilter,
        condition: conditionFilter,
        status: statusFilter
      });
      const res = await fetch(`/api/assets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/assets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members?limit=100');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAssets();
    setSelectedAssetId(null);
  }, [search, categoryFilter, conditionFilter, statusFilter, refreshTrigger]);

  useEffect(() => {
    if (selectedAssetId) {
      fetchAssetDetail(selectedAssetId);
    } else {
      setDetail(null);
    }
  }, [selectedAssetId, refreshTrigger]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpenAdd = () => {
    setFormAssetId(`CYBERX-AST-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormCategory('Electronics');
    setFormPurchaseDate(new Date().toISOString().slice(0, 10));
    setFormPurchaseCost('0');
    setFormVendor('Amazon');
    setFormWarranty('1 Year');
    setFormCondition('Excellent');
    setFormLocation('Office HQ');
    setShowAddModal(true);
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: formAssetId,
          name: formName,
          category: formCategory,
          purchaseDate: formPurchaseDate,
          purchaseCost: formPurchaseCost,
          vendor: formVendor,
          warranty: formWarranty,
          condition: formCondition,
          location: formLocation,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        triggerNotification(`Added new asset entry ${formName}`, 'Created');
        fetchAssets();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register asset');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;

    try {
      const res = await fetch(`/api/assets/${detail.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holderId: checkoutHolderId, notes: checkoutNotes }),
      });

      if (res.ok) {
        setShowCheckoutModal(false);
        setCheckoutHolderId('');
        setCheckoutNotes('');
        triggerNotification(`Issued asset to holder`, 'Issued');
        fetchAssetDetail(detail.id);
        fetchAssets();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to issue asset');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;

    try {
      const res = await fetch(`/api/assets/${detail.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: returnCondition, notes: returnNotes }),
      });

      if (res.ok) {
        setShowReturnModal(false);
        setReturnCondition('Excellent');
        setReturnNotes('');
        triggerNotification(`Asset returned successfully`, 'Returned');
        fetchAssetDetail(detail.id);
        fetchAssets();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to return asset');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;

    try {
      const res = await fetch(`/api/assets/${detail.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: maintAction,
          issue: maintIssue,
          cost: maintCost,
          resolution: maintResolution,
          maintenanceId: maintLogId,
        }),
      });

      if (res.ok) {
        setShowMaintenanceModal(false);
        setMaintIssue('');
        setMaintCost('0');
        setMaintResolution('');
        setMaintLogId('');
        triggerNotification(`Updated maintenance log`, 'Updated');
        fetchAssetDetail(detail.id);
        fetchAssets();
      } else {
        const err = await res.json();
        alert(err.error || 'Maintenance transaction failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Hardware & Device Asset Tracker"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5 font-semibold">Track cameras, projectors, mic systems, checkout logs and maintenance histories</p>
        </div>

        {role !== 'Read Only' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-95 text-black font-semibold text-xs font-sans transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset Entry</span>
          </button>
        )}
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by asset name, asset ID, location, or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-bg-primary border border-border-normal rounded-lg text-xs text-text-heading focus:outline-none focus:border-primary placeholder-text-muted"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 md:w-96 shrink-0 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-2 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary font-mono text-[11px]"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Audio">Audio</option>
            <option value="Optics">Optics</option>
            <option value="Furniture">Furniture</option>
            <option value="Marketing">Marketing</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="h-10 px-2 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary font-mono text-[11px]"
          >
            <option value="">All Conditions</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Needs Repair">Needs Repair</option>
            <option value="Damaged">Damaged</option>
            <option value="Lost">Lost</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-2 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary font-mono text-[11px]"
          >
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* CORE DISPLAY */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* ASSETS CARDS INVENTORY */}
        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-bg-surface border border-border-normal/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-bg-surface border border-border-normal rounded-xl py-16 text-center font-mono text-xs text-text-muted">
              {"// No assets match query logs."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {assets.map((a) => {
                const isSelected = selectedAssetId === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssetId(isSelected ? null : a.id)}
                    className={`bg-bg-surface border rounded-xl p-5 hover:border-primary transition-all duration-200 cursor-pointer flex flex-col justify-between h-48 relative ${
                      isSelected ? 'border-primary shadow-sm bg-primary/2' : 'border-border-normal'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[9px] font-mono text-text-muted">{a.assetId}</span>
                          <h3 className="font-display font-bold text-text-heading text-sm mt-0.5">{a.name}</h3>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                          a.status === 'Available'
                            ? 'bg-cyber-success/15 border-cyber-success/20 text-cyber-success'
                            : a.status === 'Issued'
                              ? 'bg-blue-500/15 border-blue-500/20 text-blue-400'
                              : 'bg-cyber-warning/15 border-cyber-warning/20 text-cyber-warning'
                        }`}>
                          {a.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-text-body font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-text-muted">COND:</span>
                          <span className="text-text-heading font-semibold">{a.condition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">LOC:</span>
                          <span className="text-text-heading font-semibold">{a.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border-normal/40 pt-3 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-text-muted">HOLDER</span>
                      <span className="text-text-heading font-bold">
                        {a.holder ? a.holder.name : 'COMMUNITY WAREHOUSE'}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LOG & TIMELINE HISTORY DETAIL VIEW */}
        {selectedAssetId && (
          <div className="w-full lg:w-96 bg-bg-surface border border-border-normal rounded-xl p-6 flex flex-col justify-between min-h-[400px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-200">
            {loadingDetail ? (
              <div className="text-center py-20 font-mono text-xs text-text-muted animate-pulse">
                {"// Loading device history logs..."}
              </div>
            ) : detail ? (
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border-normal/40 pb-3">
                  <div>
                    <span className="text-[10px] text-text-muted font-mono">{detail.assetId}</span>
                    <h3 className="font-display font-bold text-text-heading text-base mt-0.5">{detail.name}</h3>
                    <p className="text-[10px] text-text-muted font-mono mt-1">{detail.category} / {detail.location}</p>
                  </div>
                  
                  <button onClick={() => setSelectedAssetId(null)} className="p-1.5 hover:bg-bg-elevated hover:text-text-heading text-text-muted rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Details card */}
                <div className="bg-bg-primary rounded-xl border border-border-normal/40 p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-text-muted">COST:</span>
                    <span className="text-text-heading font-semibold">INR {detail.purchaseCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">DATE:</span>
                    <span className="text-text-heading font-semibold">{new Date(detail.purchaseDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">VENDOR:</span>
                    <span className="text-text-heading font-semibold">{detail.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">WARRANTY:</span>
                    <span className="text-text-heading font-semibold">{detail.warranty || 'No Warranty logs'}</span>
                  </div>
                </div>

                {/* Active Holder Info */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-text-muted block font-semibold">CURRENT ASSIGNMENT</span>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border-normal bg-bg-primary/50 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-text-muted" />
                      <span className="font-semibold text-text-heading">
                        {detail.holder ? detail.holder.name : 'Available in Inventory'}
                      </span>
                    </div>

                    {role !== 'Read Only' && (
                      <div>
                        {detail.status === 'Available' ? (
                          <button
                            onClick={() => setShowCheckoutModal(true)}
                            className="text-[10px] font-bold font-mono text-primary hover:underline cursor-pointer"
                          >
                            ISSUE ASSET
                          </button>
                        ) : detail.status === 'Issued' ? (
                          <button
                            onClick={() => setShowReturnModal(true)}
                            className="text-[10px] font-bold font-mono text-primary hover:underline cursor-pointer"
                          >
                            RETURN ASSET
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* Maintenance Row Actions */}
                {role !== 'Read Only' && (
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] text-text-muted block font-semibold">OPERATIONS</span>
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => { setMaintAction('Start'); setMaintLogId(''); setShowMaintenanceModal(true); }}
                        disabled={detail.status === 'Maintenance'}
                        className="flex-1 h-9 rounded-lg border border-border-normal hover:bg-bg-elevated hover:text-text-heading font-mono text-[10px] font-semibold transition-all disabled:opacity-50"
                      >
                        SEND FOR REPAIR
                      </button>
                      
                      {detail.status === 'Maintenance' && (
                        <button
                          onClick={() => {
                            const pending = detail.maintenances.find((m) => m.status === 'Pending');
                            if (pending) {
                              setMaintLogId(pending.id);
                              setMaintAction('Resolve');
                              setShowMaintenanceModal(true);
                            }
                          }}
                          className="flex-1 h-9 rounded-lg bg-cyber-success/15 border border-cyber-success/30 text-cyber-success font-mono text-[10px] font-bold hover:bg-cyber-success/20 transition-all"
                        >
                          RESOLVE REPAIR
                        </button>
                      )}

                      <button
                        onClick={() => { setMaintAction('Lost'); handleMaintenanceSubmit(new Event('submit') as any); }}
                        disabled={detail.status === 'Lost'}
                        className="p-2 border border-border-normal hover:border-cyber-danger hover:text-cyber-danger rounded-lg transition-colors"
                        title="Mark as Lost"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit log logs */}
                <div className="space-y-3 pt-3 border-t border-border-normal/40 text-xs">
                  <span className="font-mono text-[10px] text-text-muted block font-semibold">AUDIT CHAIN TIMELINE</span>
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {detail.history.map((h) => (
                      <div key={h.id} className="flex gap-2.5 items-start">
                        {h.action === 'Issued' ? (
                          <ArrowUpRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        ) : h.action === 'Returned' ? (
                          <ArrowDownLeft className="w-4 h-4 text-cyber-success shrink-0 mt-0.5" />
                        ) : (
                          <ClipboardList className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-text-heading font-medium leading-tight">{h.action} - <span className="font-mono text-[11px] font-semibold">{h.holder || 'Warehouse'}</span></p>
                          {h.notes && <p className="text-[10px] text-text-muted leading-tight mt-0.5">{h.notes}</p>}
                          <span className="text-[9px] text-text-muted font-mono">{new Date(h.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ADD ASSET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAsset}
            className="bg-bg-surface border border-border-normal rounded-xl max-w-md w-full flex flex-col shadow-2xl animate-in scale-in duration-200"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">{"// Register System Asset"}</h3>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">Initialize device tracking barcode parameters.</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Asset ID Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="CYBERX-CAM-01"
                    value={formAssetId}
                    onChange={(e) => setFormAssetId(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Device Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sony Alpha A6400 Camera"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="h-10 px-2 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono text-[11px]"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Audio">Audio</option>
                    <option value="Optics">Optics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Condition</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    className="h-10 px-2 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono text-[11px]"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Needs Repair">Needs Repair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold font-mono">LOCATION</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Purchase Cost</label>
                  <input
                    type="number"
                    value={formPurchaseCost}
                    onChange={(e) => setFormPurchaseCost(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Purchase Date</label>
                  <input
                    type="date"
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono text-[11px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Warranty period</label>
                  <input
                    type="text"
                    value={formWarranty}
                    onChange={(e) => setFormWarranty(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Vendor Name</label>
                <input
                  type="text"
                  placeholder="Amazon India, Croma, local vendor"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-10 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated text-xs font-semibold font-mono transition-colors"
              >
                CANCEL
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold text-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'SAVING...' : 'REGISTER ASSET'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CHECKOUT ISSUE MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCheckoutSubmit} className="bg-bg-surface border border-border-normal rounded-xl max-w-sm w-full p-4 sm:p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border-normal pb-3">
              <h3 className="font-display font-bold text-text-heading text-sm">{"// Issue Device to Member"}</h3>
              <button type="button" onClick={() => setShowCheckoutModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Select Holder Member *</label>
                <select
                  required
                  value={checkoutHolderId}
                  onChange={(e) => setCheckoutHolderId(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                >
                  <option value="">Choose profile...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Checkout Notes</label>
                <input
                  type="text"
                  placeholder="e.g. For sponsorship presentation..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="h-9 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated font-mono"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!checkoutHolderId}
                className="h-9 px-5 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold font-mono disabled:opacity-50"
              >
                CONFIRM ISSUE
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReturnSubmit} className="bg-bg-surface border border-border-normal rounded-xl max-w-sm w-full p-4 sm:p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border-normal pb-3">
              <h3 className="font-display font-bold text-text-heading text-sm">{"// Return Device to inventory"}</h3>
              <button type="button" onClick={() => setShowReturnModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Device Condition on Return</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono text-[11px]"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Needs Repair">Needs Repair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Return comments / details</label>
                <input
                  type="text"
                  placeholder="e.g. Returned clean and functioning..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="h-9 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated font-mono"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold font-mono"
              >
                CONFIRM RETURN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAINTENANCE REPAIRS MODAL */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleMaintenanceSubmit} className="bg-bg-surface border border-border-normal rounded-xl max-w-sm w-full p-4 sm:p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border-normal pb-3">
              <h3 className="font-display font-bold text-text-heading text-sm">
                {maintAction === 'Start' ? "// Report Device Repair" : "// Resolve Repair log"}
              </h3>
              <button type="button" onClick={() => setShowMaintenanceModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-sans">
              {maintAction === 'Start' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Repair Issue Details *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe what is damaged or malfunctioned..."
                    value={maintIssue}
                    onChange={(e) => setMaintIssue(e.target.value)}
                    className="p-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none resize-none"
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-heading font-semibold">Resolution Summary *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Replaced batteries / fixed lens glass..."
                      value={maintResolution}
                      onChange={(e) => setMaintResolution(e.target.value)}
                      className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-heading font-semibold">Repair Cost (INR)</label>
                    <input
                      type="number"
                      value={maintCost}
                      onChange={(e) => setMaintCost(e.target.value)}
                      className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="h-9 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated font-mono"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold font-mono"
              >
                SUBMIT LOG
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
