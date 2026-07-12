import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      orderBy: { name: 'asc' },
    });

    // Enriched data: calculate actual transaction history details
    const enriched = await Promise.all(
      people.map(async (person) => {
        const txs = await prisma.transaction.findMany({
          where: { party: person.name },
          select: { amount: true, type: true, status: true },
        });

        // Compute actual numbers from transactions
        const totalReceived = txs
          .filter((t) => t.status === 'Completed' && (t.type === 'Income' || t.type === 'Refund'))
          .reduce((acc, t) => acc + t.amount, 0);

        const totalPaid = txs
          .filter((t) => t.status === 'Completed' && t.type === 'Expense')
          .reduce((acc, t) => acc + t.amount, 0);

        return {
          ...person,
          totalReceived,
          totalPaid,
          transactionCount: txs.length,
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, phone, email, role, user, userRole } = data;

    const person = await prisma.person.create({
      data: {
        name,
        phone,
        email,
        role,
        totalReceived: 0,
        totalPaid: 0,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: user || 'System',
        role: userRole || 'Founder',
        details: `Added person profile: ${name} (${role})`,
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
