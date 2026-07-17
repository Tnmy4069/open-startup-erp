import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: true,
        reporter: true,
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        checklist: true,
        activity: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('GET /api/tasks/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const original = await prisma.task.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const {
      title,
      description,
      priority,
      status,
      dueDate,
      assigneeIds,
      labels,
      isRecurring,
      recurringPattern,
    } = data;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : original.title,
        description: description !== undefined ? description : original.description,
        priority: priority !== undefined ? priority : original.priority,
        status: status !== undefined ? status : original.status,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : original.dueDate,
        assigneeIds: assigneeIds !== undefined ? assigneeIds : original.assigneeIds,
        labels: labels !== undefined ? labels : original.labels,
        isRecurring: isRecurring !== undefined ? !!isRecurring : original.isRecurring,
        recurringPattern: recurringPattern !== undefined ? recurringPattern : original.recurringPattern,
      },
    });

    // Detect changes for task activity logging
    const changes: string[] = [];
    if (status && status !== original.status) {
      changes.push(`status to ${status}`);
    }
    if (priority && priority !== original.priority) {
      changes.push(`priority to ${priority}`);
    }
    if (assigneeIds !== undefined && JSON.stringify(assigneeIds) !== JSON.stringify(original.assigneeIds)) {
      changes.push(`assignees updated`);
    }

    if (changes.length > 0) {
      await prisma.taskActivity.create({
        data: {
          taskId: id,
          user: session.username,
          change: `Changed ${changes.join(', ')}`,
        },
      });
    }

    // Trigger activity updates if completed
    if (status === 'Completed' && original.status !== 'Completed' && updated.assigneeIds?.length > 0) {
      const activities = updated.assigneeIds.map((id: string) => ({
        memberId: id,
        action: `Completed task: ${updated.title}`,
      }));
      await prisma.memberActivity.createMany({
        data: activities,
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/tasks/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user: session.username,
        role: session.role,
        details: `Deleted task: ${task.title}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error: any) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
