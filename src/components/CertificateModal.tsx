'use client';

import React, { useRef, useState } from 'react';
import { Award, Download, Printer, Share2, X, Check, ShieldCheck } from 'lucide-react';
import { AppConfig } from '@/lib/config';
import { useApp } from '@/context/AppContext';

export interface CertificateData {
  id?: string;
  certificateNo: string;
  candidateName: string;
  eventTitle: string;
  eventCategory?: string;
  eventDate: string;
  descriptionTopic?: string;
  customDescription?: string;
  signatory1Name?: string;
  signatory1Title?: string;
  signatory2Name?: string;
  signatory2Title?: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData;
  logoUrl?: string;
}

export function CertificateModal({ isOpen, onClose, data, logoUrl }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  let appLogo = '';
  try {
    const context = useApp();
    if (context && context.logoUrl) {
      appLogo = context.logoUrl;
    }
  } catch (e) {
    // Safe fallback
  }

  if (!isOpen) return null;

  const activeLogo = logoUrl || appLogo || AppConfig.logoUrl || '/cyberx-logo.webp';
  const certNo = data.certificateNo || 'CX-0251';
  const candidateName = data.candidateName || 'Participant';
  const eventTitle = data.eventTitle || 'CyberX Event Workshop';
  const eventDate = data.eventDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const signatory1Name = data.signatory1Name || 'Saad Sarraj';
  const signatory1Title = data.signatory1Title || 'OSINT Investigator';
  const signatory2Name = data.signatory2Name || 'Abhishek Pawar';
  const signatory2Title = data.signatory2Title || 'Co Founder & Lead';

  // Handle PNG Image Download using Canvas
  const handleDownloadPNG = async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);

    try {
      // Dynamic import of html2canvas if available, or SVG fallback
      const element = certRef.current;
      
      // Use SVG foreignObject or native canvas draw
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 1200;
      const height = 850;
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        // High Quality Canvas Rendering
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml">
                ${element.outerHTML}
              </div>
            </foreignObject>
          </svg>
        `;

        // Create blob URL and draw to canvas
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(blob);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(blobURL);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `CyberX_Certificate_${candidateName.replace(/[^a-zA-Z0-9]/g, '_')}_${certNo}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setDownloading(false);
        };

        img.onerror = () => {
          // Fallback to print method if canvas render fails
          window.print();
          setDownloading(false);
        };

        img.src = blobURL;
      } else {
        window.print();
        setDownloading(false);
      }
    } catch (e) {
      console.error('Failed to download PNG:', e);
      window.print();
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/public/certificates/${encodeURIComponent(certNo)}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#09090b] border border-border-normal rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* MODAL HEADER TOOLBAR */}
        <div className="px-6 py-4 border-b border-border-normal/60 bg-bg-elevated/30 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading font-display">Event Achievement Certificate</h3>
              <p className="text-[10px] text-text-muted font-mono">Issued by CyberX Community India • Verify ID: {certNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="h-9 px-3 rounded-lg border border-border-normal hover:bg-bg-elevated text-text-heading text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy shareable certificate URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-cyber-success" /> : <Share2 className="w-3.5 h-3.5 text-text-muted" />}
              <span>{copied ? 'COPIED!' : 'SHARE LINK'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="h-9 px-3 rounded-lg border border-border-normal hover:bg-bg-elevated text-text-heading text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-text-muted" />
              <span>PRINT / PDF</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={downloading}
              className="h-9 px-4 rounded-lg bg-primary hover:bg-opacity-95 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'GENERATING...' : 'DOWNLOAD PNG'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-heading hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CERTIFICATE DISPLAY CONTAINER */}
        <div className="p-4 sm:p-8 bg-[#050506] flex items-center justify-center overflow-x-auto">
          
          {/* THE CERTIFICATE CARD - Exact replica of CyberX OSINT Certificate */}
          <div
            ref={certRef}
            id="cyberx-certificate-card"
            className="w-[1000px] h-[700px] shrink-0 bg-[#070709] border border-[#1f2024] relative overflow-hidden flex flex-col justify-between p-10 font-sans text-white select-none shadow-2xl"
            style={{
              backgroundImage: `
                radial-gradient(circle at 10% 10%, rgba(255, 213, 74, 0.03) 0%, transparent 40%),
                radial-gradient(circle at 90% 90%, rgba(255, 213, 74, 0.03) 0%, transparent 40%),
                repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 12px),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 12px)
              `,
            }}
          >
            {/* Top Dashed Yellow Pattern Border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" style={{
              backgroundImage: 'linear-gradient(90deg, #FFD54A 50%, transparent 50%)',
              backgroundSize: '12px 100%'
            }} />

            {/* TOP HEADER ROW: LOGO RIGHT */}
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#8e8e93] uppercase">
                <ShieldCheck className="w-4 h-4 text-[#FFD54A]" />
                <span>VERIFIED COMMUNITY ACHIEVEMENT CREDENTIAL</span>
              </div>

              {/* CYBERX LOGO BRAND */}
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-gray-400 tracking-[0.25em] uppercase mb-0.5">India's Cybersecurity Community</span>
                <div className="flex items-center gap-1">
                  <img src={activeLogo} alt="CyberX Logo" className="h-[54px] max-w-[240px] w-auto object-contain drop-shadow-sm" />
                </div>
              </div>
            </div>

            {/* MIDDLE BODY CONTENT */}
            <div className="grid grid-cols-12 gap-8 items-center z-10 my-auto">
              
              {/* Left Column: Text Metadata */}
              <div className="col-span-8 space-y-4">
                
                <div className="space-y-1">
                  <p className="text-sm text-[#9ca3af] font-sans tracking-wide">Proudly awarded to</p>
                  <h1 className="text-4xl font-extrabold text-[#FFD54A] font-display tracking-tight leading-none drop-shadow-sm">
                    {candidateName}
                  </h1>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-[#9ca3af] font-sans">for successfully completing the</p>
                  <h2 className="text-2xl font-bold text-white font-display tracking-wide leading-tight">
                    {eventTitle}
                  </h2>
                </div>

                <div className="space-y-2 text-[11px] text-[#a1a1aa] leading-relaxed max-w-xl font-sans pt-1">
                  <p>
                    This certificate is awarded to recognize the participant's participation in the knowledge session on <span className="text-[#FFD54A] font-semibold">"{data.descriptionTopic || eventTitle}"</span> organized by CyberX Community India.
                  </p>
                  <p>
                    {data.customDescription || `During this expert-led online knowledge session, the participant gained practical insights into digital footprint analysis, advanced search methodologies, social media intelligence, email investigation techniques, reverse image search, facial recognition workflows, and the ethical application of OSINT in real-world cybersecurity investigations.`}
                  </p>
                </div>

              </div>

              {/* Right Column: Cyber Badge Graphic Image */}
              <div className="col-span-4 flex justify-center items-center">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <img
                    src="/osint-badge.png"
                    alt="OSINT Open Source Intelligence Badge"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  />
                </div>
              </div>

            </div>

            {/* BOTTOM FOOTER ROW: SIGNATURES LEFT, CERT NO RIGHT */}
            <div className="flex justify-between items-end border-t border-[#1a1b1e] pt-6 z-10">
              
              {/* Signatures */}
              <div className="flex items-center gap-12">
                
                {/* Signatory 1 */}
                <div className="space-y-1">
                  <div className="w-40 border-b border-gray-600/60 pb-1">
                    <span className="text-xs font-bold text-white font-sans block">{signatory1Name}</span>
                  </div>
                  <span className="text-[10px] text-[#9ca3af] font-mono block">{signatory1Title}</span>
                </div>

                {/* Signatory 2 */}
                <div className="space-y-1">
                  <div className="w-40 border-b border-gray-600/60 pb-1">
                    <span className="text-xs font-bold text-white font-sans block">{signatory2Name}</span>
                  </div>
                  <span className="text-[10px] text-[#9ca3af] font-mono block">{signatory2Title}</span>
                </div>

              </div>

              {/* Certificate No & Date Earned */}
              <div className="text-right space-y-0.5 font-mono text-[11px]">
                <p className="text-[#a1a1aa]">
                  Certificate No: <span className="text-white font-bold">{certNo}</span>
                </p>
                <p className="text-[#a1a1aa]">
                  Date Earned: <span className="text-white font-bold">{eventDate}</span>
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cyberx-certificate-card, #cyberx-certificate-card * {
            visibility: visible;
          }
          #cyberx-certificate-card {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            border: none !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
