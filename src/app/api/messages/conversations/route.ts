import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserMap(userIds: string[]) {
  const userMap: Record<string, string> = {
    superadmin: 'Super Admin',
  };

  const validObjectIds = userIds.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
  if (validObjectIds.length > 0) {
    const [users, members] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: validObjectIds } },
        select: { id: true, username: true },
      }),
      prisma.member.findMany({
        where: {
          OR: [
            { id: { in: validObjectIds } },
            { userId: { in: validObjectIds } },
          ],
        },
        select: { id: true, userId: true, name: true },
      }),
    ]);

    for (const u of users) {
      userMap[u.id] = u.username;
    }
    for (const m of members) {
      if (m.userId) userMap[m.userId] = m.name;
      userMap[m.id] = m.name;
    }
  }

  return userMap;
}


// GET: List all conversations for the current user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        memberIds: { has: session.userId },
      },
      orderBy: { lastAt: 'desc' },
    });

    const userIds = [...new Set(conversations.flatMap((c) => c.memberIds))];
    const userMap = await getUserMap(userIds);

    // Count unread messages per conversation
    const convosWithMeta = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            NOT: { readBy: { has: session.userId } },
            senderId: { not: session.userId },
          },
        });

        const memberNames = c.memberIds
          .filter((id) => id !== session.userId)
          .map((id) => userMap[id] || 'Unknown');

        return {
          ...c,
          memberNames,
          unreadCount,
        };
      })
    );

    return NextResponse.json(convosWithMeta);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new conversation (DM or Group)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, isGroup, memberIds, avatar } = data;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'At least one member is required.' }, { status: 400 });
    }

    // Ensure current user is always included
    const allMembers = [...new Set([session.userId, ...memberIds])];

    // For DMs, check if conversation already exists between these two users
    if (!isGroup && allMembers.length === 2) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          memberIds: { hasEvery: allMembers },
        },
      });
      if (existing) {
        const userMap = await getUserMap(existing.memberIds);
        const memberNames = existing.memberIds
          .filter((id) => id !== session.userId)
          .map((id) => userMap[id] || 'Unknown');

        return NextResponse.json({
          ...existing,
          memberNames,
          unreadCount: 0,
        });
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        name: isGroup ? (name || 'New Group') : null,
        isGroup: !!isGroup,
        avatar: avatar || null,
        memberIds: isGroup ? allMembers : allMembers.sort(),
        adminIds: [session.userId],
        createdBy: session.userId,
        lastAt: new Date(),
      },
    });

    // Populate memberNames and unreadCount for client
    const userMap = await getUserMap(conversation.memberIds);
    const memberNames = conversation.memberIds
      .filter((id) => id !== session.userId)
      .map((id) => userMap[id] || 'Unknown');

    return NextResponse.json({
      ...conversation,
      memberNames,
      unreadCount: 0,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
