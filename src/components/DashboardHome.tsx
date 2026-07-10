'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Clock,
  CheckCircle,
  Calendar,
  FileClock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface DashboardData {
  kpi: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    pendingIncome: number;
    pendingExpenses: number;
    completedCount: number;
    pendingCount: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  };
  charts: {
    incomeVsExpense: Array<{ month: string; income: number; expense: number }>;
    monthlyCashFlow: Array<{ month: string; cashflow: number }>;
    expenseDistribution: Array<{ name: string; value: number }>;
    incomeSources: Array<{ name: string; value: number }>;
  };
  reminders: Array<{ id: string; title: string; dueDate: string; amount: number; type: string }>;
  recentLogs: Array<{ id: string; action: string; timestamp: string; user: string; role: string; details: string }>;
}

export function DashboardHome({ globalSearch, onSelectLedger }: { globalSearch: string; onSelectLedger: () => void }) {
  const { refreshTrigger, theme } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      }
    } catch (e) {
      console.error('Failed to load dashboard statistics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      fetchData();
    }, 0);
  }, [refreshTrigger]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-28 bg-bg-surface border border-border-normal rounded-xl animate-pulse" />
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-bg-surface border border-border-normal rounded-xl animate-pulse" />
          <div className="h-80 bg-bg-surface border border-border-normal rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { kpi, charts, reminders, recentLogs } = data;

  const COLORS = ['#FFD54A', '#5CAEFF', '#35D07F', '#FFC857', '#FF5C5C', '#A855F7', '#EC4899'];

  return (
    <div className="space-y-6">
      
      {/* GLOBAL SEARCH HIGHLIGHT REDIRECT */}
      {globalSearch && (
        <div 
          onClick={onSelectLedger}
          className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between cursor-pointer hover:bg-primary/20 transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <p className="text-xs text-text-heading">
              Active search query: <span className="font-mono font-semibold text-primary">&quot;{globalSearch}&quot;</span>. Click to view matching results in the Transactions Ledger.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-primary" />
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Net Balance */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">NET BALANCE</span>
            <span className="p-2 bg-primary/10 text-primary rounded-lg"><Scale className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-text-heading font-display tracking-tight">
              {formatCurrency(kpi.netBalance)}
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{"// Total Assets Liquidity"}</p>
          </div>
        </div>

        {/* 2. Total Income */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-success transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">TOTAL INCOME</span>
            <span className="p-2 bg-cyber-success/15 text-cyber-success rounded-lg"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-text-heading font-display tracking-tight">
              {formatCurrency(kpi.totalIncome)}
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{"// All Completed Earnings"}</p>
          </div>
        </div>

        {/* 3. Total Expenses */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-danger transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">TOTAL EXPENSES</span>
            <span className="p-2 bg-cyber-danger/15 text-cyber-danger rounded-lg"><TrendingDown className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-text-heading font-display tracking-tight">
              {formatCurrency(kpi.totalExpenses)}
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{"// All Completed Payouts"}</p>
          </div>
        </div>

        {/* 4. Pending Income */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">PENDING INCOME</span>
            <span className="p-2 bg-primary/10 text-primary rounded-lg"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-text-heading font-display tracking-tight">
              {formatCurrency(kpi.pendingIncome)}
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{"// Invoices & Sponsorships Pending"}</p>
          </div>
        </div>

        {/* 5. Pending Expenses */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-warning transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">PENDING EXPENSES</span>
            <span className="p-2 bg-cyber-warning/15 text-cyber-warning rounded-lg"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-text-heading font-display tracking-tight">
              {formatCurrency(kpi.pendingExpenses)}
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{"// Outstanding Invoices & Dues"}</p>
          </div>
        </div>

        {/* 6. Completed vs Pending Transactions */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-info transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">LEDGER STATUS</span>
            <span className="p-2 bg-cyber-info/15 text-cyber-info rounded-lg"><CheckCircle className="w-4 h-4" /></span>
          </div>
          <div className="mt-4 flex gap-4 items-baseline">
            <div>
              <span className="text-2xl font-bold text-text-heading font-display">{kpi.completedCount}</span>
              <span className="text-[10px] text-cyber-success font-mono ml-1">done</span>
            </div>
            <div className="border-l border-border-normal h-4 self-center"></div>
            <div>
              <span className="text-2xl font-bold text-text-heading font-display">{kpi.pendingCount}</span>
              <span className="text-[10px] text-cyber-warning font-mono ml-1">pending</span>
            </div>
          </div>
        </div>

        {/* 7. Monthly Income */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-success transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">MONTHLY INCOME</span>
            <span className="p-2 bg-cyber-success/15 text-cyber-success rounded-lg"><Calendar className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-text-heading font-display tracking-tight">
              {formatCurrency(kpi.monthlyIncome)}
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{"// Current Calendar Month"}</p>
          </div>
        </div>

        {/* 8. Monthly Expenses */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-danger transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">MONTHLY EXPENSES</span>
            <span className="p-2 bg-cyber-danger/15 text-cyber-danger rounded-lg"><Calendar className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-text-heading font-display tracking-tight">
              {formatCurrency(kpi.monthlyExpenses)}
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{"// Current Calendar Month"}</p>
          </div>
        </div>

        {/* 9. Completed Payments Counter */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-text-muted font-display tracking-wider">APPROVAL RATIO</span>
            <span className="p-2 bg-primary/10 text-primary rounded-lg"><FileClock className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-text-heading font-display tracking-tight">
              {kpi.completedCount + kpi.pendingCount > 0 
                ? `${Math.round((kpi.completedCount / (kpi.completedCount + kpi.pendingCount)) * 100)}%` 
                : '100%'}
            </h2>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{"// Approved vs Submitted Transactions"}</p>
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Income vs Expense Area Chart */}
          <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Income vs Expense Trend"}</span>
              <span className="text-[10px] text-text-muted font-mono">Past 6 Months</span>
            </div>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.incomeVsExpense} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#35D07F" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#35D07F" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5C5C" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FF5C5C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2B2B2B' : '#E5E7EB'} />
                  <XAxis dataKey="month" stroke={theme === 'dark' ? '#8A8A8A' : '#6B7280'} />
                  <YAxis stroke={theme === 'dark' ? '#8A8A8A' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#171717' : '#FFFFFF', 
                      borderColor: theme === 'dark' ? '#2B2B2B' : '#E5E7EB',
                      color: theme === 'dark' ? '#FFFFFF' : '#111111'
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#35D07F" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#FF5C5C" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Net Cash Flow Bar Chart */}
          <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Net Cash Flow"}</span>
              <span className="text-[10px] text-text-muted font-mono">Net Earnings History</span>
            </div>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyCashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2B2B2B' : '#E5E7EB'} />
                  <XAxis dataKey="month" stroke={theme === 'dark' ? '#8A8A8A' : '#6B7280'} />
                  <YAxis stroke={theme === 'dark' ? '#8A8A8A' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#171717' : '#FFFFFF', 
                      borderColor: theme === 'dark' ? '#2B2B2B' : '#E5E7EB',
                      color: theme === 'dark' ? '#FFFFFF' : '#111111'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="cashflow" name="Net Cash Flow" radius={[4, 4, 0, 0]}>
                    {charts.monthlyCashFlow.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cashflow >= 0 ? '#35D07F' : '#FF5C5C'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Expense Categories Pie Chart */}
          <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Expense Distribution"}</span>
              <span className="text-[10px] text-text-muted font-mono">Category Breakdown</span>
            </div>
            <div className="h-72 w-full text-xs flex flex-col sm:flex-row justify-center items-center">
              {charts.expenseDistribution.length === 0 ? (
                <div className="text-text-muted text-xs font-mono">No expense records found</div>
              ) : (
                <>
                  <div className="h-full w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.expenseDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {charts.expenseDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0 font-mono text-[10px]">
                    {charts.expenseDistribution.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between border-b border-border-normal/40 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-text-body">{entry.name}</span>
                        </div>
                        <span className="text-text-heading font-semibold">{formatCurrency(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Chart 4: Income Sources Pie Chart */}
          <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Income Sources"}</span>
              <span className="text-[10px] text-text-muted font-mono">Revenue Categories</span>
            </div>
            <div className="h-72 w-full text-xs flex flex-col sm:flex-row justify-center items-center">
              {charts.incomeSources.length === 0 ? (
                <div className="text-text-muted text-xs font-mono">No income records found</div>
              ) : (
                <>
                  <div className="h-full w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.incomeSources}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {charts.incomeSources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0 font-mono text-[10px]">
                    {charts.incomeSources.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between border-b border-border-normal/40 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-text-body">{entry.name}</span>
                        </div>
                        <span className="text-text-heading font-semibold">{formatCurrency(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      )}

      {/* BOTTOM WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reminders List (2/3 width) */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-border-normal/40 pb-2">
            <h3 className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Reminders & Outstanding Dues"}</h3>
            <span className="text-[10px] bg-cyber-warning/10 text-cyber-warning px-2 py-0.5 rounded-full font-mono font-semibold">
              {reminders.length} Active
            </span>
          </div>

          <div className="divide-y divide-border-normal/40">
            {reminders.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-muted font-mono">
                All cleared! No pending reimbursements or dues.
              </div>
            ) : (
              reminders.map((rem) => (
                <div key={rem.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                        rem.type === 'Overdue Payment'
                          ? 'bg-cyber-danger/10 text-cyber-danger'
                          : rem.type === 'Pending Reimbursement'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-cyber-warning/10 text-cyber-warning'
                      }`}>
                        {rem.type.toUpperCase()}
                      </span>
                      <p className="font-medium text-text-heading leading-snug">{rem.title}</p>
                    </div>
                    <p className="text-[10px] text-text-muted font-mono">
                      Due: {new Date(rem.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-text-heading font-mono">{formatCurrency(rem.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mini Terminal Activity Logs (1/3 width) */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-border-normal/40 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Audit Console"}</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-cyber-success animate-pulse"></span>
          </div>

          {/* Command Terminal Ticker */}
          <div className="bg-bg-primary rounded-lg border border-border-normal p-4 font-mono text-[10px] flex-1 space-y-3 overflow-y-auto leading-relaxed max-h-[300px]">
            {recentLogs.length === 0 ? (
              <div className="text-text-muted">{"// Ready. No logs recorded."}</div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="space-y-1">
                  <div className="flex justify-between items-center text-text-muted text-[9px] border-b border-border-normal/20 pb-0.5">
                    <span>{log.user} ({log.role})</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-text-body font-mono">
                    <span className={`font-bold ${
                      log.action === 'Deleted' 
                        ? 'text-cyber-danger' 
                        : log.action === 'Approved'
                        ? 'text-cyber-success'
                        : log.action === 'Created'
                        ? 'text-primary'
                        : 'text-cyber-info'
                    }`}>
                      {`> [${log.action}] `}
                    </span>
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
