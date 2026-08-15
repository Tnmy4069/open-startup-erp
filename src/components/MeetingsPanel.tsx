'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
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
  Bot,
  Video,
  Radio,
  Copy,
  Check,
  BarChart2,
  TrendingUp,
  TrendingDown,
  ListChecks,
  Users,
  RefreshCw,
  Minus,
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

interface MeetingAnalytics {
  totalMeetings: number;
  fathomMeetings: number;
  manualMeetings: number;
  publicMeetings: number;
  thisMonthMeetings: number;
  lastMonthMeetings: number;
  meetingGrowth: number;
  avgPerWeek: number;
  actionItemsTotal: number;
  actionItemsCompleted: number;
  actionItemsPending: number;
  actionItemsCompletionRate: number;
  monthlyTrend: { month: string; total: number; fathom: number; manual: number }[];
  topCreators: { name: string; count: number }[];
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
  const [showFathomInfo, setShowFathomInfo] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'analytics'>('notes');
  const [analytics, setAnalytics] = useState<MeetingAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);


  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/webhooks/fathom`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
    notify('Fathom webhook URL copied to clipboard!', true);
  };


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

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/meetings/analytics');
      if (res.ok) setAnalytics(await res.json());
    } catch {
      notify('Failed to load analytics.', false);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, fetchAnalytics]);


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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFathomInfo(!showFathomInfo)}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-bg-elevated border border-border-normal hover:border-primary/50 text-text-heading text-xs font-mono transition-all duration-150 shrink-0"
            title="Fathom AI Integration Settings"
          >
            <Radio className="w-3.5 h-3.5 text-cyber-success animate-pulse" />
            <span>Fathom Sync</span>
          </button>
          {activeTab === 'notes' && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-90 text-black font-semibold text-xs transition-all duration-150 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Log Meeting
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-bg-elevated border border-border-normal rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all duration-150 ${
            activeTab === 'notes'
              ? 'bg-primary text-black shadow-sm'
              : 'text-text-muted hover:text-text-heading'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Meeting Notes
          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/20">
            {meetings.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all duration-150 ${
            activeTab === 'analytics'
              ? 'bg-primary text-black shadow-sm'
              : 'text-text-muted hover:text-text-heading'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Analytics
        </button>
      </div>


      {/* Fathom Info & Webhook Banner */}
      {showFathomInfo && (
        <div className="bg-bg-surface border border-primary/30 rounded-xl p-4 sm:p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-text-heading text-sm">
                Fathom AI Auto-Sync Integration
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyber-success/20 text-cyber-success border border-cyber-success/30">
                ACTIVE
              </span>
            </div>
            <button
              onClick={() => setShowFathomInfo(false)}
              className="text-text-muted hover:text-text-heading p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-text-muted font-mono leading-relaxed">
            Every meeting recorded by <b>Fathom AI Notetaker</b> automatically imports notes, AI summary, action items, and video links into this section.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-bg-primary border border-border-normal rounded-lg text-xs font-mono">
            <div className="flex items-center gap-2 overflow-hidden text-[11px]">
              <span className="text-text-muted shrink-0">Webhook URL:</span>
              <code className="text-primary truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/fathom` : '/api/webhooks/fathom'}
              </code>
            </div>
            <button
              onClick={copyWebhookUrl}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-md shrink-0 font-bold transition-colors text-[11px]"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWebhook ? 'Copied!' : 'Copy Webhook URL'}
            </button>
          </div>
        </div>
      )}


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

      {/* ── ANALYTICS TAB ─────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {analyticsLoading || !analytics ? (
            <div className="bg-bg-surface border border-border-normal rounded-xl p-12 text-center text-text-muted font-mono text-xs animate-pulse">
              <Loader className="w-4 h-4 animate-spin inline mr-2 text-primary" />
              {'// Crunching meeting data...'}
            </div>
          ) : (
            <>
              {/* Refresh button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchAnalytics}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-text-muted hover:text-text-heading border border-border-normal hover:border-border-hover rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {/* KPI Row 1 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Meetings', value: analytics.totalMeetings, icon: <BookOpen className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'Fathom AI Logs', value: analytics.fathomMeetings, icon: <Bot className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'This Month', value: analytics.thisMonthMeetings, icon: <Calendar className="w-4 h-4" />, color: 'text-cyber-success', bg: 'bg-cyber-success/10', sub: analytics.meetingGrowth > 0 ? `+${analytics.meetingGrowth}% vs last month` : analytics.meetingGrowth < 0 ? `${analytics.meetingGrowth}% vs last month` : 'Same as last month', subIcon: analytics.meetingGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : analytics.meetingGrowth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" /> },
                  { label: 'Avg / Week', value: analytics.avgPerWeek, icon: <BarChart2 className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-400/10', sub: 'Last 4 weeks' },
                ].map(({ label, value, icon, color, bg, sub, subIcon }) => (
                  <div key={label} className="bg-bg-surface border border-border-normal rounded-xl p-4 space-y-2">
                    <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center`}>
                      {icon}
                    </div>
                    <div>
                      <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
                      <p className="text-[10px] text-text-muted font-mono">{label}</p>
                      {sub && (
                        <p className="flex items-center gap-1 text-[9px] text-text-muted mt-0.5">
                          {subIcon}{sub}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Monthly Trend Bar Chart */}
                <div className="lg:col-span-2 bg-bg-surface border border-border-normal rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-text-heading text-sm flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-primary" />
                      Monthly Meeting Trend
                    </h3>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-text-muted">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-500 inline-block"></span>Fathom AI</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary inline-block"></span>Manual</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={analytics.monthlyTrend} barSize={12} barGap={2}>
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'monospace' }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-normal)', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="fathom" name="Fathom AI" stackId="a" fill="#a855f7" radius={[0,0,0,0]} />
                      <Bar dataKey="manual" name="Manual" stackId="a" fill="var(--color-primary)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Action Items Donut */}
                <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-3">
                  <h3 className="font-display font-bold text-text-heading text-sm flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary" />
                    Action Items
                  </h3>
                  {analytics.actionItemsTotal > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Done', value: analytics.actionItemsCompleted },
                              { name: 'Pending', value: analytics.actionItemsPending },
                            ]}
                            cx="50%" cy="50%" innerRadius={42} outerRadius={60}
                            paddingAngle={3} dataKey="value"
                          >
                            <Cell fill="#22c55e" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-normal)', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyber-success inline-block"></span>Completed</span>
                          <span className="text-cyber-success font-bold">{analytics.actionItemsCompleted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyber-danger inline-block"></span>Pending</span>
                          <span className="text-cyber-danger font-bold">{analytics.actionItemsPending}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border-normal/40 pt-1.5 mt-1">
                          <span className="text-text-muted">Completion Rate</span>
                          <span className={`font-bold ${analytics.actionItemsCompletionRate >= 70 ? 'text-cyber-success' : analytics.actionItemsCompletionRate >= 40 ? 'text-amber-400' : 'text-cyber-danger'}`}>
                            {analytics.actionItemsCompletionRate}%
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-8 text-text-muted text-[11px] font-mono text-center">
                      {'// No action items found in meeting notes yet'}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Creators */}
              <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-3">
                <h3 className="font-display font-bold text-text-heading text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Top Note Creators
                </h3>
                <div className="space-y-2">
                  {analytics.topCreators.map((creator, idx) => {
                    const maxCount = analytics.topCreators[0]?.count || 1;
                    const pct = Math.round((creator.count / maxCount) * 100);
                    const isFathom = creator.name.toLowerCase().includes('fathom');
                    return (
                      <div key={creator.name} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-text-muted w-4 shrink-0">#{idx + 1}</span>
                        <div className="flex items-center gap-1.5 min-w-[120px] shrink-0">
                          {isFathom && <Bot className="w-3 h-3 text-purple-400 shrink-0" />}
                          <span className={`text-[11px] font-mono truncate ${isFathom ? 'text-purple-400' : 'text-text-heading'}`}>
                            {creator.name}
                          </span>
                        </div>
                        <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isFathom ? 'bg-purple-500' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-text-muted shrink-0 w-8 text-right">
                          {creator.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── NOTES TAB ─────────────────────────────────────── */}
      {activeTab === 'notes' && (
      <>{/* Notes list */}
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
                    {m.createdBy.toLowerCase().includes('fathom') && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                        <Bot className="w-3 h-3 text-purple-400" />
                        FATHOM AI
                      </span>
                    )}
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
                          className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded transition-colors ${
                            m.refLink.includes('fathom')
                              ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'text-primary hover:underline'
                          }`}
                        >
                          {m.refLink.includes('fathom') ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-purple-400" />
                              Watch Fathom Recording
                              <ExternalLink className="w-3 h-3 text-purple-400" />
                            </>
                          ) : (
                            <>
                              <LinkIcon className="w-3.5 h-3.5" />
                              Reference Link
                              <ExternalLink className="w-3 h-3" />
                            </>
                          )}
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
      </>
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
