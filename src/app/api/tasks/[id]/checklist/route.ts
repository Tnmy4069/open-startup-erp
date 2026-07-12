import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// POST /api/tasks/[id]/checklist — Add a checklist item
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
    const { title } = data;

    if (!title) {
      return NextResponse.json({ error: 'Item title is required.' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId: id,
        title,
        isCompleted: false,
      },
    });

    await prisma.taskActivity.create({
      data: {
        taskId: id,
        user: session.username,
        change: `Added checklist item: "${title}"`,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/tasks/[id]/checklist error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/tasks/[id]/checklist — Update a checklist item's status (toggle completed)
export async function PUT(
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
    const { itemId, isCompleted } = data;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required.' }, { status: 400 });
    }

    const item = await prisma.taskChecklistItem.findUnique({ where: { id: itemId } });
    if (!item || item.taskId !== id) {
      return NextResponse.json({ error: 'Checklist item not found.' }, { status: 404 });
    }

    const updated = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: isCompleted !== undefined ? !!isCompleted : !item.isCompleted,
      },
    });

    await prisma.taskActivity.create({
      data: {
        taskId: id,
        user: session.username,
        change: `${updated.isCompleted ? 'Completed' : 'Uncompleted'} checklist item: "${item.title}"`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/tasks/[id]/checklist error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
