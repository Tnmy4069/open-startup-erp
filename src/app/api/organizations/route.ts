import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { guardCreate } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
    });

    // Enriched data: calculate total transaction counts and actual amounts
    const enriched = await Promise.all(
      organizations.map(async (org) => {
        const txs = await prisma.transaction.findMany({
          where: { party: org.name },
          select: { amount: true, type: true, status: true },
        });

        const completedCount = txs.filter((t) => t.status === 'Completed').length;
        const totalVolume = txs.filter((t) => t.status === 'Completed').reduce((acc, t) => acc + t.amount, 0);
        const outstandingPayments = txs
          .filter((t) => t.status === 'Pending')
          .reduce((acc, t) => acc + (t.type === 'Income' ? -t.amount : t.amount), 0);

        return {
          ...org,
          transactionCount: txs.length,
          completedCount,
          totalVolume,
          outstandingPayments,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await guardCreate();
  if (denied) return denied;

  try {
    const data = await request.json();
    const { name, contactPerson, phone, email, address, user, role } = data;

    const org = await prisma.organization.create({
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
        outstandingPayments: 0,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: user || 'System',
        role: role || 'Founder',
        details: `Created organization: ${name}`,
      },
    });

    return NextResponse.json(org);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
