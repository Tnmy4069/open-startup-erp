'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Award, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppConfig } from '@/lib/config';
import { CertificateModal, CertificateData } from '@/components/CertificateModal';

export default function CertificatePublicPage() {
  const params = useParams();
  const certId = Array.isArray(params?.id) ? params.id[0] : (params?.id || '');

  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [publicLogoUrl, setPublicLogoUrl] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!certId) return;

    // Fetch certificate registration info from API
    fetch(`/api/public/certificates/${encodeURIComponent(certId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          if (data.logoUrl) {
            setPublicLogoUrl(data.logoUrl);
          }
          setCertData({
            certificateNo: data.certificateNo || certId,
            candidateName: data.candidateName,
            eventTitle: data.eventTitle,
            eventCategory: data.eventCategory || 'OSINT',
            eventDate: data.eventDate,
            descriptionTopic: data.descriptionTopic || data.eventTitle,
            signatory1Name: data.signatory1Name || 'Saad Sarraj',
            signatory1Title: data.signatory1Title || 'OSINT Investigator',
            signatory2Name: data.signatory2Name || 'Abhishek Pawar',
            signatory2Title: data.signatory2Title || 'Co Founder & Lead',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Certificate record not found in CyberX registry.');
      })
      .finally(() => setLoading(false));
  }, [certId]);

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      
      {/* Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-6 mb-6 border-b border-border-normal">
        <a href="/" className="flex items-center gap-2 text-text-muted hover:text-text-heading font-mono text-xs transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CyberX</span>
        </a>

        {/* TOP RIGHT: LOGO AND BADGE */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 border-r border-border-normal/50 pr-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-xs tracking-wider text-text-heading uppercase">
              CyberX Verified Credential
            </span>
          </div>

          <img
            src={publicLogoUrl || AppConfig.logoUrl || '/cyberx-logo.webp'}
            alt="Web Application Logo"
            className="h-8 max-w-[180px] w-auto object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-text-muted animate-pulse">
          {"// Verifying credential authenticity from CyberX registry..."}
        </div>
      ) : error ? (
        <div className="max-w-md bg-bg-surface border border-cyber-danger/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-cyber-danger mx-auto" />
          <h3 className="font-bold text-base text-text-heading">Credential Not Found</h3>
          <p className="text-xs text-text-muted font-mono">{error}</p>
        </div>
      ) : certData ? (
        <CertificateModal
          isOpen={true}
          onClose={() => { window.location.href = '/'; }}
          data={certData}
          logoUrl={publicLogoUrl}
        />
      ) : null}

    </div>
  );
}
