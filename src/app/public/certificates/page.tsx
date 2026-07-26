'use client';

import React, { useState } from 'react';
import { Award, Search, ArrowLeft, ShieldCheck, Mail, Calendar, ExternalLink, Download, Share2, Check, Sparkles } from 'lucide-react';
import { CertificateModal, CertificateData } from '@/components/CertificateModal';
import { useApp } from '@/context/AppContext';
import { AppConfig } from '@/lib/config';

export default function PublicCertificatesSearchPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<CertificateData[]>([]);
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  let appLogo = '';
  try {
    const context = useApp();
    if (context && context.logoUrl) {
      appLogo = context.logoUrl;
    }
  } catch (e) {}

  const activeLogo = appLogo || AppConfig.logoUrl || '/cyberx-logo.webp';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/public/certificates?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (data.certificates) {
        setResults(data.certificates);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (certNo: string) => {
    const url = `${window.location.origin}/public/certificates/${encodeURIComponent(certNo)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans selection:bg-primary selection:text-black">
      
      {/* BACKGROUND DECORATIVE GLOW */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-0" />

      {/* TOP HEADER NAV */}
      <header className="border-b border-border-normal/60 bg-bg-surface/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-text-muted hover:text-text-heading font-mono text-xs transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CyberX Portal</span>
          </a>

          {/* TOP RIGHT: APP LOGO AND VERIFIED BADGE */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 border-r border-border-normal/50 pr-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-display font-extrabold text-xs tracking-wider text-text-heading uppercase">
                CyberX Registry
              </span>
            </div>

            <img
              src={activeLogo}
              alt="Web Application Logo"
              className="h-8 max-w-[180px] w-auto object-contain drop-shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10 z-10">
        
        {/* HERO HEADER */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-primary" />
            <span>AUTHENTIC EVENT CERTIFICATE PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-heading font-display tracking-tight leading-tight">
            Search &amp; Download Candidate Certificates
          </h1>
          <p className="text-xs sm:text-sm text-text-muted font-sans leading-relaxed">
            Enter your registered email address below to retrieve, view, print, or download your official CyberX Event Certificates.
          </p>
        </div>

        {/* EMAIL SEARCH BAR FORM */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto space-y-3">
          <div className="relative flex items-center shadow-2xl">
            <Mail className="w-5 h-5 text-text-muted absolute left-4 pointer-events-none" />
            <input
              type="email"
              required
              placeholder="Enter your registered email (e.g. candidate@example.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 pl-12 pr-36 bg-bg-surface border-2 border-border-normal hover:border-primary/50 focus:border-primary rounded-2xl text-sm text-text-heading focus:outline-none transition-all font-sans"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="absolute right-2 h-10 px-5 rounded-xl bg-primary hover:bg-opacity-90 text-black font-mono font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'SEARCHING...' : 'FIND CERTIFICATE'}</span>
            </button>
          </div>
          <p className="text-[11px] text-text-muted font-mono text-center">
            💡 Certificate verification ID is cryptographically mapped to your event RSVP email.
          </p>
        </form>

        {/* SEARCH RESULTS */}
        {searched && (
          <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-border-normal/60 pb-3">
              <h3 className="text-base font-bold text-text-heading font-display">
                Search Results ({results.length})
              </h3>
              <span className="text-xs text-text-muted font-mono">Query: {email}</span>
            </div>

            {results.length === 0 ? (
              <div className="bg-bg-surface border border-border-normal/70 rounded-2xl p-10 text-center space-y-3">
                <Award className="w-12 h-12 text-text-muted opacity-40 mx-auto" />
                <h4 className="font-bold text-text-heading text-base">No Certificates Found</h4>
                <p className="text-xs text-text-muted font-sans max-w-md mx-auto">
                  We couldn't find an event certificate registered to <span className="text-primary font-mono">{email}</span>. Please verify your email address or check spelling.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((cert) => (
                  <div
                    key={cert.certificateNo + cert.id}
                    className="bg-bg-surface border border-border-normal/70 hover:border-primary/60 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                          {cert.eventCategory || 'OSINT'}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted">ID: {cert.certificateNo}</span>
                      </div>

                      <div>
                        <h4 className="font-display font-extrabold text-base text-text-heading leading-tight group-hover:text-primary transition-colors">
                          {cert.eventTitle}
                        </h4>
                        <p className="text-xs text-text-muted font-mono mt-1">
                          Candidate: <span className="text-text-heading font-bold">{cert.candidateName}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-text-body">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        <span>Earned: {cert.eventDate}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-border-normal/40 flex flex-col gap-2 font-mono text-xs">
                      <button
                        onClick={() => { setSelectedCert(cert); setShowModal(true); }}
                        className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                      >
                        <Award className="w-4 h-4" />
                        <span>VIEW &amp; DOWNLOAD CERTIFICATE</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(cert.certificateNo)}
                          className="flex-1 h-9 rounded-xl bg-bg-primary border border-border-normal hover:border-primary text-text-heading text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedId === cert.certificateNo ? <Check className="w-3.5 h-3.5 text-cyber-success" /> : <Share2 className="w-3.5 h-3.5 text-text-muted" />}
                          <span>{copiedId === cert.certificateNo ? 'COPIED!' : 'SHARE LINK'}</span>
                        </button>

                        <a
                          href={`/public/certificates/${encodeURIComponent(cert.certificateNo)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-3 rounded-xl bg-bg-primary border border-border-normal hover:border-primary text-text-muted hover:text-text-heading text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                          title="Open Fullscreen Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-border-normal/60 py-6 text-center text-[10px] font-mono text-text-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} CyberX Community. All rights reserved.</span>
          <span className="text-primary font-bold">Cryptographically Verified Credentials</span>
        </div>
      </footer>

      {/* CERTIFICATE MODAL */}
      {showModal && selectedCert && (
        <CertificateModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          data={selectedCert}
        />
      )}

    </div>
  );
}
