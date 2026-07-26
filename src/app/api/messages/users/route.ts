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
    const [dbUsers, dbMembers] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, username: true, role: true },
        orderBy: { username: 'asc' },
      }),
      prisma.member.findMany({
        where: { status: 'Active' },
        select: { id: true, userId: true, name: true, role: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const userMap = new Map<string, { id: string; username: string; role: string }>();

    // Include Super Admin account
    userMap.set('superadmin', { id: 'superadmin', username: 'Super Admin', role: 'Super Admin' });

    // Include User table accounts
    for (const u of dbUsers) {
      userMap.set(u.id, { id: u.id, username: u.username, role: u.role });
    }

    // Include Member table directory
    for (const m of dbMembers) {
      const key = m.userId || m.id;
      if (!userMap.has(key)) {
        userMap.set(key, { id: key, username: m.name, role: m.role });
      }
    }

    const list = Array.from(userMap.values());
    return NextResponse.json(list);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
