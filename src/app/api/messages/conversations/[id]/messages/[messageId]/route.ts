import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// PATCH: Edit message text (sender only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, messageId } = await params;
    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message || message.conversationId !== id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    const isSender = message.senderId === session.userId;
    const isAdmin = session.role === 'Super Admin';
    if (!isSender && !isAdmin) {
      return NextResponse.json({ error: 'Only the sender can edit this message' }, { status: 403 });
    }
    if (message.isDeleted) {
      return NextResponse.json({ error: 'Cannot edit a deleted message' }, { status: 400 });
    }

    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
    });

    // Also update conversation lastMessage preview if this was the latest message
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (conversation) {
      const latestMsg = await prisma.message.findFirst({
        where: { conversationId: id },
        orderBy: { createdAt: 'desc' },
      });
      if (latestMsg && latestMsg.id === messageId) {
        await prisma.conversation.update({
          where: { id },
          data: { lastMessage: content.trim().slice(0, 60) },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


// DELETE: Delete message ("me" or "everyone")
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, messageId } = await params;
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'me'; // 'me' | 'everyone'

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.conversationId !== id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (mode === 'everyone') {
      const isSender = message.senderId === session.userId;
      const isAdmin = session.role === 'Super Admin';
      if (!isSender && !isAdmin) {
        return NextResponse.json({ error: 'Only sender or admin can delete for everyone' }, { status: 403 });
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: 'This message was deleted',
        },
      });
      return NextResponse.json(updated);
    } else {
      // Delete for me: add userId to deletedFor array
      const currentDeletedFor = message.deletedFor || [];
      if (!currentDeletedFor.includes(session.userId)) {
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: {
            deletedFor: { push: session.userId },
          },
        });
        return NextResponse.json(updated);
      }
      return NextResponse.json(message);
    }
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
