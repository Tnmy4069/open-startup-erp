import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET: Fetch conversation details
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({ where: { id } });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    if (!conversation.memberIds.includes(session.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch member details safely
    const validObjectIds = conversation.memberIds.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    const users = validObjectIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: validObjectIds } },
      select: { id: true, username: true, role: true },
    }) : [];

    if (conversation.memberIds.includes('superadmin')) {
      users.unshift({ id: 'superadmin', username: 'Super Admin', role: 'Super Admin' });
    }

    return NextResponse.json({ ...conversation, members: users });

  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update conversation (group name, avatar, add/remove members)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({ where: { id } });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    if (!conversation.memberIds.includes(session.userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const data = await request.json();
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    // Add members
    if (data.addMembers && Array.isArray(data.addMembers)) {
      const newMembers = [...new Set([...conversation.memberIds, ...data.addMembers])];
      updateData.memberIds = newMembers;
    }

    // Remove members
    if (data.removeMembers && Array.isArray(data.removeMembers)) {
      updateData.memberIds = conversation.memberIds.filter(
        (id) => !data.removeMembers.includes(id)
      );
    }

    // Leave group (remove self)
    if (data.leave) {
      updateData.memberIds = conversation.memberIds.filter((mid) => mid !== session.userId);
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete entire conversation
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({ where: { id } });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    if (conversation.createdBy !== session.userId && !conversation.adminIds.includes(session.userId)) {
      return NextResponse.json({ error: 'Only admins can delete conversations' }, { status: 403 });
    }

    await prisma.conversation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
