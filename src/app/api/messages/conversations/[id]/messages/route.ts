import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

// Initialize web-push details if keys available
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@cyberx.org.in',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch {
    // Ignore init errors
  }
}

// GET: Fetch messages for a conversation (paginated, newest first)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Filter out messages deleted for the current user in memory
    const visibleMessages = messages.filter(
      (m) => !m.deletedFor || !Array.isArray(m.deletedFor) || !m.deletedFor.includes(session.userId)
    );

    const hasMore = visibleMessages.length > limit;
    const items = hasMore ? visibleMessages.slice(0, limit) : visibleMessages;

    return NextResponse.json({
      messages: items.reverse(), // Return in chronological order
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    });

  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Send a new message
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const data = await request.json();
    const { type, content, fileName, fileSize, mimeType } = data;

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.userId,
        senderName: session.username,
        type: type || 'text',
        content,
        fileName: fileName || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        readBy: [session.userId],
        deletedFor: [],
      },
    });


    // Update conversation's lastMessage and lastAt
    const preview =
      type === 'file' ? `📎 ${fileName || 'File'}` :
      type === 'image' ? '🖼️ Image' :
      type === 'location' ? '📍 Location' :
      content.length > 60 ? content.slice(0, 60) + '...' : content;

    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessage: preview,
        lastAt: new Date(),
      },
    });

    // Create system notification entry
    try {
      await prisma.notification.create({
        data: {
          message: `💬 ${session.username}: ${preview}`,
          type: 'New Message',
          status: 'Unread',
        },
      });
    } catch {
      // Ignore notification creation failure
    }

    // Trigger Web Push Notifications to recipient subscriptions
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        const recipientIds = conversation.memberIds.filter((mid) => mid !== session.userId);
        const validObjectIds = recipientIds.filter((rid) => /^[0-9a-fA-F]{24}$/.test(rid));
        if (validObjectIds.length > 0) {
          const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: { in: validObjectIds } },
          });
          const payload = JSON.stringify({
            title: `💬 Message from ${session.username}`,
            body: preview,
            icon: '/cyberx-logo.png',
          });
          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              }, payload);
            } catch {
              // Silently ignore expired/unregistered subscriptions
            }
          }
        }
      } catch {
        // Silently ignore push errors
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
