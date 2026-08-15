import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allMeetings = await prisma.meetingNote.findMany({
      orderBy: { date: 'asc' },
    });

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // ── Basic Counts ──────────────────────────────────────────
    const totalMeetings = allMeetings.length;
    const fathomMeetings = allMeetings.filter(m => m.createdBy.toLowerCase().includes('fathom')).length;
    const manualMeetings = totalMeetings - fathomMeetings;
    const publicMeetings = allMeetings.filter(m => m.isPublic).length;

    // ── Monthly Trend (last 6 months) ─────────────────────────
    const monthlyMap: Record<string, { month: string; total: number; fathom: number; manual: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      monthlyMap[key] = { month: label, total: 0, fathom: 0, manual: 0 };
    }

    for (const m of allMeetings) {
      const d = new Date(m.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].total++;
        if (m.createdBy.toLowerCase().includes('fathom')) {
          monthlyMap[key].fathom++;
        } else {
          monthlyMap[key].manual++;
        }
      }
    }
    const monthlyTrend = Object.values(monthlyMap);

    // ── Action Items Parsing (from markdown notes) ────────────
    let actionItemsTotal = 0;
    let actionItemsCompleted = 0;
    let actionItemsPending = 0;

    for (const m of allMeetings) {
      const lines = m.notes.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
          actionItemsTotal++;
          actionItemsCompleted++;
        } else if (trimmed.startsWith('- [ ]')) {
          actionItemsTotal++;
          actionItemsPending++;
        }
      }
    }

    const actionItemsCompletionRate = actionItemsTotal > 0
      ? Math.round((actionItemsCompleted / actionItemsTotal) * 100)
      : 0;

    // ── Top Creators ──────────────────────────────────────────
    const creatorMap: Record<string, number> = {};
    for (const m of allMeetings) {
      const name = m.createdBy;
      creatorMap[name] = (creatorMap[name] || 0) + 1;
    }
    const topCreators = Object.entries(creatorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── This Month Stats ──────────────────────────────────────
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthMeetings = allMeetings.filter(m => new Date(m.date) >= thisMonthStart).length;
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthMeetings = allMeetings.filter(m => {
      const d = new Date(m.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    }).length;

    const meetingGrowth = lastMonthMeetings > 0
      ? Math.round(((thisMonthMeetings - lastMonthMeetings) / lastMonthMeetings) * 100)
      : thisMonthMeetings > 0 ? 100 : 0;

    // ── Avg per week (last 4 weeks) ───────────────────────────
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const recentMeetings = allMeetings.filter(m => new Date(m.date) >= fourWeeksAgo);
    const avgPerWeek = Math.round(recentMeetings.length / 4 * 10) / 10;

    return NextResponse.json({
      totalMeetings,
      fathomMeetings,
      manualMeetings,
      publicMeetings,
      thisMonthMeetings,
      lastMonthMeetings,
      meetingGrowth,
      avgPerWeek,
      actionItemsTotal,
      actionItemsCompleted,
      actionItemsPending,
      actionItemsCompletionRate,
      monthlyTrend,
      topCreators,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
