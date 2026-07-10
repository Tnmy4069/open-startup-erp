'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Search, RefreshCw, FileDown } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  role: string;
  details: string;
}

export function AuditLogsList() {
  const { refreshTrigger, triggerNotification } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchLogs();
    }, 0);
  }, [refreshTrigger]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Created':
        return 'text-primary';
      case 'Approved':
        return 'text-cyber-success';
      case 'Deleted':
        return 'text-cyber-danger';
      case 'Updated':
        return 'text-cyber-info';
      case 'Login':
        return 'text-cyber-success';
      case 'Exported':
        return 'text-purple-400';
      default:
        return 'text-text-muted';
    }
  };

  const exportLogsCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Details'];
    const rows = logs.map((log) => [
      log.id,
      new Date(log.timestamp).toLocaleString(),
      log.user,
      log.role,
      log.action,
      log.details
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((e) => e.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cyberx_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('Exported full administrative activity logs to CSV', 'Exported');
  };

  const filteredLogs = logs.filter((log) => {
    const s = searchVal.toLowerCase();
    return (
      log.user.toLowerCase().includes(s) ||
      log.role.toLowerCase().includes(s) ||
      log.action.toLowerCase().includes(s) ||
      log.details.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Administrative Security Audit Logs"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">Cryptographic log stream and action tracking console</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center justify-center p-2.5 rounded-lg border border-border-normal bg-bg-surface hover:bg-bg-elevated text-text-body transition-colors"
            title="Refresh Log Feed"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={exportLogsCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-bg-surface border border-border-normal hover:bg-bg-elevated text-xs font-semibold font-sans transition-colors"
          >
            <FileDown className="w-4 h-4 text-text-muted" />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="w-full relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-text-muted" />
        </span>
        <input
          type="text"
          placeholder="Filter log entries by user, role, details..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full h-11 pl-10 pr-4 text-xs bg-bg-surface border border-border-normal hover:border-border-hover focus:border-primary focus:outline-none rounded-lg text-text-heading placeholder-text-muted transition-colors"
        />
      </div>

      {/* TERMINAL VIEWER CONTAINER */}
      <div className="bg-bg-surface border border-border-normal rounded-xl overflow-hidden flex flex-col font-mono text-xs">
        
        {/* Terminal Header */}
        <div className="px-4 py-2 border-b border-border-normal bg-bg-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] text-text-heading font-semibold tracking-wider">cyberx-audit@secure-console</span>
          </div>
          <span className="text-[9px] text-text-muted">LOG_RECORDS: {filteredLogs.length}</span>
        </div>

        {/* Terminal Console */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto bg-bg-primary text-[11px] leading-relaxed">
          {loading ? (
            <div className="text-text-muted animate-pulse">{"// Querying cloud logs database..."}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-text-muted">{"// End of file. No logs recorded."}</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border-b border-border-normal/20 pb-3 space-y-1">
                <div className="flex justify-between items-center text-[9px] text-text-muted">
                  <div className="flex items-center gap-2">
                    <span className="text-text-heading font-bold">{log.user}</span>
                    <span>•</span>
                    <span>{log.role}</span>
                  </div>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                
                <p className="text-text-body font-mono">
                  <span className={`font-bold ${getActionColor(log.action)}`}>
                    {`[${log.action.toUpperCase()}]`}
                  </span>{' '}
                  {log.details}
                </p>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
