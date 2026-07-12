'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Send, Megaphone, Loader, Bell, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  status: string;
  timestamp: string;
}

export function AnnouncementsPanel() {
  const { role } = useApp();
  const [announcements, setAnnouncements] = useState<NotificationItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; success: boolean } | null>(null);

  const isAuthorized = true;

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        // Filter or display notifications
        const list = data.notifications || [];
        setAnnouncements(list);
      }
    } catch (err) {
      console.error('Error fetching announcement history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      setStatusMsg({ text: 'Title and Message Body are required.', success: false });
      return;
    }

    setSending(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast',
          title,
          body,
          url: redirectUrl || '/dashboard',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch push notification.');
      }

      setStatusMsg({
        text: `Success! Broadcast notification dispatched to ${data.sentCount} active devices.`,
        success: true,
      });
      setTitle('');
      setBody('');
      setRedirectUrl('');
      fetchHistory(); // Refresh history list
      
      setTimeout(() => setStatusMsg(null), 6000);
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error sending announcement.', success: false });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-text-heading tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            {'// Announcements & Push Broadcast'}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Send real-time browser push notifications and view broadcast alert archives.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SENDER FORM PANEL */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-surface border border-border-normal rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-display font-bold text-text-heading mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              {'// New Push Broadcast'}
            </h3>

            {!isAuthorized ? (
              <div className="flex items-start gap-3 p-4 bg-cyber-danger/10 border border-cyber-danger/20 rounded-xl text-xs text-cyber-danger font-mono">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold">Access Denied:</span> You are logged in as{' '}
                  <span className="underline">{role}</span>. Only Super Admins and Co-Founders are
                  authorized to dispatch push notifications to the community.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-text-muted tracking-wider">ANNOUNCEMENT TITLE</label>
                    <input
                      type="text"
                      placeholder="e.g. Critical Update Scheduled"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border-normal bg-bg-primary text-sm text-text-heading focus:outline-none focus:border-primary placeholder-text-muted transition-all font-sans"
                      required
                      disabled={sending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-text-muted tracking-wider">REDIRECT PATH (OPTIONAL)</label>
                    <input
                      type="text"
                      placeholder="e.g. /dashboard?tab=events"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border-normal bg-bg-primary text-sm text-text-heading focus:outline-none focus:border-primary placeholder-text-muted transition-all font-mono"
                      disabled={sending}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted tracking-wider">MESSAGE BODY</label>
                  <textarea
                    placeholder="Describe the details of your announcement. This will show on all device screen alerts..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-28 p-3 rounded-lg border border-border-normal bg-bg-primary text-sm text-text-heading focus:outline-none focus:border-primary placeholder-text-muted transition-all resize-none font-sans"
                    required
                    disabled={sending}
                  />
                </div>

                {statusMsg && (
                  <div
                    className={`p-3 rounded-lg text-xs font-mono border flex items-center gap-2 ${
                      statusMsg.success
                        ? 'bg-cyber-success/10 border-cyber-success/30 text-cyber-success'
                        : 'bg-cyber-danger/10 border-cyber-danger/30 text-cyber-danger'
                    }`}
                  >
                    {statusMsg.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                    <span>{statusMsg.text}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={sending || !title || !body}
                    className="px-6 h-10 rounded-lg bg-primary hover:bg-opacity-90 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {sending ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        <span>Broadcasting to community...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Push Announcement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ARCHIVE / HISTORY LIST */}
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-normal rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
            <h3 className="text-sm font-display font-bold text-text-heading mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              {'// Notification Log'}
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 font-sans">
              {loadingHistory ? (
                <div className="h-full flex items-center justify-center text-text-muted font-mono text-xs animate-pulse">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Loading logs...
                </div>
              ) : announcements.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-muted font-mono text-[10px] text-center">
                  {'// No broadcast history found.'}
                </div>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-bg-primary rounded-lg border border-border-normal/40 hover:border-border-normal transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[8px] font-mono uppercase font-bold tracking-wider">
                        {item.type || 'Alert'}
                      </span>
                      <span className="text-[9px] text-text-muted font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-text-heading font-medium leading-relaxed break-words">
                      {item.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
