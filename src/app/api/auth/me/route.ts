import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let memberRegistered = false;

  if (session.role === 'Super Admin') {
    memberRegistered = true;
  } else {
    // Check if member profile exists
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { userId: session.userId },
          { email: { equals: session.username, mode: 'insensitive' } },
          { name: { equals: session.username, mode: 'insensitive' } }
        ]
      }
    });

    if (member) {
      memberRegistered = true;
      // Auto-link profile if userId is not yet set
      if (!member.userId && session.userId !== 'superadmin') {
        try {
          await prisma.member.update({
            where: { id: member.id },
            data: { userId: session.userId }
          });
        } catch (err) {
          console.error('Failed to auto-link member profile:', err);
        }
      }
    }
  }

  return NextResponse.json({
    userId: session.userId,
    username: session.username,
    role: session.role,
    memberRegistered,
  });
}
