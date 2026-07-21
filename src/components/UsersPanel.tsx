'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole } from '@/context/AppContext';
import {
  Plus, Trash2, Edit2, X, Eye, EyeOff, CheckCircle, AlertCircle, Loader,
  Send, Bell, BellOff, ToggleLeft, ToggleRight, Users, WifiOff
} from 'lucide-react';

interface DBUser {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  hasSubscription: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS: UserRole[] = [
  // 'Super Admin',
  'Co-Founder',
  'Founder',
  'Committee Member',
  'Read Only',
];

const ROLE_COLOR: Record<string, string> = {
  'Super Admin': 'bg-cyber-danger/10 text-cyber-danger border-cyber-danger/20',
  'Co-Founder': 'bg-primary/10 text-primary border-primary/20',
  'Founder': 'bg-cyber-info/10 text-cyber-info border-cyber-info/20',
  'Committee Member': 'bg-cyber-success/10 text-cyber-success border-cyber-success/20',
  'Read Only': 'bg-text-muted/10 text-text-muted border-border-normal',
};

import { AppConfig } from '@/lib/config';

export function UsersPanel() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Add / Edit form state
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<string>('Co-Founder');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastUrl, setBroadcastUrl] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  const notify = (msg: string, ok: boolean) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;

    setSendingBroadcast(true);
    setBroadcastStatus(null);

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast',
          title: broadcastTitle,
          body: broadcastBody,
          url: broadcastUrl || '/dashboard',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send broadcast notification.');
      }

      setBroadcastStatus(`✓ Sent push broadcast to ${data.sentCount} active device${data.sentCount !== 1 ? 's' : ''}.`);
      setBroadcastTitle('');
      setBroadcastBody('');
      setBroadcastUrl('');
      setTimeout(() => setBroadcastStatus(null), 5000);
    } catch (err: any) {
      setBroadcastStatus(`Error: ${err.message}`);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => {
    setFormUsername(''); setFormPassword(''); setFormRole('Co-Founder');
    setFormError(''); setShowPw(false); setEditingUser(null); setShowAddModal(true);
  };

  const openEdit = (u: DBUser) => {
    setFormUsername(u.username); setFormPassword(''); setFormRole(u.role);
    setFormError(''); setShowPw(false); setEditingUser(u); setShowAddModal(true);
  };

  const closeModal = () => { setShowAddModal(false); setEditingUser(null); };

  const handleToggleActive = async (u: DBUser) => {
    setTogglingId(u.id);
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (res.ok) {
        notify(`User "${u.username}" ${!u.isActive ? 'activated' : 'deactivated'}.`, true);
        fetchUsers();
      } else {
        notify('Failed to update status.', false);
      }
    } catch {
      notify('Network error.', false);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername) { setFormError('Username is required.'); return; }
    if (!editingUser && !formPassword) { setFormError('Password is required for new users.'); return; }

    setFormLoading(true); setFormError('');
    try {
      let res: Response;
      if (editingUser) {
        const body: Record<string, string> = { username: formUsername, role: formRole };
        if (formPassword) body.password = formPassword;
        res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formUsername, password: formPassword, role: formRole }),
        });
      }

      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Operation failed.'); return; }

      notify(editingUser ? `User "${formUsername}" updated.` : `User "${formUsername}" created.`, true);
      closeModal();
      fetchUsers();
    } catch {
      setFormError('Network error.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (u: DBUser) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      if (res.ok) {
        notify(`User "${u.username}" deleted.`, true);
        fetchUsers();
      } else {
        notify('Failed to delete user.', false);
      }
    } catch {
      notify('Network error.', false);
    }
  };

  // Derived stats
  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;
  const subscribedCount = users.filter((u) => u.hasSubscription).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">
            {'// User Access Control'}
          </h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">
            Super Admin &mdash; manage system users, roles, and access status
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-90 text-black font-semibold text-xs transition-all duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-text-muted tracking-wider">TOTAL USERS</p>
            <p className="text-xl font-bold text-text-heading font-display">{users.length}</p>
          </div>
        </div>
        <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-success/10 flex items-center justify-center shrink-0">
            <ToggleRight className="w-4 h-4 text-cyber-success" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-text-muted tracking-wider">ACTIVE</p>
            <p className="text-xl font-bold text-cyber-success font-display">{activeCount}</p>
          </div>
        </div>
        <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-danger/10 flex items-center justify-center shrink-0">
            <ToggleLeft className="w-4 h-4 text-cyber-danger" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-text-muted tracking-wider">INACTIVE</p>
            <p className="text-xl font-bold text-cyber-danger font-display">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {notification && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[11px] font-mono animate-in fade-in duration-150 ${notification.ok
          ? 'bg-cyber-success/10 border-cyber-success/30 text-cyber-success'
          : 'bg-cyber-danger/10 border-cyber-danger/30 text-cyber-danger'
          }`}>
          {notification.ok
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {notification.msg}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-bg-surface border border-border-normal rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-border-normal bg-bg-elevated/40 text-text-muted font-mono text-[10px]">
                <th className="py-3.5 px-4">USERNAME</th>
                <th className="py-3.5 px-4">ROLE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">PUSH NOTIFS</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">CREATED</th>
                <th className="py-3.5 px-4 text-center w-28">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-normal text-text-body">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-text-muted font-mono animate-pulse">
                    <Loader className="w-4 h-4 animate-spin inline mr-2" />
                    {'// Loading user registry...'}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-text-muted font-mono">
                    {'// No sub-role users found. Add one above.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-bg-elevated/20 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}
                  >
                    {/* Username */}
                    <td className="py-3 px-4 font-mono font-semibold text-text-heading">
                      <div className="flex items-center gap-2">
                        {u.username}
                        {!u.isActive && (
                          <span className="text-[8px] font-mono bg-cyber-danger/10 text-cyber-danger border border-cyber-danger/20 px-1.5 py-0.5 rounded-full">
                            DISABLED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold font-mono border ${ROLE_COLOR[u.role] || 'bg-bg-elevated text-text-muted'}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Active Status Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={togglingId === u.id}
                        title={u.isActive ? 'Click to deactivate' : 'Click to activate'}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border transition-all cursor-pointer ${u.isActive
                          ? 'bg-cyber-success/10 text-cyber-success border-cyber-success/25 hover:bg-cyber-success/20'
                          : 'bg-cyber-danger/10 text-cyber-danger border-cyber-danger/25 hover:bg-cyber-danger/20'
                          }`}
                      >
                        {togglingId === u.id ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : u.isActive ? (
                          <ToggleRight className="w-3.5 h-3.5" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5" />
                        )}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Push Subscription */}
                    <td className="py-3 px-4">
                      {u.hasSubscription ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyber-info">
                          <Bell className="w-3.5 h-3.5" />
                          <span>Subscribed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
                          <BellOff className="w-3.5 h-3.5" />
                          <span>No device</span>
                        </div>
                      )}
                    </td>

                    {/* Created */}
                    <td className="py-3 px-4 text-text-muted hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded bg-bg-elevated hover:bg-bg-primary text-text-muted hover:text-text-heading transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded bg-bg-elevated hover:bg-cyber-danger/15 text-text-muted hover:text-cyber-danger transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer legend */}
        {!loading && users.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border-normal bg-bg-elevated/20 flex flex-wrap items-center gap-4 text-[10px] font-mono text-text-muted">
            <span className="flex items-center gap-1.5">
              <Bell className="w-3 h-3 text-cyber-info" />
              {subscribedCount} of {users.length} users have push notifications enabled
            </span>
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-3 h-3" />
              {users.length - subscribedCount} without device subscription
            </span>
          </div>
        )}
      </div>

      {/* Broadcast Push Notification */}
      <div className="bg-bg-surface border border-border-normal rounded-xl p-6 mt-6">
        <h3 className="text-sm font-display font-bold text-text-heading mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          {'// Broadcast Push Notification'}
        </h3>
        <p className="text-xs text-text-muted mb-4 font-sans">
          Send a push alert directly to all active browser sessions and home screen installations of {AppConfig.name}.
          <span className="ml-2 font-mono text-cyber-info">{subscribedCount} subscribed device{subscribedCount !== 1 ? 's' : ''} will receive this.</span>
        </p>

        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted tracking-wider">NOTIFICATION TITLE</label>
              <input
                type="text"
                placeholder="e.g., Campus Session Scheduled"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border-normal bg-bg-primary text-sm text-text-heading focus:outline-none focus:border-primary placeholder-text-muted transition-all font-sans"
                required
                disabled={sendingBroadcast}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted tracking-wider">TARGET REDIRECT PATH / URL</label>
              <input
                type="text"
                placeholder="e.g., /dashboard?tab=events"
                value={broadcastUrl}
                onChange={(e) => setBroadcastUrl(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border-normal bg-bg-primary text-sm text-text-heading focus:outline-none focus:border-primary placeholder-text-muted transition-all font-mono"
                disabled={sendingBroadcast}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted tracking-wider">ALERT MESSAGE / BODY</label>
            <textarea
              placeholder="Enter push alert message description..."
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              className="w-full h-20 p-3 rounded-lg border border-border-normal bg-bg-primary text-sm text-text-heading focus:outline-none focus:border-primary placeholder-text-muted transition-all resize-none font-sans"
              required
              disabled={sendingBroadcast}
            />
          </div>

          {broadcastStatus && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${broadcastStatus.startsWith('Error')
                ? 'bg-cyber-danger/10 border-cyber-danger/30 text-cyber-danger'
                : 'bg-cyber-success/10 border-cyber-success/30 text-cyber-success'
              }`}>
              {broadcastStatus}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={sendingBroadcast || !broadcastTitle || !broadcastBody}
              className="px-5 h-10 rounded-lg bg-primary hover:bg-opacity-90 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              {sendingBroadcast ? (
                <>
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast Alert</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-normal rounded-xl w-full max-w-md shadow-2xl animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">
                  {editingUser ? '// Edit User' : '// New User Account'}
                </h3>
                <span className="text-[10px] text-text-muted font-mono">
                  {editingUser ? `Editing: ${editingUser.username}` : 'Create a new system user with a specific role'}
                </span>
              </div>
              <button onClick={closeModal} className="text-text-muted hover:text-text-heading p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-muted tracking-wider">USERNAME</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => { setFormUsername(e.target.value); setFormError(''); }}
                  className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-sm text-text-heading font-mono focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. john_founder"
                  disabled={formLoading}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-muted tracking-wider">
                  PASSWORD {editingUser && <span className="text-text-muted/60">(leave blank to keep unchanged)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => { setFormPassword(e.target.value); setFormError(''); }}
                    className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 pr-10 text-sm text-text-heading font-mono focus:outline-none focus:border-primary transition-colors"
                    placeholder={editingUser ? '••••••••' : 'min 6 characters'}
                    disabled={formLoading}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-muted tracking-wider">ROLE</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-sm text-text-heading font-sans focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  disabled={formLoading}
                >
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-cyber-danger shrink-0" />
                  <p className="text-[11px] text-cyber-danger font-mono">{formError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formLoading}
                  className="flex-1 h-10 rounded-lg border border-border-normal hover:bg-bg-elevated text-text-body text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 h-10 rounded-lg bg-primary text-black font-bold text-sm transition-all hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : editingUser ? 'Save Changes' : 'Create User'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
