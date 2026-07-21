'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '@/context/AppContext';
import { AppConfig } from '@/lib/config';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Calendar,
  BookOpen,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Code2,
  Share2,
} from 'lucide-react';

interface MeetingNote {
  id: string;
  date: string;
  agenda: string;
  notes: string;
  refLink: string | null;
  createdBy: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function MeetingsPanel() {
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingNote | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form states
  const [formDate, setFormDate] = useState('');
  const [formAgenda, setFormAgenda] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formRefLink, setFormRefLink] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [formIsPublic, setFormIsPublic] = useState(false);

  const notify = (msg: string, ok: boolean) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) setMeetings(await res.json());
    } catch {
      notify('Failed to load meeting notes.', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const openAdd = () => {
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormAgenda('');
    setFormNotes('');
    setFormRefLink('');
    setFormError('');
    setPreviewMode(false);
    setFormIsPublic(false);
    setEditingMeeting(null);
    setShowAddModal(true);
  };

  const openEdit = (m: MeetingNote) => {
    setFormDate(new Date(m.date).toISOString().substring(0, 10));
    setFormAgenda(m.agenda);
    setFormNotes(m.notes);
    setFormRefLink(m.refLink || '');
    setFormError('');
    setPreviewMode(false);
    setFormIsPublic(m.isPublic || false);
    setEditingMeeting(m);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingMeeting(null);
    setPreviewMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgenda.trim() || !formNotes.trim()) {
      setFormError('Agenda and meeting notes are required.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const body = {
        date: new Date(formDate).toISOString(),
        agenda: formAgenda.trim(),
        notes: formNotes,
        refLink: formRefLink.trim() || null,
        isPublic: formIsPublic,
      };

      const res = editingMeeting
        ? await fetch(`/api/meetings/${editingMeeting.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to save.'); return; }

      notify(editingMeeting ? 'Meeting note updated.' : 'Meeting note logged.', true);
      closeModal();
      fetchMeetings();
    } catch {
      setFormError('Network error.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (m: MeetingNote) => {
    if (!confirm(`Delete meeting notes for "${m.agenda}"?`)) return;
    try {
      const res = await fetch(`/api/meetings/${m.id}`, { method: 'DELETE' });
      if (res.ok) { notify('Meeting note deleted.', true); fetchMeetings(); }
      else notify('Failed to delete.', false);
    } catch {
      notify('Network error.', false);
    }
  };

  const toggleExpand = (id: string) =>
    setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>{'// Logged Meeting Notes'}</span>
          </h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">
            Document meetings, agendas, decisions and action items with full Markdown support
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-90 text-black font-semibold text-xs transition-all duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log Meeting
        </button>
      </div>

      {/* Toast */}
      {notification && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[11px] font-mono animate-in fade-in duration-150 ${
          notification.ok
            ? 'bg-cyber-success/10 border-cyber-success/30 text-cyber-success'
            : 'bg-cyber-danger/10 border-cyber-danger/30 text-cyber-danger'
        }`}>
          {notification.ok
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {notification.msg}
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="bg-bg-surface border border-border-normal rounded-xl p-12 text-center text-text-muted font-mono text-xs animate-pulse">
          <Loader className="w-4 h-4 animate-spin inline mr-2 text-primary" />
          {'// Syncing logs from registry...'}
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-bg-surface border border-border-normal rounded-xl p-12 text-center text-text-muted font-mono text-xs">
          {'// No meeting logs present. Click "Log Meeting" to add the first one.'}
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((m) => {
            const isExpanded = expandedId === m.id;
            return (
              <div
                key={m.id}
                className="bg-bg-surface border border-border-normal hover:border-border-hover rounded-xl overflow-hidden transition-all duration-150"
              >
                {/* Card header */}
                <div
                  onClick={() => toggleExpand(m.id)}
                  className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer select-none hover:bg-bg-elevated/10 gap-3 sm:gap-0"
                >
                  <div className="flex items-center gap-4 flex-wrap min-w-0">
                    <div className="flex items-center gap-2 text-primary font-mono text-xs shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <h4 className="font-display font-bold text-text-heading text-sm sm:text-base truncate">
                      {m.agenda}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:ml-4 justify-end">
                    <span className="text-[10px] text-text-muted font-mono hidden lg:inline">
                      by <b className="text-text-heading">{m.createdBy}</b>
                    </span>
                    {m.isPublic && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const publicUrl = `${window.location.origin}/public/meetings/${m.id}`;
                            navigator.clipboard.writeText(publicUrl);
                            notify('Public link copied to clipboard!', true);
                          }}
                          className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                          title="Copy Public Link"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const publicUrl = `${window.location.origin}/public/meetings/${m.id}`;
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: m.agenda,
                                  text: `Check out this meeting note: ${m.agenda}`,
                                  url: publicUrl,
                                });
                              } catch (error) {
                                console.error('Error sharing:', error);
                              }
                            } else {
                              navigator.clipboard.writeText(publicUrl);
                              notify('Public link copied to clipboard!', true);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                          title="Share Public Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                      className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-text-heading transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(m); }}
                      className="p-1.5 rounded hover:bg-cyber-danger/10 text-text-muted hover:text-cyber-danger transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-text-muted pl-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Expanded markdown view */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-border-normal/40 bg-black/5 space-y-4 animate-in slide-in-from-top-1 duration-150">

                    {/* Markdown rendered output */}
                    <div className="prose-meeting bg-bg-primary/60 border border-border-normal/60 rounded-xl p-5 overflow-x-auto">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                          ),
                        }}
                      >
                        {m.notes}
                      </ReactMarkdown>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-[10px] font-mono text-text-muted">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>Logged by: <b className="text-text-heading">{m.createdBy}</b></span>
                        <span className="mx-1">·</span>
                        <span>{new Date(m.createdAt).toLocaleString()}</span>
                        <span className="mx-1">·</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${m.isPublic ? 'bg-cyber-success/15 text-cyber-success border border-cyber-success/20' : 'bg-text-muted/10 text-text-muted border border-border-normal'}`}>
                          {m.isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </span>
                      </div>
                      {m.refLink && (
                        <a
                          href={m.refLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          Reference Link
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
          <div className="bg-bg-surface border border-border-normal rounded-xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-150 mb-10">

            {/* Modal header */}
            <div className="px-4 sm:px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">
                  {editingMeeting ? '// Edit Meeting Note' : '// Log New Meeting'}
                </h3>
                <span className="text-[10px] text-text-muted font-mono">
                  Full Markdown supported — headings, tables, code blocks, task lists & more
                </span>
              </div>
              <button onClick={closeModal} className="text-text-muted hover:text-text-heading p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">

              {/* Date + Agenda row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted tracking-wider">MEETING DATE *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary transition-colors font-mono text-xs"
                    disabled={formLoading}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-3">
                  <label className="text-[10px] font-mono text-text-muted tracking-wider">MEETING AGENDA *</label>
                  <input
                    type="text"
                    value={formAgenda}
                    onChange={(e) => { setFormAgenda(e.target.value); setFormError(''); }}
                    className="h-10 bg-bg-primary border border-border-normal rounded-lg px-3.5 text-text-heading focus:outline-none focus:border-primary transition-colors text-xs"
                    placeholder="e.g. Budget Review Q3 2026, Integration Planning"
                    disabled={formLoading}
                  />
                </div>
              </div>

              {/* Notes editor with preview toggle */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-text-muted tracking-wider">
                    MEETING NOTES * <span className="opacity-60 normal-case">— Markdown supported</span>
                  </label>
                  <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-0.5 border border-border-normal">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                        !previewMode ? 'bg-primary text-black font-bold' : 'text-text-muted hover:text-text-heading'
                      }`}
                    >
                      <Code2 className="w-3 h-3" /> Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(true)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                        previewMode ? 'bg-primary text-black font-bold' : 'text-text-muted hover:text-text-heading'
                      }`}
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>
                </div>

                {!previewMode ? (
                  <textarea
                    rows={14}
                    value={formNotes}
                    onChange={(e) => { setFormNotes(e.target.value); setFormError(''); }}
                    className="p-4 bg-bg-primary border border-border-normal rounded-lg text-text-heading font-mono focus:outline-none focus:border-primary transition-colors resize-y placeholder-text-muted text-[11px] leading-relaxed"
                    placeholder={`# Meeting Title\n\n## Agenda\n- Item 1\n- Item 2\n\n## Notes\n\nKey discussion points...\n\n## Action Items\n- [ ] Task 1 (Owner)\n- [ ] Task 2 (Owner)\n\n## Decisions Made\n| Decision | Owner | Deadline |\n|----------|-------|----------|\n| ...      | ...   | ...      |`}
                    disabled={formLoading}
                  />
                ) : (
                  <div className="prose-meeting bg-bg-primary border border-border-normal rounded-lg p-4 min-h-[280px] overflow-x-auto">
                    {formNotes.trim() ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                          ),
                        }}
                      >
                        {formNotes}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-text-muted font-mono text-[10px] italic">
                        {'// Nothing to preview yet — switch to Write and type some notes.'}
                      </p>
                    )}
                  </div>
                )}

                {/* MD cheatsheet */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-text-muted pt-0.5">
                  {[
                    ['#', 'Heading'], ['**bold**', 'Bold'], ['*italic*', 'Italic'],
                    ['`code`', 'Inline'], ['```', 'Code Block'], ['- item', 'Bullet'],
                    ['1.', 'Numbered'], ['- [ ]', 'Task'], ['> text', 'Quote'],
                    ['| col |', 'Table'], ['---', 'Divider'], ['~~text~~', 'Strike'],
                    ['[text](url)', 'Link'],
                  ].map(([syntax, label]) => (
                    <span key={syntax}>
                      <span className="text-primary">{syntax}</span>
                      <span className="ml-1 opacity-70">{label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Reference Link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-text-muted tracking-wider">REFERENCE LINK (OPTIONAL)</label>
                <input
                  type="url"
                  value={formRefLink}
                  onChange={(e) => setFormRefLink(e.target.value)}
                  className="h-10 bg-bg-primary border border-border-normal rounded-lg px-3.5 text-text-heading focus:outline-none focus:border-primary transition-colors font-mono text-[11px]"
                  placeholder={`https://github.com/${AppConfig.prefix}-org/issues/42 or any reference URL`}
                  disabled={formLoading}
                />
              </div>

              {/* Public Visibility Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-bg-primary/40 border border-border-normal rounded-lg">
                <div>
                  <span className="text-[10px] font-mono text-text-heading block font-semibold">PUBLIC LINK SHARING</span>
                  <span className="text-[9px] text-text-muted font-mono">Anyone with the link can view this meeting log.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsPublic}
                    onChange={(e) => setFormIsPublic(e.target.checked)}
                    className="sr-only peer"
                    disabled={formLoading}
                  />
                  <div className="relative w-9 h-5 bg-bg-surface border border-border-normal rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted peer-checked:after:bg-black peer-checked:bg-primary after:border-none after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-focus:outline-none"></div>
                </label>
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-cyber-danger shrink-0" />
                  <p className="text-[11px] text-cyber-danger font-mono">{formError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-normal/40">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 px-4 border border-border-normal text-text-body hover:bg-bg-elevated rounded-lg transition-colors font-semibold text-xs"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-primary hover:bg-opacity-90 text-black rounded-lg transition-colors font-bold flex items-center gap-2 min-w-[110px] justify-center text-xs"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    editingMeeting ? 'Update Note' : 'Save Notes'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
