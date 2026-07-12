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
  ChevronRight,
  Wrench,
  ClipboardList,
  CheckSquare,
  FileText,
  Users,
  AlertCircle
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
    memberCount: number;
    assetCount: number;
    eventCount: number;
    taskCount: number;
  };
  charts: {
    incomeVsExpense: Array<{ month: string; income: number; expense: number }>;
    monthlyCashFlow: Array<{ month: string; cashflow: number }>;
    expenseDistribution: Array<{ name: string; value: number }>;
    incomeSources: Array<{ name: string; value: number }>;
  };
  reminders: Array<{ id: string; title: string; dueDate: string; amount: number; type: string }>;
  recentLogs: Array<{ id: string; action: string; timestamp: string; user: string; role: string; details: string }>;
  myTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    dueDate: string | null;
  }>;
  myAssets: Array<{
    id: string;
    assetId: string;
    name: string;
    category: string;
    condition: string;
    location: string;
  }>;
  myEvents: Array<{
    id: string;
    status: string;
    event: {
      id: string;
      title: string;
      date: string;
      venue: string;
      category: string;
    };
  }>;
}

export function DashboardHome({ globalSearch, onSelectLedger }: { globalSearch: string; onSelectLedger: () => void }) {
  const { refreshTrigger, theme, role, user: sessionUser } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [typedWelcome, setTypedWelcome] = useState('');
  
  useEffect(() => {
    const fullText = `ACCESS AUTHORIZED for role: ${role || 'MEMBER'}. CONNECTION ESTABLISHED.`;
    let currentIdx = 0;
    const interval = setInterval(() => {
      setTypedWelcome(fullText.slice(0, currentIdx + 1));
      currentIdx++;
      if (currentIdx >= fullText.length) {
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [role]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-bg-surface border border-border-normal rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-bg-surface border border-border-normal rounded-xl animate-pulse" />
          <div className="h-80 bg-bg-surface border border-border-normal rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { kpi, charts, reminders, recentLogs, myTasks, myAssets, myEvents } = data;
  const COLORS = ['#FFD54A', '#5CAEFF', '#35D07F', '#FFC857', '#FF5C5C', '#A855F7', '#EC4899'];

  // Render role-specific dashboards
  const isFinanceOrAdmin = role === 'Super Admin' || role === 'Finance Head';

  return (
    <div className="space-y-6">
      
      {/* TERMINAL STATUS BAR */}
      <div className="bg-bg-secondary border border-border-normal rounded-xl p-4 font-mono text-[10px] text-text-heading flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-success animate-ping shrink-0" />
          <span className="text-cyber-success font-bold font-mono">$ {typedWelcome}</span>
          <span className="inline-block w-1.5 h-3 bg-primary animate-pulse ml-0.5" />
        </div>
        <span className="text-text-muted hidden md:inline font-mono">ROLE: {role ? role.toUpperCase() : 'GUEST'}</span>
      </div>

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

      {/* -------------------- 1. SUPER ADMIN / FINANCE HEAD DASHBOARD -------------------- */}
      {isFinanceOrAdmin && (
        <>
          {/* KPI GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-text-muted font-mono tracking-wider">NET BALANCE</span>
                <span className="p-1.5 bg-primary/10 text-primary rounded-lg"><Scale className="w-4 h-4" /></span>
              </div>
              <div className="mt-3">
                <h2 className="text-xl font-bold text-text-heading font-display tracking-tight">
                  {formatCurrency(kpi.netBalance)}
                </h2>
                <p className="text-[9px] text-text-muted font-mono mt-0.5">{"// Total Assets Liquidity"}</p>
              </div>
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-success transition-all duration-200">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-text-muted font-mono tracking-wider">TOTAL REVENUE</span>
                <span className="p-1.5 bg-cyber-success/10 text-cyber-success rounded-lg"><TrendingUp className="w-4 h-4" /></span>
              </div>
              <div className="mt-3">
                <h2 className="text-xl font-bold text-text-heading font-display tracking-tight">
                  {formatCurrency(kpi.totalIncome)}
                </h2>
                <p className="text-[9px] text-text-muted font-mono mt-0.5">{"// Earnings Completed"}</p>
              </div>
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-danger transition-all duration-200">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-text-muted font-mono tracking-wider">TOTAL EXPENSES</span>
                <span className="p-1.5 bg-cyber-danger/10 text-cyber-danger rounded-lg"><TrendingDown className="w-4 h-4" /></span>
              </div>
              <div className="mt-3">
                <h2 className="text-xl font-bold text-text-heading font-display tracking-tight">
                  {formatCurrency(kpi.totalExpenses)}
                </h2>
                <p className="text-[9px] text-text-muted font-mono mt-0.5">{"// Cash Payouts Completed"}</p>
              </div>
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-cyber-warning transition-all duration-200">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-text-muted font-mono tracking-wider">PENDING OUTSTANDINGS</span>
                <span className="p-1.5 bg-cyber-warning/10 text-cyber-warning rounded-lg"><Clock className="w-4 h-4" /></span>
              </div>
              <div className="mt-3">
                <h2 className="text-xl font-bold text-text-heading font-display tracking-tight">
                  {formatCurrency(kpi.pendingExpenses + kpi.pendingIncome)}
                </h2>
                <p className="text-[9px] text-text-muted font-mono mt-0.5">{"// Dues & Unapproved Invoices"}</p>
              </div>
            </div>
          </div>

          {/* Operations Overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Community Members</span>
                <h3 className="text-2xl font-bold text-text-heading font-display">{kpi.memberCount}</h3>
              </div>
              <Users className="w-6 h-6 text-primary/40" />
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Upcoming Events</span>
                <h3 className="text-2xl font-bold text-text-heading font-display">{kpi.eventCount}</h3>
              </div>
              <Calendar className="w-6 h-6 text-primary/40" />
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">System Assets</span>
                <h3 className="text-2xl font-bold text-text-heading font-display">{kpi.assetCount}</h3>
              </div>
              <Wrench className="w-6 h-6 text-primary/40" />
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Operational Tasks</span>
                <h3 className="text-2xl font-bold text-text-heading font-display">{kpi.taskCount}</h3>
              </div>
              <ClipboardList className="w-6 h-6 text-primary/40" />
            </div>
          </div>

          {/* CHARTS */}
          {mounted && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
                <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Income vs Expense Trend"}</span>
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
                      <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#171717' : '#FFFFFF', borderColor: theme === 'dark' ? '#2B2B2B' : '#E5E7EB', color: theme === 'dark' ? '#FFFFFF' : '#111111' }} />
                      <Legend />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#35D07F" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#FF5C5C" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
                <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Expense Categories breakdown"}</span>
                <div className="h-72 w-full text-xs flex flex-col sm:flex-row justify-center items-center">
                  {charts.expenseDistribution.length === 0 ? (
                    <div className="text-text-muted text-xs font-mono">No expense records found</div>
                  ) : (
                    <>
                      <div className="h-full w-full sm:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={charts.expenseDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                              {charts.expenseDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full sm:w-1/2 space-y-1.5 font-mono text-[10px] overflow-y-auto max-h-60 pr-1">
                        {charts.expenseDistribution.map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between border-b border-border-normal/40 pb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                              <span className="text-text-body truncate max-w-[90px]">{entry.name}</span>
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

          {/* BOTTOM TABLES AND TERMINAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4 lg:col-span-2">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Reminders & Pending Cash Inflows"}</span>
              <div className="divide-y divide-border-normal/40">
                {reminders.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-muted font-mono">
                    No active warnings or reminders found.
                  </div>
                ) : (
                  reminders.map((rem) => (
                    <div key={rem.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold ${
                            rem.type === 'Overdue Payment' ? 'bg-cyber-danger/10 text-cyber-danger' : 'bg-primary/10 text-primary'
                          }`}>
                            {rem.type.toUpperCase()}
                          </span>
                          <p className="font-semibold text-text-heading leading-tight">{rem.title}</p>
                        </div>
                        <span className="text-[9px] text-text-muted font-mono block mt-0.5">Due: {new Date(rem.dueDate).toLocaleDateString()}</span>
                      </div>
                      <span className="font-bold text-text-heading font-mono">{formatCurrency(rem.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex flex-col h-full space-y-4">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Secure Audit Log"}</span>
              <div className="bg-bg-primary rounded-lg border border-border-normal p-4 font-mono text-[9px] flex-1 space-y-3 overflow-y-auto max-h-56">
                {recentLogs.map((log) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="flex justify-between text-[8px] text-text-muted border-b border-border-normal/20">
                      <span>{log.user} ({log.role})</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-text-body font-mono">
                      <span className={log.action === 'Deleted' ? 'text-cyber-danger' : 'text-primary'}>
                        {`> [${log.action}] `}
                      </span>
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* -------------------- 2. FOUNDER / CO-FOUNDER EXECUTIVE DASHBOARD -------------------- */}
      {role === 'Founder' && (
        <div className="space-y-6">

          {/* FOUNDER KPI STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-text-muted font-mono tracking-wider">NET BALANCE</span>
                <h3 className={`text-xl font-bold font-display mt-1 ${kpi.netBalance >= 0 ? 'text-cyber-success' : 'text-cyber-danger'}`}>
                  {formatCurrency(kpi.netBalance)}
                </h3>
                <span className="text-[9px] font-mono text-text-muted">Treasury Overview</span>
              </div>
              <span className="p-1.5 bg-primary/10 text-primary rounded-lg"><Scale className="w-4 h-4" /></span>
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-text-muted font-mono tracking-wider">TOTAL INCOME</span>
                <h3 className="text-xl font-bold font-display mt-1 text-cyber-success">{formatCurrency(kpi.totalIncome)}</h3>
                <span className="text-[9px] font-mono text-text-muted">All-time received</span>
              </div>
              <span className="p-1.5 bg-cyber-success/10 text-cyber-success rounded-lg"><TrendingUp className="w-4 h-4" /></span>
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-text-muted font-mono tracking-wider">TOTAL EXPENSES</span>
                <h3 className="text-xl font-bold font-display mt-1 text-cyber-danger">{formatCurrency(kpi.totalExpenses)}</h3>
                <span className="text-[9px] font-mono text-text-muted">All-time spent</span>
              </div>
              <span className="p-1.5 bg-cyber-danger/10 text-cyber-danger rounded-lg"><TrendingDown className="w-4 h-4" /></span>
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 hover:border-primary transition-all duration-200 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-text-muted font-mono tracking-wider">PENDING APPROVALS</span>
                <h3 className="text-xl font-bold font-display mt-1 text-amber-400">{kpi.pendingCount}</h3>
                <span className="text-[9px] font-mono text-text-muted">Awaiting action</span>
              </div>
              <span className="p-1.5 bg-amber-400/10 text-amber-400 rounded-lg"><Clock className="w-4 h-4" /></span>
            </div>
          </div>

          {/* OPERATIONS KPI ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex items-center gap-4">
              <span className="p-2 bg-primary/10 rounded-lg text-primary"><Users className="w-5 h-5" /></span>
              <div>
                <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Members</span>
                <h4 className="text-lg font-bold text-text-heading font-display">{kpi.memberCount}</h4>
              </div>
            </div>
            <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex items-center gap-4">
              <span className="p-2 bg-cyber-info/10 rounded-lg text-cyber-info"><Calendar className="w-5 h-5" /></span>
              <div>
                <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Events</span>
                <h4 className="text-lg font-bold text-text-heading font-display">{kpi.eventCount}</h4>
              </div>
            </div>
            <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex items-center gap-4">
              <span className="p-2 bg-cyber-success/10 rounded-lg text-cyber-success"><CheckSquare className="w-5 h-5" /></span>
              <div>
                <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Tasks</span>
                <h4 className="text-lg font-bold text-text-heading font-display">{kpi.taskCount}</h4>
              </div>
            </div>
            <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex items-center gap-4">
              <span className="p-2 bg-amber-400/10 rounded-lg text-amber-400"><Wrench className="w-5 h-5" /></span>
              <div>
                <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Assets</span>
                <h4 className="text-lg font-bold text-text-heading font-display">{kpi.assetCount}</h4>
              </div>
            </div>
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Cash Flow */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{'// Monthly Cash Flow'}</span>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={charts.monthlyCashFlow}>
                  <defs>
                    <linearGradient id="founderCfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD54A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FFD54A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="cashflow" stroke="#FFD54A" fill="url(#founderCfGrad)" strokeWidth={2} dot={{ r: 3, fill: '#FFD54A' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Income vs Expense bar chart */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{'// Income vs Expense (Monthly)'}</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.incomeVsExpense} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                  <Bar dataKey="income" fill="#35D07F" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#FF5C5C" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BOTTOM ROW: Expense Breakdown + Pending Reminders + Activity Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Expense Distribution Pie */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-3">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{'// Expense Breakdown'}</span>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={charts.expenseDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={68} innerRadius={36}>
                    {charts.expenseDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Upcoming Payment Reminders */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-3">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{'// Upcoming Payments'}</span>
              <div className="space-y-2.5 overflow-y-auto max-h-52">
                {reminders.length === 0 ? (
                  <p className="text-text-muted font-mono text-[11px]">// No pending payment reminders.</p>
                ) : (
                  reminders.slice(0, 6).map((r) => (
                    <div key={r.id} className="flex justify-between items-center p-2.5 bg-bg-primary rounded-lg border border-border-normal/40">
                      <div>
                        <p className="text-[11px] font-semibold text-text-heading truncate max-w-[130px]">{r.title}</p>
                        <span className="text-[9px] text-text-muted font-mono">{new Date(r.dueDate).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${r.type === 'Income' ? 'bg-cyber-success/10 text-cyber-success' : 'bg-cyber-danger/10 text-cyber-danger'}`}>
                        {formatCurrency(r.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Secure Audit Trail */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-3">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{'// Activity Audit Trail'}</span>
              <div className="bg-bg-primary rounded-lg border border-border-normal p-3 font-mono text-[9px] space-y-2.5 overflow-y-auto max-h-52">
                {recentLogs.map((log) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="flex justify-between text-[8px] text-text-muted border-b border-border-normal/20 pb-0.5">
                      <span>{log.user} ({log.role})</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-text-body font-mono">
                      <span className={log.action === 'Deleted' ? 'text-cyber-danger' : 'text-primary'}>
                        {`> [${log.action}] `}
                      </span>
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COMPLETED TRANSACTIONS HEALTH ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Completed Transactions</span>
                <h4 className="text-2xl font-bold text-cyber-success font-display mt-1">{kpi.completedCount}</h4>
              </div>
              <span className="p-2 bg-cyber-success/10 rounded-lg text-cyber-success"><CheckCircle className="w-6 h-6" /></span>
            </div>
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Monthly Income</span>
                <h4 className="text-2xl font-bold text-primary font-display mt-1">{formatCurrency(kpi.monthlyIncome)}</h4>
              </div>
              <span className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp className="w-6 h-6" /></span>
            </div>
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Monthly Expenses</span>
                <h4 className="text-2xl font-bold text-cyber-danger font-display mt-1">{formatCurrency(kpi.monthlyExpenses)}</h4>
              </div>
              <span className="p-2 bg-cyber-danger/10 rounded-lg text-cyber-danger"><TrendingDown className="w-6 h-6" /></span>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 3. MEMBER PORTAL DASHBOARD -------------------- */}
      {role === 'Committee Member' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Tasks Assigned to Me</span>
                <h3 className="text-2xl font-bold text-text-heading font-display mt-1">{myTasks.length}</h3>
              </div>
              <CheckSquare className="w-8 h-8 text-primary/30" />
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Checked-out Devices</span>
                <h3 className="text-2xl font-bold text-text-heading font-display mt-1">{myAssets.length}</h3>
              </div>
              <Wrench className="w-8 h-8 text-primary/30" />
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Registered Events</span>
                <h3 className="text-2xl font-bold text-text-heading font-display mt-1">{myEvents.length}</h3>
              </div>
              <Calendar className="w-8 h-8 text-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* My Active Tasks List */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// My Assigned Active Tasks"}</span>
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 text-xs">
                {myTasks.length === 0 ? (
                  <p className="text-text-muted font-mono text-[11px]">// No active tasks assigned to your profile.</p>
                ) : (
                  myTasks.map((t) => (
                    <div key={t.id} className="p-3 bg-bg-primary rounded-lg border border-border-normal/40 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-text-heading leading-tight">{t.title}</h4>
                        <span className="text-[9px] text-text-muted font-mono block mt-0.5">Status: {t.status}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${
                        t.priority === 'High' || t.priority === 'Urgent'
                          ? 'bg-cyber-danger/10 border-cyber-danger/20 text-cyber-danger'
                          : 'bg-primary/10 border-primary/20 text-primary'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Checked-out Assets */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Equipment & Assets Issued to Me"}</span>
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 text-xs">
                {myAssets.length === 0 ? (
                  <p className="text-text-muted font-mono text-[11px]">// No active equipment issued to you.</p>
                ) : (
                  myAssets.map((a) => (
                    <div key={a.id} className="p-3 bg-bg-primary rounded-lg border border-border-normal/40 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-text-heading leading-tight">{a.name}</h4>
                        <span className="text-[9px] text-text-muted font-mono block mt-0.5">{a.assetId} - {a.location}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-mono font-bold">
                        {a.condition.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Registered Events */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4 lg:col-span-2">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// My Registered Upcoming Events"}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1 text-xs">
                {myEvents.length === 0 ? (
                  <p className="text-text-muted font-mono text-[11px] lg:col-span-2">// You haven&apos;t registered for any events yet.</p>
                ) : (
                  myEvents.map((evt) => (
                    <div key={evt.id} className="p-4 bg-bg-primary rounded-xl border border-border-normal/50 flex flex-col justify-between h-24">
                      <div>
                        <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-[8px] font-mono rounded text-primary font-bold">
                          {evt.event.category.toUpperCase()}
                        </span>
                        <h4 className="font-bold text-text-heading mt-1 leading-snug truncate">{evt.event.title}</h4>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-text-muted">
                        <span>{evt.event.venue}</span>
                        <span>{new Date(evt.event.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- 3. READ ONLY / GUEST DASHBOARD -------------------- */}
      {role === 'Read Only' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Community Members</span>
                <h3 className="text-2xl font-bold text-text-heading font-display mt-1">{kpi.memberCount}</h3>
              </div>
              <Users className="w-7 h-7 text-primary/30" />
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Active Events</span>
                <h3 className="text-2xl font-bold text-text-heading font-display mt-1">{kpi.eventCount}</h3>
              </div>
              <Calendar className="w-7 h-7 text-primary/30" />
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Hardware Inventory</span>
                <h3 className="text-2xl font-bold text-text-heading font-display mt-1">{kpi.assetCount}</h3>
              </div>
              <Wrench className="w-7 h-7 text-primary/30" />
            </div>

            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-text-muted font-mono font-bold uppercase">Public Task Board</span>
                <h3 className="text-2xl font-bold text-text-heading font-display mt-1">{kpi.taskCount}</h3>
              </div>
              <ClipboardList className="w-7 h-7 text-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            
            {/* Quick Links Section */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// Knowledge Base & Documentation"}</span>
              <div className="space-y-3 font-sans text-xs">
                <div className="p-3 bg-bg-primary rounded-lg border border-border-normal/40 flex justify-between items-center hover:border-primary transition-colors cursor-pointer">
                  <div>
                    <h4 className="font-semibold text-text-heading">Community Brand Assets</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Download official logos, fonts and media guidelines.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>

                <div className="p-3 bg-bg-primary rounded-lg border border-border-normal/40 flex justify-between items-center hover:border-primary transition-colors cursor-pointer">
                  <div>
                    <h4 className="font-semibold text-text-heading">Sponsorship Pitch Decks</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Latest outreach documents approved by Finance Head.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>

                <div className="p-3 bg-bg-primary rounded-lg border border-border-normal/40 flex justify-between items-center hover:border-primary transition-colors cursor-pointer">
                  <div>
                    <h4 className="font-semibold text-text-heading">Hardware Borrowing Manual</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Standard guidelines for borrowing tripods and projectors.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            </div>

            {/* Audit Log for public visibility */}
            <div className="bg-bg-surface border border-border-normal rounded-xl p-5 space-y-4">
              <span className="text-xs font-semibold text-text-heading font-display tracking-wider">{"// System Activity Logs"}</span>
              <div className="bg-bg-primary rounded-lg border border-border-normal p-4 font-mono text-[9px] space-y-3 overflow-y-auto max-h-56">
                {recentLogs.map((log) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="flex justify-between text-[8px] text-text-muted border-b border-border-normal/20">
                      <span>{log.user} ({log.role})</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-text-body font-mono">
                      <span className={log.action === 'Deleted' ? 'text-cyber-danger' : 'text-primary'}>
                        {`> [${log.action}] `}
                      </span>
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
