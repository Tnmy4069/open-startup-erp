import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    const transactions = await prisma.transaction.findMany();
    
    // Generate reminders dynamically from actual pending transactions in the DB
    // to ensure no stale dummy data is shown and all lists match active entries.
    const pendingTransactions = transactions.filter(tx => tx.status === 'Pending');
    const reminders = pendingTransactions.map((tx) => {
      const isIncome = tx.type === 'Income' || tx.type === 'Refund';
      return {
        id: tx.id,
        title: `Approve: ${tx.type} to/from ${tx.party} (${tx.purpose})`,
        dueDate: tx.date,
        amount: tx.amount,
        type: isIncome ? 'Pending Payment' : 'Pending Reimbursement',
        status: 'Active',
      };
    });
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    const memberCount = await prisma.member.count();
    const assetCount = await prisma.asset.count();
    const eventCount = await prisma.event.count();
    const taskCount = await prisma.task.count();

    let myTasks: any[] = [];
    let myAssets: any[] = [];
    let myEvents: any[] = [];

    if (session) {
      const member = await prisma.member.findUnique({
        where: { email: session.username },
      });
      if (member) {
        myTasks = await prisma.task.findMany({
          where: { assigneeIds: { has: member.id } },
          include: { assignees: true }
        });
        myAssets = await prisma.asset.findMany({
          where: { holderId: member.id }
        });
        myEvents = await prisma.eventRegistration.findMany({
          where: { memberId: member.id },
          include: { event: true }
        });
      }
    }

    // 1. KPI Calculations (completed/pending, income/expenses)
    let totalIncome = 0;
    let totalExpenses = 0;
    let pendingIncome = 0;
    let pendingExpenses = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach((tx) => {
      const isCompleted = tx.status === 'Completed';
      const isPending = tx.status === 'Pending';
      const txDate = new Date(tx.date);
      const isThisMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

      if (tx.type === 'Income') {
        if (isCompleted) {
          totalIncome += tx.amount;
          if (isThisMonth) monthlyIncome += tx.amount;
        } else if (isPending) {
          pendingIncome += tx.amount;
        }
      } else if (tx.type === 'Expense') {
        if (isCompleted) {
          totalExpenses += tx.amount;
          if (isThisMonth) monthlyExpenses += tx.amount;
        } else if (isPending) {
          pendingExpenses += tx.amount;
        }
      } else if (tx.type === 'Refund') {
        if (isCompleted) {
          // Refunds reduce expenses (or represents incoming refunded cash)
          totalIncome += tx.amount;
          if (isThisMonth) monthlyIncome += tx.amount;
        }
      }

      if (isCompleted) completedCount++;
      if (isPending) pendingCount++;
    });

    const netBalance = totalIncome - totalExpenses;

    // 2. Monthly Charts Data (Aggregate past 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAggregateMap: { [key: string]: { month: string; income: number; expense: number } } = {};
    
    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const mName = months[d.getMonth()];
      const yearSuffix = d.getFullYear().toString().substring(2);
      const key = `${mName} '${yearSuffix}`;
      monthlyAggregateMap[key] = { month: key, income: 0, expense: 0 };
    }

    transactions.forEach((tx) => {
      if (tx.status !== 'Completed') return;
      const txDate = new Date(tx.date);
      const mName = months[txDate.getMonth()];
      const yearSuffix = txDate.getFullYear().toString().substring(2);
      const key = `${mName} '${yearSuffix}`;

      if (monthlyAggregateMap[key]) {
        if (tx.type === 'Income' || tx.type === 'Refund') {
          monthlyAggregateMap[key].income += tx.amount;
        } else if (tx.type === 'Expense') {
          monthlyAggregateMap[key].expense += tx.amount;
        }
      }
    });

    const incomeVsExpense = Object.values(monthlyAggregateMap);
    const monthlyCashFlow = incomeVsExpense.map((item) => ({
      month: item.month,
      cashflow: item.income - item.expense,
    }));

    // 3. Category distribution (Expenses)
    const expenseCategoriesMap: { [key: string]: number } = {};
    const incomeCategoriesMap: { [key: string]: number } = {};

    transactions.forEach((tx) => {
      if (tx.status !== 'Completed') return;
      if (tx.type === 'Expense') {
        expenseCategoriesMap[tx.purpose] = (expenseCategoriesMap[tx.purpose] || 0) + tx.amount;
      } else if (tx.type === 'Income') {
        incomeCategoriesMap[tx.purpose] = (incomeCategoriesMap[tx.purpose] || 0) + tx.amount;
      }
    });

    const expenseDistribution = Object.entries(expenseCategoriesMap).map(([name, value]) => ({
      name,
      value,
    }));

    const incomeSources = Object.entries(incomeCategoriesMap).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      kpi: {
        totalIncome,
        totalExpenses,
        netBalance,
        pendingIncome,
        pendingExpenses,
        completedCount,
        pendingCount,
        monthlyIncome,
        monthlyExpenses,
        memberCount,
        assetCount,
        eventCount,
        taskCount,
      },
      charts: {
        incomeVsExpense,
        monthlyCashFlow,
        expenseDistribution,
        incomeSources,
      },
      reminders,
      recentLogs: logs,
      myTasks,
      myAssets,
      myEvents,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
