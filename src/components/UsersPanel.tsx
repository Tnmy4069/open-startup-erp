'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole } from '@/context/AppContext';
import {
  Plus, Trash2, Edit2, X, Shield, Eye, EyeOff, CheckCircle, AlertCircle, Loader
} from 'lucide-react';

interface DBUser {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS: Exclude<UserRole, 'Super Admin'>[] = [
  'Co-Founder',
  'Founder',
  'Committee Member',
  'Read Only',
];

const ROLE_COLOR: Record<string, string> = {
  'Co-Founder': 'bg-primary/10 text-primary border-primary/20',
  'Founder': 'bg-cyber-info/10 text-cyber-info border-cyber-info/20',
  'Committee Member': 'bg-cyber-success/10 text-cyber-success border-cyber-success/20',
  'Read Only': 'bg-text-muted/10 text-text-muted border-border-normal',
};

export function UsersPanel() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null);

  // Add / Edit form state
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<string>('Co-Founder');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const notify = (msg: string, ok: boolean) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3500);
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">
            {'// User Access Control'}
          </h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">
            Super Admin &mdash; manage system users and their roles
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

      {/* Super Admin Notice */}
      {/* <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-[11px] font-mono text-text-muted">
        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-primary font-semibold">Super Admin</span> credentials are stored in{' '}
          <code className="text-text-heading bg-bg-elevated px-1 rounded">.env</code> and cannot be
          managed here. Only sub-role users are listed below.
        </div>
      </div> */}

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
                <th className="py-3.5 px-4 hidden sm:table-cell">CREATED</th>
                <th className="py-3.5 px-4 hidden md:table-cell">LAST UPDATED</th>
                <th className="py-3.5 px-4 text-center w-24">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-normal text-text-body">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-text-muted font-mono animate-pulse">
                    <Loader className="w-4 h-4 animate-spin inline mr-2" />
                    {'// Loading user registry...'}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-text-muted font-mono">
                    {'// No sub-role users found. Add one above.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-bg-elevated/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-text-heading">
                      {u.username}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold font-mono border ${ROLE_COLOR[u.role] || 'bg-bg-elevated text-text-muted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-muted hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-text-muted hidden md:table-cell">
                      {new Date(u.updatedAt).toLocaleDateString()}
                    </td>
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
