import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, ShieldAlert, CreditCard, Tags, Save, KeyRound, Eye, EyeOff, CheckCircle, X, Bell } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Waits until the SW registration has an active (not just installing) worker. */
function waitForActiveServiceWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs = 10000
): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    if (registration.active) { resolve(registration); return; }
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Service Worker to activate.')), timeoutMs);
    const trackWorker = (worker: ServiceWorker) => {
      if (worker.state === 'activated') { clearTimeout(timer); resolve(registration); return; }
      worker.addEventListener('statechange', function fn() {
        if (worker.state === 'activated') { worker.removeEventListener('statechange', fn); clearTimeout(timer); resolve(registration); }
      });
    };
    if (registration.installing) trackWorker(registration.installing);
    else if (registration.waiting) trackWorker(registration.waiting);
    else registration.addEventListener('updatefound', function fn() {
      registration.removeEventListener('updatefound', fn);
      if (registration.installing) trackWorker(registration.installing);
    });
  });
}


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

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'banking' | 'ledger' | 'password' | 'notifications'>('general');

  // Push Notifications state
  const [swSupported, setSwSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [subscribing, setSubscribing] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSwSupported('serviceWorker' in navigator && 'PushManager' in window);
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleSubscribe = async () => {
    if (!swSupported) return;
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        alert('Notification permission not granted.');
        setSubscribing(false);
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        // Register if not yet registered
        const newReg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        await subscribeWithReg(newReg);
      } else {
        await subscribeWithReg(registration);
      }
    } catch (e) {
      console.error(e);
      alert('Subscription failed: ' + (e as Error).message);
    } finally {
      setSubscribing(false);
    }
  };

  const subscribeWithReg = async (registration: ServiceWorkerRegistration) => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      alert('VAPID public key is missing in environment.');
      return;
    }

    // Wait for the SW to fully activate before subscribing
    const activeReg = await waitForActiveServiceWorker(registration);

    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    const subscription = await activeReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'subscribe',
        subscription,
      }),
    });

    if (res.ok) {
      setSubSuccess(true);
      triggerNotification('This device is now registered for live push notifications.', 'Subscribed');
    } else {
      throw new Error(await res.text());
    }
  };

  const handleSendTestNotification = async () => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast',
          title: 'CyberX Test Alert',
          body: 'This is a test push notification sent to active devices!',
          url: '/dashboard',
        }),
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Test broadcast sent successfully to ${result.sentCount} devices.`);
      } else {
        alert('Failed to send test broadcast: ' + (await res.text()));
      }
    } catch (err) {
      console.error(err);
      alert('Broadcast request failed.');
    }
  };

  // Change Password states
  const [cpCurrentPw, setCpCurrentPw] = useState('');
  const [cpNewPw, setCpNewPw] = useState('');
  const [cpConfirmPw, setCpConfirmPw] = useState('');
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');

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
    if (role !== 'Super Admin' && role !== 'Co-Founder') {
      alert('Access Denied. Only Super Admin or Co-Founder can change settings.');
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');

    if (cpNewPw !== cpConfirmPw) {
      setCpError('New passwords do not match.');
      return;
    }
    if (cpNewPw.length < 6) {
      setCpError('New password must be at least 6 characters.');
      return;
    }

    setCpLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cpCurrentPw, newPassword: cpNewPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCpError(data.error || 'Failed to update password.');
      } else {
        setCpSuccess('Password updated successfully.');
        setCpCurrentPw(''); setCpNewPw(''); setCpConfirmPw('');
      }
    } catch {
      setCpError('Network error. Please try again.');
    } finally {
      setCpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 font-mono text-xs text-text-muted animate-pulse">
      {"// Syncing configurations..."}
      </div>
    );
  }

  const isReadOnlyUser = role === 'Founder' || role === 'Committee Member' || role === 'Read Only';

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

          <button
            onClick={() => { setActiveSubTab('password'); setCpError(''); setCpSuccess(''); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'password' ? 'bg-primary text-black' : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'notifications' ? 'bg-primary text-black' : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Device Notifications</span>
          </button>

          {isReadOnlyUser && activeSubTab !== 'password' && (
            <div className="mt-8 p-3 rounded-lg border border-cyber-warning/20 bg-cyber-warning/5 text-[10px] text-cyber-warning flex gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-tight">Read-only configurations. Switch simulator role to Super Admin to edit settings.</p>
            </div>
          )}
        </div>

        {/* Settings Right Panel */}
        <div className="flex-1 p-6 text-xs text-sans">

          {/* GENERAL SECTION */}
          {activeSubTab === 'general' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
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

              {!isReadOnlyUser && (
                <div className="flex justify-end pt-4 border-t border-border-normal/40">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-11 px-6 bg-primary hover:bg-opacity-95 text-black rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* BANKING SECTION */}
          {activeSubTab === 'banking' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
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

              {!isReadOnlyUser && (
                <div className="flex justify-end pt-4 border-t border-border-normal/40">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-11 px-6 bg-primary hover:bg-opacity-95 text-black rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* LEDGER CATEGORIES */}
          {activeSubTab === 'ledger' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
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

              {!isReadOnlyUser && (
                <div className="flex justify-end pt-4 border-t border-border-normal/40">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-11 px-6 bg-primary hover:bg-opacity-95 text-black rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* CHANGE PASSWORD SECTION */}
          {activeSubTab === 'password' && (
            <div className="space-y-5 max-w-sm">
              <div>
                <h3 className="text-xs font-semibold text-text-heading font-display tracking-wider border-b border-border-normal/40 pb-1.5">
                  {"// Update Your Password"}
                </h3>
                <p className="text-[10px] text-text-muted font-mono mt-2">Change the password for your current account.</p>
              </div>

              {/* Success */}
              {cpSuccess && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-cyber-success/10 border border-cyber-success/30 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-cyber-success shrink-0" />
                  <p className="text-[11px] text-cyber-success font-mono">{cpSuccess}</p>
                </div>
              )}

              {/* Error */}
              {cpError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
                  <X className="w-4 h-4 text-cyber-danger shrink-0" />
                  <p className="text-[11px] text-cyber-danger font-mono">{cpError}</p>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold tracking-wider uppercase text-[10px] font-mono">Current Password</label>
                  <div className="relative">
                    <input
                      type={cpShowCurrent ? 'text' : 'password'}
                      value={cpCurrentPw}
                      onChange={(e) => { setCpCurrentPw(e.target.value); setCpError(''); }}
                      placeholder="Enter current password"
                      required
                      disabled={cpLoading}
                      className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 pr-10 text-sm text-text-heading font-mono placeholder-text-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setCpShowCurrent((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading">
                      {cpShowCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold tracking-wider uppercase text-[10px] font-mono">New Password</label>
                  <div className="relative">
                    <input
                      type={cpShowNew ? 'text' : 'password'}
                      value={cpNewPw}
                      onChange={(e) => { setCpNewPw(e.target.value); setCpError(''); }}
                      placeholder="Min. 6 characters"
                      required
                      disabled={cpLoading}
                      className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 pr-10 text-sm text-text-heading font-mono placeholder-text-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setCpShowNew((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading">
                      {cpShowNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold tracking-wider uppercase text-[10px] font-mono">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={cpShowConfirm ? 'text' : 'password'}
                      value={cpConfirmPw}
                      onChange={(e) => { setCpConfirmPw(e.target.value); setCpError(''); }}
                      placeholder="Repeat new password"
                      required
                      disabled={cpLoading}
                      className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 pr-10 text-sm text-text-heading font-mono placeholder-text-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setCpShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading">
                      {cpShowConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cpLoading || !cpCurrentPw || !cpNewPw || !cpConfirmPw}
                    className="h-11 px-6 bg-primary hover:bg-opacity-95 text-black rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cpLoading ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>{cpLoading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DEVICE NOTIFICATIONS SECTION */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-6 max-w-lg animate-in fade-in duration-200">
              <div>
                <h3 className="text-xs font-semibold text-text-heading font-display tracking-wider border-b border-border-normal/40 pb-1.5">
                  {"// Device Notification Configurations"}
                </h3>
                <p className="text-[10px] text-text-muted font-mono mt-2">
                  Configure push notifications on this specific browser device.
                </p>
              </div>

              {!swSupported ? (
                <div className="p-4 rounded-xl border border-cyber-danger/20 bg-cyber-danger/5 space-y-2">
                  <div className="flex items-center gap-2 text-cyber-danger font-mono font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Browser Not Supported</span>
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    This browser does not support Service Workers or Push Notifications. Try using Chrome, Firefox or Edge, or make sure you are accessing the site via a secure connection (HTTPS or localhost).
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  
                  {/* Status Indicator */}
                  <div className="p-4 rounded-xl border border-border-normal bg-bg-elevated/10 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted font-mono">Permission Status:</span>
                      <span className={`px-2.5 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider border ${
                        notificationPermission === 'granted'
                          ? 'bg-cyber-success/10 text-cyber-success border-cyber-success/20'
                          : notificationPermission === 'denied'
                          ? 'bg-cyber-danger/10 text-cyber-danger border-cyber-danger/20'
                          : 'bg-cyber-warning/10 text-cyber-warning border-cyber-warning/20'
                      }`}>
                        {notificationPermission}
                      </span>
                    </div>

                    <div className="text-[10px] text-text-muted leading-relaxed">
                      {notificationPermission === 'granted' ? (
                        <p className="text-cyber-success font-semibold">
                          ✓ Push notifications are enabled on this device! You will receive live alerts for ledger activities.
                        </p>
                      ) : notificationPermission === 'denied' ? (
                        <p className="text-cyber-danger">
                          ⚠ Notifications are blocked. Please click the site settings icon in your browser URL bar and change Notification permission to &quot;Allow&quot; to subscribe this device.
                        </p>
                      ) : (
                        <p>
                          Notifications are not yet authorized. Click below to grant permissions and register this browser device.
                        </p>
                      )}
                    </div>

                    {notificationPermission !== 'denied' && (
                      <button
                        onClick={handleSubscribe}
                        disabled={subscribing}
                        className={`w-full h-11 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                          notificationPermission === 'granted'
                            ? 'bg-bg-primary hover:bg-bg-elevated border border-border-normal text-text-heading'
                            : 'bg-primary hover:bg-opacity-95 text-black'
                        }`}
                      >
                        {subscribing ? (
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                        <span>
                          {notificationPermission === 'granted'
                            ? 'Re-Sync Subscription'
                            : subscribing
                            ? 'Requesting...'
                            : 'Enable Push Notifications'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Test Trigger */}
                  {notificationPermission === 'granted' && (
                    <div className="p-4 rounded-xl border border-border-normal bg-bg-surface space-y-3 animate-in fade-in duration-200">
                      <span className="text-[10px] font-mono text-text-muted block">VERIFICATION TOOL</span>
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        Send a test push message broadcast to verify your browser receives notifications correctly.
                      </p>
                      <button
                        onClick={handleSendTestNotification}
                        className="h-10 px-4 rounded-lg bg-cyber-success/15 hover:bg-cyber-success/20 text-cyber-success border border-cyber-success/30 font-semibold text-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Send Test Broadcast</span>
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
