import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { guardUsers } from '@/lib/permissions';

// GET /api/users — list all DB users with subscription status (Super Admin only)
export async function GET() {
  const forbidden = await guardUsers();
  if (forbidden) return forbidden;

  try {
    const [users, subscriptions] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, username: true, role: true, isActive: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pushSubscription.findMany({
        select: { userId: true },
      }),
    ]);

    // Build a set of userIds that have push subscriptions
    const subscribedUserIds = new Set(
      subscriptions
        .filter((s) => s.userId != null)
        .map((s) => s.userId as string)
    );

    const enriched = users.map((u) => ({
      ...u,
      hasSubscription: subscribedUserIds.has(u.id),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

// POST /api/users — create a new user (Super Admin only)
export async function POST(request: Request) {
  const forbidden = await guardUsers();
  if (forbidden) return forbidden;

  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'username, password, and role are required.' }, { status: 400 });
    }

    const validRoles = ['Super Admin', 'Co-Founder', 'Founder', 'Committee Member', 'Read Only'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
    }
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
