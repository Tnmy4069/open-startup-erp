'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ExternalLink, 
  AlertTriangle, 
  Loader, 
  Award, 
  CheckCircle,
  Globe,
  BookOpen,
  CheckSquare
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Registration {
  id: string;
  status: string;
}

interface MemberProfile {
  id: string;
  slug: string | null;
  name: string;
  photo: string | null;
  college: string;
  department: string;
  year: string;
  orgName: string | null;
  designation: string | null;
  skills: string[];
  domains: string[];
  position: string;
  role: string;
  status: string;
  availability: string;
  bio: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  joinedDate: string;
  badges: string[];
  certificates: string[];
  registrations: Registration[];
  tasksAssigned: Task[];
}

export default function PublicMemberProfileView() {
  const { id } = useParams();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/members/${id}`);
        if (!res.ok) {
          if (res.status === 403) {
            setError('This profile is set to private or inactive.');
          } else {
            setError('Member profile not found.');
          }
          return;
        }
        const data = await res.json();
        setMember(data);
      } catch (err: any) {
        setError('Network error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [id]);

  const completedTasks = member?.tasksAssigned.filter(t => t.status === 'Completed').length || 0;
  const totalTasks = member?.tasksAssigned.length || 0;
  const eventsAttended = member?.registrations.filter(r => r.status === 'Attended').length || 0;

  return (
    <div className="dark min-h-screen bg-[#0A0A0B] text-text-body font-sans antialiased flex flex-col justify-between selection:bg-primary selection:text-black">
      {/* Scanline pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #FFD54A 0px, #FFD54A 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Navbar header */}
      <header className="border-b border-border-normal bg-bg-surface/30 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/cyberx-logo.webp" alt="CyberX" className="h-7 w-auto object-contain" />
            <span className="text-text-muted font-mono text-xs hidden sm:inline">|</span>
            <span className="text-[10px] text-text-muted font-mono tracking-widest hidden sm:inline">MEMBER REGISTRY</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold font-mono px-2.5 py-1 bg-cyber-success/10 border border-cyber-success/20 text-cyber-success rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-success animate-pulse"></span>
            <span>PUBLIC PROFILE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 z-10 flex flex-col justify-start">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-text-muted font-mono">{"// Compiling member portfolio node..."}</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto space-y-5">
            <div className="p-4 bg-cyber-danger/10 border border-cyber-danger/25 rounded-full text-cyber-danger">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-text-heading text-lg">Profile Not Available</h3>
              <p className="text-xs text-text-body leading-relaxed font-sans">{error}</p>
            </div>
          </div>
        ) : member ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Member Card Header */}
            <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
              {/* Photo */}
              <div className="relative shrink-0">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary/40 shadow-[0_0_15px_rgba(255,213,74,0.15)]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-3xl font-bold font-display shadow-inner">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-cyber-success border-2 border-bg-surface" />
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-center md:justify-start">
                  <h1 className="font-display font-extrabold text-2xl text-text-heading leading-tight tracking-wide">
                    {member.name}
                  </h1>
                  <span className="self-center px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[9px] font-mono font-bold uppercase tracking-wider">
                    {member.role}
                  </span>
                </div>

                <p className="text-sm text-text-body font-medium flex items-center justify-center md:justify-start gap-1.5">
                  <Briefcase className="w-4 h-4 text-text-muted shrink-0" />
                  <span>{member.position} {member.orgName ? `@ ${member.orgName}` : ''}</span>
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-text-muted font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {member.college}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>{member.department} ({member.year} Year)</span>
                </div>
              </div>

              {/* Social Contacts */}
              <div className="flex md:flex-col gap-2 justify-center shrink-0 w-full md:w-auto">
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:w-36 h-9 px-3 bg-bg-elevated hover:bg-bg-primary border border-border-normal hover:border-primary/40 rounded-lg text-xs font-semibold text-text-heading hover:text-primary transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                    <span className="font-mono text-[10px]">LINKEDIN</span>
                  </a>
                )}
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:w-36 h-9 px-3 bg-bg-elevated hover:bg-bg-primary border border-border-normal hover:border-primary/40 rounded-lg text-xs font-semibold text-text-heading hover:text-primary transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                    <span className="font-mono text-[10px]">GITHUB</span>
                  </a>
                )}
                {member.portfolio && (
                  <a
                    href={member.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:w-36 h-9 px-3 bg-bg-elevated hover:bg-bg-primary border border-border-normal hover:border-primary/40 rounded-lg text-xs font-semibold text-text-heading hover:text-primary transition-all flex items-center justify-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-text-muted" />
                    <span className="font-mono text-[10px]">PORTFOLIO</span>
                  </a>
                )}
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-center font-mono text-[11px]">
              <div className="bg-bg-surface/50 border border-border-normal/60 p-4 rounded-xl flex flex-col justify-center items-center gap-1 shadow-sm">
                <CheckSquare className="w-5 h-5 text-cyber-success" />
                <span className="text-text-muted mt-1 uppercase tracking-wider">Tasks Accomplished</span>
                <p className="text-lg font-bold text-cyber-success">{completedTasks} / {totalTasks}</p>
              </div>
              <div className="bg-bg-surface/50 border border-border-normal/60 p-4 rounded-xl flex flex-col justify-center items-center gap-1 shadow-sm">
                <Calendar className="w-5 h-5 text-cyber-info" />
                <span className="text-text-muted mt-1 uppercase tracking-wider">Events Attended</span>
                <p className="text-lg font-bold text-cyber-info">{eventsAttended}</p>
              </div>
            </div>

            {/* Profile Bio */}
            {member.bio && (
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border-normal/40 pb-3">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-text-heading uppercase">About Member</span>
                </div>
                <p className="text-sm text-text-body leading-relaxed font-sans font-light">
                  {member.bio}
                </p>
              </div>
            )}

            {/* Domain & Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Domains */}
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-text-heading uppercase block border-b border-border-normal/40 pb-3">Domains</span>
                <div className="flex flex-wrap gap-2">
                  {member.domains && member.domains.length > 0 ? (
                    member.domains.map((domain, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                        {domain}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted font-mono">No specific domains specified</span>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-text-heading uppercase block border-b border-border-normal/40 pb-3">Core Expertise</span>
                <div className="flex flex-wrap gap-2">
                  {member.skills && member.skills.length > 0 ? (
                    member.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-bg-elevated border border-border-normal text-text-heading text-xs font-mono">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted font-mono">No specific skills listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Badges / Awards */}
            {member.badges && member.badges.length > 0 && (
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border-normal/40 pb-3">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-text-heading uppercase">Badges &amp; Recognition</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {member.badges.map((badge, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-cyber-success/15 border border-cyber-success/20 rounded-lg text-cyber-success text-xs font-mono font-bold">
                      <Award className="w-4 h-4" />
                      <span>{badge.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {member.certificates && member.certificates.length > 0 && (
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border-normal/40 pb-3">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-text-heading uppercase">Credentials &amp; Certificates</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {member.certificates.map((cert, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-bg-primary/50 border border-border-normal/40 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-cyber-success shrink-0" />
                        <span className="text-xs font-semibold text-text-heading truncate max-w-[200px]">{cert}</span>
                      </div>
                      <span className="text-[8px] font-mono text-text-muted px-1.5 py-0.5 bg-bg-elevated border border-border-normal rounded">VERIFIED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-normal bg-bg-surface/10 py-6 text-center text-[10px] font-mono text-text-muted z-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} CyberX Community. All rights reserved.</span>
          <span className="text-[9px] opacity-60">Verified Cryptographic Identity Node</span>
        </div>
      </footer>
    </div>
  );
}
