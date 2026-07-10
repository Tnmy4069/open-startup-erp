'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp, UserRole } from '@/context/AppContext';
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
  ChevronDown,
  X,
  Plus,
  Terminal,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { DashboardHome } from './DashboardHome';
import { LedgerTable } from './LedgerTable';
import { OrganizationsList } from './OrganizationsList';
import { PeopleList } from './PeopleList';
import { ReportsPanel } from './ReportsPanel';
import { AuditLogsList } from './AuditLogsList';
import { SettingsPanel } from './SettingsPanel';

export function DashboardShell() {
  const {
    role,
    setRole,
    theme,
    setTheme,
    notifications,
    setNotifications,
    refreshData
  } = useApp();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'ledger' | 'organizations' | 'people' | 'reports' | 'logs' | 'settings'>('dashboard');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [globalSearchVal, setGlobalSearchVal] = useState('');
  
  // Dialog state trigger (New transaction)
  const [openNewTxDrawer, setOpenNewTxDrawer] = useState(false);

  const globalSearchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if focusing input or textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === '/')) {
        e.preventDefault();
        globalSearchRef.current?.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setCurrentTab('ledger');
        setOpenNewTxDrawer(true);
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
        setShowRoleDropdown(false);
        setShowNotifDropdown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      // In a real app we'd trigger a bulk API call. Here we update local state:
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'Read' })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadNotifCount = notifications.filter((n) => n.status === 'Unread').length;

  const roles: UserRole[] = ['Super Admin', 'Finance Head', 'Treasurer', 'Committee Member', 'Read Only'];

  return (
    <div className="flex h-screen bg-bg-primary text-text-body font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 flex flex-col border-r border-border-normal bg-bg-surface hidden md:flex">
        
        {/* LOGO AREA */}
        <div className="h-[72px] flex items-center gap-3 px-6 border-b border-border-normal">
          <Terminal className="w-6 h-6 text-primary filter drop-shadow-[0_0_6px_rgba(255,213,74,0.4)]" />
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg text-text-heading leading-tight tracking-wider">CYBERX</span>
            <span className="text-[10px] text-text-muted font-mono tracking-widest">{"// LEDGER V1.0"}</span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentTab === 'dashboard'
                ? 'bg-primary text-black font-semibold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'dashboard' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>D</kbd>
          </button>

          <button
            onClick={() => setCurrentTab('ledger')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentTab === 'ledger'
                ? 'bg-primary text-black font-semibold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <div className="flex items-center gap-3">
              <ReceiptText className="w-5 h-5" />
              <span>Ledger</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'ledger' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>T</kbd>
          </button>

          <button
            onClick={() => setCurrentTab('organizations')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentTab === 'organizations'
                ? 'bg-primary text-black font-semibold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5" />
              <span>Organizations</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'organizations' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>O</kbd>
          </button>

          <button
            onClick={() => setCurrentTab('people')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentTab === 'people'
                ? 'bg-primary text-black font-semibold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span>People</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'people' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>P</kbd>
          </button>

          <button
            onClick={() => setCurrentTab('reports')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentTab === 'reports'
                ? 'bg-primary text-black font-semibold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5" />
              <span>Reports</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'reports' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>R</kbd>
          </button>

          <button
            onClick={() => setCurrentTab('logs')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentTab === 'logs'
                ? 'bg-primary text-black font-semibold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <div className="flex items-center gap-3">
              <ScrollText className="w-5 h-5" />
              <span>Activity Log</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'logs' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>L</kbd>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentTab === 'settings'
                ? 'bg-primary text-black font-semibold'
                : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </div>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${currentTab === 'settings' ? 'bg-black/10 text-black' : 'bg-bg-primary text-text-muted border border-border-normal'}`}>S</kbd>
          </button>
        </nav>

        {/* BOTTOM QUICK CTAS */}
        <div className="p-4 border-t border-border-normal space-y-2">
          {role !== 'Read Only' && (
            <button
              onClick={() => {
                setCurrentTab('ledger');
                setOpenNewTxDrawer(true);
              }}
              className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-90 text-black font-medium transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs">New Transaction</span>
            </button>
          )}
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated transition-all duration-150 text-xs"
          >
            <Keyboard className="w-4 h-4 text-text-muted" />
            <span>Shortcuts (?)</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* STICKY HEADER (72px) */}
        <header className="h-[72px] shrink-0 sticky top-0 z-40 flex items-center justify-between px-6 border-b border-border-normal bg-bg-surface/90 backdrop-blur-md">
          
          {/* SEARCH TRIGGER */}
          <div className="w-96 relative hidden sm:block">
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
          
          <div className="flex items-center gap-2 sm:hidden font-display font-bold text-text-heading text-lg">
            CYBERX LEDGER
          </div>

          {/* ACTIONS & SIMULATOR CONTROL */}
          <div className="flex items-center gap-4">
            
            {/* THEME TOGGLE */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated hover:text-text-heading transition-all duration-150"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

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

            {/* SIMULATED SESSION ROLE DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-normal bg-bg-surface hover:border-border-hover text-sm font-medium transition-all duration-150 focus:outline-none"
              >
                <User className="w-4 h-4 text-text-muted" />
                <span className="text-xs text-text-heading font-mono hidden sm:inline">{role}</span>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-bg-surface border border-border-normal rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-1.5 border-b border-border-normal mb-1">
                    <span className="text-[10px] text-text-muted font-mono tracking-wider">{"// SIMULATE ROLE"}</span>
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setShowRoleDropdown(false);
                        refreshData();
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-xs text-left transition-colors duration-150 ${
                        role === r
                          ? 'bg-primary text-black font-semibold'
                          : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
                      }`}
                    >
                      <span>{r}</span>
                      {role === r && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </header>

        {/* SUBPAGE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-bg-primary p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* RENDER THE CORRECT MODULE CONTENT */}
            {currentTab === 'dashboard' && (
              <DashboardHome
                globalSearch={globalSearchVal}
                onSelectLedger={() => setCurrentTab('ledger')}
              />
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
                <span className="text-text-muted">T</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Ledger</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">O</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Companies</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">P</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">People</span>
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
              <div className="flex justify-between items-center py-1 border-b border-border-normal/40">
                <span className="text-text-muted">?</span>
                <span className="text-text-heading bg-bg-primary px-1.5 py-0.5 rounded border border-border-normal">Help Menu</span>
              </div>
            </div>

            <div className="text-[10px] text-text-muted font-mono pt-2 text-center border-t border-border-normal">
              Press <kbd className="px-1 bg-bg-primary rounded">Esc</kbd> to close any dialog or menu.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
