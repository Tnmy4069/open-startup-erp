import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const priority = searchParams.get('priority') || '';
    const status = searchParams.get('status') || '';
    const assigneeId = searchParams.get('assigneeId') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: true,
        reporter: true,
        checklist: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      assigneeId,
      labels,
      isRecurring,
      recurringPattern,
    } = data;

    if (!title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    // Try to find a member for reporter (matching session username or first Super Admin)
    let reporterId = null;
    const currentMember = await prisma.member.findFirst({
      where: { name: { contains: session.username, mode: 'insensitive' } },
    });
    if (currentMember) {
      reporterId = currentMember.id;
    } else {
      const firstMember = await prisma.member.findFirst();
      if (firstMember) reporterId = firstMember.id;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'Medium',
        status: status || 'Todo',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        reporterId,
        labels: labels || [],
        isRecurring: !!isRecurring,
        recurringPattern: recurringPattern || null,
      },
    });

    // Log Activity
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        user: session.username,
        change: `Task created by ${session.username}`,
      },
    });

    if (assigneeId) {
      await prisma.memberActivity.create({
        data: {
          memberId: assigneeId,
          action: `Assigned task: ${title}`,
        },
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
