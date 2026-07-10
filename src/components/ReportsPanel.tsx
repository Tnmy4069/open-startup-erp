'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Building,
  User,
  Plane,
  ShoppingBag,
  Clock,
  Loader
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  type: string;
  purpose: string;
  party: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  referenceNumber?: string;
}

interface ReportStat {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: string; // The report identifier
  filters: Record<string, string>;
}

const reportsList: ReportStat[] = [
  {
    title: 'Income Report',
    description: 'Breakdown of sponsorships, ticket sales, and merchandise revenue.',
    icon: <TrendingUp className="w-5 h-5 text-cyber-success" />,
    type: 'income',
    filters: { type: 'Income' }
  },
  {
    title: 'Expense Report',
    description: 'Analysis of equipment, workshops, food, marketing, and speakers.',
    icon: <TrendingDown className="w-5 h-5 text-cyber-danger" />,
    type: 'expense',
    filters: { type: 'Expense' }
  },
  {
    title: 'Monthly Report',
    description: 'Financial ledger details for the current calendar month.',
    icon: <Calendar className="w-5 h-5 text-primary" />,
    type: 'monthly',
    filters: { dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10) }
  },
  {
    title: 'Yearly Report',
    description: 'Comprehensive annual financial statement ledger.',
    icon: <Calendar className="w-5 h-5 text-cyber-info" />,
    type: 'yearly',
    filters: { dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10) }
  },
  {
    title: 'Pending Payments',
    description: 'Overview of all pending income invoices and unpaid vendor dues.',
    icon: <Clock className="w-5 h-5 text-cyber-warning" />,
    type: 'pending',
    filters: { status: 'Pending' }
  },
  {
    title: 'Organization Report',
    description: 'Balances and payments log aggregated by corporate partners.',
    icon: <Building className="w-5 h-5 text-text-muted" />,
    type: 'organization',
    filters: { filterParty: 'Corp,Solutions,School,Global' }
  },
  {
    title: 'Person Report',
    description: 'Individual ledgers for members, speakers, and volunteers.',
    icon: <User className="w-5 h-5 text-text-muted" />,
    type: 'person',
    filters: { filterRole: 'Speaker,Vendor,Member' }
  },
  {
    title: 'Travel Report',
    description: 'Detailed logistics travel and speaker accommodation payouts.',
    icon: <Plane className="w-5 h-5 text-text-muted" />,
    type: 'travel',
    filters: { purpose: 'Travel' }
  },
  {
    title: 'Merchandise Report',
    description: 'Summary of community hoodies, sticker printing, and badge sales.',
    icon: <ShoppingBag className="w-5 h-5 text-text-muted" />,
    type: 'merchandise',
    filters: { purpose: 'Merchandise' }
  }
];

export function ReportsPanel() {
  const { triggerNotification } = useApp();
  const [selectedReport, setSelectedReport] = useState<string>('income');
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats computed on the fetched report data
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [averageAmount, setAverageAmount] = useState(0);

  const computeStats = useCallback((data: Transaction[]) => {
    const count = data.length;
    const sum = data.reduce((acc, curr) => acc + curr.amount, 0);
    const avg = count > 0 ? sum / count : 0;
    
    setTotalRecords(count);
    setTotalVolume(sum);
    setAverageAmount(avg);
  }, []);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const activeReport = reportsList.find((r) => r.type === selectedReport);
      if (!activeReport) return;

      const params = new URLSearchParams({ limit: '1000' });
      
      if (activeReport.filters.type) params.append('type', activeReport.filters.type);
      if (activeReport.filters.status) params.append('status', activeReport.filters.status);
      if (activeReport.filters.purpose) params.append('purpose', activeReport.filters.purpose);
      if (activeReport.filters.dateFrom) params.append('dateFrom', activeReport.filters.dateFrom);
      
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = (data.transactions || []) as Transaction[];

        if (selectedReport === 'organization') {
          filtered = filtered.filter((t: Transaction) => 
            t.party.includes('Corp') || t.party.includes('Solutions') || t.party.includes('School') || t.party.includes('Global')
          );
        } else if (selectedReport === 'person') {
          filtered = filtered.filter((t: Transaction) => 
            !t.party.includes('Corp') && !t.party.includes('Solutions') && !t.party.includes('School') && !t.party.includes('Global')
          );
        }

        setReportData(filtered);
        computeStats(filtered);
      }
    } catch (e) {
      console.error('Failed to load report ledger:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedReport, computeStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      generateReport();
    }, 0);
    return () => clearTimeout(timer);
  }, [generateReport]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
    triggerNotification(`Printed statement statement for ${selectedReport.toUpperCase()} report`, 'System');
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = ['Tx ID', 'Date', 'Type', 'Purpose', 'Party', 'Amount', 'Status', 'Method'];
    const rows = reportData.map((tx) => [
      tx.id,
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      tx.purpose,
      tx.party,
      tx.amount,
      tx.status,
      tx.paymentMethod || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((e) => e.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cyberx_${selectedReport}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification(`Exported statement data to CSV format`, 'System');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Reports Compilations"}</h2>
        <p className="text-[10px] text-text-muted font-mono mt-0.5 font-medium">Select and export specialized financial statements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Report types list */}
        <div className="space-y-2 lg:col-span-1">
          <span className="text-[10px] text-text-muted font-mono tracking-wider block mb-2 font-semibold">AVAILABLE STATEMENTS</span>
          
          <div className="space-y-2">
            {reportsList.map((rep) => (
              <button
                key={rep.type}
                onClick={() => setSelectedReport(rep.type)}
                className={`w-full flex items-start gap-4 p-4 border rounded-xl text-left transition-all duration-150 ${
                  selectedReport === rep.type
                    ? 'bg-bg-surface border-primary ring-1 ring-primary shadow-sm'
                    : 'bg-bg-surface border-border-normal hover:border-border-hover'
                }`}
              >
                <span className="mt-0.5 shrink-0">{rep.icon}</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-text-heading font-sans leading-none">{rep.title}</h4>
                  <p className="text-[10px] text-text-muted leading-relaxed">{rep.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Preview & Export actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Header Card */}
          <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-normal/40 pb-4">
              <div>
                <span className="text-[10px] text-text-muted font-mono">{"// REPORT PREVIEW"}</span>
                <h3 className="font-display font-bold text-text-heading text-base">
                  {reportsList.find((r) => r.type === selectedReport)?.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  disabled={loading || reportData.length === 0}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg bg-bg-surface border border-border-normal hover:bg-bg-elevated text-xs font-semibold font-sans transition-colors disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5 text-text-muted" />
                  <span>Print PDF</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  disabled={loading || reportData.length === 0}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-black hover:bg-primary/95 text-xs font-bold font-sans transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Calculations Summary Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-bg-primary/40 border border-border-normal/60 rounded-xl p-4 space-y-1">
                <span className="text-[9px] font-mono text-text-muted">RECORD COUNT</span>
                <p className="text-lg font-bold text-text-heading font-mono leading-none">
                  {loading ? <Loader className="w-4 h-4 text-primary animate-spin" /> : totalRecords}
                </p>
              </div>
              <div className="bg-bg-primary/40 border border-border-normal/60 rounded-xl p-4 space-y-1">
                <span className="text-[9px] font-mono text-text-muted font-semibold text-primary">TOTAL VOLUME</span>
                <p className="text-lg font-bold text-text-heading font-mono leading-none">
                  {loading ? <Loader className="w-4 h-4 text-primary animate-spin" /> : formatCurrency(totalVolume)}
                </p>
              </div>
              <div className="bg-bg-primary/40 border border-border-normal/60 rounded-xl p-4 space-y-1">
                <span className="text-[9px] font-mono text-text-muted">AVERAGE / ITEM</span>
                <p className="text-lg font-bold text-text-heading font-mono leading-none">
                  {loading ? <Loader className="w-4 h-4 text-primary animate-spin" /> : formatCurrency(averageAmount)}
                </p>
              </div>
            </div>

          </div>

          {/* Quick Ledger preview table */}
          <div className="space-y-3">
            <span className="text-[10px] text-text-muted font-mono">{"// RECENT ENTRIES IN STATEMENT"}</span>
            <div className="border border-border-normal rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px] font-sans">
                <thead>
                  <tr className="bg-bg-elevated/40 border-b border-border-normal font-mono text-[10px] text-text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Party</th>
                    <th className="py-2.5 px-4">Purpose</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-normal text-text-body">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-text-muted font-mono animate-pulse">{"// Querying database..."}</td>
                    </tr>
                  ) : reportData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-text-muted font-mono">{"// No items match this report scope."}</td>
                    </tr>
                  ) : (
                    reportData.slice(0, 5).map((tx) => {
                      return (
                        <tr key={tx.id} className="hover:bg-bg-elevated/10">
                          <td className="py-3 px-4 font-mono">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium text-text-heading">{tx.party}</td>
                          <td className="py-3 px-4">{tx.purpose}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                              tx.status === 'Completed'
                                ? 'bg-cyber-success/10 text-cyber-success'
                                : 'bg-cyber-warning/10 text-cyber-warning'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-text-heading">
                            <span className={tx.type === 'Income' ? 'text-cyber-success' : 'text-text-heading'}>
                              {tx.type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {reportData.length > 5 && (
              <p className="text-[10px] text-text-muted font-mono text-right italic">
                * Showing first 5 of {reportData.length} records. Use exports to view full dataset.
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
