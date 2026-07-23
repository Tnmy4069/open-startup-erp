'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Globe, Download, AlertTriangle, Loader, Calendar, Tag } from 'lucide-react';

import { AppConfig } from '@/lib/config';

interface DocVersion {
  id: string;
  version: number;
  content: string;
  updatedBy: string;
  createdAt: string;
}

interface DocFile {
  id: string;
  name: string;
  folderId: string;
  content: string;
  type: string;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  tags: string[];
  versions: DocVersion[];
  updatedAt: string;
}

export default function PublicDocumentView() {
  const { id } = useParams();
  const [doc, setDoc] = useState<DocFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchPublicDocument = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/documents/${id}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError('This document is not configured for public link sharing.');
          } else {
            setError('Document not found or has been deleted.');
          }
          return;
        }
        const data = await res.json();
        setDoc(data);
      } catch (err: any) {
        setError('Network error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicDocument();
  }, [id]);

  const formatBytes = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
            <span className="text-[10px] text-text-muted font-mono tracking-widest hidden sm:inline">DOCUMENT SYSTEM</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold font-mono px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <Globe className="w-3.5 h-3.5" />
            <span>SHARED PUBLICLY</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 z-10 flex flex-col justify-start">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-text-muted font-mono">{"// Syncing assets from document repo..."}</p>
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
        ) : doc ? (
          <article className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header info */}
            <div className="space-y-4 border-b border-border-normal pb-6">
              <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted font-mono">
                <div className="flex items-center gap-1.5 text-primary">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Updated: {new Date(doc.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <span>•</span>
                <span className="bg-bg-elevated/65 border border-border-normal text-text-heading font-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                  Type: {doc.type}
                </span>
              </div>

              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-heading leading-tight tracking-wide font-mono">
                {doc.name}
              </h1>

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doc.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-[9px] font-mono text-text-muted bg-bg-surface px-2 py-0.5 border border-border-normal rounded">
                      <Tag className="w-2.5 h-2.5 opacity-60" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Document Content View */}
            {doc.type === 'markdown' ? (
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="prose-meeting w-full overflow-x-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>
                      ),
                    }}
                  >
                    {doc.content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : doc.type === 'link' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 bg-bg-surface border border-border-normal rounded-2xl space-y-6 text-center max-w-xl mx-auto">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Globe className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-base text-text-heading">{doc.name}</h4>
                  <p className="text-xs text-text-muted font-mono truncate max-w-sm">{doc.fileUrl}</p>
                </div>
                <a
                  href={doc.fileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-primary hover:bg-opacity-95 text-black font-bold rounded-xl transition-all flex items-center gap-2 text-xs"
                >
                  <span>Go to Link</span>
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 bg-bg-surface border border-border-normal rounded-2xl space-y-6 text-center max-w-xl mx-auto">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <FileText className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-base text-text-heading">{doc.name}</h4>
                  <div className="flex items-center justify-center gap-3 text-xs text-text-muted font-mono">
                    <span>Size: {formatBytes(doc.fileSize)}</span>
                    <span>•</span>
                    <span>MIME: {doc.mimeType || 'unknown'}</span>
                  </div>
                </div>
                <a
                  href={doc.fileUrl || '#'}
                  download={doc.name}
                  className="px-6 py-2.5 bg-primary hover:bg-opacity-95 text-black font-bold rounded-xl transition-all flex items-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
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
          <span className="text-[9px] opacity-60">Verified Cryptographic Document Resource</span>
        </div>
      </footer>
    </div>
  );
}
