import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const data = await request.json();
    const { text } = data;

    if (!text) {
      return NextResponse.json({ error: 'Comment text is required.' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        author: session.username,
        text,
      },
    });

    await prisma.taskActivity.create({
      data: {
        taskId: id,
        user: session.username,
        change: `Added a comment: "${text.length > 30 ? text.substring(0, 30) + '...' : text}"`,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/tasks/[id]/comments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
