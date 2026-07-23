'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, User, ExternalLink, AlertTriangle, Loader, CheckCircle, BookOpen } from 'lucide-react';

import { AppConfig } from '@/lib/config';

interface MeetingNote {
  id: string;
  date: string;
  agenda: string;
  notes: string;
  refLink: string | null;
  createdBy: string;
}

export default function PublicMeetingView() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState<MeetingNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchPublicMeeting = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/meetings/${id}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError('This meeting log is not configured for public link sharing.');
          } else {
            setError('Meeting note not found or has been removed.');
          }
          return;
        }
        const data = await res.json();
        setMeeting(data);
      } catch (err: any) {
        setError('Network error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicMeeting();
  }, [id]);

  return (
    <div className="dark min-h-screen bg-[#0A0A0B] text-text-body font-sans antialiased flex flex-col justify-between selection:bg-primary selection:text-black">
      {/* Scanline pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, var(--primary-color) 0px, var(--primary-color) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Navbar header */}
      <header className="border-b border-border-normal bg-bg-surface/30 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={AppConfig.logoUrl} alt={AppConfig.name} className="h-7 w-auto object-contain" />
            <span className="text-text-muted font-mono text-xs hidden sm:inline">|</span>
            <span className="text-[10px] text-text-muted font-mono tracking-widest hidden sm:inline">PUBLIC ARCHIVE</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold font-mono px-2.5 py-1 bg-cyber-success/10 border border-cyber-success/20 text-cyber-success rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-success animate-pulse"></span>
            <span>SECURE LINK</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 z-10 flex flex-col justify-start">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-text-muted font-mono">{"// Compiling document logs from secure node..."}</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto space-y-5">
            <div className="p-4 bg-cyber-danger/10 border border-cyber-danger/25 rounded-full text-cyber-danger">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-text-heading text-lg">Access Denied</h3>
              <p className="text-xs text-text-body leading-relaxed font-sans">{error}</p>
            </div>
          </div>
        ) : meeting ? (
          <article className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header info */}
            <div className="space-y-4 border-b border-border-normal pb-6">
              <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted font-mono">
                <div className="flex items-center gap-1.5 text-primary">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(meeting.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Logged by: <b className="text-text-heading font-semibold">{meeting.createdBy}</b></span>
                </div>
              </div>

              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-heading leading-tight tracking-wide">
                {meeting.agenda}
              </h1>
            </div>

            {/* Notes Section */}
            <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-border-normal/40 pb-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-mono font-semibold tracking-wider text-text-heading">MEETING MINUTES</span>
              </div>

              {/* MD output */}
              <div className="prose-meeting w-full overflow-x-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>
                    ),
                  }}
                >
                  {meeting.notes}
                </ReactMarkdown>
              </div>
            </div>

            {/* Reference Links if any */}
            {meeting.refLink && (
              <div className="flex items-center justify-between p-4 bg-bg-surface border border-border-normal rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-text-heading">Attachments &amp; Resources</h5>
                    <p className="text-[10px] text-text-muted font-mono">{new URL(meeting.refLink).hostname}</p>
                  </div>
                </div>
                <a
                  href={meeting.refLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-bg-elevated hover:bg-bg-primary border border-border-normal rounded-lg text-xs font-semibold text-text-heading transition-colors flex items-center gap-1.5"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </article>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-normal bg-bg-surface/10 py-6 text-center text-[10px] font-mono text-text-muted z-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} CyberX Community. All rights reserved.</span>
          <span className="text-[9px] opacity-60">Verified Cryptographic Ledger Document</span>
        </div>
      </footer>
    </div>
  );
}
