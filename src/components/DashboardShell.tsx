'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  ReceiptText,
  Building2,
  Users,
  FileSpreadsheet,
  ScrollText,
  Settings,
  Bell,
  Sun,
  Moon,
  Keyboard,
  User,
  X,
  Plus,
  Terminal,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Menu,
  LogOut,
  Shield,
  BookOpen,
  Calendar,
  ListTodo,
  Wrench,
  FileText,
  Megaphone
} from 'lucide-react';
import { DashboardHome } from './DashboardHome';
import { LedgerTable } from './LedgerTable';
import { OrganizationsList } from './OrganizationsList';
import { PeopleList } from './PeopleList';
import { ReportsPanel } from './ReportsPanel';
import { AuditLogsList } from './AuditLogsList';
import { SettingsPanel } from './SettingsPanel';
import { UsersPanel } from './UsersPanel';
import { MeetingsPanel } from './MeetingsPanel';
import { MembersPanel } from './MembersPanel';
import { EventsPanel } from './EventsPanel';
import { AssetsPanel } from './AssetsPanel';
import { TasksPanel } from './TasksPanel';
import { DocumentsPanel } from './DocumentsPanel';
import { AnnouncementsPanel } from './AnnouncementsPanel';

import { useParams, useRouter } from 'next/navigation';

export function DashboardShell() {
  const {
    user,
    role,
    theme,
    setTheme,
    notifications,
    setNotifications,
    logout,
    memberRegistered,
    setMemberRegistered,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const showBlocker = mounted && !!user && role !== 'Super Admin' && !memberRegistered;

  // Blocker form state
  const [blockerName, setBlockerName] = useState('');
  const [blockerEmail, setBlockerEmail] = useState('');
  const [blockerPhone, setBlockerPhone] = useState('');
  const [blockerMemberType, setBlockerMemberType] = useState<'Student' | 'Professional'>('Student');
  const [blockerCollege, setBlockerCollege] = useState('');
  const [blockerDept, setBlockerDept] = useState('');
  const [blockerYear, setBlockerYear] = useState('');
  const [blockerOrgName, setBlockerOrgName] = useState('');
  const [blockerDesignation, setBlockerDesignation] = useState('');
  const [blockerSkills, setBlockerSkills] = useState('');
  const [blockerDomains, setBlockerDomains] = useState('');
  const [blockerBio, setBlockerBio] = useState('');
  const [blockerLinkedin, setBlockerLinkedin] = useState('');
  const [blockerGithub, setBlockerGithub] = useState('');
  const [blockerPortfolio, setBlockerPortfolio] = useState('');
  const [blockerEmergency, setBlockerEmergency] = useState('');
  const [blockerAvail, setBlockerAvail] = useState('High');
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);
  const [blockerError, setBlockerError] = useState('');

  // Prefill fields when user is fetched
  useEffect(() => {
    if (user) {
      if (user.username.includes('@')) {
        setBlockerEmail(user.username);
        const namePart = user.username.split('@')[0];
        setBlockerName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      } else {
        setBlockerName(user.username.charAt(0).toUpperCase() + user.username.slice(1));
        setBlockerEmail('');
      }
    }
  }, [user]);

  const handleBlockerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerName.trim()) {
      setBlockerError('Name is required.');
      return;
    }
    if (!blockerEmail.trim()) {
      setBlockerError('Email is required.');
      return;
    }
    if (!blockerPhone.trim()) {
      setBlockerError('Phone number is required.');
      return;
    }
    if (!blockerEmergency.trim()) {
      setBlockerError('Emergency contact is required.');
      return;
    }

    if (blockerMemberType === 'Student') {
      if (!blockerCollege.trim() || !blockerDept.trim() || !blockerYear.trim()) {
        setBlockerError('College, Department, and Year are required for students.');
        return;
      }
    } else {
      if (!blockerOrgName.trim() || !blockerDesignation.trim()) {
        setBlockerError('Organization name and designation are required for professionals.');
        return;
      }
    }

    setBlockerSubmitting(true);
    setBlockerError('');

    try {
      const payload = {
        name: blockerName.trim(),
        email: blockerEmail.trim(),
        phone: blockerPhone.trim(),
        college: blockerMemberType === 'Student' ? blockerCollege.trim() : '',
        department: blockerMemberType === 'Student' ? blockerDept.trim() : '',
        year: blockerMemberType === 'Student' ? blockerYear.trim() : '',
        orgName: blockerMemberType === 'Professional' ? blockerOrgName.trim() : '',
        designation: blockerMemberType === 'Professional' ? blockerDesignation.trim() : '',
        position: 'Member',
        role: role || 'Member',
        status: 'Active',
        availability: blockerAvail,
        bio: blockerBio.trim(),
        linkedin: blockerLinkedin.trim(),
        github: blockerGithub.trim(),
        portfolio: blockerPortfolio.trim(),
        skills: blockerSkills.split(',').map((s) => s.trim()).filter(Boolean),
        domains: blockerDomains.split(',').map((d) => d.trim()).filter(Boolean),
        emergencyContact: blockerEmergency.trim(),
        notes: 'Self-registered profile during login verification',
      };

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration form.');
      }

      setMemberRegistered(true);
      window.location.reload();
    } catch (err: any) {
      setBlockerError(err.message || 'An unexpected error occurred.');
    } finally {
      setBlockerSubmitting(false);
    }
  };

  const params = useParams();
  const router = useRouter();

  // Validate and resolve active tab from catch-all URL segment
  const tabParam = params?.tab;
  const resolvedTab = Array.isArray(tabParam) ? tabParam[0] : (tabParam || 'dashboard');

  const VALID_TABS = [
    'dashboard', 'ledger', 'organizations', 'people', 'reports', 'logs',
    'settings', 'users', 'meetings', 'members', 'events', 'assets',
    'tasks', 'documents', 'announcements'
  ];

  const currentTab = VALID_TABS.includes(resolvedTab)
    ? (resolvedTab as 'dashboard' | 'ledger' | 'organizations' | 'people' | 'reports' | 'logs' | 'settings' | 'users' | 'meetings' | 'members' | 'events' | 'assets' | 'tasks' | 'documents' | 'announcements')
    : 'dashboard';

  const setCurrentTab = (tab: string) => {
    router.push(`/${tab}`);
  };

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [globalSearchVal, setGlobalSearchVal] = useState('');

  // Dialog state trigger (New transaction)
  const [openNewTxDrawer, setOpenNewTxDrawer] = useState(false);

  // Responsive & Interactive CLI states
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showCli, setShowCli] = useState(false);
  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState<string[]>([
    'Welcome to CyberX SECURE CLI v1.0. Type "help" for a list of command queries.',
    'Usage: theme [light|dark|toggle], role [name], search [query], goto [tab], newtx, clear'
  ]);

  const globalSearchRef = useRef<HTMLInputElement>(null);
  const cliInputRef = useRef<HTMLInputElement>(null);
  const cliLogEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log
  useEffect(() => {
    if (showCli) {
      cliLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cliHistory, showCli]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (showBlocker) return; // Prevent hotkeys when registration blocker is active

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isCliActive = document.activeElement === cliInputRef.current;

      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
          setShowCli(false);
        }
        if (isCliActive && (e.key === '`' || (e.ctrlKey && e.key === '\\'))) {
          e.preventDefault();
          setShowCli(false);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === '/')) {
        e.preventDefault();
        globalSearchRef.current?.focus();
      } else if (e.key === '`' || (e.ctrlKey && e.key === '\\')) {
        e.preventDefault();
        setShowCli((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => cliInputRef.current?.focus(), 50);
          }
          return next;
        });
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setCurrentTab('ledger');
        setOpenNewTxDrawer(true);
      } else if (e.key === 'e' || e.key === 'E') {
        setCurrentTab('events');
      } else if (e.key === 'k' || e.key === 'K') {
        setCurrentTab('tasks');
      } else if (e.key === 'm' || e.key === 'M') {
        setCurrentTab('members');
      } else if (e.key === 'a' || e.key === 'A') {
        setCurrentTab('assets');
      } else if (e.key === 'u' || e.key === 'U') {
        setCurrentTab('documents');
      } else if (e.key === 'd' || e.key === 'D') {
        setCurrentTab('dashboard');
      } else if (e.key === 't' || e.key === 'T') {
        setCurrentTab('ledger');
      } else if (e.key === 'o' || e.key === 'O') {
        setCurrentTab('organizations');
      } else if (e.key === 'p' || e.key === 'P') {
        setCurrentTab('people');
      } else if (e.key === 'r' || e.key === 'R') {
        setCurrentTab('reports');
      } else if (e.key === 'l' || e.key === 'L') {
        setCurrentTab('logs');
      } else if (e.key === 's' || e.key === 'S') {
        setCurrentTab('settings');
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setShowShortcutsHelp((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpenNewTxDrawer(false);
        setShowShortcutsHelp(false);
        setShowNotifDropdown(false);
        setShowCli(false);
        setShowMobileSidebar(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme, role, logout, showBlocker]); // Bind dependencies to ensure updated handler context

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const input = cliInput.trim();
    const args = input.split(/\s+/);
    const cmd = args[0].toLowerCase();

    let output = '';

    switch (cmd) {
      case 'help':
        output = 'Available: goto [dash|ledger|orgs|people|reports|logs|settings|users], theme [light|dark|toggle], search [query], newtx, logout, clear';
        break;
      case 'clear':
        setCliHistory([]);
        setCliInput('');
        return;
      case 'newtx':
        if (role !== 'Read Only') {
          setCurrentTab('ledger');
          setOpenNewTxDrawer(true);
          output = 'Opening new transaction slider...';
        } else {
          output = 'Access Denied: Read Only role cannot create transactions.';
        }
        break;
      case 'goto': {
        const dest = args[1]?.toLowerCase();
        if (dest === 'dash' || dest === 'dashboard') {
          setCurrentTab('dashboard');
          output = 'Navigating to dashboard...';
        } else if (dest === 'ledger' || dest === 'transactions' || dest === 'ledger') {
          setCurrentTab('ledger');
          output = 'Navigating to transactions ledger...';
        } else if (dest === 'orgs' || dest === 'organizations') {
          setCurrentTab('organizations');
          output = 'Navigating to corporate registry...';
        } else if (dest === 'people' || dest === 'members' || dest === 'contacts') {
          setCurrentTab('people');
          output = 'Navigating to member registry...';
        } else if (dest === 'reports' || dest === 'analytics') {
          setCurrentTab('reports');
          output = 'Navigating to financial reports...';
        } else if (dest === 'logs' || dest === 'audit' || dest === 'activity') {
          setCurrentTab('logs');
          output = 'Navigating to security audit logs...';
        } else if (dest === 'settings' || dest === 'config') {
          setCurrentTab('settings');
          output = 'Navigating to system settings...';
        } else if (dest === 'users' && role === 'Super Admin') {
          setCurrentTab('users');
          output = 'Navigating to user access control...';
        } else {
          output = 'Invalid tab. Options: dash, ledger, orgs, people, reports, logs, settings, users';
        }
        break;
      }
      case 'logout':
        setCliHistory((prev) => [...prev, '> logout', 'Logging out of secure session...']);
        setCliInput('');
        setTimeout(() => logout(), 800);
        return;
      case 'theme': {
        const themeVal = args[1]?.toLowerCase();
        if (themeVal === 'light') {
          setTheme('light');
          output = 'Applied light system stylesheet.';
        } else if (themeVal === 'dark') {
          setTheme('dark');
          output = 'Applied dark hacker system stylesheet.';
        } else if (themeVal === 'toggle' || !themeVal) {
          const next = theme === 'dark' ? 'light' : 'dark';
          setTheme(next);
          output = `Toggled style system to: ${next}`;
        } else {
          output = 'Invalid theme option. Options: light, dark, toggle';
        }
        break;
      }
      case 'search': {
        const q = args.slice(1).join(' ');
        setGlobalSearchVal(q);
        output = q ? `Set search pattern to: "${q}"` : 'Cleared search pattern.';
        break;
      }
      default:
        output = `Unknown instruction "${cmd}". Input "help" for syntax info.`;
    }

    setCliHistory((prev) => [...prev, `> ${input}`, output]);
    setCliInput('');
  };

  const handleMarkAllRead = async () => {
    try {
      // In a real app we'd trigger a bulk API call. Here we update local state:
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'Read' })));
    } catch (e) {
      console.error(e);
    }
  };


  const unreadNotifCount = notifications.filter((n) => n.status === 'Unread').length;

  return (
    <div className="flex h-screen bg-bg-primary text-text-body font-sans overflow-hidden relative w-full">
      {/* MANDATORY REGISTRATION BLOCKER POPUP */}
      {showBlocker && (
        <div className="fixed inset-0 z-[9999] bg-black overflow-y-auto font-mono p-4 md:p-6 flex flex-col items-center justify-start">
          <div className="w-full max-w-2xl bg-bg-surface border border-border-normal rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200 my-auto">
            {/* Title / Header */}
            <div>
              <p className="text-[10px] text-primary tracking-[0.2em] font-bold">&gt; VERIFICATION REQUIRED</p>
              <h2 className="text-xl font-bold text-text-heading mt-1">Complete Member Profile</h2>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                To access the CyberX Operations Suite, please provide your community member registry details. This is a one-time setup required for security auditing and role mapping.
              </p>
            </div>

            {/* Error Notifications */}
            {blockerError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg text-cyber-danger text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{blockerError}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleBlockerSubmit} className="space-y-4 text-xs text-text-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[9px] text-text-muted tracking-wider block font-semibold">FULL NAME *</label>
                  <input
                    type="text"
                    required
                    value={blockerName}
                    onChange={(e) => setBlockerName(e.target.value)}
                    className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                    placeholder="e.g. Tanmay Hirodkar"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[9px] text-text-muted tracking-wider block font-semibold">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    value={blockerEmail}
                    onChange={(e) => setBlockerEmail(e.target.value)}
                    disabled={user?.username.includes('@')}
                    className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed font-mono text-xs"
                    placeholder="e.g. user@cyberx.org.in"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[9px] text-text-muted tracking-wider block font-semibold">PHONE NUMBER *</label>
                  <input
                    type="tel"
                    required
                    value={blockerPhone}
                    onChange={(e) => setBlockerPhone(e.target.value)}
                    className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                    placeholder="e.g. +91 9999988888"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1">
                  <label className="text-[9px] text-text-muted tracking-wider block font-semibold">EMERGENCY CONTACT *</label>
                  <input
                    type="tel"
                    required
                    value={blockerEmergency}
                    onChange={(e) => setBlockerEmergency(e.target.value)}
                    className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                    placeholder="Emergency phone number"
                  />
                </div>
              </div>

              {/* Member Type */}
              <div className="space-y-1">
                <label className="text-[9px] text-text-muted tracking-wider block font-semibold">MEMBER TYPE *</label>
                <div className="grid grid-cols-2 gap-2 bg-bg-primary p-1 rounded-lg border border-border-normal">
                  <button
                    type="button"
                    onClick={() => setBlockerMemberType('Student')}
                    className={`py-2 text-xs font-semibold rounded-md transition-all duration-150 ${blockerMemberType === 'Student' ? 'bg-primary text-black font-bold' : 'text-text-muted hover:text-text-heading'}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockerMemberType('Professional')}
                    className={`py-2 text-xs font-semibold rounded-md transition-all duration-150 ${blockerMemberType === 'Professional' ? 'bg-primary text-black font-bold' : 'text-text-muted hover:text-text-heading'}`}
                  >
                    Professional / Other
                  </button>
                </div>
              </div>

              {/* Conditional Section */}
              {blockerMemberType === 'Student' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-bg-primary/50 border border-border-normal/40 rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="space-y-1">
                    <label className="text-[9px] text-text-muted tracking-wider block font-semibold">COLLEGE / SCHOOL *</label>
                    <input
                      type="text"
                      required
                      value={blockerCollege}
                      onChange={(e) => setBlockerCollege(e.target.value)}
                      className="w-full h-9 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                      placeholder="e.g. VJTI"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-text-muted tracking-wider block font-semibold">DEPARTMENT *</label>
                    <input
                      type="text"
                      required
                      value={blockerDept}
                      onChange={(e) => setBlockerDept(e.target.value)}
                      className="w-full h-9 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                      placeholder="e.g. IT, Comps"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-text-muted tracking-wider block font-semibold">YEAR *</label>
                    <select
                      required
                      value={blockerYear}
                      onChange={(e) => setBlockerYear(e.target.value)}
                      className="w-full h-9 bg-bg-primary border border-border-normal rounded-lg px-2 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Alumni">Alumni / Other</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-bg-primary/50 border border-border-normal/40 rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="space-y-1">
                    <label className="text-[9px] text-text-muted tracking-wider block font-semibold">ORGANIZATION / COMPANY *</label>
                    <input
                      type="text"
                      required
                      value={blockerOrgName}
                      onChange={(e) => setBlockerOrgName(e.target.value)}
                      className="w-full h-9 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                      placeholder="e.g. Security Firm Ltd"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-text-muted tracking-wider block font-semibold">DESIGNATION *</label>
                    <input
                      type="text"
                      required
                      value={blockerDesignation}
                      onChange={(e) => setBlockerDesignation(e.target.value)}
                      className="w-full h-9 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                      placeholder="e.g. Lead Analyst"
                    />
                  </div>
                </div>
              )}

              {/* Skills and Domains */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-text-muted tracking-wider block font-semibold">SKILLS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    value={blockerSkills}
                    onChange={(e) => setBlockerSkills(e.target.value)}
                    className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                    placeholder="e.g. React, Docker, Pentesting"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-text-muted tracking-wider block font-semibold">DOMAINS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    value={blockerDomains}
                    onChange={(e) => setBlockerDomains(e.target.value)}
                    className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                    placeholder="e.g. Web Dev, Cryptography"
                  />
                </div>
              </div>

              {/* Availability and Socials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-text-muted tracking-wider block font-semibold">WEEKLY AVAILABILITY *</label>
                  <div className="flex gap-4 mt-1.5">
                    {['High', 'Medium', 'Low'].map((level) => (
                      <label key={level} className="flex items-center gap-2 cursor-pointer text-text-heading">
                        <input
                          type="radio"
                          name="availability"
                          checked={blockerAvail === level}
                          onChange={() => setBlockerAvail(level)}
                          className="text-primary focus:ring-primary h-4 w-4 bg-bg-primary border-border-normal"
                        />
                        <span>{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-text-muted tracking-wider block font-semibold">LINKEDIN PROFILE URL</label>
                  <input
                    type="url"
                    value={blockerLinkedin}
                    onChange={(e) => setBlockerLinkedin(e.target.value)}
                    className="w-full h-10 bg-bg-primary border border-border-normal rounded-lg px-3 text-text-heading focus:outline-none focus:border-primary font-mono text-xs"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-[9px] text-text-muted tracking-wider block font-semibold">SHORT BIO / SUMMARY</label>
                <textarea
                  value={blockerBio}
                  onChange={(e) => setBlockerBio(e.target.value)}
                  className="w-full h-16 bg-bg-primary border border-border-normal rounded-lg p-3 text-text-heading focus:outline-none focus:border-primary resize-none font-mono text-xs"
                  placeholder="Introduce yourself..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border-normal">
                <button
                  type="submit"
                  disabled={blockerSubmitting}
                  className="flex-1 h-11 bg-primary text-black font-bold tracking-wider rounded-lg hover:bg-opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  {blockerSubmitting ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
                      REGISTERING...
                    </>
                  ) : (
                    'REGISTER PROFILE & ENTER'
                  )}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="h-11 px-5 border border-cyber-danger/30 text-cyber-danger hover:bg-cyber-danger/10 rounded-lg transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  LOGOUT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main content block, non-interactive when registration blocker is active */}
      <div className={`flex flex-1 h-screen overflow-hidden ${showBlocker ? 'pointer-events-none select-none' : ''}`}>

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 flex flex-col border-r border-border-normal bg-bg-surface hidden md:flex">

        {/* LOGO AREA — always dark bg so logo pops in both themes */}
        <div className="h-[72px] flex items-center justify-center px-4 border-b border-border-normal" style={{ background: '#0d0d0d' }}>
          <img src="/cyberx-logo2.png" alt="CyberX Logo" className="h-10 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(255,213,74,0.4)]" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'dashboard'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'dashboard' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>D</kbd>
          </button>

          {/* Meetings */}
          <button
            onClick={() => setCurrentTab('meetings')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'meetings'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              <span>Meetings</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'meetings' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>G</kbd>
          </button>

          {/* Tasks */}
          <button
            onClick={() => setCurrentTab('tasks')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'tasks'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <ListTodo className="w-4 h-4" />
              <span>Tasks</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'tasks' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>K</kbd>
          </button>

          {/* Events */}
          <button
            onClick={() => setCurrentTab('events')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'events'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'events' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>E</kbd>
          </button>

          {/* Members */}
          <button
            onClick={() => setCurrentTab('members')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'members'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" />
              <span>Members</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'members' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>M</kbd>
          </button>

          {/* Assets */}
          <button
            onClick={() => setCurrentTab('assets')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'assets'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4" />
              <span>Assets</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'assets' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>A</kbd>
          </button>

          {/* Documents */}
          <button
            onClick={() => setCurrentTab('documents')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'documents'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'documents' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>U</kbd>
          </button>

          {/* Ledger */}
          <button
            onClick={() => setCurrentTab('ledger')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'ledger'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <ReceiptText className="w-4 h-4" />
              <span>Ledger</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'ledger' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>T</kbd>
          </button>

          {/* People */}
          <button
            onClick={() => setCurrentTab('people')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'people'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>People</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'people' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>P</kbd>
          </button>

          {/* Organizations */}
          <button
            onClick={() => setCurrentTab('organizations')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'organizations'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4" />
              <span>Organizations</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'organizations' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>O</kbd>
          </button>

          {/* Reports */}
          <button
            onClick={() => setCurrentTab('reports')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'reports'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Reports</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'reports' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>R</kbd>
          </button>

          {/* Users — Super Admin only */}
          {role === 'Super Admin' && (
            <button
              onClick={() => setCurrentTab('users')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'users'
                  ? 'bg-primary text-black font-bold'
                  : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
                }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                <span>Users</span>
              </div>
              <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'users' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>U</kbd>
            </button>
          )}

          {/* Activity Log */}
          <button
            onClick={() => setCurrentTab('logs')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'logs'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <ScrollText className="w-4 h-4" />
              <span>Activity Log</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'logs' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>L</kbd>
          </button>

          {/* Settings */}
          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${currentTab === 'settings'
                ? 'bg-primary text-black font-bold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
              }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'settings' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>S</kbd>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* STICKY HEADER (72px) */}
        <header className="h-[72px] shrink-0 sticky top-0 z-40 flex items-center justify-between px-6 border-b border-border-normal bg-bg-surface/90 backdrop-blur-md">

          {/* SEARCH TRIGGER */}
          <div className="w-96 relative hidden md:block">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-text-muted" />
            </span>
            <input
              ref={globalSearchRef}
              type="text"
              placeholder="Search ID, party, purpose... (Ctrl+K)"
              value={globalSearchVal}
              onChange={(e) => setGlobalSearchVal(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-sm bg-bg-primary border border-border-normal hover:border-border-hover focus:border-primary focus:outline-none rounded-lg text-text-heading placeholder-text-muted font-sans transition-all duration-150"
            />
            {globalSearchVal && (
              <button
                onClick={() => setGlobalSearchVal('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-heading"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="p-2 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated hover:text-text-heading transition-all duration-150"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <img src="/cyberx-logo2.png" alt="CyberX Logo" className="h-8 w-auto object-contain" />
          </div>

          {/* ACTIONS & SIMULATOR CONTROL */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* TERMINAL CLI TOGGLE */}
            <button
              onClick={() => {
                setShowCli((prev) => {
                  const next = !prev;
                  if (next) {
                    setTimeout(() => cliInputRef.current?.focus(), 50);
                  }
                  return next;
                });
              }}
              className={`p-2.5 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated hover:text-text-heading transition-all duration-150 relative ${showCli ? 'bg-bg-elevated text-text-heading border-primary' : ''}`}
              title="Toggle System CLI Console (`)"
            >
              <Terminal className="w-5 h-5" />
            </button>

            {/* THEME TOGGLE */}
            {/* <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated hover:text-text-heading transition-all duration-150"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button> */}

            {/* NOTIFICATIONS DRAWER TRIGGER */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-2.5 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated hover:text-text-heading transition-all duration-150 relative ${showNotifDropdown ? 'bg-bg-elevated text-text-heading border-primary' : ''}`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-danger opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-danger"></span>
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-bg-surface border border-border-normal rounded-xl shadow-lg py-2 z-50 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border-normal">
                    <span className="text-xs font-semibold text-text-heading font-display">Notifications</span>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-primary hover:underline font-mono"
                      >
                        MARK ALL READ
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border-normal">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-text-muted">
                        No notifications to show
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`px-4 py-2.5 hover:bg-bg-elevated transition-colors ${n.status === 'Unread' ? 'bg-primary/5 border-l-2 border-primary' : ''}`}>
                          <div className="flex gap-2">
                            {n.type === 'Approval required' ? (
                              <AlertTriangle className="w-4 h-4 text-cyber-warning shrink-0 mt-0.5" />
                            ) : n.type === 'Payment completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-cyber-success shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 text-cyber-info shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-text-heading break-words leading-tight">{n.message}</p>
                              <span className="text-[9px] text-text-muted font-mono">{new Date(n.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>


            {/* REAL SESSION USER DISPLAY */}
            <div className="flex items-center gap-2 pl-2 border-l border-border-normal/50">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-semibold text-text-heading font-mono leading-tight">{user?.username ?? '...'}</span>
                <span className="text-[9px] text-text-muted font-mono leading-tight">{role}</span>
              </div>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>

          </div>
        </header>

        {/* INTERACTIVE HACKER CLI CONSOLE */}
        {showCli && (
          <div className="bg-bg-secondary border-b border-border-normal flex flex-col font-mono text-[11px] h-48 shrink-0 transition-all duration-200">
            {/* Terminal Header */}
            <div className="px-6 py-1.5 border-b border-border-normal bg-bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-primary filter drop-shadow-[0_0_4px_rgba(255,213,74,0.4)]" />
                <span className="text-[10px] text-text-heading font-semibold">cyberx-ledger@secure-cli: ~</span>
              </div>
              <span className="text-[9px] text-text-muted">Press ` or ESC to close</span>
            </div>

            {/* Console Log Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-black/40 text-text-body font-mono">
              {cliHistory.map((line, idx) => {
                const isCmd = line.startsWith('>');
                return (
                  <div key={idx} className={isCmd ? 'text-primary font-bold' : 'text-text-muted ml-2 whitespace-pre-wrap'}>
                    {line}
                  </div>
                );
              })}
              <div ref={cliLogEndRef} />
            </div>

            {/* Input Prompt Form */}
            <form onSubmit={handleCliSubmit} className="flex items-center px-4 py-2 bg-bg-surface border-t border-border-normal">
              <span className="text-primary font-bold mr-2 select-none">&gt;</span>
              <input
                ref={cliInputRef}
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="Type 'help' for available commands..."
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-text-heading font-mono text-[11px]"
              />
              <button type="submit" className="hidden">Submit</button>
            </form>
          </div>
        )}

        {/* SUBPAGE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-bg-primary p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {currentTab === 'dashboard' && (
              <DashboardHome
                globalSearch={globalSearchVal}
                onSelectLedger={() => setCurrentTab('ledger')}
                onSelectTab={(tab) => setCurrentTab(tab as any)}
                onNewTransaction={() => {
                  setCurrentTab('ledger');
                  setOpenNewTxDrawer(true);
                }}
              />
            )}

            {currentTab === 'announcements' && (
              <AnnouncementsPanel />
            )}

            {currentTab === 'ledger' && (
              <LedgerTable
                globalSearch={globalSearchVal}
                openAddDrawer={openNewTxDrawer}
                setOpenAddDrawer={setOpenNewTxDrawer}
              />
            )}

            {currentTab === 'organizations' && (
              <OrganizationsList globalSearch={globalSearchVal} />
            )}

            {currentTab === 'people' && (
              <PeopleList globalSearch={globalSearchVal} />
            )}

            {currentTab === 'reports' && (
              <ReportsPanel />
            )}

            {currentTab === 'logs' && (
              <AuditLogsList />
            )}

            {currentTab === 'settings' && (
              <SettingsPanel />
            )}

            {currentTab === 'meetings' && (
              <MeetingsPanel />
            )}

            {currentTab === 'users' && role === 'Super Admin' && (
              <UsersPanel />
            )}

            {currentTab === 'members' && (
              <MembersPanel globalSearch={globalSearchVal} />
            )}

            {currentTab === 'events' && (
              <EventsPanel />
            )}

            {currentTab === 'assets' && (
              <AssetsPanel />
            )}

            {currentTab === 'tasks' && (
              <TasksPanel />
            )}

            {currentTab === 'documents' && (
              <DocumentsPanel />
            )}

          </div>
        </main>
      </div>

      {/* SHORTCUTS HELP DIALOG OVERLAY */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-normal rounded-xl max-w-md w-full p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border-normal pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-text-heading text-base">{"// System Shortcuts"}</h3>
              </div>
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="text-text-muted hover:text-text-heading p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">Ctrl + K / /</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Search</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">N</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">New Tx</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">D</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Dashboard</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">E</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Events</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">K</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Tasks</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">M</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Members</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">A</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Assets</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">U</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Documents</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">T</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Ledger</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">P</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">People</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">O</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Companies</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">R</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Reports</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">L</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Logs</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">S</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Settings</span>
              </div>
            </div>

            <div className="text-[10px] text-text-muted font-mono pt-2 text-center border-t border-border-normal">
              Press <kbd className="px-1 bg-bg-primary rounded">Esc</kbd> to close any dialog or menu.
            </div>
          </div>
        </div>
      )}


      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop screen dimming */}
          <div
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <aside className="relative flex flex-col w-64 max-w-xs bg-bg-surface border-r border-border-normal h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Logo Area — always dark bg */}
            <div className="h-[72px] flex items-center justify-between px-6 border-b border-border-normal" style={{ background: '#0d0d0d' }}>
              <div className="flex items-center gap-3">
                <img src="/cyberx-logo2.png" alt="CyberX Logo" className="h-10 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(255,213,74,0.4)]" />
              </div>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {[
                { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
                { tab: 'meetings', label: 'Meetings', icon: <BookOpen className="w-5 h-5" /> },
                { tab: 'tasks', label: 'Tasks', icon: <ListTodo className="w-5 h-5" /> },
                { tab: 'events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
                { tab: 'members', label: 'Members', icon: <User className="w-5 h-5" /> },
                { tab: 'assets', label: 'Assets', icon: <Wrench className="w-5 h-5" /> },
                { tab: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
                { tab: 'ledger', label: 'Ledger', icon: <ReceiptText className="w-5 h-5" /> },
                { tab: 'people', label: 'People', icon: <Users className="w-5 h-5" /> },
                { tab: 'organizations', label: 'Organizations', icon: <Building2 className="w-5 h-5" /> },
                { tab: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
                ...(role === 'Super Admin' ? [{ tab: 'users', label: 'Users', icon: <Shield className="w-5 h-5" /> }] : []),
                { tab: 'logs', label: 'Activity Log', icon: <ScrollText className="w-5 h-5" /> },
                { tab: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => {
                    setCurrentTab(item.tab as 'dashboard' | 'ledger' | 'organizations' | 'people' | 'reports' | 'logs' | 'settings' | 'users' | 'meetings' | 'members' | 'events' | 'assets' | 'tasks' | 'documents' | 'announcements');
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${currentTab === item.tab
                      ? 'bg-primary text-black font-semibold'
                      : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
            </nav>

            {/* Drawer footer quick actions */}
            <div className="p-4 border-t border-border-normal space-y-2 bg-bg-elevated/40">
              {role !== 'Read Only' && (
                <button
                  onClick={() => {
                    setCurrentTab('ledger');
                    setOpenNewTxDrawer(true);
                    setShowMobileSidebar(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-black font-medium text-xs transition-all duration-150 animate-pulse"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Transaction</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowShortcutsHelp(true);
                  setShowMobileSidebar(false);
                }}
                className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated text-xs transition-all duration-150"
              >
                <Keyboard className="w-4 h-4 text-text-muted" />
                <span>Shortcuts</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      </div>
    </div>
  );
}
