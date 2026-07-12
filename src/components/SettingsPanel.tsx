import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, ShieldAlert, CreditCard, Tags, Save, KeyRound, Eye, EyeOff, CheckCircle, X, Bell, BellOff } from 'lucide-react';

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
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check current subscription status on mount
  const checkSubscriptionStatus = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) { setIsSubscribed(false); return; }
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSwSupported('serviceWorker' in navigator && 'PushManager' in window);
      setNotificationPermission(Notification.permission);
      checkSubscriptionStatus();
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

      // Ensure SW is registered
      if (!navigator.serviceWorker.controller) {
        await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      }

      // Use navigator.serviceWorker.ready — resolves once SW is activated
      await subscribeWithReady();
      setIsSubscribed(true);
    } catch (e) {
      console.error(e);
      alert('Subscription failed: ' + (e as Error).message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setUnsubscribing(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) { setIsSubscribed(false); return; }
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Remove from DB first
        await fetch('/api/alerts', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        // Then unsubscribe from browser
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      setSubSuccess(false);
      triggerNotification('Push notifications have been disabled on this device.', 'Unsubscribed');
    } catch (e) {
      console.error(e);
      alert('Unsubscribe failed: ' + (e as Error).message);
    } finally {
      setUnsubscribing(false);
    }
  };

  const subscribeWithReady = async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      alert('VAPID public key is missing in environment.');
      return;
    }

    // navigator.serviceWorker.ready resolves when a SW with "activated" status exists.
    // Add a 12s timeout in case it hangs (e.g. stale SW stuck in installing state).
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(
          'Service Worker is taking too long to activate.\n\n' +
          'Fix: Open DevTools → Application → Service Workers → click "skipWaiting" or "Unregister", then reload the page.'
        )), 12000)
      ),
    ]);

    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    // Check for existing subscription first
    const existingSub = await registration.pushManager.getSubscription();
    const subscription = existingSub || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', subscription }),
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
                  {'// Device Notification Settings'}
                </h3>
                <p className="text-[10px] text-text-muted font-mono mt-2">
                  Manage push notification subscriptions for this specific browser / device.
                </p>
              </div>

              {!swSupported ? (
                <div className="p-4 rounded-xl border border-cyber-danger/20 bg-cyber-danger/5 space-y-2">
                  <div className="flex items-center gap-2 text-cyber-danger font-mono font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Browser Not Supported</span>
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    This browser does not support Service Workers or Push Notifications.
                    Try Chrome, Firefox, or Edge over HTTPS.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* Permission banner */}
                  {notificationPermission === 'denied' && (
                    <div className="p-4 rounded-xl border border-cyber-danger/20 bg-cyber-danger/5 space-y-1.5">
                      <div className="flex items-center gap-2 text-cyber-danger font-semibold text-xs">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        Notifications Blocked by Browser
                      </div>
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        Click the 🔒 icon in your browser address bar → Site Settings → Notifications → Allow.
                        Then reload the page.
                      </p>
                    </div>
                  )}

                  {/* Current Status Card */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isSubscribed
                      ? 'border-cyber-success/30 bg-cyber-success/5'
                      : 'border-border-normal bg-bg-elevated/10'
                  }`}>

                    {/* Status row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSubscribed ? 'bg-cyber-success/15' : 'bg-text-muted/10'
                        }`}>
                          {isSubscribed
                            ? <Bell className="w-4 h-4 text-cyber-success" />
                            : <BellOff className="w-4 h-4 text-text-muted" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold font-mono ${
                            isSubscribed ? 'text-cyber-success' : 'text-text-muted'
                          }`}>
                            {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                          </p>
                          <p className="text-[9px] text-text-muted font-mono">
                            {isSubscribed
                              ? 'This device will receive push alerts'
                              : 'No push alerts on this device'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                        notificationPermission === 'granted'
                          ? 'bg-cyber-success/10 text-cyber-success border-cyber-success/20'
                          : notificationPermission === 'denied'
                          ? 'bg-cyber-danger/10 text-cyber-danger border-cyber-danger/20'
                          : 'bg-cyber-warning/10 text-cyber-warning border-cyber-warning/20'
                      }`}>
                        {notificationPermission.toUpperCase()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {notificationPermission !== 'denied' && (
                      <div className="flex gap-2 pt-1">
                        {!isSubscribed ? (
                          <button
                            onClick={handleSubscribe}
                            disabled={subscribing}
                            className="flex-1 h-10 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {subscribing ? (
                              <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                            <span>{subscribing ? 'Enabling...' : 'Enable Push Notifications'}</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleSubscribe}
                              disabled={subscribing || unsubscribing}
                              className="flex-1 h-10 rounded-lg border border-border-normal hover:bg-bg-elevated text-text-heading font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {subscribing ? (
                                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full" />
                              ) : (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                              <span>Re-Sync</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Disable push notifications on this device? You can re-enable anytime.')) {
                                  handleUnsubscribe();
                                }
                              }}
                              disabled={unsubscribing || subscribing}
                              className="flex-1 h-10 rounded-lg bg-cyber-danger/10 hover:bg-cyber-danger/20 border border-cyber-danger/25 text-cyber-danger font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {unsubscribing ? (
                                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full" />
                              ) : (
                                <BellOff className="w-3.5 h-3.5" />
                              )}
                              <span>{unsubscribing ? 'Disabling...' : 'Unsubscribe'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Test notification (only when subscribed) */}
                  {isSubscribed && notificationPermission === 'granted' && (
                    <div className="p-4 rounded-xl border border-border-normal bg-bg-surface space-y-3 animate-in fade-in duration-200">
                      <span className="text-[10px] font-mono text-text-muted block">VERIFICATION TOOL</span>
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        Send a test notification to verify this device is receiving push alerts correctly.
                      </p>
                      <button
                        onClick={handleSendTestNotification}
                        className="h-10 px-4 rounded-lg bg-cyber-success/15 hover:bg-cyber-success/20 text-cyber-success border border-cyber-success/30 font-semibold text-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Send Test Notification</span>
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
