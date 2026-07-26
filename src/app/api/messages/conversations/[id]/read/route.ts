import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// POST: Mark all messages in conversation as read by the current user
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify membership
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation || !conversation.memberIds.includes(session.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find all unread messages not yet read by this user
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: id,
        NOT: { readBy: { has: session.userId } },
      },
      select: { id: true, readBy: true },
    });

    // Update each message to add userId to readBy
    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map((msg) =>
          prisma.message.update({
            where: { id: msg.id },
            data: { readBy: { push: session.userId } },
          })
        )
      );
    }

    return NextResponse.json({ markedRead: unreadMessages.length });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
